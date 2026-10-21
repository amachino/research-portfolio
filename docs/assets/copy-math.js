/* Leaf's copy handler uses preserved source TeX, never reconstructed glyphs. */
(function (scope, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.install(scope.document);
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const mathSelector = '.rendered-math,.fallback-math,.semantic-unit,.katex-display,.katex,math';
  const blocks = /^(ARTICLE|SECTION|DIV|P|H[1-6]|BLOCKQUOTE|UL|OL|LI|FIGURE|FIGCAPTION|PRE|TABLE)$/;
  const installed = new WeakSet();
  const elementFor = node => node && (node.nodeType === 1 ? node : node.parentElement);

  function sourceFor(root) {
    const math = root.localName === 'math' ? root : root.querySelector('math');
    const annotation = root.querySelector('annotation[encoding="application/x-tex"]');
    const tex = annotation ? annotation.textContent : math && math.getAttribute('alttext');
    if (typeof tex !== 'string' || !tex.trim()) return null;
    const display = root.matches('.katex-display') || !!root.querySelector('.katex-display') ||
      (math && math.getAttribute('display') === 'block');
    return {tex, display};
  }

  // Mutates only the detached copy. A null result leaves the browser in charge.
  function serializeFragment(fragment, document) {
    const holder = document.createElement('div');
    holder.appendChild(fragment);
    const roots = [...holder.querySelectorAll(mathSelector)].filter(node =>
      !node.parentElement.closest(mathSelector));
    if (!roots.length) return null;
    const sources = roots.map(sourceFor);
    if (sources.some(source => !source)) return null;
    const replacements = new WeakMap();
    roots.forEach((root, index) => {
      const {tex, display} = sources[index];
      const span = document.createElement('span');
      span.textContent = display ? '$$\n' + tex + '\n$$' : '$' + tex + '$';
      if (display) span.style.whiteSpace = 'pre-wrap';
      replacements.set(span, {text: span.textContent, display});
      root.replaceWith(span);
    });
    for (const node of holder.querySelectorAll('script,style,[hidden],[aria-hidden="true"]')) node.remove();

    let plain = '';
    function lineBreak(count) {
      plain = plain.replace(/[ \t]+$/, '');
      if (!plain) return;
      const existing = (plain.match(/\n*$/) || [''])[0].length;
      if (existing < count) plain += '\n'.repeat(count - existing);
    }
    function walk(node, preformatted = false) {
      const replacement = replacements.get(node);
      if (replacement) {
        if (replacement.display) lineBreak(2);
        plain += replacement.text;
        if (replacement.display) lineBreak(2);
        return;
      }
      if (node.nodeType === 3) {
        let text = node.nodeValue;
        if (!preformatted) {
          text = text.replace(/[\t\r\n ]+/g, ' ');
          if (!plain || /[ \n\t]$/.test(plain)) text = text.replace(/^ +/, '');
        }
        plain += text;
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toUpperCase();
      if (tag === 'BR') { lineBreak(1); return; }
      const block = blocks.test(tag);
      if (block) lineBreak(2);
      if (tag === 'TR') lineBreak(1);
      for (const child of node.childNodes) walk(child, preformatted || tag === 'PRE');
      if (tag === 'TD' || tag === 'TH') plain += '\t';
      if (tag === 'TR') lineBreak(1);
      if (block) lineBreak(2);
    }
    for (const child of holder.childNodes) walk(child);
    return {plain: plain.trim(), html: holder.innerHTML, mathCount: roots.length};
  }

  function mathRoot(node, article) {
    let root = null;
    for (let element = elementFor(node); element && element !== article; element = element.parentElement) {
      if (element.matches(mathSelector)) root = element;
    }
    return root;
  }

  function editable(node) {
    const element = elementFor(node);
    return !!element && (element.isContentEditable || !!element.closest('input,textarea'));
  }

  function install(document) {
    if (!document || installed.has(document)) return;
    installed.add(document);
    document.addEventListener('copy', event => {
      if (event.defaultPrevented || !event.clipboardData || editable(event.target) || editable(document.activeElement)) return;
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
      const original = selection.getRangeAt(0);
      if (editable(original.startContainer) || editable(original.endContainer)) return;
      const article = elementFor(original.startContainer)?.closest('article');
      if (!article || elementFor(original.endContainer)?.closest('article') !== article) return;
      try {
        const range = original.cloneRange();
        const start = mathRoot(range.startContainer, article);
        const end = mathRoot(range.endContainer, article);
        if (end) range.setEndAfter(end);
        if (start) range.setStartBefore(start);
        const result = serializeFragment(range.cloneContents(), document);
        if (!result) return;
        event.clipboardData.setData('text/plain', result.plain);
        event.clipboardData.setData('text/html', result.html);
        event.preventDefault();
      } catch (_) {
        // Unsupported DOM/clipboard behavior keeps the native copy operation.
      }
    });
  }
  return {install, serializeFragment};
});
