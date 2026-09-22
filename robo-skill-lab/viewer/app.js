'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('replay-canvas');
  const ctx = canvas.getContext('2d');
  const state = { report: null, episode: null, policy: 'closed_loop', index: 0, playing: false, playbackTime: 0, previousTick: null, animationId: 0, request: 0, eventKey: '' };
  const number = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
  const setText = (id, value) => { $(id).textContent = value; };
  const finiteVector = (value, length) => Array.isArray(value) && value.length >= length && value.slice(0, length).every(Number.isFinite);
  const prettyScenario = (name) => ({ nominal: '기본 환경', disturbance: '외란 환경', slippery: '낮은 마찰', heavy: '무거운 블록', low_friction: '낮은 마찰', high_friction: '높은 마찰', heavy_object: '무거운 물체', lateral_disturbance: '횡방향 외란', perturbation: '외란 환경' })[name] || name;
  const prettyPhase = (phase) => ({ approach: 'APPROACH · 접근', push: 'PUSH · 밀기', replan: 'REPLAN · 재계획', done: 'DONE · 종료', observe: 'OBSERVE · 관찰', settle: 'SETTLE · 안정화', retreat: 'RETREAT · 후퇴', align: 'ALIGN · 정렬', complete: 'COMPLETE · 완료' })[phase] || String(phase || 'RECORDED FRAME');

  function validateReport(report) {
    if (!report || report.schema_version !== 1 || !Array.isArray(report.episodes)) throw new Error('지원하는 schema_version: 1 형식의 보고서가 아닙니다.');
    if (!report.engine || report.engine.name !== 'MuJoCo') throw new Error('MuJoCo 엔진의 실행 보고서만 재생할 수 있습니다.');
    if (!report.episodes.length) throw new Error('보고서에 에피소드가 없습니다. 벤치마크를 먼저 실행하세요.');
    const ids = new Set();
    for (const ep of report.episodes) {
      if (!ep || typeof ep.id !== 'string' || ids.has(ep.id) || !['open_loop', 'closed_loop'].includes(ep.policy) || typeof ep.scenario !== 'string' || typeof ep.success !== 'boolean') throw new Error('에피소드 식별자, 정책, 시나리오 또는 성공 여부가 올바르지 않습니다.');
      ids.add(ep.id);
      if (!ep.task || typeof ep.task.instruction !== 'string' || !ep.parameters || !['final_distance_m', 'sim_time_s', 'wall_time_s', 'contact_steps', 'replans'].every(key => Number.isFinite(ep[key]) && ep[key] >= 0)) throw new Error(`${ep.id}: 필수 측정값 또는 작업 정보가 없습니다.`);
      if (!Array.isArray(ep.trajectory) || !ep.trajectory.length || !Array.isArray(ep.events)) throw new Error(`${ep.id}: 궤적 또는 이벤트 형식이 올바르지 않습니다.`);
      let lastTime = -Infinity;
      for (const frame of ep.trajectory) {
        if (!frame || !Number.isFinite(frame.t) || frame.t < 0 || frame.t < lastTime || !finiteVector(frame.tool, 3) || !finiteVector(frame.goal, 2) || !frame.objects || !Object.values(frame.objects).every(position => finiteVector(position, 3))) throw new Error(`${ep.id}: 시간순으로 정렬된 유효한 좌표가 필요합니다.`);
        lastTime = frame.t;
      }
      if (!ep.events.every(event => event && Number.isFinite(event.t) && typeof event.message === 'string')) throw new Error(`${ep.id}: 이벤트 기록이 올바르지 않습니다.`);
    }
    return report;
  }

  function showStatus(message, error = false) {
    setText('load-status', message);
    $('load-status').classList.toggle('error', error);
  }

  function showLoadError(error) {
    if (!state.report) {
      $('empty-state').hidden = false;
      $('report-content').hidden = true;
    }
    showStatus(`${state.report ? '현재 기록은 유지합니다. ' : ''}${error.message}`, true);
  }

  function loadReport(report, source) {
    validateReport(report);
    pause();
    state.report = report;
    state.policy = report.episodes.some(ep => ep.policy === 'closed_loop') ? 'closed_loop' : 'open_loop';
    document.querySelectorAll('input[name="policy"]').forEach(input => {
      input.checked = input.value === state.policy;
      input.disabled = !report.episodes.some(ep => ep.policy === input.value);
    });
    $('empty-state').hidden = true;
    $('report-content').hidden = false;
    showStatus(`${source} · ${report.episodes.length}개 에피소드의 실제 실행 기록`);
    renderOverview();
    updateScenarios();
  }

  async function fetchReport() {
    const request = ++state.request;
    $('reload-report').disabled = true;
    showStatus('최신 벤치마크 보고서를 불러오는 중입니다…');
    try {
      const response = await fetch('../artifacts/latest/report.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('최신 보고서를 찾지 못했습니다. 벤치마크 실행 후 다시 불러오거나 JSON 파일을 선택하세요.');
      const report = await response.json();
      if (request === state.request) loadReport(report, 'artifacts/latest/report.json');
    } catch (error) {
      if (request !== state.request) return;
      if (error instanceof TypeError) error = new Error('최신 보고서에 접근할 수 없습니다. 로컬 HTTP 서버로 열거나 JSON 파일을 선택하세요.');
      if (error instanceof SyntaxError) error = new Error('보고서가 올바른 JSON 파일이 아닙니다.');
      showLoadError(error);
    } finally {
      if (request === state.request) $('reload-report').disabled = false;
    }
  }

  function renderOverview() {
    const report = state.report;
    const episodes = report.episodes;
    setText('total-episodes', number(episodes.length, 0));
    setText('run-description', `${new Set(episodes.map(ep => ep.scenario)).size}개 시나리오 · ${new Set(episodes.map(ep => ep.seed)).size}개 시드`);
    for (const [policy, prefix] of [['open_loop', 'open'], ['closed_loop', 'closed']]) {
      const runs = episodes.filter(ep => ep.policy === policy);
      const success = runs.filter(ep => ep.success).length;
      setText(`${prefix}-success`, runs.length ? `${number(success / runs.length * 100, 0)}%` : '—');
      setText(`${prefix}-description`, runs.length ? `${success} / ${runs.length} 성공 · 평균 거리 ${number(runs.reduce((sum, ep) => sum + ep.final_distance_m, 0) / runs.length * 100, 1)} cm` : '해당 정책의 실행 기록이 없습니다.');
      setText(`${prefix}-timing`, runs.length ? `평균 시뮬레이션 ${number(runs.reduce((sum, ep) => sum + ep.sim_time_s, 0) / runs.length, 2)} s` : '평균 시뮬레이션 시간 —');
    }
    setText('engine-name', report.engine.name);
    setText('engine-version', report.engine.version ? `Version ${report.engine.version} · recorded` : '버전 정보 없음 · recorded');
    const generated = new Date(report.generated_at);
    setText('report-date', Number.isNaN(generated.getTime()) ? '생성 시각 정보 없음' : `실험 생성 ${generated.toLocaleString('ko-KR')}`);
    const planner = report.planner || {};
    setText('planner-label', `Planner: ${planner.name || '정보 없음'} · ${planner.llm_executed === true ? 'LLM 실행됨' : planner.llm_executed === false ? 'LLM 실행 안 함' : 'LLM 실행 여부 없음'}`);
    setText('observation-label', `Observation: ${report.observation || '정보 없음'}`);
    const list = $('limitations');
    list.replaceChildren();
    const limitations = Array.isArray(report.limitations) && report.limitations.length ? report.limitations : ['보고서에 한계가 기록되어 있지 않습니다. 프로젝트 문서에서 실험 범위를 확인하세요.'];
    for (const value of limitations) {
      const li = document.createElement('li');
      li.textContent = String(value);
      list.append(li);
    }
  }

  function option(value, label) {
    const element = document.createElement('option');
    element.value = value;
    element.textContent = label;
    return element;
  }

  function updateScenarios() {
    const previous = $('scenario-select').value;
    const scenarios = [...new Set(state.report.episodes.filter(ep => ep.policy === state.policy).map(ep => ep.scenario))];
    $('scenario-select').replaceChildren(...scenarios.map(name => option(name, prettyScenario(name))));
    if (scenarios.includes(previous)) $('scenario-select').value = previous;
    updateEpisodes();
  }

  function updateEpisodes() {
    const previousSeed = state.episode?.seed;
    const episodes = state.report.episodes.filter(ep => ep.policy === state.policy && ep.scenario === $('scenario-select').value);
    $('episode-select').replaceChildren(...episodes.map(ep => option(ep.id, `Seed ${ep.seed} · ${ep.success ? '성공' : '미완료'}`)));
    const matched = episodes.find(ep => ep.seed === previousSeed);
    if (matched) $('episode-select').value = matched.id;
    selectEpisode();
  }

  function selectEpisode() {
    pause();
    state.episode = state.report.episodes.find(ep => ep.id === $('episode-select').value);
    const ep = state.episode;
    if (!ep) return;
    state.index = 0;
    state.playbackTime = ep.trajectory[0].t;
    state.eventKey = '';
    $('episode-result').classList.toggle('failed', !ep.success);
    setText('episode-result', ep.success ? '실험 성공' : '실험 실패');
    $('episode-result').title = ep.termination_reason ? `종료 사유: ${ep.termination_reason}` : '보고서의 성공 조건 판정 결과';
    setText('task-instruction', ep.task.instruction);
    const goal = ep.trajectory[ep.trajectory.length - 1].goal;
    setText('task-target', `${ep.task.object_name || '대상 정보 없음'} → goal (${number(goal[0], 3)}, ${number(goal[1], 3)}) m`);
    setText('final-distance', `${number(ep.final_distance_m * 100, 2)} cm`);
    setText('contact-steps', number(ep.contact_steps, 0));
    setText('replans', number(ep.replans, 0));
    setText('sim-time', `${number(ep.sim_time_s)} s`);
    setText('wall-time', `${number(ep.wall_time_s)} s`);
    const tags = [
      `마찰 ${number(ep.parameters.friction, 2)}`,
      `질량 ${number(ep.parameters.mass, 3)} kg`,
      `Seed ${ep.seed}`,
      `외란 ${ep.disturbance_applied === true ? '적용' : ep.disturbance_applied === false ? '미적용' : '정보 없음'}`,
      ...(ep.termination_reason && !ep.success ? [`종료: ${ep.termination_reason}`] : [])
    ];
    $('parameters').replaceChildren(...tags.map(tag => { const el = document.createElement('span'); el.textContent = tag; return el; }));
    $('timeline').max = String(ep.trajectory.length - 1);
    $('timeline').disabled = ep.trajectory.length < 2;
    $('play-button').disabled = ep.trajectory.length < 2;
    renderFrame();
  }

  function pause() {
    cancelAnimationFrame(state.animationId);
    state.playing = false;
    state.previousTick = null;
    setText('play-button', '▶');
    $('play-button').setAttribute('aria-label', '기록 재생');
  }

  function play() {
    if (!state.episode || state.episode.trajectory.length < 2) return;
    if (state.playing) { pause(); return; }
    if (state.index >= state.episode.trajectory.length - 1) {
      state.index = 0;
      state.playbackTime = state.episode.trajectory[0].t;
    }
    state.playing = true;
    state.previousTick = null;
    setText('play-button', 'Ⅱ');
    $('play-button').setAttribute('aria-label', '기록 일시 정지');
    state.animationId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.playing) return;
    if (state.previousTick !== null) state.playbackTime += Math.min((now - state.previousTick) / 1000, 0.25) * Number($('play-speed').value);
    state.previousTick = now;
    const frames = state.episode.trajectory;
    while (state.index < frames.length - 1 && frames[state.index + 1].t <= state.playbackTime) state.index++;
    renderFrame();
    if (state.index >= frames.length - 1) pause();
    else state.animationId = requestAnimationFrame(tick);
  }

  function renderFrame() {
    if (!state.episode) return;
    const frame = state.episode.trajectory[state.index];
    const end = state.episode.trajectory[state.episode.trajectory.length - 1].t;
    $('timeline').value = String(state.index);
    $('timeline').setAttribute('aria-valuetext', `${number(frame.t)}초 / ${number(end)}초`);
    setText('play-time', `${number(frame.t)} / ${number(end)} s`);
    setText('frame-phase', prettyPhase(frame.phase));
    renderEvents(frame.t);
    drawScene(frame);
  }

  function renderEvents(time) {
    const events = state.episode.events.filter(event => event.t <= time).slice().sort((a, b) => a.t - b.t);
    const key = `${state.episode.id}:${events.length}`;
    if (key === state.eventKey) return;
    state.eventKey = key;
    const list = $('event-list');
    list.replaceChildren(...events.map(event => {
      const li = document.createElement('li');
      const timestamp = document.createElement('time');
      timestamp.textContent = `${number(event.t)} s${event.type ? ` · ${event.type}` : ''}`;
      const message = document.createElement('span');
      message.textContent = event.message;
      li.append(timestamp, message);
      return li;
    }));
    setText('event-count', `${events.length} / ${state.episode.events.length}`);
    $('no-events').hidden = events.length !== 0;
    list.scrollTop = list.scrollHeight;
  }

  function drawScene(frame) {
    if (!ctx) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = bounds.width;
    const height = bounds.height;
    if (!width || !height) return;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const side = Math.min(width - 66, height - 82);
    const left = (width - side) / 2;
    const top = (height - side) / 2 + 3;
    const scale = side / 0.9;
    const xy = ([x, y]) => [left + (x + 0.45) * scale, top + (0.45 - y) * scale];
    const line = (x1, y1, x2, y2, color, stroke = 1, dash = []) => { ctx.beginPath(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); };
    const text = (label, x, y, color = '#92a198', size = 9, align = 'left') => { ctx.fillStyle = color; ctx.font = `${size}px Arial, "Malgun Gothic", sans-serif`; ctx.textAlign = align; ctx.fillText(label, x, y); };
    ctx.fillStyle = '#f0f4eb';
    ctx.fillRect(left, top, side, side);
    ctx.strokeStyle = '#dfe6d9';
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, side, side);
    for (let step = -4; step <= 4; step++) {
      const [x, y] = xy([step / 10, step / 10]);
      line(x, top, x, top + side, '#e0e7dc', .7);
      line(left, y, left + side, y, '#e0e7dc', .7);
    }
    const [originX, originY] = xy([0, 0]);
    line(originX, top, originX, top + side, '#cad6c8', .9, [3, 4]);
    line(left, originY, left + side, originY, '#cad6c8', .9, [3, 4]);
    const labelSize = width < 380 ? 7 : 8;
    for (const value of [-.4, -.2, 0, .2, .4]) {
      const [x, y] = xy([value, value]);
      text(value.toFixed(1), x, top + side + 16, '#a0aca1', labelSize, 'center');
      text(value.toFixed(1), left - 9, y + 3, '#a0aca1', labelSize, 'right');
    }
    text('X / m', left + side + 3, top + side + 29, '#8f9e94', 8, 'right');
    text('Y / m', left - 2, top - 10, '#8f9e94', 8, 'left');

    // Rail outlines are a schematic; all moving positions below come from report frames.
    line(left - 8, top + 2, left - 8, top + side - 2, '#d0d9cf', 5);
    line(left + side + 8, top + 2, left + side + 8, top + side - 2, '#d0d9cf', 5);
    const [toolX, toolY] = xy(frame.tool);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, side, side);
    ctx.clip();
    line(left, toolY, left + side, toolY, '#cad4c879', 8);
    line(left, toolY, left + side, toolY, '#a8b8ac', .8);

    const targetName = state.episode.task.object_name;
    const paths = [{ name: targetName, color: '#dd937973', tool: false }, { color: '#708a845e', tool: true }];
    for (const path of paths) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= state.index; i++) {
        const position = path.tool ? state.episode.trajectory[i].tool : state.episode.trajectory[i].objects[path.name];
        if (!position) continue;
        const [x, y] = xy(position);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.tool ? 1.5 : 2.5;
      ctx.setLineDash(path.tool ? [3, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const [goalX, goalY] = xy(frame.goal);
    const radius = 0.045 * scale;
    ctx.beginPath();
    ctx.arc(goalX, goalY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#6fa78b1f';
    ctx.fill();
    ctx.strokeStyle = '#719e86';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    line(goalX - 4, goalY, goalX + 4, goalY, '#71a088', .8);
    line(goalX, goalY - 4, goalX, goalY + 4, '#71a088', .8);
    text('GOAL · 4.5 cm', goalX, goalY + radius + 13, '#719c82', labelSize, 'center');

    for (const [name, position] of Object.entries(frame.objects)) {
      const [x, y] = xy(position);
      const half = Math.max(6, .025 * scale);
      const isBlue = name.includes('blue');
      ctx.fillStyle = '#233d4112';
      ctx.fillRect(x - half + 2, y - half + 3, half * 2, half * 2);
      ctx.fillStyle = isBlue ? '#6e8dbf' : '#e58b73';
      ctx.strokeStyle = isBlue ? '#5475a6' : '#ca735d';
      ctx.lineWidth = 1;
      ctx.fillRect(x - half, y - half, half * 2, half * 2);
      ctx.strokeRect(x - half, y - half, half * 2, half * 2);
      line(x - half + 2, y - half + 2, x + half - 2, y - half + 2, '#ffffff66', 1);
      text(name.replaceAll('_', ' ').toUpperCase(), x, y - half - 8, isBlue ? '#6684ab' : '#c27962', labelSize, 'center');
    }
    ctx.beginPath();
    ctx.arc(toolX, toolY, Math.max(5, .016 * scale), 0, Math.PI * 2);
    ctx.fillStyle = '#29444c';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(toolX, toolY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#a9bcb3';
    ctx.fill();
    text(`PUSHER · Z ${number(frame.tool[2], 2)} m`, toolX, toolY - 14, '#466561', labelSize, 'center');
    ctx.restore();
    const escaped = [frame.tool, ...Object.values(frame.objects)].some(position => Math.abs(position[0]) > .45 || Math.abs(position[1]) > .45);
    if (escaped) text('일부 물체가 XY 표시 범위를 벗어났습니다.', width / 2, top + side - 10, '#bd7059', 9, 'center');
  }

  $('reload-report').addEventListener('click', fetchReport);
  $('report-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const request = ++state.request;
    $('reload-report').disabled = false;
    showStatus(`${file.name} 읽는 중…`);
    try {
      const report = JSON.parse(await file.text());
      if (request === state.request) loadReport(report, file.name);
    } catch (error) {
      if (request === state.request) showLoadError(error instanceof SyntaxError ? new Error('올바른 JSON 파일을 선택하세요.') : error);
    }
    event.target.value = '';
  });
  document.querySelectorAll('input[name="policy"]').forEach(input => input.addEventListener('change', () => {
    if (!state.report) return;
    state.policy = input.value;
    updateScenarios();
  }));
  $('scenario-select').addEventListener('change', updateEpisodes);
  $('episode-select').addEventListener('change', selectEpisode);
  $('play-button').addEventListener('click', play);
  $('timeline').addEventListener('input', (event) => {
    pause();
    if (!state.episode) return;
    state.index = Number(event.target.value);
    state.playbackTime = state.episode.trajectory[state.index].t;
    renderFrame();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => renderFrame()).observe(canvas.parentElement);
  else window.addEventListener('resize', renderFrame);
  fetchReport();
})();
