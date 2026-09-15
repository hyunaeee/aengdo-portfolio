/* Preserved project archive; shared by web and PDF. */
(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.HYUNAE_ARCHIVE=data;})(typeof globalThis!=='undefined'?globalThis:this, [
{
  "id": "serving-lab",
  "title": "MED-RAG Serving Lab",
  "summary": {
    "ko": "LLM 변경을 검사하고 배포 후보를 준비하는 MLOps 실험. 실제 HTTP 게이트웨이에 장애를 주입하고, 품질 회귀와 artifact 변조를 배포 준비 단계에서 차단했습니다.",
    "en": "An MLOps lab for validating LLM changes and preparing release candidates. It exercises the real HTTP gateway under injected faults and blocks quality regressions and artifact tampering before packaging."
  },
  "category": "ai",
  "status": {
    "ko": "LIVE / 실행 기록 탐색 · CPU 검증",
    "en": "LIVE / EVIDENCE EXPLORER · CPU VERIFIED"
  },
  "period": "2026.09",
  "image": "assets/serving-lab.png",
  "imageAlt": {
    "ko": "MED-RAG Serving Lab의 실제 화면: 구현 모듈과 품질 gate, 요청 기록",
    "en": "Actual MED-RAG Serving Lab interface: implemented modules, quality gates and request evidence"
  },
  "live": true,
  "caseId": "serving-lab",
  "stack": [
    "MLOps",
    "Python",
    "HTTP / SSE",
    "Docker Compose",
    "Prometheus",
    "GitHub Actions"
  ],
  "links": [
    {
      "label": {
        "ko": "실행 기록 탐색",
        "en": "Explore recorded evidence"
      },
      "url": "https://hyunaeee.github.io/aengdo-portfolio/work/serving-lab/",
      "kind": "demo"
    },
    {
      "label": {
        "ko": "구현 코드",
        "en": "Source code"
      },
      "url": "https://github.com/hyunaeee/aengdo-portfolio/tree/main/med-rag-serving",
      "kind": "code"
    },
    {
      "label": {
        "ko": "원본 실행 기록",
        "en": "Raw run evidence"
      },
      "url": "https://hyunaeee.github.io/aengdo-portfolio/med-rag-serving/reports/rehearsal/evidence.json",
      "kind": "source"
    },
    {
      "label": {
        "ko": "자동 검사",
        "en": "CI runs"
      },
      "url": "https://github.com/hyunaeee/aengdo-portfolio/actions/workflows/serving-lab.yml",
      "kind": "source"
    }
  ],
  "limitations": {
    "ko": "GPU inference·모델 지연·처리량·독립 품질 평가·실제 배포 교체 및 롤백은 미측정입니다. 현재 사이트는 저장된 실행 기록을 탐색하며 inference 서버를 호출하지 않습니다.",
    "en": "GPU inference, model latency/throughput, independent quality and live rollout/rollback remain unmeasured. This site explores recorded evidence and does not call an inference service."
  }
},
  {
    "id": "venue-atlas",
    "title": "Venue Atlas",
    "summary": {
      "ko": "시드니 오페라하우스·예술의전당·국립국악원의 외부와 내부를 둘러보는 3D 투어. 문을 열고 연결 공간을 걸으며, 시점·조명과 관객 애니메이션을 조작합니다.",
      "en": "A 3D tour of Sydney Opera House, Seoul Arts Center and the National Gugak Center. Explore exteriors and interiors, open doors, walk through connected spaces, and control viewpoints, lighting and audience animation."
    },
    "category": "play",
    "status": {
      "ko": "LIVE / 인터랙티브 3D",
      "en": "LIVE / INTERACTIVE 3D"
    },
    "period": "2026.09",
    "image": "assets/venue-atlas.png",
    "imageAlt": {
      "ko": "제공하는 Blender 모델로 렌더링한 시드니 오페라하우스의 지붕 셸·외벽·광장 디테일",
      "en": "Sydney Opera House roof shells, facade and plaza details rendered from the delivered Blender model"
    },
    "links": [
      {
        "label": {
          "ko": "공연장 둘러보기 ↗",
          "en": "EXPLORE THE VENUES ↗"
        },
        "url": "https://venue-atlas.vercel.app"
      },
      {
        "label": {
          "ko": "국악원 실내 보기 ↗",
          "en": "EXPLORE GUGAK INTERIORS ↗"
        },
        "url": "https://venue-atlas.vercel.app/#ngc/ngc-yeak"
      }
    ],
    "stack": [
      "Three.js",
      "Blender",
      "Python",
      "WebGL",
      "glTF / GLB",
      "PBR",
      "Vercel"
    ],
    "live": true,
    "problem": {
      "ko": "사진과 공개 자료로 재구성한 공연장을 반복해서 탐색하고 연출할 수 있는 웹 경험으로 연결했습니다. 좌석·소품·문은 Blender 원본에서 개별 편집하고, 웹에서는 정적 메시를 병합·인스턴싱해 표시합니다.",
      "en": "Photo-informed venue reconstructions become repeatable spaces for exploration and staging. Seats, props and doors remain individually editable in Blender; the web viewer merges and instances static geometry for display."
    },
    "build": [
      {
        "ko": "세 시설의 31개 공간을 마우스 회전·이동·확대/축소와 보행 모드로 탐색합니다. 공간 단독 보기, 저장된 시점과 조명 조절을 제공합니다.",
        "en": "Explore 31 spaces across three venues with orbit, pan, zoom and walking modes, plus space isolation, saved viewpoints and lighting controls."
      },
      {
        "ko": "문짝 56개에 회전·슬라이딩 개폐를 연결하고, 좌석 지지면과 문을 통과하는 동선을 점검했습니다. 목재·석재·패브릭 재질과 문틀·손잡이·좌석 디테일을 보강했습니다.",
        "en": "Connected 56 door leaves to hinged or sliding controls and checked seating support and door passages. Refined wood, stone and fabric materials alongside frames, handles and seat details."
      },
      {
        "ko": "관객 표시를 켜고 끄며 박수·환호·걷기 동작을 재생합니다. 기존 인물 리그의 애니메이션과 추가 GLB 가져오기를 지원합니다.",
        "en": "Toggle audience visibility and play applause, cheering and walking animations. Supports existing character rigs and additional GLB imports."
      },
      {
        "ko": "Blender 원본, 애니메이션 인물과 오프라인 웹 뷰어를 ZIP으로 제공합니다. CC0 재질과 MIT 인물 자산의 출처·라이선스를 함께 보존했습니다.",
        "en": "Download native Blender scenes, animated characters and an offline web viewer as ZIP archives, with sources and licenses for CC0 materials and MIT character assets."
      }
    ],
    "limitations": {
      "ko": "사진과 공개 자료를 참고한 시각적 재구성입니다. 실측 도면으로 확인하지 못한 일부 치수와 연결 통로는 추정이며, 시설 전체를 정확히 복제한 디지털 트윈은 아닙니다.",
      "en": "A visual reconstruction based on photographs and public references. Some dimensions and connections are inferred without surveyed drawings; it is not an exact digital twin of every facility."
    }
  },
  {
    "id": "golden-drive",
    "title": "Golden Drive",
    "summary": {
      "ko": "노을 지는 뉴욕과 서울 광화문을 달리는 3D 브라우저 레이싱 게임. 슈퍼카를 포함한 15개 차량 설정, 6개 코스에서 AI 차량 4대와 경주하거나 자유롭게 드라이브합니다.",
      "en": "A 3D browser racing game set in Manhattan- and Gwanghwamun-inspired cities at sunset. Choose from 15 vehicle configurations and six courses to race four AI rivals or enjoy free driving."
    },
    "category": "play",
    "status": {
      "ko": "브라우저 게임 / 로컬 데모",
      "en": "BROWSER GAME / LOCAL DEMO"
    },
    "period": "2026.09",
    "image": "assets/golden-drive.jpg",
    "imageAlt": {
      "ko": "Golden Drive 실제 게임 화면: 노을 지는 도심과 차량 선택",
      "en": "Golden Drive gameplay screen showing the city at sunset and vehicle selection"
    },
    "links": [
      {
        "label": {
          "ko": "화면 이미지 출처 ↗",
          "en": "IMAGE CREDITS ↗"
        },
        "url": "https://github.com/hyunaeee/aengdo-portfolio#golden-drive"
      }
    ],
    "stack": [
      "Three.js",
      "cannon-es",
      "JavaScript",
      "WebGL",
      "glTF / GLB",
      "GitHub Pages"
    ],
    "live": false,
    "problem": {
      "ko": "설치 없이 도시의 노을을 즐기며 달릴 수 있는 게임을 만들었습니다. 차량과 거리의 상세도를 높이면서 생긴 렌더링 부하를 줄이고, 조작감과 경주 판정도 함께 개선했습니다.",
      "en": "I wanted a game people could open in a browser and immediately enjoy driving through a city at sunset. As vehicle and street detail increased, I refined the rendering workload, handling, and race adjudication together."
    },
    "build": [
      {
        "ko": "게임 구성 — 뉴욕·서울 2개 도시, 6개 코스, 15개 차량 설정과 자유 주행. 도시·차량 선택부터 카메라·HUD·최고 기록까지 연결하고 키보드·터치·게임패드를 지원합니다.",
        "en": "Game structure — two cities, six courses, 15 vehicle configurations, and free driving. City and vehicle selection connect to cameras, HUD, and personal records, with keyboard, touch, and gamepad controls."
      },
      {
        "ko": "주행 물리 — cannon-es의 120Hz 고정 간격 계산에 가속·제동·코너링이 공유하는 접지력 한도와 속도별 조향을 적용했습니다. 차종별 무게·출력·접지 설정으로 조작감을 구분합니다.",
        "en": "Vehicle physics — cannon-es runs at a fixed 120Hz with a shared grip budget for acceleration, braking, and cornering, plus speed-sensitive steering. Vehicle-specific mass, power, and grip settings produce different handling."
      },
      {
        "ko": "AI와 경주 규칙 — 경쟁 차량 4대가 같은 물리 공간에서 주행합니다. 연속 이동 기반 체크포인트 판정, 결승 시점 보간, 복귀 +5초와 페널티 반영 순위를 구현하고 자율주행·복귀 기록은 최고 기록에서 제외합니다.",
        "en": "AI and race rules — four rivals drive in the same physical world. Continuous-motion checkpoints, interpolated finish times, and a five-second recovery penalty determine results. Assisted or recovered runs do not set personal records."
      },
      {
        "ko": "도시와 성능 — 강변·광화문 거리와 보행자·강아지 산책을 구성했습니다. 차량 모델 경량화, 인스턴싱, 거리별 상세 표시, 움직임 보간과 자동 그래픽 조절로 렌더링 부하를 관리합니다.",
        "en": "Cities and rendering — waterfront and Gwanghwamun street scenes include pedestrians and dog walkers. Lighter vehicle models, instancing, distance-based detail, motion interpolation, and adaptive graphics manage rendering work."
      },
      {
        "ko": "검증 — 1.4 업데이트에서 차량 역학·경주 판정·AI 완주·렌더링 예산 등을 다룬 자동 테스트 65개를 통과했습니다. 브라우저에서 뉴욕·서울 완주와 모바일 터치 가속·제동·일시정지를 확인했습니다.",
        "en": "Verification — version 1.4 passed 65 automated tests covering vehicle dynamics, race adjudication, AI completion, and rendering budgets. Browser checks covered race completion in both cities and mobile touch acceleration, braking, and pause."
      }
    ],
    "limitations": {
      "ko": "현재 이 페이지에는 프로젝트 소개와 실제 화면을 공개하며, 플레이 데모는 아직 공개하지 않았습니다. 도시는 실측·스캔 복원이 아닌 게임용 재해석입니다. 물리는 브라우저 조작감을 위한 아케이드 근사이며 제조사의 실제 성능을 재현하지 않습니다. 성능은 기기·브라우저에 따라 달라지고 간헐적인 프레임 지연이 남아 있습니다. 차량에는 외부 3D 모델을 활용했습니다. 대표 이미지의 Tesla Model 3는 aarajesh의 CC BY 4.0 모델이며 게임용 배치·재질을 적용했습니다.",
      "en": "This page publishes the project overview and actual screenshots; the playable demo is not public yet. The cities are game interpretations rather than surveyed or scanned reconstructions. Physics uses an arcade approximation and does not reproduce manufacturer performance. Frame rate varies by device and browser, with occasional delays remaining. Vehicles include third-party 3D models. The cover screenshot uses aarajesh’s Tesla Model 3 under CC BY 4.0, adapted with game placement and materials."
    }
  },
  {
    "id": "b737-explorer",
    "title": "B737-8 3D Explorer",
    "summary": {
      "ko": "기체 외피부터 조종석·객실·LEAP-1B 엔진까지 탐색하는 3D 항공기 뷰어. 부품을 선택·분해하고, 창문 덮개·테이블·날개의 동작과 조명을 직접 조작합니다.",
      "en": "An interactive aircraft explorer spanning the airframe, cockpit, cabin and LEAP-1B engines. Select and separate parts, operate window shades, tray tables and wing controls, and adjust the lighting."
    },
    "category": "play",
    "status": {
      "ko": "LIVE / 인터랙티브 3D",
      "en": "LIVE / INTERACTIVE 3D"
    },
    "period": "2026.09",
    "image": "assets/b737-explorer.png",
    "imageAlt": {
      "ko": "B737-8 Explorer의 실제 배포 모델을 Blender에서 렌더링한 기체 전체 사선 모습",
      "en": "Three-quarter exterior view rendered in Blender from the actual B737-8 Explorer release model"
    },
    "links": [
      {
        "label": {
          "ko": "기체 둘러보기 ↗",
          "en": "EXPLORE THE AIRCRAFT ↗"
        },
        "url": "https://airplane-sample.vercel.app/?view=all&v=6202961"
      },
      {
        "label": {
          "ko": "부품 움직여 보기 ↗",
          "en": "TRY THE MECHANISMS ↗"
        },
        "url": "https://airplane-sample.vercel.app/?view=details&v=6202961"
      }
    ],
    "stack": [
      "Three.js",
      "Blender",
      "Python",
      "WebGL",
      "glTF / GLB",
      "PBR",
      "Vercel"
    ],
    "live": true,
    "problem": {
      "ko": "제공받은 항공기 모델의 창문·외피 정합과 문·선반 리깅을 수정하고, 정적인 형상을 내부 구조와 작동 원리까지 살펴볼 수 있는 웹 경험으로 확장했습니다.",
      "en": "Starting from a supplied aircraft model, I corrected window-to-skin alignment and door/bin rigging, then extended the static geometry into a web experience for exploring internal structures and mechanisms."
    },
    "build": [
      {
        "ko": "31,665개 부품을 이름으로 검색·선택·단독 표시하고 분해합니다. 선택 부품의 재질과 관련 애니메이션을 GLB로 내보내며, 전체 GLB·Blender 파일도 제공합니다.",
        "en": "Search, select, isolate and separate 31,665 parts. Export a selected part with its materials and relevant animation as GLB, or download the complete GLB and Blender files."
      },
      {
        "ko": "Singapore Airlines의 737-8 운항 사례를 참고한 비즈니스 10석·이코노미 144석, 조종석과 LEAP-1B 엔진을 구성했습니다. 일등석은 별도 디자인 콘셉트로 구분합니다.",
        "en": "The cabin references Singapore Airlines' 737-8 layout of 10 business and 144 economy seats, alongside cockpit and LEAP-1B engine views. First class is presented as a separate design concept."
      },
      {
        "ko": "88개 창문 덮개의 곡면 슬라이딩과 좌석별 잠금 해제·테이블 펼침을 구현했습니다. 위치별 또는 연동 조작을 지원하며, 날개는 플랩·앞전 장치, 스포일러, 보조익으로 나누어 제어합니다.",
        "en": "Implemented 88 curved sliding shades and seat-specific latch and tray sequences. Controls can target one window, seat or wing, or link matching assemblies; wing controls separately drive flaps with their leading-edge devices, spoilers and ailerons."
      },
      {
        "ko": "FlightGear 공개 메시와 CC0 재질을 수정·활용하고, PBR·HDR 환경광과 네 가지 라이팅 프리셋을 연결했습니다. 출처·라이선스·재생성 소스는 뷰어에서 제공합니다.",
        "en": "Adapted FlightGear meshes and CC0 materials feed a PBR renderer with HDR environment lighting and four lighting presets. Sources, licenses and reproducible build archives are available in the viewer."
      },
      {
        "ko": "웹·GLB·Blender의 부품 위치, 재질과 애니메이션을 교차 검증하고, 실제 브라우저 조작과 Blender 렌더로 확인했습니다. 배포 자산과 다운로드 파일도 로컬 최종본과 대조했습니다.",
        "en": "Cross-checked part positions, materials and animation across the web viewer, GLB and Blender, then inspected browser interactions and native renders. Published assets and downloads were compared with the verified local release."
      }
    ],
    "limitations": {
      "ko": "공개 사양과 제공 모델에 맞춘 시각적 재현입니다. 제조사 CAD를 확보하지 않은 내부 단면·링크 치수·작동 경로는 추정이며, 애니메이션 시간은 검사 시연용입니다. 실제 기체의 모든 부품이나 비행 절차를 완전히 재현한 시뮬레이터는 아닙니다.",
      "en": "This is a visual reconstruction fitted to public specifications and the supplied model. Internal sections, linkage dimensions and motion paths without manufacturer CAD are illustrative; animation timing serves inspection. It is not a complete aircraft-parts or flight-procedure simulator."
    }
  },
  {
    "id": "modely",
    "title": "Modely · 모델리",
    "summary": {
      "ko": "정책 위반 응대, 티켓 오분류, 문서 필드 누락, 콘텐츠 검수 실패를 줄이기 위한 AI 튜닝 설계 도구. 업무별 데이터·목표 출력·평가 기준을 연결하고 레시피와 검증 계획을 공유합니다.",
      "en": "A task-specific AI tuning design tool for policy-adherence failures, ticket misrouting, missing document fields and content-review errors. Connect data, target outputs and evaluation criteria, then share recipes and test plans."
    },
    "category": "ai",
    "status": {
      "ko": "LIVE / 제품 UX 데모",
      "en": "LIVE / PRODUCT UX DEMO"
    },
    "period": "2026.08 – 진행 중",
    "image": "assets/modely-console.png",
    "imageAlt": {
      "ko": "모델리 실제 데모 화면: 네 가지 행동 다이얼, 성향 표시와 레시피 저장",
      "en": "Live Modely demo showing four behavior dials, a profile display and recipe saving"
    },
    "links": [
      {
        "label": {
          "ko": "직접 조작하기 ↗",
          "en": "TRY THE DEMO ↗"
        },
        "url": "https://fine-tuning-visualization.vercel.app/"
      },
      {
        "label": {
          "ko": "공개 코드 ↗",
          "en": "SOURCE CODE ↗"
        },
        "url": "https://github.com/hyunaeee/fine-tuning-visualization"
      }
    ],
    "stack": [
      "Next.js",
      "React",
      "TypeScript",
      "Vercel",
      "localStorage",
      "Fine-tuning UX"
    ],
    "live": true,
    "problem": {
      "ko": "말투를 바꾸는 것만으로는 파인튜닝의 필요성을 설명하기 어렵습니다. 반복되는 업무 오류를 정의하고, 프롬프트·검색·구조화 출력으로 해결할 수 있는 문제와 학습을 검토할 문제를 구분하도록 설계했습니다.",
      "en": "Changing tone alone is not a strong reason to fine-tune. The product starts with recurring business errors and distinguishes problems to address with prompting, retrieval or structured outputs from those worth evaluating with training."
    },
    "build": [
      {
        "ko": "네 가지 업무 시나리오: 정책·승인 사례 → 조건 확인과 예외 이관, 전문가 라벨 티켓 → 유형·우선순위·담당 팀, 원문·필드 정의 → JSON과 미확인 값 null, 승인 상품 사실 → 검수 문구와 수정 사유. 실패 유형과 목표 출력 예시를 비교합니다.",
        "en": "Four workflows: policies and reviewed cases → condition checks and escalation; expert-labeled tickets → category, priority and team; source text and field definitions → JSON with null for unknowns; approved product facts → reviewed copy and revision reasons. Compare failure patterns with target-output examples."
      },
      {
        "ko": "파란색 입체 UI와 업무 기준 다이얼로 출력 동작을 쉽게 체험합니다. 목적별로 해결할 오류, 학습 대상 동작, 먼저 비교할 방법을 표시하고 Macro-F1·필드 정확 일치·예외 이관 등 검증 항목을 연결했습니다. 실제 측정과 설정 시뮬레이션은 구분합니다.",
        "en": "A blue tactile UI and a task-rule dial make output behavior approachable. Each purpose connects the error, training target and baseline alternatives to checks such as Macro-F1, field exact match and exception escalation. Actual evaluation is distinct from configuration simulation."
      },
      {
        "ko": "모델·목적·질문·다이얼을 레시피로 저장하고 공유 링크로 복원합니다. 고객 인계 JSON에는 입력·출력 예시와 업무 목적, 학습과 분리한 평가셋 비교 계획 및 미실행 상태를 담습니다. 기존 레시피 호환성도 유지했습니다.",
        "en": "Save the model, goal, questions and dial settings as recipes and restore them through share links. Handoff JSON includes input/output examples, business rationale and a held-out comparison plan explicitly marked not run. Existing recipes remain compatible."
      }
    ],
    "limitations": {
      "ko": "현재 공개판은 프런트엔드 제품 데모입니다. 답변·다이얼 지표는 규칙 기반 예시이며, 실제 API 호출·파일 분석·학습·고객별 배포는 연결되지 않았습니다. 가상의 성능 향상 수치는 제거했습니다. 평가 항목은 미실행 계획이며 모델 제공사의 학습 지원과 계정 접근 조건은 별도 확인이 필요합니다.",
      "en": "The public build is a frontend product demo. Responses and dial indicators are rule-based examples; APIs, file analysis, training and customer deployment are not connected. Invented improvement figures were removed. Evaluation criteria are unexecuted plans, and provider training support and account access require separate verification."
    }
  },
  {
    "id": "anatomy",
    "title": "Anatomy Atlas",
    "summary": {
      "ko": "계통별 분리·검색·원본 내보내기를 지원하는 3D 해부학 탐색기.",
      "en": "A 3D anatomy explorer with system separation, search, and original-model export."
    },
    "category": "play",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.09",
    "image": "assets/anatomy-exploded.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://anatomy-sample.vercel.app/"
      }
    ],
    "stack": [
      "React 19",
      "TypeScript",
      "Three.js",
      "Vite",
      "meshoptimizer",
      "Vercel"
    ],
    "live": true,
    "problem": {
      "ko": "계통별 분리·검색·원본 내보내기를 지원하는 3D 해부학 탐색기.",
      "en": "A 3D anatomy explorer with system separation, search, and original-model export."
    },
    "build": [],
    "limitations": {
      "ko": "상세 사례에서 검증 조건과 한계를 확인하세요.",
      "en": "See the case study for verification conditions and limitations."
    },
    "caseId": "anatomy"
  },
  {
    "id": "medrag",
    "title": "MED-RAG",
    "summary": {
      "ko": "온프렘 진료 보조 RAG와 별도 합성 데이터 평가·튜닝 실험.",
      "en": "On-prem clinical RAG with separate synthetic-data evaluation and tuning experiments."
    },
    "category": "ai",
    "status": {
      "ko": "CLIENT DELIVERY / EXPERIMENT",
      "en": "CLIENT DELIVERY / EXPERIMENT"
    },
    "period": "2025.10 – 2026.01",
    "image": "assets/medrag.jpg",
    "links": [
      {
        "label": "LIVE DEMO ↗",
        "url": "med-rag/"
      },
      {
        "label": "클라우드 포팅 ↗",
        "url": "https://github.com/hyunaeee/aengdo-portfolio/tree/main/med-rag-vertex"
      }
    ],
    "stack": [
      "Python",
      "LangChain",
      "Gemma 3 27B (Ollama, 온프렘)",
      "Chroma",
      "Vertex AI + ADK (포트)",
      "LLM-judge 평가",
      "Docker"
    ],
    "live": false,
    "problem": {
      "ko": "온프렘 진료 보조 RAG와 별도 합성 데이터 평가·튜닝 실험.",
      "en": "On-prem clinical RAG with separate synthetic-data evaluation and tuning experiments."
    },
    "build": [],
    "limitations": {
      "ko": "상세 사례에서 검증 조건과 한계를 확인하세요.",
      "en": "See the case study for verification conditions and limitations."
    },
    "caseId": "med-rag"
  },
  {
    "id": "orchestra",
    "title": "Agent Orchestra",
    "summary": {
      "ko": "LangGraph 멀티에이전트 구조, 재작성 루프와 오프라인 구조 검증.",
      "en": "A LangGraph multi-agent reference with rewrite loops and offline structural verification."
    },
    "category": "ai",
    "status": {
      "ko": "CODE / EXPERIMENT",
      "en": "CODE / EXPERIMENT"
    },
    "period": "2026.07",
    "links": [
      {
        "label": "실행 리포트 ↗",
        "url": "agent-orchestra/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/agent-orchestra"
      }
    ],
    "stack": [
      "Python",
      "LangGraph (병렬 fan-out)",
      "LangSmith",
      "Claude API (선택)",
      "결정적 오프라인 mock",
      "평가 하네스"
    ],
    "live": false,
    "problem": {
      "ko": "멀티에이전트 시스템의 뼈대(오케스트레이션·메모리·평가)는 모델 품질과 분리해서 검증할 수 있어야 합니다. med-rag를 납품하며 배운 '검증 가능한 에이전트' 원칙을 일반화한 오픈소스 레퍼런스예요.",
      "en": "The skeleton of a multi-agent system — orchestration, memory, evaluation — should be verifiable independently of model quality. A minimal-complete reference that generalizes the 'verifiable agent' principles learned shipping med-rag."
    },
    "build": [
      {
        "ko": "supervisor → 병렬 리서처 → critic → 재작성 흐름을 구현합니다.",
        "en": "A supervisor fans out to researchers, then a critic can request a rewrite."
      }
    ],
    "limitations": {
      "ko": "오프라인 mock은 구조 검증입니다. 실제 모델 품질이나 매 실행의 개선을 입증하지 않습니다.",
      "en": "Offline mocks verify wiring, not model quality or improvement on every run."
    }
  },
  {
    "id": "terracotta",
    "title": "Terracotta",
    "summary": {
      "ko": "모델 라우팅·도구 승인·사용량 기록·Docker 셀프호스팅을 연결한 개인 AI 작업실.",
      "en": "A personal AI workspace with model routing, tool approvals, usage records, and Docker self-hosting."
    },
    "category": "ai",
    "status": {
      "ko": "PROTOTYPE / CODE",
      "en": "PROTOTYPE / CODE"
    },
    "period": "2026.07",
    "image": "assets/terracotta.jpg",
    "links": [
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/terracotta"
      }
    ],
    "stack": [
      "TypeScript",
      "Next.js 16 + Cloudflare Workers",
      "D1 + Drizzle (레지스트리·사용량 원장)",
      "MCP (Streamable HTTP + OAuth PKCE)",
      "라우팅 정책 벤치마크"
    ],
    "live": false,
    "problem": {
      "ko": "모델 라우팅·도구 승인·사용량 기록·Docker 셀프호스팅을 연결한 개인 AI 작업실.",
      "en": "A personal AI workspace with model routing, tool approvals, usage records, and Docker self-hosting."
    },
    "build": [],
    "limitations": {
      "ko": "상세 사례에서 검증 조건과 한계를 확인하세요.",
      "en": "See the case study for verification conditions and limitations."
    },
    "caseId": "terracotta"
  },
  {
    "id": "docent",
    "title": "Smart Docent — Location-Aware AI Guide",
    "summary": {
      "ko": "실시간 위치 기반 1:1 AI 도슨트 · LangGraph 멀티에이전트 · 한영일중 4개 국어 — 4인 팀 프로젝트 (팀 리더)",
      "en": "A real-time, location-aware AI tour guide for K-tourism: a LangGraph multi-agent docent that follows your position on a live Mapbox map and answers in four languages."
    },
    "category": "ai",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2025.08 – 진행 중",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://smart-docent-mapbox.vercel.app/"
      }
    ],
    "stack": [
      "Next.js App Router",
      "TypeScript",
      "Tailwind CSS",
      "Mapbox GL JS",
      "LangGraph 멀티에이전트",
      "Geolocation API"
    ],
    "live": true,
    "problem": {
      "ko": "관광객은 수백 년의 역사를 안내판 하나로 스쳐 지나가요. 지금 서 있는 위치를 아는 도슨트 — 이동을 따라오며 내 언어로 현지 전문가처럼 답해주는 가이드를 만들고 있습니다.",
      "en": "Tourists walk past centuries of Seoul's history with nothing but static signboards. We wanted a docent that knows where you are actually standing — following your position in real time and answering like a local expert, in your language."
    },
    "build": [
      {
        "ko": "내 역할 (팀 리더) — 기획, AI 데이터 전처리(에이전트에 들어가는 장소·관광 콘텐츠), 캐릭터 디자인",
        "en": "My role — team lead of 4: product definition, architecture decisions, the place-data pipeline the agents ground on, and character design — the agent implementation is shared with teammates"
      },
      {
        "ko": "위치 파이프라인 — 브라우저 Geolocation 실시간 좌표 + Mapbox GL JS 마커·카메라 연출 (경복궁·북촌·창덕궁·인사동·청계천 데모)",
        "en": "Location pipeline — browser Geolocation streams live coordinates; Mapbox GL JS renders landmark markers with smooth camera moves (demo: Gyeongbokgung, Bukchon, Changdeokgung, Insadong, Cheonggyecheon)"
      },
      {
        "ko": "에이전트 중계 — Next.js API가 선택한 장소·질문 맥락을 LangGraph 멀티에이전트 도슨트에 전달, LLM 미연결 시 로컬 응답 폴백",
        "en": "Agent relay — a Next.js API route passes the selected place and question context to a LangGraph-based multi-agent docent, with a local fallback when the LLM endpoint is unavailable"
      },
      {
        "ko": "모듈형 설계 — 장소 데이터·지도 스타일·LLM 엔드포인트를 독립적으로 교체 가능, API 키는 서버 환경변수에만",
        "en": "Modular by design — place data, map style and LLM endpoint are independently swappable; API keys live only in server environment variables"
      }
    ],
    "limitations": {
      "ko": "공개 데모는 서울 샘플 데이터 기반이고, LLM 엔드포인트 미연결 시 로컬 폴백으로 응답합니다.",
      "en": "The public demo ships Seoul sample data, and the docent answers from a local fallback when the LLM endpoint is not connected."
    }
  },
  {
    "id": "meeting",
    "title": "Meeting Assistant",
    "summary": {
      "ko": "현재 RTX 4090에서 운영하는 사내 회의 어시스턴트. 공개 화면은 샘플 데이터 데모입니다.",
      "en": "An internal meeting assistant currently running on RTX 4090. The public interface is a sample-data demo."
    },
    "category": "ai",
    "status": {
      "ko": "INTERNAL / UI DEMO",
      "en": "INTERNAL / UI DEMO"
    },
    "period": "2026.06 – 2026.07",
    "image": "assets/meeting.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "meeting/"
      }
    ],
    "stack": [
      "Python 백엔드",
      "faster-whisper large-v3 (CUDA)",
      "pyannote 3.1",
      "Claude API",
      "Notion API",
      "SMTP",
      "Docker Compose"
    ],
    "live": false,
    "problem": {
      "ko": "현재 RTX 4090에서 운영하는 사내 회의 어시스턴트. 공개 화면은 샘플 데이터 데모입니다.",
      "en": "An internal meeting assistant currently running on RTX 4090. The public interface is a sample-data demo."
    },
    "build": [],
    "limitations": {
      "ko": "상세 사례에서 검증 조건과 한계를 확인하세요.",
      "en": "See the case study for verification conditions and limitations."
    },
    "caseId": "meeting"
  },
  {
    "id": "dg",
    "title": "Design Gallery",
    "summary": {
      "ko": "유명 디자인을 코드로 배우는 갤러리 · 63개 데모 · KO/EN",
      "en": "63 dependency-free demos reproducing well-known interface designs in code — one file each, live preview beside its source, bilingual down to the text inside every demo."
    },
    "category": "web",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.07",
    "image": "assets/dg.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://hyunaeee.github.io/design-gallery/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/design-gallery"
      }
    ],
    "stack": [
      "HTML/CSS/JS (무의존)",
      "Three.js WebGL",
      "Higgsfield AI 에셋",
      "GitHub Pages"
    ],
    "live": true,
    "problem": {
      "ko": "스크린샷으로만 보는 디자인 레퍼런스가 아니라, 열어서 만져보고 복사해서 바로 쓰는 '살아있는 레퍼런스'가 필요했어요.",
      "en": "A design reference you can only look at in a screenshot is dead. I wanted a living one — open it, poke at it, copy it straight into your own project."
    },
    "build": [
      {
        "ko": "1데모 = 1파일 — 인라인 CSS/JS, 빌드 도구 없음. 어디든 복사해서 동작",
        "en": "One demo = one file — inline CSS/JS and no build tooling, so any demo runs wherever you paste it"
      },
      {
        "ko": "갤러리 뷰어 — 라이브 미리보기 + 소스 코드를 한 화면에서",
        "en": "Gallery viewer — live preview and source shown side by side"
      },
      {
        "ko": "이중언어 전파 — ?lang=en 파라미터가 데모 내부 텍스트까지 전환",
        "en": "Bilingual propagation — a `?lang=en` parameter switches the gallery chrome and the copy inside each demo"
      },
      {
        "ko": "AI 에셋 파이프라인 — Higgsfield 생성 → 배경 제거 → 경량화 → 데모 삽입",
        "en": "Asset pipeline — AI-generated imagery background-removed and size-optimized before it ships into a demo"
      }
    ],
    "limitations": {
      "ko": "빌드가 없는 구조라 데모 간 코드 재사용·컴포넌트화가 안 되고, 데모가 늘수록 관리 비용이 커집니다.",
      "en": "With no build step there is no component reuse between demos, and curation cost grows with the collection."
    }
  },
  {
    "id": "ppt",
    "title": "PPT Studio — AI Deck Builder",
    "summary": {
      "ko": "브랜드 디자인 시스템 기반 슬라이드 제작 · AI 슬라이드 생성 · PPTX/PDF 내보내기",
      "en": "Upload a document and Claude turns it into a deck through Structured Outputs, then it exports genuinely editable PPTX — vector text and shapes, not image snapshots."
    },
    "category": "ai",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.07",
    "image": "assets/ppt.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://hyunaeee.github.io/ppt-test/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/ppt-test"
      }
    ],
    "stack": [
      "Next.js 16",
      "React 19",
      "TypeScript 5",
      "Tailwind CSS 4",
      "Zustand",
      "Claude API",
      "pptxgenjs"
    ],
    "live": true,
    "problem": {
      "ko": "발표자료마다 디자인을 처음부터 다시 잡는 게 아까웠어요. 실제 브랜드의 디자인 시스템을 토큰으로 정리하면 클릭 한 번으로 덱 전체의 룩을 바꿀 수 있습니다.",
      "en": "Rebuilding slide design from scratch for every presentation is wasted work. Encode real brands' design systems as tokens, and one click restyles a whole deck."
    },
    "build": [
      {
        "ko": "디자인 시스템 엔진 — Apple·Stripe·Linear 등 35개 브랜드의 색·타이포·간격 토큰화",
        "en": "Design-system engine — color, type and spacing tokens for 35 brands (Apple, Stripe, Linear and others), swappable across the deck"
      },
      {
        "ko": "드래그앤드롭 에디터 — Zustand 스토어 기반 undo/redo·자동저장 캔버스",
        "en": "Drag-and-drop editor — a Zustand-backed canvas with undo/redo and autosave"
      },
      {
        "ko": "AI 변환 — PDF/DOCX 업로드 → Claude Structured Outputs로 슬라이드 JSON 생성, 자연어로 덱 수정",
        "en": "AI conversion — upload a PDF or DOCX and Claude emits slide structure via Structured Outputs (JSON Schema); the deck is then revisable in natural language (\"make this tighter\")"
      },
      {
        "ko": "진짜 내보내기 — pptxgenjs로 벡터 텍스트·도형 OOXML 생성 (PowerPoint에서 계속 편집 가능)",
        "en": "Real export — pptxgenjs writes vector text and shapes as OOXML, so the result keeps editing in PowerPoint instead of arriving as flat images"
      }
    ],
    "limitations": {
      "ko": "정적 데모는 API 키가 없어 AI 생성이 꺼져 있고(편집·테마·내보내기는 동작), 복잡한 PPTX 임포트는 일부 손실이 있습니다.",
      "en": "The static demo has no API key, so AI generation is disabled there (editing, theming and export all work). Complex PPTX imports lose some fidelity."
    }
  },
  {
    "id": "maeum",
    "title": "이불 안 마음친구",
    "summary": {
      "ko": "멘탈 케어 앱 · iOS/Android+웹 · 기획·디자인·개발 전부 직접 — 실제로 작동하는 에뮬레이터 제공",
      "en": "An emotional-support app for iOS, Android, and web. Independently planned, designed, and developed, with a working browser emulator."
    },
    "category": "app",
    "status": {
      "ko": "PRE-RELEASE",
      "en": "PRE-RELEASE"
    },
    "period": "2026.07",
    "image": "assets/sadout.jpg",
    "links": [
      {
        "label": {
          "ko": "에뮬레이터 ▶",
          "en": "Emulator ▶"
        },
        "url": "playground.html#phone"
      }
    ],
    "stack": [
      "HTML/CSS/JS (바닐라)",
      "PWA",
      "Capacitor (iOS/Android)",
      "Node.js 서버 (선택)"
    ],
    "live": false,
    "problem": {
      "ko": "힘든 밤, 판단하지 않고 들어주는 존재가 있으면 좋겠다는 생각에서 시작한 첫 엔드투엔드 앱 프로젝트입니다.",
      "en": "My first end-to-end app began with a simple idea: a companion that listens without judgment on difficult nights."
    },
    "build": [
      {
        "ko": "3플랫폼 아키텍처 — 웹 프론트 하나로 PWA + Capacitor iOS/Android 커버",
        "en": "Three platforms from one web frontend: a PWA plus Capacitor wrappers for iOS and Android."
      },
      {
        "ko": "서버리스 전환 — 런타임 설정(apiBaseUrl)으로 데모↔서버 연동 전환, 코어 루프는 전부 로컬 동작",
        "en": "A runtime apiBaseUrl setting switches between the standalone demo and a server connection. The core interaction loop runs locally."
      },
      {
        "ko": "감성 디자인 — 폰트·일러스트까지 직접 골라 만든 포근한 UI",
        "en": "A warm visual interface with individually selected typefaces and illustrations."
      }
    ],
    "limitations": {
      "ko": "스토어 배포 전이고, AI 대화 등 서버 의존 기능은 데모에서 제한됩니다.",
      "en": "Not yet released to app stores. Server-dependent features, including AI conversations, are limited in the demo."
    }
  },
  {
    "id": "hb",
    "title": "후방위 (HEARTBREAKER)",
    "summary": {
      "ko": "이별 후폭풍 방지 앱 · 연락 충동 진정·90일 회복 여정·AI 가상 대화 — 이것도 에뮬레이터에서 실제로 작동해요",
      "en": "A post-breakup support app with a calming timer, a 90-day recovery journey, and simulated AI conversations. Available as a working browser emulator."
    },
    "category": "app",
    "status": {
      "ko": "PRE-RELEASE",
      "en": "PRE-RELEASE"
    },
    "period": "2026.07",
    "image": "assets/hubangwi.jpg",
    "links": [
      {
        "label": {
          "ko": "에뮬레이터 ▶",
          "en": "Emulator ▶"
        },
        "url": "playground.html#hb"
      }
    ],
    "stack": [
      "Next.js (React 19)",
      "Tailwind CSS 4",
      "OpenAI API (서버)",
      "Capacitor 8",
      "Cloudflare Workers"
    ],
    "live": false,
    "problem": {
      "ko": "이별 직후의 충동적인 연락이 가장 큰 후회를 만듭니다. 그 순간을 붙잡아주는 도구를 만들었어요.",
      "en": "Impulsive contact after a breakup can lead to regret. I built a tool that helps users pause at that moment."
    },
    "build": [
      {
        "ko": "행동 개입 루프 — 90초 충동 진정 타이머, 술·새벽 연락 방지, 보내지 않는 편지",
        "en": "A pause-before-contact loop: a 90-second calming timer, interventions for late-night or intoxicated messaging, and unsent letters."
      },
      {
        "ko": "AI 가상 대화 — 작별·욕하고 비우기·재회 점검 3모드, 서버 API로 분리",
        "en": "Three AI conversation modes for saying goodbye, venting, and considering reconciliation, implemented through a separate server API."
      },
      {
        "ko": "오프라인 우선 — 단일 React 클라이언트 + localStorage라 서버 없이도 대부분 동작 (포폴 에뮬레이터가 그 증거)",
        "en": "Offline-first interactions: a single React client and localStorage keep most features usable without a server, as demonstrated in the portfolio emulator."
      },
      {
        "ko": "90일 회복 여정 — 단계별 미션과 진행률로 감정 정리를 구조화",
        "en": "A 90-day recovery journey organizes reflection through staged activities and progress tracking."
      }
    ],
    "limitations": {
      "ko": "배포 전이고, 번호 보호는 OS 수준 차단이 아닌 앱 내 개입입니다. 에뮬레이터의 AI 응답은 데모 답변이에요.",
      "en": "Not yet released. Contact protection is an in-app intervention, not an operating-system block. AI responses in the emulator are demo responses."
    }
  },
  {
    "id": "walkmate",
    "title": "워크메이트 (WALK-MATE)",
    "summary": {
      "ko": "테마별 서울 산책 코스 추천 · 3D 지도 위를 캐릭터가 실제 보행로 따라 걷는 프리뷰",
      "en": "Themed walking routes in Seoul, with a character preview that follows pedestrian paths on a 3D map."
    },
    "category": "app",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.07",
    "image": "assets/walkmate.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://hyunaeee.github.io/walk-mate/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/walk-mate"
      }
    ],
    "stack": [
      "Expo SDK 55",
      "React Native 0.83",
      "MapLibre GL JS 5",
      "Higgsfield 일러스트",
      "GitHub Pages"
    ],
    "live": true,
    "problem": {
      "ko": "지도 앱은 최단 경로만 알려주지만 산책에도 취향이 있어요. 테마와 시간을 고르면 코스를 추천받고, 걷기 전에 그 길을 미리 '걸어볼' 수 있게 했습니다.",
      "en": "A walk involves personal preferences as well as directions. Users choose a theme and time, receive a suggested route, and preview the walk before setting out."
    },
    "build": [
      {
        "ko": "3D 경로 프리뷰 — MapLibre GL 기울어진 지도에서 캐릭터가 보행로 좌표를 따라 걷고 카메라가 추적 (배속 x12~x48)",
        "en": "A 3D route preview on a tilted MapLibre GL map: the camera follows a character along pedestrian-path coordinates at 12x to 48x speed."
      },
      {
        "ko": "취향 온보딩 — 테마 8종 × 시간대 선택 → 맞춤 코스, 기기 저장",
        "en": "Preference onboarding combines eight themes with time-of-day choices to suggest routes, with preferences saved on the device."
      },
      {
        "ko": "퀘스트 게임화 — 코스마다 체크포인트 4~5개, 도착 토스트·포인트·완주 모달",
        "en": "Each route has four or five checkpoints, arrival notifications, points, and a completion dialog."
      },
      {
        "ko": "동화책 디자인 — '종이 위의 산책' 컨셉, Higgsfield 일러스트 8장",
        "en": "A storybook visual concept, 'a walk on paper,' using eight Higgsfield illustrations."
      }
    ],
    "limitations": {
      "ko": "코스가 서울 8개에 한정되고, 실제 걷기 GPS 트래킹은 아직 없습니다.",
      "en": "Currently limited to eight routes in Seoul. Live GPS tracking during a walk is not implemented."
    }
  },
  {
    "id": "tableon",
    "title": "TableON",
    "summary": {
      "ko": "주문·예약·CRM과 AI 분석 흐름을 보여주는 레스토랑 관리 데모.",
      "en": "A restaurant-management demo connecting orders, reservations, CRM, and AI analytics."
    },
    "category": "web",
    "status": {
      "ko": "UI DEMO",
      "en": "UI DEMO"
    },
    "period": "2026.07",
    "image": "assets/tableon.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "tableon/"
      }
    ],
    "stack": [
      "HTML/CSS/JS",
      "SVG 차트",
      "Claude API",
      "인브라우저 API 시뮬레이터",
      "GitHub Pages"
    ],
    "live": false,
    "problem": {
      "ko": "식당 사장님들이 주문·예약·고객·급여를 제각각의 도구로 관리하는 걸 보고, 올인원에 AI 경영 분석까지 얹은 구독형 SaaS를 설계했습니다.",
      "en": "Restaurant owners juggle separate tools for orders, reservations, customers and payroll. TableON puts them in one subscription with an AI business analyst on top."
    },
    "build": [
      {
        "ko": "인브라우저 시뮬레이터 — 가상 데이터 위에서 전 기능이 실제로 동작하는 데모",
        "en": "In-browser simulator — the demo runs every feature on generated data, no backend required"
      },
      {
        "ko": "RFM CRM — 자동 세그먼트(VIP·이탈 위험 단골 등), 방문 주기 기반 '다시 부를 고객' 감지",
        "en": "RFM CRM — automatic segments (VIP, at-risk regulars, sleeping customers) and 'customers to call back' detection from visit cadence"
      },
      {
        "ko": "가게별 AI — 2분 온보딩 인터뷰 + 데이터 요약으로 시스템 프롬프트 생성 → 일반론이 아닌 우리 가게 기준 답변",
        "en": "Per-store AI — an onboarding interview plus an automatic data summary compile into a store-specific system prompt, so Claude answers from this store's reality, not generalities"
      },
      {
        "ko": "운영 자동화 — 생일 쿠폰·문자 자동 발송, 월급 자동 정산, 역할 3단계 권한",
        "en": "Ops automation — birthday coupons and SMS, payroll settlement from clock-in records, 3-tier role permissions"
      }
    ],
    "limitations": {
      "ko": "데모는 새로고침 시 초기화되고, 실제 결제·문자 발송은 연동 키가 필요합니다.",
      "en": "The demo resets on refresh; real payments/SMS need integration keys."
    }
  },
  {
    "id": "dailybook",
    "title": "하루 한 장 (DAILY BOOK)",
    "summary": {
      "ko": "일기를 모아 한 권의 책으로 만드는 웹앱 · Google 로그인/게스트",
      "en": "A web app that gathers diary entries into a book, with Google sign-in and guest access."
    },
    "category": "web",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.01",
    "image": "assets/dailybook.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://daily-book-bce82.web.app/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/daily-book"
      }
    ],
    "stack": [
      "React",
      "Vite",
      "Firebase Auth",
      "Firestore",
      "Firebase Hosting"
    ],
    "live": true,
    "problem": {
      "ko": "흩어져 사라지는 하루의 기록을 모아 '한 권의 책'이라는 물성으로 돌려주고 싶었어요.",
      "en": "I wanted scattered daily records to become a coherent collection, with the tangible feeling of a book."
    },
    "build": [
      {
        "ko": "기록 → 책 메타포 — 일기가 쌓이면 책 형태 뷰로 엮이는 UI",
        "en": "An entry-to-book interface assembles accumulated diary entries into a book-shaped view."
      },
      {
        "ko": "Firebase 풀스택 — Auth(Google/게스트) + Firestore + Hosting",
        "en": "A Firebase stack combining Google and guest authentication, Firestore storage, and Hosting."
      }
    ],
    "limitations": {
      "ko": "PDF·실물 인쇄 내보내기와 검색·태그가 아직 없습니다.",
      "en": "PDF or physical-print export, search, and tags are not yet implemented."
    }
  },
  {
    "id": "factory",
    "title": "Factory Studio",
    "summary": {
      "ko": "대본·워크오더·영상 생성·조립을 연결하는 로컬 제작 도구.",
      "en": "A local production tool connecting scripts, work orders, generation, and assembly."
    },
    "category": "ai",
    "status": {
      "ko": "PRIVATE / LOCAL TOOL",
      "en": "PRIVATE / LOCAL TOOL"
    },
    "period": "2026.08",
    "image": "assets/automation.jpg",
    "links": [],
    "stack": [
      "Python (표준 라이브러리 위주)",
      "ffmpeg",
      "Higgsfield API",
      "단일 파일 UI (ko/en/ja)",
      "로컬 큐 러너"
    ],
    "live": false,
    "problem": {
      "ko": "숏드라마·지식쇼츠·광고를 만들 때마다 프롬프트를 처음부터 다시 짜고 있었어요. 매체와 템플릿만 갈아 끼우면 같은 구조로 도는 '공장'을 만들면 그 반복이 사라집니다.",
      "en": "Every short drama, explainer or ad meant writing prompts from scratch again. Encode the structure once as a work order, and the medium and template become parameters instead of a rewrite."
    },
    "build": [
      {
        "ko": "워크오더 컴파일러 — 스펙 JSON → 샷그룹별 프롬프트 전문. 표준 라이브러리만 써서 단독 임포트 가능",
        "en": "Work-order compiler — a spec JSON becomes per-shot-group prompt text; standard library only, so it imports and runs standalone"
      },
      {
        "ko": "대본 생성 — 한 줄/주제에서 기승전결 아크와 관통 소품을 잡고 발화 예산을 자동으로 맞춤",
        "en": "Script generation — a one-line premise expands into a four-act arc with a recurring prop, and the dialogue budget is fitted to the shot length automatically"
      },
      {
        "ko": "병렬 생성 + 리트라이 래더 — 웨이브 단위로 생성하고, 실패하면 재제출 → 완곡화 순으로 자동 승급",
        "en": "Parallel waves with a retry ladder — shots generate in waves; a rejected shot is resubmitted, then softened, before it is allowed to fail"
      },
      {
        "ko": "재개 설계 — manifest가 job_id를 폴링 전에 기록해서 재시작해도 이어서 진행 (중복 과금 차단)",
        "en": "Idempotent resume — the manifest records each job_id before polling, so an interrupted run continues instead of paying twice"
      },
      {
        "ko": "조립·영수증 — concat + 산술 SRT + 그룹별 실측 길이와 리트라이 내역이 담긴 assembly.json",
        "en": "Assembly and receipt — concat, arithmetic SRT, and an assembly.json carrying measured per-group durations and the full retry history"
      }
    ],
    "limitations": {
      "ko": "영상 생성 단계는 외부 API 로그인·크레딧이 필요해서 공개 배포하지 않았습니다. 로컬에서 python studio/server.py 로 띄웁니다.",
      "en": "Generation needs an authenticated external API with credits, so this one is not publicly deployed. It runs locally against a queue runner."
    }
  },
  {
    "id": "realty",
    "title": "Seoul Property Analysis System",
    "summary": {
      "ko": "지도 위 실거래가 · 동네 추천 · 대출·세금 자금 계획 · 갈아타기 시나리오 · 재개발 뉴스 시그널 · 규제 모니터링",
      "en": "Transaction prices on a live map, neighbourhood search by local nickname, and a financing engine that turns cash + salary into an LTV/DSR loan ceiling, acquisition tax and the cash you actually need — plus redevelopment news signals and regulation monitoring."
    },
    "category": "web",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.08",
    "image": "assets/realty.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://real-property-checking-system.vercel.app/"
      }
    ],
    "stack": [
      "FastAPI",
      "Leaflet 지도 SPA",
      "국토부 실거래가 API",
      "카카오 지오코딩",
      "Vercel 서버리스(Python/ASGI)"
    ],
    "live": true,
    "problem": {
      "ko": "집을 알아볼 때 실거래가, 동네 평판, 대출 한도, 세금, 규제를 전부 다른 사이트에서 찾아야 했습니다. 지도 한 화면에서 '내 자금으로 여기를 살 수 있는가'까지 답이 나오게 만들었습니다.",
      "en": "Looking for a flat meant checking transaction prices, neighbourhood reputation, loan limits, tax and regulation on five different sites. This puts them on one map and answers the question that actually matters: can I buy here with what I have?"
    },
    "build": [
      {
        "ko": "매물 수집 — 아파트·연립다세대·단독다가구 실거래가 API를 유형별로 호출하고, 오피스텔·도시형생활주택은 제외 규칙으로 걸러냅니다",
        "en": "Listing pipeline — apartments, row houses and detached houses come from three separate government APIs; officetels and urban-living housing are excluded by rule and reported as a filtered count"
      },
      {
        "ko": "동네 검색 — 별칭(망리단길 등) → 법정동 이름 매칭 → OSM 지오코딩 후 최근접 법정동 스냅 순으로 해석",
        "en": "Neighbourhood search — resolves a query through local nicknames, then legal dong names, then OSM geocoding snapped to the nearest legal dong"
      },
      {
        "ko": "자금 계획 엔진 — 보유현금·연봉(부부합산)·생애최초·출산 여부로 LTV·DSR·절대한도 대출 가능액을 추정하고, 취득세 감면과 중개보수를 반영해 실제 필요 현금을 산출",
        "en": "Financing engine — cash, household salary, first-time-buyer and childbirth status produce an LTV/DSR/absolute-cap loan estimate, then acquisition-tax relief and broker fees give the real cash requirement"
      },
      {
        "ko": "역세권 계산 — 매물과 최근접 역의 하버사인 거리를 도보 67m/분으로 환산해 800m 이내를 역세권으로 표시",
        "en": "Transit proximity — haversine distance to the nearest station converted at 67 m per walking minute, flagged within 800 m"
      },
      {
        "ko": "뉴스 시그널 — 구글 뉴스 RSS를 크롤링해 호재·악재 키워드 가중치로 상승·하락 시그널을 내고, 규제 뉴스는 별도로 변경을 감지",
        "en": "News signals — Google News RSS crawled and weighted by positive/negative keywords, with regulation news monitored separately for change"
      }
    ],
    "limitations": {
      "ko": "실거래가 API가 좌표를 주지 않아 지도 마커는 단지별 근사 위치입니다. 뉴스 시그널은 기사 제목 키워드 기반 참고 지표이고 투자 자문이 아닙니다. 규제 정보는 작성 시점 기준이며, 서버리스라 지오코딩 캐시는 인스턴스 메모리에만 유지됩니다.",
      "en": "The transaction API returns no coordinates, so map markers are approximate per complex. News signals are a keyword-based reference, not investment advice, and regulation data is point-in-time. On serverless the geocoding cache lives only in instance memory."
    }
  },
  {
    "id": "studybrief",
    "title": "Daily Study Briefing",
    "summary": {
      "ko": "CS·마케팅·AI를 매일 아침 자동으로 큐레이션하는 학습 포털 · 퀴즈·마인드맵·잔디·복습",
      "en": "A learning portal that rewrites itself every morning — three concepts, AI news and papers — then holds on to them with quizzes, mind maps and a review queue built from the questions you got wrong. No backend, no external API."
    },
    "category": "web",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.08",
    "image": "assets/studybrief.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://hyunaeee.github.io/daily-study-briefing/"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/daily-study-briefing"
      }
    ],
    "stack": [
      "순수 정적 HTML/JS/JSON",
      "GitHub Pages",
      "Claude CLI 배치",
      "localStorage",
      "SVG"
    ],
    "live": true,
    "problem": {
      "ko": "매일 뭘 공부할지 찾는 데 시간을 다 썼어요. '오늘 볼 것'을 대신 정해주고, 본 걸 잊지 않게 붙잡아주는 개인 포털이 필요했습니다.",
      "en": "Deciding what to study was eating the time meant for studying. I wanted something that picks the day's material for me and then makes sure I do not lose it a week later."
    },
    "build": [
      {
        "ko": "무인 갱신 — 로컬 PC의 Claude CLI가 새 콘텐츠 JSON을 만들어 push → GitHub Pages 자동 재배포",
        "en": "Unattended refresh — a scheduled Claude CLI run on my own machine writes the day's JSON, pushes, and GitHub Pages redeploys itself"
      },
      {
        "ko": "학습 루프 — 딥다이브 → SVG 마인드맵 → 4문제 퀴즈(채점·해설) → 틀린 문제 자동 수집 → 복습 모드",
        "en": "Learning loop — deep dive, SVG mind map, then a four-question quiz with explanations; missed questions are collected into a review mode that drops them once answered correctly"
      },
      {
        "ko": "지속 장치 — 학습 스트릭·평균 정답률·GitHub식 잔디 20주 그래프, 전부 localStorage",
        "en": "Adherence mechanics — study streak, running accuracy and a GitHub-style 20-week contribution grid, all in localStorage"
      },
      {
        "ko": "포털 UX — 지난 날짜 전체 검색, 학습 달력, 보관함(☆ 저장), 키워드 랭킹, 해시 라우팅 딥링크",
        "en": "Portal UX — full-archive search, a study calendar, a starred library, keyword ranking, and hash routing so any concept is a deep link"
      }
    ],
    "limitations": {
      "ko": "진도가 브라우저 localStorage에만 남아서 기기를 옮기면 초기화되고, 갱신은 제 PC가 켜져 있어야 돕니다.",
      "en": "Progress lives only in browser localStorage, so it does not follow you across devices, and the refresh depends on my machine being awake."
    }
  },
  {
    "id": "universe",
    "title": "Universe — 3D Solar System",
    "summary": {
      "ko": "실제 천문 데이터로 도는 3D 태양계 · 날짜 달력·조종석 비행·138억 년 탄생 시네마",
      "en": "Pick any date between year 1 and 9999 and the planets move to where they actually were, computed from J2000 elements. Then fly it from a cockpit, or watch 13.8 billion years replay as a cinema."
    },
    "category": "play",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.08",
    "image": "assets/universe.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://universe-sample.vercel.app"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/universe-sample"
      }
    ],
    "stack": [
      "Three.js r128",
      "GLSL 셰이더",
      "바닐라 JS 단일 모듈",
      "WebAudio",
      "Vercel"
    ],
    "live": true,
    "problem": {
      "ko": "천문 시뮬레이터는 대개 '정확하지만 지루하거나', '예쁘지만 데이터가 없거나' 둘 중 하나였어요. 실제 궤도 계산 위를 직접 날아다닐 수 있는 우주를 만들고 싶었습니다.",
      "en": "Astronomy simulators tend to be either accurate and inert, or beautiful and empty. I wanted real orbital computation you are allowed to fly through."
    },
    "build": [
      {
        "ko": "J2000 역기점 계산 — 평균 황경 + 실측 공전 주기로 임의 날짜의 행성 배치 산출 (원 궤도 근사)",
        "en": "J2000 epoch math — mean longitude plus measured orbital periods gives the configuration for an arbitrary date (circular-orbit approximation)"
      },
      {
        "ko": "실측 물리 — 자전 주기·자전축 기울기 반영, 금성·천왕성·명왕성은 IAU 기준으로 역행 자전",
        "en": "Measured physics — rotation periods and axial tilts are real values; Venus, Uranus and Pluto spin retrograde under the IAU convention"
      },
      {
        "ko": "위성 좌표계 보정 — 1/T_rel = 1/T_moon − 1/T_planet 로 모행성 기준 실제 공전 주기 재현",
        "en": "Moon frame correction — 1/T_rel = 1/T_moon − 1/T_planet, so satellites orbit at their true period in the parent's frame"
      },
      {
        "ko": "조종석 비행 — 추력·롤·자동 항법(장애물 회피)·레이더·WebAudio 엔진음, 충돌 판정과 폭발 연출",
        "en": "Cockpit flight — thrust, roll, auto-navigation with obstacle avoidance, radar, a WebAudio engine, and collision handling that tells you what you hit"
      },
      {
        "ko": "탄생 시네마 — 빅뱅 화이트아웃부터 오늘까지 9단계, 파티클 4,500개 + 지구 텍스처 3장 크로스페이드",
        "en": "Genesis cinema — nine stages from a Big Bang whiteout to today, with 4,500 particles and three cross-faded Earth textures"
      }
    ],
    "limitations": {
      "ko": "크기·거리 비율은 교육용으로 과장돼 있고(실제 비율이면 화면에 아무것도 안 보여요), 원 궤도 근사라 실제 천체력과 수 도 차이가 납니다.",
      "en": "Sizes and distances are exaggerated for legibility (at true scale the screen is empty), and the circular-orbit approximation drifts a few degrees from a real ephemeris."
    }
  },
  {
    "id": "sajumob",
    "title": "천기연 天機緣",
    "summary": {
      "ko": "신녀 연화의 AI 사주 풀이 · 만세력·진태양시 보정·대운·신살 — 고민 맞춤 해석",
      "en": "Character-led AI saju readings with traditional calendar calculations, true-solar-time correction, fortune cycles, and symbolic influences, tailored to the user's questions."
    },
    "category": "ai",
    "status": {
      "ko": "LIVE",
      "en": "LIVE"
    },
    "period": "2026.07",
    "image": "assets/cheongiyeon.jpg",
    "links": [
      {
        "label": "LIVE ↗",
        "url": "https://saju-ai-mobile-demo.vercel.app"
      },
      {
        "label": "GITHUB ↗",
        "url": "https://github.com/hyunaeee/saju-ai-mobile"
      }
    ],
    "stack": [
      "HTML/CSS/JS (바닐라)",
      "자체 만세력·사주 엔진",
      "Claude API",
      "Vercel Functions"
    ],
    "live": true,
    "problem": {
      "ko": "사주 서비스 대부분이 생년월일만 받아 누구에게나 비슷한 결과를 줍니다. 절기·시각·태어난 지역까지 제대로 계산하는 '진짜' 사주 풀이를 만들고 싶었어요.",
      "en": "I wanted to move beyond generic birth-date readings by incorporating seasonal solar terms, birth time, and birthplace into the traditional saju calculations."
    },
    "build": [
      {
        "ko": "계산 엔진 — 절기 기준 만세력으로 연주·월주, 60갑자 일주 산출 (lunar.js·saju.js)",
        "en": "The calculation engine derives year and month pillars from solar terms and the day pillar from the 60-part cycle, using lunar.js and saju.js."
      },
      {
        "ko": "진태양시 보정 — 출생지 경도로 시간 보정, 같은 날 태어나도 결과가 달라짐",
        "en": "True-solar-time correction adjusts birth time using birthplace longitude, allowing different calculations for people born on the same date."
      },
      {
        "ko": "AI 해석 — 계산 결과 + 사용자의 고민을 Claude(Vercel 서버리스)에 넘겨 맞춤 풀이",
        "en": "Calculated results and the user's questions are sent to Claude through Vercel serverless functions for a tailored interpretation."
      },
      {
        "ko": "신녀 연화 UX — 캐릭터 몰입형 모바일 인터페이스",
        "en": "An immersive mobile interface guided by the character Yeonhwa."
      }
    ],
    "limitations": {
      "ko": "데모라 실제 결제는 없고 후기는 샘플입니다 (실서비스 모드는 결제 연동 후 전환).",
      "en": "The demo has no real payments, and reviews are samples. A live-service mode requires payment integration."
    }
  },
  {
    "id": "legal",
    "title": "Legal PDF RAG",
    "period": "2025.06–2026.07",
    "summary": {
      "ko": "법률 PDF 검색과 근거 인용을 연결한 RAG 챗봇.",
      "en": "A legal PDF chatbot with document retrieval and evidence citations."
    },
    "category": "ai",
    "status": {
      "ko": "CODE",
      "en": "CODE"
    },
    "live": false,
    "stack": [
      "Python",
      "LangChain",
      "Chroma"
    ],
    "links": [
      {
        "label": "GitHub",
        "url": "https://github.com/hyunaeee/legal-pdf-rag-chatbot"
      }
    ],
    "build": [],
    "limitations": {
      "ko": "공개 코드는 학습·제품 실험 범위입니다.",
      "en": "Public code documents a learning and product experiment."
    }
  },
  {
    "id": "higgs",
    "title": "HiggsMCP",
    "period": "2026.07",
    "summary": {
      "ko": "이미지·영상 생성과 게시 모듈을 연결하는 콘텐츠 자동화 실험.",
      "en": "A content automation experiment connecting generation and publishing modules."
    },
    "category": "ai",
    "status": {
      "ko": "CODE / EXPERIMENT",
      "en": "CODE / EXPERIMENT"
    },
    "live": false,
    "stack": [
      "Python",
      "FastAPI",
      "Docker",
      "MCP"
    ],
    "links": [
      {
        "label": "GitHub",
        "url": "https://github.com/hyunaeee/higgsMCP"
      }
    ],
    "build": [],
    "limitations": {
      "ko": "공개 scheduler의 일부 게시 호출은 미연결 상태입니다. 완전 무인 운영을 입증하지 않습니다.",
      "en": "Some scheduler publishing calls are not connected. Fully unattended operation is not established."
    }
  }
]);
