# aengdo-portfolio

**AENGDO OS** — 앵두의 레트로 OS 포트폴리오. https://hyunaeee.github.io/aengdo-portfolio/

바탕화면 아이콘을 클릭해 실행하는 포트폴리오입니다. 창은 드래그로 옮길 수 있습니다.

## 구성
- `index.html` — AENGDO OS 셸 (부팅 → 바탕화면 → 창/작업표시줄/시작메뉴/화면보호기)
  - STORY.EXE: 스크롤 스토리 원본을 창 안에서 실행
  - WORKS: 탐색기 — 영상(유튜브/드라이브)·음악·웹·GitHub 레포
  - SIGNAL_RUN.EXE / BRAIN.EXE(아스키 뇌) / FIG01.DWG(청사진) / AENGDO TIMES(신문)
  - DIVE.EXE / TYPESTORM.EXE(전체화면 앱), NOIR.SCR(75초 방치 시 화면보호기)
  - 앵두 메신저 + 앱 실행 반응 토스트
- `story.html` — 스크롤 스토리 사이트 (원본 보존, 단독 실행 가능)
- `game.html` — SIGNAL RUN 단독 실행
- `times.html` — AENGDO TIMES 창간호
- `classic.html` — 최초 버전 홈페이지
- `assets/` — 캐릭터·작품 이미지, 음악

전부 정적 파일이라 `python -m http.server`로 바로 실행됩니다. (CDN 폰트/three.js 사용)
