'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const css = fs.readFileSync(require('node:path').join(__dirname, 'reader.css'), 'utf8');
assert(css.includes('article{container-name:reader;container-type:inline-size}'));
const queries = [...css.matchAll(/@container reader \(min-width:calc\((\d+)em \+ (\d+)px\)\)/g)];
assert.equal(queries.length, 4, 'Figures, pair wrappers/cells, and tables share the same gate');
assert(!css.includes('@media(min-width:1200px)'), 'No viewport-only float switch remains');
const [em, extra] = queries[0].slice(1).map(Number);
for (const q of queries) assert.deepEqual(q.slice(1).map(Number), [em, extra]);
const floatRules = [...css.matchAll(/article figure\.(?:figure|table)-single\{float:right;width:([\d.]+)%;max-width:(\d+)px;margin:8px 0 24px (\d+)px;/g)];
assert.equal(floatRules.length, 2, 'Original single-column figure and table behavior stays paired');
const [percent, cap, gap] = floatRules[0].slice(1).map(Number);
assert.deepEqual(floatRules[1].slice(1).map(Number), [percent, cap, gap]);
const wraps = (width, font, supported = true) => supported && width >= em * font + extra;
for (const font of [14.5, 17, 18, 19, 20, 22, 25, 32]) {
  const threshold = em * font + extra;
  assert(!wraps(threshold - .01, font));
  assert(wraps(threshold, font));
  assert(wraps(threshold + .01, font));
  for (const width of [threshold, threshold + 100, threshold + 500]) {
    const remaining = width - Math.min(width * percent / 100, cap) - gap;
    assert(remaining >= 21.6 * font, 'At least 21.6 em of adjacent text');
    assert(!wraps(width, font, false), 'Unsupported-query fallback stays stacked');
  }
}
let cases = 0;
for (const viewport of [320, 390, 600, 768, 900, 1024, 1200, 1280, 1400, 1920, 2560]) {
  const article = viewport <= 480 ? viewport - 36 : viewport <= 900 ? Math.min(740, viewport - 48) : Math.min(920, Math.min(viewport, 1400) - viewport * .1 - 280);
  for (const size of ['small', 'medium', 'large']) {
    const font = viewport <= 600 ? {small:14.5, medium:17, large:20}[size] : {small:viewport <= 900 ? 18 : 19, medium:22, large:25}[size];
    if (viewport <= 900 || size === 'large') assert(!wraps(article, font), 'Phone/tablet and cramped Large layouts stack');
    if (viewport === 1200) assert(!wraps(article, font), '1200 px alone is insufficient');
    if (viewport === 1280 && size === 'small') assert(wraps(article, font));
    cases++;
  }
}
console.log(`${cases} static layout/font cases and boundary/fallback checks passed; not a browser-layout test.`);
