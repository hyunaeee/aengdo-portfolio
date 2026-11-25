/* White gallery skin: project windows that play a recording and open into details and the live demo,
   archive windows that open on demand, and LCD segment lettering for anything marked data-lcd. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

 // ── LCD lettering: digits and Latin letters become 14-segment figures; Hangul stays as monospace text.
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
 const path = (keys) => [...keys].map(k => 'M' + POLY[k].split(' ').join('L') + 'Z').join('');
 const GHOST = path(Object.keys(POLY).join(''));
 const fig = (keys) => `<svg class="seg14" viewBox="0 0 28 48"><path d="${GHOST}"/><path class="on" d="${path(keys)}"/></svg>`;
 const escape = (c) => c.replace(/[&<>]/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]));
 const seg = (text) => text.split(/(\s+)/).map(word => /^\s+$/.test(word) ? ' ' : `<span class="segrun">${[...word].map(ch => {
  const g = GLYPH[ch.toUpperCase()];
  return g ? fig(g) : escape(ch);
 }).join('')}</span>`).join('');
 document.querySelectorAll('[data-lcd]').forEach(el => {
  const text = el.textContent.trim();
  if (!text) return;
  el.setAttribute('aria-label', text);
  if (!/^(H[1-6]|A|BUTTON|TIME)$/.test(el.tagName) && !el.hasAttribute('role')) el.setAttribute('role', 'text');
  el.innerHTML = `<span aria-hidden="true">${seg(text)}</span>`;
 });

 // ── Home: one window per project. The recording plays while the window is on screen;
 //    a click widens the window and shows the details, and from there the live demo can replace the recording.
 const reels = [...document.querySelectorAll('[data-reel]')];
 if (reels.length) {
  const play = (video, on) => {
   if (!video) return;
   if (on && !reduced) {
    if (!video.src) video.src = video.dataset.src;
    video.play().catch(() => {});
   } else video.pause();
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
   const item = e.target;
   item._seen = e.isIntersecting;
   play(item.querySelector('video'), e.isIntersecting && !item.classList.contains('is-live'));
  }), { threshold: 0.35 });
  reels.forEach(item => {
   const screen = item.querySelector('.reel-screen'), more = item.querySelector('.reel-more');
   const frame = item.querySelector('.reel-live'), liveBtn = item.querySelector('[data-reel-live]'), video = item.querySelector('video');
   const live = (on) => {
    if (!frame) return;
    item.classList.toggle('is-live', on);
    frame.hidden = !on;
    screen.hidden = on;
    if (on) { if (!frame.src) frame.src = frame.dataset.src; play(video, false); }
    else { frame.removeAttribute('src'); play(video, item._seen); }
    liveBtn.textContent = on ? liveBtn.dataset.on : liveBtn.dataset.off;
    liveBtn.setAttribute('aria-pressed', String(on));
   };
   const open = (on) => {
    item.classList.toggle('is-open', on);
    more.hidden = !on;
    screen.setAttribute('aria-expanded', String(on));
    if (!on) live(false);
    if (on) setTimeout(() => item.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), reduced ? 0 : 360);
   };
   screen.addEventListener('click', () => open(!item.classList.contains('is-open')));
   item.querySelector('[data-reel-close]').addEventListener('click', () => { open(false); screen.focus(); });
   if (liveBtn) liveBtn.addEventListener('click', () => live(!item.classList.contains('is-live')));
   // With reduced motion the recording does not autoplay, so the still frame stands in for it.
   io.observe(item);
  });
  // A link straight to a project (#med-rag) opens that window.
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target && target.matches('[data-reel]')) target.querySelector('.reel-screen').click();
 }

 // ── Archive: each card is a plain window; the text opens from the + button or the picture.
 document.querySelectorAll('.archive-card').forEach(card => {
  const btn = card.querySelector('.archive-toggle');
  if (!btn) return;
  const set = (on) => {
   card.classList.toggle('is-open', on);
   btn.setAttribute('aria-expanded', String(on));
   btn.firstElementChild.textContent = on ? '−' : '+';
  };
  set(card.classList.contains('is-open'));
  btn.addEventListener('click', () => set(!card.classList.contains('is-open')));
  const shot = card.querySelector(':scope > img');
  if (shot) shot.addEventListener('click', () => set(!card.classList.contains('is-open')));
  if (location.hash.slice(1) === card.id) set(true);
 });
})();
