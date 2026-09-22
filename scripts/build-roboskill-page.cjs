const { project: p } = require('../assets/portfolio-roboskill.js');
const report = require('../robo-skill-lab/artifacts/latest/report.json');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = (v, lang) => typeof v === 'string' ? v : v?.[lang] || v?.ko || '';
const mean = (rows, key) => rows.reduce((s, e) => s + e[key], 0) / rows.length;
module.exports = function roboskillPage(lang) {
  const l = (ko, en) => lang === 'ko' ? ko : en;
  const local = path => '../../' + path;
  const href = link => `<a href="${esc(link.url)}">${esc(t(link.label, lang))} ↗</a>`;
  const episode = report.episodes.find(e => e.id === 'disturbance-0-closed_loop');
  const policies = [['open_loop', l('한 번 계획하고 밀기', 'Plan once, push once')], ['closed_loop', l('다시 관찰하고 수정하기', 'Observe again, revise the path')]];
  const cards = policies.map(([name, title]) => {
    const rows = report.episodes.filter(e => e.policy === name);
    const successes = rows.filter(e => e.success).length;
    const rate = successes / rows.length * 100;
    return `<article class="robo-policy ${name === 'closed_loop' ? 'closed' : ''}"><p class="robo-eyebrow">${name === 'closed_loop' ? 'CLOSED LOOP' : 'OPEN LOOP'}</p><h3>${title}</h3><p class="robo-policy-score"><strong>${successes}<span> / ${rows.length}</span></strong> ${l('성공', 'successful')}</p><div class="robo-bar-track" aria-hidden="true"><div class="robo-bar" style="width:${rate}%"></div></div><dl><div><dt>${l('평균 시뮬레이션 시간', 'Mean simulation time')}</dt><dd>${mean(rows, 'sim_time_s').toFixed(2)} s</dd></div><div><dt>${l('평균 최종 목표 거리', 'Mean final goal distance')}</dt><dd>${(mean(rows, 'final_distance_m') * 100).toFixed(2)} cm</dd></div></dl></article>`;
  }).join('');
  const comparison = `<div class="robo-comparison">${cards}</div><p class="robo-status">${l('2026.09.15 · 4조건 × 3 seed × 2전략. 제어기 개발에 사용한 24회이며 독립 평가셋이 아닙니다. 시간은 시뮬레이션상 작업 시간입니다.', 'Sep 15, 2026 · 4 conditions × 3 seeds × 2 strategies. These 24 development runs are not a held-out evaluation. Time is the simulated task duration.')}</p>`;
  const table = s => s.table ? `<div class="robo-table-wrap" role="region" aria-label="${esc(t(s.title, lang))}" tabindex="0"><table><thead><tr>${s.table.headers.map(h => `<th scope="col">${esc(t(h, lang))}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(row => `<tr>${row.map((v, i) => i ? `<td>${esc(t(v, lang))}</td>` : `<th scope="row">${esc(t(v, lang))}</th>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
  const sections = p.sections.map(s => `<section class="robo-section" id="${esc(s.id)}"><p class="robo-eyebrow">${esc(t(s.eyebrow, lang))}</p><h2>${esc(t(s.title, lang))}</h2>${(s.body || []).map(b => `<p>${esc(t(b, lang))}</p>`).join('')}${s.diagram ? `<ol class="robo-flow">${s.diagram.map((d, i) => `<li><span>0${i + 1}</span><strong>${esc(t(d.label, lang))}</strong><small>${esc(t(d.detail, lang))}</small></li>`).join('')}</ol>` : ''}${s.id === 'results' ? comparison : ''}${table(s)}${s.bullets ? `<ul>${s.bullets.map(b => `<li>${esc(t(b, lang))}</li>`).join('')}</ul>` : ''}${s.links ? `<div class="robo-evidence">${s.links.map(href).join('')}</div>` : ''}</section>`).join('');
  const poster = local('robo-skill-lab/artifacts/latest/mujoco.png');
  const replay = local('robo-skill-lab/artifacts/latest/replay.gif');
  return `<article class="robo-case">
    <div class="case-back"><a href="${local(lang === 'ko' ? 'portfolio.html#work' : 'en.html#work')}">← ${l('포트폴리오', 'Portfolio')}</a><span>08 / ROBOTICS CASE STUDY</span></div>
    <section class="robo-hero">
      <p class="robo-eyebrow">ROBOSKILL LAB · PHYSICS / CONTROL / EVALUATION</p>
      <div class="robo-hero-grid"><div><h1>${l('실패한 로봇은<br>어떻게 다시 움직일까?', 'When a robot misses,<br>what should it do next?')}</h1><p class="robo-lead">${l('지시를 실행하는 것에서, 결과를 확인하고 다시 시도하는 것까지.', 'From executing an instruction to checking the outcome and trying again.')}</p><p>${l('블록 하나를 목표까지 미는 작은 과제로, 물리적 오차와 실패 복구를 다룹니다. 만든 이유부터 실제 24회 실험과 다음 개선까지 공개합니다.', 'A small block-pushing task makes physical error and recovery measurable. Explore the motivation, 24 recorded experiments, and the next improvements.')}</p><div class="robo-actions"><a class="robo-button" href="#results">${l('실험 결과 보기', 'See the results')} ↓</a><a class="robo-button secondary" href="${local('robo-skill-lab/viewer/')}">${l('실행 기록 재생', 'Explore the replay')} ↗</a></div></div>
      <figure class="robo-media"><img id="robo-replay" src="${poster}" data-poster="${poster}" data-replay="${replay}" alt="${esc(t(p.image.alt, lang))}" width="960" height="720"><figcaption><span>${l('실제 MuJoCo 렌더 · 외력 후 복구', 'Actual MuJoCo render · recovery after a disturbance')}</span><button type="button" data-robo-play data-play-label="${l('실행 영상 재생', 'Play recorded run')}" data-stop-label="${l('정지 이미지로 보기', 'Show still image')}" aria-pressed="false" aria-controls="robo-replay">▶ ${l('실행 영상 재생', 'Play recorded run')}</button></figcaption><p class="robo-status">${l('외력 · seed 0 · 재계획', 'Disturbance · seed 0 · replans')} ${episode.replans}${l('회', '')} · ${l('최종 오차', 'final error')} ${(episode.final_distance_m * 100).toFixed(2)} cm</p></figure></div>
      <dl class="robo-meta"><div><dt>${l('프로젝트', 'Project')}</dt><dd>RoboSkill Lab · 2026.09</dd></div><div><dt>${l('구현', 'Implementation')}</dt><dd>Python · MuJoCo · NumPy · JavaScript</dd></div><div><dt>${l('현재 범위', 'Current scope')}</dt><dd>${l('규칙 제어 · 시뮬레이터 좌표 · 저장된 실행', 'Rule controller · simulator coordinates · recorded runs')}</dd></div></dl>
    </section>
    <div class="robo-stats">${p.metrics.map(m => `<div class="robo-stat"><span class="robo-stat-label">${esc(t(m.label, lang))}</span><strong class="robo-stat-number">${esc(m.value)}</strong><span class="robo-stat-note">${esc(t(m.note, lang))}</span></div>`).join('')}</div>
    <div class="robo-layout"><aside class="robo-toc"><p class="robo-eyebrow">THE CASE</p><nav aria-label="${l('사례 목차', 'Case contents')}">${p.sections.map(s => `<a href="#${esc(s.id)}">${esc(t(s.eyebrow, lang))}</a>`).join('')}<a href="#decisions">${l('설계 판단', 'Design decisions')}</a><a href="#limits">${l('현재 범위와 근거', 'Scope and evidence')}</a></nav></aside><div class="robo-body">${sections}
    <section id="decisions" class="robo-section"><p class="robo-eyebrow">DESIGN DECISIONS</p><h2>${l('구현하면서 지킨 세 가지 기준', 'Three principles behind the implementation')}</h2><div class="robo-decisions">${p.decisions.map((d, i) => `<article><span class="robo-eyebrow">0${i + 1}</span><h3>${esc(t(d.title, lang))}</h3><p>${esc(t(d.body, lang))}</p></article>`).join('')}</div></section>
    <section id="limits" class="robo-section robo-scope"><p class="robo-eyebrow">SCOPE / EVIDENCE</p><h2>${l('지금 증명한 것, 다음에 확인할 것', 'What is measured, and what comes next')}</h2><ul>${p.limitations.map(v => `<li>${esc(t(v, lang))}</li>`).join('')}</ul><div class="robo-evidence">${p.links.map(href).join('')}</div></section>
    </div></div>
    <div class="case-next"><span>${l('연결되는 작업', 'RELATED WORK')}</span><a href="../visioneye/${lang === 'ko' ? '' : 'en.html'}">VisionEye ↗</a></div>
  </article>`;
};
