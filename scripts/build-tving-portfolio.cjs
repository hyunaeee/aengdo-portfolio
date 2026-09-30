// Standalone reading path for the TVING AI Product Builder application.
// Keep applicant-only answers and career input notes in applications/tving/.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const publicUrl = 'https://hyunaeee.github.io/aengdo-portfolio/roles/tving/';
const repo = 'https://github.com/hyunaeee/aengdo-portfolio';
const link = (href, label) => `<a href="${href}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}<span aria-hidden="true"> ↗</span></a>`;
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>박현애 · AI Product Builder 포트폴리오</title>
  <meta name="description" content="사내 자동회의록 운영, 고객 로컬 RAG 개선, Agent 도구 실행. 박현애의 AI 제품 개발 사례와 확인 가능한 결과입니다.">
  <meta name="theme-color" content="#111111">
  <meta property="og:title" content="박현애 · AI Product Builder">
  <meta property="og:description" content="자동회의록 · 로컬 RAG · AI Agent 개발·운영 사례">
  <meta property="og:type" content="website"><meta property="og:url" content="${publicUrl}">
  <meta property="og:image" content="https://hyunaeee.github.io/aengdo-portfolio/assets/meeting.jpg">
  <link rel="canonical" href="${publicUrl}"><link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../assets/portfolio-tving.css">
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'ProfilePage',name:'박현애 · AI Product Builder',url:publicUrl,mainEntity:{'@type':'Person',name:'박현애',alternateName:'Hyunae Park',url:'https://hyunaeee.github.io/aengdo-portfolio/portfolio.html'}})}</script>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="header"><a class="wordmark" href="../../portfolio.html">Hyunae Park<span>.</span></a><nav aria-label="페이지 메뉴"><a href="#meeting">프로젝트</a><a href="#collaboration">협업</a><a href="#other-work">다른 작업</a></nav><button type="button" class="print-button" id="print">인쇄 / PDF</button></header>
<main id="main">
  <h1 class="sr-only">박현애 · AI Product Builder 포트폴리오</h1>

  <article class="case" id="meeting">
    <div class="case-heading"><p class="eyebrow">01 / 자동회의록</p><span class="status">사내 교육부·개발부 사용 중</span></div>
    <h2>Meeting Assistant</h2>
    <p class="byline">2026.06–현재 · 라이크 코퍼레이션<br>기획·개발·배포·운영·유지보수 단독 담당</p>
    <div class="case-intro"><div><h3>서비스 개요</h3><p>회의 음성을 전사하고 발언자를 구분한 뒤 회의록을 작성해 부서별 Notion과 이메일로 전달하는 서비스입니다. CLI 도구를 웹 서비스로 확장하고, 로그인·접근 권한부터 배포와 운영까지 구성했습니다.</p><ol class="flow" aria-label="회의록 처리 흐름"><li>녹음·업로드</li><li>전사·화자 분리</li><li>회의록 생성</li><li>저장·부서별 전달</li></ol><div class="links">${link('../../meeting/','샘플 UI 체험')}${link('../../work/meeting/','기술 상세')}</div></div><figure><img src="../../assets/meeting.jpg" alt="Meeting Assistant 공개 UI의 녹음 설정과 마이크 테스트 화면" width="1600" height="1000" loading="eager"><figcaption>공개 UI 데모 · 샘플 데이터. 사내 운영 환경과 회의 데이터는 비공개입니다.</figcaption></figure></div>
    <div class="evidence-strip"><div><strong>32<span>건</span></strong><p>기록된 회의</p></div><div><strong>833<span>분</span></strong><p>기록된 녹음 길이</p></div><p>2026.09.15 제공 집계<br>8월 10건·363분 / 9월 중간 집계 22건·470분<br><span>녹음 길이의 합계이며, 절감 시간이나 활성 사용자 수를 뜻하지 않습니다.</span></p></div>
    <h3>사용자 피드백</h3>
    <div class="table-wrap"><table><caption class="sr-only">사용자 요구와 제품 변경</caption><thead><tr><th scope="col">사용 과정에서 나온 요구</th><th scope="col">반영한 변경</th></tr></thead><tbody><tr><td>오류 위치와 처리 상태를 쉽게 확인</td><td>로그·완료·실패 이력과 재처리를 화면에 통합</td></tr><tr><td>녹음 원본을 별도로 보관</td><td>녹음 파일 백업 기능 추가</td></tr><tr><td>모바일에서 쉽게 녹음</td><td>Android 웹앱과 간단한 녹음 흐름 추가</td></tr></tbody></table></div>
    <div class="decision"><div><p class="eyebrow">운영 개선</p><h3>작업 재연결</h3></div><div><p>서버에서 작업이 시작됐는데 업로드 응답을 받지 못하면 사용자는 실패로 받아들일 수 있습니다. 본인의 진행 중 작업을 조회하고 시각·부서·등록자·녹음 길이를 대조해 기존 작업에 다시 연결하도록 변경했습니다.</p><p>화자 분리·요약·외부 전달을 나눠 처리하고, 한 단계가 실패해도 확보한 결과를 보존하도록 구성했습니다.</p></div></div>
    <details><summary>단계별 오류 처리</summary><div class="table-wrap"><table><thead><tr><th scope="col">상황</th><th scope="col">구현한 처리</th></tr></thead><tbody><tr><td>화자 분리 실패</td><td>화자 라벨 없이 전사 결과로 다음 단계 진행</td></tr><tr><td>요약 API 실패</td><td>전사본과 실패 안내를 보존</td></tr><tr><td>Notion 전달 실패</td><td>완성된 회의록을 보존하고 전달 오류를 별도 기록</td></tr><tr><td>서버 재시작</td><td>중단 상태를 복원하고 남은 녹음으로 재처리</td></tr></tbody></table></div><p class="scope">작업 재연결은 2026.09.11 변경 기록에서, 단계별 결과 보존과 중단 기록 복원은 2026.09.15 구현 검토에서 확인했습니다. 실제 재연결 성공률은 아직 집계하지 않았으며, 조건 기반 재연결은 완전한 중복 실행 방지를 보장하지 않습니다.</p></details>
    <p class="stack">FastAPI · React · Docker · faster-whisper · pyannote · Claude API · Google SSO</p>
  </article>

  <article class="case" id="med-rag">
    <div class="case-heading"><p class="eyebrow">02 / 로컬 RAG</p><span class="status">고객 사용 중 · 약어 개선 반영</span></div>
    <h2>MED-RAG</h2><p class="byline">2025.10–현재 · 라이크 코퍼레이션<br>RAG 구현·개인 PC 설치·원격 업데이트</p>
    <div class="case-intro"><div><h3>로컬 구축·유지보수</h3><p>고려대학교 안암병원 교수의 개인 PC에 증례와 가이드라인을 검색하고 답변의 근거를 확인하는 RAG를 구축했습니다. Gemma 3 27B·Ollama와 Chroma를 연결해 로컬에서 실행하고, 설치 이후에도 사용 피드백에 따라 원격 업데이트를 이어가고 있습니다.</p><div class="callout"><h3>약어 이해 개선</h3><p>교수가 평소 사용하는 개인 약어를 이해하도록 개선했으며, 변경을 반영한 버전을 현재 사용하고 있습니다.</p></div><div class="links">${link('../../med-rag/','합성 예시 UI')}${link('../../work/med-rag/','기술 상세')}</div></div><figure><img src="../../assets/medrag.jpg" alt="합성 예시로 재현한 MED-RAG 검색과 답변 근거 확인 화면" width="1600" height="1000" loading="lazy"><figcaption>합성 예시 UI · 고객 데이터와 설치판 코드는 공개하지 않습니다.</figcaption></figure></div>
    <div class="comparison"><div><p class="eyebrow">고객 설치판</p><h3>사용 환경</h3><ul><li>교수 개인 PC에서 로컬 실행</li><li>증례·가이드라인과 답변 근거 확인</li><li>개인 약어 피드백을 반영하고 유지보수</li></ul></div><div><p class="eyebrow">별도 공개 실험</p><h3>검색·답변 평가</h3><p>합성 질문 24개 중 정답 문서 검색 <strong>23건</strong>, 근거를 확인한 답변 평가 통과 <strong>20건</strong>. 검색 문서를 평가자에게 함께 전달해 답변이 근거에 맞는지 확인했습니다.</p><p class="scope">Vertex AI·ADK 실험 / 합성 문서 39개. 고객 설치판의 사용 성과와 구분합니다.</p></div></div>
    <details><summary>튜닝·재실험</summary><p>별도의 QLoRA 실험에서는 위조 인용이 줄어든 대신 답할 수 있는 질문까지 거부하는 문제가 나타났습니다. 거부 학습 예제 37개 중 8개의 잘못된 라벨을 확인하고, 데이터 수정 후 다시 학습했습니다.</p><p>수정 모델은 첫 번째 튜닝 모델보다 근거성과 유용성 평가가 개선됐지만, 전반적인 품질은 기본 모델이 앞섰습니다. 실험 결과에 따라 기본 모델과 엄격한 프롬프트·검토 단계를 결합하는 구성을 권장했습니다.</p><p class="scope">튜닝 비교는 별도의 30개 검증 문항을 반복 사용한 개발 실험입니다. 고객 설치판의 모델 교체나 독립적인 최종 시험 결과를 의미하지 않습니다.</p><div class="links">${link(repo+'/tree/main/med-rag-tune','실험과 라벨 감사')}${link(repo+'/blob/main/med-rag-tune/out/eval_results.json','모델 비교 원자료')}</div></details>
    <p class="stack">Python · Gemma 3 27B · Ollama · Chroma / 공개 실험: Vertex AI · ADK · QLoRA</p>
  </article>

  <article class="case" id="terracotta">
    <div class="case-heading"><p class="eyebrow">03 / AI AGENT</p><span class="status neutral">개인 프로젝트 · 프로토타입</span></div>
    <h2>Terracotta</h2><p class="byline">2026.07– · 제품 기획·UI·Agent/API·배포 구성</p>
    <div class="case-intro"><div><h3>Agent 작업실</h3><p>여러 AI 모델과 도구를 오갈 때 작업 맥락, 실행 권한, 비용이 흩어지는 문제에서 시작했습니다. 모델 선택부터 도구 실행, 결과와 사용량 확인까지 한 화면에서 이어지도록 구성했습니다.</p><ol class="flow" aria-label="에이전트 실행 흐름"><li>모델 선택</li><li>도구 탐색·호출</li><li>쓰기 승인</li><li>결과·실행 기록</li></ol><div class="links">${link('https://github.com/hyunaeee/terracotta','공개 코드')}${link('../../work/terracotta/','기술 상세')}</div></div><figure><img src="../../assets/terracotta.jpg" alt="Terracotta의 대화, 모델 선택과 개인 작업실 화면" width="1600" height="1000" loading="lazy"><figcaption>제품 화면 · 실제 모델 응답에는 공급사 API 연결이 필요합니다.</figcaption></figure></div>
    <div class="implementation"><div><span>01</span><h3>도구 실행</h3><p>모델의 도구 호출 루프와 MCP 도구 탐색·호출을 연결하고, 실행 라운드와 호출 수를 제한했습니다.</p></div><div><span>02</span><h3>사용자 통제</h3><p>에이전트 경로의 쓰기 도구는 도구명과 인자를 표시하고 사용자의 승인을 기다리도록 구성했습니다.</p></div><div><span>03</span><h3>기록·배포</h3><p>사용량과 실행 기록을 저장하고, Docker 배포와 데이터 보존·백업 절차를 마련했습니다.</p></div></div>
    <p class="scope">공개 코드로 구현을 확인할 수 있는 개인용 프로토타입입니다. 다중 사용자 운영 성과·실제 업무 완주율·비용 절감률은 아직 측정하지 않았습니다. 모든 API 진입점의 승인 정책은 추가 검증 항목입니다.</p>
    <div class="links">${link('https://github.com/hyunaeee/terracotta/blob/main/lib/terracotta-orchestrator.ts','Agent 구현')}${link('https://github.com/hyunaeee/terracotta/blob/main/lib/mcp-hub.ts','MCP 연결')}${link('https://github.com/hyunaeee/terracotta/blob/main/SELF_HOSTING.md','설치·운영 가이드')}</div>
    <p class="stack">TypeScript · React / Next.js · Cloudflare Workers · D1 · MCP · Docker</p>
  </article>

  <section class="support" id="collaboration">
    <div><p class="eyebrow">04 / 4인 팀 · PM</p><h2>스마트 도슨트</h2><span class="status neutral">2025.08– · 개인 팀 프로젝트 · 배포 준비 중</span><p class="support-role">기획·우선순위·일정·역할 배분<br>데이터 파이프라인 · 광고 영상 제작</p><p>사용자의 위치와 질문에 맞춰 장소를 안내하는 AI 가이드입니다. PM으로 기획과 출시 준비를 맡고, 장소·관광 콘텐츠 데이터 파이프라인 개발에 참여했습니다. 에이전트 구현은 팀원과 분담했습니다.</p></div>
    <figure class="video-showcase"><video controls playsinline preload="metadata" aria-label="스마트 도슨트 광고 영상"><source src="../../assets/videos/smart-docent-ad.mp4" type="video/mp4">스마트 도슨트 광고 영상</video><figcaption>직접 제작한 광고 영상 · 32초</figcaption><div class="links"><a href="../../assets/videos/smart-docent-ad.mp4" target="_blank" rel="noopener noreferrer">광고 영상 열기 <span aria-hidden="true">↗</span></a></div></figure>
  </section>

  <section class="other-work" id="other-work"><div class="section-heading"><h2>다른 작업</h2><a href="../../archive.html">전체 작업 <span aria-hidden="true">↗</span></a></div><div class="work-grid">
    <a class="work-card" href="../../work/anatomy/"><img src="../../assets/anatomy-exploded.jpg" alt="Anatomy Atlas의 계통별 3D 해부학 화면" loading="lazy" width="1440" height="900"><span class="eyebrow">3D / WEB</span><h3>Anatomy Atlas</h3><p>구조 검색 · 계통별 분리</p></a>
    <a class="work-card" href="../../archive.html#realty"><img src="../../assets/realty.jpg" alt="서울 부동산 분석 지도의 실거래가 화면" loading="lazy" width="900" height="560"><span class="eyebrow">DATA / WEB</span><h3>서울 부동산 분석</h3><p>실거래가 · 지도 · 자금 계획</p></a>
    <a class="work-card" href="../../creative.html#khnp"><img src="../../assets/khnp1.jpg" alt="한국수력원자력 어린이 에너지 교육 영상" loading="lazy" width="900" height="560"><span class="eyebrow">VIDEO</span><h3>KHNP 어린이 에너지 교육</h3><p>교육 영상 5부작 · 납품</p></a>
    <a class="work-card" href="../../creative.html#now"><img src="../../assets/now-art.jpg" alt="N.O.W 전시 작품" loading="lazy" width="900" height="560"><span class="eyebrow">ART</span><h3>N.O.W</h3><p>서울콘 DDP · 초대 전시</p></a>
  </div></section>

  <footer><div><p class="eyebrow">박현애 · HYUNAE PARK</p><a class="email" href="mailto:hyunaeee@gmail.com">hyunaeee@gmail.com</a></div><div class="links">${link('../../portfolio.html','전체 포트폴리오')}${link('https://github.com/hyunaeee','GitHub')}${link('../../creative.html','콘텐츠 제작 작업')}</div><p class="print-url">${publicUrl}</p></footer>
</main>
<script>
document.getElementById('print').addEventListener('click', () => window.print());
let printDetails = [];
window.addEventListener('beforeprint', () => { printDetails = [...document.querySelectorAll('details')].map(el => [el, el.open]); printDetails.forEach(([el]) => el.open = true); });
window.addEventListener('afterprint', () => { printDetails.forEach(([el, wasOpen]) => el.open = wasOpen); });
</script>
</body></html>`;
fs.mkdirSync(path.join(root, 'roles/tving'), {recursive:true});
fs.writeFileSync(path.join(root, 'roles/tving/index.html'), html, 'utf8');
console.log('Built roles/tving/index.html');
