'use strict';
// Static hosting has no per-path HTTP redirects. replace avoids a Back loop;
// retain the complete query and source section ID, including encoded fragments.
const destination = document.getElementById('paper-destination');
const target = new URL(destination.getAttribute('href'), window.location.href);
target.search = window.location.search;
target.hash = window.location.hash;
destination.setAttribute('href', target.href);
window.location.replace(target.href);
