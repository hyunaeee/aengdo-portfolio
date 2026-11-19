/* The identity lives in the portable 3D screen; the still and HTML remain usable without WebGL. */
(() => {
 'use strict';
 const viewer = document.querySelector('#studio-model');
 if (!viewer) return;
 const stage = viewer.closest('.studio-stage');
 const controls = document.querySelector('.studio-controls');
 const rest = viewer.getAttribute('camera-orbit');
 function fallback() {
  stage.classList.remove('is-ready');
  controls.hidden = true;
  viewer.setAttribute('tabindex', '-1');
 }
 viewer.addEventListener('load', () => {
  stage.classList.add('is-ready');
  controls.hidden = false;
  viewer.removeAttribute('tabindex');
 });
 viewer.addEventListener('error', fallback);
 // Zoom is on buttons only, so the wheel keeps scrolling the page.
 const zoom = (factor) => {
  const o = viewer.getCameraOrbit();
  viewer.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius * factor}m`;
 };
 document.querySelector('#studio-zoom-in').addEventListener('click', () => zoom(0.85));
 document.querySelector('#studio-zoom-out').addEventListener('click', () => zoom(1 / 0.85));
 document.querySelector('#studio-reset').addEventListener('click', () => {
  viewer.cameraOrbit = rest;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) viewer.jumpCameraToGoal();
 });
 // Hologram mind map: each card fades in, its line draws out from the display, and its text types in like code.
 const holo = document.querySelector('#holo');
 if (holo) {
  const svg = holo.querySelector('.holo-lines');
  const NS = 'http://www.w3.org/2000/svg';
  const cols = [...holo.querySelectorAll('.holo-col')].map(c => [...c.querySelectorAll('.holo-node')]);
  const order = [];
  for (let i = 0; i < Math.max(...cols.map(c => c.length)); i++) cols.forEach(c => c[i] && order.push(c[i]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // LCD lettering: digits and Latin letters are 14-segment figures whose unlit segments stay faintly visible,
  // the way a calculator or clock display looks. Hangul has no segment form, so it stays as plain monospace.
  const POLY = {
   a: '5,2 23,2 20,6 8,6', b: '24,3 26,6 26,21 24,23 21,20 21,7', c: '24,25 26,27 26,42 24,45 21,41 21,28', d: '5,46 23,46 20,42 8,42',
   e: '4,25 7,28 7,41 4,45 2,42 2,27', f: '4,3 7,7 7,20 4,23 2,21 2,6', g: '5,24 8,22 12.5,22 13.5,24 12.5,26 8,26', G: '14.5,24 15.5,22 20,22 23,24 20,26 15.5,26',
   i: '12.5,7 15.5,7 15.5,20 14,22 12.5,20', l: '12.5,28 14,26 15.5,28 15.5,41 12.5,41', h: '8,7 10,7 12,17 12,20 10.5,20 8,10', j: '20,7 18,7 16,17 16,20 17.5,20 20,10',
   k: '8,41 10,41 12,31 12,28 10.5,28 8,38', m: '20,41 18,41 16,31 16,28 17.5,28 20,38'
  };
  const GLYPH = {
   0: 'abcdef', 1: 'bc', 2: 'abdegG', 3: 'abcdG', 4: 'bcfgG', 5: 'acdfgG', 6: 'acdefgG', 7: 'abc', 8: 'abcdefgG', 9: 'abcdfgG',
   A: 'abcefgG', B: 'abcdGil', C: 'adef', D: 'abcdil', E: 'adefgG', F: 'aefgG', G: 'acdefG', H: 'bcefgG', I: 'adil', J: 'bcde', K: 'efgjm', L: 'def', M: 'bcefhj',
   N: 'bcefhm', O: 'abcdef', P: 'abefgG', Q: 'abcdefm', R: 'abefgGm', S: 'acdfgG', T: 'ail', U: 'bcdef', V: 'efkj', W: 'bcefkm', X: 'hjkm', Y: 'hjl', Z: 'adjk',
   '-': 'gG', '–': 'gG', '/': 'jk', '+': 'gGil'
  };
  const fig = (on, label, cls = '') => `<svg class="seg14${cls}" viewBox="0 0 28 48" role="img" aria-label="${label}">${Object.keys(POLY).map(k => `<polygon points="${POLY[k]}"${on.includes(k) ? ' class="on"' : 'hijklm'.includes(k) ? ' class="x"' : ''}/>`).join('')}</svg>`;
  const CURSOR = fig('abcdefgGiljhkm', '', ' cur');
  const seg = (text) => text.split(/(\s+)/).map(word => /^\s+$/.test(word) ? ' ' : `<span class="segrun">${[...word].map(ch => {
   const g = GLYPH[ch.toUpperCase()];
   return g ? fig(g, ch) : ch.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }).join('')}</span>`).join('');
  const all = [...holo.querySelectorAll('.holo-node')];
  holo.classList.add('holo-seg');
  const draw = () => {
   svg.textContent = '';
   if (getComputedStyle(svg).display === 'none') return;
   const b = holo.getBoundingClientRect(), st = stage.getBoundingClientRect();
   const cx = st.left + st.width / 2 - b.left, cy = st.top + st.height * 0.42 - b.top;
   svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
   order.forEach(n => {
    const r = n.getBoundingClientRect();
    const left = r.left + r.width / 2 < b.left + b.width / 2;
    const x = Math.round((left ? r.right : r.left) - b.left) + .5, y = Math.round(r.top + r.height / 2 - b.top) + .5;
    const k = order.filter(o => (o.getBoundingClientRect().left < b.left + b.width / 2) === left).indexOf(n);
    // leader line: out from the card, one 45-degree run, then level into its own port beside the display
    const dir = left ? 1 : -1, port = [[.19, -.07], [.19, .02], left ? [.265, .155] : [.235, .19]][Math.min(k, 2)];
    const ax = Math.round(cx - dir * st.width * port[0]) + .5, ay = Math.round(cy + st.height * port[1]) + .5;   // display edge, display edge, then the laptop or the Mac Studio
    const x1 = x + dir * 22, dy = ay - y, x2 = x1 + dir * Math.abs(dy);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', dir * (ax - x2) >= 0 ? `M${ax} ${ay} H${x2} L${x1} ${y} H${x}` : `M${ax} ${ay} L${x1} ${y} H${x}`);
    svg.append(path);
    // the line itself is a row of LCD segments (pointed bars), lit one after another from the device out to the card
    const total = path.getTotalLength(), segs = [];
    for (let at = 0; at < total - 3; at += 11) {
     const p0 = path.getPointAtLength(at), p1 = path.getPointAtLength(Math.min(at + 8.5, total));
     const dx = p1.x - p0.x, dy2 = p1.y - p0.y, len = Math.hypot(dx, dy2) || 1, ux = dx / len, uy = dy2 / len, nx = -uy * 1.35, ny = ux * 1.35, t = Math.min(1.8, len / 3);
     const bar = document.createElementNS(NS, 'polygon');
     bar.setAttribute('points', [[p0.x, p0.y], [p0.x + ux * t + nx, p0.y + uy * t + ny], [p1.x - ux * t + nx, p1.y - uy * t + ny], [p1.x, p1.y], [p1.x - ux * t - nx, p1.y - uy * t - ny], [p0.x + ux * t - nx, p0.y + uy * t - ny]].map(q => q.map(v => v.toFixed(1)).join(',')).join(' '));
     svg.append(bar);
     segs.push(bar);
    }
    n._segs = segs;
    if (n.classList.contains('on')) segs.forEach(el => el.classList.add('on'));
    const mark = (px, py, hollow) => { const q = document.createElementNS(NS, 'rect'); q.setAttribute('x', px - 3); q.setAttribute('y', py - 3); q.setAttribute('width', 6); q.setAttribute('height', 6); if (hollow) q.classList.add('hollow'); svg.append(q); return q; };
    n._line = [path, mark(x, y, false), mark(ax, ay, true)];
    if (n.classList.contains('on')) n._line.forEach(el => el.classList.add('on'));
   });
  };
  if (reduced) {
   order.forEach(n => n.classList.add('on'));
   holo.querySelectorAll('.holo-key, strong, .holo-line').forEach(el => { el.innerHTML = seg(el.classList.contains('holo-key') ? `0${all.indexOf(el.closest('.holo-node')) + 1} ${el.textContent}` : el.textContent); });
   draw();
  } else {
   const label = el => el.classList.contains('holo-key') ? `0${all.indexOf(el.closest('.holo-node')) + 1} ${el.textContent}` : el.textContent;
   const parts = order.map(n => [...n.querySelectorAll('.holo-key, strong, .holo-line')].map(el => [el, label(el)]));
   order.forEach(n => { n.style.minHeight = `${n.offsetHeight}px`; });
   parts.flat().forEach(([el]) => { el.textContent = ''; });
   holo.classList.add('is-live');
   draw();
   const type = (i) => new Promise(done => {
    const n = order[i];
    n.classList.add('on');
    n._line?.forEach(el => el.classList.add('on'));
    n._segs?.forEach((el, j) => setTimeout(() => el.classList.add('on'), j * 14));
    const queue = parts[i].slice();
    const next = () => {
     const item = queue.shift();
     if (!item) { n.classList.add('done'); return done(); }
     const [el, text] = item;
     let k = 0;
     el.classList.add('holo-caret');
     const tick = () => {
      el.innerHTML = seg(text.slice(0, ++k)) + (k < text.length ? CURSOR : '');
      if (k < text.length) setTimeout(tick, 30);
      else { el.classList.remove('holo-caret'); setTimeout(next, 140); }
     };
     tick();
    };
    setTimeout(next, 150 + (n._segs?.length || 0) * 14);
   });
   const run = async () => { for (let i = 0; i < order.length; i++) { type(i); await new Promise(r => setTimeout(r, 800)); } };
   let started = false;
   const start = () => { if (started) return; started = true; io.disconnect(); run(); };
   const io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) start(); }, { threshold: 0.2 });
   setTimeout(start, 4000);   // never leave the cards blank if the observer does not report (background tab, old browser)
   io.observe(holo);
  }
  addEventListener('resize', draw);
 }
 import('./vendor/model-viewer.min.js').then(() => {
  // Keep the small screen lettering sharp after the adaptive frame-rate check.
  customElements.get('model-viewer').minimumRenderScale = 1;
 }).catch(fallback);
})();
