'use strict';

// Author markers and institution order were checked against page 1 of each
// immutable arXiv v1 PDF, including the contact symbols. Do not infer a new
// numbering scheme from a changed HTML snapshot: fail instead for review.
const institutions = {
  engineeringScience: 'Graduate School of Engineering Science, The University of Osaka, Toyonaka, Osaka, Japan',
  quantumBiology: 'Center for Quantum Information and Quantum Biology, The University of Osaka, Toyonaka, Osaka, Japan',
  informationScience: 'Graduate School of Information Science and Technology, The University of Osaka, Suita, Osaka, Japan',
  quel: 'QuEL, Inc., Hachioji, Tokyo, Japan',
  etrees: 'e-trees.Japan, Inc., Hachioji, Tokyo, Japan',
  riken: 'RIKEN Center for Quantum Computing, Wako, Saitama, Japan',
  tokyo: 'Graduate School of Engineering, The University of Tokyo, Bunkyo-ku, Tokyo, Japan'
};
const manifests = {
  bswap: {
    sourcePdf: 'https://arxiv.org/pdf/2610.21936v1',
    affiliations: ['engineeringScience', 'quantumBiology', 'informationScience', 'quel', 'riken', 'tokyo'].map(key => institutions[key]),
    authors: [
      ['Akinori Machino', [1, 2], '∗', 'akinori.machino@qiqb.osaka-u.ac.jp'],
      ['Kazuhisa Ogawa', [2, 3]], ['Yuto Ikegai', [2]], ['Takafumi Miyanaga', [2]],
      ['Koichiro Ban', [3]], ['Nilton F. G. Filho', [1, 2]], ['Hidehisa Shiomi', [2]],
      ['Toshi Sumida', [4]], ['Shuhei Tamate', [5]], ['Yutaka Tabuchi', [5, 2]],
      ['Yasunobu Nakamura', [5, 6]], ['Makoto Negoro', [1, 2, 3], '†', 'negoro.makoto.qiqb@osaka-u.ac.jp']
    ],
    contactLabel: 'Contact author:'
  },
  qubex: {
    sourcePdf: 'https://arxiv.org/pdf/2606.13010v1',
    affiliations: ['engineeringScience', 'quantumBiology', 'quel', 'etrees', 'informationScience', 'riken', 'tokyo'].map(key => institutions[key]),
    authors: [
      ['Akinori Machino', [1, 2, 3], '∗', 'akinori.machino@qiqb.osaka-u.ac.jp'],
      ['Kazuhisa Ogawa', [2], '†', 'k-ogawa.qiqb@osaka-u.ac.jp'],
      ['Takefumi Miyoshi', [2, 3, 4]], ['Hidehisa Shiomi', [2, 3]], ['Shinichi Morisaka', [2, 3]],
      ['Ryo Matsuda', [1, 2]], ['Nilton F. G. Filho', [1, 2]], ['Koichiro Ban', [5]],
      ['Takafumi Miyanaga', [2]], ['Keisuke Koike', [4]],
      ['Ryutaro Ohira', [3], '‡', 'ohira@quel-inc.com'], ['Toshi Sumida', [3], '§', 'sumida@quel-inc.com'],
      ['Yoshinori Kurimoto', [3]], ['Yuuya Sugita', [3]], ['Yosuke Ito', [3]], ['Yasunari Suzuki', [6, 2]],
      ['Peter A. Spring', [6]], ['Shiyu Wang', [6]], ['Hiroto Mukai', [7, 6]], ['Arvind Mamgain', [6]],
      ['Shuhei Tamate', [6]], ['Yutaka Tabuchi', [6, 2]], ['Yasunobu Nakamura', [6, 7]],
      ['Makoto Negoro', [1, 2, 3, 5], '¶', 'negoro.makoto.qiqb@osaka-u.ac.jp']
    ],
    contactLabel: ''
  }
};
const normalize = value => value.replace(/\s+/g, ' ').trim();
const fail = (slug, detail) => { throw new Error(`Unverified author header (${slug}): ${detail}`); };

function contentWithoutLabel(element) {
  const clone = element.cloneNode(true);
  for (const label of clone.querySelectorAll('.ltx_contact_name')) label.remove();
  return normalize(clone.textContent);
}

function formatAuthors(document, article, slug) {
  const spec = manifests[slug];
  if (!spec) fail(slug, 'no PDF-verified author manifest');
  if (article.querySelector('.paper-author-header')) return;
  const authors = article.querySelector('.ltx_authors');
  if (!authors) fail(slug, 'missing authors');
  const nodes = [...authors.querySelectorAll('.ltx_creator.ltx_role_author')];
  if (nodes.length !== spec.authors.length) fail(slug, 'author count changed');
  const records = nodes.map((node, index) => {
    const [name, numbers, symbol, email] = spec.authors[index];
    if (normalize(node.querySelector('.ltx_personname')?.textContent || '') !== name) fail(slug, `author ${index + 1} changed`);
    const affiliations = [...node.querySelectorAll('.ltx_role_affiliation')];
    if (JSON.stringify(affiliations.map(contentWithoutLabel)) !== JSON.stringify(numbers.map(n => spec.affiliations[n - 1]))) fail(slug, `${name}: affiliation text or order changed`);
    const emails = [...node.querySelectorAll('.ltx_role_email')];
    if (emails.length !== (email ? 1 : 0)) fail(slug, `${name}: contact count changed`);
    if (email && (emails[0].querySelector('a')?.getAttribute('href') !== `mailto:${email}` || contentWithoutLabel(emails[0]) !== email)) fail(slug, `${name}: contact changed`);
    if ([...node.querySelectorAll('.ltx_contact')].some(contact => !affiliations.includes(contact) && !emails.includes(contact))) fail(slug, `${name}: unrecognized contact type`);
    return {node, name, numbers, symbol, email, affiliations, contact: emails[0]};
  });

  const header = document.createElement('div');
  header.className = 'paper-author-header notranslate';
  header.setAttribute('translate', 'no');
  header.setAttribute('data-header-source', spec.sourcePdf);
  authors.parentNode.insertBefore(header, authors);
  header.appendChild(authors);
  authors.classList.add('paper-author-list');
  const affiliationList = document.createElement('div');
  affiliationList.className = 'paper-affiliations';
  affiliationList.setAttribute('role', 'group');
  affiliationList.setAttribute('aria-label', 'Author affiliations');
  header.appendChild(affiliationList);
  const contacts = document.createElement('div');
  contacts.className = 'paper-contact-notes';
  contacts.setAttribute('role', 'group');
  contacts.setAttribute('aria-label', 'Author contact notes');
  header.appendChild(contacts);

  // Move canonical source nodes, retaining their exact affiliation text and
  // original mailto anchors. Only the renderer-added "Affiliation:" / "Email:"
  // labels are removed; the bSWAP PDF's "Contact author:" wording is retained.
  const canonical = new Map();
  for (let i = 0; i < spec.affiliations.length; i++) {
    const number = i + 1;
    const record = records.find(r => r.numbers.includes(number));
    if (!record) fail(slug, `missing affiliation ${number}`);
    const source = record.affiliations[record.numbers.indexOf(number)];
    const row = document.createElement('div');
    row.className = 'paper-affiliation';
    row.id = `${slug}-affiliation-${number}`;
    const marker = document.createElement('sup');
    marker.className = 'paper-note-marker';
    marker.textContent = String(number);
    row.appendChild(marker);
    row.appendChild(source);
    source.classList.add('paper-affiliation-text');
    for (const label of source.querySelectorAll('.ltx_contact_name')) removeKeepingIds(label, row, document);
    affiliationList.appendChild(row);
    canonical.set(number, row);
  }
  let contactIndex = 0;
  for (const record of records) {
    const refs = document.createElement('sup');
    refs.className = 'paper-author-markers';
    const addRef = (label, target, accessibleName) => {
      if (refs.childNodes.length) refs.appendChild(document.createTextNode(','));
      const link = document.createElement('a');
      link.setAttribute('href', `#${target}`);
      link.setAttribute('aria-label', accessibleName);
      link.textContent = label;
      refs.appendChild(link);
    };
    for (const number of record.numbers) addRef(String(number), `${slug}-affiliation-${number}`, `Affiliation ${number}`);
    if (record.contact) {
      const row = document.createElement('div');
      row.className = 'paper-contact-note';
      row.id = `${slug}-contact-${++contactIndex}`;
      const marker = document.createElement('sup');
      marker.className = 'paper-note-marker';
      marker.textContent = record.symbol;
      row.appendChild(marker);
      row.appendChild(record.contact);
      for (const label of record.contact.querySelectorAll('.ltx_contact_name')) {
        if (!spec.contactLabel) removeKeepingIds(label, row, document);
        else if (normalize(label.textContent) !== spec.contactLabel) fail(slug, `${record.name}: contact label changed`);
      }
      contacts.appendChild(row);
      addRef(record.symbol, row.id, `Contact for ${record.name}`);
    }
    record.node.querySelector('.ltx_personname').after(refs);
    for (const notes of [...record.node.querySelectorAll('.ltx_author_notes')]) {
      // Duplicate affiliation entries are replaced by the canonical rows. Keep
      // any original IDs as zero-text anchors, so source deep links still work.
      for (const affiliation of record.affiliations) {
        if (notes.contains(affiliation)) removeKeepingIds(affiliation, canonical.get(record.numbers[record.affiliations.indexOf(affiliation)]), document);
      }
      removeKeepingIds(notes, record.node, document);
    }
  }
}

function removeKeepingIds(element, target, document) {
  const ids = [element, ...element.querySelectorAll('[id]')].filter(node => node.id).map(node => node.id);
  element.remove();
  for (const id of ids) {
    const anchor = document.createElement('span');
    anchor.id = id;
    anchor.className = 'paper-source-anchor';
    target.appendChild(anchor);
  }
}

function formatHeadings(document, article) {
  let count = 0;
  for (const heading of article.querySelectorAll('h2,h3,h4,h5,h6')) {
    const tag = [...heading.children].find(child => child.classList.contains('ltx_tag'));
    if (!tag || heading.classList.contains('paper-numbered-heading')) continue;
    const original = normalize(tag.textContent);
    // Preserve semantic labels (including HTML's II.1 and A.1). The PDF uses
    // different subsection labels; changing those would change references.
    let formatted;
    if (/^Appendix\s+[A-Z](?:\.|:)?$/.test(original)) formatted = original.replace(/[.:]?$/, ':');
    else if (/^(?:[IVXLCDM]+|[A-Z]|\d+)(?:\.\d+)*\.?$/.test(original)) formatted = original.replace(/\.?$/, '.');
    else continue;
    const children = [...heading.childNodes];
    const index = children.indexOf(tag);
    // Known source labels start each heading. Do not reorder an unknown form.
    if (children.slice(0, index).some(node => normalize(node.textContent))) throw new Error(`Unsupported heading prefix: ${heading.textContent}`);
    const title = document.createElement('span');
    title.className = 'paper-heading-text';
    for (const child of children.slice(index + 1)) title.appendChild(child);
    tag.setAttribute('data-original-label', original);
    // Keep a real space for accessible text and the text-only table of contents.
    tag.textContent = `${formatted} `;
    // Protect numbering, not the section title or the word 'Appendix'.
    if (!/^Appendix\s/.test(original)) {
      tag.setAttribute('translate', 'no');
      tag.classList.add('notranslate');
    }
    heading.appendChild(title);
    heading.classList.add('paper-numbered-heading');
    count++;
  }
  return count;
}

function formatPaperHeader(document, article, paperSlug) {
  const sourceIds = [...article.querySelectorAll('[id]')].map(node => node.id);
  formatAuthors(document, article, paperSlug);
  // LaTeXML's acknowledgement h6 is a top-level back-matter section, not
  // a sixth-level subsection. Preserve attributes, children, and anchors.
  for (const old of article.querySelectorAll('h6.ltx_title_acknowledgements')) {
    const heading = document.createElement('h2');
    for (const attr of old.attributes) heading.setAttribute(attr.name, attr.value);
    while (old.firstChild) heading.appendChild(old.firstChild);
    old.replaceWith(heading);
  }
  // Only the standalone back-matter label loses its final punctuation.
  // Keep source snapshots, body prose, and all other headings unchanged.
  for (const heading of article.querySelectorAll('.ltx_title_acknowledgements')) {
    if (heading.textContent === 'Acknowledgements.' && heading.childNodes.length === 1 && heading.firstChild.nodeType === 3) {
      heading.firstChild.textContent = 'Acknowledgements';
    }
  }
  const headingsFormatted = formatHeadings(document, article);
  const ids = [...article.querySelectorAll('[id]')].map(node => node.id);
  const outputIds = new Set(ids);
  for (const id of sourceIds) {
    if (!outputIds.has(id)) throw new Error(`Source ID lost while formatting header: ${paperSlug}:${id}`);
  }
  if (ids.length !== outputIds.size) throw new Error(`Duplicate ID after formatting header: ${paperSlug}`);
  return {paper: paperSlug, authors: manifests[paperSlug].authors.length, affiliations: manifests[paperSlug].affiliations.length, contacts: manifests[paperSlug].authors.filter(author => author[3]).length, headingsFormatted};
}

module.exports = formatPaperHeader;
module.exports.manifests = manifests;
