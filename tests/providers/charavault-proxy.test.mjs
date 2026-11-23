import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const root = new URL('../../modules/providers/', import.meta.url);
const strip = s => s.replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/^export (?:\{[\s\S]*?\}|\*) from .*;\r?\n/gm,'').replace(/^export /gm,'');
const source = await readFile(new URL('charavault/charavault-api.js',root),'utf8');
const netSource = await readFile(new URL('provider-utils.js',root),'utf8');
const quiet = {warn(){},error(){},info(){},log(){}};
async function harness(payload, status=200, settings={}) {
    const requests=[];
    const net=vm.createContext({URL,console:quiet,fetch:async(url,options)=>{
        requests.push({url,options});
        if(url.startsWith('https://'))throw new TypeError('Failed to fetch');
        return typeof payload === 'function' ? payload(url,options) : Response.json(payload,{status});
    }});
    vm.runInContext(strip(netSource),net);
    const ctx=vm.createContext({URL,URLSearchParams,console:quiet,fetchWithProxy:net.fetchWithProxy,proxyEncode:encodeURIComponent});
    vm.runInContext(strip(source),ctx);ctx.initCvApi({getSetting:k=>settings[k]});
    return {ctx,requests};
}
test('CharaVault browsing retries blocked cross-origin requests through the local ST proxy',async()=>{
    const {ctx,requests}=await harness({total:1,results:[{name:'Fixture'}]});
    const result=await ctx.fetchCvCards({q:'fixture',limit:1});assert.equal(result.total,1);
    assert.equal(requests.length,2);assert.ok(requests[0].url.startsWith('https://charavault.net/api/cards?'));
    assert.equal(decodeURIComponent(requests[1].url.slice('/proxy/'.length)),requests[0].url);
    assert.match(requests[1].url,/nsfw%3Dfalse/);
});
for(const [name,args,payload,valid] of [
    ['fetchCvCardDetail',['cards/a.png'],{entry:{name:'Fixture'},full_metadata:{data:{name:'Fixture'}}},r=>r.entry.name==='Fixture'],
    ['fetchCvRating',['cards/a.png'],{avg_rating:4},r=>r.avg_rating===4],
    ['fetchCvLinkedLorebooks',['cards/a.png'],{lorebooks:[]},r=>Array.isArray(r.lorebooks)],
    ['fetchCvSimilar',['/disk/a.png'],{similar:[{name:'Fixture'}]},r=>r.ok&&r.results.length===1],
    ['fetchCvTags',[],{tags:[['Fantasy',1]]},r=>r[0][0]==='Fantasy'],
])test(`CharaVault ${name} uses the same working proxy route`,async()=>{
    const {ctx,requests}=await harness(payload);assert.ok(valid(await ctx[name](...args)));assert.equal(requests.length,2);assert.ok(requests[1].url.startsWith('/proxy/'));
});
test('CharaVault gateway URL and authentication headers survive proxy fallback',async()=>{
    const {ctx,requests}=await harness({total:0,results:[]},200,{charavaultGatewayUrl:'https://gateway.example/cv/api',charavaultGatewayKey:'fixture-key',charavaultAppPassword:'fixture-password'});
    await ctx.fetchCvCards();assert.ok(requests[0].url.startsWith('https://gateway.example/cv/api/cards?'));
    assert.equal(requests[1].options.headers.Authorization,'Bearer fixture-key');assert.equal(requests[1].options.headers['X-App-Password'],'fixture-password');
});
test('CharaVault browse keeps upstream authentication errors visible after proxy fallback',async()=>{
    const {ctx}=await harness({error:'Authentication required'},401);await assert.rejects(ctx.fetchCvCards(),e=>e.status===401&&e.authFailed);
});
test('CharaVault binary card and thumbnail fallback both use the shared proxy transport',async()=>{
    const source=await readFile(new URL('charavault/charavault-provider.js',root),'utf8');
    const calls=[];let uploaded;
    const ctx=vm.createContext({console:quiet,ProviderBase:class{},CoreAPI:{},
        fetchCvCardDetail:async()=>({entry:{name:'Fixture'}}),buildCvCharacterCard:()=>({data:{name:'Fixture'}}),
        assignGalleryId(){},splitCvPath:()=>({folder:'cards',file:'a.png'}),cvDownloadUrl:()=> 'https://charavault.net/download',cvThumbUrl:()=> 'https://charavault.net/thumb',getCvHeaders:async()=>({'X-App-Password':'fixture'}),
        fetchWithProxy:async(url,opts)=>{calls.push({url,opts});if(calls.length===1)throw new Error('download unavailable');return new Response(new Uint8Array([1,2,3]));},
        cvMetadataCache:new Map(),slugify:s=>s,importFromPng:async options=>{uploaded=options;return {success:true}},markCvCardImported(){},
    });
    vm.runInContext(strip(source).replace('default charavaultProvider;','globalThis.provider=charavaultProvider;'),ctx);
    const result=await ctx.provider.importCharacter('cards/a.png');assert.equal(result.success,true);assert.equal(calls.length,2);assert.equal(calls[1].opts.headers['X-App-Password'],'fixture');assert.equal(uploaded.imageBuffer.byteLength,3);
});

test('CharaVault thumbnail URLs use the local proxy for same-site-only images',async()=>{const {ctx}=await harness({});const url=ctx.cvThumbUrl('cards','a b.png');assert.ok(url.startsWith('/proxy/'));assert.equal(decodeURIComponent(url.slice(7)),'https://charavault.net/cards/thumb/cards/a%20b.png');});

test('CharaVault exchanges email and app password once and sends the returned Bearer token',async()=>{
    const settings={charavaultEmail:'user@example.test',charavaultAppPassword:'cv_fixture',charavaultGatewayKey:'stale-gateway-key'};
    const {ctx,requests}=await harness(url=>Response.json(url.includes('auth%2Flogin')?{token:'session-fixture'}:url.endsWith('%2Ftags')?{tags:[]}:{total:0,results:[]}),200,settings);
    await Promise.all([ctx.fetchCvCards(),ctx.fetchCvTags()]);
    const login=requests.filter(r=>r.options.method==='POST'&&r.url.startsWith('/proxy/'));
    assert.equal(login.length,1);
    assert.deepEqual(JSON.parse(login[0].options.body),{email:'user@example.test',password:'cv_fixture'});
    for(const r of requests.filter(r=>r.options.method!=='POST')){
        assert.equal(r.options.headers.Authorization,'Bearer session-fixture');
        assert.equal(r.options.headers['X-App-Password'],undefined);
        assert.ok(!r.url.includes('session-fixture')&&!r.url.includes('cv_fixture'));
    }
    settings.charavaultAppPassword='cv_replaced';
    await ctx.getCvHeaders();
    assert.equal(requests.filter(r=>r.options.method==='POST'&&r.url.startsWith('/proxy/')).length,2);
});

test('CharaVault retains public browsing when the account email is missing',async()=>{
    const {ctx,requests}=await harness({total:0,results:[]},200,{charavaultAppPassword:'cv_fixture'});
    await ctx.fetchCvCards();
    assert.equal(requests.length,2);
    assert.equal(requests[1].options.headers['X-App-Password'],undefined);
    assert.equal(requests[1].options.headers.Authorization,undefined);
});

test('CharaVault failed login surfaces authentication failure and allows a corrected retry',async()=>{
    let fail=true;
    const {ctx,requests}=await harness(()=>fail?Response.json({detail:'Invalid credentials'},{status:401}):Response.json({token:'session-fixture'}),200,{charavaultEmail:'user@example.test',charavaultAppPassword:'cv_fixture'});
    await assert.rejects(ctx.getCvHeaders(),e=>e.status===401&&e.authFailed);
    fail=false;
    assert.equal((await ctx.getCvHeaders()).Authorization,'Bearer session-fixture');
    assert.equal(requests.filter(r=>r.options.method==='POST'&&r.url.startsWith('/proxy/')).length,2);
});

test('CharaVault refuses a login response without a session token',async()=>{
    const {ctx}=await harness({},200,{charavaultEmail:'user@example.test',charavaultAppPassword:'cv_fixture'});
    await assert.rejects(ctx.getCvHeaders(),/did not return a session token/);
});

test('CharaVault sends exact multi-tags, exclusions, zero token minimum and negative lorebook filters to the API',async()=>{
    const {ctx,requests}=await harness({total:0,results:[]});
    await ctx.fetchCvCards({tags:'"male","fantasy"',exclude_tags:'"female"',has_book:false,token_min:0,token_max:5000});
    const url=new URL(requests[0].url);
    assert.equal(url.searchParams.get('tags'),'"male","fantasy"');
    assert.equal(url.searchParams.get('exclude_tags'),'"female"');
    assert.equal(url.searchParams.get('has_book'),'false');
    assert.equal(url.searchParams.get('token_min'),'0');
    assert.equal(url.searchParams.get('token_max'),'5000');
});
