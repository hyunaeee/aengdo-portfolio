/* Cherry is opt-in. The character model is requested only when the guide opens. */
(() => {
 'use strict';
 const guide = document.querySelector('#portfolio-guide');
 if (!guide) return;
 const viewer = document.querySelector('#guide-model');
 const heading = document.querySelector('#guide-heading');
 const message = document.querySelector('#guide-message');
 const next = document.querySelector('#guide-next');
 const motion = document.querySelector('#guide-motion');
 const close = document.querySelector('#guide-close');
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const en = document.documentElement.lang === 'en';
 const say = (ko, english) => en ? english : ko;
 const navButton = document.createElement('button');
 navButton.className = 'cherry-launcher';
 navButton.setAttribute('aria-label', say('체리 안내 열기', 'Open Cherry’s guide'));
 navButton.setAttribute('aria-controls', 'portfolio-guide');
 navButton.setAttribute('aria-expanded', 'false');
 navButton.innerHTML = '<img src="assets/hyunae-guide-poster.png" width="32" height="32" alt="">';
 document.querySelector('.nav-actions').prepend(navButton);
 const stops = [
  {id:'intro',heading:'Projects',message:say('프로젝트 목록으로 이동합니다.','Open the project list.'),label:'Projects',href:'#work'},
  {id:'work',heading:'MED-RAG',message:say('평가 결과와 QLoRA 실험을 확인할 수 있습니다.','Evaluation results and QLoRA experiments.'),label:say('평가 보기','View evaluation'),href:`work/med-rag/${en?'en.html':'index.html'}#evaluation`},
  {id:'terracotta',heading:'Terracotta',message:say('설계와 배포 정보를 확인할 수 있습니다.','Design and deployment details.'),label:say('설계 보기','View decisions'),href:`work/terracotta/${en?'en.html':'index.html'}#decisions`},
  {id:'meeting',heading:'Meeting Assistant',message:say('RTX 4090에서 운영 중인 회의 어시스턴트입니다.','Meeting assistant running on RTX 4090.'),label:say('운영 흐름 보기','View workflow'),href:`work/meeting/${en?'en.html':'index.html'}#architecture`},
  {id:'live',heading:'Anatomy Atlas',message:say('전체 구조와 계통 분해도를 전환할 수 있습니다.','Switch between whole-body and exploded views.'),label:say('라이브 열기','Open live site'),href:'https://anatomy-sample.vercel.app/'},
  {id:'about',heading:'Experience',message:say('경력, 연구, 학력과 활동 이력입니다.','Employment, research, education and activities.'),label:'History',href:en?'history-en.html':'history.html'},
  {id:'contact',heading:'Contact',message:say('이메일과 GitHub 링크입니다.','Email and GitHub links.'),label:'Email',href:'mailto:hyunaeee@gmail.com'}
 ];
 let loaded = false, expanded = false, paused = reduced.matches, current = -1, frame = 0, gestureTimer = 0;
 function stopMotion() {
  clearTimeout(gestureTimer);
  if (loaded) viewer.pause();
 }
 function idle() {
  if (!loaded || paused || !expanded || document.hidden) return stopMotion();
  viewer.animationName = 'Idle';
  viewer.play();
 }
 function gesture(name = 'GreetingLoop') {
  stopMotion();
  if (!loaded || paused || !expanded || document.hidden) return;
  viewer.animationName = viewer.availableAnimations.includes(name) ? name : 'Idle';
  viewer.currentTime = 0;
  viewer.play({repetitions:1});
  gestureTimer = setTimeout(idle, (viewer.duration || 4) * 1000 + 100);
 }
 function syncMotion() {
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? say('재생','Play') : say('일시정지','Pause');
  idle();
 }
 function update() {
  frame = 0;
  let index = 0;
  stops.forEach((s,i) => {
   const el = document.getElementById(s.id);
   if (el && el.getBoundingClientRect().top <= innerHeight * .34) index = i;
  });
  if (current === index) return;
  current = index;
  const s = stops[index];
  heading.textContent = s.heading;
  message.textContent = s.message;
  next.textContent = s.label + ' ↗';
  next.href = s.href;
  if (s.href.startsWith('http')) { next.target = '_blank'; next.rel = 'noopener noreferrer'; }
  else { next.removeAttribute('target'); next.removeAttribute('rel'); }
 }
 function setExpanded(value, restoreFocus = false) {
  expanded = value;
  guide.hidden = !value;
  navButton.setAttribute('aria-expanded', String(value));
  navButton.setAttribute('aria-label', value ? say('체리 안내 닫기','Close Cherry’s guide') : say('체리 안내 열기','Open Cherry’s guide'));
  if (value) {
   update();
   if (!viewer.hasAttribute('src')) viewer.src = viewer.dataset.src;
   gesture();
   close.focus({preventScroll:true});
  } else {
   stopMotion();
   if (restoreFocus) navButton.focus({preventScroll:true});
  }
 }
 navButton.addEventListener('click', () => setExpanded(!expanded));
 close.addEventListener('click', () => setExpanded(false, true));
 document.querySelector('#guide-greet').addEventListener('click', () => gesture());
 motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
 reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); });
 document.addEventListener('visibilitychange', syncMotion);
 document.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) setExpanded(false, true); });
 document.addEventListener('pointerdown', e => {
  if (expanded && !guide.contains(e.target) && !navButton.contains(e.target)) setExpanded(false);
 });
 viewer.addEventListener('load', () => {
  loaded = true;
  guide.classList.add('is-ready');
  motion.disabled = !viewer.availableAnimations.length;
  syncMotion();
  gesture();
 });
 function fallback() {
  stopMotion(); loaded = false;
  guide.classList.remove('is-ready'); motion.disabled = true;
  document.querySelector('#guide-render-status').textContent = say('캐릭터 이미지로 안내 중','Guide available as a still image');
 }
 viewer.addEventListener('error', fallback);
 import('./vendor/model-viewer.min.js').catch(fallback);
 window.addEventListener('scroll', () => { if (expanded && !frame) frame = requestAnimationFrame(update); }, {passive:true});
 syncMotion(); update();
})();
