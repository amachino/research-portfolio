'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const {titleSlug, sourceTitle, initializeUrls, redirectPage, updateIndexLinks} = require('./paper-urls.cjs');
process.chdir(__dirname);
assert.equal(titleSlug('QuBE/Qubex: an integrated hardware–software system'), 'qube-qubex-an-integrated-hardware-software-system');
assert.equal(titleSlug("Café’s    Qubits / Gates"), 'cafes-qubits-gates');
assert.equal(sourceTitle('<article><h1>A<br>B <em>test</em></h1></article>'), 'A B test');
assert.throws(() => titleSlug('量子'), /explicit urlSlug/);
assert.throws(() => titleSlug('a'.repeat(251)), /explicit urlSlug/);
const initial = [{slug:'internal',snapshot:'source.html',arxivId:'1234.56789v1'}];
const first = initializeUrls(initial, () => '<article><h1>Original Paper Title</h1></article>');
assert(first.changed);
assert.equal(initial[0].urlSlug, undefined, 'Do not mutate caller metadata');
assert.equal(first.papers[0].urlSlug, 'original-paper-title');
const saved = JSON.parse(JSON.stringify(first.papers));
const later = initializeUrls(saved, () => {throw new Error('Existing URLs must not read or regenerate from revised titles');});
assert(!later.changed);
assert.deepEqual(later.papers, saved);
assert.equal(later.papers[0].slug, 'internal', 'Internal keys stay unchanged');
for (const records of [
  [{slug:'a',urlSlug:'same'},{slug:'b',urlSlug:'same'}],
  [{slug:'a',urlSlug:'b'},{slug:'b',urlSlug:'different'}],
  [{slug:'a',urlSlug:'index'}],
  [{slug:'same',urlSlug:'a'},{slug:'same',urlSlug:'b'}],
]) assert.throws(() => initializeUrls(records,()=>''), /URL collision/);
for (const urlSlug of ['', null, '../outside', 'Uppercase', 'bad.html', 'a?b', 'a'.repeat(251)])
  assert.throws(() => initializeUrls([{slug:'a',urlSlug}],()=>''), /public URL/);
assert(!initializeUrls([{slug:'a',urlSlug:'a'}],()=>'' ).changed, 'Self aliases do not conflict');
assert.equal(updateIndexLinks('<a href="internal.html">HTML</a><a href="other.html">Other</a>', first.papers), '<a href="original-paper-title.html">HTML</a><a href="other.html">Other</a>');
const script = fs.readFileSync('paper-redirect.js','utf8');
const records = JSON.parse(fs.readFileSync('sources/provenance.json'));
const index = parseHTML(fs.readFileSync('docs/index.html','utf8')).document;
for (const paper of records) {
  const oldPath = `${paper.slug}.html`;
  const newPath = `${paper.urlSlug}.html`;
  assert.match(paper.urlSlug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Persisted URL is safe, independent of later title edits');
  assert.equal(fs.readFileSync(`docs/${oldPath}`,'utf8'), redirectPage(paper));
  const article = parseHTML(fs.readFileSync(`docs/${newPath}`,'utf8')).document;
  assert(article.querySelector('article'));
  assert.equal(article.querySelector('meta[name="robots"]').content, 'noindex');
  assert.equal(article.querySelector('link[rel="canonical"]'), null, 'Keep existing no-canonical policy');
  assert(index.querySelector(`a[href="${newPath}"]`));
  assert(!index.querySelector(`a[href="${oldPath}"]`));
  for (const suffix of ['', '?via=old%20link#S1', '?a=1&a=2#A1.SS1', '#eq%3A1']) {
    const {document} = parseHTML(redirectPage(paper));
    assert.equal(document.querySelector('meta[name="robots"]').content, 'noindex');
    assert(!document.querySelector('meta[http-equiv="refresh"]'), 'No competing redirect may drop query/fragment');
    assert(!document.querySelector('article'), 'No duplicate reading edition at old URL');
    assert(document.querySelector('noscript'), 'Manual no-JavaScript fallback');
    const current = new URL(`https://example.invalid/research-portfolio/${oldPath}${suffix}`);
    let destination;
    vm.runInNewContext(script, {URL,document,window:{location:{href:current.href,search:current.search,hash:current.hash,replace: value => {destination=value;}}}});
    assert.equal(destination, `https://example.invalid/research-portfolio/${newPath}${suffix}`);
    assert.equal(document.getElementById('paper-destination').getAttribute('href'), destination);
  }
}
assert.equal(fs.readFileSync('docs/assets/paper-redirect.js','utf8'), script);
console.log('Stable title URLs: initialization, persistence, collision diagnostics, index, noindex, and three query/fragment redirects passed.');
