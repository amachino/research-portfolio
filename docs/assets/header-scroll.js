/* Reader-only mobile navigation. No network, persistence, or scroll cancellation. */
(() => {
  'use strict';
  const header = document.querySelector('.reader-topbar');
  if (!header) return;
  const root = document.documentElement;
  const mobile = matchMedia('(max-width:900px)');
  const position = () => Math.max(0, Math.min(window.scrollY,
    Math.max(0, root.scrollHeight - window.innerHeight)));
  let last = position(), travel = 0, direction = 0, pending = false;
  const show = () => header.classList.remove('reader-header-hidden');
  const reset = () => { show(); last = position(); travel = 0; direction = 0; };
  const locked = () => header.contains(document.activeElement) || !!header.querySelector('dialog[open]');
  const measure = () => {
    root.style.setProperty('--reader-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    reset();
  };
  const update = () => {
    pending = false;
    const y = position(), delta = y - last;
    last = y;
    if (!mobile.matches || y <= header.getBoundingClientRect().height || locked()) {
      show(); travel = 0; direction = 0; return;
    }
    if (!delta) return;
    const next = Math.sign(delta);
    if (next !== direction) { direction = next; travel = 0; }
    travel += Math.abs(delta);
    // Downward travel needs stronger intent; a small upward gesture reveals TOC.
    if (travel >= (direction > 0 ? 32 : 8)) {
      header.classList.toggle('reader-header-hidden', direction > 0);
      travel = 0;
    }
  };
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }, {passive: true});
  header.addEventListener('focusin', reset);
  header.addEventListener('focusout', () => { last = position(); travel = 0; direction = 0; });
  for (const dialog of header.querySelectorAll('dialog')) dialog.addEventListener('close', reset);
  // showModal changes the open attribute; keep even programmatically opened UI visible.
  if (typeof MutationObserver === 'function') {
    new MutationObserver(reset).observe(header, {subtree: true, attributes: true, attributeFilter: ['open']});
  }
  window.addEventListener('hashchange', reset);
  window.addEventListener('pageshow', reset);
  window.addEventListener('resize', measure);
  mobile.addEventListener('change', reset);
  if (typeof ResizeObserver === 'function') new ResizeObserver(measure).observe(header);
  measure();
})();
