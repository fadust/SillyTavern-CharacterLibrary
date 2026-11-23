import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../modules/providers/charavault/charavault-browse.js',import.meta.url),'utf8');
const strip=s=>s.replace(/^import[\s\S]*?;\r?\n/gm,'').replace(/^export .*;\r?$/gm,'');
class Element {
    value=''; dataset={}; children=[]; textContent=''; scrollTop=0; clientHeight=200; scrollHeight=1000;
    classList={toggle(){},add(){},remove(){}};
    set innerHTML(s){this.html=s;this.children=[];} get innerHTML(){return this.html||'';}
    appendChild(el){if(el.fragment)this.children.push(...el.children);else this.children.push(el);}
}
function harness(overrides={}) {
    const elements=new Map(),timers=new Map(),toasts=[];let id=0;
    const document={getElementById:name=>{if(!elements.has(name))elements.set(name,new Element());return elements.get(name);},createElement:()=>new Element(),createDocumentFragment:()=>Object.assign(new Element(),{fragment:true})};
    const ctx=vm.createContext({document,Map,Set,console,formatNumber:String,
        BrowseView:class{},CoreAPI:{escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),getProviderExcludeTags:()=>[],showToast:(...a)=>toasts.push(a),debugLog(){},...overrides.core},
        fetchCvTags:async()=>[],fetchCvCards:async()=>({total:0,results:[]}),cvFullPath:(folder,file)=>folder+'/'+file,
        setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id),...overrides,
    });
    vm.runInContext(strip(source),ctx);
    vm.runInContext('globalThis.seedTags=tags=>{cvPopularTags=tags;cvTagsLoaded=true;}',ctx);
    return {ctx,elements,document,timers,toasts};
}
test('CharaVault tag buttons cycle include, exclude and neutral like Chub',()=>{
    const {ctx,document}=harness();
    ctx.toggleCvTag('Fantasy');assert.equal(ctx.getCvTagSearchParams().tags,'"fantasy"');
    assert.equal(document.getElementById('cvTagsBtnLabel').textContent,'Tags (+1)');
    ctx.toggleCvTag('Fantasy');assert.equal(ctx.getCvTagSearchParams().exclude_tags,'"fantasy"');
    assert.equal(document.getElementById('cvTagsBtnLabel').textContent,'Tags (-1)');
    ctx.toggleCvTag('Fantasy');assert.equal(ctx.getCvTagSearchParams().exclude_tags,'');
    assert.equal(document.getElementById('cvTagsBtnLabel').textContent,'Tags');
});
test('CharaVault combines multiple exact positives, negatives and persistent provider exclusions',()=>{
    const {ctx,document}=harness({core:{getProviderExcludeTags:id=>{assert.equal(id,'charavault');return ['Horror'];}}});
    ctx.setCvTagFilter('Male','include');ctx.setCvTagFilter('Fantasy','include');ctx.setCvTagFilter('Female','exclude');
    const params=ctx.getCvTagSearchParams();
    assert.equal(params.tags,'"male","fantasy"');assert.equal(params.exclude_tags,'"horror","female"');
    assert.equal(document.getElementById('cvTagsBtnLabel').textContent,'Tags (+2/-1)');
});
test('CharaVault tag search covers the full catalogue and scrolling exposes entries beyond the first chunk',()=>{
    const {ctx,document}=harness();ctx.seedTags(Array.from({length:250},(_,i)=>['tag'+String(i).padStart(3,'0'),1]));
    ctx.renderCvTagsList();const list=document.getElementById('cvTagsList');assert.equal(list.children.length,100);
    list.scrollTop=1000;list.onscroll();assert.equal(list.children.length,200);
    ctx.renderCvTagsList('tag249');assert.equal(list.children.length,1);assert.equal(list.children[0].dataset.tag,'tag249');
});
test('CharaVault accepts custom tags and keeps selected tags available outside the catalogue',()=>{
    const {ctx,document}=harness();document.getElementById('cvTagsSearchInput').value='Unlisted Tag';ctx.addCustomCvTag();
    assert.equal(ctx.getCvTagSearchParams().tags,'"unlisted tag"');
    assert.equal(document.getElementById('cvTagsSearchInput').value,'');
    assert.equal(document.getElementById('cvTagsList').children[0].dataset.tag,'unlisted tag');
});
test('CharaVault coalesces rapid tag changes into one result reload',()=>{
    const {ctx,timers}=harness();let loads=0;ctx.loadCvCharacters=()=>loads++;
    ctx.toggleCvTag('Fantasy');ctx.toggleCvTag('Elf');assert.equal(timers.size,1);
    [...timers.values()][0]();assert.equal(loads,1);
});
test('CharaVault token range validates and Clear resets tag and token filters',()=>{
    const {ctx,document,toasts}=harness();ctx.loadCvCharacters=()=>{};
    document.getElementById('cvMinTokens').value='1000';document.getElementById('cvMaxTokens').value='500';ctx.updateCvTokenFilters();assert.equal(toasts.length,1);
    document.getElementById('cvMinTokens').value='0';ctx.updateCvTokenFilters();assert.equal(ctx.getCvTagSearchParams().token_min,0);
    ctx.setCvTagFilter('Fantasy','exclude');ctx.clearCvTagFilters();
    const p=ctx.getCvTagSearchParams();assert.equal(p.exclude_tags,'');assert.equal(p.token_min,null);assert.equal(p.token_max,null);
});
test('CharaVault filter changes during loading replace the pending search and stale results cannot repaint',async()=>{
    const pending=[];const {ctx,document}=harness({fetchCvCards:params=>new Promise(resolve=>pending.push({params,resolve}))});
    const painted=[];ctx.renderCvGrid=()=>painted.push('paint');
    const old=ctx.loadCvCharacters(true);ctx.setCvTagFilter('Fantasy','include');const fresh=ctx.loadCvCharacters(true);
    assert.equal(pending.length,2);assert.equal(pending[1].params.tags,'"fantasy"');
    pending[1].resolve({total:1,results:[{folder:'cards',file:'new.png'}]});await fresh;
    pending[0].resolve({total:99,results:[{folder:'cards',file:'old.png'}]});await old;
    assert.equal(painted.length,1);assert.equal(document.getElementById('cvResultsSummary').textContent,'1 matching characters');
});
test('CharaVault can retry a failed tag catalogue load',async()=>{
    let calls=0;const {ctx,document}=harness({fetchCvTags:async()=>{if(++calls===1)throw new Error('Temporary failure');return [['Fantasy',1]];}});
    await ctx.loadCvTags();await ctx.loadCvTags();assert.equal(calls,2);assert.equal(document.getElementById('cvTagsList').children[0].dataset.tag,'Fantasy');
});
