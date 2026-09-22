(() => {
  const button = document.querySelector('[data-robo-play]');
  const image = document.getElementById('robo-replay');
  if (!button || !image) return;
  function stop() {
    image.src = image.dataset.poster;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '▶ ' + button.dataset.playLabel;
  }
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return stop();
    image.src = image.dataset.replay;
    button.setAttribute('aria-pressed', 'true');
    button.textContent = '■ ' + button.dataset.stopLabel;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if(e.matches) stop(); });
})();
