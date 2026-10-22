'use strict';
const {parseHTML} = require('linkedom');

// Public URL identity is independent of the immutable internal paper ID.
function titleSlug(title) {
  const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  validateSlug(slug, 'Generated title URL');
  return slug;
}
function validateSlug(slug, label) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 250)
    throw new Error(`${label}: expected a nonempty lowercase hyphenated URL slug of at most 250 characters; set an explicit urlSlug for unsupported or longer titles`);
}
function sourceTitle(html) {
  const title = parseHTML(html).document.querySelector('article h1');
  if (!title) throw new Error('Missing article title for initial URL generation');
  for (const br of title.querySelectorAll('br')) br.replaceWith(' ');
  return title.textContent.replace(/\s+/g, ' ').trim();
}
function initializeUrls(papers, readSnapshot) {
  // Stage and validate the entire registry before mutating metadata or writing output.
  const updated = papers.map(paper => ({...paper, urlSlug: paper.urlSlug === undefined
    ? titleSlug(sourceTitle(readSnapshot(paper.snapshot))) : paper.urlSlug}));
  const routes = new Map([['index', 'portfolio homepage']]);
  for (const paper of updated) {
    validateSlug(paper.slug, 'Internal paper ID');
    validateSlug(paper.urlSlug, `${paper.slug}: public URL`);
    for (const route of new Set([paper.slug, paper.urlSlug])) {
      if (routes.has(route)) throw new Error(`URL collision: ${route}.html (${routes.get(route)} and ${paper.slug}); choose a unique urlSlug before building`);
      routes.set(route, paper.slug);
    }
  }
  return {papers: updated, changed: papers.some((p,i) => p.urlSlug !== updated[i].urlSlug)};
}
function redirectPage(paper) {
  validateSlug(paper.urlSlug, 'Redirect destination');
  const target = `${paper.urlSlug}.html`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Article moved</title><script src="assets/paper-redirect.js" defer></script></head><body><p>This article has a title-based URL. <a id="paper-destination" href="${target}">Continue to the article</a>.</p><noscript><p>JavaScript is disabled. Follow the link above to open the article.</p></noscript></body></html>\n`;
}
function updateIndexLinks(html, papers) {
  const routes = new Map(papers.map(p => [`${p.slug}.html`, `${p.urlSlug}.html`]));
  return html.replace(/href="([^"]+)"/g, (attribute, href) => routes.has(href) ? `href="${routes.get(href)}"` : attribute);
}
module.exports = {titleSlug, sourceTitle, initializeUrls, redirectPage, updateIndexLinks};
