'use strict';
// Source-level DOM/storage unit tests. Browser layout and native focus trapping
// require the separate real-browser check after publication.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const reader = require('@amachino/leaf-reader/reader');
const script = fs.readFileSync(reader.assetPath('settings.js'),'utf8');
const css = fs.readFileSync(reader.assetPath('reader.css'),'utf8');
const markup = fs.readFileSync(reader.assetPath('settings.html'),'utf8');
assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|document\.cookie/.test(script));
const dom = parseHTML(markup).document;
assert.equal(dom.querySelector('dialog').getAttribute('aria-labelledby'),'reader-settings-title');
assert.equal(dom.querySelectorAll('fieldset').length,3);
assert.equal(dom.querySelectorAll('input[type="radio"]').length,7);
assert(!dom.querySelector('select,details'));
function harness(initial, {blocked=false,width=390}={}) {
  const key='paper-atelier.reader-settings.v1';
  const saved=new Map(initial===undefined?[]:[[key,initial]]), events=new Map(), style=new Map();
  let focusCount=0, shown=0;
  const control=()=>({hidden:true,open:false,isConnected:true,checked:false,textContent:'',events:{},attributes:{},addEventListener(k,h){this.events[k]=h;},setAttribute(k,v){this.attributes[k]=v;},focus(){focusCount++;}});
  const ids=Object.fromEntries(['reader-settings','reader-settings-open','reader-settings-close','reader-settings-reset','reader-settings-status'].map(k=>[k,control()]));
  const radios=[];
  for(const [name,values] of Object.entries({size:['small','medium','large'],font:['serif','sans'],theme:['light','dark']})) for(const value of values) radios.push({...control(),name:'reader-'+name,value});
  const dialog=ids['reader-settings'];
  dialog.querySelectorAll=()=>radios;
  dialog.showModal=()=>{dialog.open=true;shown++;};
  dialog.close=()=>{dialog.open=false;dialog.events.close();};
  dialog.getBoundingClientRect=()=>({left:50,right:350,top:100,bottom:600});
  const root={dataset:{},style:{removeProperty(k){style.delete(k);}}};
  const document={documentElement:root,activeElement:ids['reader-settings-open'],readyState:'loading',getElementById:k=>ids[k],addEventListener(k,h){events.set(k,h);}};
  const window={matchMedia:q=>({matches:width<=(q.includes('600')?600:900)}),addEventListener(k,h){events.set(k,h);}};
  const localStorage={getItem(k){if(blocked)throw Error('blocked');return saved.get(k)??null;},setItem(k,v){if(blocked)throw Error('blocked');saved.set(k,v);},removeItem(k){if(blocked)throw Error('blocked');saved.delete(k);}};
  vm.runInNewContext(script,{document,window,localStorage});
  // The script has already applied validated font/size/theme before DOM ready.
  const beforeReady={...root.dataset};
  events.get('DOMContentLoaded')();
  const choose=(name,value)=>{const r=radios.find(r=>r.name==='reader-'+name&&r.value===value);r.checked=true;r.events.change();};
  return {key,saved,events,ids,radios,root,beforeReady,choose,dialog,focusCount:()=>focusCount,shown:()=>shown};
}
const h=harness();
assert.deepEqual(h.beforeReady,{readerFont:'serif',readerSize:'small',readerTheme:'light'});
assert.equal(h.ids['reader-settings-open'].hidden,false);
h.ids['reader-settings-open'].events.click();
h.ids['reader-settings-open'].events.click();
assert.equal(h.shown(),1);
assert.equal(h.ids['reader-settings-open'].attributes['aria-expanded'],'true');
h.choose('size','medium');h.choose('font','sans');h.choose('theme','dark');
assert.equal(h.root.dataset.readerSize,'medium');assert.equal(h.root.dataset.readerTheme,'dark');
assert.equal(h.radios.filter(r=>r.checked).length,3);
const restored=harness(h.saved.get(h.key));
assert.equal(restored.beforeReady.readerTheme,'dark');assert.equal(restored.beforeReady.readerFont,'sans');
let cancelled=false;
h.dialog.events.cancel({preventDefault(){cancelled=true;}});
assert(cancelled && !h.dialog.open && h.focusCount()===1);
assert.equal(h.ids['reader-settings-open'].attributes['aria-expanded'],'false');
h.ids['reader-settings-open'].events.click();
h.dialog.events.pointerdown({target:h.dialog,clientX:100,clientY:200});
h.dialog.events.click({target:h.dialog,clientX:0,clientY:0});
assert(h.dialog.open,'Drag from inside to backdrop must not close');
h.dialog.events.pointerdown({target:h.dialog,clientX:0,clientY:0});
h.dialog.events.click({target:h.dialog,clientX:0,clientY:0});
assert(!h.dialog.open,'Backdrop tap closes');
h.ids['reader-settings-open'].events.click();h.ids['reader-settings-close'].events.click();assert(!h.dialog.open);
h.ids['reader-settings-reset'].events.click();
assert.equal(h.root.dataset.readerSize,'small');assert.equal(h.root.dataset.readerFont,'serif');assert.equal(h.root.dataset.readerTheme,'light');assert(!h.saved.has(h.key));
for(const [size,width,expected] of [[14.5,390,'small'],[17,390,'medium'],[20,390,'large'],[19,1280,'small'],[22,1280,'medium'],[24,1280,'large'],[18,800,'small']]) {
  const migrated=harness(JSON.stringify({font:'sans',size}),{width});
  assert.equal(migrated.root.dataset.readerSize,expected);
  assert.equal(JSON.parse(migrated.saved.get(migrated.key)).size,expected);
}
for(const value of ['bad JSON','null',JSON.stringify({font:'bad',size:99,theme:'system'}),JSON.stringify({size:'24;color:red'}),JSON.stringify({size:14.3})]) {
  const bad=harness(value);assert.equal(bad.root.dataset.readerSize,'small');assert.equal(bad.root.dataset.readerTheme,'light');
}
restored.events.get('storage')({key:restored.key,newValue:JSON.stringify({font:'sans',size:'large',theme:'dark'})});
assert.equal(restored.root.dataset.readerSize,'large');
restored.events.get('storage')({key:null,newValue:null});assert.equal(restored.root.dataset.readerTheme,'light');
const blocked=harness(undefined,{blocked:true});blocked.choose('theme','dark');assert.equal(blocked.root.dataset.readerTheme,'dark');assert(blocked.ids['reader-settings-status'].textContent.includes('unavailable'));
for(const rule of ['--reader-default-size:14.5px','--reader-default-size:19px','--reader-font-size:17px','--reader-font-size:20px','--reader-font-size:22px','--reader-font-size:25px','--reader-line-height:1.45','--reader-line-height:1.55','min-height:48px','::backdrop','color-scheme:dark','figure img{background:#fff;filter:none}','.katex{font-size:1.05em!important}']) assert(css.includes(rule),rule);
console.log('Settings source tests passed: radio controls, defaults, persistence, numeric migration, early theme, reset, storage failure, native-dialog close/Escape/backdrop, and focus restoration.');
