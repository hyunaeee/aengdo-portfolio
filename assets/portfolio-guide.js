(() => {
  'use strict';
  const guide = document.querySelector('#portfolio-guide');
  const home = document.querySelector('.guide-home');
  const viewer = document.querySelector('#guide-model');
  const bubble = document.querySelector('#guide-bubble');
  const message = document.querySelector('#guide-message');
  const heading = document.querySelector('#guide-heading');
  const next = document.querySelector('#guide-next');
  const toggle = document.querySelector('#guide-toggle');
  const motion = document.querySelector('#guide-motion');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stops = [
    { id: 'about', label: '반가워요!', text: 'Hyunae Park의 작업실에 오신 걸 환영해요. 저는 안내를 맡은 체리예요. 대표 작업부터 함께 볼까요?', next: '같이 둘러보기 ↘' },
    { id: 'featured', label: '먼저, 대표 작업이에요.', text: '몸의 구조를 펼쳐 보는 Anatomy Atlas와, 병원 현장에 적용한 MED-RAG예요. 마음에 드는 카드를 눌러 보세요.', next: '전체 프로젝트 보기 ↓' },
    { id: 'projects', label: '관심 있는 분야를 골라 보세요.', text: '라이브 사이트만 모아 보거나 기술 이름으로 검색할 수 있어요. 카드에서는 기획과 구현 과정도 볼 수 있고요.', next: '콘텐츠 작업도 보기 ↓' },
    { id: 'creative', label: '이야기를 만드는 일도 해요.', text: '영상, 전시 이미지, 음악까지. 썸네일을 누르면 실제 작품으로 연결돼요.', next: '어떤 여정을 거쳤을까? ↓' },
    { id: 'experience', label: '뇌과학에서 AI까지.', text: '학교와 연구실, 개발 현장, 강의와 전시에서 쌓은 경험이에요. 아래에는 프로젝트에서 사용한 기술도 정리했어요.', next: '함께 이야기하기 ↓' },
    { id: 'contact', label: '함께할 다음 작업이 있나요?', text: '메일로 편하게 이야기해 주세요. 이 포트폴리오는 PDF로도 가져갈 수 있어요. 만나서 반가웠어요!', next: '처음으로 돌아가기 ↑' }
  ];
  let current = 0, loaded = false, expanded = true, paused = reducedMotion.matches, frame = 0, timeout;
  function syncPlayback() {
    if (!loaded) return;
    if (paused || document.hidden || document.body.classList.contains('pm-lock')) viewer.pause();
    else viewer.play();
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? '캐릭터 움직임 재생' : '캐릭터 움직임 멈추기');
    motion.textContent = paused ? '▷' : 'Ⅱ';
  }
  function setExpanded(value, returnFocus = false) {
    expanded = value;
    bubble.hidden = !value;
    guide.classList.toggle('is-collapsed', !value);
    toggle.setAttribute('aria-expanded', String(value));
    toggle.setAttribute('aria-label', value ? '캐릭터 안내 접기' : '캐릭터 안내 열기');
    toggle.textContent = value ? '안내 접기' : '안내 열기';
    if (returnFocus) toggle.focus({ preventScroll: true });
  }
  function wave() { if (loaded && !paused) { viewer.currentTime = 0; viewer.play(); } }
  function say(index) {
    current = index;
    heading.textContent = stops[index].label;
    message.textContent = stops[index].text;
    next.textContent = stops[index].next;
    document.querySelector('#guide-progress').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
    guide.dataset.stop = stops[index].id;
  }
  function updatePosition() {
    frame = 0;
    guide.classList.toggle('is-docked', home.getBoundingClientRect().bottom < 150);
    let index = 0;
    stops.forEach((stop, i) => {
      const section = document.getElementById(stop.id);
      if (section && section.getBoundingClientRect().top <= Math.min(250, innerHeight * 0.36)) index = i;
    });
    if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 8) index = stops.length - 1;
    if (index !== current) say(index);
  }
  function scrollUpdate() { if (!frame) frame = requestAnimationFrame(updatePosition); }
  function fallback() {
    clearTimeout(timeout); loaded = false; guide.classList.remove('is-ready'); motion.disabled = true;
    document.querySelector('#guide-render-status').textContent = '캐릭터 이미지로 안내 중';
  }
  if (guide && viewer) {
    say(0);
    toggle.addEventListener('click', () => setExpanded(!expanded));
    document.querySelector('#guide-close').addEventListener('click', () => setExpanded(false, true));
    document.querySelectorAll('[data-guide-open]').forEach(button => button.addEventListener('click', () => {
      setExpanded(true);
      if (!guide.classList.contains('is-docked')) home.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
      next.focus({ preventScroll: true }); wave();
    }));
    next.addEventListener('click', () => {
      document.getElementById(stops[(current + 1) % stops.length].id).scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      wave();
    });
    document.querySelector('#guide-greet').addEventListener('click', () => {
      setExpanded(true); heading.textContent = '다시 만나서 반가워요!';
      message.textContent = '저는 체리예요. 손을 흔들며 함께할게요! 아래 버튼을 누르면 다음 작업으로 안내해 드려요.'; wave();
    });
    motion.addEventListener('click', () => { paused = !paused; syncPlayback(); });
    reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncPlayback(); });
    document.addEventListener('visibilitychange', syncPlayback);
    new MutationObserver(syncPlayback).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    viewer.addEventListener('load', () => {
      clearTimeout(timeout); loaded = true; guide.classList.add('is-ready');
      const animations = viewer.availableAnimations;
      viewer.animationName = animations.find(name => /greeting/i.test(name)) || animations[0];
      viewer.currentTime = 0; motion.disabled = !animations.length;
      document.querySelector('#guide-render-status').textContent = animations.length ? '움직이는 3D 안내 캐릭터' : '3D 안내 캐릭터';
      syncPlayback();
    });
    viewer.addEventListener('error', fallback);
    timeout = setTimeout(fallback, 25000);
    import('./vendor/model-viewer.min.js').catch(fallback);
    window.addEventListener('scroll', scrollUpdate, { passive: true }); window.addEventListener('resize', scrollUpdate);
    updatePosition();
  }
  document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    const card = [...document.querySelectorAll('.web')].find(item => item.dataset.p === button.dataset.openProject);
    if (card && window.openPortfolioProject) window.openPortfolioProject(card, button);
  }));
  document.querySelectorAll('a[target="_blank"]').forEach(link => { link.rel = 'noopener noreferrer'; });
})();
