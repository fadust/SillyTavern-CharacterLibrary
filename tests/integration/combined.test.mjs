import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { convertCharacterBookToNative } from '../../modules/lorebook-conversion.js';
const lib = await readFile(new URL('../../app/library.js', import.meta.url), 'utf8');
const media = lib.slice(lib.indexOf('function isRepairChatActive('), lib.indexOf('async function rewriteEmbeddedMediaLinksInChats('));
function repair({active = false, changed = false, failFolder = false} = {}) {
    const original = [{chat_metadata:{}}, {mes:'![art](/user/images/Old/pic.png)',extra:{image:'/user/images/Old/pic.png?x=1'},swipe_info:[{extra:{media:[{url:'/user/images/Old/pic.png'}]}}]}];
    const saved = [];
    let reads = 0;
    const char = {avatar:'a.png',name:'A'};
    const ctx = vm.createContext({
        console, URL, getSetting:()=>true, allCharacters:[char], extensionsReady:()=>true,
        getCharacterGalleryId:()=> 'id', getGalleryFolderName:()=> 'New',
        getSTContext:()=>({characters:[char], characterId:active?0:1,chatId:'chat'}),
        ENDPOINTS:{IMAGES_LIST:'images',CHARACTERS_CHATS:'chats',CHATS_GET:'read',CHATS_SAVE:'save'},
        apiRequest:async (path,_method,body)=>{
            if(path==='chats')return Response.json([{file_name:'chat.jsonl'}]);
            if(path==='images')return failFolder && body.folder==='Old'?new Response('',{status:503}):Response.json(body.folder==='New'?['pic.png']:[]);
            if(path==='read'){ reads++; const data=structuredClone(original); if(changed && reads>1)data[1].mes='new live text';return Response.json(data); }
            if(path==='save'){saved.push(body.chat);return Response.json({ok:true});}
            throw new Error(path);
        },
    });
    vm.runInContext(media,ctx);
    return {run:()=>ctx.fixChatMediaLinksForUniqueFolders(),saved,original};
}
test('repair covers inline URLs, attachments and swipes without changing original metadata',async()=>{
    const h=repair();const result=await h.run();assert.equal(result.chatsFixed,1);
    const saved=JSON.parse(JSON.stringify(h.saved[0]));
    assert.equal(saved[1].mes,'![art](/user/images/New/pic.png)');
    assert.equal(saved[1].extra.image,'/user/images/New/pic.png?x=1');
    assert.equal(saved[1].swipe_info[0].extra.media[0].url,'/user/images/New/pic.png');
    assert.deepEqual(saved[0],h.original[0]);
});
for(const [name,opts] of [['active',{active:true}],['changed',{changed:true}]])test(`repair never saves an ${name} chat`,async()=>{const h=repair(opts);await h.run();assert.equal(h.saved.length,0)});
test('unreadable old folder cannot be treated as proof a file is missing',async()=>{const h=repair({failFolder:true});await assert.rejects(h.run(),/verify/);assert.equal(h.saved.length,0)});
test('embedded book conversion preserves activation settings and disambiguates repeated entry ids',()=>{
    const world=convertCharacterBookToNative({entries:[{id:0,enabled:true,keys:['one'],extensions:{position:7,sticky:3,group_override:true}},{id:0,enabled:false,keys:['two']}]});
    assert.equal(Object.keys(world.entries).length,2);assert.equal(world.entries[0].position,7);assert.equal(world.entries[0].sticky,3);assert.equal(world.entries[0].groupOverride,true);assert.equal(world.entries[1].disable,true);
});
const proxyCode=lib.slice(lib.indexOf('async function resolveProxyForProfile('),lib.indexOf('// Anthropic-format responses'));
for(const profile of [{reverse_proxy:' https://proxy.example ',proxy_password:' key '},{proxy:{url:'https://proxy.example',password:'key'}},{reverseProxy:'https://proxy.example',proxyPassword:'key'}])test('proxy resolver accepts explicit credentials without calling settings',async()=>{
    const ctx=vm.createContext({fetchStSettings:()=>{throw new Error('unexpected settings lookup')}});vm.runInContext(proxyCode,ctx);assert.deepEqual(JSON.parse(JSON.stringify(await ctx.resolveProxyForProfile(profile))),{url:'https://proxy.example',password:'key'});
});
test('profile None overrides explicit proxy and never inherits shared credentials',async()=>{
    const ctx=vm.createContext({fetchStSettings:async()=>({settings:{oai_settings:{reverse_proxy:'https://shared',proxy_password:'shared'}}})});vm.runInContext(proxyCode,ctx);assert.equal((await ctx.resolveProxyForProfile({proxy:'None',reverse_proxy:'https://unused'})).url,'');
});
const api=await readFile(new URL('../../modules/providers/chub/chub-api.js',import.meta.url),'utf8');
const normalize=api.slice(api.indexOf('export function normalizeChubTopics('),api.indexOf('\n}',api.indexOf('export function normalizeChubTopics('))+2).replace('export ','');
test('Chub object topics normalize without importing malformed labels',()=>{const ctx=vm.createContext({});vm.runInContext(normalize,ctx);assert.deepEqual(Array.from(ctx.normalizeChubTopics([' fantasy ',{name:'RPG'},{slug:'story'},{name:5},null])),['fantasy','RPG','story']);});
const embeddedCode = lib.slice(lib.indexOf('window.importEmbeddedCardLorebook ='),lib.indexOf('window.importWorldInfoData =')).replace("await import('../modules/lorebook-conversion.js')",'({ convertCharacterBookToNative: convertBookFixture })');
function embeddedHarness({primary='',writeFails=false,bindFails=false,listFails=false,newCharacter=false,avatar='a.png'}={}) {
    const books=[],fields=[],additional=[],warnings=[];
    let characterAvailable = !newCharacter;
    const ctx=vm.createContext({console:{warn(){}},convertBookFixture:convertCharacterBookToNative,
        sanitizeFolderName:s=>s.replace(/:/g,''),showToast:m=>warnings.push(m),
        fetchAndAddCharacter:async()=>{characterAvailable=true;return {avatar:'a.png'}},
        window:{
            listWorldInfoFiles:async()=>{if(listFails)throw new Error('World listing failed');return [{file_id:'Book'}]},
            importWorldInfoData:async(name,data)=>{books.push({name,data});return !writeFails},
            applyCardFieldUpdates:async(avatar,update,options)=>{fields.push({...update,_avatar:avatar,_awaitNotify:options?.awaitNotify});return characterAvailable&&avatar==='a.png'&&!bindFails},
            getCharAdditionalLorebooks:async()=>['Existing extra'],
            setCharAdditionalLorebooks:async(avatar,names)=>{additional.push(names);return !bindFails},
            updateWorldInfoList:async()=>{},
        },
    });
    const extStart=lib.indexOf('function ensurePngExt(');
    vm.runInContext(lib.slice(extStart,lib.indexOf('\n}',extStart)+2)+embeddedCode,ctx);
    return {run:()=>ctx.window.importEmbeddedCardLorebook(avatar,{name:'A',extensions:{world:primary},character_book:{name:'Book',entries:[{id:0,enabled:true}]}}),books,fields,additional,warnings};
}
test('embedded auto-import chooses an unused world name and persists the primary only after writing',async()=>{const h=embeddedHarness();await h.run();assert.equal(h.books[0].name,'Book (2)');assert.equal(h.fields[0]['extensions.world'],'Book (2)');});

test('a new upload stem resolves to the PNG before binding and awaits host synchronization',async()=>{const h=embeddedHarness({newCharacter:true,avatar:'a'});await h.run();assert.equal(h.warnings.length,0);assert.equal(h.fields[0]._avatar,'a.png');assert.equal(h.fields[0]['extensions.world'],'Book (2)');assert.equal(h.fields[0]._awaitNotify,true);});

test('single-character refresh updates an existing import without duplicating either character list',async()=>{
    const start=lib.indexOf('async function fetchAndAddCharacter('),end=lib.lastIndexOf('/**',lib.indexOf('function removeCharacterFromList(',start));
    const original={avatar:'existing.png',name:'Existing'},all=[original],current=[original];let version=0;
    const ctx=vm.createContext({console,allCharacters:all,currentCharacters:current,_extensionsCache:new Map(),_needsCharacterRefresh:false,
        ENDPOINTS:{CHARACTERS_GET:'get'},notifySTCharacterAdded(){},prepareCharacterKeys(){},slimCharacter:c=>c,debugLog(){},
        apiRequest:async()=>({ok:true,json:async()=>({avatar:'a.png',data:{extensions:{world:'Book',version:++version}}})}),
    });vm.runInContext(lib.slice(start,end),ctx);
    await ctx.fetchAndAddCharacter('a.png',{skipNotify:true});await ctx.fetchAndAddCharacter('a.png',{skipNotify:true});
    assert.equal(all.length,2);assert.equal(current.length,2);assert.equal(all[0],original);assert.equal(all[1].data.extensions.version,2);assert.equal(current[1],all[1]);
});
test('embedded auto-import preserves an unrelated primary and adds the imported book as additional',async()=>{const h=embeddedHarness({primary:'Canon'});await h.run();assert.equal(h.fields.length,0);assert.deepEqual(Array.from(h.additional[0]),['Existing extra','Book (2)']);});
test('failed world write does not persist a dangling primary link',async()=>{const h=embeddedHarness({writeFails:true});await h.run();assert.equal(h.fields.length,0);assert.equal(h.warnings.length,1);});
test('failed embedded-book binding is reported instead of claiming full success',async()=>{const h=embeddedHarness({bindFails:true});await h.run();assert.equal(h.warnings.length,1);});

test('failed world listing never permits an unchecked overwrite',async()=>{const h=embeddedHarness({listFails:true});await h.run();assert.equal(h.books.length,0);assert.equal(h.fields.length,0);assert.equal(h.warnings.length,1);});
