# RoboSkill Lab

**자연어 작업 지시 → 실행 가능한 작업 명세 → MuJoCo 로봇 제어 → 실패 복구 → 반복 평가.**

로봇 AI 엔지니어 지원을 위한 개인 프로젝트의 첫 실행 버전입니다. 현재는 **3축 직교 로봇으로 블록을 목표 지점까지 미는 물리 시뮬레이션과 제어 전략 비교**를 구현했습니다. 기존 VisionEye의 비전·서빙, MED-RAG의 평가, Agent Orchestra의 작업 실행 경험을 로봇 분야로 확장합니다.

## 바로 보기

- [실제 실행 요약](artifacts/latest/SUMMARY.md) · [원본 궤적과 환경 기록](artifacts/latest/report.json)
- [실제 MuJoCo 렌더 재생](artifacts/latest/replay.gif): 외란 후 복구, seed 0의 저장된 관절 상태로 렌더했습니다.
- [실행 기록 뷰어](viewer/index.html): HTTP 서버로 열면 자동으로 실행 기록을 읽습니다.
- [직무 연결·공식 채용 근거](docs/CAREER_FIT.md)

뷰어는 저장한 MuJoCo 궤적의 **2D 재생**입니다. 물리 계산은 Python/MuJoCo에서 수행합니다.

## 실행

Python 3.12에서 검증했습니다. 이 폴더에서 실행합니다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m roboskill run --instruction "빨간 블록을 오른쪽 목표로 밀어줘" --scenario disturbance --render --out artifacts/my-run
.\.venv\Scripts\python.exe -m roboskill benchmark --seeds 3 --out artifacts/my-benchmark
.\.venv\Scripts\python.exe -m http.server 8766 --bind 127.0.0.1
```

[로컬 뷰어](http://127.0.0.1:8766/viewer/)에서 `report.json`을 직접 불러와 다른 실행도 비교할 수 있습니다. 기본 화면은 저장소의 `artifacts/latest/report.json`을 읽습니다. 출력 폴더가 이미 있으면 덮어쓰지 않고 오류를 반환하므로 새 이름을 사용합니다. `--render`는 실제 MuJoCo PNG와 GIF를 만듭니다. OpenGL이 필요하며, 렌더 없이도 물리 실험과 JSON 저장이 가능합니다.

### 로컬 LLM 연결

이미 설치·실행한 Ollama와 모델이 있을 때만 선택합니다. 모델 이름을 본인의 설치 모델로 바꾸세요.

```powershell
.\.venv\Scripts\python.exe -m roboskill run --ollama-model YOUR_INSTALLED_MODEL --instruction "빨간 블록을 오른쪽 목표로 밀어줘" --out artifacts/llm-run
```

이 경로는 구조화된 JSON으로 `push / object / goal`을 받습니다. 로컬 검증이 통과한 목표만 제어기에 전달하며, 좌표와 모터 명령은 로컬 코드에서 결정합니다. 모델 다운로드는 수행하지 않습니다. 기본 실행과 공개 benchmark는 **규칙 파서**를 사용합니다. Ollama 연결 코드는 오류·응답 계약을 테스트했으며 **실제 LLM 추론 품질은 아직 측정하지 않았습니다.**

규칙 파서 예시:

```text
빨간 블록을 오른쪽 목표로 밀어줘
파란 블록을 왼쪽 목표로 밀어줘
빨간 블록을 가운데 목표로 밀어줘
push the blue block to the left goal
```

규칙 파서는 문법에 맞지 않는 지시를 거부합니다. 자유로운 자연어 이해 성능으로 해석하지 않습니다.

## 구현 구조

```text
instruction
  └─ planner.py     규칙 파서 / 선택적 Ollama → 검증된 TaskSpec
       └─ simulation.py   위치 관측 → 접근·내리기·밀기·들기 → 재관측
            └─ scene.xml  MuJoCo 500 Hz, 위치 액추에이터, 접촉·마찰·중력
                 └─ report.json   사건, 관절 상태, 궤적, 성공 판정, 코드 hash
                      └─ viewer/   정책·시나리오별 측정과 재생
```

블록은 초기화 이후 위치를 직접 대입해 옮기지 않습니다. 제어기는 로봇의 위치 액추에이터 목표만 쓰고, 블록은 물리 접촉으로 움직입니다. 외란 실험은 블록에 1.2 N의 x 방향 힘을 0.10초 가합니다. GIF 재생 렌더에서만 기록된 관절 상태를 복원합니다.

## 평가 설계

| 항목 | 정의 |
|---|---|
| 과제 | 빨간/파란 블록을 지정한 목표 지점으로 밀기 |
| 환경 | 기본, 낮은 마찰, 무거운 블록, 외력 적용의 4조건 |
| 초기 위치 | seed로 ±2.5 cm 변화. 두 정책에 동일한 seed 사용 |
| open_loop | 초기 관측에서 한 번 정한 전체 밀기 경로 실행 |
| closed_loop | 최대 9.5 cm씩 밀고, 다시 관찰·접근해 경로 수정 |
| 성공 | 목표 중심 거리 <4.5 cm, 선속도 <2.5 cm/s, 각속도 <0.5 rad/s를 0.3초 유지 |
| 추가 성공 조건 | 비표적 블록 이동 <4 cm, 작업 영역 이탈 없음, 24초 예산 안에 완료 |
| 기록 | 성공, 최종 거리, 시뮬레이션/실행 시간, 재계획, 비표적 접촉, 힘, 전체 궤적 |

두 전략은 관측 횟수뿐 아니라 밀기 구간과 재접근 횟수도 다릅니다. **두 제어 전략의 성능·시간 비교**이며 관측만의 인과 효과를 분리한 실험은 아닙니다. 성공은 무충돌과 다릅니다. `unintended_contact_steps`와 `distractor_displacement_m`을 함께 확인합니다. `peak_contact_point_force_n`은 개별 접촉점 최대 힘입니다.

현재 기본 결과는 4조건 × 3 seed × 2정책의 **24회 개발 실험**입니다. 조건과 seed가 개발 중에도 사용되므로 독립 평가셋은 아닙니다. 후속 학습 모델은 개발·검증·최종 평가 seed를 따로 고정해야 합니다.

## 지금 구현한 것과 다음 단계

| 단계 | 상태 | 채용 때 보여줄 증거 |
|---|---|---|
| 물리 환경·접촉 제어·복구·계측 | 실행 검증 | MJCF, 실제 궤적, 정책 비교, 실패 사례 |
| 한국어/영어 규칙 지시 → 작업 명세 | 실행 검증 | 모호한 요청 거부, 고정 스킬 계약 |
| 로컬 LLM → 검증된 작업 명세 | 연결 코드·계약 테스트, 모델 추론 미실행 | 이후 지시 평가셋과 실제 모델 출력 |
| 카메라 RGB → 물체 위치 추정 | 다음 개발 | VisionEye 경험을 연결, 좌표 oracle과 비교 |
| 데모 수집 → 모방학습 정책 | 후속 실험 | 학습/평가 분리, 행동 성공률, 실패 분포 |
| 6축 로봇팔·집기·실물 이전 | 범위 확장 | 로봇 모델·제어·실물 검증을 따로 수행 |

**현재는 학습된 로봇 정책, VLA, 강화학습, 카메라 비전, 실물 로봇의 성능을 주장하지 않습니다.** 이 버전은 그 실험을 평가할 실행 기반입니다.

### 다음 2주 제안

1. **1–3일:** 카메라 RGB 관측과 물체 위치 추정. 정답 좌표와 추정 좌표 차이를 기록하고 가림·조명 조건 추가.
2. **4–6일:** 로컬 LLM 작업 계획 실행. 정상·모호·거부 지시 평가셋을 분리하고 잘못된 스킬 선택을 측정.
3. **7–10일:** 전문가 궤적 수집 후 모방학습 정책 구현. 고정된 시간 예산에서 규칙 기반 제어기와 비교.
4. **11–14일:** 독립 seed·마찰·질량 조건 평가, 실패 분석, 90초 실제 실행 데모, 한·영 사례 문서 정리.

## 검증

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

규칙 파서·모델 응답 검증과 실제 MuJoCo 동작을 확인합니다. 로컬에서 자동화 도구의 도움으로 구현·실행한 개인 실험이며, 로봇 기업의 운영 실적이나 독립 연구 성과를 뜻하지 않습니다.

## 근거

- [MuJoCo Python 공식 문서](https://mujoco.readthedocs.io/en/stable/python.html)
- [MuJoCo 모델 XML 공식 문서](https://mujoco.readthedocs.io/en/stable/XMLreference.html)
- [Ollama 구조화 출력](https://docs.ollama.com/capabilities/structured-outputs)
- [지원 직무와 기존 포트폴리오 연결](docs/CAREER_FIT.md)
