(() => {
  'use strict';
  const shell = document.querySelector('.scene-shell');
  const viewer = document.querySelector('#studio-model');
  const status = document.querySelector('#scene-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = [...document.querySelectorAll('[data-scene-control]')];
  if (shell && viewer) {
    let timer;
    const fail = () => {
      clearTimeout(timer);
      shell.classList.remove('is-ready');
      status.textContent = '앵두 스튜디오 · 정지 이미지';
      controls.forEach(button => { button.disabled = true; });
    };
    viewer.addEventListener('load', () => {
      clearTimeout(timer);
      shell.classList.add('is-ready');
      status.textContent = '드래그로 회전 · 두 손가락으로 확대';
      controls.forEach(button => { button.disabled = false; });
    });
    viewer.addEventListener('error', fail);
    const load = async () => {
      status.textContent = '3D 스튜디오 여는 중…';
      timer = setTimeout(fail, 20000);
      try { await import('./vendor/model-viewer.min.js'); } catch { fail(); }
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
      }, { rootMargin: '100px' });
      observer.observe(shell);
    } else { load(); }
    controls.forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.sceneControl;
      if (action === 'rotate') {
        viewer.autoRotate = !viewer.autoRotate;
        button.setAttribute('aria-pressed', String(viewer.autoRotate));
        button.setAttribute('aria-label', viewer.autoRotate ? '자동 회전 멈추기' : '자동 회전 시작');
        button.textContent = viewer.autoRotate ? 'Ⅱ' : '▷';
      } else if (action === 'reset') {
        viewer.cameraOrbit = '30deg 75deg 105%';
        viewer.cameraTarget = 'auto auto auto';
        viewer.jumpCameraToGoal();
      } else {
        const orbit = viewer.getCameraOrbit();
        const radius = orbit.radius * (action === 'in' ? 0.85 : 1.15);
        viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
      }
    }));
    const stopRotation = () => {
      if (!reducedMotion.matches) return;
      viewer.autoRotate = false;
      const button = controls.find(item => item.dataset.sceneControl === 'rotate');
      if (button) { button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', '자동 회전 시작'); button.textContent = '▷'; }
    };
    reducedMotion.addEventListener('change', stopRotation);
  }
  document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    const card = [...document.querySelectorAll('.web')].find(item => item.dataset.p === button.dataset.openProject);
    if (card && window.openPortfolioProject) window.openPortfolioProject(card, button);
  }));
  document.querySelectorAll('a[target="_blank"]').forEach(link => { link.rel = 'noopener noreferrer'; });
})();
