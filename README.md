# aengdo-portfolio 🍒

**AENGDO STUDIO + OS** — 앵두의 인터랙티브 포트폴리오

**Live** → https://hyunaeee.github.io/aengdo-portfolio/

접속하면 BIOS 부팅 후 **부팅 모드**를 고릅니다:

| 모드 | 대상 | 내용 |
|---|---|---|
| `1. PORTFOLIO.STUDIO` (기본) | 작업을 보러 오신 분 | 3D 스튜디오 · 프로젝트 검색 · PDF 저장 — 8초 후 자동 부팅 |
| `2. AENGDO_OS` | 구경 오신 분 | 창을 드래그하며 탐험하는 레트로 데스크톱 |

이력서용 직링크: https://hyunaeee.github.io/aengdo-portfolio/portfolio.html

## ⭐ PORTFOLIO.STUDIO (`portfolio.html`)

2026.09 업데이트:
- **3D STUDIO** — Higgsfield 3D Jutsu에서 제작한 앵두 GLB. 드래그·키보드 회전, 확대·축소, 자동 회전 토글과 시점 초기화. 로딩 실패 시 정지 포스터 제공.
- **SELECTED PROJECTS** — 최신 `anatomy-sample`과 MED-RAG 대표 작업.
- **PROJECT ARCHIVE** — 18개 프로젝트, 라이브/분야 필터와 이름·기술 검색. 기획·설계·성과·한계 상세 보기.
- **CREATIVE WORK / JOURNEY / TOOLKIT** — 영상·전시·음악, 경력과 기술 스택.
- **PDF 저장** — 상단 버튼 → 브라우저 인쇄 창에서 **PDF로 저장** 선택. A4 기본 12쪽에 전체 프로젝트·성과·기획·스택·한계·원본 링크를 담습니다. 검색·필터·열린 상세창은 출력 대상에 영향을 주지 않습니다. 인쇄 머리글/바닥글을 끄면 문서 자체 페이지 번호만 남습니다.

### 포트폴리오 업데이트

프로젝트의 `.web[data-p]` 카드와 같은 키의 `P` 상세 데이터를 수정하면 웹 상세창과 PDF에 함께 반영됩니다. 수동 스크린샷 PDF가 아니라 텍스트를 검색할 수 있고 링크를 클릭할 수 있는 인쇄 문서를 만듭니다. 3D는 PDF에서 정지 이미지로 표시됩니다. 전체 페이지 인쇄는 데스크톱 Chromium에서 검증했습니다.

3D 원본: [Higgsfield 3D Jutsu / Cherry Connections](https://higgsfield.ai/3d-jutsu/c6e6b80f-2b0c-40a9-949c-d13740d9e6ba), revision 1. 배포용 GLB와 포스터는 `assets/`에 저장되어 임시 다운로드 URL에 의존하지 않습니다. 뷰어는 `@google/model-viewer` 4.1.0을 로컬에 포함하며 라이선스는 `assets/vendor/model-viewer-LICENSE.txt`에 있습니다.

## 🖥️ AENGDO_OS (`index.html`)

체리 아스키 아트가 살랑거리는 바탕화면 위, 전부 진짜로 실행되는 프로그램들.

**바탕화면 (핵심 8)**
- ⭐ `PORTFOLIO` — 한눈에 보기 (창 안에서)
- 📖 `STORY.EXE` — 스크롤 스토리 원본: 맥 윈도우 셸 안에서 읽는 11챕터 내러티브 (밝은 모노크롬 테마)
- 📁 `WORKS` — 탐색기: 영상(유튜브/드라이브 재생)·음악·웹·레포가 파일로
- 🎮 `SIGNAL_RUN.EXE` — 뉴런 터널 러너 (콤보 배수·골드 실드·최고기록 저장)
- 🍒 `앵두 메신저` — 캐릭터가 여정을 들려주고, 앱을 열 때마다 반응 토스트
- ✉️ `MAIL.EXE` · 📄 `README.TXT` · 🧸 `TOYBOX`

**🧸 TOYBOX (부수 11)**
- 🧠 `BRAIN.EXE` — 아스키 문자로 실시간 렌더링되는 3D 뇌 (드래그 회전)
- 📐 `HOUSE.DWG` — 이 OS의 청사진 평면도. **방을 클릭하면 그 앱이 열림**
- 🗞️ `AENGDO TIMES` — 수배(WANTED) 특별판 신문 + 앵두 머그샷
- 💻 `TERMINAL.EXE` — `whoami` `fortune` `hack` `open <app>` `sudo`(거부됨) 되는 셸
- 🌌 `DIVE.EXE` — 뇌→뉴런→원자→은하 무한 줌 / 🌀 `TYPESTORM.EXE` — 커서에 반응하는 키네틱 타이포
- 🔦 `NOIR.SCR` — 손전등 화면보호기 (75초 방치 시 자동 실행)
- 🔒 `SECRET` — 뉴런 개수 퀴즈를 풀면 제작 비하인드 공개
- 📋 `TRACK.LOG` · 🗑️ `휴지통`(버린 아이디어들) · ⛔ `DONT_CLICK.EXE`(경고했음)

**OS 시스템**: 창 드래그/최소화/포커스 · 작업표시줄 + 실시간 시계 · 🍒 시작 메뉴 · 듀얼 부트 메뉴 · 앵두 표정 3종(인사/신남/놀람)

## 📁 파일 구성

| 파일 | 설명 |
|---|---|
| `index.html` | AENGDO OS 셸 (부팅 메뉴 포함) |
| `portfolio.html` | 3D 포트폴리오 · 전체 프로젝트 · PDF 저장 |
| `story.html` | 스크롤 스토리 — 맥 윈도우 셸 안에서 읽는 11챕터 내러티브 |
| `game.html` | SIGNAL RUN 단독 실행 |
| `times.html` | AENGDO TIMES 수배 특별판 |
| `classic.html` | 최초 버전 홈페이지 (보존) |
| `assets/` | 3D 모델/포스터 · 캐릭터 · 작품 이미지 · 스크린샷 · 음악 · 스튜디오/인쇄 CSS와 JS |

## 로컬 실행

전부 정적 파일입니다:

```bash
python -m http.server 8000
# http://localhost:8000
```

Three.js / GSAP / Lenis / 폰트는 CDN 로드라 인터넷 연결이 필요합니다.

---

만든 사람: **앵두** (hyunaeee@gmail.com) — 뇌과학 × 컴퓨터과학 → AI
