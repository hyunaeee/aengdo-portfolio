/* Home stage: the page scrolls through one step per featured project while the stage stays put.
   The middle object changes, the notes on the right come in line by line, and a click on a window
   swaps its recording for the live page. Below, rows of text appear as they scroll in. */
(() => {
 'use strict';
 const root = document.querySelector('[data-stg]');
 if (!root) return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pad = (n) => String(n).padStart(2, '0');
 const track = root.querySelector('.stg-track'), object = root.querySelector('.stg-object');
 const layers = [...root.querySelectorAll('[data-stg-layer]')], notes = [...root.querySelectorAll('[data-stg-note]')];
 const buttons = [...root.querySelectorAll('[data-stg-go]')];
 const bar = root.querySelector('.stg-progress i'), counter = root.querySelector('[data-stg-counter]');
 const N = layers.length;
 root.classList.add('is-live');
 let step = -1;

 // The desk scene: the still stays until the 3D model has loaded.
 const viewer = root.querySelector('model-viewer');
 if (viewer) {
  viewer.addEventListener('load', () => viewer.parentElement.classList.add('is-ready'));
  // The scene stays still until the visitor drags it: moving it automatically made the fine screen lettering and
  // the metal highlights shimmer.
  import('./vendor/model-viewer.min.js').then(() => { customElements.get('model-viewer').minimumRenderScale = 1; }).catch(() => {});
 }

 // Measured values: digits are drawn as 7-segment figures and count up once when their note comes in.
 const POLY = { a: '5,2 23,2 20,6 8,6', b: '24,3 26,6 26,21 24,23 21,20 21,7', c: '24,25 26,27 26,42 24,45 21,41 21,28', d: '5,46 23,46 20,42 8,42', e: '4,25 7,28 7,41 4,45 2,42 2,27', f: '4,3 7,7 7,20 4,23 2,21 2,6', g: '5,24 8,22 20,22 23,24 20,26 8,26' };
 const DIGIT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
 const d = (keys) => [...keys].map(k => 'M' + POLY[k].split(' ').join('L') + 'Z').join('');
 const GHOST = d('abcdefg');
 const esc = (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c);
 const lcd = (text) => `<span aria-hidden="true">${[...text].map(ch => /\d/.test(ch) ? `<svg class="stg-seg" viewBox="0 0 28 48"><path d="${GHOST}"/><path class="on" d="${d(DIGIT[ch])}"/></svg>` : esc(ch)).join('')}</span>`;
 root.querySelectorAll('[data-stg-value]').forEach(el => {
  el.dataset.value = el.textContent.trim();
  el.setAttribute('aria-label', el.dataset.value);
  el.innerHTML = lcd(el.dataset.value);
 });
 const countUp = (el) => {
  const target = el.dataset.value, nums = target.match(/\d[\d,.]*/g);
  if (reduced || !nums) return;
  const t0 = performance.now(), dur = 700;
  const tick = (now) => {
   const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
   let k = 0;
   el.innerHTML = lcd(target.replace(/\d[\d,.]*/g, () => {
    const raw = nums[k++], dec = (raw.split('.')[1] || '').length, v = parseFloat(raw.replace(/,/g, '')) * e;
    const s = dec ? v.toFixed(dec) : String(Math.round(v));
    return raw.includes(',') ? Number(s).toLocaleString('en-US') : s.padStart(raw.length, '0');
   }));
   if (p < 1) requestAnimationFrame(tick); else el.innerHTML = lcd(target);
  };
  requestAnimationFrame(tick);
 };

 const closeLive = (layer) => {
  const box = layer.querySelector('.stg-live');
  if (box) { box.remove(); layer.querySelector('.stg-screen').hidden = false; }
 };
 const show = (i) => {
  if (i === step) return;
  const first = step === -1; step = i;
  layers.forEach((el, k) => {
   el.classList.toggle('is-on', k === i);
   el.classList.toggle('is-past', k < i);
   const v = el.querySelector('video');
   if (k !== i) closeLive(el);
   if (!v) return;
   if (k === i) { if (!v.src) v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
   else v.pause();
  });
  notes.forEach((el, k) => el.classList.toggle('is-on', k === i));
  buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  if (i > 0 && !first) notes[i].querySelectorAll('[data-stg-value]').forEach(countUp);
  bar.style.width = (i / (N - 1) * 100) + '%';
  counter.textContent = `${pad(i)} / ${pad(N - 1)}`;
 };

 const wide = () => innerWidth > 900;
 const span = () => track.offsetHeight - innerHeight;
 const onScroll = () => {
  if (!wide()) return;
  const p = Math.max(0, Math.min(1, (scrollY - track.offsetTop) / span()));
  show(Math.min(N - 1, Math.floor(p * N + 0.02)));
 };
 const go = (i, smooth = true) => {
  if (wide()) scrollTo({ top: track.offsetTop + span() * (i + 0.4) / N, behavior: smooth && !reduced ? 'smooth' : 'auto' });
  else show(i);
 };
 addEventListener('scroll', onScroll, { passive: true });
 addEventListener('resize', onScroll);
 buttons.forEach((b, i) => b.addEventListener('click', () => go(i)));
 show(0);
 // A link straight to a project (#med-rag) starts on that step.
 const hashed = location.hash && layers.findIndex(el => el.id === location.hash.slice(1));
 if (hashed > 0) { history.scrollRestoration = 'manual'; requestAnimationFrame(() => go(hashed, false)); }
 else onScroll();

 // Clicking a window swaps the recording for the live page, laid out at desktop width and scaled to fit.
 object.addEventListener('click', (e) => {
  const screen = e.target.closest('.stg-screen[data-live]');
  if (!screen) return;
  const box = document.createElement('div'), frame = document.createElement('iframe');
  box.className = 'stg-live';
  frame.src = screen.dataset.live; frame.title = screen.getAttribute('aria-label');
  box.append(frame);
  screen.hidden = true; screen.after(box);
  const v = screen.querySelector('video');
  if (v) v.pause();
  const fit = () => { frame.style.transform = `scale(${box.clientWidth / 1280})`; };
  fit(); new ResizeObserver(fit).observe(box);
 });

 // Rows of text below the stage come in as they scroll into view.
 const rows = [...root.querySelectorAll('.stg-lists li')];
 const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const k = rows.indexOf(e.target) % 12;
  setTimeout(() => e.target.classList.add('in'), reduced ? 0 : k * 35);
  io.unobserve(e.target);
 }), { rootMargin: '0px 0px -8% 0px' });
 rows.forEach(r => io.observe(r));
 setTimeout(() => rows.forEach(r => r.classList.add('in')), 5000);   // never leave rows hidden if the observer does not report

 // A picture of the work follows the pointer over its row.
 const peek = root.querySelector('.stg-peek'), img = peek.querySelector('img'), lists = root.querySelector('.stg-lists');
 lists.addEventListener('pointermove', (e) => {
  const li = e.target.closest('li[data-stg-peek]');
  if (!li || e.pointerType === 'touch') { peek.classList.remove('is-on'); return; }
  if (img.getAttribute('src') !== li.dataset.stgPeek) img.src = li.dataset.stgPeek;
  peek.classList.add('is-on');
  peek.style.transform = `translate(${Math.min(innerWidth - 300, e.clientX + 24)}px, ${Math.min(innerHeight - 200, e.clientY + 16)}px)`;
 });
 lists.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
})();
