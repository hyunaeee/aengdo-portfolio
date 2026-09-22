# MotionCheck v2: ordered motion verification and simulated arm tracking

작성·출처 확인: 2026-09-22. **실험 설계 문서이며 결과 보고서가 아니다.** 아래 제안 중 실제 채택한 값은 실행 전에 별도 설정·라벨 manifest로 고정하고, 실제 구현과 다른 항목은 결과 보고서에 명시한다. 이 파일만 작성했다고 사전등록이나 독립 평가가 완료되는 것은 아니다.

## 1. 질문과 주장 범위

두 질문을 독립적으로 평가한다.

1. 영상: 기준 동작의 필수 단계가 후보 영상에서 올바른 순서와 충분한 유지 시간으로 관측되는가? v1 DTW가 놓친 생략·순서 변경·정지를 v2가 줄이는가?
2. 제어: 영상에서 추출한 상체 목표각을 고정 베이스의 4개 hinge 관절 모형이 실제 동역학으로 추종하는가? 같은 feedforward 토크에 encoder 기반 PD 보정을 추가했을 때, 동일한 교란 조건에서 추종 오차와 실패가 줄어드는가?

영상 판정 성공이 로봇 제어 성공을 뜻하지 않으며, 시뮬레이터 encoder 성공이 카메라 기반 실시간 폐루프 제어를 검증하지 않는다. 이번 설계는 전신 균형, 보행, 접촉 조작, 실제 로봇 배포, sim-to-real, DeepMimic/AMP 정책 학습을 포함하지 않는다. 구현한 범위는 **영상 지각·순서 평가 + 단순 상체 모형의 토크 제어 실험**으로 표현한다.

## 2. 근거가 되는 7개 1차 자료

아래 연결은 설계 근거다. 해당 논문의 학습 코드·가중치를 실행한 비교 실험이라는 뜻이 아니다. 문헌 정보와 공개 상태는 [v2_sources.json](v2_sources.json)에 기록한다.

| 자료 | 확인한 내용 | 이번 설계에 가져오는 점과 경계 |
|---|---|---|
| [Dwibedi et al., Temporal Cycle-Consistency Learning, CVPR 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Dwibedi_Temporal_Cycle-Consistency_Learning_CVPR_2019_paper.html) | 자기지도 학습으로 영상 간 프레임 대응과 단계 표현을 학습한다. | 시간 대응은 유용하지만 대응 비용만으로 명령 준수를 증명할 수 없다. 우리는 TCC 가중치를 재현하지 않는다. |
| [Haresh et al., Learning by Aligning Videos in Time, CVPR 2021](https://openaccess.thecvf.com/content/CVPR2021/papers/Haresh_Learning_by_Aligning_Videos_in_Time_CVPR_2021_paper.pdf) | Soft-DTW 정렬 손실과 시간적 정규화로 표현을 학습한다. | 정렬과 시간적 구별을 함께 고려한다는 근거다. 학습 손실의 퇴화 현상과 이번 추론 시 단계 생략 문제는 동일한 실험 결과가 아니다. |
| [Xu et al., FineDiving, CVPR 2022](https://openaccess.thecvf.com/content/CVPR2022/html/Xu_FineDiving_A_Fine-Grained_Dataset_for_Procedure-Aware_Action_Quality_Assessment_CVPR_2022_paper.html) | 다이빙을 연속 세부 단계로 나누어 exemplar와 비교하는 품질 평가를 제안한다. | 단계별 오류를 공개하는 근거다. 종목별 점수 회귀 모델을 일반 춤의 합격 판정기로 취급하지 않는다. |
| [Peddi et al., CaptainCook4D, NeurIPS 2024 Datasets and Benchmarks](https://captaincook4d.github.io/captain-cook/) | 실제 조리 영상에서 지시를 따르는 수행과 오류 수행을 구분하고 단계·오류를 주석화한다. | 동작 종류 인식과 절차 준수 평가를 구분한다. 조리의 물체·결과 오류는 관절만으로 판정할 수 없으므로 이 데이터셋 성능을 주장하지 않는다. |
| [Peng et al., DeepMimic, ACM TOG/SIGGRAPH 2018](https://xbpeng.github.io/projects/DeepMimic/) | 기준 모션의 모방과 과제 목표를 결합한 강화학습 기반 물리 제어다. | 실제 상태의 추종 오차와 교란 회복을 측정할 동기다. 고정 베이스 PD 제어는 해당 강화학습 방법을 재현한 것이 아니다. |
| [Peng et al., AMP, ACM TOG/SIGGRAPH 2021](https://xbpeng.github.io/projects/AMP/) | 비정렬 모션 데이터로 adversarial motion prior를 학습해 동작 스타일 보상을 구성한다. | 자연스러운 동작 분포와 지정된 단계 순서의 준수는 다른 목표다. 우리는 discriminator·policy를 학습하지 않는다. |
| [MuJoCo 공식 XML Reference](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-motor), [actuation model](https://mujoco.readthedocs.io/en/stable/computation/index.html#actuation-model) | actuator 종류, 힘·입력 제한, 동역학 실행 인터페이스를 정의한다. | 실제 설치 버전·XML·gear·제한을 기록한다. motor 입력 토크와 결과 qpos를 구분하며, qpos를 매 스텝 목표로 대입한 재생을 제어 성능으로 보고하지 않는다. |

공개 실행 상태: TCC/LAV는 공식 코드가 있지만 이 프로젝트에서 학습된 춤 판정기를 실행하지 않는다. FineDiving 공식 README는 데이터 신청과 학습 후 checkpoint 평가 과정을 안내한다. DeepMimic의 구 저장소는 deprecated로 표시되며 저자들이 연결한 [MimicKit](https://github.com/xbpeng/MimicKit)은 구현과 사전학습 모델 실행 지침을 제공한다. 이 v2에서는 다운로드·학습·실행을 하지 않았으며, 현재 Windows/MuJoCo 환경에서 해당 정책이 실행됐다고 주장하지 않는다.

## 3. 개발 자료와 독립 평가 자료

| 구분 | 허용되는 용도 | 보고할 수 있는 결론 |
|---|---|---|
| 기존 v1의 21개 비교와 그 원본·파생 영상 | v2 규칙, 특징, 단계, 임계값을 개발·수정 | 알려진 실패를 대상으로 한 회귀 실험. 독립 test 성능이 아니다. |
| 새 사람 영상: 개발과 다른 원본·수행자·촬영 세션 | 설정과 라벨 고정 후 한 번 평가 | 해당 독립 원본에서의 결과. 한 사람/한 영상이면 모집단 일반화가 아니다. |
| 새 사람 영상에서 생성한 순서·속도·생략 변형 | 고정된 변형 규칙의 진단 | 새 원본에 대한 통제 실험. 변형 개수를 독립 사람 수로 세지 않는다. |
| 시뮬레이션 개발 seed/조건 | gain·필터·토크 한계·성공 기준 조정 | 개발 성능 |
| 시뮬레이션 보류 seed/조건 | 제어기 고정 후 쌍 비교 | 이 모형과 명시한 조건 분포에서의 결과. 새 사람·새 로봇·현실 일반화가 아니다. |

새 사람 영상의 선택 담당자는 알고리즘 출력을 보지 않고, 사전에 정한 가시성·길이·전신 포함·기준과의 과제 일치·재사용 허가 조건으로 선정한다. 선정·제외된 모든 원본과 이유를 남긴다. 편한 사례만 결과를 본 뒤 남기지 않는다. 모델이 이미 학습한 영상인지까지 보장할 수 없는 공개 사전학습 pose 모델의 한계도 구분한다.

라벨 담당자는 원본 영상을 직접 보고 단계 경계, 순서, 빠진 단계, 유지 구간, 경계 불확실 구간, 가려진 관절, 전체 판정을 기록한다. 생성 프롬프트의 의도나 편집 스크립트의 명칭을 관측 사실로 대신하지 않는다. AI 보조 주석이면 그렇게 표기하고, 사람 전문가 이중 주석이라고 표현하지 않는다. 가능하면 두 명의 독립 주석과 불일치 해결 기록을 추가한다.

**잠금 순서**: (1) 개발 종료 → (2) 코드·설정 hash 고정 → (3) 신규 원본 선정 및 추론 전 라벨 고정 → (4) 입력·주석 hash 기록 → (5) 후보 pose 추론·판정 → (6) 전 사례 공개. 기준 영상만을 이용하는 template 추출은 reference-based 평가의 입력으로 허용하지만, 후보 결과를 보고 reference 단계·경계·허용치를 수정할 수 없다. 새 후보 원본의 시각 주석을 개발자에게 보여 주고 규칙을 조정했다면 그것도 개발 자료로 이동한다.

잠금 manifest에는 UTC 시각, source/code/config/annotation/model SHA-256, 원본 ID, 수행자·세션 grouping, 개발/평가 split, 제외 기준, 변형 seed, mirror 정책, holdout 열람 여부를 남긴다. 테스트 이후 버그를 고치면 원래 결과를 보존하고 수정 결과를 후속 분석으로 분리한다. 새로운 성능 결론에는 새 보류 자료가 필요하다.

## 4. 순서·유지 시간 matcher의 계약

이 절은 독립 구현 제안이다. 모든 수치는 기존 21개 개발 자료에서 정한 뒤 고정한다. 단순 포즈가 포함된 작은 개발집합에서 정한 허용치를 보편적 기준으로 제시하지 않는다.

### Reference 계약

- 필수 단계 `s_1 ... s_K`는 기준 영상만으로 정의한다. 각 단계에 활성 관절, 시작/종료 조건, 필수 유지 시간, 전이 방향, 좌우 구분, 허용 템포 범위를 기록한다.
- 단계별 template의 구별 가능성을 검사한다. 반복되는 중립 자세처럼 모습이 같은 단계는 앞뒤 전이·방향·발생 횟수를 이용한다. 관측만으로 구별할 수 없으면 모호함을 공개하고 unknown을 허용한다.
- 전신 동작인데 상체만 평가하면 부분 준수로 명명한다. 몸통 정규화로 지워지는 이동은 별도 경로/발 단계 조건으로 처리하거나 평가 범위 밖으로 명시한다.
- 거울 허용 여부는 요청으로 결정한다. 원본/반전 중 더 잘 맞는 점수를 사후 선택해서 strict-left/right 결과를 높이지 않는다.

### 후보 스트림과 단계 전이

1. 각 샘플은 시간, 정규화 pose, 활성 관절별 confidence/valid mask, pose 오차, 부분별 오차를 갖는다. 가려진 관절을 0점 오차로 계산하지 않는다.
2. 상태는 현재 필수 단계와 그 단계의 관측 가능한 dwell이다. 임계값 이내의 유효 샘플만 dwell을 늘린다. confidence가 없는 간격은 양의 증거가 될 수 없으며, 허용 간격과 reset 규칙을 미리 고정한다.
3. 한 업데이트는 최대 한 단계만 완료한다. 단계마다 새로운 후보 시간 구간을 소비하며, 같은 후보 프레임을 서로 다른 필수 단계의 완료 근거로 중복 사용하지 않는다.
4. 적절한 최소 지속 시간뿐 아니라 전이·순서·종료 상태까지 확인한다. 긴 동일 자세 하나가 여러 비슷한 단계를 완료시키지 않도록 한다. DP를 쓴다면 필수 reference 단계 삭제를 무료 연산으로 허용하지 않는다.
5. 잘못된 순서의 증거를 기록한다. 현재 단계가 관측되지 않은 채 후속 단계가 명확히 나타나면 누락/순서 위반 후보로 표시한다. 전이 중 잠깐 닮은 자세를 단계 수행으로 세지 않도록 dwell을 적용한다.
6. 장면 끝에서 마지막 필수 단계와 필요한 복귀가 완료됐는지 확인한다. 비용이 낮은 부분 대응만으로 전체 pass를 내지 않는다. 단계별 관측률·소비 구간·실패 이유를 출력한다.

속도 차이는 선언한 범위 안에서 허용한다. **정지(freeze)가 틀렸다는 라벨은 최대 pause/단계 시간/총 시간 제한이 과제에 있을 때만 정당하다.** 속도를 무제한 허용하면서 정지만 오류로 처리하지 않는다. 정적 유지 동작에서는 같은 모습이 이어지는 것이 정상이다. 편집된 freeze의 파일 특성으로 정답을 알아내는 대신 동작 명세와 관측 결과를 평가한다.

### 세 가지 결과

| 결과 | 필요한 증거 |
|---|---|
| `pass` / compliant | 모든 필수 단계와 순서·유지·종료 조건을 충족하고 평가에 필요한 관측이 충분함 |
| `fail` / noncompliant | 관측 가능한 잘못된 단계·순서·미완료·제한 위반의 구체적 증거가 있음 |
| `unknown` | 가림, 누락, confidence 부족, 반복 단계의 관측 모호함 등 때문에 pass/fail 근거가 부족함 |

명확한 위반 증거가 이미 있으면 다른 시점의 가림 때문에 그것을 지우지 않는다. 관측 부족으로 필수 단계가 보이지 않은 것과, 충분히 보이는 영상에서 그 단계가 수행되지 않은 것을 분리한다. 운영상 unknown은 통과로 간주하지 않고 재촬영/검토 대상으로 표시한다. 보고서에서는 fail과 합치지 않는다.

## 5. 영상 평가 지표

정답 `C`=준수, `E`=위반, `U`=시각적으로 판정 불가. 예측 `P`=pass, `F`=fail, `A`=unknown으로 정의해 **3×3 원시 계수 표를 먼저 공개**한다. 판정 가능한 정답 부분집합의 총수는 `N_C + N_E`다.

- TP=`n(C,P)`, FN=`n(C,F)`, FP=`n(E,P)`, TN=`n(E,F)`. 양성은 '준수'다. `n(C,A)`, `n(E,A)`를 별도 계수로 둔다.
- false acceptance=`FP/N_E`; false rejection=`FN/N_C`; correct acceptance=`TP/N_C`; 위반 검출률=`TN/N_E`; 각 분모에는 unknown 예측도 포함한다.
- 클래스별 unknown 비율=`n(C,A)/N_C`, `n(E,A)/N_E`; decision coverage=`(TP+FN+FP+TN)/(N_C+N_E)`.
- 결정한 사례만의 precision/recall/F1을 부가 보고할 수 있으나 unknown을 뺀 수치임을 명시한다. 운영상 준수 재현율을 쓰면 `TP/N_C`로 정의하여 보류를 숨기지 않는다. 분모가 0이면 null/해당 없음으로 표시한다.
- 정답 U는 정답 C/E 분모에 넣지 않는다. 대신 `n(U,P)`의 근거 없는 통과와 `n(U,F)`의 근거 없는 실패를 각각 공개한다.
- 단계별: 필수 단계 재현율, 단계 잘못 검출 수, 완료율, 순서 위반 검출, 생략 검출, boundary 오차, 관측률. 전이 경계 불확실 구간은 별도로 보고한다.
- v1과 v2는 같은 원본·변형·라벨로 쌍 비교한다. 각 사례가 FP→TN, TP→FN, 결정→unknown 중 어떻게 바뀌었는지 공개한다. 개발 개선과 독립 평가를 합산한 '정확도'는 만들지 않는다.

영상 프레임이나 한 영상의 변형을 독립 표본으로 간주하지 않는다. 충분한 여러 원본이 있으면 수행자/세션 단위 cluster bootstrap으로 불확실성을 제시한다. 원본이 한두 개이면 계수·사례를 그대로 보고 모집단 신뢰구간이나 통계적 우월성을 주장하지 않는다. 처리 시간은 decode/pose/preprocess/matcher/export를 분리하고, offline throughput을 온라인 지연이나 제어 주파수로 바꾸어 표현하지 않는다.

## 6. MuJoCo 쌍 비교: feedforward 대 feedforward + PD

현재 계획은 동일한 4-hinge fixed-base 모형과 torque motor를 사용한다. 입력은 영상에서 만든 `q_ref(t)`와 도함수다. 좌표축·각도 부호·radian 단위·관절 제한·보간·필터·속도/가속도 제한을 먼저 고정한다. 허용 범위를 벗어난 목표의 clip 비율을 공개하고, clip된 쉬운 목표만을 원래 사람 자세의 완전 재현으로 설명하지 않는다. 2D 영상은 깊이와 회전을 유일하게 복원하지 못하므로 평면 상체 투영이라는 가정을 기록한다.

동일한 nominal 모형에서 원하는 궤적만으로 미리 계산한 inverse-dynamics 토크를 `tau_ff(t)`라 한다. 실제 rollout의 qpos/qvel을 feedforward 계산에 사용하지 않는다.

```text
A: tau(t) = clamp(tau_ff(t), -limit, +limit)
B: tau(t) = clamp(tau_ff(t) + Kp*(q_ref-q) + Kd*(qdot_ref-qdot), -limit, +limit)
```

`q`와 `qdot`는 B의 simulator encoder 관측이다. 두 조건 모두 초기화 이후에는 실제 `mj_step`으로 상태를 전개하며, 목표 qpos로 순간 이동시키거나 성공 시점만 재생하지 않는다. XML motor와 gear를 확인해 입력·관절 토크 환산을 기록한다. MuJoCo의 position actuator는 내부 피드백 서보이므로 그것을 쓰는 다른 구현에서는 A를 순수 open-loop 토크 제어라고 부를 수 없다. [공식 actuator 정의](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-position)

쌍마다 XML/hash, nominal 목표 궤적, 질량·관성·마찰, 시작 qpos/qvel, 외력 시작 시각·크기·방향, 관측 지연/노이즈, timestep, torque cap, 실행 시간 예산을 동일하게 한다. 변경점은 PD 상태 피드백의 유무다. 추가로 단계 진행 정책까지 바꾸면 별도 요인/ablation으로 분리한다. gain은 개발 조건에서만 조정하며 보류 seed에서 고치지 않는다. 보류 seed는 동일 분포 내 시험인지 새로운 물리 조건으로의 외삽인지 명시한다.

주 결과는 실제 관절의 목표 오차 RMS/95백분위/최댓값, 관절별 오차, 각도 허용치 내 시간 비율, 단계·종료 성공 수, timeout 수다. 추가로 토크 포화율, 제한 위반의 크기·지속 시간, 교란 후 미리 정한 오차 범위로 복귀하는 시간, 적분 절대 오차를 보고한다. 회복하지 못한 에피소드는 누락하지 않고 실패/검열로 남긴다. 모니터가 제어 정책에 쓰였다면 평가기는 고정된 독립 기준으로 실제 trajectory를 다시 채점한다.

모든 `(condition, seed)`에 A/B 결과와 `error_A - error_B`를 함께 공개한다. 대표 동영상 하나만으로 우월성을 말하지 않는다. 단순하고 약한 open-loop baseline보다 나은 결과는 이 모형에서 피드백 보정의 효과를 보여 주며, 최신 RL/최적제어보다 우수함을 보여 주지 않는다. 무교란 nominal 조건에서 A가 합리적으로 동작하는지도 확인해 baseline 구현 오류를 배제한다.

## 7. 공개할 실행 증거

실행 전 manifest와 라벨, 최종 설정, 모델·입력·코드 hash, 전 사례의 예측·원시 계수, 단계별 시간 기록, 유효 관절 비율, simulator XML·버전·제어 코드·매 스텝 목표/실제 qpos/qvel/torque/교란 기록, 실패와 보류를 포함한 영상·CSV/JSON을 공개한다. 실제 채택되지 않은 제안은 '미실행'으로 표시한다.

본 검토에서는 새 사람 영상에 모델을 실행하지 않았고, 시뮬레이션도 실행하지 않았다. 수치와 독립 평가의 완료 여부는 후속 실제 실행 보고서에서만 확정한다.
