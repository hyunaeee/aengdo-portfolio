# aengdo-portfolio 🍒

**AENGDO OS** — 앵두의 레트로 OS 포트폴리오

**Live** → https://hyunaeee.github.io/aengdo-portfolio/

접속하면 BIOS 부팅 후 **부팅 모드**를 고릅니다:

| 모드 | 대상 | 내용 |
|---|---|---|
| `1. PORTFOLIO.ONE` (기본) | 바쁘신 분 | 한 장짜리 요약 — 8초 후 자동 부팅 |
| `2. AENGDO_OS` | 구경 오신 분 | 창을 드래그하며 탐험하는 레트로 데스크톱 |

이력서용 직링크: https://hyunaeee.github.io/aengdo-portfolio/portfolio.html

## ⭐ PORTFOLIO.ONE (`portfolio.html`)

3D 없이 즉시 뜨는 한 장 요약:
- **WHAT I DO** — AI 콘텐츠 제작 · AI 에이전트 개발 · 웹 서비스 개발/배포 · 강의/전시
- **SELECTED WORKS** — 전시 아트·영상·KHNP 어린이 교육 시리즈 5부작(납품작) 썸네일 그리드 + Suno 음악
- **BUILT & SHIPPED** — 배포 중인 웹 서비스 4종 (실제 스크린샷)
- **AI PROJECTS** — GitHub 레포 10선
- **TRACK RECORD / STACK(분야별) / CONTACT**

## 🖥️ AENGDO_OS (`index.html`)

체리 아스키 아트가 살랑거리는 바탕화면 위, 전부 진짜로 실행되는 프로그램들.

**바탕화면 (핵심 8)**
- ⭐ `PORTFOLIO` — 한눈에 보기 (창 안에서)
- 📖 `STORY.EXE` — 스크롤 스토리 원본: 불꽃→뉴런→뇌(뇌주름)→코드 격자→은하로 변신하는 26,000 파티클 WebGL 씬
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
| `portfolio.html` | 한 장 요약 (이력서용) |
| `story.html` | 스크롤 스토리 (11챕터 인터랙티브 내러티브) |
| `game.html` | SIGNAL RUN 단독 실행 |
| `times.html` | AENGDO TIMES 수배 특별판 |
| `classic.html` | 최초 버전 홈페이지 (보존) |
| `assets/` | 앵두 캐릭터(표정 3종)·작품 이미지·스크린샷·음악 |

## 로컬 실행

전부 정적 파일입니다:

```bash
python -m http.server 8000
# http://localhost:8000
```

Three.js / GSAP / Lenis / 폰트는 CDN 로드라 인터넷 연결이 필요합니다.

---

만든 사람: **앵두** (hyunaeee@gmail.com) — 뇌과학 × 컴퓨터과학 → AI
