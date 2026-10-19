'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const script = fs.readFileSync('header-scroll.js','utf8');
function harness() {
  const events = {}, headerEvents = {}, mediaEvents = {}, classes = new Set();
  const dialogEvents = {}; let frame, mutation, resize;
  const state = {focused:false,open:false,height:52};
  const root = {scrollHeight:5000,style:{setProperty(k,v){this[k]=v;}}};
  const header = {classList:{remove:k=>classes.delete(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);}},
    contains:()=>state.focused,querySelector:()=>state.open?{}:null,querySelectorAll:()=>[{addEventListener:(k,f)=>dialogEvents[k]=f}],
    getBoundingClientRect:()=>({height:state.height}),addEventListener:(k,f)=>headerEvents[k]=f};
  const document = {querySelector:()=>header,documentElement:root,activeElement:null};
  const window = {scrollY:0,innerHeight:800,addEventListener:(k,f)=>events[k]=f};
  const media = {matches:true,addEventListener:(k,f)=>mediaEvents[k]=f};
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:f=>frame=f,
    MutationObserver:class{constructor(f){mutation=f;} observe(){}},ResizeObserver:class{constructor(f){resize=f;}observe(){}}});
  return {state,root,window,media,events,headerEvents,mediaEvents,dialogEvents,mutation:()=>mutation(),resize:()=>resize(),
    hidden:()=>classes.has('reader-header-hidden'),scroll(y){window.scrollY=y;events.scroll();frame();}};
}
const h=harness();
assert.equal(h.root.style['--reader-header-height'],'52px');
h.scroll(50);assert(!h.hidden(),'top area visible');
h.scroll(70);assert(!h.hidden(),'less than 32px does not hide');
h.scroll(82);assert(h.hidden(),'32px intent hides');
h.scroll(79);assert(h.hidden(),'3px reversal does not flicker');
h.scroll(74);assert(!h.hidden(),'8px upward reveals');
h.scroll(200);assert(h.hidden());
h.state.focused=true;h.headerEvents.focusin();assert(!h.hidden());h.scroll(300);assert(!h.hidden(),'keyboard focus pins header');
h.state.focused=false;h.headerEvents.focusout();h.scroll(400);assert(h.hidden());
h.state.open=true;h.mutation();assert(!h.hidden(),'opening dialog reveals');h.scroll(500);assert(!h.hidden(),'open dialog pins header');
h.state.open=false;h.dialogEvents.close();h.scroll(600);assert(h.hidden());
h.events.hashchange();assert(!h.hidden(),'anchor navigation reveals');h.scroll(700);assert(h.hidden());
h.media.matches=false;h.mediaEvents.change();h.scroll(1000);assert(!h.hidden(),'desktop does not hide');
h.media.matches=true;h.mediaEvents.change();h.scroll(1100);assert(h.hidden());
h.state.height=80;h.resize();assert(!h.hidden());assert.equal(h.root.style['--reader-header-height'],'80px');
h.scroll(-20);assert(!h.hidden(),'top overscroll clamped');h.scroll(4200);assert(h.hidden());h.scroll(4300);h.scroll(4200);assert(h.hidden(),'bottom bounce does not reveal');
h.events.pageshow();assert(!h.hidden(),'history restore visible');
for(const paper of ['bswap','qubex','matsuda']){
  const doc=parseHTML(fs.readFileSync(`docs/${paper}.html`,'utf8')).document;
  assert(doc.querySelector('.reader-topbar'));
  assert.equal(doc.querySelectorAll('script[src^="assets/header-scroll.js?v="]').length,1);
}
const index=parseHTML(fs.readFileSync('docs/index.html','utf8')).document;
assert(!index.querySelector('.reader-topbar,script[src^="assets/header-scroll.js"]'),'homepage unchanged');
const css=fs.readFileSync('reader.css','utf8');
assert(css.includes('.reader-topbar{position:sticky;top:0;'));
assert(css.includes('@media(prefers-reduced-motion:reduce){.reader-topbar{transition:none}}'));
assert(!/fetch\s*\(|localStorage|preventDefault|aria-hidden|inert/.test(script));
console.log('Reader header scroll tests passed: thresholds, focus/dialog locks, anchors, resize, history, bounce, desktop and build wiring');
