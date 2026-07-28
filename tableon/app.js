/* ============ 공용 유틸 ============ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const won = (n) => '₩' + Number(n || 0).toLocaleString('ko-KR');
const wonShort = (n) => {
  n = Number(n || 0);
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return Math.round(n / 10000) + '만';
  return n.toLocaleString('ko-KR');
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let ME = null; // 로그인 사용자/테넌트/플랜 정보

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    showAuth();
    throw new Error(data.error || '로그인이 필요합니다.');
  }
  if (!res.ok) {
    if (data.code === 'plan_limit') {
      openUpgradeModal(data.error);
      const err = new Error(data.error);
      err.handled = true;
      throw err;
    }
    throw new Error(data.error || '요청 실패');
  }
  return data;
};

/* 토스트 */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
}

/* 모달 */
let modalOnOk = null;
function openModal(title, bodyHtml, onOk, okLabel = '저장') {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  $('#modal-ok').textContent = okLabel;
  modalOnOk = onOk;
  $('#modal-backdrop').classList.remove('hidden');
  const first = $('#modal-body input, #modal-body select');
  if (first) setTimeout(() => first.focus(), 50);
}
function closeModal() {
  $('#modal-backdrop').classList.add('hidden');
  $('.modal').classList.remove('wide');
  $('#modal-cancel').classList.remove('hidden');
  modalOnOk = null;
}
$('#modal-cancel').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
$('#modal-ok').addEventListener('click', async () => {
  if (!modalOnOk) return closeModal();
  try { await modalOnOk(); closeModal(); }
  catch (e) { if (!e.handled) toast(e.message, 'error'); else closeModal(); }
});

function confirmModal(title, desc, onOk, okLabel = '확인') {
  openModal(title, `<p class="modal-desc">${esc(desc)}</p>`, onOk, okLabel);
}

function openUpgradeModal(message) {
  openModal('요금제 업그레이드가 필요해요', `
    <p class="modal-desc">${esc(message)}</p>
  `, async () => { switchView('billing'); }, '요금제 보기');
}

const field = (id, label, value = '', type = 'text', attrs = '') =>
  `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${attrs} /></div>`;

/* ============ 인증 ============ */
const AUTH_FORMS = ['login-form', 'signup-form', 'forgot-form', 'reset-form', 'invite-form'];
function showAuthForm(id) {
  AUTH_FORMS.forEach((f) => $('#' + f).classList.toggle('hidden', f !== id));
}

function showAuth(formId = 'login-form') {
  $('#app').classList.add('hidden');
  $('#auth-screen').classList.remove('hidden');
  showAuthForm(formId);
}

function showApp() {
  $('#auth-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
}

// URL 파라미터 기반 진입 처리 (초대/재설정/인증/결제 리다이렉트)
let urlToken = null;
function handleEntryParams() {
  const p = new URLSearchParams(location.search);
  const path = location.pathname;
  if (path === '/reset' && p.get('token')) {
    urlToken = p.get('token');
    showAuth('reset-form');
    return 'reset';
  }
  if (path === '/invite' && p.get('token')) {
    urlToken = p.get('token');
    return 'invite';
  }
  if (p.get('verified') === 'ok') toast('이메일 인증이 완료되었습니다!');
  if (p.get('verified') === 'fail') toast('인증 링크가 만료되었거나 올바르지 않습니다.', 'error');
  if (p.get('billing') === 'ok') toast('카드 등록 및 결제가 완료되었습니다!');
  if (p.get('billing') === 'fail') toast('결제 실패: ' + (p.get('msg') || '취소되었습니다.'), 'error');
  if ([...p.keys()].length) history.replaceState(null, '', location.pathname);
  return null;
}

async function bootstrap() {
  const mode = handleEntryParams();
  if (mode === 'reset') return; // 재설정 폼만 표시
  if (mode === 'invite') {
    try {
      const info = await api('/api/auth/invite-info?token=' + encodeURIComponent(urlToken));
      $('#invite-desc').innerHTML =
        `<b>${esc(info.tenant)}</b>의 ${info.role === 'owner' ? '공동 대표' : '점주(매니저)'}로 초대되었습니다.` +
        (info.franchise ? `<br>담당 지점: <b>${esc(info.franchise)}</b>` : '') +
        `<br>계정 이메일: <b>${esc(info.email)}</b>`;
      showAuth('invite-form');
    } catch (e) {
      toast(e.message, 'error');
      history.replaceState(null, '', location.pathname);
      showAuth();
    }
    return;
  }
  try {
    ME = await fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null));
  } catch { ME = null; }
  if (!ME) return showAuth();
  applyMe();
  showApp();
  if (ME.user.role === 'staff') switchView('staffme');
  else if (ME.user.role === 'owner' && ME.usage.franchises === 0) switchView('onboarding');
  else loadDashboard();
}

function applyMe() {
  const isOwner = ME.user.role === 'owner';
  $('#user-name').textContent = ME.user.name + (isOwner ? '' : ' (점주)');
  $('#user-email').textContent = ME.user.email;
  $('#user-plan').textContent = ME.plan.label;
  $('#mt-plan').textContent = ME.plan.label;
  $('#brand-tenant').textContent = ME.tenant.name;
  const q = ME.usage.ai;
  $('#ai-quota-note').textContent = q.limit === null
    ? '매출 · 메뉴 · 예약 데이터를 근거로 답합니다 (AI 무제한)'
    : `매출 · 메뉴 · 예약 데이터를 근거로 답합니다 — 이번 달 AI ${q.used}/${q.limit}회 사용`;
  $('#franchise-limit-note').textContent = ME.usage.franchiseLimit === null
    ? '지점 현황과 오늘 성과'
    : `지점 현황과 오늘 성과 — ${ME.plan.label} 플랜: 가맹점 ${ME.usage.franchises}/${ME.usage.franchiseLimit}개`;
  // 역할별 UI (서버에서도 강제됨)
  const isStaff = ME.user.role === 'staff';
  $$('.owner-only').forEach((el) => el.classList.toggle('hidden', !isOwner));
  $('#btn-add-franchise').classList.toggle('hidden', !isOwner);
  $('#btn-add-menu').classList.toggle('hidden', !isOwner);
  // 직원 계정: "내 근무" 화면만 / 매니저: owner-only 숨김 유지
  $$('.nav-btn').forEach((b) => {
    if (b.dataset.view === 'staffme') b.classList.toggle('hidden', !isStaff);
    else b.classList.toggle('hidden', isStaff || (!isOwner && b.classList.contains('owner-only')));
  });
  // 이메일 인증 배너
  $('#verify-banner').classList.toggle('hidden', ME.user.email_verified);
}

$('#btn-resend-verify').addEventListener('click', async () => {
  try {
    const r = await api('/api/auth/verify/send', { method: 'POST' });
    toast('인증 메일을 보냈습니다.');
    if (r.devLink) {
      $('#verify-devlink').innerHTML = `개발 모드 — <a href="${esc(r.devLink)}">여기를 눌러 바로 인증</a>`;
    }
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
});

async function refreshMe() {
  const r = await fetch('/api/auth/me');
  if (r.ok) { ME = await r.json(); applyMe(); }
}

$('#to-signup').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('signup-form'); });
$('#to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('login-form'); });
$('#to-forgot').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('forgot-form'); });
$('#forgot-to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('login-form'); });

$('#forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/auth/forgot', { method: 'POST', body: { email: $('#fg-email').value.trim() } });
    toast('가입된 이메일이라면 재설정 링크를 보냈습니다.');
    if (r.devLink) {
      const el = $('#forgot-devlink');
      el.classList.remove('hidden');
      el.innerHTML = `개발 모드 — <a href="${esc(r.devLink)}">여기를 눌러 바로 재설정</a>`;
    }
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

$('#reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('#rs-password').value;
  if (pw !== $('#rs-password2').value) return toast('비밀번호가 서로 다릅니다.', 'error');
  try {
    await api('/api/auth/reset', { method: 'POST', body: { token: urlToken, password: pw } });
    toast('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
    history.replaceState(null, '', location.pathname);
    showAuthForm('login-form');
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

$('#invite-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/auth/accept-invite', {
      method: 'POST',
      body: { token: urlToken, name: $('#iv-name').value.trim(), password: $('#iv-password').value },
    });
    toast('합류를 환영합니다!');
    history.replaceState(null, '', location.pathname);
    bootstrap();
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/auth/login', { method: 'POST', body: { email: $('#lg-email').value.trim(), password: $('#lg-password').value } });
    toast('환영합니다!');
    bootstrap();
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

$('#signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/auth/signup', {
      method: 'POST',
      body: {
        company: $('#su-company').value.trim(), name: $('#su-name').value.trim(),
        email: $('#su-email').value.trim(), password: $('#su-password').value,
        store_type: document.querySelector('#su-type input:checked')?.value || 'casual',
      },
    });
    toast('가입 완료! 이제 가게를 설정해볼까요?');
    if (r.verifyDevLink) {
      $('#verify-devlink').innerHTML = `개발 모드 — <a href="${esc(r.verifyDevLink)}">여기를 눌러 바로 인증</a>`;
    }
    bootstrap();
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

$('#btn-logout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.reload();
});

/* ============ 네비게이션 ============ */
const loaders = {
  onboarding: loadOnboarding,
  dashboard: loadDashboard,
  tables: loadTablesView,
  reservations: loadReservations,
  payments: loadPayments,
  customers: loadCustomers,
  staffmgmt: loadStaffMgmt,
  staffme: loadStaffMe,
  franchises: loadFranchises,
  menu: loadMenu,
  team: loadTeam,
  billing: loadBilling,
  ai: loadAiView,
};

function switchView(view) {
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach((v) => v.classList.add('hidden'));
  $(`#view-${view}`).classList.remove('hidden');
  closeDrawer();
  loaders[view]();
}

$$('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* 모바일 드로어 */
function openDrawer() {
  $('.sidebar').classList.add('open');
  $('#side-backdrop').classList.remove('hidden');
}
function closeDrawer() {
  $('.sidebar').classList.remove('open');
  $('#side-backdrop').classList.add('hidden');
}
$('#btn-menu').addEventListener('click', () =>
  $('.sidebar').classList.contains('open') ? closeDrawer() : openDrawer());
$('#side-backdrop').addEventListener('click', closeDrawer);

$('#side-date').textContent = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
});

/* ============ 차트 렌더러 ============ */
function areaChart(el, data, { height = 220 } = {}) {
  if (!data.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">아직 매출 데이터가 없습니다. 첫 결제가 발생하면 차트가 표시됩니다.</div>'; return; }
  const W = 760, H = height, padL = 46, padR = 14, padT = 16, padB = 26;
  const max = Math.max(...data.map((d) => d.total), 1);
  const x = (i) => padL + (i / Math.max(data.length - 1, 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const pts = data.map((d, i) => `${x(i)},${y(d.total)}`);
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${x(data.length - 1)},${H - padB} L${x(0)},${H - padB} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => {
    const gy = y(max * f);
    return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#efe9df" stroke-width="1"/>
      <text x="${padL - 8}" y="${gy + 3}" text-anchor="end" class="axis-label">${wonShort(max * f)}</text>`;
  }).join('');

  const labels = data.map((d, i) => {
    if (data.length > 8 && i % 2 === 1) return '';
    return `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="axis-label">${d.day.slice(5).replace('-', '/')}</text>`;
  }).join('');

  const dots = data.map((d, i) =>
    `<circle cx="${x(i)}" cy="${y(d.total)}" r="3.5" fill="#fff" stroke="var(--primary)" stroke-width="2"><title>${d.day} · ${won(d.total)} (${d.cnt}건)</title></circle>`
  ).join('');

  el.innerHTML = `<div class="area-chart"><svg viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d9480f" stop-opacity=".22"/>
      <stop offset="100%" stop-color="#d9480f" stop-opacity="0"/>
    </linearGradient></defs>
    ${gridLines}
    <path d="${area}" fill="url(#ag)"/>
    <path d="${line}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${labels}
  </svg></div>`;
}

const METHOD_META = {
  card: { label: '카드', color: '#d9480f' },
  mobile: { label: '간편결제', color: '#e8a33d' },
  cash: { label: '현금', color: '#7d6b56' },
};

function donutChart(el, rows) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  if (!total) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">데이터 없음</div>'; return; }
  const R = 52, CX = 70, CY = 70, SW = 22;
  const circ = 2 * Math.PI * R;
  let acc = 0;
  const segs = rows.map((r) => {
    const frac = r.total / total;
    const meta = METHOD_META[r.method] || { label: r.method, color: '#bbb' };
    const seg = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${meta.color}" stroke-width="${SW}"
      stroke-dasharray="${frac * circ} ${circ}" stroke-dashoffset="${-acc * circ}"
      transform="rotate(-90 ${CX} ${CY})"/>`;
    acc += frac;
    return seg;
  }).join('');
  el.innerHTML = `<div class="donut-wrap">
    <svg width="140" height="140" viewBox="0 0 140 140">${segs}
      <text x="${CX}" y="${CY - 3}" text-anchor="middle" font-size="11" fill="var(--muted)">7일 합계</text>
      <text x="${CX}" y="${CY + 15}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)">${wonShort(total)}</text>
    </svg>
    <div class="donut-legend">${rows.map((r) => {
      const meta = METHOD_META[r.method] || { label: r.method, color: '#bbb' };
      return `<div class="row"><span class="sw" style="background:${meta.color}"></span>${meta.label}
        <span class="pct">${Math.round((r.total / total) * 100)}%</span></div>`;
    }).join('')}</div>
  </div>`;
}

function hbarChart(el, rows, valueKey, labelKey, fmt) {
  if (!rows.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">데이터 없음</div>'; return; }
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);
  el.innerHTML = rows.map((r) => `
    <div class="hbar">
      <div>${esc(r[labelKey])}</div>
      <div class="track"><div class="fill" style="width:${(r[valueKey] / max) * 100}%"></div></div>
      <div class="num">${fmt(r[valueKey])}</div>
    </div>`).join('');
}

/* ============ 대시보드 ============ */
function deltaBadge(cur, prev) {
  if (!prev) return '<span class="delta flat">— 전일 데이터 없음</span>';
  const pct = ((cur - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return '<span class="delta flat">— 전일과 비슷</span>';
  return pct > 0
    ? `<span class="delta up">▲ ${pct.toFixed(1)}% 전일比</span>`
    : `<span class="delta down">▼ ${Math.abs(pct).toFixed(1)}% 전일比</span>`;
}

async function loadDashboard() {
  const d = await api('/api/dashboard');

  $('#dash-cards').innerHTML = `
    <div class="card accent">
      <div class="label">오늘 매출</div>
      <div class="value">${won(d.today.sales)}</div>
      <div class="sub" style="margin-top:8px">${deltaBadge(d.today.sales, d.yesterday.sales)}</div>
    </div>
    <div class="card">
      <div class="label">이번 달 누적 매출</div>
      <div class="value">${won(d.month.sales)}</div>
      <div class="sub">결제 ${d.month.orders.toLocaleString()}건</div>
    </div>
    <div class="card">
      <div class="label">오늘 객단가</div>
      <div class="value">${won(d.today.orders ? Math.round(d.today.sales / d.today.orders) : 0)}</div>
      <div class="sub">결제 ${d.today.orders}건</div>
    </div>
    <div class="card">
      <div class="label">테이블 이용률</div>
      <div class="value">${d.tableStat.total ? Math.round((d.tableStat.occupied / d.tableStat.total) * 100) : 0}%</div>
      <div class="sub">${d.tableStat.occupied}/${d.tableStat.total} 이용 중 · ${d.franchiseCount}개 지점</div>
    </div>
    <div class="card">
      <div class="label">오늘 예약</div>
      <div class="value">${d.todayReservations}건</div>
      <div class="sub">예약 관리에서 확인</div>
    </div>
  `;

  const weekTotal = d.daily.reduce((s, w) => s + w.total, 0);
  $('#dash-trend-sub').textContent = `14일 합계 ${won(weekTotal)}`;
  areaChart($('#dash-trend'), d.daily);
  donutChart($('#dash-method'), d.byMethod);

  const hourMap = Object.fromEntries(d.byHour.map((h) => [h.hour, h.total]));
  const hours = [];
  for (let h = 10; h <= 22; h++) hours.push({ hour: h, total: hourMap[h] || 0 });
  const maxH = Math.max(...hours.map((h) => h.total), 1);
  const peak = hours.reduce((a, b) => (b.total > a.total ? b : a));
  $('#dash-hours').innerHTML = hours.map((h) => `
    <div class="bar-wrap">
      <div class="bar ${h.total === 0 ? 'dim' : ''}" style="height:${Math.max((h.total / maxH) * 100, 3)}%" title="${h.hour}시 · ${won(h.total)}"></div>
      <div class="bar-label">${h.hour === peak.hour && h.total > 0 ? '🔥' : ''}${h.hour}</div>
    </div>`).join('');

  hbarChart($('#dash-franchise'), d.byFranchise, 'total', 'name', won);

  $('#dash-top-menus').innerHTML = d.topMenus.map((m, i) => `
    <div class="rank-item">
      <div class="rank-no">${i + 1}</div>
      <div class="rank-name">${esc(m.name)}</div>
      <div class="rank-meta">${m.qty}개 · ${won(m.revenue)}</div>
    </div>`).join('') || '<div style="color:var(--muted);font-size:13px">아직 판매 데이터가 없습니다.</div>';

  // 방문 주기 알림 (다시 부를 고객)
  try {
    const al = await api('/api/customers/alerts');
    $('#dash-alerts-panel').classList.toggle('hidden', al.count === 0);
    $('#dash-alerts').innerHTML = al.rows.slice(0, 5).map((r) => `
      <div class="hbar" style="grid-template-columns:100px 1fr 150px">
        <div><b>${esc(r.name)}</b></div>
        <div style="font-size:12.5px;color:var(--muted)">평소 ${r.avg_gap}일마다 방문 → <b style="color:var(--red)">${r.days_since}일째 안 옴</b>
          · ${r.visit_count}회 · 누적 ${won(r.total_spent)}${r.favorite_food ? ' · 선호: ' + esc(r.favorite_food) : ''}</div>
        <div class="num" style="font-weight:400;font-size:12px;color:var(--muted)">${r.sms_opt_in ? '문자 가능' : '문자 미동의'}</div>
      </div>`).join('') +
      (al.count > 5 ? `<div style="font-size:12px;color:var(--muted);margin-top:8px">외 ${al.count - 5}명 — 고객 관리에서 확인하세요.</div>` : '');
  } catch { /* 알림 실패는 대시보드를 막지 않음 */ }
}

$('#btn-goto-customers').addEventListener('click', () => switchView('customers'));
$('#btn-dash-refresh').addEventListener('click', () => { loadDashboard(); toast('대시보드를 새로고침했습니다.'); });

/* ============ 구독 / 요금제 ============ */
function meter(label, used, limit, fmt = (v) => v) {
  const unlimited = limit === null;
  const pct = unlimited ? 8 : Math.min((used / Math.max(limit, 1)) * 100, 100);
  const warn = !unlimited && pct >= 80;
  return `<div class="meter">
    <div class="m-head"><span>${label}</span><b>${fmt(used)} / ${unlimited ? '무제한' : fmt(limit)}</b></div>
    <div class="m-track"><div class="m-fill ${warn ? 'warn' : ''}" style="width:${pct}%"></div></div>
  </div>`;
}

// 토스 SDK 동적 로드
let tossScriptPromise = null;
function loadTossScript() {
  if (!tossScriptPromise) {
    tossScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.tosspayments.com/v1/payment';
      s.onload = resolve;
      s.onerror = () => reject(new Error('토스페이먼츠 SDK 로드에 실패했습니다.'));
      document.head.appendChild(s);
    });
  }
  return tossScriptPromise;
}

// 카드 등록 + 첫 결제 (토스 리다이렉트 플로우)
async function startTossBillingAuth(planKey) {
  const cfg = await api('/api/billing/config');
  await loadTossScript();
  const toss = TossPayments(cfg.clientKey);
  await toss.requestBillingAuth('카드', {
    customerKey: cfg.customerKey,
    successUrl: `${location.origin}/billing/success?plan=${planKey}`,
    failUrl: `${location.origin}/billing/fail`,
  });
}

const billStatusBadge = {
  paid: '<span class="badge green">결제완료</span>',
  mock: '<span class="badge gold">모의결제</span>',
  failed: '<span class="badge red">실패</span>',
  cancelled: '<span class="badge gray">해지</span>',
};

async function loadBilling() {
  const b = await api('/api/billing');
  const cur = b.plans[b.current];

  $('#billing-current').innerHTML = `
    <div class="panel-head" style="margin-bottom:4px">
      <h2>현재 플랜: <span style="color:var(--primary)">${esc(cur.label)}</span>
        <small>· ${cur.price ? won(cur.price) + '/월' : '무료'} · ${esc(b.plan_started_at.slice(0, 10))}부터
        ${b.next_billing_at ? ` · 다음 결제일 ${esc(b.next_billing_at.slice(0, 10))}` : ''}</small></h2>
      ${b.card_info ? `<span class="badge green">💳 ${esc(b.card_info)}</span>` : ''}
    </div>
    <div class="usage-meters">
      ${meter('가맹점', b.usage.franchises, b.usage.franchiseLimit, (v) => v + '개')}
      ${meter('이번 달 AI 사용', b.usage.aiUsed, b.usage.aiLimit, (v) => v + '회')}
      ${meter('이번 달 고객 문자', b.usage.smsUsed, b.usage.smsLimit, (v) => v + '건')}
    </div>
    <label class="toggle-row" style="margin-top:14px">
      <input type="checkbox" id="birthday-toggle" ${b.birthday_auto ? 'checked' : ''} />
      <span>🎂 생일 쿠폰 + 축하 문자 자동 발송 <small style="color:var(--muted)">(시점·기한·혜택은 고객 관리 → ⚙ 혜택 설정)</small></span>
    </label>
  `;
  $('#birthday-toggle').addEventListener('change', async (e) => {
    await api('/api/sms/settings', { method: 'PUT', body: { birthday_auto: e.target.checked } });
    toast(e.target.checked ? '생일 자동 발송이 켜졌습니다.' : '생일 자동 발송이 꺼졌습니다.');
  });

  $('#billing-note').textContent = b.tossEnabled
    ? '※ 토스페이먼츠 정기결제가 연동되어 있습니다. 유료 플랜 선택 시 카드 등록 화면으로 이동합니다.'
    : '※ 모의 결제 모드입니다. .env에 TOSS_CLIENT_KEY / TOSS_SECRET_KEY를 설정하면 토스페이먼츠 실결제가 활성화됩니다.';

  const order = ['free', 'pro', 'business'];
  $('#plan-cards').innerHTML = order.map((key) => {
    const p = b.plans[key];
    const isCur = key === b.current;
    return `<div class="plan-card ${isCur ? 'current' : ''} ${key === 'pro' && !isCur ? 'recommend' : ''}">
      ${isCur ? '<div class="plan-flag">현재 플랜</div>' : (key === 'pro' ? '<div class="plan-flag dark">추천</div>' : '')}
      <div class="p-name">${esc(p.label)}</div>
      <div class="p-price">${p.price ? won(p.price) : '₩0'}<small> / 월</small></div>
      <div class="p-desc">${esc(p.desc)}</div>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${isCur
        ? '<button class="btn" disabled>사용 중</button>'
        : `<button class="btn ${key === 'free' ? '' : 'primary'}" data-plan="${key}">${p.price ? '이 플랜으로 변경' : '무료로 다운그레이드'}</button>`}
    </div>`;
  }).join('');

  $$('#plan-cards [data-plan]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.plan;
    const p = b.plans[key];
    const desc = !p.price
      ? '무료 플랜으로 변경하면 정기결제가 해지되고 가맹점 1개, AI 월 10회로 제한됩니다.'
      : b.tossEnabled
        ? (b.card_info
          ? `등록된 카드(${b.card_info})로 ${won(p.price)}가 즉시 결제되고 매월 자동 결제됩니다.`
          : `카드 등록 화면으로 이동합니다. 등록 즉시 첫 달 ${won(p.price)}가 결제됩니다.`)
        : `${p.label} 플랜(월 ${won(p.price)})으로 변경합니다. 모의 결제 모드라 실제 결제 없이 적용됩니다.`;
    confirmModal(`${p.label} 플랜으로 변경`, desc, async () => {
      const r = await api('/api/billing/plan', { method: 'POST', body: { plan: key } });
      if (r.needCard) {
        toast('카드 등록 화면으로 이동합니다...');
        await startTossBillingAuth(key);
        return;
      }
      toast(`${p.label} 플랜으로 변경되었습니다.`);
      await refreshMe();
      loadBilling();
    }, '변경하기');
  }));

  // 결제 이력
  $('#billing-history-table tbody').innerHTML = b.history.map((h) => `
    <tr>
      <td style="color:var(--muted)">${esc(h.created_at.slice(0, 16))}</td>
      <td>${esc(b.plans[h.plan]?.label || h.plan)}</td>
      <td class="ta-r"><b>${won(h.amount)}</b></td>
      <td>${billStatusBadge[h.status] || esc(h.status)}</td>
      <td style="color:var(--muted);font-size:12px">${esc(h.note)}</td>
    </tr>`).join('') || '<tr><td colspan="5" style="color:var(--muted)">결제 이력이 없습니다.</td></tr>';

  // 주간 리포트
  $('#report-toggle').checked = !!b.report.enabled;
  $('#report-status').textContent = b.report.lastSent
    ? `마지막 자동 발송: ${b.report.lastSent} 주` : '아직 자동 발송된 리포트가 없습니다.';
}

$('#report-toggle').addEventListener('change', async (e) => {
  await api('/api/reports/settings', { method: 'PUT', body: { enabled: e.target.checked } });
  toast(e.target.checked ? '주간 리포트를 받습니다.' : '주간 리포트를 받지 않습니다.');
});

$('#btn-report-preview').addEventListener('click', async () => {
  const btn = $('#btn-report-preview');
  btn.disabled = true; btn.textContent = '생성 중...';
  try {
    const r = await api('/api/reports/weekly/preview');
    openModal('주간 리포트 미리보기', `<iframe class="report-preview-frame" id="report-frame"></iframe>`, async () => {}, '닫기');
    $('.modal').classList.add('wide');
    $('#report-frame').srcdoc = r.html;
    $('#modal-cancel').classList.add('hidden');
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '미리보기';
});

$('#btn-report-send').addEventListener('click', async () => {
  const btn = $('#btn-report-send');
  btn.disabled = true; btn.textContent = '발송 중...';
  try {
    const r = await api('/api/reports/weekly/send', { method: 'POST' });
    toast(r.sent
      ? '리포트를 이메일로 발송했습니다.'
      : '개발 모드: SMTP 미설정이라 data/outbox 폴더에 저장했습니다.');
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '지금 발송 (테스트)';
});

/* ============ 팀 관리 ============ */
const roleLabel = { owner: '<span class="badge orange">대표</span>', manager: '<span class="badge gray">점주</span>' };

async function loadTeam() {
  const [{ members, invites }, franchises] = await Promise.all([api('/api/team'), api('/api/franchises')]);
  window._teamFranchises = franchises;

  $('#team-table tbody').innerHTML = members.map((m) => `
    <tr>
      <td><b>${esc(m.name)}</b>${m.id === ME.user.id ? ' <small style="color:var(--muted)">(나)</small>' : ''}</td>
      <td>${esc(m.email)}</td>
      <td>${roleLabel[m.role] || esc(m.role)}</td>
      <td>${m.franchise_name ? esc(m.franchise_name) : '<span style="color:var(--muted)">전체 지점</span>'}</td>
      <td>${m.email_verified ? '<span class="badge green">인증됨</span>' : '<span class="badge gold">미인증</span>'}</td>
      <td class="ta-r">${m.id !== ME.user.id && m.role !== 'owner'
        ? `<button class="btn small ghost" data-edit="${m.id}">권한 변경</button>
           <button class="btn small danger ghost" data-del="${m.id}">내보내기</button>` : ''}</td>
    </tr>`).join('');

  $$('#team-table [data-del]').forEach((b) => b.addEventListener('click', () => {
    const m = members.find((x) => x.id === Number(b.dataset.del));
    confirmModal('팀원 내보내기', `${m.name}(${m.email})님을 팀에서 내보낼까요? 계정이 삭제됩니다.`, async () => {
      await api(`/api/team/members/${m.id}`, { method: 'DELETE' });
      toast('팀원을 내보냈습니다.');
      loadTeam();
    }, '내보내기');
  }));
  $$('#team-table [data-edit]').forEach((b) => b.addEventListener('click', () => {
    const m = members.find((x) => x.id === Number(b.dataset.edit));
    openModal(`${m.name} 권한 변경`, `
      <div class="field"><label>담당 지점</label>
        <select id="tm-franchise">
          <option value="">전체 지점</option>
          ${window._teamFranchises.map((f) =>
            `<option value="${f.id}" ${m.franchise_id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
        </select>
      </div>
    `, async () => {
      await api(`/api/team/members/${m.id}`, {
        method: 'PUT',
        body: { role: 'manager', franchise_id: Number($('#tm-franchise').value) || null },
      });
      toast('권한이 변경되었습니다.');
      loadTeam();
    });
  }));

  $('#invites-panel').classList.toggle('hidden', invites.length === 0);
  $('#invites-table tbody').innerHTML = invites.map((i) => `
    <tr>
      <td><b>${esc(i.email)}</b></td>
      <td>${roleLabel[i.role] || esc(i.role)}</td>
      <td>${i.franchise_name ? esc(i.franchise_name) : '<span style="color:var(--muted)">전체 지점</span>'}</td>
      <td style="color:var(--muted)">${esc(i.expires_at.slice(0, 10))}까지</td>
      <td class="ta-r">
        <button class="btn small" data-copy="${esc(i.token)}">링크 복사</button>
        <button class="btn small danger ghost" data-revoke="${i.id}">취소</button>
      </td>
    </tr>`).join('');

  $$('#invites-table [data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const url = `${location.origin}/invite?token=${b.dataset.copy}`;
    try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했습니다.'); }
    catch { prompt('아래 링크를 복사하세요:', url); }
  }));
  $$('#invites-table [data-revoke]').forEach((b) => b.addEventListener('click', async () => {
    await api(`/api/team/invite/${b.dataset.revoke}`, { method: 'DELETE' });
    toast('초대를 취소했습니다.');
    loadTeam();
  }));
}

$('#btn-invite').addEventListener('click', () => {
  const frs = window._teamFranchises || [];
  openModal('팀원 초대', `
    ${field('inv-email', '이메일', '', 'email')}
    <div class="field"><label>역할</label>
      <select id="inv-role">
        <option value="manager">점주 (매니저)</option>
        <option value="owner">공동 대표</option>
      </select>
    </div>
    <div class="field" id="inv-fr-field"><label>담당 지점 (점주만 해당)</label>
      <select id="inv-franchise">
        <option value="">전체 지점</option>
        ${frs.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}
      </select>
    </div>
  `, async () => {
    const r = await api('/api/team/invite', {
      method: 'POST',
      body: {
        email: $('#inv-email').value.trim(),
        role: $('#inv-role').value,
        franchise_id: $('#inv-role').value === 'manager' ? (Number($('#inv-franchise').value) || null) : null,
      },
    });
    toast(r.devLink ? '초대를 생성했습니다. (개발 모드: 링크 복사로 전달하세요)' : '초대 메일을 보냈습니다.');
    loadTeam();
  }, '초대하기');
});

/* ============ 가맹점 ============ */
const statusBadge = {
  open: '<span class="badge green">운영중</span>',
  closed: '<span class="badge red">폐점</span>',
  preparing: '<span class="badge gray">오픈준비</span>',
};

async function loadFranchises() {
  await refreshMe();
  const rows = await api('/api/franchises');
  $('#franchise-cards').innerHTML = rows.map((f) => `
    <div class="fr-card">
      <div class="fr-head">
        <div class="fr-name">${esc(f.name)}</div>
        ${statusBadge[f.status] || esc(f.status)}
      </div>
      <div class="fr-meta">
        👤 ${esc(f.owner)}${f.phone ? ' · ' + esc(f.phone) : ''}<br>
        📍 ${esc(f.address) || '주소 미입력'}<br>
        🗓 ${esc(f.opened_at)} 오픈
      </div>
      <div class="fr-stats">
        <div class="fr-stat"><div class="k">오늘 매출</div><div class="v">${won(f.today_sales)}</div></div>
        <div class="fr-stat"><div class="k">테이블</div><div class="v">${f.occupied_count}/${f.table_count}</div></div>
      </div>
      <div class="fr-actions">
        <button class="btn small" data-edit="${f.id}">수정</button>
        <button class="btn small danger ghost" data-del="${f.id}">삭제</button>
      </div>
    </div>`).join('');

  $$('#franchise-cards [data-edit]').forEach((b) => b.addEventListener('click', () =>
    franchiseModal(rows.find((r) => r.id === Number(b.dataset.edit)))));
  $$('#franchise-cards [data-del]').forEach((b) => b.addEventListener('click', () => {
    const f = rows.find((r) => r.id === Number(b.dataset.del));
    confirmModal('가맹점 삭제', `"${f.name}"을(를) 삭제할까요? 테이블·주문·결제 데이터가 함께 삭제됩니다.`, async () => {
      await api(`/api/franchises/${f.id}`, { method: 'DELETE' });
      toast('가맹점이 삭제되었습니다.');
      loadFranchises();
    }, '삭제');
  }));
}

function franchiseModal(f = null) {
  openModal(f ? '가맹점 수정' : '가맹점 등록', `
    ${field('fr-name', '지점명', f?.name || '')}
    ${field('fr-owner', '점주명', f?.owner || '')}
    ${field('fr-phone', '연락처', f?.phone || '')}
    <div class="field"><label>주소</label>
      <div class="row-gap">
        <input id="fr-zip" type="text" placeholder="우편번호" readonly style="width:110px" />
        <button type="button" class="btn small" id="fr-addr-btn">🔍 주소 찾기</button>
      </div>
      <input id="fr-address" type="text" placeholder="주소 찾기를 눌러 검색하세요" readonly
        value="${esc(f?.address || '')}" style="margin-top:6px" />
      <input id="fr-addr-detail" type="text" placeholder="상세주소 (층/호수 등, 선택)" style="margin-top:6px" />
      <div id="fr-addr-box" class="addr-search-box hidden"></div>
    </div>
    <div class="field"><label>상태</label>
      <select id="fr-status">
        <option value="open" ${f?.status === 'open' ? 'selected' : ''}>운영중</option>
        <option value="preparing" ${f?.status === 'preparing' ? 'selected' : ''}>오픈준비</option>
        <option value="closed" ${f?.status === 'closed' ? 'selected' : ''}>폐점</option>
      </select>
    </div>
  `, async () => {
    const body = {
      name: $('#fr-name').value.trim(), owner: $('#fr-owner').value.trim(),
      phone: $('#fr-phone').value.trim(),
      address: combineAddress($('#fr-address').value, $('#fr-addr-detail').value),
      status: $('#fr-status').value,
    };
    if (f) { await api(`/api/franchises/${f.id}`, { method: 'PUT', body }); toast('가맹점 정보가 수정되었습니다.'); }
    else { await api('/api/franchises', { method: 'POST', body }); toast('가맹점이 등록되었습니다. 기본 테이블 8개가 생성됩니다.'); }
    loadFranchises();
  });
  wireAddressSearch('fr', 'fr-address');
}
$('#btn-add-franchise').addEventListener('click', () => franchiseModal());

/* ============ 메뉴 ============ */
async function loadMenu() {
  const rows = await api('/api/menu');
  const byCat = {};
  for (const m of rows) (byCat[m.category] ||= []).push(m);

  $('#menu-groups').innerHTML = Object.entries(byCat).map(([cat, items]) => `
    <div class="menu-cat-title">${esc(cat)} · ${items.length}</div>
    <div class="menu-grid">${items.map((m) => `
      <div class="menu-card ${m.is_sold_out ? 'soldout' : ''}">
        <div>
          <div class="mc-name">${esc(m.name)} ${m.is_sold_out ? '<span class="badge red">품절</span>' : ''}</div>
          <div class="mc-price">${won(m.price)}</div>
        </div>
        <div class="mc-actions">
          <button class="btn small" data-sold="${m.id}">${m.is_sold_out ? '판매 재개' : '품절 처리'}</button>
          <div class="row-gap">
            <button class="btn small ghost" data-edit="${m.id}">수정</button>
            <button class="btn small danger ghost" data-del="${m.id}">삭제</button>
          </div>
        </div>
      </div>`).join('')}
    </div>`).join('') || '<div class="panel" style="color:var(--muted)">메뉴가 없습니다. 우측 상단에서 추가하세요.</div>';

  $$('#menu-groups [data-sold]').forEach((b) => b.addEventListener('click', async () => {
    const m = rows.find((r) => r.id === Number(b.dataset.sold));
    await api(`/api/menu/${m.id}`, { method: 'PUT', body: { ...m, is_sold_out: !m.is_sold_out } });
    toast(m.is_sold_out ? `"${m.name}" 판매를 재개했습니다.` : `"${m.name}"을 품절 처리했습니다.`);
    loadMenu();
  }));
  $$('#menu-groups [data-edit]').forEach((b) => b.addEventListener('click', () =>
    menuModal(rows.find((r) => r.id === Number(b.dataset.edit)))));
  $$('#menu-groups [data-del]').forEach((b) => b.addEventListener('click', () => {
    const m = rows.find((r) => r.id === Number(b.dataset.del));
    confirmModal('메뉴 삭제', `"${m.name}" 메뉴를 삭제할까요?`, async () => {
      await api(`/api/menu/${m.id}`, { method: 'DELETE' });
      toast('메뉴가 삭제되었습니다.');
      loadMenu();
    }, '삭제');
  }));
}

function menuModal(m = null) {
  openModal(m ? '메뉴 수정' : '메뉴 추가', `
    ${field('mn-name', '메뉴명', m?.name || '')}
    ${field('mn-category', '카테고리', m?.category || '메인')}
    ${field('mn-price', '가격 (원)', m?.price ?? '', 'number', 'min="0" step="100"')}
  `, async () => {
    const body = {
      name: $('#mn-name').value.trim(), category: $('#mn-category').value.trim() || '기타',
      price: Number($('#mn-price').value), is_sold_out: m?.is_sold_out || 0,
    };
    if (m) { await api(`/api/menu/${m.id}`, { method: 'PUT', body }); toast('메뉴가 수정되었습니다.'); }
    else { await api('/api/menu', { method: 'POST', body }); toast('메뉴가 추가되었습니다.'); }
    loadMenu();
  });
}
$('#btn-add-menu').addEventListener('click', () => menuModal());

/* ============ 테이블 / 주문 ============ */
let currentFranchiseId = null;
let currentOrderId = null;
let currentTableId = null;
let currentTableLabel = '';
let menuCache = [];
let menuCatFilter = '전체';

function elapsedText(ts) {
  if (!ts) return '';
  const ms = Date.now() - new Date(ts.replace(' ', 'T')).getTime();
  const min = Math.max(Math.floor(ms / 60000), 0);
  if (min < 60) return `${min}분 경과`;
  return `${Math.floor(min / 60)}시간 ${min % 60}분 경과`;
}

async function loadTablesView() {
  const franchises = await api('/api/franchises');
  const open = franchises.filter((f) => f.status === 'open');
  const sel = $('#table-franchise-select');
  sel.innerHTML = open.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  if (!currentFranchiseId || !open.some((f) => f.id === currentFranchiseId)) {
    currentFranchiseId = open.length ? open[0].id : null;
  }
  if (currentFranchiseId) sel.value = currentFranchiseId;
  menuCache = await api('/api/menu');
  await renderTables();
}

$('#table-franchise-select').addEventListener('change', (e) => {
  currentFranchiseId = Number(e.target.value);
  hideOrderPanel();
  renderTables();
});

async function renderTables() {
  if (!currentFranchiseId) { $('#table-grid').innerHTML = ''; return; }
  const tables = await api(`/api/franchises/${currentFranchiseId}/tables`);
  $('#table-grid').innerHTML = tables.map((t) => {
    const cls = t.status === 'occupied' ? 'occupied' : (t.reservation ? 'reserved' : 'empty');
    let info;
    if (t.status === 'occupied') {
      info = `<div class="seat-info">👥 ${t.guests}명 · <span class="seat-amount">${t.open_order ? won(t.open_order.total) : ''}</span><br>
        <span class="elapsed">⏱ ${elapsedText(t.occupied_at)}</span></div>`;
    } else if (t.reservation) {
      info = `<div class="seat-info">📅 ${esc(t.reservation.name)} 님 예약<br>${t.reservation.reserved_at.slice(11, 16)} 예정</div>`;
    } else {
      info = '<div class="seat-info">빈 테이블</div>';
    }
    return `<div class="seat ${cls} ${t.id === currentTableId ? 'selected' : ''}" data-id="${t.id}">
      <div class="seat-top"><span class="seat-label">${esc(t.label)}</span><span class="seat-cap">${t.seats}인석</span></div>
      ${info}
    </div>`;
  }).join('');

  $$('#table-grid .seat').forEach((el) => el.addEventListener('click', () =>
    onSeatClick(tables.find((t) => t.id === Number(el.dataset.id)))));
}

function onSeatClick(table) {
  if (table.status === 'empty') {
    const note = table.reservation
      ? `<p class="modal-desc">⚠️ 이 테이블은 <b>${esc(table.reservation.name)}</b> 님이 ${table.reservation.reserved_at.slice(11, 16)}에 예약했습니다.</p>` : '';
    openModal(`${table.label} 테이블 착석`, `
      ${note}
      ${field('seat-guests', '인원 수', 2, 'number', `min="1" max="${table.seats * 2}"`)}
    `, async () => {
      const r = await api(`/api/tables/${table.id}/seat`, {
        method: 'POST', body: { guests: Number($('#seat-guests').value) || 1 },
      });
      currentTableId = table.id;
      currentTableLabel = table.label;
      currentOrderId = r.order_id;
      toast(`${table.label} 테이블 착석 처리되었습니다.`);
      await renderTables();
      await renderOrderPanel();
    }, '착석');
  } else if (table.open_order) {
    currentTableId = table.id;
    currentTableLabel = table.label;
    currentOrderId = table.open_order.id;
    renderTables();
    renderOrderPanel();
  }
}

function hideOrderPanel() {
  $('#order-panel').classList.add('hidden');
  currentOrderId = null;
  currentTableId = null;
}
$('#btn-close-order').addEventListener('click', () => { hideOrderPanel(); renderTables(); });

async function renderOrderPanel() {
  const order = await api(`/api/orders/${currentOrderId}`);
  $('#order-panel').classList.remove('hidden');
  $('#order-title').textContent = `${currentTableLabel} 테이블 · 주문 #${order.id}`;

  $('#order-items-table tbody').innerHTML = order.items.map((i) => `
    <tr>
      <td>${esc(i.name)}<br><small style="color:var(--muted)">${won(i.price)}</small></td>
      <td>
        <div class="qty-ctl">
          <button data-qty="${i.id}:${i.qty - 1}">−</button>
          <span class="qty">${i.qty}</span>
          <button data-qty="${i.id}:${i.qty + 1}">＋</button>
        </div>
      </td>
      <td class="ta-r"><b>${won(i.qty * i.price)}</b></td>
    </tr>`).join('')
    || '<tr><td colspan="3" style="color:var(--muted)">주문 항목이 없습니다. 오른쪽에서 메뉴를 담아주세요.</td></tr>';
  $('#order-total').textContent = won(order.total);

  $$('#order-items-table [data-qty]').forEach((b) => b.addEventListener('click', async () => {
    const [itemId, qty] = b.dataset.qty.split(':');
    await api(`/api/orders/${currentOrderId}/items/${itemId}`, { method: 'PATCH', body: { qty: Number(qty) } });
    await renderOrderPanel();
    await renderTables();
  }));

  const cats = ['전체', ...new Set(menuCache.map((m) => m.category))];
  if (!cats.includes(menuCatFilter)) menuCatFilter = '전체';
  $('#order-menu-cats').innerHTML = cats.map((c) =>
    `<button class="chip ${c === menuCatFilter ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $$('#order-menu-cats [data-cat]').forEach((b) => b.addEventListener('click', () => {
    menuCatFilter = b.dataset.cat;
    renderOrderPanel();
  }));

  const list = menuCatFilter === '전체' ? menuCache : menuCache.filter((m) => m.category === menuCatFilter);
  $('#order-menu-list').innerHTML = list.map((m) => `
    <div class="menu-pick ${m.is_sold_out ? 'soldout' : ''}">
      <span>${esc(m.name)}<span class="mp-price">${won(m.price)}</span></span>
      ${m.is_sold_out ? '<span class="badge red">품절</span>'
        : `<button class="btn small primary" data-add="${m.id}">담기</button>`}
    </div>`).join('');

  $$('#order-menu-list [data-add]').forEach((b) => b.addEventListener('click', async () => {
    await api(`/api/orders/${currentOrderId}/items`, { method: 'POST', body: { menu_item_id: Number(b.dataset.add), qty: 1 } });
    await renderOrderPanel();
    await renderTables();
  }));
}

// 결제: 고객 연결(선택) 모달 → 결제. 전화번호를 입력하면 단골 적립이 자동으로 쌓입니다.
let paySelectedCustomer = null;

$$('#order-panel [data-pay]').forEach((b) => b.addEventListener('click', () => {
  if (!currentOrderId) return;
  const method = b.dataset.pay;
  const methodName = { card: '카드', mobile: '간편결제', cash: '현금' }[method];
  paySelectedCustomer = null;
  openModal(`${methodName} 결제`, `
    <p class="modal-desc">고객 전화번호를 입력하면 방문 횟수와 누적 금액이 자동으로 적립됩니다. <b>건너뛰어도 결제됩니다.</b></p>
    ${field('pay-phone', '고객 전화번호 (선택)', '', 'tel', 'placeholder="뒷자리만 입력해도 검색됩니다"')}
    <div class="cust-suggest" id="pay-cust-suggest"></div>
    <div id="pay-cust-selected" style="font-size:13px;margin-top:6px"></div>
  `, async () => {
    const body = { method };
    if (paySelectedCustomer) body.customer_id = paySelectedCustomer.id;
    else if ($('#pay-phone').value.trim()) body.customer_phone = $('#pay-phone').value.trim();
    const r = await api(`/api/orders/${currentOrderId}/pay`, { method: 'POST', body });
    // 체크된 쿠폰 사용 처리
    const usedCoupons = [...$$('#pay-cust-selected input[data-coupon]:checked')];
    for (const cb of usedCoupons) {
      await api(`/api/coupons/${cb.dataset.coupon}/use`, { method: 'POST' }).catch(() => {});
    }
    toast(`결제 완료 · ${won(r.amount)}${r.customer_id ? ' · 고객 적립됨 ♥' : ''}${usedCoupons.length ? ` · 쿠폰 ${usedCoupons.length}장 사용` : ''}`);
    hideOrderPanel();
    renderTables();
  }, '결제하기');

  // 전화번호 실시간 검색
  let t = null;
  $('#pay-phone').addEventListener('input', (e) => {
    clearTimeout(t);
    paySelectedCustomer = null;
    $('#pay-cust-selected').innerHTML = '';
    t = setTimeout(async () => {
      const digits = e.target.value.replace(/[^0-9]/g, '');
      if (digits.length < 3) { $('#pay-cust-suggest').innerHTML = ''; return; }
      const list = await api('/api/customers/lookup?phone=' + digits);
      $('#pay-cust-suggest').innerHTML = list.map((c) => `
        <button type="button" data-cid="${c.id}">
          <b>${esc(c.name)}</b> · ${esc(c.phone)} · ${esc(c.tier || c.grade)} (${c.visit_count}회)
          ${c.favorite_food ? `<br><small style="color:var(--muted)">선호: ${esc(c.favorite_food)}</small>` : ''}
        </button>`).join('');
      $$('#pay-cust-suggest [data-cid]').forEach((btn) => btn.addEventListener('click', async () => {
        paySelectedCustomer = list.find((c) => c.id === Number(btn.dataset.cid));
        $('#pay-phone').value = paySelectedCustomer.phone;
        $('#pay-cust-suggest').innerHTML = '';
        $('#pay-cust-selected').innerHTML =
          `✅ <b>${esc(paySelectedCustomer.name)}</b>님 (${esc(paySelectedCustomer.tier || paySelectedCustomer.grade)} · ${paySelectedCustomer.visit_count}회 방문)` +
          (paySelectedCustomer.benefit ? `<br><small style="color:var(--primary);font-weight:700">👑 등급 혜택: ${esc(paySelectedCustomer.benefit)}</small>` : '') +
          (paySelectedCustomer.memo ? `<br><small style="color:var(--muted)">메모: ${esc(paySelectedCustomer.memo)}</small>` : '');
        // 사용 가능한 쿠폰 표시
        try {
          const coupons = (await api(`/api/customers/${paySelectedCustomer.id}/coupons`))
            .filter((cp) => cp.status === 'active');
          if (coupons.length) {
            $('#pay-cust-selected').innerHTML += '<div style="margin-top:8px">' + coupons.map((cp) => `
              <label style="display:flex;gap:6px;align-items:center;font-size:13px;margin-top:4px">
                <input type="checkbox" data-coupon="${cp.id}" style="width:15px;height:15px" />
                🎟 ${esc(cp.name)} <small style="color:var(--muted)">(~${esc(cp.expires_at)})</small>
              </label>`).join('') + '</div>';
          }
        } catch { /* 쿠폰 조회 실패 무시 */ }
      }));
    }, 250);
  });
}));

$('#btn-clear-table').addEventListener('click', () => {
  if (!currentTableId) return;
  confirmModal('테이블 비우기', '미결제 주문이 취소되고 테이블이 비워집니다. 계속할까요?', async () => {
    await api(`/api/tables/${currentTableId}/clear`, { method: 'POST' });
    toast('테이블을 비웠습니다.');
    hideOrderPanel();
    renderTables();
  }, '비우기');
});

/* ============ 예약 ============ */
const resvStatusBadge = {
  booked: '<span class="badge gold">예약됨</span>',
  seated: '<span class="badge green">착석완료</span>',
  cancelled: '<span class="badge gray">취소</span>',
  noshow: '<span class="badge red">노쇼</span>',
};

let resvFranchiseCache = [];

async function loadReservations() {
  resvFranchiseCache = await api('/api/franchises');
  const filterSel = $('#resv-franchise-filter');
  const cur = filterSel.value;
  filterSel.innerHTML = '<option value="">전체 지점</option>' +
    resvFranchiseCache.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  filterSel.value = cur;

  const q = filterSel.value ? `?franchise_id=${filterSel.value}` : '';
  const rows = await api('/api/reservations' + q);

  const today = new Date().toISOString().slice(0, 10);
  $('#resv-table tbody').innerHTML = rows.map((r) => {
    const isToday = r.reserved_at.slice(0, 10) === today;
    return `<tr>
      <td><b>${isToday ? '오늘 ' : ''}${esc(r.reserved_at.slice(5, 16).replace('-', '/'))}</b></td>
      <td>${esc(r.franchise_name)}</td>
      <td><b>${esc(r.name)}</b></td>
      <td>${esc(r.phone)}</td>
      <td>${r.guests}명</td>
      <td>${r.table_label ? esc(r.table_label) : '<span style="color:var(--muted)">미지정</span>'}</td>
      <td style="max-width:160px">${esc(r.memo)}</td>
      <td>${resvStatusBadge[r.status] || esc(r.status)}</td>
      <td class="ta-r">${r.status === 'booked' ? `
        <button class="btn small primary" data-seat="${r.id}">착석</button>
        <button class="btn small ghost" data-edit="${r.id}">수정</button>
        <button class="btn small danger ghost" data-cancel="${r.id}">취소</button>
        <button class="btn small ghost" data-noshow="${r.id}">노쇼</button>` : ''}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" style="color:var(--muted)">예약이 없습니다.</td></tr>';

  $$('#resv-table [data-seat]').forEach((b) => b.addEventListener('click', async () => {
    try {
      const r = await api(`/api/reservations/${b.dataset.seat}/seat`, { method: 'POST', body: {} });
      toast(`착석 처리 완료 · 주문 #${r.order_id} 생성`);
      loadReservations();
    } catch (e) { if (!e.handled) toast(e.message, 'error'); }
  }));
  $$('#resv-table [data-edit]').forEach((b) => b.addEventListener('click', () =>
    resvModal(rows.find((r) => r.id === Number(b.dataset.edit)))));
  $$('#resv-table [data-cancel]').forEach((b) => b.addEventListener('click', () => {
    confirmModal('예약 취소', '이 예약을 취소 처리할까요?', async () => {
      await api(`/api/reservations/${b.dataset.cancel}`, { method: 'PUT', body: { status: 'cancelled' } });
      toast('예약이 취소되었습니다.');
      loadReservations();
    }, '예약 취소');
  }));
  $$('#resv-table [data-noshow]').forEach((b) => b.addEventListener('click', () => {
    confirmModal('노쇼 처리', '이 예약을 노쇼로 기록할까요?', async () => {
      await api(`/api/reservations/${b.dataset.noshow}`, { method: 'PUT', body: { status: 'noshow' } });
      toast('노쇼로 기록되었습니다.');
      loadReservations();
    }, '노쇼 처리');
  }));
}

$('#resv-franchise-filter').addEventListener('change', loadReservations);

function resvModal(r = null) {
  const frOptions = resvFranchiseCache.filter((f) => f.status === 'open')
    .map((f) => `<option value="${f.id}" ${r?.franchise_id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  const dt = r ? r.reserved_at.slice(0, 16).replace(' ', 'T') : '';
  openModal(r ? '예약 수정' : '예약 등록', `
    <div class="field"><label>지점</label><select id="rv-franchise">${frOptions}</select></div>
    ${field('rv-name', '예약자명', r?.name || '')}
    ${field('rv-phone', '연락처', r?.phone || '')}
    ${field('rv-guests', '인원', r?.guests ?? 2, 'number', 'min="1"')}
    ${field('rv-at', '예약 일시', dt, 'datetime-local')}
    ${field('rv-memo', '메모', r?.memo || '')}
  `, async () => {
    const body = {
      franchise_id: Number($('#rv-franchise').value),
      name: $('#rv-name').value.trim(),
      phone: $('#rv-phone').value.trim(),
      guests: Number($('#rv-guests').value) || 2,
      reserved_at: $('#rv-at').value,
      memo: $('#rv-memo').value.trim(),
    };
    if (!body.name || !body.reserved_at) throw new Error('예약자명과 일시를 입력해주세요.');
    if (r) { await api(`/api/reservations/${r.id}`, { method: 'PUT', body }); toast('예약이 수정되었습니다.'); }
    else { await api('/api/reservations', { method: 'POST', body }); toast('예약이 등록되었습니다.'); }
    loadReservations();
  });
}
$('#btn-add-resv').addEventListener('click', () => resvModal());

/* ============ 결제 관리 ============ */
const methodLabel = { card: '카드', cash: '현금', mobile: '간편결제' };

function payQuery() {
  const p = new URLSearchParams();
  if ($('#pay-f-franchise').value) p.set('franchise_id', $('#pay-f-franchise').value);
  if ($('#pay-f-method').value) p.set('method', $('#pay-f-method').value);
  if ($('#pay-f-status').value) p.set('status', $('#pay-f-status').value);
  if ($('#pay-f-date').value) p.set('date', $('#pay-f-date').value);
  const s = p.toString();
  return s ? '?' + s : '';
}

async function loadPayments() {
  const frSel = $('#pay-f-franchise');
  const franchises = await api('/api/franchises');
  const curVal = frSel.value;
  frSel.innerHTML = '<option value="">전체 지점</option>' +
    franchises.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  frSel.value = curVal;

  const q = payQuery();
  const { rows, summary } = await api('/api/payments' + q);

  $('#pay-summary').innerHTML =
    `총 <b>${summary.cnt.toLocaleString()}건</b> · 완료 <b>${won(summary.completed_total)}</b>` +
    (summary.refunded_total ? ` · 환불 <b style="color:var(--red)">${won(summary.refunded_total)}</b>` : '');

  $('#payments-table tbody').innerHTML = rows.map((p) => `
    <tr>
      <td style="color:var(--muted)">#${p.id}</td>
      <td>${esc(p.franchise_name)}</td>
      <td>${methodLabel[p.method] || esc(p.method)}</td>
      <td class="ta-r"><b>${won(p.amount)}</b></td>
      <td>${p.status === 'completed' ? '<span class="badge green">완료</span>' : '<span class="badge red">환불됨</span>'}</td>
      <td style="color:var(--muted)">${esc(p.paid_at)}</td>
      <td class="ta-r">${p.status === 'completed' ? `<button class="btn small danger ghost" data-refund="${p.id}">환불</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="7" style="color:var(--muted)">조건에 맞는 결제가 없습니다.</td></tr>';

  $$('#payments-table [data-refund]').forEach((b) => b.addEventListener('click', () => {
    confirmModal('환불 처리', `결제 #${b.dataset.refund}을(를) 환불 처리할까요?`, async () => {
      await api(`/api/payments/${b.dataset.refund}/refund`, { method: 'POST' });
      toast('환불 처리되었습니다.');
      loadPayments();
    }, '환불');
  }));
}

['pay-f-franchise', 'pay-f-method', 'pay-f-status', 'pay-f-date'].forEach((id) =>
  $('#' + id).addEventListener('change', loadPayments));
$('#pay-f-reset').addEventListener('click', () => {
  ['pay-f-franchise', 'pay-f-method', 'pay-f-status', 'pay-f-date'].forEach((id) => { $('#' + id).value = ''; });
  loadPayments();
});

// CSV: 무료 플랜은 업그레이드 유도, 유료 플랜은 파일 다운로드
$('#btn-export-csv').addEventListener('click', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/payments/export.csv' + payQuery());
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    return openUpgradeModal(data.error || 'CSV 내보내기는 프로 플랜부터 제공됩니다.');
  }
  if (!res.ok) return toast('내보내기에 실패했습니다.', 'error');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'payments.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV 파일을 다운로드했습니다.');
});

/* ============ AI ============ */
const aiHistory = [];
let aiProfile = null;
let aiProfileChecked = false;

const AI_CUSTOMER_OPTS = [
  ['office', '직장인'], ['family', '가족'], ['couple', '커플·데이트'],
  ['tourist', '관광객'], ['group', '단체·회식'], ['student', '학생'],
];
const AI_AREA_OPTS = [
  ['office', '오피스 상권'], ['residential', '주거 상권'], ['downtown', '번화가·유흥'],
  ['tourist', '관광지'], ['mixed', '복합 상권'],
];

async function loadAiView() {
  refreshMe();
  if (aiProfileChecked || ME.user.role === 'staff') return;
  aiProfileChecked = true;
  try {
    const d = await api('/api/ai/profile');
    aiProfile = d.profile;
    if (!d.hasPrompt && ME.user.role === 'owner') {
      const card = addAiMsg('assistant',
        '아직 우리 가게 정보를 몰라요. 2분만 알려주시면, 가게 전용 AI로 업그레이드해서 우리 가게 상황에 딱 맞는 답을 드릴게요.');
      const btn = document.createElement('button');
      btn.className = 'btn primary';
      btn.style.marginTop = '10px';
      btn.textContent = '⚙ 우리 가게 AI 설정 시작 (2분)';
      btn.addEventListener('click', aiProfileModal);
      card.appendChild(btn);
    } else if (d.hasPrompt && aiProfile) {
      addAiMsg('assistant',
        `우리 가게 전용 AI가 준비되어 있어요${aiProfile.intro ? ` — "${aiProfile.intro}"` : ''}. 가게 상황에 맞춰 답변드립니다. 프로필은 "🛠 우리 가게 AI 설정"에서 언제든 수정할 수 있어요.`);
    }
  } catch { /* 프로필 조회 실패는 챗 사용을 막지 않음 */ }
}

function aiProfileModal() {
  const p = aiProfile || {};
  openModal('우리 가게 AI 설정', `
    <p class="modal-desc">답변해주신 내용과 가게 데이터(메뉴·매출 패턴·고객 구성)를 합쳐 <b>우리 가게 전용 AI</b>를 만듭니다.</p>
    ${field('aip-intro', '우리 가게 한 줄 소개', p.intro || '', 'text', 'placeholder="예: 청담동 하이엔드 오마카세, 바 8석 중심"')}
    <div class="field"><label>주 고객층 (복수 선택)</label>
      <div class="chip-row">${AI_CUSTOMER_OPTS.map(([k, label]) =>
        `<button type="button" class="chip ${p.customers?.includes(k) ? 'active' : ''}" data-aipc="${k}">${label}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>상권</label>
      <select id="aip-area">${AI_AREA_OPTS.map(([k, label]) =>
        `<option value="${k}" ${p.area === k ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    ${field('aip-concerns', '요즘 가장 큰 고민', p.concerns || '', 'text', 'placeholder="예: 평일 점심 공석, 노쇼 손님"')}
    <div class="field"><label>답변 스타일</label>
      <select id="aip-style">
        <option value="brief" ${p.style !== 'detail' ? 'selected' : ''}>짧고 핵심만</option>
        <option value="detail" ${p.style === 'detail' ? 'selected' : ''}>자세하고 친절하게</option>
      </select>
    </div>
  `, async () => {
    const profile = {
      intro: $('#aip-intro').value.trim(),
      customers: [...$$('#modal-body [data-aipc].active')].map((c) => c.dataset.aipc),
      area: $('#aip-area').value,
      concerns: $('#aip-concerns').value.trim(),
      style: $('#aip-style').value,
    };
    const typingEl = addTyping('가게 데이터를 요약하고 전용 AI를 만들고 있어요...');
    closeModal();
    try {
      const r = await api('/api/ai/profile', { method: 'POST', body: { profile } });
      aiProfile = profile;
      typingEl.innerHTML = renderMarkdown(
        `✅ **우리 가게 전용 AI가 준비됐어요!**\n\n이제부터 ${ME.tenant.name}의 업종·고객층·상권·고민을 반영해서 답변합니다.` +
        (r.generated ? '' : '\n\n*(참고: AI 키가 없어 데이터 기반 기본 프로필로 설정했어요. ANTHROPIC_API_KEY를 넣으면 더 정교해집니다)*') +
        '\n\n무엇이든 물어보세요 — 예: "요즘 고민 해결할 방법 있을까?"');
    } catch (e) {
      typingEl.remove();
      if (!e.handled) toast(e.message, 'error');
    }
  }, 'AI 만들기');

  $$('#modal-body [data-aipc]').forEach((c) => c.addEventListener('click', () => c.classList.toggle('active')));
}

$('#btn-ai-profile').addEventListener('click', aiProfileModal);

function renderMarkdown(text) {
  const safe = esc(text);
  const lines = safe.split('\n');
  const out = [];
  let listType = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const inline = (s) => s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    if (/^#{1,4}\s+/.test(line)) {
      closeList();
      out.push(`<h4>${inline(line.replace(/^#{1,4}\s+/, ''))}</h4>`);
    } else if (/^[-•]\s+/.test(line)) {
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${inline(line.replace(/^[-•]\s+/, ''))}</li>`);
    } else if (/^\d+[.)]\s+/.test(line)) {
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${inline(line.replace(/^\d+[.)]\s+/, ''))}</li>`);
    } else if (line === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('');
}

function addAiMsg(role, text) {
  const div = document.createElement('div');
  div.className = `ai-msg ${role}`;
  if (role === 'assistant') div.innerHTML = renderMarkdown(text);
  else div.textContent = text;
  $('#ai-messages').appendChild(div);
  $('#ai-messages').scrollTop = $('#ai-messages').scrollHeight;
  return div;
}

function addTyping(label = '데이터 분석 중...') {
  const div = document.createElement('div');
  div.className = 'ai-msg assistant';
  div.innerHTML = `<span class="typing"><i></i><i></i><i></i></span> ${label}`;
  $('#ai-messages').appendChild(div);
  $('#ai-messages').scrollTop = $('#ai-messages').scrollHeight;
  return div;
}

async function askAi(question) {
  addAiMsg('user', question);
  aiHistory.push({ role: 'user', content: question });
  const typingEl = addTyping();
  try {
    const r = await api('/api/ai/chat', { method: 'POST', body: { messages: aiHistory } });
    typingEl.innerHTML = renderMarkdown(r.text);
    aiHistory.push({ role: 'assistant', content: r.text });
    refreshMe();
  } catch (err) {
    typingEl.remove();
    if (!err.handled) addAiMsg('assistant', '오류: ' + err.message);
  }
  $('#ai-messages').scrollTop = $('#ai-messages').scrollHeight;
}

$('#ai-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#ai-input').value.trim();
  if (!q) return;
  $('#ai-input').value = '';
  askAi(q);
});

$$('#ai-suggests .chip').forEach((c) => c.addEventListener('click', () => askAi(c.dataset.q)));

$('#btn-ai-insights').addEventListener('click', async () => {
  const typingEl = addTyping('최근 14일 데이터로 경영 인사이트를 생성 중입니다...');
  try {
    const r = await api('/api/ai/insights', { method: 'POST' });
    typingEl.innerHTML = renderMarkdown(r.text);
    aiHistory.push({ role: 'assistant', content: r.text });
    refreshMe();
  } catch (err) {
    typingEl.remove();
    if (!err.handled) addAiMsg('assistant', '오류: ' + err.message);
  }
  $('#ai-messages').scrollTop = $('#ai-messages').scrollHeight;
});

/* ============ 주소 검색 (카카오/다음 우편번호 서비스) ============ */
let postcodeScriptPromise = null;
function loadPostcodeScript() {
  if (!postcodeScriptPromise) {
    postcodeScriptPromise = new Promise((resolve, reject) => {
      if (window.daum?.Postcode) return resolve();
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = resolve;
      s.onerror = () => { postcodeScriptPromise = null; reject(new Error('주소 검색 서비스를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.')); };
      document.head.appendChild(s);
    });
  }
  return postcodeScriptPromise;
}

// prefix 규약: {prefix}-zip / {prefix}-addr-btn / 기본주소 input / 상세 input / {prefix}-addr-box
async function wireAddressSearch(prefix, baseInputId) {
  const btn = $(`#${prefix}-addr-btn`);
  const box = $(`#${prefix}-addr-box`);
  const baseInput = $('#' + baseInputId);
  btn.addEventListener('click', async () => {
    if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
    try {
      await loadPostcodeScript();
    } catch (e) {
      // 오프라인 등: 직접 입력 허용
      baseInput.readOnly = false;
      baseInput.placeholder = '주소를 직접 입력해주세요';
      baseInput.focus();
      return toast(e.message + ' 주소를 직접 입력할 수 있습니다.', 'error');
    }
    box.classList.remove('hidden');
    box.innerHTML = '';
    new daum.Postcode({
      oncomplete: (data) => {
        box.classList.add('hidden');
        const base = data.roadAddress || data.jibunAddress;
        const building = data.buildingName ? ` (${data.buildingName})` : '';
        $(`#${prefix}-zip`).value = data.zonecode;
        baseInput.value = base + building;
        const detail = $(`#${prefix}-addr-detail`) || $(`#${baseInputId}-detail`);
        if (detail) detail.focus();
      },
      width: '100%',
      height: '100%',
    }).embed(box);
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

const combineAddress = (base, detail) => [String(base || '').trim(), String(detail || '').trim()].filter(Boolean).join(', ');

/* ============ 온보딩 (가게 설정하기) ============ */
let obData = null;

function obGoStep(n) {
  $$('.ob-page').forEach((p) => p.classList.add('hidden'));
  $(`#ob-page-${n}`).classList.remove('hidden');
  $$('.ob-step').forEach((s) => {
    const k = Number(s.dataset.obstep);
    s.classList.toggle('active', k === n);
    s.classList.toggle('done', k < n);
  });
}

async function loadOnboarding() {
  obData = await api('/api/onboarding');
  if (obData.hasFranchise) return switchView('dashboard'); // 이미 설정됨
  $('#ob-name').value = $('#ob-name').value || `${obData.tenantName} 본점`;
  $('#ob-preset-title').textContent = `${obData.storeLabel} 추천 메뉴로 시작`;
  $('#ob-preset-preview').innerHTML = obData.presetMenus
    .map((m) => `<span>${esc(m.name)} ${won(m.price)}</span>`).join('');
  if (!$('#ob-custom-list').children.length) for (let i = 0; i < 3; i++) obAddCustomRow();
  obGoStep(1);
}

function obAddCustomRow() {
  const row = document.createElement('div');
  row.className = 'tier-row';
  row.style.gridTemplateColumns = '1fr 90px 110px 32px';
  row.innerHTML = `
    <input data-f="name" placeholder="예: 김치찌개" />
    <input data-f="category" placeholder="메인" />
    <input data-f="price" type="number" min="0" step="100" placeholder="9000" />
    <button type="button" class="btn small ghost" style="padding:4px">✕</button>`;
  row.querySelector('button').addEventListener('click', () => row.remove());
  $('#ob-custom-list').appendChild(row);
}

$('#ob-add-row').addEventListener('click', obAddCustomRow);
wireAddressSearch('ob', 'ob-address');

$('#ob-next-1').addEventListener('click', () => {
  if (!$('#ob-name').value.trim()) return toast('매장 이름을 입력해주세요.', 'error');
  obGoStep(2);
});
$('#ob-back-2').addEventListener('click', () => obGoStep(1));

$$('#ob-page-2 input[name="obmenu"]').forEach((r) => r.addEventListener('change', () => {
  const mode = document.querySelector('input[name="obmenu"]:checked').value;
  $('#ob-preset-preview').classList.toggle('hidden', mode !== 'preset');
  $('#ob-custom-rows').classList.toggle('hidden', mode !== 'custom');
}));

$('#ob-finish').addEventListener('click', async () => {
  const btn = $('#ob-finish');
  const mode = document.querySelector('input[name="obmenu"]:checked').value;
  const customMenus = [...$$('#ob-custom-list .tier-row')].map((row) => ({
    name: row.querySelector('[data-f="name"]').value.trim(),
    category: row.querySelector('[data-f="category"]').value.trim() || '메인',
    price: Number(row.querySelector('[data-f="price"]').value),
  })).filter((m) => m.name && Number.isFinite(m.price) && m.price >= 0);
  if (mode === 'custom' && !customMenus.length) return toast('메뉴를 1개 이상 입력하거나 다른 방식을 선택해주세요.', 'error');

  btn.disabled = true; btn.textContent = '만드는 중...';
  try {
    const r = await api('/api/onboarding', {
      method: 'POST',
      body: {
        franchise: {
          name: $('#ob-name').value.trim(),
          address: combineAddress($('#ob-address').value, $('#ob-address-detail').value),
          phone: $('#ob-phone').value.trim(),
          tables: Number($('#ob-tables').value) || 8,
        },
        menus: mode,
        customMenus,
      },
    });
    await refreshMe();
    $('#ob-done-desc').innerHTML =
      `<b>${esc($('#ob-name').value.trim())}</b> · 테이블 ${r.tables}개` +
      (r.menus ? ` · 메뉴 ${r.menus}종` : ' · 메뉴는 나중에 추가') +
      '<br>이제 바로 사용하실 수 있어요. 다음으로 해보시면 좋은 것들:';
    obGoStep(3);
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '가게 만들기 ✓';
});

$$('#ob-page-3 [data-obgo]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.obgo)));
$('#ob-go-dashboard').addEventListener('click', () => switchView('dashboard'));

/* ============ 고객 관리 ============ */
const custGradeBadge = {
  VIP: '<span class="badge orange">VIP</span>',
  '단골': '<span class="badge gold">단골</span>',
  '일반': '<span class="badge gray">일반</span>',
  '신규': '<span class="badge green">신규</span>',
};
let custQ = '', custSegment = '', custPage = 1;
let segMetaCache = {};

async function renderSegChips() {
  const d = await api('/api/customers/segments');
  segMetaCache = Object.fromEntries(d.segments.map((s) => [s.key, s]));
  const chips = [
    { key: '', label: '전체', count: null },
    ...d.segments,
    { key: 'birthweek', label: '🎂 이번 주 생일', count: d.birthweek, desc: '7일 안에 생일인 고객' },
    { key: 'noshow', label: '노쇼 이력', count: null, desc: '노쇼 1회 이상' },
  ];
  segMetaCache.birthweek = chips.at(-2);
  segMetaCache.noshow = chips.at(-1);
  $('#cust-grade-chips').innerHTML = chips.map((c) => `
    <button class="chip ${c.key === custSegment ? 'active' : ''}" data-grade="${c.key}">
      ${esc(c.label)}${c.count != null ? ` ${c.count.toLocaleString()}` : ''}
    </button>`).join('');
  $$('#cust-grade-chips .chip').forEach((c) => c.addEventListener('click', () => {
    custSegment = c.dataset.grade;
    custPage = 1;
    loadCustomers();
  }));
  const meta = segMetaCache[custSegment];
  $('#cust-seg-desc').textContent = meta?.desc || '그룹을 선택하면 해당 고객에게만 문자를 보낼 수 있습니다.';
  $('#btn-sms-segment').disabled = !custSegment;
}

async function loadCustomers() {
  renderSegChips();
  const p = new URLSearchParams({ q: custQ, segment: custSegment, page: custPage });
  const d = await api('/api/customers?' + p);

  $('#cust-stats').innerHTML = `
    <div class="card"><div class="label">전체 고객</div><div class="value">${d.stats.total.toLocaleString()}명</div></div>
    <div class="card"><div class="label">VIP (10회 이상)</div><div class="value">${(d.stats.vip || 0).toLocaleString()}명</div></div>
    <div class="card"><div class="label">단골 (5회 이상)</div><div class="value">${(d.stats.regular || 0).toLocaleString()}명</div></div>
    <div class="card"><div class="label">최근 30일 방문</div><div class="value">${(d.stats.recent30 || 0).toLocaleString()}명</div></div>
    <div class="card"><div class="label">문자 수신 동의</div><div class="value">${(d.stats.sms_ok || 0).toLocaleString()}명</div></div>
  `;
  $('#cust-count').innerHTML = `검색 결과 <b>${d.total.toLocaleString()}명</b>`;

  $('#cust-table tbody').innerHTML = d.rows.map((c) => `
    <tr>
      <td><b>${esc(c.name)}</b></td>
      <td>${esc(c.phone)}</td>
      <td>${custGradeBadge[c.grade] || esc(c.grade)}</td>
      <td>${c.visit_count}회</td>
      <td>${c.noshow_count ? `<span style="color:var(--red);font-weight:700">${c.noshow_count}회</span>` : '-'}</td>
      <td>${c.total_spent ? won(c.total_spent) : '-'}</td>
      <td style="color:var(--muted)">${c.last_visit ? esc(c.last_visit.slice(0, 10)) : '-'}</td>
      <td style="max-width:200px;font-size:12px;color:var(--muted)">${esc([c.favorite_food, c.traits].filter(Boolean).join(' · ')).slice(0, 60)}</td>
      <td class="ta-r"><button class="btn small ghost" data-edit="${c.id}">상세</button></td>
    </tr>`).join('') || '<tr><td colspan="9" style="color:var(--muted)">고객이 없습니다. 엑셀로 가져오거나 결제 시 전화번호를 입력하면 자동으로 쌓입니다.</td></tr>';

  const pages = Math.max(Math.ceil(d.total / d.size), 1);
  const win = [];
  for (let i = Math.max(1, custPage - 3); i <= Math.min(pages, custPage + 3); i++) win.push(i);
  $('#cust-pager').innerHTML = pages > 1 ? [
    custPage > 1 ? `<button data-pg="${custPage - 1}">◀</button>` : '',
    ...win.map((i) => `<button class="${i === custPage ? 'cur' : ''}" data-pg="${i}">${i}</button>`),
    custPage < pages ? `<button data-pg="${custPage + 1}">▶</button>` : '',
  ].join('') : '';
  $$('#cust-pager [data-pg]').forEach((b) => b.addEventListener('click', () => { custPage = Number(b.dataset.pg); loadCustomers(); }));

  $$('#cust-table [data-edit]').forEach((b) => b.addEventListener('click', () =>
    customerModal(d.rows.find((c) => c.id === Number(b.dataset.edit)))));
}

let custSearchTimer = null;
$('#cust-search').addEventListener('input', (e) => {
  clearTimeout(custSearchTimer);
  custSearchTimer = setTimeout(() => { custQ = e.target.value.trim(); custPage = 1; loadCustomers(); }, 300);
});

/* --- 문자 발송 --- */
$('#btn-sms-segment').addEventListener('click', async () => {
  if (!custSegment) return toast('먼저 위에서 보낼 그룹을 선택해주세요.', 'error');
  const meta = segMetaCache[custSegment] || { label: custSegment };
  openModal(`"${meta.label}" 그룹에 문자 보내기`, `
    <p class="modal-desc">문자 수신에 동의한 고객에게만 발송됩니다. <b>{이름}</b>은 고객 이름으로 자동 변경됩니다.</p>
    <div class="field"><label>문구</label>
      <textarea id="sms-msg" rows="4" style="width:100%;padding:10px 13px;border:1px solid var(--line);border-radius:10px;font-size:14px;font-family:inherit"
        placeholder="{이름}님, 오랜만이에요! ..."></textarea></div>
    <button class="btn small" type="button" id="btn-sms-ai">✦ AI로 문구 만들기</button>
    <div id="sms-send-note" style="font-size:12px;color:var(--muted);margin-top:10px"></div>
  `, async () => {
    const message = $('#sms-msg').value.trim();
    if (!message) throw new Error('문구를 입력해주세요.');
    const r = await api('/api/sms/send', { method: 'POST', body: { segment: custSegment, message } });
    toast(r.dev
      ? `개발 모드: ${r.sent}건 발송 처리(실발송 안 됨). .env에 알리고 키를 설정하면 실제 발송됩니다.`
      : `${r.sent}건 발송 완료${r.failed ? `, 실패 ${r.failed}건` : ''}`);
  }, '발송하기');

  $('#btn-sms-ai').addEventListener('click', async () => {
    const btn = $('#btn-sms-ai');
    btn.disabled = true; btn.textContent = '문구 생성 중...';
    try {
      const r = await api('/api/sms/suggest', { method: 'POST', body: { segment: custSegment } });
      $('#sms-msg').value = r.text;
    } catch (e) { if (!e.handled) toast(e.message, 'error'); }
    btn.disabled = false; btn.textContent = '✦ AI로 문구 만들기';
  });
});

$('#btn-sms-history').addEventListener('click', async () => {
  const d = await api('/api/sms/history');
  const quotaText = d.quota.limit === null ? '무제한' : `${d.quota.used}/${d.quota.limit}건 사용`;
  openModal('문자 발송 내역', `
    <p class="modal-desc">이번 달 ${quotaText} · ${d.smsEnabled ? '알리고 연동됨' : '개발 모드(실발송 안 됨)'}</p>
    <div class="table-scroll" style="max-height:50vh;overflow-y:auto">
      <table class="table">
        <thead><tr><th>일시</th><th>고객</th><th>상태</th><th>내용</th></tr></thead>
        <tbody>${d.rows.map((r) => `
          <tr>
            <td style="color:var(--muted);white-space:nowrap">${esc(r.created_at.slice(5, 16))}</td>
            <td>${esc(r.customer_name || r.phone)}</td>
            <td>${r.status === 'sent' ? '<span class="badge green">발송</span>'
              : r.status === 'dev' ? '<span class="badge gold">개발</span>'
              : '<span class="badge red">실패</span>'}</td>
            <td style="font-size:12px">${esc(r.message.slice(0, 60))}</td>
          </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">발송 내역이 없습니다.</td></tr>'}
        </tbody>
      </table>
    </div>
  `, async () => {}, '닫기');
  $('#modal-cancel').classList.add('hidden');
});

function customerModal(c = null) {
  openModal(c ? `${c.name} 고객 정보` : '고객 등록', `
    ${field('cu-name', '이름', c?.name || '')}
    ${field('cu-phone', '연락처', c?.phone || '')}
    ${field('cu-birthday', '생일 (예: 05-14)', c?.birthday || '', 'text', 'placeholder="MM-DD — 입력하면 생일 쿠폰이 자동 발송됩니다"')}
    ${field('cu-food', '선호 음식', c?.favorite_food || '')}
    ${field('cu-seat', '선호 자리', c?.favorite_seat || '')}
    ${field('cu-traits', '고객 특징', c?.traits || '')}
    ${field('cu-memo', '메모', c?.memo || '')}
    <div class="field"><label style="display:flex;gap:8px;align-items:center">
      <input type="checkbox" id="cu-sms" style="width:16px;height:16px" ${c?.sms_opt_in ? 'checked' : ''} /> 문자 수신 동의
    </label></div>
    ${c ? `<p class="modal-desc" style="font-size:12px;color:var(--muted)">방문 ${c.visit_count}회 · 노쇼 ${c.noshow_count}회 · 누적 ${won(c.total_spent)} · 첫 방문 ${c.first_visit || '-'}</p>
    <div id="cu-coupons" style="font-size:13px"></div>
    <button type="button" class="btn small" id="btn-add-coupon" style="margin-top:6px">+ 쿠폰 발급</button>` : ''}
  `, async () => {
    const body = {
      name: $('#cu-name').value.trim(), phone: $('#cu-phone').value.trim(),
      birthday: $('#cu-birthday').value.trim(),
      favorite_food: $('#cu-food').value.trim(), favorite_seat: $('#cu-seat').value.trim(),
      traits: $('#cu-traits').value.trim(), memo: $('#cu-memo').value.trim(),
      sms_opt_in: $('#cu-sms').checked,
    };
    if (!body.name) throw new Error('이름을 입력해주세요.');
    if (c) { await api(`/api/customers/${c.id}`, { method: 'PUT', body: { ...c, ...body } }); toast('고객 정보가 저장되었습니다.'); }
    else { await api('/api/customers', { method: 'POST', body }); toast('고객이 등록되었습니다.'); }
    loadCustomers();
  });

  if (c) {
    const renderCoupons = async () => {
      const cps = await api(`/api/customers/${c.id}/coupons`);
      $('#cu-coupons').innerHTML = cps.length
        ? '<b>쿠폰:</b> ' + cps.map((cp) =>
            `${cp.status === 'active' ? '🎟' : ''} ${esc(cp.name)} <small style="color:var(--muted)">(${cp.status === 'active' ? '~' + cp.expires_at : cp.status === 'used' ? '사용됨' : '만료'})</small>`
          ).join('<br>')
        : '';
    };
    renderCoupons();
    $('#btn-add-coupon').addEventListener('click', async () => {
      const name = window.prompt('쿠폰 이름 (예: 음료 서비스 쿠폰)', '음료 서비스 쿠폰');
      if (!name) return;
      await api(`/api/customers/${c.id}/coupons`, { method: 'POST', body: { name } });
      toast('쿠폰이 발급되었습니다. (유효기간 30일)');
      renderCoupons();
    });
  }
}
$('#btn-add-customer').addEventListener('click', () => customerModal());

/* --- 혜택 설정 (업종 / 생일 쿠폰 / 등급별 혜택) --- */
$('#btn-crm-settings').addEventListener('click', async () => {
  const d = await api('/api/crm/settings');
  const s = d.settings;
  const bd = s.birthday;
  const tierRows = (tiers) => tiers.map((t, i) => `
    <div class="tier-row" data-tier="${i}">
      <input value="${esc(t.label)}" data-f="label" ${i === tiers.length - 1 ? 'readonly style="background:#faf7f1"' : ''} />
      <input type="number" min="0" value="${t.min_visits}" data-f="min_visits" ${i === tiers.length - 1 ? 'readonly style="background:#faf7f1"' : ''} />
      <input type="number" min="0" step="10000" value="${t.min_spent}" data-f="min_spent" ${i === tiers.length - 1 ? 'readonly style="background:#faf7f1"' : ''} />
      <input value="${esc(t.benefit)}" data-f="benefit" placeholder="혜택 (예: 음료 서비스)" />
    </div>`).join('');

  openModal('혜택 설정', `
    <div class="field"><label>매장 유형</label>
      <select id="cs-type">
        ${d.storeTypes.map((t) => `<option value="${t.key}" ${t.key === d.store_type ? 'selected' : ''}>${esc(t.label)} — ${esc(t.desc)}</option>`).join('')}
      </select>
      <button type="button" class="btn small ghost" id="cs-apply-preset" style="margin-top:6px">이 유형의 추천 설정 불러오기</button>
    </div>
    <div class="field"><label>🎂 생일 쿠폰 — 언제 보낼까요?</label>
      <div class="row-gap">생일 <input id="cs-days" type="number" min="0" max="90" value="${bd.days_before}" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:8px" /> 일 전에 자동 발송</div>
    </div>
    <div class="field"><label>🎟 쿠폰 사용기한</label>
      <select id="cs-expiry">
        <option value="birth_month_end" ${bd.expiry === 'birth_month_end' ? 'selected' : ''}>생일이 있는 달 말일까지</option>
        <option value="days" ${bd.expiry === 'days' ? 'selected' : ''}>발급 후 지정한 일수까지</option>
      </select>
      <div class="row-gap" id="cs-expiry-days-row" style="margin-top:6px;${bd.expiry === 'birth_month_end' ? 'display:none' : ''}">
        발급 후 <input id="cs-expiry-days" type="number" min="1" max="180" value="${bd.expiry_days}" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:8px" /> 일까지
      </div>
    </div>
    <div class="field"><label>👑 등급별 혜택 — 방문 횟수 <b>또는</b> 누적 매출 중 하나만 넘으면 해당 등급</label>
      <div class="tier-row tier-head"><div>등급</div><div>방문 이상</div><div>누적매출 이상</div><div>혜택</div></div>
      <div id="cs-tiers">${tierRows(s.tiers)}</div>
      <small style="color:var(--muted)">마지막 줄(일반)은 모든 고객 기본 혜택입니다. 생일 쿠폰과 수동 쿠폰에 자동 적용됩니다.</small>
    </div>
  `, async () => {
    const tiers = [...$$('#cs-tiers .tier-row')].map((row) => ({
      label: row.querySelector('[data-f="label"]').value.trim(),
      min_visits: Number(row.querySelector('[data-f="min_visits"]').value) || 0,
      min_spent: Number(row.querySelector('[data-f="min_spent"]').value) || 0,
      benefit: row.querySelector('[data-f="benefit"]').value.trim(),
    }));
    await api('/api/crm/settings', {
      method: 'PUT',
      body: {
        store_type: $('#cs-type').value,
        settings: {
          birthday: {
            days_before: Number($('#cs-days').value),
            expiry: $('#cs-expiry').value,
            expiry_days: Number($('#cs-expiry-days').value),
          },
          tiers,
        },
      },
    });
    toast('혜택 설정이 저장되었습니다.');
  });

  $('#cs-expiry').addEventListener('change', (e) => {
    $('#cs-expiry-days-row').style.display = e.target.value === 'days' ? '' : 'none';
  });
  $('#cs-apply-preset').addEventListener('click', () => {
    const p = d.storeTypes.find((t) => t.key === $('#cs-type').value)?.preset;
    if (!p) return;
    $('#cs-days').value = p.birthday.days_before;
    $('#cs-expiry').value = p.birthday.expiry;
    $('#cs-expiry-days').value = p.birthday.expiry_days;
    $('#cs-expiry-days-row').style.display = p.birthday.expiry === 'days' ? '' : 'none';
    $('#cs-tiers').innerHTML = tierRows(p.tiers);
    toast('추천 설정을 불러왔습니다. 저장을 눌러야 적용됩니다.');
  });
});

// 엑셀 가져오기
$('#btn-cust-import').addEventListener('click', () => $('#cust-file').click());
$('#cust-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  toast(`"${file.name}" 읽는 중... 잠시만요.`);
  const b64 = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result.split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  try {
    const r = await api('/api/customers/import', { method: 'POST', body: { data: b64 } });
    toast(`가져오기 완료 — 신규 ${r.added.toLocaleString()}명, 갱신 ${r.updated.toLocaleString()}명` +
      (r.skipped ? `, 건너뜀 ${r.skipped}건(이름/번호 누락)` : ''));
    custPage = 1;
    loadCustomers();
  } catch (err) { if (!err.handled) toast(err.message, 'error'); }
});

/* ============ 직원 관리 ============ */
let staffCache = [];
let schWeekStart = null;
let curStab = 'list';

function mondayOf(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() || 7) - 1));
  return x.toISOString().slice(0, 10);
}

async function loadStaffMgmt() {
  if (!schWeekStart) schWeekStart = mondayOf(new Date());
  await renderStab();
}

$$('#staff-tabs .chip').forEach((c) => c.addEventListener('click', () => {
  $$('#staff-tabs .chip').forEach((x) => x.classList.remove('active'));
  c.classList.add('active');
  curStab = c.dataset.stab;
  renderStab();
}));

async function renderStab() {
  $$('.stab').forEach((s) => s.classList.add('hidden'));
  $(`#stab-${curStab}`).classList.remove('hidden');
  if (curStab === 'list') await renderStaffList();
  else if (curStab === 'schedule') await renderSchedule();
  else if (curStab === 'attendance') await renderAttendance();
  else if (curStab === 'payroll') await renderPayroll();
}

async function renderStaffList() {
  staffCache = await api('/api/staff');
  const isOwner = ME.user.role === 'owner';
  $('#staff-table tbody').innerHTML = staffCache.map((s) => `
    <tr style="${s.status === 'inactive' ? 'opacity:.5' : ''}">
      <td><b>${esc(s.name)}</b> ${s.status === 'inactive' ? '<span class="badge gray">퇴사</span>' : ''}</td>
      <td>${esc(s.franchise_name || '전체')}</td>
      <td>${esc(s.position)}</td>
      <td>${isOwner && s.pay_amount != null ? `${s.pay_type === 'hourly' ? '시급 ' + won(s.pay_amount) : '월급 ' + won(s.pay_amount)}` : '<span style="color:var(--muted)">대표만 열람</span>'}</td>
      <td style="color:var(--muted)">${esc(s.hired_at || '-')}</td>
      <td>${s.user_id ? '<span class="badge green">연결됨</span>'
        : s.pending_invite ? '<span class="badge gold">초대 중</span>'
        : (isOwner ? `<button class="btn small ghost" data-invite="${s.id}">계정 초대</button>` : '-')}</td>
      <td class="ta-r">${isOwner ? `
        <button class="btn small ghost" data-edit="${s.id}">수정</button>
        <button class="btn small danger ghost" data-del="${s.id}">삭제</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="7" style="color:var(--muted)">등록된 직원이 없습니다.</td></tr>';

  $$('#staff-table [data-edit]').forEach((b) => b.addEventListener('click', () =>
    staffModal(staffCache.find((s) => s.id === Number(b.dataset.edit)))));
  $$('#staff-table [data-del]').forEach((b) => b.addEventListener('click', () => {
    const s = staffCache.find((x) => x.id === Number(b.dataset.del));
    confirmModal('직원 삭제', `${s.name}님을 삭제할까요? 일정·출퇴근 기록이 함께 삭제됩니다.`, async () => {
      await api(`/api/staff/${s.id}`, { method: 'DELETE' });
      toast('직원이 삭제되었습니다.');
      renderStaffList();
    }, '삭제');
  }));
  $$('#staff-table [data-invite]').forEach((b) => b.addEventListener('click', () => {
    const s = staffCache.find((x) => x.id === Number(b.dataset.invite));
    openModal(`${s.name}님 직원 계정 초대`, `
      <p class="modal-desc">직원이 본인 휴대폰으로 출근/퇴근을 찍고 근무 일정을 볼 수 있는 계정을 만듭니다.</p>
      ${field('si-email', '직원 이메일', '', 'email')}
    `, async () => {
      const r = await api(`/api/staff/${s.id}/invite`, { method: 'POST', body: { email: $('#si-email').value.trim() } });
      toast(r.devLink ? '초대 링크가 생성되었습니다. (개발 모드: 링크를 직접 전달하세요)' : '초대 메일을 보냈습니다.');
      if (r.devLink) { try { await navigator.clipboard.writeText(r.devLink); toast('초대 링크가 클립보드에 복사되었습니다.'); } catch {} }
      renderStaffList();
    }, '초대하기');
  }));
}

function staffModal(s = null) {
  const frs = (window._teamFranchises || resvFranchiseCache || []);
  openModal(s ? `${s.name} 정보 수정` : '직원 등록', `
    ${field('st-name', '이름', s?.name || '')}
    ${field('st-phone', '연락처', s?.phone || '')}
    <div class="field"><label>담당 지점</label>
      <select id="st-franchise"><option value="">전체</option>
        ${frs.map((f) => `<option value="${f.id}" ${s?.franchise_id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
      </select></div>
    ${field('st-position', '직무 (홀/주방/매니저 등)', s?.position || '홀')}
    <div class="field"><label>급여 형태</label>
      <select id="st-paytype">
        <option value="hourly" ${s?.pay_type === 'hourly' ? 'selected' : ''}>시급제</option>
        <option value="monthly" ${s?.pay_type === 'monthly' ? 'selected' : ''}>월급제</option>
      </select></div>
    ${field('st-pay', '금액 (원)', s?.pay_amount ?? 10030, 'number', 'min="0" step="10"')}
    ${field('st-hired', '입사일', s?.hired_at || new Date().toISOString().slice(0, 10), 'date')}
    ${s ? `<div class="field"><label>상태</label>
      <select id="st-status">
        <option value="active" ${s.status === 'active' ? 'selected' : ''}>재직</option>
        <option value="inactive" ${s.status === 'inactive' ? 'selected' : ''}>퇴사</option>
      </select></div>` : ''}
  `, async () => {
    const body = {
      name: $('#st-name').value.trim(), phone: $('#st-phone').value.trim(),
      franchise_id: Number($('#st-franchise').value) || null,
      position: $('#st-position').value.trim() || '홀',
      pay_type: $('#st-paytype').value, pay_amount: Number($('#st-pay').value),
      hired_at: $('#st-hired').value, status: s ? $('#st-status').value : 'active',
    };
    if (s) { await api(`/api/staff/${s.id}`, { method: 'PUT', body }); toast('직원 정보가 저장되었습니다.'); }
    else { await api('/api/staff', { method: 'POST', body }); toast('직원이 등록되었습니다.'); }
    renderStaffList();
  });
}
$('#btn-add-staff').addEventListener('click', async () => {
  if (!window._teamFranchises) window._teamFranchises = await api('/api/franchises');
  staffModal();
});

/* --- 주간 일정 --- */
const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];

async function renderSchedule() {
  if (!staffCache.length) staffCache = await api('/api/staff');
  const rows = await api('/api/staff/schedules?from=' + schWeekStart);
  const start = new Date(schWeekStart + 'T12:00:00');
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  const today = new Date().toISOString().slice(0, 10);
  $('#sch-week-label').textContent = `${days[0].slice(5).replace('-', '/')} ~ ${days[6].slice(5).replace('-', '/')}`;

  const byDay = {};
  for (const r of rows) (byDay[r.work_date] ||= []).push(r);

  $('#sch-grid').innerHTML = `<table class="sch-table">
    <thead><tr>${days.map((d) => {
      const dow = DOW_KR[new Date(d + 'T12:00:00').getDay()];
      return `<th class="${d === today ? 'today' : ''}">${d.slice(8)}일 (${dow})${d === today ? ' · 오늘' : ''}</th>`;
    }).join('')}</tr></thead>
    <tbody><tr>${days.map((d) => `<td>${(byDay[d] || []).map((s) => `
      <div class="sch-item"><b>${esc(s.staff_name)}</b>${s.start_time}~${s.end_time}
        <button class="sch-del" data-schdel="${s.id}">✕</button></div>`).join('')}</td>`).join('')}</tr></tbody>
  </table>`;

  $$('#sch-grid [data-schdel]').forEach((b) => b.addEventListener('click', async () => {
    await api(`/api/staff/schedules/${b.dataset.schdel}`, { method: 'DELETE' });
    renderSchedule();
  }));
}

$('#sch-prev').addEventListener('click', () => {
  const d = new Date(schWeekStart); d.setDate(d.getDate() - 7);
  schWeekStart = d.toISOString().slice(0, 10);
  renderSchedule();
});
$('#sch-next').addEventListener('click', () => {
  const d = new Date(schWeekStart); d.setDate(d.getDate() + 7);
  schWeekStart = d.toISOString().slice(0, 10);
  renderSchedule();
});
$('#btn-add-schedule').addEventListener('click', async () => {
  if (!staffCache.length) staffCache = await api('/api/staff');
  const active = staffCache.filter((s) => s.status === 'active');
  openModal('근무 일정 추가', `
    <div class="field"><label>직원</label>
      <select id="sc-staff">${active.map((s) => `<option value="${s.id}">${esc(s.name)} (${esc(s.position)})</option>`).join('')}</select></div>
    ${field('sc-date', '날짜', new Date().toISOString().slice(0, 10), 'date')}
    ${field('sc-start', '출근 시간', '11:00', 'time')}
    ${field('sc-end', '퇴근 시간', '20:00', 'time')}
  `, async () => {
    await api('/api/staff/schedules', {
      method: 'POST',
      body: {
        staff_id: Number($('#sc-staff').value), work_date: $('#sc-date').value,
        start_time: $('#sc-start').value, end_time: $('#sc-end').value,
      },
    });
    toast('일정이 추가되었습니다.');
    renderSchedule();
  }, '추가');
});

/* --- 출퇴근 기록 --- */
const hhmm = (ts) => (ts ? ts.slice(11, 16) : '-');
function workHours(a) {
  if (!a.clock_in || !a.clock_out) return null;
  const h = (new Date(a.clock_out.replace(' ', 'T')) - new Date(a.clock_in.replace(' ', 'T'))) / 3600000;
  return Math.round(h * 10) / 10;
}

async function renderAttendance() {
  if (!$('#att-month').value) $('#att-month').value = new Date().toISOString().slice(0, 7);
  if (!staffCache.length) staffCache = await api('/api/staff');
  const rows = await api('/api/staff/attendance?month=' + $('#att-month').value);
  $('#att-table tbody').innerHTML = rows.map((a) => `
    <tr>
      <td>${esc(a.work_date)}</td>
      <td><b>${esc(a.staff_name)}</b></td>
      <td>${hhmm(a.clock_in)}</td>
      <td>${a.clock_out ? hhmm(a.clock_out) : '<span class="badge green">근무 중</span>'}</td>
      <td>${workHours(a) !== null ? workHours(a) + '시간' : '-'}</td>
      <td class="ta-r"><button class="btn small danger ghost" data-attdel="${a.id}">삭제</button></td>
    </tr>`).join('') || '<tr><td colspan="6" style="color:var(--muted)">기록이 없습니다.</td></tr>';
  $$('#att-table [data-attdel]').forEach((b) => b.addEventListener('click', async () => {
    await api(`/api/staff/attendance/${b.dataset.attdel}`, { method: 'DELETE' });
    renderAttendance();
  }));
}
$('#att-month').addEventListener('change', renderAttendance);
$('#btn-add-attendance').addEventListener('click', async () => {
  if (!staffCache.length) staffCache = await api('/api/staff');
  const active = staffCache.filter((s) => s.status === 'active');
  openModal('출퇴근 수기 기록', `
    <div class="field"><label>직원</label>
      <select id="at-staff">${active.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
    ${field('at-date', '날짜', new Date().toISOString().slice(0, 10), 'date')}
    ${field('at-in', '출근 시간', '11:00', 'time')}
    ${field('at-out', '퇴근 시간', '20:00', 'time')}
  `, async () => {
    await api(`/api/staff/${$('#at-staff').value}/attendance`, {
      method: 'POST',
      body: { work_date: $('#at-date').value, clock_in: $('#at-in').value, clock_out: $('#at-out').value },
    });
    toast('기록이 추가되었습니다.');
    renderAttendance();
  }, '추가');
});

/* --- 월급 정산 --- */
async function renderPayroll() {
  if (!$('#pay-month').value) $('#pay-month').value = new Date().toISOString().slice(0, 7);
  const d = await api('/api/staff/payroll?month=' + $('#pay-month').value);
  $('#payroll-total').innerHTML = `미지급 합계 <b>${won(d.totalDue)}</b>`;
  $('#payroll-table tbody').innerHTML = d.rows.map((r) => `
    <tr>
      <td><b>${esc(r.name)}</b> <small style="color:var(--muted)">${esc(r.position)}</small></td>
      <td>${r.pay_type === 'hourly' ? `시급 ${won(r.pay_amount)}` : `월급 ${won(r.pay_amount)}`}</td>
      <td>${r.pay_type === 'hourly' ? r.hours + '시간' : '고정'}</td>
      <td class="ta-r"><b>${won(r.amount)}</b></td>
      <td>${r.paid ? `<span class="badge green">지급 완료</span> <small style="color:var(--muted)">${esc(r.paid.paid_at.slice(0, 10))}</small>` : '<span class="badge gold">미지급</span>'}</td>
      <td class="ta-r">${!r.paid ? `<button class="btn small primary" data-paystaff="${r.staff_id}" data-amount="${r.amount}">지급 완료 처리</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="6" style="color:var(--muted)">재직 중인 직원이 없습니다.</td></tr>';

  $$('#payroll-table [data-paystaff]').forEach((b) => b.addEventListener('click', () => {
    confirmModal('급여 지급 완료', `${won(Number(b.dataset.amount))}을 지급 완료로 기록할까요? (실제 이체는 은행에서 진행하세요)`, async () => {
      await api('/api/staff/payroll/pay', {
        method: 'POST',
        body: { staff_id: Number(b.dataset.paystaff), month: $('#pay-month').value, amount: Number(b.dataset.amount) },
      });
      toast('지급 완료로 기록했습니다.');
      renderPayroll();
    }, '기록');
  }));
}
$('#pay-month').addEventListener('change', renderPayroll);

/* ============ 직원 전용 (내 근무) ============ */
async function loadStaffMe() {
  let d;
  try { d = await api('/api/staff/me'); }
  catch (e) {
    $('#staffme-sub').textContent = e.message;
    return;
  }
  $('#staffme-sub').textContent =
    `${d.staff.name}님 · ${d.staff.position}${d.staff.franchise ? ' · ' + d.staff.franchise : ''}`;
  $('#staffme-cards').innerHTML = `
    <div class="card accent"><div class="label">이번 달 근무</div><div class="value">${d.monthHours}시간</div></div>
    <div class="card"><div class="label">예상 급여 (${d.month})</div><div class="value">${won(d.estimatedPay)}</div>
      <div class="sub">${d.staff.pay_type === 'hourly' ? '시급 ' + won(d.staff.pay_amount) + ' 기준' : '월급제'}</div></div>
  `;
  const att = d.todayAttendance;
  const working = att && att.clock_in && !att.clock_out;
  $('#staffme-status').innerHTML = working
    ? `🟢 근무 중입니다 — ${hhmm(att.clock_in)} 출근`
    : att && att.clock_out
      ? `오늘 근무 완료 — ${hhmm(att.clock_in)} ~ ${hhmm(att.clock_out)}`
      : '아직 출근 전입니다. 좋은 하루 되세요!';
  $('#btn-clock-in').disabled = working;
  $('#btn-clock-out').disabled = !working;

  $('#staffme-schedule tbody').innerHTML = d.schedules.map((s) => {
    const dow = DOW_KR[new Date(s.work_date + 'T12:00:00').getDay()];
    const isToday = s.work_date === new Date().toISOString().slice(0, 10);
    return `<tr ${isToday ? 'style="background:var(--primary-soft)"' : ''}>
      <td><b>${esc(s.work_date.slice(5).replace('-', '/'))}</b>${isToday ? ' (오늘)' : ''}</td>
      <td>${dow}</td><td>${s.start_time} ~ ${s.end_time}</td><td>${esc(s.memo)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="color:var(--muted)">이번 주 배정된 일정이 없습니다.</td></tr>';
}

$('#btn-clock-in').addEventListener('click', async () => {
  try {
    const r = await api('/api/staff/clock', { method: 'POST', body: { action: 'in' } });
    toast(`출근 완료! (${r.at.slice(11, 16)})`);
    loadStaffMe();
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
});
$('#btn-clock-out').addEventListener('click', async () => {
  try {
    const r = await api('/api/staff/clock', { method: 'POST', body: { action: 'out' } });
    toast(`퇴근 완료! 수고하셨습니다. (${r.at.slice(11, 16)})`);
    loadStaffMe();
  } catch (e) { if (!e.handled) toast(e.message, 'error'); }
});

/* ============ AI 심층 분석 ============ */
const analyzeLabels = {
  sales: '매출 요인 분석 — 날씨·공휴일·주변 행사까지 조사하고 있어요 (최대 1~2분)',
  menu: '판매 데이터와 단골 선호를 바탕으로 신메뉴를 구상하고 있어요',
  customers: '고객 데이터를 분석해 마케팅 아이디어를 만들고 있어요',
};
$$('#ai-analyze-row [data-analyze]').forEach((b) => b.addEventListener('click', async () => {
  const kind = b.dataset.analyze;
  const typingEl = addTyping(analyzeLabels[kind]);
  b.disabled = true;
  try {
    const r = await api(`/api/ai/analyze/${kind}`, { method: 'POST' });
    typingEl.innerHTML = renderMarkdown(r.text);
    aiHistory.push({ role: 'assistant', content: r.text });
    refreshMe();
  } catch (err) {
    typingEl.remove();
    if (!err.handled) addAiMsg('assistant', '오류: ' + err.message);
  }
  b.disabled = false;
  $('#ai-messages').scrollTop = $('#ai-messages').scrollHeight;
}));

/* 초기 진입 */
bootstrap();
