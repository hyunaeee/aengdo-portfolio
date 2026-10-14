// A compact, CV-style casebook. Claims retain their verified scope.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = 'https://github.com/hyunaeee/app-automation-gpt';
const appCode = app + '/blob/1989cd278c963574f3eb9e8715a03e5828b5d6fa/';
const portfolio = 'https://github.com/hyunaeee/aengdo-portfolio';
const lab = portfolio + '/tree/codex/timely-backend-portfolio/backend-ledger-lab';
const terra = 'https://github.com/hyunaeee/terracotta';
const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, label) => `<a href="${e(url)}"${url.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${e(label)}<span class="outbound" aria-hidden="true"> ↗</span></a>`;
const links = items => `<div class="entry-links">${items.map(([url, label]) => link(url, label)).join('')}</div>`;
const points = items => `<ul class="entry-points">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
const row = (label, content, extra = '') => `<div class="resume-row ${extra}"><div class="row-label">${label}</div><div class="row-content">${content}</div></div>`;
const footer = n => `<footer class="sheet-footer"><span>Hyunae Park <span aria-hidden="true">/</span> Backend &amp; AI Services</span><span>${String(n).padStart(2, '0')} / 03</span></footer>`;
const table = (headers, rows) => `<table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hyunae Park - Backend &amp; AI Services</title><meta name="description" content="박현애의 백엔드 포트폴리오. 사내 회의 서비스 운영, Node.js 인증과 작업 관리, Redis 결제 정합성, PostgreSQL 원장 실험.">
<meta name="theme-color" content="#090909"><link rel="canonical" href="https://hyunaeee.github.io/aengdo-portfolio/roles/timely/"><link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../../assets/portfolio-timely.css"><script src="../../assets/portfolio-timely.js" defer></script>
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'ProfilePage',name:'Hyunae Park - Backend & AI Services',mainEntity:{'@type':'Person',name:'박현애',alternateName:'Hyunae Park'}})}</script></head>
<body><a class="skip-link" href="#main">본문으로 이동</a><div class="cv-shell">
<nav class="cv-toolbar" aria-label="문서 탐색"><a href="../../portfolio.html">← Portfolio</a><div><a href="../../cv/">English CV</a><button type="button" data-print-timely>Print / Save PDF <span aria-hidden="true">↗</span></button></div></nav>
<main id="main">
<section class="sheet" id="profile" aria-labelledby="name">
  <header class="profile"><div><h1 id="name">Hyunae Park <span>박현애</span></h1><p class="position">AI Engineer <span aria-hidden="true">/</span> Backend &amp; AI Services</p></div><div class="contact">${link('mailto:hyunaeee@gmail.com','hyunaeee@gmail.com')}${link('https://github.com/hyunaeee','github.com/hyunaeee')}</div></header>
  ${row('Profile', `<p class="summary">사내 AI 서비스를 기획부터 배포·유지보수까지 담당합니다. 긴 작업의 상태와 결과를 보존하고, 사용자별 접근과 결제·사용량의 일관성을 서버에서 다룹니다.</p><p class="skill-line">Python / FastAPI · Node.js / Express · TypeScript · Redis / Lua</p>`)}
  ${row('Experience', `<div class="entry-heading"><h2>LIKE Corporation</h2><span class="entry-date">Sep 2025 - Present</span></div><p class="entry-meta">AI Engineer · 기획·개발·배포·운영</p><p>사내 회의 어시스턴트를 개발·운영하고, 고객 PC에 설치한 MED-RAG(의료 문서 검색·답변 도구)의 원격 업데이트를 이어가고 있습니다.</p>${links([['../../history.html','Full experience'],['../../work/med-rag/','MED-RAG']])}`)}
  ${row('Selected work<br><span>01 / Operations</span>', `<article id="meeting"><div class="entry-heading"><h2>Meeting Assistant <span class="project-description">(회의 녹음·회의록 자동화)</span></h2><span class="entry-date">Internal service</span></div><p class="entry-meta">FastAPI · React · 음성 처리 · Notion / Email</p><p>녹음부터 전사·화자 분리·회의록 생성·전달까지 연결한 사내 서비스입니다.</p>${points([
    '<strong>작업 복구.</strong> HTTP 요청과 작업 수명을 분리했습니다. 작업 ID로 상태를 조회하고 시작 응답을 잃으면 본인의 진행 중 작업을 조건으로 찾아 재연결합니다.',
    '<strong>결과 보존.</strong> 요약·전달이 실패해도 전사본과 회의록을 보존합니다. 서버 재시작 후 중단된 작업을 표시하고 남은 녹음으로 재처리합니다.',
    '<strong>운영 피드백.</strong> 사용 요청에 따라 완료·실패 이력, 화면 재처리, 녹음 백업과 Android 녹음 흐름을 추가했습니다.'
  ])}<figure class="service-figure"><img src="../../assets/meeting.jpg" width="900" height="529" alt="회의 설정, 녹음 방식 선택과 마이크 테스트를 보여주는 회의 어시스턴트 공개 데모 화면"><figcaption>공개 데모 화면. 실제 사내 회의 데이터는 포함하지 않습니다.</figcaption></figure><p class="evidence"><strong>전체 45건 · 총 1,440분</strong><span>교육사업본부 23건 · 735분 / 개발사업본부 20건 · 700분 / 비공개 1건 · 5분</span></p><p class="scope">부서별 합계는 44건으로 전체와 1건 차이가 있습니다. 분은 녹음 길이입니다. 재연결은 조건 기반이며, 재처리는 추론 중간 지점의 자동 재개와 구분합니다.</p>${links([['../../work/meeting/','Case study'],['../../meeting/','UI demo']])}</article>`)}
  ${footer(1)}
</section>

<section class="sheet" id="projects" aria-labelledby="projects-title">
  <header class="section-header"><h2 id="projects-title">Selected Projects</h2><p>Identity, asynchronous work &amp; payment consistency</p></header>
  ${row('02 / Identity<br><span>&amp; workflow</span>', `<article id="automation"><div class="entry-heading"><h3>app-automation-gpt <span class="project-description">(AI 앱 제작 도구)</span></h3><span class="entry-date">Public implementation</span></div><p class="entry-meta">Node.js · Express · Google OIDC · Vercel Blob</p><p>로그인과 개인 API 키, 앱 생성 작업과 결과물을 같은 계정 소유권 안에서 관리하는 서비스입니다.</p>${points([
    '<strong>인증·접근.</strong> OIDC 서명과 issuer·audience·nonce·만료를 검증합니다. 검증된 Google subject를 기준으로 조회·다운로드·취소·재시도에서 소유권을 확인합니다.',
    '<strong>개인 키 보관.</strong> AES-GCM으로 암호화하고, 계정 전환이나 다른 브라우저 로그인 후에도 타인의 키가 전달되지 않는지 검사합니다.',
    '<strong>취소·재시도.</strong> Blob ETag 조건부 쓰기로 오래된 상태의 덮어쓰기를 막습니다. 실행 슬롯과 run ID를 확인해 이전 worker가 새 실행의 슬롯을 해제하지 못하게 합니다.'
  ])}<p class="evidence"><strong>182 tests passed</strong><span>Node 22 / 24 · 빌드 통과 · Android SDK 조건부 생략 1개</span></p><p class="scope">외부 모델·Blob·클라우드는 테스트 대역입니다. 계정 소유권을 검증하며, 조직별 멤버십·RBAC는 포함하지 않습니다.</p>${links([[appCode+'server/google-auth.mjs','Authentication'],[appCode+'server/cloud/store.mjs','State management'],[app+'/pull/1','Tests & CI']])}</article>`)}
  ${row('03 / Payments<br><span>&amp; concurrency</span>', `<article id="payment"><div class="entry-heading"><h3>천기연 <span class="project-description">(AI 사주 상담 서비스)</span></h3><span class="entry-date">Personal project</span></div><p class="entry-meta">Node.js serverless API · Redis / Lua · Toss integration</p><p>중복 승인, 이용권 기록 응답 유실, 질문 처리와 환불의 경쟁 상황에서 구매 권한과 사용 횟수를 일관되게 유지합니다.</p>${points([
    '<strong>승인·지급.</strong> Redis Lua로 승인 처리를 선점하고 결제사에 주문별 멱등키를 전달합니다. 승인 상태와 구매 권한은 원자적으로 검사·변경합니다.',
    '<strong>차감·환불.</strong> 잔여 횟수와 진행 중 질문 수를 같은 Lua 실행에서 변경합니다. 질문 진행 중 환불을 차단하고 중복 완료·환불 요청을 처리합니다.',
    '<strong>응답 유실.</strong> 기록 오류를 결제 실패로 바로 단정하지 않고 원장을 재조회해 이미 지급한 권한을 대조합니다.'
  ])}<div class="verification-list"><p><strong>Redis 7.4.11 / 7개 시나리오 통과</strong></p><dl><div><dt>동시 승인 16건 · 권한 부여 24건</dt><dd>승인·구매 권한 각각 한 번 반영</dd></div><div><dt>잔여 5회 · 질문 20건</dt><dd>5건만 시작, 처리 중 환불 차단</dd></div><div><dt>동시 환불 16건 · 응답 유실</dt><dd>취소 한 번, 원장 대조로 복구</dd></div></dl></div><p class="scope">실제 Redis에서 production 핸들러와 Lua를 실행했습니다. Toss는 대역이며 실제 결제는 발생하지 않습니다. 기존 대체 환경 검사는 348개 통과했습니다.</p>${links([['../../applications/timely/verification.json','Verification record'],['https://saju-ai-mobile-demo.vercel.app','Payment-free demo']])}</article>`)}
  ${footer(2)}
</section>

<section class="sheet" id="engineering" aria-labelledby="engineering-title">
  <header class="section-header"><h2 id="engineering-title">Engineering Notes</h2><p>Transactions, approval boundaries &amp; verification</p></header>
  ${row('04 / Database<br><span>Independent lab</span>', `<article id="postgres"><div class="entry-heading"><h3>PostgreSQL Credit Ledger <span class="project-description">(충전·사용·환급 기록 실험)</span></h3><span class="entry-date">Oct 2026</span></div><p class="entry-meta">TypeScript · Prisma · PostgreSQL 16</p><p>지원 준비 과정에서 충전·차감·전액 환급을 독립 구현했습니다. tenant별 지갑 행 잠금, 멱등키 고유 제약, 조건부 차감과 트랜잭션으로 원장의 정합성을 검증했습니다.</p>${table(['검증','결과'],[
    ['잔액 7회 · 동시 차감 20건','7건 성공 · 13건 잔액 부족 · 음수 없음'],
    ['동일 환급 20건','잔액 복원·환급 원장 1회'],
    ['마지막 DB 쓰기 강제 실패','지갑·주문·처리 결과 전체 rollback'],
    ['Prisma migration 2개','실제 DB 적용 · 스키마 차이 없음']
  ])}<p><strong>조회 계획.</strong> 합성 이력 10만 개에서 최신 20건 조회를 비교했습니다. tenant 인덱스의 5,000행 scan + sort가 복합 인덱스의 20행 scan으로 바뀌었습니다.</p><p class="evidence"><strong>8 / 8 integration tests passed</strong><span>PostgreSQL 16.15 · 타입검사 · migration 검증</span></p><p class="scope">독립 실험이며 기존 서비스의 PostgreSQL 운영 경험과 구분합니다. 실제 결제·조직 인증·HTTP API는 제외했습니다. 단일 쿼리 측정으로 운영 성능 개선율을 주장하지 않습니다. 같은 지갑의 쓰기를 직렬화하므로 부하 시 잠금 대기는 후속 측정 대상입니다.</p>${links([[lab,'Code & migrations'],[lab+'/reports','Tests & EXPLAIN']])}</article>`)}
  ${row('05 / Agent tools<br><span>Approval boundary</span>', `<article id="terracotta"><div class="entry-heading"><h3>Terracotta <span class="project-description">(AI 업무 비서)</span></h3><span class="entry-date">Public prototype</span></div><p class="entry-meta">TypeScript · MCP · D1 / SQLite · Docker</p>${points([
    '승인 전 조건부 SQL 갱신으로 실행권을 선점하고, 승인 단계마다 새 토큰을 발급했습니다. 공통 MCP 실행부에서 소유자·토큰·호출 ID·도구·인자를 확인합니다.',
    '동시 승인 20건이 쓰기 한 번으로 이어지는지 검사했습니다. 직접 쓰기 API, 만료·타인·이전 토큰의 재사용을 차단합니다.'
  ])}<p class="evidence"><strong>17 tests passed</strong><span>행동 테스트 8개 포함 · 빌드·타입검사 통과</span></p><p class="scope">별도 승인 경계 PR의 검증입니다. 실제 핸들러와 SQLite SQL, 외부 공급사 대역을 사용했습니다. 분산 D1 검증과 외부 시스템의 exactly-once 보장은 범위 밖입니다.</p>${links([[terra+'/pull/2','Approval changes'],[terra,'Repository']])}</article>`)}
  <p class="verification-date">검증 기준 2026.10.13 · 문서 업데이트 2026.10.14</p>
  ${footer(3)}
</section>
</main></div></body></html>`;
fs.mkdirSync(path.join(root, 'roles/timely'), { recursive: true });
fs.writeFileSync(path.join(root, 'roles/timely/index.html'), html);
console.log('Built roles/timely/index.html (3-page CV-style portfolio).');
