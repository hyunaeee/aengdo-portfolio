# Hyunae Park — AI Builder

AI 엔지니어 채용을 위한 한·영 포트폴리오입니다. 대표 사례의 문제, 본인 역할, 설계 선택, 평가 근거와 공개 범위를 연결합니다.

- [포트폴리오](https://hyunaeee.github.io/aengdo-portfolio/portfolio.html) · [English](https://hyunaeee.github.io/aengdo-portfolio/en.html)
- 대표 사례: **MED-RAG → Terracotta → Meeting Assistant**
- **Anatomy Atlas**: 실제 전체 구조 / 계통 분해 캡처 비교와 라이브 링크
- **Archive**: 24개 프로젝트 검색·분야·라이브 필터. 최상단 **Venue Atlas**는 세 공연장의 3D 투어, 문·조명·관객 조작과 ZIP 다운로드를 소개합니다. 실제 Blender 렌더와 한·영 기능·재구성 범위를 함께 제공합니다. **Golden Drive**, **B737-8 3D Explorer**, **Modely · 모델리**와 기존 작업도 유지합니다.
- **Creative**: 영상·이미지. 기존 레트로 OS는 **Playground**에서 실행
- **History**: 이전 포트폴리오의 2017–2026 경력·연구·학력·강의·활동 22개를 복원한 상세 이력. 홈과 메뉴, PDF에서 연결합니다.

## 편집과 실행

```sh
node scripts/build-portfolio.cjs
python -m http.server 8765
# http://localhost:8765/
```

`assets/portfolio-content.js`의 한·영 데이터를 수정한 뒤 빌드합니다. 전체 아카이브 데이터는 `assets/portfolio-archive.js`입니다. 빌드는 홈, 아카이브, Creative, 4개 사례의 한·영 정적 HTML과 sitemap을 생성합니다. 생성된 HTML도 커밋하므로 GitHub Pages에서 별도 빌드 서버 없이 제공합니다. 웹과 PDF가 같은 콘텐츠를 사용합니다.

| 경로 | 역할 |
|---|---|
| `index.html`, `portfolio.html`, `en.html` | 채용용 홈. 진입 시 부팅 대기 없음 |
| `work/{med-rag,terracotta,meeting,anatomy}/` | 사례별 한국어 `index.html`, 영어 `en.html` |
| `archive.html`, `archive-en.html` | 프로젝트 검색과 공개 범위 |
| `creative.html`, `creative-en.html` | 창작 작업 |
| `history.html`, `history-en.html` | 상세 커리어 히스토리 |
| `playground.html` | 기존 HYUNAE OS와 앱 에뮬레이터 |
| `assets/portfolio.css`, `assets/portfolio-app.js` | 반응형 레이아웃과 탐색·비교 기능 |
| `assets/portfolio-export.js`, `assets/portfolio-print.css` | A4 인쇄·PDF 구성 |
| `med-rag-serving/` | CPU 검증을 마친 MLOps 실험 기반과 실행 조건 |

기존 `index.html#os`, `#phone`, `#hb` 주소는 Playground로 이어집니다. `story.html`, `classic.html`, `game.html`, `times.html`과 기존 제품 UI 데모는 보존합니다.

## PDF

상단 **PDF** 버튼에서 언어와 강조 역량을 선택하고 브라우저 인쇄 창의 **PDF로 저장**을 사용합니다. 기본판은 대표 사례 중심의 A4 7쪽이며 전체 아카이브는 별도 선택입니다. 일반판, 서빙·운영 중심(Toss), 제품 구현 중심(Motif), 고객 문제·평가 중심(Cohere)의 순서와 소개가 달라집니다. 회사별 경력이나 실측 성과를 새로 만들어 넣지 않습니다.

PDF는 검색 가능한 텍스트, 원문 링크, 실제 캡처를 포함합니다. 브라우저 머리글·바닥글은 끄는 편이 좋습니다. Chromium에서 화면·중첩 사례 경로·인쇄를 확인했습니다. `output/`의 로컬 PDF와 `tmp/` 검수 캡처는 저장소에서 제외합니다.

## 3D Mac Studio와 안내

첫 화면은 Mac Studio 본체, 모니터, 키보드와 마우스로 구성한 3D 장면입니다. 모니터 안에 **Hyunae Park / AI Builder**를 실제 메시로 넣었습니다. 드래그와 방향키로 회전하며, 처음 각도로 돌아가는 버튼이 있습니다. 자동 회전은 하지 않습니다. WebGL이나 JavaScript를 사용할 수 없을 때는 같은 장면의 정지 이미지를 표시합니다.

[Higgsfield 3D Jutsu / Mac Studio](https://higgsfield.ai/3d-jutsu/778e498b-7d74-4c2b-8fd2-2d1350f752ca)에서 제작했습니다. 모델과 이미지는 로컬 `assets/hyunae-mac-studio.glb`, `assets/hyunae-mac-studio.png`로 제공하며, Blender 생성 코드는 `scripts/build-studio-scene.py`, 출처와 리비전은 `assets/hyunae-mac-studio.source.json`에 기록했습니다.

[Higgsfield 3D Jutsu / Portfolio Guide](https://higgsfield.ai/3d-jutsu/c6e6b80f-2b0c-40a9-949c-d13740d9e6ba) revision 3에서 만든 캐릭터입니다. `hyunae-guide-v2.glb`는 원본 메시·재질·리그·4초 `GreetingLoop`를 보존하고 로컬에서 `Idle` 4.8초와 `Point` 2.8초 클립을 추가한 파생 파일입니다. 출처와 검증 기록은 `assets/hyunae-guide-v2.source.json`에 있습니다.

체리는 상단의 작은 버튼으로만 엽니다. 첫 방문에는 캐릭터 패널을 표시하거나 캐릭터 GLB를 내려받지 않습니다. 펼친 패널 안의 캐릭터는 96px이며, 안내 닫기·Escape·바깥 영역 클릭으로 접힙니다. 패널을 닫거나 탭을 벗어나면 동작을 멈춥니다. 일시정지, 동작 줄이기 설정, 정지 이미지 대체를 지원합니다. 모델 뷰어 4.1.0과 라이선스는 `assets/vendor/`에 있습니다. PDF의 포지션도 AI Builder이며, 인쇄는 별도의 텍스트·프로젝트 레이아웃을 사용합니다.

## 근거와 MLOps 범위

- MED-RAG 초기 로컬 실행은 사용자 확인 **RTX 5090**, 현재 회의 어시스턴트 운영은 **RTX 4090**입니다. QLoRA 기록의 RTX 4090 학습과 별도로 설명합니다.
- 공개 MED-RAG 평가는 합성 데이터입니다. 거부 예제 오라벨 22%의 분모는 **37개 중 8개**이며 전체 학습셋이 아닙니다.
- Terracotta 정책 시뮬레이션, 컨테이너 발행, 서비스 가용성은 서로 다른 근거입니다.
- Serving Lab의 버전 고정·gate·SSE client·release 준비는 CPU에서 검증했습니다. **실제 GPU 추론, 성능 개선, 장애 복구 시간은 아직 측정하지 않았습니다.** 운영 중인 회의 서비스와 분리한 환경에서 후속 실험합니다.

설계안: [포트폴리오 개편안](PORTFOLIO_REDESIGN_PLAN.md), [MLOps 실행 계획](MLOPS_TARGET_ROADMAP.md). 실제 검증 범위는 [Serving Lab 상태](med-rag-serving/reports/STATUS.md)를 참조합니다.

Hyunae Park · hyunaeee@gmail.com

## Golden Drive

[다른 작업들 · Golden Drive](https://hyunaeee.github.io/aengdo-portfolio/archive.html#golden-drive)의 Play 분류에 실제 게임 캡처와 한국어·영어 소개를 게시했습니다. 15개 차량 설정, 뉴욕·서울 2개 도시, 6개 코스와 AI 경쟁 차량 4대, 120Hz 물리·경주 규칙·최적화·65개 테스트의 구현 범위를 정리합니다.

현재 공개 범위는 프로젝트 소개와 화면 이미지입니다. 게임 소스와 3D 에셋, 플레이 데모는 이 저장소에 포함하지 않습니다. 대표 이미지의 Tesla Model 3 모델은 aarajesh의 CC BY 4.0 에셋입니다.

화면 이미지 차량 출처: [Tesla White car. — aarajesh](https://sketchfab.com/3d-models/tesla-white-car-2a4ee44439dc4b1b98f452a9ff427116), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 게임용 크기·배치·재질을 적용한 차량의 실제 렌더링 화면이며, 이미지의 도시·UI와 장면 구성은 Golden Drive 작업입니다.
