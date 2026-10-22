'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseHTML } = require('linkedom');
const reader = require('@amachino/leaf-reader/reader');
const root = __dirname;
process.chdir(root);
const {initializeUrls, redirectPage, updateIndexLinks} = require('./paper-urls.cjs');
const registryPath = 'sources/provenance.json';
const registry = initializeUrls(JSON.parse(fs.readFileSync(registryPath, 'utf8')), file => fs.readFileSync(file, 'utf8'));
const provenance = registry.papers;
// Generate only missing public URLs, then persist them for all later builds.
if (registry.changed) fs.writeFileSync(registryPath, JSON.stringify(provenance, null, 2) + '\n');
const tableLayout = JSON.parse(fs.readFileSync('sources/table-layout.json', 'utf8'));
const figureLayout = JSON.parse(fs.readFileSync('sources/figure-layout.json', 'utf8'));
const reports = [];
const readerVersions = reader.writeAssets(path.resolve(root, 'docs/assets'));
const settingsMarkup = fs.readFileSync(reader.assetPath('settings.html'), 'utf8').trim();
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const readerSettingsVersion = readerVersions['settings.js'];
const readerCssVersion = readerVersions['reader.css'];
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), {recursive:true}); fs.copyFileSync(from, to); };

// No downloads during a build. The immutable source figures live in docs so
// they are versioned once, and are already at their final static asset URLs.
for (const paper of provenance) {
  const source = fs.readFileSync(paper.snapshot, 'utf8');
  if (sha256(source) !== paper.snapshotSha256) throw new Error(`Source snapshot changed: ${paper.slug}`);
  const { document } = parseHTML(source);
  const article = document.querySelector('article');
  for (const script of article.querySelectorAll('script')) script.remove();
  if (paper.slug === 'matsuda') {
    const placeholder = article.querySelector('.ltx_pubnotes_meta');
    if (placeholder?.textContent.replace(/\s+/g, ' ').trim() !== 'Preprint: APS/123-QED') throw new Error('Unexpected preprint identifier');
    placeholder.remove(); // REVTeX sample identifier, not scientific manuscript content.
  }
  // Native MathML fallback must retain its exact source presentation.
  for (const element of article.querySelectorAll('[style]')) if (!element.closest('math')) element.removeAttribute('style');
  for (const object of article.querySelectorAll('object[data]')) {
    const img = document.createElement('img');
    img.setAttribute('src', object.getAttribute('data'));
    img.setAttribute('alt', object.textContent.trim() || 'Scientific figure; see caption');
    for (const key of ['id', 'width', 'height', 'class']) if (object.hasAttribute(key)) img.setAttribute(key, object.getAttribute(key));
    object.replaceWith(img);
  }
  for (const img of article.querySelectorAll('img')) {
    const figure = paper.figures.find(f => f.source === img.getAttribute('src'));
    if (!figure) throw new Error(`Unregistered source figure: ${img.getAttribute('src')}`);
    const bytes = fs.readFileSync(`docs/${figure.file}`);
    if (sha256(bytes) !== figure.sha256) throw new Error(`Figure changed: ${figure.file}`);
    img.setAttribute('src', figure.file);
    let dimensions;
    if (figure.file.endsWith('.svg')) {
      const viewBox = bytes.toString().match(/viewBox=["']([^"']+)/);
      if (viewBox) dimensions = viewBox[1].trim().split(/[ ,]+/).map(Number).slice(2).map(v => Math.round(v * 100));
    } else if (/\.jpe?g$/i.test(figure.file)) {
      // Read baseline/progressive JPEG SOF dimensions without decoding or changing source bytes.
      if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Invalid JPEG');
      let offset = 2;
      while (offset + 8 < bytes.length) {
        if (bytes[offset++] !== 0xff) throw new Error('Invalid JPEG marker');
        while (bytes[offset] === 0xff) offset++;
        const marker = bytes[offset++];
        const length = bytes.readUInt16BE(offset);
        if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) { dimensions = [bytes.readUInt16BE(offset+5), bytes.readUInt16BE(offset+3)]; break; }
        if (length < 2) throw new Error('Invalid JPEG segment');
        offset += length;
      }
    } else if (figure.file.endsWith('.png')) dimensions = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
    if (!dimensions || !dimensions.every(n => Number.isFinite(n) && n > 0)) throw new Error(`Missing image dimensions: ${figure.file}`);
    img.setAttribute('width', String(dimensions[0]));
    img.setAttribute('height', String(dimensions[1]));
    img.setAttribute('data-intrinsic-ratio', dimensions.join('/'));
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  }
  for (const table of article.querySelectorAll('table')) {
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', table.className.includes('eqn') ? 'Equation; scroll horizontally if needed' : 'Table; scroll horizontally if needed');
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  }
  require('./header-format.cjs')(document, article, paper.slug);
  const figurePlan = figureLayout.papers[paper.slug];
  for (const figure of figurePlan.figures) {
    const node = article.querySelector(`[id="${figure.html_id}"]`);
    if (!node || !node.classList.contains('ltx_figure')) throw new Error(`Missing classified figure: ${paper.slug}:${figure.html_id}`);
    node.classList.add(figure.classification === 'two-column' ? 'figure-wide' : 'figure-single');
    node.setAttribute('data-original-column-span', figure.classification === 'two-column' ? '2' : '1');
  }
  for (const group of figurePlan.groups) article.querySelector(`[id="${group.html_id}"]`).classList.add('figure-pair');
  for(const table of tableLayout.papers[paper.slug].tables){
    const node=article.querySelector(`[id="${table.html_id}"]`);
    if(!node||!node.classList.contains('ltx_table'))throw new Error(`Missing classified table: ${table.html_id}`);
    node.classList.add(table.classification==='single-column'?'table-single':'table-wide');
    if(table.classification==='single-column' && [...node.querySelectorAll('tr')].some(row=>row.querySelectorAll('td,th').length>=7))node.classList.add('table-dense');
    node.setAttribute('data-original-column-span',table.classification==='single-column'?'1':'2');
  }
  const titleNode = article.querySelector('h1').cloneNode(true);
  for (const br of titleNode.querySelectorAll('br')) br.replaceWith(document.createTextNode(' '));
  const title = titleNode.textContent.replace(/\s+/g, ' ').trim();
  const report = require('./math-renderer.cjs')(document,article,paper);
  if (report.mathCount !== paper.mathCount) throw new Error(`Math count changed: ${paper.slug}`);
  const notice = paper.slug === 'matsuda' ? '<p class="notice edition-note">HTML based on <a href="https://arxiv.org/abs/2501.10710v2">arXiv:2501.10710v2</a> (11 September 2025), including supplementary material. · <a href="https://doi.org/10.1103/xw1s-dt16">Published article: Physical Review Research 8, L012003 (2026)</a>.</p>' : '';
  const output = reader.createPage({article,title,versions:readerVersions,
    homeHref:'index.html',homeLabel:'Research Portfolio',
    links:[{href:'https://arxiv.org/abs/'+paper.arxivId,label:'arXiv'}],noticeHtml:notice,
    footerHtml:'<p><a class="all-papers-link" href="index.html">← Research Portfolio</a></p>Content and figures from <a href="'+paper.url+'">arXiv '+paper.arxivId+'</a>. Original authors retain their rights. Presentation changed; scientific text and units preserved. <a href="NOTICE.md">Rights and notices</a>.'});
  fs.writeFileSync(`docs/${paper.urlSlug}.html`, output);
  if (paper.urlSlug !== paper.slug) fs.writeFileSync(`docs/${paper.slug}.html`, redirectPage(paper));
  reports.push(report);
}

// Shared Leaf writes the reader UI, local fonts, official copy-tex and licenses.
copy('paper-redirect.js', 'docs/assets/paper-redirect.js');
fs.writeFileSync('docs/index.html', updateIndexLinks(fs.readFileSync('index.html', 'utf8'), provenance).replace('<!-- reader-settings -->', settingsMarkup).replace('assets/reader.css', `assets/reader.css?v=${readerCssVersion}`).replace('assets/settings.js', `assets/settings.js?v=${readerSettingsVersion}`));
copy('NOTICE.md', 'docs/NOTICE.md');
copy('sources/figure-layout.json', 'docs/figure-layout.json');
copy('sources/table-layout.json', 'docs/table-layout.json');
fs.writeFileSync('docs/.nojekyll', '');
fs.writeFileSync('docs/math-audit.json', JSON.stringify({renderer: 'KaTeX 0.19.0 (JavaScript, build time)', input: 'Versioned arXiv HTML article snapshots and their original TeX annotations', papers: reports, total: {math: reports.reduce((n, p) => n + p.mathCount, 0), converted: reports.reduce((n, p) => n + p.converted, 0), repaired: reports.reduce((n, p) => n + p.repaired, 0), nativeFallbacks: reports.reduce((n, p) => n + p.nativeFallbacks, 0), semanticUnits: reports.reduce((n,p)=>n+p.semanticUnits,0)}}, null, 2) + '\n');
console.log(reports.map(({paper, mathCount, converted, repaired, nativeFallbacks}) => ({paper, mathCount, converted, repaired, nativeFallbacks})));
