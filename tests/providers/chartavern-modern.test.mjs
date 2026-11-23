import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseCtPageData,getCtPageSearch,getCtPageTags,getCtPageCharacter} from '../../modules/providers/chartavern/chartavern-modern.js';
import {parseCharacterTavernJson} from '../../modules/providers/chartavern/chartavern-response.js';

const searchPool=[{searchResults:1},{hits:2,totalHits:9,totalPages:10,hitsPerPage:9,page:10},[3],{id:4,name:5,path:6,permanentTokens:7,contentWarnings:8},'CT_fixture','Fixture','author/fixture',500,[],1,1];
const tagsPool=[{tagCatalogue:1},['Promise',2],7];
const stream=[{type:'data',nodes:[{type:'data',data:searchPool},{type:'data',data:tagsPool}]},{type:'chunk',id:7,data:[{tags:1,unavailable:6},[2],{value:3,count:4},'fantasy',123,null,false]}];
const pageResponse=()=>new Response(stream.map(JSON.stringify).join('\n'),{headers:{'Content-Type':'text/sveltekit-data'}});
const apiSource=await readFile(new URL('../../modules/providers/chartavern/chartavern-api.js',import.meta.url),'utf8');
const netSource=await readFile(new URL('../../modules/providers/provider-utils.js',import.meta.url),'utf8');
const strip=s=>s.replace(/^import[\s\S]*?;\r?\n/gm,'').replace(/^export \{[^}]*\}(?: from [^;]+)?;\r?\n/gm,'').replace(/^export /gm,'');
async function api(settings={}) {
    const net=vm.createContext({URL,console,fetch:(...args)=>globalThis.fetch(...args)});vm.runInContext(strip(netSource),net);
    const ctx=vm.createContext({URL,URLSearchParams,console,CL_HELPER_CT_BASE:'/plugins/cl-helper',fetchWithProxy:net.fetchWithProxy,readJsonClassified:net.readJsonClassified,parseCharacterTavernJson,parseCtPageData,getCtPageSearch,getCtPageTags,getCtPageCharacter});
    vm.runInContext(strip(apiSource),ctx);ctx.initChartavernApi({getSetting:k=>settings[k]});return ctx;
}
test('CharacterTavern safely decodes streamed catalogue and tag pools',async()=>{
    const nodes=await parseCtPageData(pageResponse());
    assert.equal(getCtPageSearch(nodes).hits[0].totalTokens,500);
    assert.deepEqual(getCtPageTags(nodes),[{tag:'fantasy',count:123}]);
});
test('CharacterTavern rejects missing catalogue data and unavailable tag streams',async()=>{
    assert.throws(()=>getCtPageSearch([{}]),/invalid catalogue/);
    assert.throws(()=>getCtPageTags([{tagCatalogue:{tags:[],unavailable:true}}]),/unavailable/);
    assert.throws(()=>getCtPageCharacter([{character:null}]),/invalid character/);
    await assert.rejects(parseCtPageData(new Response('<html>Maintenance</html>')));
});
test('CharacterTavern decoder rejects prototype pollution in upstream page data',async()=>{
    const text='{"type":"data","nodes":[{"type":"data","data":[{"__proto__":1},{"polluted":2},true]}]}';
    await assert.rejects(parseCtPageData(new Response(text)),/__proto__/);
    assert.equal({}.polluted,undefined);
});
test('CharacterTavern search uses the new helper route with existing filters and sort aliases',async()=>{
    const mod=await api(),paths=[];
    const request=async path=>{paths.push(path);return path.endsWith('/health')?Response.json({ok:true}):pageResponse();};
    const result=await mod.searchCards({query:'fixture',sort:'most_popular',page:2,tags:'fantasy',excludeTags:'horror',minimumTokens:100,maximumTokens:1000,hasLorebook:true,isOC:true,nsfw:false},request);
    assert.equal(result.hits[0].path,'author/fixture');
    const url=new URL(paths[1],'http://localhost');
    assert.equal(url.pathname,'/plugins/cl-helper/ct-proxy/search/cards/__data.json');
    assert.equal(url.searchParams.get('sort'),'popular');assert.equal(url.searchParams.get('page'),'2');
    assert.equal(url.searchParams.get('tags'),'fantasy');assert.equal(url.searchParams.get('exclude_tags'),'horror,nsfw');
    assert.equal(url.searchParams.get('minimum_tokens'),'100');assert.equal(url.searchParams.get('maximum_tokens'),'1000');
    assert.equal(url.searchParams.get('hasLorebook'),'true');assert.equal(url.searchParams.get('isOC'),'true');
    assert.deepEqual(await mod.fetchTopTags(request),[{tag:'fantasy',count:123}]);assert.equal(paths.length,2);
});
test('CharacterTavern custom gateways retain the legacy API and receive their authentication header',async t=>{
    const mod=await api({chartavernGatewayBaseUrl:'https://gateway.example',chartavernGatewayKey:'fixture-key'});
    const calls=[];t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});return Response.json({hits:[],totalHits:0,totalPages:0});});
    await mod.searchCards({},()=>{throw new Error('Must not route the gateway through the CT helper');});
    assert.ok(calls[0].url.startsWith('https://gateway.example/v1/ct/search/cards?'));
    assert.equal(calls[0].options.headers.Authorization,'Bearer fixture-key');
});
test('CharacterTavern detail loads the current page and complete canonical card export',async()=>{
    const mod=await api(),paths=[];
    const exported={spec:'chara_card_v2',data:{name:'Fixture',description:'Definition',alternate_greetings:['Hello','Welcome'],character_book:{entries:[{content:'Canon'}]},extensions:{custom:{keep:true}}}};
    const request=async path=>{
        paths.push(path);if(path.endsWith('/health'))return Response.json({ok:true});
        if(path.endsWith('/download'))return Response.json(exported);
        return new Response(JSON.stringify({type:'data',nodes:[{type:'data',data:[{character:1,tags:7,authorUserId:8},{id:2,name:3,path:4,definition_character_description:5,definition_first_message:6},'CT_fixture','Fixture','author/fixture','Definition','Hello',[9],'author-id','fantasy']}]}));
    };
    const result=await mod.fetchCharacterDetail('author','fixture',request);
    assert.equal(paths[1],'/plugins/cl-helper/ct-proxy/character/author/fixture/__data.json');
    assert.equal(paths[2],'/plugins/cl-helper/ct-proxy/api/character/CT_fixture/download');
    assert.deepEqual(JSON.parse(JSON.stringify(result.card._exportCard)),exported);assert.deepEqual(result.card.tags,['fantasy']);
});
test('CharacterTavern unavailable details stay classified as not found',async()=>{
    const mod=await api();
    await assert.rejects(mod.fetchCharacterDetail('author','gone',async p=>p.endsWith('/health')?Response.json({ok:true}):Response.json({error:'Not found'},{status:404})),e=>e.notFound===true);
});
test('CharacterTavern detail builder preserves complete exports, greetings, lorebooks and unknown extensions',async()=>{
    const source=await readFile(new URL('../../modules/providers/chartavern/chartavern-provider.js',import.meta.url),'utf8');
    const body=source.slice(source.indexOf('function buildV2FromDetail('),source.indexOf('function buildV2FromSearchHit('));
    const ctx=vm.createContext({structuredClone,getCtCharName:c=>c.inChatName||c.name});vm.runInContext(body,ctx);
    const exported={spec:'chara_card_v2',data:{name:'Listing',description:'Definition',tags:['fantasy'],alternate_greetings:['Hello'],character_book:{entries:[{content:'Canon'}]},extensions:{custom:{keep:true}}}};
    const result=ctx.buildV2FromDetail({id:'fixture',path:'author/fixture',name:'Listing',inChatName:'In Chat',_exportCard:exported},'author');
    assert.equal(result.data.name,'In Chat');assert.deepEqual(result.data.character_book,exported.data.character_book);
    assert.deepEqual(result.data.alternate_greetings,['Hello']);assert.equal(result.data.extensions.custom.keep,true);
    assert.equal(exported.data.extensions.chartavern,undefined);
});

const helper=await readFile(new URL('../../extras/cl-helper/index.js',import.meta.url),'utf8');
function helperHarness(response) {
    const handlers=new Map();const ctx=vm.createContext({URL,console:{log(){},warn(){},error(){}},ctSessionCookies:'session=fixture',ctSessionExpires:null,captureCtExpiry(){},fetch:async()=>response});
    vm.runInContext(helper.slice(helper.indexOf('const CT_ALLOWED_PATHS ='),helper.indexOf('const DATACAT_ORIGIN')),ctx);
    ctx.registerCharacterTavernRoutes({get:(p,h)=>handlers.set(p,h),post(){}});
    return {ctx,handlers};
}
test('CT helper permits only the new public page reads and existing read-only APIs',()=>{
    const {ctx}=helperHarness();
    for(const path of ['/search/cards/__data.json','/character/author/fixture/__data.json','/api/character/CT_fixture/download'])assert.ok(vm.runInContext('CT_ALLOWED_PATHS.some(re=>re.test('+JSON.stringify(path)+'))',ctx));
    for(const path of ['/api/cards/update','/account/settings/__data.json','/admin/__data.json'])assert.equal(vm.runInContext('CT_ALLOWED_PATHS.some(re=>re.test('+JSON.stringify(path)+'))',ctx),false);
});
test('CT helper validates the new signed-in page layout without depending on removed search endpoints',async()=>{
    const response=new Response(JSON.stringify({type:'data',nodes:[{data:[{user:1},{id:2},'fixture-user']}]}));
    const {handlers}=helperHarness(response);let report;
    await handlers.get('/ct-validate')({}, {json:r=>report=r});assert.equal(report.valid,true);
});
test('CT helper preserves saved cookies when new session data is temporarily malformed',async()=>{
    const {ctx,handlers}=helperHarness(new Response('Temporary upstream problem'));let report;
    await handlers.get('/ct-validate')({}, {json:r=>report=r});assert.equal(report.transient,true);assert.equal(ctx.ctSessionCookies,'session=fixture');
});
