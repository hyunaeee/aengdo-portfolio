(() => {
  'use strict';

  const language = document.body.dataset.language === 'en' ? 'en' : 'ko';
  const words = {
    ko: {
      loading: '게임을 불러오는 중이에요.',
      loadingButton: '불러오는 중',
      playing: '아이템을 끌어 같은 아이템에 놓아보세요.',
      inGame: '게임으로 돌아가기',
      retry: '다시 불러오기',
      slow: '연결이 조금 느려요. 기다리거나 다시 열기를 눌러주세요.',
      reopened: '저장된 진행을 유지하며 게임을 다시 불러옵니다.',
      village: '마을로 이동했어요. 지도를 끌어 여행해 보세요.',
      board: '합성 화면으로 이동했어요.',
      unsupported: '이 브라우저에서는 전체화면을 지원하지 않아요. 아래에서 새 탭으로 열어주세요.',
      fullscreenError: '전체화면을 열 수 없어요. 새 탭에서도 플레이할 수 있습니다.',
      fullscreen: '전체화면',
      exitFullscreen: '전체화면 닫기',
      unavailable: '게임을 불러오지 못했어요. 다시 열거나 새 탭에서 플레이해 주세요.'
    },
    en: {
      loading: 'Loading your little journey…',
      loadingButton: 'Loading',
      playing: 'Drag an item onto a matching one to merge.',
      inGame: 'Back to the game',
      retry: 'Try again',
      slow: 'This is taking a little longer. Keep waiting or choose Reopen.',
      reopened: 'Reopening the game with your saved progress.',
      village: 'You’re in the village. Drag the map to explore.',
      board: 'The merge board is ready.',
      unsupported: 'Full screen isn’t supported here. Use the new-tab link below.',
      fullscreenError: 'Couldn’t enter full screen. You can also play in a new tab.',
      fullscreen: 'Full screen',
      exitFullscreen: 'Exit full screen',
      unavailable: 'The game couldn’t load. Try Reopen or play in a new tab.'
    }
  }[language];
  const player = document.getElementById('player');
  const surface = document.getElementById('game-surface');
  const cover = document.getElementById('game-cover');
  const preview = surface.querySelector('.game-preview');
  const coverHint = document.getElementById('cover-hint');
  const message = document.getElementById('player-message');
  const live = document.getElementById('player-live');
  const startButtons = [...document.querySelectorAll('[data-start]')];
  const commandButtons = [...document.querySelectorAll('[data-command]')];
  const reopenButton = document.querySelector('[data-reopen]');
  const fullscreenButton = document.querySelector('[data-fullscreen]');
  const fullscreenLabel = document.querySelector('[data-fullscreen-label]');
  const gameURL = new URL('./game/index.html', location.href);
  gameURL.searchParams.set('lang', language);
  const gameDirectory = new URL('./game/', location.href);
  let frame = null;
  let state = 'idle';
  let waitingTimer = null;
  let initialBoardPending = true;
  let bridgeReady = false;

  function announce(text) {
    message.textContent = text;
  }

  function focusPlayer() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      player.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'});
    }
    if (state === 'running') frame?.focus({preventScroll: true});
  }

  function post(action, value) {
    if (!frame?.contentWindow || !bridgeReady) return false;
    const payload = {type: 'fall-in-korea-command', action};
    if (value !== undefined) payload.value = value;
    frame.contentWindow.postMessage(payload, location.origin);
    return true;
  }

  function setCoverButton(label, disabled) {
    const button = cover.querySelector('[data-start]');
    button.querySelector('span').textContent = label;
    button.disabled = disabled;
  }

  function beginLoading(isReopen = false) {
    clearTimeout(waitingTimer);
    state = 'loading';
    bridgeReady = false;
    player.classList.add('is-loading');
    player.classList.toggle('is-reloading', isReopen);
    cover.hidden = false;
    live.hidden = true;
    setCoverButton(words.loadingButton, true);
    coverHint.textContent = words.loading;
    announce(isReopen ? words.reopened : words.loading);
    for (const button of commandButtons) button.disabled = true;
    reopenButton.disabled = false;
    fullscreenButton.disabled = true;
    waitingTimer = setTimeout(() => {
      if (state !== 'loading') return;
      state = 'waiting';
      player.classList.remove('is-loading');
      setCoverButton(words.retry, false);
      coverHint.textContent = words.slow;
      announce(words.slow);
    }, 20000);
  }

  function showGame() {
    if (!frame) return;
    clearTimeout(waitingTimer);
    state = 'running';
    player.classList.remove('is-loading', 'is-reloading');
    player.classList.add('is-running');
    frame.hidden = false;
    cover.hidden = true;
    preview.hidden = true;
    live.hidden = false;
    for (const button of commandButtons) button.disabled = !bridgeReady;
    reopenButton.disabled = false;
    fullscreenButton.disabled = false;
    for (const button of startButtons) {
      if (!cover.contains(button)) button.firstChild.textContent = words.inGame;
    }
    announce(words.playing);
  }

  function launch() {
    if (state === 'running') return focusPlayer();
    if (state === 'loading') return focusPlayer();
    if (frame) return reopen();
    beginLoading();
    frame = document.createElement('iframe');
    frame.id = 'game-frame';
    frame.className = 'game-frame';
    frame.title = player.dataset.frameTitle;
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'same-origin');
    frame.addEventListener('load', () => {
      // The game sends ready after installing its message listener.
      // A plain load is only a fallback for a missing bridge.
      if (!bridgeReady) {
        setTimeout(() => {
          if (!bridgeReady && state === 'loading') {
            try {
              if (frame.contentDocument?.getElementById('app')?.childElementCount) showGame();
            } catch { /* Leave the retry UI visible if the document is inaccessible. */ }
          }
        }, 1500);
      }
    });
    frame.addEventListener('error', () => {
      clearTimeout(waitingTimer);
      state = 'waiting';
      player.classList.remove('is-loading');
      setCoverButton(words.retry, false);
      coverHint.textContent = words.unavailable;
      announce(words.unavailable);
    });
    // No iframe or game request exists before this explicit play action.
    frame.src = gameURL.href;
    surface.insertBefore(frame, cover);
    focusPlayer();
  }

  function reopen() {
    if (!frame) return launch();
    let currentURL = new URL(gameURL);
    try {
      const candidate = new URL(frame.contentWindow.location.href);
      if (candidate.origin === location.origin && candidate.pathname.startsWith(gameDirectory.pathname)) {
        currentURL = candidate;
      }
      const visibleLanguage = frame.contentDocument?.documentElement.lang;
      if (visibleLanguage === 'ko' || visibleLanguage === 'en') currentURL.searchParams.set('lang', visibleLanguage);
    } catch { /* Use the known same-origin game URL. */ }
    // Reload the document currently shown. Never clear saves or replay a remembered scene.
    initialBoardPending = false;
    beginLoading(true);
    frame.src = currentURL.href;
  }

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (!event.data || typeof event.data !== 'object' || event.data.type !== 'fall-in-korea-ready') return;
    bridgeReady = true;
    if (initialBoardPending) {
      initialBoardPending = false;
      post('language', language);
      post('board');
    }
    showGame();
  });

  for (const button of startButtons) button.addEventListener('click', launch);
  for (const button of commandButtons) {
    button.addEventListener('click', () => {
      const action = button.dataset.command;
      if (action !== 'home' && action !== 'board') return;
      if (post(action)) announce(action === 'home' ? words.village : words.board);
    });
  }
  reopenButton.addEventListener('click', reopen);

  fullscreenButton.addEventListener('click', async () => {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (active) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
        return;
      }
      const request = player.requestFullscreen || player.webkitRequestFullscreen;
      if (!request) return announce(words.unsupported);
      await request.call(player);
    } catch {
      announce(words.fullscreenError);
    }
  });
  function updateFullscreen() {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    fullscreenLabel.textContent = active ? words.exitFullscreen : words.fullscreen;
    fullscreenButton.setAttribute('aria-label', fullscreenLabel.textContent);
  }
  document.addEventListener('fullscreenchange', updateFullscreen);
  document.addEventListener('webkitfullscreenchange', updateFullscreen);
  window.addEventListener('pagehide', () => clearTimeout(waitingTimer));
})();
