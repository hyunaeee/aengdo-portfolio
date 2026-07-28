/* ============================================================
   테이블ON — GitHub Pages 정적 데모용 인브라우저 API 시뮬레이터
   서버 없이 fetch('/api/...')를 가로채 가상 데이터로 응답합니다.
   모든 인물·연락처·매출은 프로그램이 생성한 가상 데이터입니다.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- 유틸 ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dstr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tstr = (d) => `${dstr(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const today = () => dstr(new Date());
  const month = () => today().slice(0, 7);
  // 시드 고정 난수 (새로고침마다 동일한 데모 데이터)
  let _s = 42;
  const rnd = (n) => { _s = (_s * 1103515245 + 12345) % 2147483648; return Math.floor((_s / 2147483648) * n); };
  const pick = (arr) => arr[rnd(arr.length)];

  /* ---------- 가상 데이터 생성 ---------- */
  const LAST = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
  const FIRST = ['하늘', '바다', '미소', '도윤', '서연', '지호', '하은', '시우', '유나', '준서', '은우', '소율', '태양', '가온', '초이', '다온', '루하', '해온', '별', '봄'];
  const fakeName = (i) => LAST[i % LAST.length] + FIRST[(i * 7 + Math.floor(i / LAST.length)) % FIRST.length];
  const fakePhone = (i) => `010-0${pad(Math.floor(i / 100) % 100)}0-${pad(i % 100)}${pad((i * 37) % 100)}`;

  const PLANS = {
    free: { key: 'free', label: '무료', price: 0, franchises: 1, aiMonthly: 10, smsMonthly: 10, csv: false, desc: '1개 매장 운영을 시작하는 사장님께', features: ['가맹점 1개', 'AI 어시스턴트 월 10회', '고객 문자 월 10건', '테이블·예약·결제·고객·직원 관리'] },
    pro: { key: 'pro', label: '프로', price: 29000, franchises: 5, aiMonthly: 200, smsMonthly: 300, csv: true, desc: '여러 지점을 운영하는 브랜드에게', features: ['가맹점 5개', 'AI 어시스턴트 월 200회', '고객 문자 월 300건 + 생일 자동 발송', 'CSV 매출 내보내기'] },
    business: { key: 'business', label: '비즈니스', price: 99000, franchises: null, aiMonthly: null, smsMonthly: 2000, csv: true, desc: '프랜차이즈 본사를 위한 무제한 플랜', features: ['가맹점 무제한', 'AI 어시스턴트 무제한', '고객 문자 월 2,000건 + 생일 자동 발송', '프로 플랜의 모든 기능'] },
  };

  const STORE_TYPES = {
    fine: { key: 'fine', label: '오마카세 · 파인다이닝', desc: '예약 중심, 객단가가 높은 고급 식당',
      preset: { birthday: { days_before: 30, expiry: 'birth_month_end', expiry_days: 30 }, tiers: [
        { label: 'VIP', min_visits: 5, min_spent: 1000000, benefit: '샴페인 1잔 또는 코스 업그레이드' },
        { label: '단골', min_visits: 3, min_spent: 300000, benefit: '웰컴 드링크 서비스' },
        { label: '일반', min_visits: 0, min_spent: 0, benefit: '디저트 서비스' }] },
      menus: [['런치 오마카세', '코스', 88000], ['디너 오마카세', '코스', 165000], ['스페셜 오마카세', '코스', 250000], ['사케 페어링', '페어링', 60000], ['와인 페어링', '페어링', 80000], ['우니 추가', '추가', 25000], ['트러플 추가', '추가', 20000], ['캐비어 추가', '추가', 30000], ['생맥주', '음료', 8000], ['하이볼', '음료', 12000], ['프리미엄 사케 (잔)', '음료', 15000], ['논알콜 페어링', '음료', 35000]] },
    chain: { key: 'chain', label: '체인점 · 프랜차이즈', desc: '여러 지점을 운영하는 브랜드',
      preset: { birthday: { days_before: 7, expiry: 'days', expiry_days: 30 }, tiers: [
        { label: 'VIP', min_visits: 10, min_spent: 500000, benefit: '대표 메뉴 1개 무료' },
        { label: '단골', min_visits: 5, min_spent: 200000, benefit: '사이드 메뉴 서비스' },
        { label: '일반', min_visits: 0, min_spent: 0, benefit: '음료 1잔 서비스' }] },
      menus: [['등심 돈까스', '메인', 12000], ['치즈 돈까스', '메인', 13500], ['카레 돈까스', '메인', 13000], ['냉모밀', '면류', 9500], ['우동', '면류', 8000], ['새우튀김 (3pc)', '사이드', 6000], ['계란찜', '사이드', 4000], ['공기밥', '사이드', 1000], ['콜라', '음료', 2500], ['사이다', '음료', 2500], ['생맥주 500cc', '주류', 5000], ['하이볼', '주류', 7000]] },
    casual: { key: 'casual', label: '개인 가게', desc: '동네 단골이 중심인 개인 식당',
      preset: { birthday: { days_before: 7, expiry: 'days', expiry_days: 14 }, tiers: [
        { label: 'VIP', min_visits: 10, min_spent: 300000, benefit: '서비스 안주 + 음료' },
        { label: '단골', min_visits: 5, min_spent: 100000, benefit: '서비스 메뉴 1개' },
        { label: '일반', min_visits: 0, min_spent: 0, benefit: '음료 서비스' }] },
      menus: [['김치찌개', '메인', 9000], ['된장찌개', '메인', 9000], ['제육볶음', '메인', 10000], ['불고기 정식', '메인', 12000], ['계란말이', '사이드', 7000], ['모둠전', '사이드', 12000], ['공기밥', '사이드', 1000], ['콜라', '음료', 2000], ['사이다', '음료', 2000], ['소주', '주류', 5000], ['맥주', '주류', 5000], ['막걸리', '주류', 6000]] },
  };

  let S = null; // 전체 상태
  let seq = 1000;
  const nid = () => ++seq;

  function buildDemoState() {
    _s = 42;
    const st = {
      authed: true, onboarded: true,
      user: { id: 1, name: '김대표', email: 'demo@tableon.kr', role: 'owner', franchise_id: null, email_verified: true },
      tenant: { id: 1, name: '오마카세연 (데모)', plan: 'pro', store_type: 'fine', plan_started_at: dstr(daysAgo(40)) + ' 10:00:00', ai_used: 3, sms_used: 12, birthday_auto: 1, next_billing_at: dstr(daysAgo(-20)), card_info: null },
      crm: JSON.parse(JSON.stringify(STORE_TYPES.fine.preset)),
      franchises: [], tables: [], menus: [], customers: [], orders: [], orderItems: [], payments: [],
      reservations: [], staff: [], schedules: [], attendance: [], payrollPaid: [], coupons: [], smsLog: [],
      billingHistory: [{ id: nid(), created_at: dstr(daysAgo(40)) + ' 10:00:00', plan: 'pro', amount: 29000, status: 'mock', note: '모의 결제 (데모)' }],
      teamInvites: [],
    };

    // 지점 3 + 테이블
    [['청담 본점', '서울 강남구 도산대로 000', '02-000-0001'], ['한남점', '서울 용산구 한남대로 000', '02-000-0002'], ['판교점', '경기 성남시 분당구 판교역로 000', '031-000-0003']].forEach(([name, address, phone], i) => {
      const f = { id: i + 1, name, owner: '김대표', phone, address, status: 'open', opened_at: dstr(daysAgo(400 - i * 120)), tenant_id: 1 };
      st.franchises.push(f);
      for (let t = 1; t <= 8; t++) st.tables.push({ id: st.tables.length + 1, franchise_id: f.id, label: 'T' + t, seats: t <= 4 ? 2 : 4, status: 'empty', guests: 0, occupied_at: null });
    });

    // 메뉴
    STORE_TYPES.fine.menus.forEach(([name, category, price], i) => st.menus.push({ id: i + 1, name, category, price, is_sold_out: i === 7 ? 1 : 0 }));

    // 고객 360명 (세그먼트 다양하게)
    for (let i = 0; i < 360; i++) {
      const kind = i % 24;
      let visits, spentPer, lastGap, noshow = 0, birthdayIn = -1;
      if (kind < 2) { visits = 12 + rnd(30); spentPer = 180000; lastGap = rnd(30); }          // VIP 활발
      else if (kind < 4) { visits = 6 + rnd(4); spentPer = 150000; lastGap = rnd(40); }        // 단골
      else if (kind < 7) { visits = 5 + rnd(8); spentPer = 160000; lastGap = 70 + rnd(120); }  // 이탈 위험
      else if (kind < 11) { visits = 2 + rnd(3); spentPer = 120000; lastGap = rnd(25); }       // 성장 신규
      else if (kind < 13) { visits = 2 + rnd(3); spentPer = 110000; lastGap = 100 + rnd(150); }// 잠든
      else { visits = rnd(2); spentPer = 90000; lastGap = rnd(200); }                          // 신규
      if (i % 40 === 0) noshow = 1 + rnd(2);
      if (i % 60 === 5) birthdayIn = rnd(7);        // 이번 주 생일
      else if (i % 9 === 0) birthdayIn = 20 + rnd(300);
      const last = visits > 0 ? daysAgo(lastGap) : null;
      const first = visits > 0 ? daysAgo(lastGap + visits * (7 + rnd(20))) : null;
      let bday = '';
      if (birthdayIn >= 0) { const b = daysAgo(-birthdayIn); bday = `${pad(b.getMonth() + 1)}-${pad(b.getDate())}`; }
      st.customers.push({
        id: i + 1, name: fakeName(i), phone: fakePhone(i), email: '', birthday: bday,
        traits: pick(['', '', '', '대식가', '알레르기: 갑각류', '조용한 자리 선호', '기념일 방문 잦음']),
        favorite_food: pick(['', '', '우니', '오토로', '사케 페어링', '아나고', '트러플', '']),
        favorite_seat: pick(['', '', '바 자리', '창가', '룸']),
        memo: pick(['', '', '', '콜키지 1회 무료 안내함', 'VIP 응대 주의', '주차 지원 요청']),
        sms_opt_in: i % 8 === 7 ? 0 : 1,
        visit_count: visits, cancel_count: rnd(2), noshow_count: noshow,
        total_spent: Math.round(visits * spentPer * (0.8 + rnd(40) / 100)),
        points: 0, first_visit: first ? dstr(first) : null, last_visit: last ? dstr(last) : null,
      });
    }

    // 30일 매출
    for (let d = 30; d >= 0; d--) {
      const day = daysAgo(d);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const n = 6 + rnd(6) + (isWeekend ? 5 : 0);
      for (const f of st.franchises) {
        for (let o = 0; o < n; o++) {
          const hour = pick([12, 12, 13, 18, 18, 19, 19, 20]);
          const ts = `${dstr(day)} ${pad(hour)}:${pad(rnd(60))}:00`;
          const oid = nid();
          st.orders.push({ id: oid, franchise_id: f.id, table_id: null, status: 'paid', created_at: ts });
          let total = 0;
          for (let k = 0; k < 1 + rnd(3); k++) {
            const m = pick(st.menus);
            const qty = 1 + rnd(2);
            st.orderItems.push({ id: nid(), order_id: oid, menu_item_id: m.id, name: m.name, qty, price: m.price });
            total += m.price * qty;
          }
          const cust = rnd(3) === 0 ? pick(st.customers) : null;
          st.payments.push({ id: nid(), order_id: oid, franchise_id: f.id, method: pick(['card', 'card', 'card', 'mobile', 'cash']), amount: total, status: rnd(60) === 0 ? 'refunded' : 'completed', paid_at: ts, customer_id: cust ? cust.id : null });
        }
      }
    }

    // 이용 중 테이블 4개 + 진행 주문
    st.tables.slice(0, 4).forEach((t, i) => {
      t.status = 'occupied'; t.guests = 2 + rnd(3);
      const past = new Date(Date.now() - (20 + rnd(90)) * 60000);
      t.occupied_at = tstr(past);
      const oid = nid();
      st.orders.push({ id: oid, franchise_id: t.franchise_id, table_id: t.id, status: 'open', created_at: t.occupied_at });
      const m = st.menus[i % st.menus.length];
      st.orderItems.push({ id: nid(), order_id: oid, menu_item_id: m.id, name: m.name, qty: t.guests, price: m.price });
    });

    // 예약
    const rnames = [0, 1, 2, 3].map((i) => st.customers[i * 31 + 3]);
    st.reservations = [
      { id: nid(), franchise_id: 1, table_id: 6, name: rnames[0].name, phone: rnames[0].phone, guests: 4, reserved_at: `${today()} 19:00:00`, memo: '창가 자리 요청', status: 'booked' },
      { id: nid(), franchise_id: 1, table_id: null, name: rnames[1].name, phone: rnames[1].phone, guests: 2, reserved_at: `${today()} 20:30:00`, memo: '', status: 'booked' },
      { id: nid(), franchise_id: 2, table_id: null, name: rnames[2].name, phone: rnames[2].phone, guests: 6, reserved_at: `${dstr(daysAgo(-1))} 18:00:00`, memo: '단체 / 생일 케이크 반입', status: 'booked' },
      { id: nid(), franchise_id: 3, table_id: null, name: rnames[3].name, phone: rnames[3].phone, guests: 3, reserved_at: `${dstr(daysAgo(-2))} 12:30:00`, memo: '유아 의자 1개', status: 'booked' },
    ];

    // 직원 + 이번 주 일정 + 오늘 출근
    st.staff = [
      { id: 1, franchise_id: 1, user_id: null, name: '이서준', phone: '010-0002-0001', position: '홀', pay_type: 'hourly', pay_amount: 11000, hired_at: '2025-03-02', status: 'active', memo: '' },
      { id: 2, franchise_id: 1, user_id: null, name: '김하늘', phone: '010-0002-0002', position: '주방', pay_type: 'monthly', pay_amount: 2600000, hired_at: '2024-11-15', status: 'active', memo: '' },
      { id: 3, franchise_id: 2, user_id: 9, name: '박온유', phone: '010-0002-0003', position: '홀', pay_type: 'hourly', pay_amount: 10500, hired_at: '2026-01-20', status: 'active', memo: '' },
    ];
    const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() || 7) - 1));
    for (let d = 0; d < 6; d++) {
      const day = new Date(monday); day.setDate(monday.getDate() + d);
      st.schedules.push({ id: nid(), staff_id: 1, work_date: dstr(day), start_time: '11:00', end_time: '20:00', memo: '' });
      if (d % 2 === 0) st.schedules.push({ id: nid(), staff_id: 2, work_date: dstr(day), start_time: '10:00', end_time: '21:00', memo: '' });
    }
    // 이번 달 출퇴근 기록
    for (let d = 25; d >= 1; d--) {
      const day = daysAgo(d);
      if (day.getDay() === 0 || dstr(day).slice(0, 7) !== month()) continue;
      st.attendance.push({ id: nid(), staff_id: 1, work_date: dstr(day), clock_in: `${dstr(day)} 10:5${rnd(9)}:00`, clock_out: `${dstr(day)} 20:0${rnd(9)}:00` });
      if (day.getDay() % 2 === 0) st.attendance.push({ id: nid(), staff_id: 2, work_date: dstr(day), clock_in: `${dstr(day)} 09:55:00`, clock_out: `${dstr(day)} 21:05:00` });
    }
    st.attendance.push({ id: nid(), staff_id: 1, work_date: today(), clock_in: `${today()} 10:55:00`, clock_out: null });

    // 쿠폰 + 문자 로그 예시
    const bdayCust = st.customers.find((c) => c.birthday && c.visit_count >= 5);
    if (bdayCust) st.coupons.push({ id: nid(), customer_id: bdayCust.id, kind: 'birthday', name: '🎂 생일 축하 — 샴페인 1잔 또는 코스 업그레이드', status: 'active', expires_at: dstr(daysAgo(-30)), used_at: null, created_at: tstr(new Date()) });
    for (let i = 0; i < 5; i++) {
      const c = st.customers[i * 13];
      st.smsLog.push({ id: nid(), customer_id: c.id, customer_name: c.name, phone: c.phone, message: `${c.name}님, 오랜만이에요! 이번 주 방문 시 웰컴 드링크를 준비해드릴게요.`, status: 'dev', campaign: 'churn', created_at: tstr(new Date(Date.now() - (i + 1) * 86400000)) });
    }
    return st;
  }

  S = buildDemoState();

  /* ---------- 도우미 (서버 로직 미러) ---------- */
  const gradeOf = (c) => (c.visit_count >= 10 ? 'VIP' : c.visit_count >= 5 ? '단골' : c.visit_count >= 2 ? '일반' : '신규');
  const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d + 'T12:00:00')) / 86400000) : 9999);
  const segOf = (c) => {
    const r = daysSince(c.last_visit);
    if (c.visit_count >= 5 && r > 60) return 'churn';
    if (c.visit_count >= 10) return 'vip';
    if (c.visit_count >= 5) return 'regular';
    if (c.visit_count >= 2 && r > 90) return 'sleep';
    if (c.visit_count >= 2) return 'growing';
    return 'new';
  };
  const SEG_META = {
    vip: { label: 'VIP', desc: '10회 이상 · 활발히 방문 중' },
    regular: { label: '단골', desc: '5회 이상 · 활발히 방문 중' },
    churn: { label: '이탈 위험 단골', desc: '단골인데 60일 넘게 안 옴 — 최우선 연락 대상' },
    growing: { label: '성장 신규', desc: '2~4회 방문 — 단골로 키울 고객' },
    sleep: { label: '잠든 고객', desc: '오다가 90일 넘게 끊김' },
    new: { label: '신규', desc: '방문 0~1회' },
  };
  const tierOf = (c) => {
    for (const t of S.crm.tiers) {
      if ((t.min_visits > 0 && c.visit_count >= t.min_visits) || (t.min_spent > 0 && c.total_spent >= t.min_spent)) return t;
    }
    return S.crm.tiers[S.crm.tiers.length - 1];
  };
  const birthweekIds = () => {
    const now = new Date();
    return S.customers.filter((c) => {
      if (!c.birthday) return false;
      const [mm, dd] = c.birthday.split('-').map(Number);
      let bd = new Date(now.getFullYear(), mm - 1, dd);
      if (bd < new Date(now.getFullYear(), now.getMonth(), now.getDate())) bd = new Date(now.getFullYear() + 1, mm - 1, dd);
      return (bd - now) / 86400000 <= 7;
    }).map((c) => c.id);
  };
  const orderTotal = (oid) => S.orderItems.filter((i) => i.order_id === oid).reduce((s, i) => s + i.qty * i.price, 0);
  const won = (n) => '₩' + Number(n || 0).toLocaleString('ko-KR');

  /* ---------- AI 캔드 응답 ---------- */
  function aiStats() {
    const t = today();
    const todaySales = S.payments.filter((p) => p.status === 'completed' && p.paid_at.startsWith(t)).reduce((s, p) => s + p.amount, 0);
    const week = S.payments.filter((p) => p.status === 'completed' && daysSince(p.paid_at.slice(0, 10)) < 7);
    const byMenu = {};
    S.orderItems.forEach((i) => { byMenu[i.name] = (byMenu[i.name] || 0) + i.qty; });
    const top = Object.entries(byMenu).sort((a, b) => b[1] - a[1])[0];
    return { todaySales, weekSales: week.reduce((s, p) => s + p.amount, 0), weekCnt: week.length, top };
  }
  const AI_NOTE = '\n\n---\n*이 응답은 정적 데모용 예시입니다. 실제 서비스에서는 Claude API(웹 검색 포함)가 매장 데이터를 실시간 분석합니다.*';
  function aiChatAnswer() {
    const s = aiStats();
    return `**요약**: 오늘 매출은 ${won(s.todaySales)}, 최근 7일 매출은 ${won(s.weekSales)}(${s.weekCnt}건)입니다.\n\n- 최근 7일 판매 1위 메뉴는 **${s.top[0]}**(${s.top[1]}개)입니다.\n- 주말 매출이 평일 대비 약 40% 높은 패턴이 유지되고 있어요.\n- 저녁(18~20시) 피크에 예약이 몰리니 바 자리 회전 관리에 신경 써주세요.${AI_NOTE}`;
  }
  const AI_ANALYZE = {
    sales: () => {
      const s = aiStats();
      return `## 📈 매출 요인 분석 (최근 30일)\n\n**핵심 요약**: 주말·기념일 효과가 뚜렷하고, 비 오는 날 평균 매출이 맑은 날보다 약 18% 낮습니다.\n\n### 매출 상위 요인\n1. **토요일 효과** — 주말 평균이 평일보다 ${won(180000)} 높음\n2. **폭우일 저녁 예약 취소** — 강수 20mm 이상인 날 저녁 매출 -22% (실측 날씨 데이터 기준)\n3. **가정의 달·기념일** — 기념일이 낀 주 객단가 +15%\n\n### 다가오는 2주 준비 팁\n- **중복(7/25, 토)**: 보양 코스 한정 메뉴 준비를 추천드려요.\n- **주말 예약 마감 임박 공지**로 평일 분산 유도.\n- 폭염 예보일엔 논알콜 페어링 프로모션이 효과적입니다.\n\n최근 7일 매출 ${won(s.weekSales)} · 결제 ${s.weekCnt}건${AI_NOTE}`;
    },
    menu: () => `## 🍣 신메뉴 AI 추천\n\n**분석**: 코스 메뉴가 매출의 70%를 차지하고, 단골들의 선호 기록에 '우니'가 가장 자주 등장합니다.\n\n### 추천 신메뉴 3가지\n1. **우니 스페셜 코스** — 단골 선호 1위 재료 + 여름 시즌. 제안가 ₩195,000\n2. **런치 하프 오마카세** — 평일 점심 회전율 개선용 엔트리 코스. 제안가 ₩58,000\n3. **시즌 히야시 사시미 세트** — 여름 한정, 폭염일 판매 대응. 제안가 ₩45,000\n\n### 리뉴얼 후보\n- **트러플 추가**: 최근 30일 판매 하위 — 코스에 통합하고 단품은 정리 검토.${AI_NOTE}`,
    customers: () => {
      const churn = S.customers.filter((c) => segOf(c) === 'churn').length;
      return `## 💌 단골 마케팅 제안\n\n**고객 구성**: 전체 ${S.customers.length}명 중 이탈 위험 단골 ${churn}명 — 이 그룹부터 연락하는 게 가장 효과적입니다.\n\n### 이탈 위험 단골 재방문 문자 (예시)\n> {이름}님, 오마카세연입니다. 좋아하시던 우니가 제철이라 생각나 연락드려요. 이번 주 방문하시면 웰컴 드링크 준비해두겠습니다 🍶\n\n### VIP 감사 이벤트\n- 분기 1회 "VIP 프라이빗 디너" 초대 — 신메뉴 시식 + 셰프 인사.\n\n### 노쇼 대응\n- 노쇼 2회 이상 고객은 예약 시 예약금(1인 3만원)을 안내하세요.${AI_NOTE}`;
    },
  };

  /* ---------- 라우터 ---------- */
  const J = (data, status = 200) => ({ status, data });
  const ERR = (msg, status = 400, code) => ({ status, data: { error: msg, code } });
  const OK = { status: 200, data: { ok: true } };

  function findCust(id) { return S.customers.find((c) => c.id === Number(id)); }

  function route(method, path, q, body) {
    const m = (re) => path.match(re);
    let x;

    /* --- 인증 --- */
    if (path === '/api/auth/me') {
      if (!S.authed) return ERR('로그인이 필요합니다.', 401, 'unauthorized');
      const plan = PLANS[S.tenant.plan];
      return J({
        user: S.user,
        tenant: { id: 1, name: S.tenant.name, plan: S.tenant.plan, plan_started_at: S.tenant.plan_started_at },
        plan,
        usage: { franchises: S.franchises.length, franchiseLimit: plan.franchises, ai: { used: S.tenant.ai_used, limit: plan.aiMonthly } },
      });
    }
    if (path === '/api/auth/login') { S = buildDemoState(); return OK; }
    if (path === '/api/auth/logout') { S.authed = false; return OK; }
    if (path === '/api/auth/signup') {
      S = buildDemoState();
      S.tenant.name = body.company || '내 가게';
      S.tenant.plan = 'free';
      S.tenant.store_type = STORE_TYPES[body.store_type] ? body.store_type : 'casual';
      S.crm = JSON.parse(JSON.stringify(STORE_TYPES[S.tenant.store_type].preset));
      S.user.name = body.name || '사장님';
      S.user.email = body.email || 'demo@tableon.kr';
      S.user.email_verified = false;
      S.onboarded = false;
      S.franchises = []; S.tables = []; S.menus = []; S.customers = []; S.orders = []; S.orderItems = [];
      S.payments = []; S.reservations = []; S.staff = []; S.schedules = []; S.attendance = []; S.coupons = []; S.smsLog = [];
      return J({ ok: true, verifyDevLink: '#demo-verify' });
    }
    if (path === '/api/auth/forgot') return J({ ok: true, devLink: '#demo-reset' });
    if (path === '/api/auth/reset') return OK;
    if (path === '/api/auth/verify/send') { S.user.email_verified = true; return J({ ok: true }); }
    if (path === '/api/auth/invite-info') return J({ email: 'invited@tableon.kr', tenant: S.tenant.name, role: 'manager', franchise: null });
    if (path === '/api/auth/accept-invite') return OK;
    if (!S.authed) return ERR('로그인이 필요합니다.', 401, 'unauthorized');

    /* --- 온보딩 --- */
    if (path === '/api/onboarding' && method === 'GET') {
      const p = STORE_TYPES[S.tenant.store_type];
      return J({ hasFranchise: S.franchises.length > 0, store_type: S.tenant.store_type, storeLabel: p.label, tenantName: S.tenant.name, presetMenus: p.menus.map(([name, category, price]) => ({ name, category, price })) });
    }
    if (path === '/api/onboarding' && method === 'POST') {
      if (S.franchises.length) return ERR('이미 설정된 매장이 있습니다.');
      const fr = body.franchise || {};
      const f = { id: 1, name: fr.name || '본점', owner: S.user.name, phone: fr.phone || '', address: fr.address || '', status: 'open', opened_at: today() };
      S.franchises.push(f);
      const n = Math.min(Math.max(Number(fr.tables) || 8, 1), 40);
      for (let i = 1; i <= n; i++) S.tables.push({ id: i, franchise_id: 1, label: 'T' + i, seats: i <= Math.ceil(n / 2) ? 2 : 4, status: 'empty', guests: 0, occupied_at: null });
      let menus = [];
      if (body.menus === 'preset') menus = STORE_TYPES[S.tenant.store_type].menus.map(([name, category, price]) => ({ name, category, price }));
      else if (body.menus === 'custom') menus = body.customMenus || [];
      menus.forEach((mn, i) => S.menus.push({ id: i + 1, name: mn.name, category: mn.category || '메인', price: mn.price, is_sold_out: 0 }));
      S.onboarded = true;
      return J({ ok: true, franchise_id: 1, tables: n, menus: S.menus.length });
    }

    /* --- 대시보드 --- */
    if (path === '/api/dashboard') {
      const done = S.payments.filter((p) => p.status === 'completed');
      const t = today(), y = dstr(daysAgo(1));
      const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0);
      const todayP = done.filter((p) => p.paid_at.startsWith(t));
      const daily = {};
      done.filter((p) => daysSince(p.paid_at.slice(0, 10)) < 14).forEach((p) => {
        const d = p.paid_at.slice(0, 10);
        daily[d] = daily[d] || { day: d, total: 0, cnt: 0 };
        daily[d].total += p.amount; daily[d].cnt++;
      });
      const byHour = {};
      done.filter((p) => daysSince(p.paid_at.slice(0, 10)) < 7).forEach((p) => {
        const h = Number(p.paid_at.slice(11, 13));
        byHour[h] = (byHour[h] || 0) + p.amount;
      });
      const byMethod = {};
      done.filter((p) => daysSince(p.paid_at.slice(0, 10)) < 7).forEach((p) => {
        byMethod[p.method] = byMethod[p.method] || { method: p.method, cnt: 0, total: 0 };
        byMethod[p.method].cnt++; byMethod[p.method].total += p.amount;
      });
      const menuQty = {};
      S.orderItems.forEach((i) => {
        const o = S.orders.find((o) => o.id === i.order_id);
        if (o && o.status === 'paid' && daysSince(o.created_at.slice(0, 10)) < 7) {
          menuQty[i.name] = menuQty[i.name] || { name: i.name, qty: 0, revenue: 0 };
          menuQty[i.name].qty += i.qty; menuQty[i.name].revenue += i.qty * i.price;
        }
      });
      return J({
        today: { sales: sum(todayP), orders: todayP.length },
        yesterday: { sales: sum(done.filter((p) => p.paid_at.startsWith(y))) },
        month: { sales: sum(done.filter((p) => p.paid_at.startsWith(month()))), orders: done.filter((p) => p.paid_at.startsWith(month())).length },
        daily: Object.values(daily).sort((a, b) => a.day.localeCompare(b.day)),
        byHour: Object.entries(byHour).map(([hour, total]) => ({ hour: Number(hour), total })),
        byMethod: Object.values(byMethod).sort((a, b) => b.total - a.total),
        franchiseCount: S.franchises.filter((f) => f.status === 'open').length,
        tableStat: { total: S.tables.length, occupied: S.tables.filter((tb) => tb.status === 'occupied').length },
        topMenus: Object.values(menuQty).sort((a, b) => b.qty - a.qty).slice(0, 5),
        byFranchise: S.franchises.map((f) => ({ name: f.name, total: sum(todayP.filter((p) => p.franchise_id === f.id)) })).sort((a, b) => b.total - a.total),
        todayReservations: S.reservations.filter((r) => r.status === 'booked' && r.reserved_at.startsWith(t)).length,
      });
    }

    /* --- 가맹점 --- */
    if (path === '/api/franchises' && method === 'GET') {
      const t = today();
      return J(S.franchises.map((f) => ({
        ...f,
        today_sales: S.payments.filter((p) => p.status === 'completed' && p.franchise_id === f.id && p.paid_at.startsWith(t)).reduce((s, p) => s + p.amount, 0),
        table_count: S.tables.filter((tb) => tb.franchise_id === f.id).length,
        occupied_count: S.tables.filter((tb) => tb.franchise_id === f.id && tb.status === 'occupied').length,
      })));
    }
    if (path === '/api/franchises' && method === 'POST') {
      const plan = PLANS[S.tenant.plan];
      if (plan.franchises !== null && S.franchises.length >= plan.franchises) {
        return ERR(`${plan.label} 플랜은 가맹점을 최대 ${plan.franchises}개까지 등록할 수 있습니다.`, 403, 'plan_limit');
      }
      const f = { id: nid(), name: body.name, owner: body.owner, phone: body.phone || '', address: body.address || '', status: body.status || 'open', opened_at: today() };
      S.franchises.push(f);
      for (let i = 1; i <= 8; i++) S.tables.push({ id: nid(), franchise_id: f.id, label: 'T' + i, seats: i <= 4 ? 2 : 4, status: 'empty', guests: 0, occupied_at: null });
      return J({ id: f.id });
    }
    if ((x = m(/^\/api\/franchises\/(\d+)$/))) {
      const f = S.franchises.find((f) => f.id === Number(x[1]));
      if (!f) return ERR('가맹점이 없습니다.', 404);
      if (method === 'PUT') { Object.assign(f, { name: body.name, owner: body.owner, phone: body.phone, address: body.address, status: body.status }); return OK; }
      if (method === 'DELETE') { S.franchises = S.franchises.filter((v) => v.id !== f.id); S.tables = S.tables.filter((t) => t.franchise_id !== f.id); return OK; }
    }
    if ((x = m(/^\/api\/franchises\/(\d+)\/tables$/))) {
      const fid = Number(x[1]);
      return J(S.tables.filter((t) => t.franchise_id === fid).map((t) => {
        const o = S.orders.find((o) => o.table_id === t.id && o.status === 'open');
        const rv = t.status === 'empty' ? S.reservations.find((r) => r.table_id === t.id && r.status === 'booked' && r.reserved_at.startsWith(today())) : null;
        return { ...t, open_order: o ? { id: o.id, table_id: t.id, total: orderTotal(o.id) } : null, reservation: rv ? { name: rv.name, reserved_at: rv.reserved_at } : null };
      }));
    }
    if ((x = m(/^\/api\/tables\/(\d+)\/seat$/))) {
      const t = S.tables.find((t) => t.id === Number(x[1]));
      if (!t || t.status === 'occupied') return ERR('이미 이용 중인 테이블입니다.');
      t.status = 'occupied'; t.guests = Number(body.guests) || 1; t.occupied_at = tstr(new Date());
      const o = { id: nid(), franchise_id: t.franchise_id, table_id: t.id, status: 'open', created_at: t.occupied_at };
      S.orders.push(o);
      return J({ order_id: o.id });
    }
    if ((x = m(/^\/api\/tables\/(\d+)\/clear$/))) {
      const t = S.tables.find((t) => t.id === Number(x[1]));
      if (t) { t.status = 'empty'; t.guests = 0; t.occupied_at = null; }
      S.orders.forEach((o) => { if (o.table_id === Number(x[1]) && o.status === 'open') o.status = 'cancelled'; });
      return OK;
    }

    /* --- 메뉴 --- */
    if (path === '/api/menu' && method === 'GET') {
      return J([...S.menus].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
    }
    if (path === '/api/menu' && method === 'POST') {
      const mn = { id: nid(), name: body.name, category: body.category || '기타', price: Number(body.price), is_sold_out: 0 };
      S.menus.push(mn);
      return J({ id: mn.id });
    }
    if ((x = m(/^\/api\/menu\/(\d+)$/))) {
      const mn = S.menus.find((v) => v.id === Number(x[1]));
      if (!mn) return ERR('메뉴가 없습니다.', 404);
      if (method === 'PUT') { Object.assign(mn, { name: body.name, category: body.category, price: Number(body.price), is_sold_out: body.is_sold_out ? 1 : 0 }); return OK; }
      if (method === 'DELETE') { S.menus = S.menus.filter((v) => v.id !== mn.id); return OK; }
    }

    /* --- 예약 --- */
    if (path === '/api/reservations' && method === 'GET') {
      let rows = S.reservations.filter((r) => daysSince(r.reserved_at.slice(0, 10)) <= 1 || new Date(r.reserved_at.replace(' ', 'T')) > new Date());
      if (q.get('franchise_id')) rows = rows.filter((r) => r.franchise_id === Number(q.get('franchise_id')));
      return J(rows.map((r) => ({
        ...r,
        franchise_name: S.franchises.find((f) => f.id === r.franchise_id)?.name || '',
        table_label: S.tables.find((t) => t.id === r.table_id)?.label || null,
      })).sort((a, b) => a.reserved_at.localeCompare(b.reserved_at)));
    }
    if (path === '/api/reservations' && method === 'POST') {
      S.reservations.push({ id: nid(), franchise_id: Number(body.franchise_id), table_id: body.table_id || null, name: body.name, phone: body.phone || '', guests: Number(body.guests) || 2, reserved_at: String(body.reserved_at).replace('T', ' ') + (body.reserved_at.length <= 16 ? ':00' : ''), memo: body.memo || '', status: 'booked' });
      return J({ id: seq });
    }
    if ((x = m(/^\/api\/reservations\/(\d+)$/)) && method === 'PUT') {
      const r = S.reservations.find((r) => r.id === Number(x[1]));
      if (!r) return ERR('예약이 없습니다.', 404);
      Object.assign(r, body, { reserved_at: body.reserved_at ? String(body.reserved_at).replace('T', ' ') : r.reserved_at });
      if (body.status === 'noshow') {
        const c = S.customers.find((c) => c.phone.replace(/[^0-9]/g, '') === String(r.phone).replace(/[^0-9]/g, ''));
        if (c) c.noshow_count++;
      }
      return OK;
    }
    if ((x = m(/^\/api\/reservations\/(\d+)\/seat$/))) {
      const r = S.reservations.find((r) => r.id === Number(x[1]));
      if (!r || r.status !== 'booked') return ERR('착석 처리할 수 있는 예약이 아닙니다.');
      let t = S.tables.find((t) => t.id === r.table_id && t.status === 'empty')
        || S.tables.find((t) => t.franchise_id === r.franchise_id && t.status === 'empty' && t.seats >= Math.min(r.guests, 4));
      if (!t) return ERR('배정 가능한 빈 테이블이 없습니다.');
      t.status = 'occupied'; t.guests = r.guests; t.occupied_at = tstr(new Date());
      const o = { id: nid(), franchise_id: r.franchise_id, table_id: t.id, status: 'open', created_at: t.occupied_at };
      S.orders.push(o);
      r.status = 'seated'; r.table_id = t.id;
      return J({ order_id: o.id, table_id: t.id });
    }

    /* --- 주문/결제 --- */
    if ((x = m(/^\/api\/orders\/(\d+)$/)) && method === 'GET') {
      const o = S.orders.find((o) => o.id === Number(x[1]));
      if (!o) return ERR('주문이 없습니다.', 404);
      const items = S.orderItems.filter((i) => i.order_id === o.id);
      return J({ ...o, items, total: orderTotal(o.id) });
    }
    if ((x = m(/^\/api\/orders\/(\d+)\/items$/)) && method === 'POST') {
      const o = S.orders.find((o) => o.id === Number(x[1]) && o.status === 'open');
      const mn = S.menus.find((mn) => mn.id === Number(body.menu_item_id));
      if (!o || !mn) return ERR('진행 중인 주문이 아닙니다.');
      if (mn.is_sold_out) return ERR('품절된 메뉴입니다.');
      const exist = S.orderItems.find((i) => i.order_id === o.id && i.menu_item_id === mn.id);
      if (exist) exist.qty += Number(body.qty) || 1;
      else S.orderItems.push({ id: nid(), order_id: o.id, menu_item_id: mn.id, name: mn.name, qty: Number(body.qty) || 1, price: mn.price });
      return OK;
    }
    if ((x = m(/^\/api\/orders\/(\d+)\/items\/(\d+)$/))) {
      const item = S.orderItems.find((i) => i.id === Number(x[2]) && i.order_id === Number(x[1]));
      if (item) {
        if (method === 'DELETE' || (method === 'PATCH' && Number(body.qty) <= 0)) S.orderItems = S.orderItems.filter((i) => i !== item);
        else if (method === 'PATCH') item.qty = Number(body.qty);
      }
      return OK;
    }
    if ((x = m(/^\/api\/orders\/(\d+)\/pay$/))) {
      const o = S.orders.find((o) => o.id === Number(x[1]) && o.status === 'open');
      if (!o) return ERR('결제할 수 있는 주문이 아닙니다.');
      const total = orderTotal(o.id);
      if (total <= 0) return ERR('주문 항목이 없습니다.');
      let cust = body.customer_id ? findCust(body.customer_id) : null;
      if (!cust && body.customer_phone) {
        const digits = String(body.customer_phone).replace(/[^0-9]/g, '');
        if (digits.length >= 8) {
          cust = S.customers.find((c) => c.phone.replace(/[^0-9]/g, '') === digits);
          if (!cust) { cust = { id: nid(), name: '고객' + digits.slice(-4), phone: digits, email: '', birthday: '', traits: '', favorite_food: '', favorite_seat: '', memo: '', sms_opt_in: 0, visit_count: 0, cancel_count: 0, noshow_count: 0, total_spent: 0, points: 0, first_visit: null, last_visit: null }; S.customers.unshift(cust); }
        }
      }
      o.status = 'paid';
      S.payments.unshift({ id: nid(), order_id: o.id, franchise_id: o.franchise_id, method: body.method || 'card', amount: total, status: 'completed', paid_at: tstr(new Date()), customer_id: cust ? cust.id : null });
      const t = S.tables.find((t) => t.id === o.table_id);
      if (t) { t.status = 'empty'; t.guests = 0; t.occupied_at = null; }
      if (cust) { cust.visit_count++; cust.total_spent += total; cust.last_visit = today(); cust.first_visit = cust.first_visit || today(); }
      return J({ ok: true, amount: total, customer_id: cust ? cust.id : null });
    }
    if (path === '/api/payments' && method === 'GET') {
      let rows = [...S.payments];
      if (q.get('franchise_id')) rows = rows.filter((p) => p.franchise_id === Number(q.get('franchise_id')));
      if (q.get('method')) rows = rows.filter((p) => p.method === q.get('method'));
      if (q.get('status')) rows = rows.filter((p) => p.status === q.get('status'));
      if (q.get('date')) rows = rows.filter((p) => p.paid_at.startsWith(q.get('date')));
      rows.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
      const summary = {
        cnt: rows.length,
        completed_total: rows.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
        refunded_total: rows.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0),
      };
      return J({ rows: rows.slice(0, 200).map((p) => ({ ...p, franchise_name: S.franchises.find((f) => f.id === p.franchise_id)?.name || '' })), summary });
    }
    if (path === '/api/payments/export.csv') {
      const csv = ['결제ID,지점,결제수단,금액,상태,일시']
        .concat(S.payments.slice(0, 500).map((p) => `"${p.id}","${S.franchises.find((f) => f.id === p.franchise_id)?.name || ''}","${p.method}","${p.amount}","${p.status}","${p.paid_at}"`))
        .join('\r\n');
      return { status: 200, data: '﻿' + csv, csv: true };
    }
    if ((x = m(/^\/api\/payments\/(\d+)\/refund$/))) {
      const p = S.payments.find((p) => p.id === Number(x[1]));
      if (p) p.status = 'refunded';
      return OK;
    }

    /* --- 고객 --- */
    if (path === '/api/customers/segments') {
      const counts = {};
      S.customers.forEach((c) => { const s = segOf(c); counts[s] = (counts[s] || 0) + 1; });
      return J({ segments: Object.entries(SEG_META).map(([key, mm]) => ({ key, ...mm, count: counts[key] || 0 })), birthweek: birthweekIds().length });
    }
    if (path === '/api/customers/alerts') {
      const rows = S.customers.filter((c) => {
        if (c.visit_count < 3 || !c.first_visit || !c.last_visit) return false;
        const gap = (new Date(c.last_visit) - new Date(c.first_visit)) / 86400000 / (c.visit_count - 1);
        const since = daysSince(c.last_visit);
        return gap >= 3 && gap <= 60 && since > gap * 2 && since <= 365;
      }).map((c) => ({
        ...c,
        avg_gap: Math.round((new Date(c.last_visit) - new Date(c.first_visit)) / 86400000 / (c.visit_count - 1)),
        days_since: daysSince(c.last_visit),
      })).sort((a, b) => b.total_spent - a.total_spent).slice(0, 30);
      return J({ count: rows.length, rows });
    }
    if (path === '/api/customers/lookup') {
      const digits = String(q.get('phone') || '').replace(/[^0-9]/g, '');
      if (digits.length < 3) return J([]);
      return J(S.customers.filter((c) => c.phone.replace(/[^0-9]/g, '').includes(digits)).sort((a, b) => b.visit_count - a.visit_count).slice(0, 6)
        .map((c) => { const t = tierOf(c); return { ...c, grade: gradeOf(c), tier: t.label, benefit: t.benefit }; }));
    }
    if (path === '/api/customers' && method === 'GET') {
      let rows = [...S.customers];
      const qq = (q.get('q') || '').toLowerCase();
      if (qq) rows = rows.filter((c) => c.name.toLowerCase().includes(qq) || c.phone.includes(qq.replace(/[^0-9]/g, '') || qq) || (c.memo || '').includes(qq) || (c.favorite_food || '').includes(qq));
      const seg = q.get('segment');
      if (seg === 'birthweek') { const ids = new Set(birthweekIds()); rows = rows.filter((c) => ids.has(c.id)); }
      else if (seg === 'noshow') rows = rows.filter((c) => c.noshow_count >= 1);
      else if (seg) rows = rows.filter((c) => segOf(c) === seg);
      rows.sort((a, b) => String(b.last_visit || '').localeCompare(String(a.last_visit || '')) || b.visit_count - a.visit_count);
      const page = Number(q.get('page')) || 1;
      const stats = {
        total: S.customers.length,
        vip: S.customers.filter((c) => c.visit_count >= 10).length,
        regular: S.customers.filter((c) => c.visit_count >= 5 && c.visit_count < 10).length,
        sms_ok: S.customers.filter((c) => c.sms_opt_in).length,
        recent30: S.customers.filter((c) => c.last_visit && daysSince(c.last_visit) <= 30).length,
      };
      return J({ rows: rows.slice((page - 1) * 50, page * 50).map((c) => ({ ...c, grade: gradeOf(c) })), total: rows.length, page, size: 50, stats });
    }
    if (path === '/api/customers' && method === 'POST') {
      const c = { id: nid(), visit_count: 0, cancel_count: 0, noshow_count: 0, total_spent: 0, points: 0, first_visit: null, last_visit: null, email: '', traits: '', favorite_food: '', favorite_seat: '', memo: '', birthday: '', ...body, sms_opt_in: body.sms_opt_in ? 1 : 0 };
      S.customers.unshift(c);
      return J({ id: c.id });
    }
    if (path === '/api/customers/import') {
      let added = 0;
      for (let i = 0; i < 120; i++) {
        const idx = S.customers.length + i;
        S.customers.push({ id: nid(), name: fakeName(idx), phone: fakePhone(idx + 500), email: '', birthday: '', traits: '', favorite_food: '', favorite_seat: '', memo: '(엑셀 가져오기 데모)', sms_opt_in: 1, visit_count: rnd(8), cancel_count: 0, noshow_count: 0, total_spent: rnd(800000), points: 0, first_visit: dstr(daysAgo(200 + rnd(300))), last_visit: dstr(daysAgo(rnd(120))) });
        added++;
      }
      return J({ ok: true, added, updated: 0, skipped: 3, total: added + 3 });
    }
    if ((x = m(/^\/api\/customers\/(\d+)\/coupons$/))) {
      const cid = Number(x[1]);
      if (method === 'POST') {
        S.coupons.unshift({ id: nid(), customer_id: cid, kind: 'manual', name: body.name, status: 'active', expires_at: dstr(daysAgo(-30)), used_at: null, created_at: tstr(new Date()) });
        return OK;
      }
      return J(S.coupons.filter((cp) => cp.customer_id === cid).slice(0, 10));
    }
    if ((x = m(/^\/api\/customers\/(\d+)$/))) {
      const c = findCust(x[1]);
      if (!c) return ERR('고객이 없습니다.', 404);
      if (method === 'PUT') { Object.assign(c, body, { sms_opt_in: body.sms_opt_in ? 1 : 0, id: c.id }); return OK; }
      if (method === 'DELETE') { S.customers = S.customers.filter((v) => v.id !== c.id); return OK; }
    }
    if ((x = m(/^\/api\/coupons\/(\d+)\/use$/))) {
      const cp = S.coupons.find((cp) => cp.id === Number(x[1]));
      if (cp) { cp.status = 'used'; cp.used_at = tstr(new Date()); }
      return OK;
    }

    /* --- 문자 --- */
    if (path === '/api/sms/send') {
      let targets = [];
      if (body.customer_ids?.length) targets = S.customers.filter((c) => body.customer_ids.includes(c.id) && c.sms_opt_in);
      else if (body.segment) {
        if (body.segment === 'birthweek') { const ids = new Set(birthweekIds()); targets = S.customers.filter((c) => ids.has(c.id) && c.sms_opt_in); }
        else if (body.segment === 'noshow') targets = S.customers.filter((c) => c.noshow_count >= 1 && c.sms_opt_in);
        else targets = S.customers.filter((c) => segOf(c) === body.segment && c.sms_opt_in);
      }
      if (!targets.length) return ERR('문자 수신에 동의한 대상이 없습니다.');
      const limit = PLANS[S.tenant.plan].smsMonthly;
      if (limit !== null && targets.length > limit - S.tenant.sms_used) {
        return ERR(`이번 달 문자 잔여량이 ${limit - S.tenant.sms_used}건인데 대상이 ${targets.length}명입니다.`, 403, 'plan_limit');
      }
      targets.slice(0, 50).forEach((c) => S.smsLog.unshift({ id: nid(), customer_id: c.id, customer_name: c.name, phone: c.phone, message: body.message.replaceAll('{이름}', c.name), status: 'dev', campaign: body.segment || 'manual', created_at: tstr(new Date()) }));
      S.tenant.sms_used += targets.length;
      return J({ ok: true, sent: targets.length, failed: 0, dev: true, recipients: targets.length, smsEnabled: false });
    }
    if (path === '/api/sms/history') {
      return J({ rows: S.smsLog.slice(0, 100), quota: { used: S.tenant.sms_used, limit: PLANS[S.tenant.plan].smsMonthly, remain: (PLANS[S.tenant.plan].smsMonthly ?? Infinity) - S.tenant.sms_used }, smsEnabled: false });
    }
    if (path === '/api/sms/suggest') {
      S.tenant.ai_used++;
      return J({ text: `{이름}님, ${S.tenant.name}입니다. 좋아하시던 메뉴가 제철이라 생각나 연락드려요. 이번 주 방문하시면 웰컴 드링크를 준비해드릴게요 🍶` });
    }
    if (path === '/api/sms/settings') { S.tenant.birthday_auto = body.birthday_auto ? 1 : 0; return OK; }

    /* --- 혜택 설정 --- */
    if (path === '/api/crm/settings' && method === 'GET') {
      return J({ store_type: S.tenant.store_type, settings: S.crm, storeTypes: Object.values(STORE_TYPES).map((t) => ({ key: t.key, label: t.label, desc: t.desc, preset: t.preset })) });
    }
    if (path === '/api/crm/settings' && method === 'PUT') {
      if (STORE_TYPES[body.store_type]) S.tenant.store_type = body.store_type;
      if (body.settings) S.crm = body.settings;
      return OK;
    }

    /* --- 직원 --- */
    if (path === '/api/staff' && method === 'GET') {
      return J(S.staff.map((s) => ({ ...s, franchise_name: S.franchises.find((f) => f.id === s.franchise_id)?.name || null, pending_invite: 0 })));
    }
    if (path === '/api/staff' && method === 'POST') {
      const s = { id: nid(), user_id: null, status: 'active', memo: '', hired_at: today(), ...body, pay_amount: Number(body.pay_amount) };
      S.staff.push(s);
      return J({ id: s.id });
    }
    if (path === '/api/staff/schedules' && method === 'GET') {
      const from = q.get('from') || today();
      const to = dstr(new Date(new Date(from + 'T12:00:00').getTime() + 6 * 86400000));
      return J(S.schedules.filter((sc) => sc.work_date >= from && sc.work_date <= to)
        .map((sc) => ({ ...sc, staff_name: S.staff.find((s) => s.id === sc.staff_id)?.name || '', position: '' }))
        .sort((a, b) => a.work_date.localeCompare(b.work_date)));
    }
    if (path === '/api/staff/schedules' && method === 'POST') {
      S.schedules.push({ id: nid(), staff_id: Number(body.staff_id), work_date: body.work_date, start_time: body.start_time, end_time: body.end_time, memo: body.memo || '' });
      return J({ id: seq });
    }
    if ((x = m(/^\/api\/staff\/schedules\/(\d+)$/))) { S.schedules = S.schedules.filter((s) => s.id !== Number(x[1])); return OK; }
    if (path === '/api/staff/attendance' && method === 'GET') {
      const mo = q.get('month') || month();
      return J(S.attendance.filter((a) => a.work_date.startsWith(mo))
        .map((a) => ({ ...a, staff_name: S.staff.find((s) => s.id === a.staff_id)?.name || '' }))
        .sort((a, b) => b.work_date.localeCompare(a.work_date)).slice(0, 300));
    }
    if ((x = m(/^\/api\/staff\/(\d+)\/attendance$/))) {
      S.attendance.push({ id: nid(), staff_id: Number(x[1]), work_date: body.work_date, clock_in: body.clock_in ? `${body.work_date} ${body.clock_in}:00` : null, clock_out: body.clock_out ? `${body.work_date} ${body.clock_out}:00` : null });
      return OK;
    }
    if ((x = m(/^\/api\/staff\/attendance\/(\d+)$/))) { S.attendance = S.attendance.filter((a) => a.id !== Number(x[1])); return OK; }
    if (path === '/api/staff/me') return ERR('데모 계정은 대표 계정입니다. 직원 화면은 직원 초대 후 사용할 수 있어요.', 404);
    if (path === '/api/staff/clock') return OK;
    if (path === '/api/staff/payroll' && method === 'GET') {
      const mo = q.get('month') || month();
      const rows = S.staff.filter((s) => s.status === 'active').map((s) => {
        let mins = 0;
        S.attendance.filter((a) => a.staff_id === s.id && a.work_date.startsWith(mo) && a.clock_in && a.clock_out)
          .forEach((a) => { mins += Math.max((new Date(a.clock_out.replace(' ', 'T')) - new Date(a.clock_in.replace(' ', 'T'))) / 60000, 0); });
        const hours = Math.round(mins / 6) / 10;
        const amount = s.pay_type === 'hourly' ? Math.round(hours * s.pay_amount) : s.pay_amount;
        const paid = S.payrollPaid.find((p) => p.staff_id === s.id && p.month === mo) || null;
        return { staff_id: s.id, name: s.name, position: s.position, pay_type: s.pay_type, pay_amount: s.pay_amount, hours, amount, paid };
      });
      return J({ month: mo, rows, totalDue: rows.filter((r) => !r.paid).reduce((a, b) => a + b.amount, 0) });
    }
    if (path === '/api/staff/payroll/pay') {
      S.payrollPaid.push({ id: nid(), staff_id: Number(body.staff_id), month: body.month, amount: Number(body.amount), paid_at: tstr(new Date()) });
      return OK;
    }
    if ((x = m(/^\/api\/staff\/(\d+)\/invite$/))) return J({ ok: true, inviteUrl: '#demo-invite', devLink: '#demo-invite' });
    if ((x = m(/^\/api\/staff\/(\d+)$/))) {
      const s = S.staff.find((s) => s.id === Number(x[1]));
      if (!s) return ERR('직원이 없습니다.', 404);
      if (method === 'PUT') { Object.assign(s, body, { id: s.id, pay_amount: Number(body.pay_amount) }); return OK; }
      if (method === 'DELETE') { S.staff = S.staff.filter((v) => v.id !== s.id); return OK; }
    }

    /* --- 팀 --- */
    if (path === '/api/team' && method === 'GET') {
      return J({
        members: [
          { id: 1, name: S.user.name, email: S.user.email, role: 'owner', email_verified: 1, franchise_name: null, franchise_id: null },
          { id: 9, name: '박온유', email: 'onyu@tableon.kr', role: 'manager', email_verified: 1, franchise_name: '한남점', franchise_id: 2 },
        ],
        invites: S.teamInvites,
      });
    }
    if (path === '/api/team/invite') {
      S.teamInvites.push({ id: nid(), email: body.email, role: body.role, franchise_name: S.franchises.find((f) => f.id === Number(body.franchise_id))?.name || null, token: 'demo-token', expires_at: dstr(daysAgo(-7)) + ' 00:00:00', created_at: tstr(new Date()) });
      return J({ ok: true, inviteUrl: '#demo-invite', devLink: '#demo-invite' });
    }
    if ((x = m(/^\/api\/team\/invite\/(\d+)$/))) { S.teamInvites = S.teamInvites.filter((i) => i.id !== Number(x[1])); return OK; }
    if ((x = m(/^\/api\/team\/members\/(\d+)$/))) return OK;

    /* --- 구독/빌링 --- */
    if (path === '/api/billing' && method === 'GET') {
      const plan = PLANS[S.tenant.plan];
      return J({
        current: S.tenant.plan, plan_started_at: S.tenant.plan_started_at, next_billing_at: S.tenant.next_billing_at,
        card_info: S.tenant.card_info, plans: PLANS, tossEnabled: false, history: S.billingHistory,
        report: { enabled: 1, lastSent: null },
        birthday_auto: S.tenant.birthday_auto,
        usage: { franchises: S.franchises.length, franchiseLimit: plan.franchises, aiUsed: S.tenant.ai_used, aiLimit: plan.aiMonthly, smsUsed: S.tenant.sms_used, smsLimit: plan.smsMonthly, csv: plan.csv },
      });
    }
    if (path === '/api/billing/config') return J({ tossEnabled: false, clientKey: '', customerKey: 'demo' });
    if (path === '/api/billing/plan') {
      const target = PLANS[body.plan];
      if (!target) return ERR('알 수 없는 요금제입니다.');
      if (target.franchises !== null && S.franchises.length > target.franchises) {
        return ERR(`현재 가맹점이 ${S.franchises.length}개입니다. 먼저 가맹점을 정리해주세요.`);
      }
      S.tenant.plan = target.key;
      S.tenant.next_billing_at = target.price ? dstr(daysAgo(-30)) : null;
      S.billingHistory.unshift({ id: nid(), created_at: tstr(new Date()), plan: target.key, amount: target.price, status: target.price ? 'mock' : 'cancelled', note: target.price ? '모의 결제 (데모)' : '구독 해지' });
      return J({ ok: true, plan: target.key });
    }

    /* --- 리포트 --- */
    if (path === '/api/reports/weekly/preview') {
      const s = aiStats();
      return J({
        subject: `[테이블ON] ${S.tenant.name} 주간 리포트`,
        html: `<div style="font-family:sans-serif;padding:24px;max-width:560px"><h2>${S.tenant.name} 주간 리포트 📊</h2><p>최근 7일 매출: <b>${won(s.weekSales)}</b> (${s.weekCnt}건)</p><p>인기 메뉴 1위: <b>${s.top[0]}</b> (${s.top[1]}개)</p><div style="background:#f6f2ea;border-radius:12px;padding:16px">✦ <b>AI 코멘트</b><br>주말 매출 강세가 이어지고 있습니다. 중복(7/25)을 겨냥한 보양 코스 프로모션을 추천합니다.</div><p style="color:#999;font-size:12px">— 정적 데모 미리보기</p></div>`,
      });
    }
    if (path === '/api/reports/weekly/send') return J({ ok: true, sent: false, dev: true });
    if (path === '/api/reports/settings') return OK;

    /* --- AI 프로필 (가게별 시스템 프롬프트) --- */
    if (path === '/api/ai/profile' && method === 'GET') {
      return J({ profile: S.aiProfile || null, hasPrompt: !!S.aiProfile, systemPrompt: S.aiProfile ? '(데모) 가게 전용 프롬프트' : null });
    }
    if (path === '/api/ai/profile' && method === 'POST') {
      S.aiProfile = body.profile || {};
      return J({ ok: true, generated: true, systemPrompt: '(데모) 가게 전용 프롬프트' });
    }

    /* --- AI --- */
    if (path === '/api/ai/chat') { S.tenant.ai_used++; return J({ text: aiChatAnswer(), model: 'demo' }); }
    if (path === '/api/ai/insights') { S.tenant.ai_used++; return J({ text: AI_ANALYZE.sales(), model: 'demo' }); }
    if ((x = m(/^\/api\/ai\/analyze\/(\w+)$/))) {
      S.tenant.ai_used++;
      const fn = AI_ANALYZE[x[1]] || AI_ANALYZE.sales;
      return J({ text: fn(), model: 'demo' });
    }

    return ERR('데모에서 지원하지 않는 요청입니다: ' + method + ' ' + path, 404);
  }

  /* ---------- fetch 가로채기 ---------- */
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, opts = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('/api/') && !url.startsWith('/billing/')) return realFetch(input, opts);
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 120)); // 네트워크 흉내
    const method = (opts.method || 'GET').toUpperCase();
    let body = {};
    try { body = opts.body ? JSON.parse(opts.body) : {}; } catch { body = {}; }
    const [pathOnly, qs] = url.split('?');
    let result;
    try { result = route(method, pathOnly, new URLSearchParams(qs || ''), body); }
    catch (e) { console.error('[DEMO API]', e); result = { status: 500, data: { error: '데모 처리 오류: ' + e.message } }; }
    if (result.csv) return new Response(result.data, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
    return new Response(JSON.stringify(result.data), { status: result.status, headers: { 'Content-Type': 'application/json' } });
  };

  console.log('%c🎭 테이블ON 데모 모드 — 모든 데이터는 가상이며 새로고침 시 초기화됩니다.', 'color:#d9480f;font-weight:bold');
})();
