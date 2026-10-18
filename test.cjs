'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parseHTML } = require('linkedom');
process.chdir(__dirname);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const provenance = JSON.parse(fs.readFileSync('sources/provenance.json', 'utf8'));
const repairs = JSON.parse(fs.readFileSync('sources/math-repairs.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('docs/math-audit.json', 'utf8'));
const expectedPages = ['bswap.html', 'index.html', 'qubex.html'];
assert.deepEqual(fs.readdirSync('docs').filter(f => f.endsWith('.html')).sort(), expectedPages, 'Only three public HTML pages');
const documents = new Map(expectedPages.map(file => [file, parseHTML(fs.readFileSync('docs/' + file, 'utf8')).document]));
const index = documents.get('index.html');
assert.equal(index.querySelector('title').textContent, 'Research Portfolio · Akinori Machino');
assert.equal(index.querySelector('.home-link').textContent, 'Akinori Machino');
assert.equal(index.querySelector('main h1').textContent, 'Research Articles');
const cards = [...index.querySelectorAll('.paper-list section')];
assert.equal(cards.length, 3);
for (const card of cards) {
  assert.equal(card.querySelector('.paper-authors').getAttribute('translate'), 'no');
  assert.equal(card.querySelector('.paper-authors strong').textContent, 'Akinori Machino');
  assert.match(card.querySelector('.paper-authors strong').getAttribute('style'), /text-decoration:underline/);
  assert(!card.querySelector('.paper-authors').textContent.includes('et al.'), 'All authors are shown');
  assert.equal(card.querySelector('time').getAttribute('datetime'), '2026');
  assert.match(card.querySelector('.paper-meta').textContent, /arXiv preprint|Physical Review Research/);
  assert.equal(card.querySelectorAll('p').length, 3, 'Bibliography only; no summary');
}
assert.equal(cards[0].querySelectorAll('a[href^="https://doi.org/"]').length, 0, 'Pending DOI is not advertised');
assert.equal(cards[1].querySelector('a[href^="https://doi.org/"]').getAttribute('href'), 'https://doi.org/10.48550/arXiv.2606.13010');
assert.equal(cards[2].querySelector('a[href^="https://doi.org/"]').getAttribute('href'), 'https://doi.org/10.1103/xw1s-dt16');
assert.match(cards[2].querySelector('.paper-authors').textContent, /^Ryo Matsuda, Ryutaro Ohira/);
const expectedAuthorLists = [
  [
    "Akinori Machino",
    "Kazuhisa Ogawa",
    "Yuto Ikegai",
    "Takafumi Miyanaga",
    "Koichiro Ban",
    "Nilton F. G. Filho",
    "Hidehisa Shiomi",
    "Toshi Sumida",
    "Shuhei Tamate",
    "Yutaka Tabuchi",
    "Yasunobu Nakamura",
    "Makoto Negoro"
  ],
  [
    "Akinori Machino",
    "Kazuhisa Ogawa",
    "Takefumi Miyoshi",
    "Hidehisa Shiomi",
    "Shinichi Morisaka",
    "Ryo Matsuda",
    "Nilton F. G. Filho",
    "Koichiro Ban",
    "Takafumi Miyanaga",
    "Keisuke Koike",
    "Ryutaro Ohira",
    "Toshi Sumida",
    "Yoshinori Kurimoto",
    "Yuuya Sugita",
    "Yosuke Ito",
    "Yasunari Suzuki",
    "Peter A. Spring",
    "Shiyu Wang",
    "Hiroto Mukai",
    "Arvind Mamgain",
    "Shuhei Tamate",
    "Yutaka Tabuchi",
    "Yasunobu Nakamura",
    "Makoto Negoro"
  ],
  [
    "Ryo Matsuda",
    "Ryutaro Ohira",
    "Toshi Sumida",
    "Hidehisa Shiomi",
    "Akinori Machino",
    "Shinichi Morisaka",
    "Keisuke Koike",
    "Takefumi Miyoshi",
    "Yoshinori Kurimoto",
    "Yuuya Sugita",
    "Yosuke Ito",
    "Yasunari Suzuki",
    "Peter A. Spring",
    "Shiyu Wang",
    "Shuhei Tamate",
    "Yutaka Tabuchi",
    "Yasunobu Nakamura",
    "Kazuhisa Ogawa",
    "Makoto Negoro"
  ]
];
cards.forEach((card, i) => assert.equal(card.querySelector('.paper-authors').textContent, expectedAuthorLists[i].join(', '), 'Complete original author order'));
const stats = [];
const local = (url, base) => {
  if (/^(https?:|mailto:|tel:)/.test(url)) return null;
  assert(!/^[a-z]+:/i.test(url) && !url.startsWith('//'), `Unexpected URL scheme: ${url}`);
  const parsed = new URL(url, `https://example.invalid/paper-atelier/${base}`);
  assert(parsed.pathname.startsWith('/paper-atelier/'), `URL escapes project path: ${url}`);
  const relative = decodeURIComponent(parsed.pathname.slice('/paper-atelier/'.length));
  const file = relative || 'index.html';
  assert(fs.existsSync(path.join('docs', file)), `Missing local target: ${base} -> ${url}`);
  if (parsed.hash && documents.has(file)) assert(documents.get(file).getElementById(decodeURIComponent(parsed.hash.slice(1))), `Missing fragment: ${base} -> ${url}`);
  return file;
};
for (const [file, document] of documents) {
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  assert.equal(document.querySelectorAll('merror,.katex-error,.ltx_ERROR').length, 0, `${file}: math errors`);
  for (const element of document.querySelectorAll('[src],[href],[data]')) {
    for (const attr of ['src','href','data']) {
      const url = element.getAttribute(attr);
      if (url) {
        if (attr !== 'href' || element.tagName === 'LINK') assert(!/^(https?:|\/\/)/.test(url), `${file}: external runtime asset`);
        local(url, file);
      }
    }
  }
  for (const script of document.querySelectorAll('script')) assert(['assets/anchor.js','assets/settings.js','assets/toc.js','assets/header-scroll.js'].includes(script.getAttribute('src').split('?')[0]), `${file}: unexpected script`);
  assert.equal(document.querySelectorAll('script[src^="assets/settings.js"]').length, 1, `${file}: reading preferences script`);
  assert.equal(document.getElementById('reader-settings').tagName.toLowerCase(), 'dialog', `${file}: native settings dialog`);
  assert.equal(document.querySelector('.reader-settings-help').textContent,'Preferences are saved in this browser.');
  assert(!/both papers|two papers|Paper Atelier/i.test(document.querySelector('.topbar').textContent));
  assert.equal(document.getElementById('reader-settings-open').getAttribute('aria-haspopup'), 'dialog');
  assert.equal(document.getElementById('reader-settings').getAttribute('aria-labelledby'), 'reader-settings-title');
  assert.equal(document.getElementById('reader-settings-reset').getAttribute('type'), 'button');
  assert.equal(document.getElementById('reader-settings-status').getAttribute('aria-live'), 'polite');
  for (const [name, values] of Object.entries({'reader-size':['small','medium','large'],'reader-font':['serif','sans'],'reader-theme':['light','dark']})) {
    const radios = [...document.querySelectorAll(`input[name="${name}"]`)];
    assert.deepEqual(radios.map(n=>n.getAttribute('value')), values);
    for (const radio of radios) assert(radio.closest('label') && radio.closest('fieldset').querySelector('legend'), `${file}: labeled grouped radio`);
  }
  assert(!/maximum-scale|minimum-scale|user-scalable/.test(document.querySelector('meta[name="viewport"]').getAttribute('content')), `${file}: browser zoom unrestricted`);
  assert(!document.querySelector('#mode-switch,script[src*="qa-observer"]'), `${file}: comparison UI removed`);
  stats.push({page:file, bytes:fs.statSync('docs/' + file).size, math:document.querySelectorAll('math').length, figures:document.querySelectorAll('figure').length});
}
for (const cssFile of ['assets/reader.css', 'assets/katex/katex.min.css']) {
  const css = fs.readFileSync('docs/' + cssFile, 'utf8');
  for (const match of css.matchAll(/url\(([^)]*)\)/g)) {
    const url = match[1].replace(/["']/g, '');
    assert(url.endsWith('.woff2'), `${cssFile}: only WOFF2 font assets`);
    local(url, cssFile);
  }
}
function scientificText(document) {
  const article = document.querySelector('article').cloneNode(true);
  for (const element of article.querySelectorAll('.rendered-math,.fallback-math,.semantic-unit,math,script,summary,img,object,.ltx_authors,.paper-author-header,.paper-affiliations,.paper-contact-notes,.ltx_title > .ltx_tag')) element.remove();
  // The only approved source-text presentation change is this standalone label.
  for (const heading of article.querySelectorAll('.ltx_title_acknowledgements')) {
    if (heading.textContent === 'Acknowledgements.') heading.textContent = 'Acknowledgements';
  }
  return article.textContent.replace(/\s+/g, ' ').trim();
}
for (const paper of provenance) {
  const sourceBytes = fs.readFileSync(paper.snapshot);
  assert.equal(sha256(sourceBytes), paper.snapshotSha256, `${paper.slug}: source integrity`);
  const source = parseHTML(sourceBytes.toString()).document;
  const output = documents.get(`${paper.slug}.html`);
  const report = audit.papers.find(p => p.paper === paper.slug);
  const header = require('./header-format.cjs').manifests[paper.slug];
  const normalized = node => node.textContent.replace(/\s+/g, ' ').trim();
  assert.equal(output.querySelectorAll('details.author-details').length, 0);
  assert.deepEqual([...output.querySelectorAll('.paper-author-list .ltx_personname')].map(normalized), header.authors.map(a=>a[0]));
  assert.deepEqual([...output.querySelectorAll('.paper-affiliation-text')].map(normalized), header.affiliations);
  assert.deepEqual([...output.querySelectorAll('.paper-contact-notes a[href^="mailto:"]')].map(a=>a.getAttribute('href')), header.authors.filter(a=>a[3]).map(a=>'mailto:'+a[3]));
  for(const [i, author] of [...output.querySelectorAll('.paper-author-list .ltx_creator')].entries()) assert.deepEqual([...author.querySelectorAll('.paper-author-markers a')].map(a=>a.textContent), [...header.authors[i][1].map(String), ...(header.authors[i][2]?[header.authors[i][2]]:[])]);
  for(const h of output.querySelectorAll('.paper-numbered-heading')) assert(/[.:]$/.test(h.querySelector('.ltx_tag').textContent.trim()));
  assert.equal(output.querySelector('.topbar a.home-link'), null, 'Reader Papers link removed');
  const acknowledgements = output.querySelector('.ltx_title_acknowledgements');
  assert.equal(acknowledgements.tagName, 'H2', 'Acknowledgements share section semantics');
  assert.equal(acknowledgements.textContent, 'Acknowledgements');
  assert.equal(acknowledgements.querySelector('.ltx_tag'), null, 'Acknowledgements remain unnumbered');
  assert(output.querySelector(`#reader-toc a[href="#${acknowledgements.parentNode.id}"]`), 'Acknowledgements are navigable');
  const protectedAncestor = node => node.closest('[translate="no"],.notranslate');
  for (const node of output.querySelectorAll('.ltx_personname,.paper-affiliation-text,.paper-contact-notes')) {
    assert(protectedAncestor(node), `${paper.slug}: author metadata is protected`);
  }
  const authorHeader = output.querySelector('.paper-author-header');
  assert.equal(authorHeader.getAttribute('translate'), 'no');
  assert(authorHeader.classList.contains('notranslate'));
  for (const heading of output.querySelectorAll('article h1,article h2,article h3,article h4,article h5,article h6')) {
    assert(!protectedAncestor(heading), 'Heading titles remain translatable');
    const label = heading.querySelector('.ltx_tag');
    if (label && !/^Appendix\s/.test(label.textContent)) {
      assert.equal(label.getAttribute('translate'), 'no');
      assert(label.classList.contains('notranslate'));
      const title = heading.querySelector('.paper-heading-text');
      assert(title && !protectedAncestor(title));
      const target = heading.id || heading.parentNode.id;
      for (const link of output.querySelectorAll(`aside a[href="#${target}"],#reader-toc a[href="#${target}"]`)) {
        assert(!protectedAncestor(link));
        assert.equal(link.querySelector('[translate="no"].notranslate').textContent, label.textContent.trim());
        assert.equal(normalized(link), normalized(heading));
      }
    }
  }
  for (const link of output.querySelectorAll(`aside a[href="#${acknowledgements.parentNode.id}"],#reader-toc a[href="#${acknowledgements.parentNode.id}"]`)) {
    assert.equal(link.textContent, 'Acknowledgements');
    assert(!protectedAncestor(link));
  }
  const abstractProse = document => {
    const abstract = document.querySelector('.ltx_abstract').cloneNode(true);
    for (const math of abstract.querySelectorAll('.rendered-math,.fallback-math,.semantic-unit,math')) math.remove();
    return abstract.textContent.replace(/\s+/g, ' ').trim();
  };
  assert.equal(abstractProse(output), abstractProse(source), 'Abstract wording unchanged');
  assert(!protectedAncestor(output.querySelector('.ltx_abstract')));
  for (const prose of output.querySelectorAll('article .ltx_para')) assert(!protectedAncestor(prose), 'Body prose remains translatable');
  assert.equal(output.querySelectorAll('a.all-papers-link[href="index.html"]').length,3);
  for (const link of output.querySelectorAll('a.all-papers-link')) assert.equal(link.textContent, '← Research Portfolio');
  assert.equal(output.querySelector('#reader-toc nav').firstElementChild.textContent,'← Research Portfolio');
  assert.equal(output.getElementById('reader-toc').tagName, 'DIALOG');
  assert.equal(output.querySelectorAll('#reader-toc-open').length, 1);
  assert.equal(output.querySelectorAll('#reader-toc nav a[href^="#"]').length, output.querySelectorAll('article h2,article h3').length);
  assert.equal(output.querySelectorAll('script[src^="assets/toc.js?v="]').length, 1);
  assert.equal(output.querySelectorAll('figure.table-single').length, paper.slug==='bswap'?3:2);
  assert.equal(output.querySelectorAll('figure.table-wide').length, paper.slug==='bswap'?0:2);
  for(const table of source.querySelectorAll('figure.ltx_table')){
    const actual=output.getElementById(table.id);
    assert.equal(actual.querySelectorAll('td').length,table.querySelectorAll('td').length);
    assert.equal(actual.querySelectorAll('th').length,table.querySelectorAll('th').length);
  }
  for(const normalization of report.normalizations){
    const math=output.getElementById(normalization.id);
    assert.equal(math.outerHTML,source.getElementById(normalization.id).outerHTML);
    assert.equal(math.parentNode.hidden,true);
    assert.equal(math.parentNode.getAttribute('aria-hidden'),'true');
    assert.equal(math.parentNode.parentNode.querySelector('.semantic-unit-text').textContent,normalization.text);
  }
  assert.equal(output.querySelectorAll('main > .notice').length,0);
  const sourceMath = [...source.querySelectorAll('math')];
  assert.equal(sourceMath.length, paper.mathCount);
  assert.equal(output.querySelectorAll('math').length, paper.mathCount, `${paper.slug}: all expressions retained`);
  assert.equal(output.querySelectorAll('.rendered-math').length, report.converted);
  assert.equal(output.querySelectorAll('.fallback-math').length, report.nativeFallbacks);
  assert.equal(report.converted + report.nativeFallbacks + report.semanticUnits, paper.mathCount);
  assert.equal(scientificText(output), scientificText(source), `${paper.slug}: scientific prose/captions/citations unchanged`);
  for (const original of source.querySelectorAll('[id]')) assert(output.getElementById(original.id), `${paper.slug}: source ID ${original.id} retained`);
  for (const math of sourceMath) {
    const actual = output.getElementById(math.id);
    assert(actual, `${paper.slug}: math ID ${math.id}`);
    const tex = math.querySelector('annotation[encoding="application/x-tex"]').textContent;
    assert.equal(actual.querySelector('annotation[encoding="application/x-tex"]').textContent, tex, `${paper.slug}:${math.id}: original TeX annotation retained`);
    if (actual.tagName.toLowerCase() === 'math') assert.equal(actual.outerHTML, math.outerHTML, `${paper.slug}:${math.id}: original fallback MathML byte serialization retained`);
  }
  for (const repair of repairs.filter(r => r.paper === paper.slug)) {
    const actual = output.getElementById(repair.id);
    assert(actual.classList.contains('rendered-math'));
    assert(actual.getAttribute('data-math-repair')); 
    const entry = report.repairs.find(r => r.id === repair.id);
    assert.equal(entry.originalTex, repair.originalTex);
    assert(entry.ruleVersion);
    assert.equal(entry.legacy, repair.paper === 'bswap');
    if (entry.legacy) assert.equal(entry.renderInput,repair.renderInput);
  }
  assert.equal(output.querySelectorAll('img').length, paper.figures.length);
  for (const figure of paper.figures) {
    assert.equal(sha256(fs.readFileSync('docs/' + figure.file)), figure.sha256, `Figure integrity: ${figure.file}`);
    const img = [...output.querySelectorAll('img')].find(node => node.getAttribute('src') === figure.file);
    assert(img, `Figure: ${figure.file}`);
    assert(Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0, `Intrinsic figure dimensions: ${figure.file}`);
  }
}
assert.deepEqual(audit.total, {math:1220, converted:1217, repaired:12, nativeFallbacks:0, semanticUnits:3});
assert.equal(repairs.length, 12);
assert.deepEqual(audit.papers.flatMap(p => p.normalizations.map(f => f.id)), ['S4.T1.m8','S4.T1.m10','A3.SS4.p1.m4']);
const readerCss = fs.readFileSync('docs/assets/reader.css','utf8');
assert(readerCss.includes('flex:none;min-width:44px;min-height:48px;padding:0 10px'), 'Compact equal-padding header controls retain separate touch targets');
assert(readerCss.includes('cite.ltx_cite{font-style:normal}'), 'Numeric citation labels upright');
assert(readerCss.includes('@media(max-width:350px){article section > .ltx_para > p.ltx_p{text-align:start}}'), 'Smallest viewport prose start-aligned');
assert(readerCss.includes('p.ltx_p{text-align:justify;'), 'Desktop prose justified');
for (const license of ['KaTeX','STIX-Two-Text','STIX-Two-Math']) assert(fs.statSync(`docs/assets/LICENSE-${license}.txt`).size > 500);
console.log(JSON.stringify({passed:true, pages:stats, math:audit.total, checks:['all local assets, links and fragments','unique and preserved source IDs','all original scientific prose and TeX annotations','11 generic structural compatibility repairs and 1 isolated legacy layout adapter','3 semantic unit normalizations with unchanged original MathML','37 byte-identical figures with intrinsic dimensions','mobile typography rules and upright citations','three-page public boundary']}, null, 2));

// Preferences have standalone source-level tests; generated controller must match.
assert.equal(fs.readFileSync('docs/assets/settings.js','utf8'), fs.readFileSync('settings.js','utf8'));
require('./settings-test.cjs');

for (const name of ['index.html','bswap.html','qubex.html']) { const html = fs.readFileSync('docs/'+name,'utf8'); assert(!/Paper Atelier|PAPER ATELIER|PHYSICS, WITH ROOM|Made for reading/.test(html), 'No promotional branding: '+name); }

for (const file of ["index.html","bswap.html","qubex.html"]) {
 const html=fs.readFileSync(`docs/${file}`,"utf8");
 assert(/assets\/reader\.css\?v=[a-f0-9]{12}/.test(html), `${file}: CSS must be content-versioned`);
}

for (const file of ["bswap.html","qubex.html"]) {
 const {document}=parseHTML(fs.readFileSync(`docs/${file}`,"utf8"));
 const other=file==="bswap.html"?"qubex.html":"bswap.html";
 assert(![...document.querySelectorAll(".topbar a")].some(a=>a.getAttribute("href")===other), `${file}: no cross-paper navigation`);
}

assert.deepEqual(audit.papers.map(p=>p.layoutAdjustments.length), [47,1]);
for(const paper of audit.papers){
 const doc=documents.get(`${paper.paper}.html`);
 for(const item of paper.layoutAdjustments){
  const node=doc.getElementById(item.id);
  assert(node.classList.contains('relation-start'));
  assert(node.closest('td.ltx_align_left') && node.closest('.ltx_eqn_table'));
 }
}
assert(readerCss.includes('article .katex{text-align-last:auto}'));

for (const [paper,singles,wides] of [['bswap',15,3],['qubex',15,4]]) {
 const doc=documents.get(`${paper}.html`);
 assert.equal(doc.querySelectorAll('figure.figure-single').length,singles);
 assert.equal(doc.querySelectorAll('figure.figure-wide').length,wides);
 assert.equal(doc.querySelectorAll('figure.figure-pair').length,paper==='bswap'?3:0);
 assert(!doc.querySelector('.figure-float'));
}

// Static responsive thresholds; rendered viewport QA is a separate check.
require('./layout-test.cjs');

require('./header-scroll-test.cjs');
