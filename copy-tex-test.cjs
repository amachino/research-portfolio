'use strict';
// Test the shipped, unmodified official extension, not a replacement serializer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const katex = require('katex');
const extension = fs.readFileSync(require.resolve('katex/dist/contrib/copy-tex.min.js'), 'utf8');
function copy(html, {partial = false, collapsed = false, clipboard = true} = {}) {
  const {document, window} = parseHTML('<html><body><article>' + html + '</article></body></html>');
  const article = document.querySelector('article');
  const original = article.outerHTML;
  const expanded = [];
  const root = article.querySelector('.katex');
  const range = {startContainer: partial ? root.querySelector('.katex-html') : article,
    endContainer: partial ? root.querySelector('.katex-html') : article,
    setStartBefore: node => expanded.push(['start', node]),
    setEndAfter: node => expanded.push(['end', node]),
    cloneContents: () => { const fragment = document.createDocumentFragment();
      // linkedom returns null here; emulate the standard DocumentFragment getter.
      Object.defineProperty(fragment, 'textContent', {get:()=>[...fragment.childNodes].map(n=>n.textContent).join('')});
      for (const node of article.childNodes) fragment.appendChild(node.cloneNode(true)); return fragment; }};
  const data = {};
  vm.runInNewContext(extension, {document, window: {getSelection: () => ({isCollapsed:collapsed, getRangeAt:()=>range})},
    Element: window.Element, Text: window.Text, self:{}});
  const event = new window.Event('copy', {cancelable:true});
  if (clipboard) event.clipboardData = {setData: (type, value) => {data[type]=value;}};
  document.dispatchEvent(event);
  assert.equal(article.outerHTML, original, 'reading markup is never changed');
  return {data, handled:event.defaultPrevented, expanded};
}
const math = (tex, displayMode = false) => katex.renderToString(tex, {displayMode});
let result = copy('<p>For '+math('x^2')+' and '+math('\\alpha')+', continue.</p>');
assert.equal(result.data['text/plain'], 'For $x^2$ and $\\alpha$, continue.');
assert(result.handled && result.data['text/html'].includes('class="katex"'));
result = copy('<p>Before.</p>'+math('\\frac{1}{2}',true)+'<p>After.</p>');
assert.equal(result.data['text/plain'], 'Before.$$\\frac{1}{2}$$After.');
result = copy(math('x^2'), {partial:true});
assert.equal(result.data['text/plain'], '$x^2$');
assert.deepEqual(result.expanded.map(x=>x[0]), ['start','end']);
result = copy('<p><em>Compare</em> '+math('a < b')+'.</p>');
assert.equal(result.data['text/plain'], 'Compare $a < b$.');
assert(result.data['text/html'].includes('<em>Compare</em>'));
for (const html of ['<p>Plain.</p>', '<math alttext="x"><mi>x</mi></math>', '<span class="semantic-unit">GHz</span>']) {
  assert.equal(copy(html).handled, false, 'non-KaTeX uses native clipboard behavior');
}
assert.equal(copy(math('x'), {collapsed:true}).handled, false);
assert.equal(copy(math('x'), {clipboard:false}).handled, false);
console.log('Official copy-tex: inline/display, HTML, partial endpoints, native fallbacks, empty/unavailable clipboard passed');
