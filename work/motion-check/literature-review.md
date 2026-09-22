# 지정된 춤·연속 동작을 따라 했는가: 문헌 검토와 실험 설계

검토일: 2026-09-22. 사용자가 선택한 과제는 **기준 춤·연속 동작 영상에 대한 모방 수행 평가**다. 아래는 논문·저자 저장소·공식 문서에 근거한 핵심 10편과 관련 연구 6편이다. 공개 여부는 문서와 저장소 수준에서 확인했다. 이 문헌 검토에서 해당 모델들을 실행하거나 논문 성능을 재현하지 않았다. 출처와 공개 상태의 구조화된 기록은 [sources.json](sources.json)에 있다.

**추천 출발점은 공개 pose 모델로 관절을 추출하고, 기준 영상과 제한된 시간 정렬을 수행한 뒤, 어느 시점의 어느 신체 부위가 달랐는지 보여 주는 시스템이다.** 동작의 순서·완료 여부와 속도 허용 범위를 별도 규칙으로 명시한다. 이는 이번 소규모 실험에 대한 설계 판단이며 특정 논문의 재현 결과가 아니다.

## 먼저 구분할 평가 대상

| 문제 | 묻는 것 | 이번 과제에서 남는 문제 |
| --- | --- | --- |
| 동작 인식 | “무슨 동작인가?” | 같은 춤으로 분류돼도 왼팔 대신 오른팔을 쓰거나 마지막 동작을 빠뜨릴 수 있다. |
| 동작 품질 평가(AQA) | “종목의 평가 기준에서 얼마나 잘했는가?” | 다이빙 심판 점수 모델이 지정한 춤의 순서·좌우를 평가하도록 학습되지는 않았다. |
| 동작 검색·유사도 | “어떤 기준 동작과 닮았는가?” | 비슷한 춤을 찾는 정확도와 오류를 놓치지 않는 정확도는 다르다. |
| 기준 수행 준수 평가 | “지정한 순서·방향·범위·완료 조건을 지켰는가?” | 이번 목표. 관측 신뢰도, 시간 정렬, 국소 오류, 순서·완료를 함께 평가해야 한다. |

이 구분은 아래 논문들의 실제 학습 목표와 출력 차이를 바탕으로 한 해석이다. “춤 인식 confidence”를 “올바르게 수행했을 확률”로 표시하지 않는다.

## 핵심 연구 10편

### 1. Cuturi & Blondel — Soft-DTW: a Differentiable Loss Function for Time-Series (ICML 2017)

DTW는 길이와 속도가 다른 시계열을 단조 경로로 맞춘다. Soft-DTW는 그 정렬 비용을 미분 가능하게 만든 학습 손실이다. 논문은 원소별 같은 시점 비교보다 시간 이동·늘어남에 강한 정렬을 다룬다. 공식 구현이 연결되어 있으며 정렬 알고리즘 자체에는 사전 학습 가중치가 필요하지 않다. [논문](https://proceedings.mlr.press/v70/cuturi17a.html), [저자 코드](https://github.com/mblondel/soft-dtw).

**이번 적용:** 먼저 일반 hard-DTW로 관절 특징을 정렬한다. Soft-DTW 학습을 하지 않으면 “Soft-DTW를 재현했다”고 쓰지 않는다. 정렬을 과하게 허용하면 정지·누락을 여러 프레임에 대응시킬 수 있으므로 경로 제약과 완료 검사를 별도로 둔다. 이 마지막 부분은 우리 설계 판단이다.

### 2. Dwibedi et al. — Temporal Cycle-Consistency Learning (CVPR 2019)

서로 다른 영상의 프레임 대응 관계가 순환적으로 일관되도록 표현을 학습한다. 저자들은 Pouring·Penn Action 등에서 행동 단계 분류, 진행도, 시간 정렬을 평가했다. 공식 TensorFlow 코드에는 학습·특징 추출·정렬 시각화가 있다. README의 ImageNet 초기화는 완성된 춤 평가 가중치와 다르다. [논문](https://openaccess.thecvf.com/content_CVPR_2019/html/Dwibedi_Temporal_Cycle-Consistency_Learning_CVPR_2019_paper.html), [공식 코드](https://github.com/google-research/google-research/tree/master/tcc).

**이번 적용:** 두 영상을 실제 대응 프레임으로 나란히 보여 주는 근거. 새 춤 데이터 학습 없이 TCC 수준의 외형·시점 불변성이 있다고 주장할 수는 없다.

### 3. Haresh et al. — Learning by Aligning Videos in Time (CVPR 2021)

LAV는 Soft-DTW 정렬 손실과 Contrastive-IDM 시간 정규화를 결합한다. 정렬 손실만 줄이면 프레임 표현이 모두 비슷해지는 퇴화해가 생길 수 있다는 문제가 핵심이다. 공식 PyTorch 학습·평가 코드가 있지만 확인한 README에서 바로 적용할 춤 가중치는 찾지 못했다. **출판 연도는 2021**이다. [논문](https://arxiv.org/abs/2103.17260), [저자 프로젝트](https://retrocausal.ai/learning-by-aligning-videos-in-time/), [공식 코드](https://github.com/trquhuytin/LAV-CVPR21).

**이번 적용:** 시간축을 맞추는 능력과 서로 다른 단계·자세를 구별하는 능력을 동시에 확인해야 한다. 단순 pose+DTW를 LAV라고 부르지 않는다.

### 4. Sun et al. — View-Invariant Probabilistic Embedding for Human Pose (ECCV 2020)

Pr-VIPE는 2D keypoint를 확률적 pose embedding으로 바꿔 시점이 달라도 비슷한 자세를 찾는다. 공식 TensorFlow 학습·추론 코드가 있다. 저자 issue 답변은 원래 공개 checkpoint가 누락 keypoint를 처리하지 못했으며 keypoint 추정기 분포가 바뀌면 성능이 떨어질 수 있음을 설명한다. 현 시점 checkpoint 다운로드·실행은 검증하지 않았다. [논문](https://arxiv.org/abs/1912.01001), [코드](https://github.com/google-research/google-research/tree/master/poem/pr_vipe), [저자 설명](https://github.com/google-research/google-research/issues/457).

**이번 적용:** 촬영 각도가 달라지는 후속 단계의 후보. 첫 실험에서는 같은 정면 시점과 설명 가능한 관절 특징을 우선한다.

### 5. Bazarevsky et al. — BlazePose: On-device Real-time Body Pose tracking (2020)

단일 인물의 33개 body keypoint와 실시간 추적을 위한 경량 pose 추정 연구다. 현재 MediaPipe Tasks는 Python·Web 예제와 Lite·Full·Heavy 모델 번들을 제공한다. 현재 배포 번들은 BlazePose/GHUM 변형이므로 2020 논문의 정확한 구조 재현과는 구별해야 한다. [논문](https://arxiv.org/abs/2006.10204), [Google 연구 소개](https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/), [현재 모델·API 문서](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker).

**이번 적용:** 단일 인물·고정 카메라의 빠른 초기 실험에 적합한 후보. 모델의 world-coordinate 출력은 단안 추정치이며 실제 모션캡처 정답이 아니다. 픽셀 기반 관절각은 “2D 투영각”으로 표시한다.

### 6. Jiang et al. — RTMPose: Real-Time Multi-Person Pose Estimation based on MMPose (2023)

산업 배포를 고려한 2D pose 추정 프레임워크다. 공식 저장소는 body·whole-body 모델, PTH/ONNX 가중치와 추론 예제를 제공하며, PyTorch/MMCV 없이 ONNXRuntime 등을 쓰는 rtmlib도 안내한다. [논문](https://arxiv.org/abs/2303.07399), [공식 코드·모델](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose).

**이번 적용:** MediaPipe 관절 검출이 불안정할 때 비교할 frontend 후보. 사람 검출과 top-down crop까지 포함한 실제 시간을 측정해야 한다. 논문 FPS나 COCO AP를 우리 춤 평가의 속도·정확도로 옮겨 쓰지 않는다.

### 7. Li et al. — AI Choreographer: Music Conditioned 3D Dance Generation with AIST++ (ICCV 2021)

AIST++는 10개 장르, 1,408개 3D dance sequence와 다중 시점 자료를 제공한다. 공식 API와 annotation 다운로드가 있으며 영상은 원본 AIST 약관을 확인해 받아야 한다. 공식 설명은 프레임을 정확히 60 FPS로 추출하고 재구성 품질이 낮은 sequence의 ignore list를 적용하도록 안내한다. [논문](https://arxiv.org/abs/2101.08779), [자료 설명](https://google.github.io/aistplusplus_dataset/factsfigures.html), [다운로드·형식](https://google.github.io/aistplusplus_dataset/download.html), [API](https://github.com/google/aistplusplus_api).

**이번 적용:** 실제 춤과 시점 변화에 대한 후속 검증 자료. 다중 카메라로 촬영된 같은 수행은 독립적인 모방 수행이 아니다. 이 데이터에는 일반적인 “기준을 잘/못 따라 함” 정답이 자동으로 생기지 않는다.

### 8. Li et al. — FineDance: A Fine-grained Choreography Dataset for 3D Full Body Dance Generation (ICCV 2023)

손까지 포함한 세밀한 춤 동작과 음악을 다루는 생성 연구다. 논문은 14.6시간을 설명하지만 현재 공식 README는 **7.7시간 공개 부분집합**을 안내한다. 생성 checkpoint와 실행 코드, dancer 기준 분리 방식도 제공한다. [논문](https://arxiv.org/abs/2212.03741), [공식 코드·자료](https://github.com/li-ronghui/FineDance).

**이번 적용:** 상체만으로 제한되지 않는 춤 특징·서로 다른 댄서 분리 평가를 설계하는 참고. 공개 generation 모델을 그대로 모방 수행 채점기로 사용할 근거는 없다.

### 9. Li et al. — Human Motion Instruction Tuning (CVPR 2025)

LLaMo는 텍스트와 함께 영상·native motion 표현을 처리하는 인간 동작 이해 방향이다. 논문은 코드와 모델 공개를 서술하지만, 검토 시 공식 저장소에는 README만 있었고 실행 구현이나 checkpoint 링크를 확인하지 못했다. [논문](https://openaccess.thecvf.com/content/CVPR2025/html/Li_Human_Motion_Instruction_Tuning_CVPR_2025_paper.html), [공식 저장소](https://github.com/ILGLJ/LLaMo).

**이번 적용:** 자연어 설명·질의응답의 장기 확장 방향. “instruction tuning”이라는 이름 자체가 임의 지시의 준수 여부나 작은 좌우 오류를 정확히 판정한다는 뜻은 아니다. 현재 실행 baseline에는 채택하지 않는다.

### 10. Kharlamova et al. — Learning Quantised Structure-Preserving Motion Representations for Dance Fingerprinting (arXiv 2026)

DanceMatch는 pose에서 이산 motion 표현을 만들고 비슷한 춤을 검색하는 최근 방향이다. 논문은 dataset 공개를 주장하지만 확인한 본문·초록·검색에서 저자 코드·가중치·데이터 다운로드 링크를 찾지 못했다. 아직 여기서는 **2026년 4월 preprint**로 다룬다. 논문 자체도 시간 순서 손실을 한계로 적는다. [논문](https://arxiv.org/abs/2604.00927), [전체 본문](https://arxiv.org/html/2604.00927v1).

**이번 적용:** 검색과 수행 검증을 구별하는 최신 사례. 같은 장르·안무를 찾는 retrieval 수치를 국소 오류 판정 성능으로 해석하지 않는다. 이 논문의 구현·성능을 재현했다고 주장하지 않는다.

## 관련 AQA·인식 연구: 바로 채택하지 않는 이유

| 연구 | 확인한 내용과 공개 상태 | 이번 과제에 가져올 점과 한계 |
| --- | --- | --- |
| Xu et al., **FineDiving** (CVPR 2022) | 다이빙의 단계·전환·점수를 제공. TSA 코드 공개, 데이터는 서명·요청 방식. README의 평가 checkpoint는 학습으로 생성. [논문](https://openaccess.thecvf.com/content/CVPR2022/papers/Xu_FineDiving_A_Fine-Grained_Dataset_for_Procedure-Aware_Action_Quality_Assessment_CVPR_2022_paper.pdf), [코드](https://github.com/xujinglin/FineDiving) | 기준–후보의 sub-action 비교가 유용하다. 알려진 단계 전환 수 가정·다이빙 감독 신호를 춤으로 그대로 옮길 수 없다. |
| Xu et al., **FineParser** (CVPR 2024) | 사람 foreground와 세밀한 시공간 파싱. 코드 공개. FineDiving-HM 요청 필요. README의 I3D backbone 가중치와 최종 FineParser 가중치는 구분해야 한다. [논문](https://arxiv.org/abs/2405.06887), [코드](https://github.com/PKU-ICST-MIPL/FineParser_CVPR2024) | “언제, 어디서 달랐는가”를 보여 주는 설계 참고. 다이빙 점수 예측을 arbitrary dance 검사로 광고하지 않는다. |
| Okamoto & Parmar, **Hierarchical NeuroSymbolic Approach for Comprehensive and Explainable Action Quality Assessment** (CVPR Workshops 2024, CVsports) | 신경망으로 해석 가능한 요소를 추출하고 규칙으로 다이빙을 평가하며 HTML report 생성. 코드·demo 링크 공개, 자료는 비상업적 사용 제한. [논문](https://arxiv.org/abs/2403.13798), [코드](https://github.com/laurenok24/NSAQA) | 관측과 판정 규칙을 나누는 개념적 참고. 그 종목 규칙이나 코드를 사용한 재현은 아니다. |
| Parmar et al., **Domain Knowledge-Informed Self-Supervised Representations for Workout Form Assessment** (ECCV 2022, Fitness-AQA) | squat·overhead press·barbell row의 자세 오류를 다룸. 코드 폴더 공개, 데이터는 요청·비상업적 사용. 즉시 추론 checkpoint는 미확인. [논문](https://arxiv.org/abs/2202.14019), [코드](https://github.com/ParitoshParmar/Fitness-AQA) | 운동 종류 인식과 자세 오류 구분의 차이를 보여 준다. 춤의 순서 준수 정답으로 대체할 수 없다. |
| Yin et al., **FLEX** (arXiv 2025) | 20개 중량 운동, RGB·3D pose·sEMG 및 구조화된 오류 피드백. 논문 연결 project는 검토 때 404여서 코드·데이터·가중치 접근 미확인. ICLR 2026 submission은 보았으나 채택 여부 미검증. [논문](https://arxiv.org/abs/2506.03198), [저자 연결 페이지](https://haoyin116.github.io/FLEX_Dataset) | 총점보다 동작 요소·오류·피드백 연결이 유용하다. 단안 춤 실험과 센서·행동 도메인이 다르다. |
| Duan et al., **Revisiting Skeleton-Based Action Recognition** (CVPR 2022, PoseC3D/PoseConv3D) | pose heatmap의 시공간 표현으로 action class 인식. 공식 코드·config·학습/평가 안내 공개. [논문](https://openaccess.thecvf.com/content/CVPR2022/html/Duan_Revisiting_Skeleton-Based_Action_Recognition_CVPR_2022_paper.html), [코드](https://github.com/kennymckormick/pyskl) | skeleton recognition baseline 후보. class가 맞다는 것만으로 방향·범위·순서·완료가 맞다고 판단할 수 없다. |

## 이번 실험에서 구현할 수 있는 구체적 설계

다음은 위 연구를 종합한 **우리의 제안**이다. 아직 실행하지 않은 기능이나 논문 결과를 구현 완료로 뜻하지 않는다.

1. **기준과 후보를 독립적으로 준비한다.** 정면 고정 카메라, 전신·손끝·발이 보이는 간단한 3–5단계 루틴을 우선한다. “시작 → 양팔 벌리기 → 한쪽 팔 올리기 → 반대쪽 이동 → 복귀”처럼 좌우·순서·종료가 식별 가능해야 한다. 생성 프롬프트에 쓴 동작·시점은 정답이 아니다. 생성된 실제 영상에서 reference phrase와 candidate 오류를 사람이 다시 확인한다.
2. **pose 관측 품질부터 저장한다.** 원본 frame timestamp, 관절 좌표·confidence/visibility, person track을 남긴다. 가려짐·화면 이탈·긴 추정 누락은 관측 불가로 분리한다. 낮은 confidence의 관절을 0 오차로 치거나 긴 구간을 보간해 통과시키지 않는다.
3. **체형·화면 위치와 동작을 분리한다.** hip 중심과 torso 길이로 자세를 정규화하고 양쪽 어깨·팔꿈치·손목·hip·무릎·발목의 위치·방향·2D 각도를 비교한다. 매 프레임 hip 중심 정규화는 좌우 이동을 제거하므로, 초기 hip 기준 이동 궤적 또는 발 스텝 특징을 별도 채널에 보존한다. 카메라 이동이 있으면 이 채널은 신뢰할 수 없다.
4. **거울 정책을 사전에 고정한다.** 기본은 해부학적 left/right를 보존한다. 거울 따라 하기 모드는 전체 sequence에 일관되게 적용한다. 프레임마다 유리한 좌우 조합을 고르면 wrong-arm 오류를 숨기게 된다.
5. **시간 정렬 전후를 모두 보인다.** 같은 시점 비교 baseline과 제한된 단조 DTW를 함께 평가한다. 정렬 경로, 허용 band/warp, 속도 비율, 최장 정지·일대다 대응 길이를 기록한다. 관측 불가 구간은 정렬 비용에서 사라지지 않도록 별도 coverage gate가 필요하다.
6. **자세·타이밍·단계 준수를 나눠 낸다.** 자세에는 관절별 중앙값/상위 분위 오차와 지속 오류 구간, 타이밍에는 시간 지연·늘어남, 단계에는 누락·wrong order·끝까지 복귀했는지를 낸다. sequence-level pass는 사전에 정한 필수 조건을 모두 충족할 때만 가능하다. 가중 평균 하나가 누락 단계의 실패를 상쇄하지 않게 한다.
7. **설명은 관측 프레임에 연결한다.** “후보 6.2초는 기준 4.8초에 대응하며 왼팔이 덜 올라감”처럼 두 timestamp와 실제 pose overlay를 제공한다. 추정값이 불확실하면 “오류” 대신 “이 구간 판정 불가”로 표시한다.

단순 2D baseline의 적합 범위는 비슷한 정면 시점과 큰 팔다리 움직임이다. 회전·깊이·손가락·바닥 동작·빠른 가림은 추가 검증이 필요하다. 이런 상황에서는 Pr-VIPE 또는 더 강한 3D/whole-body 추정기를 비교할 수 있지만, 그것만으로 준수 평가가 자동 완성되지는 않는다.

## 실험과 보고에서 지킬 구분

| 검증 묶음 | 목적 | 보고할 것 |
| --- | --- | --- |
| 동일 sequence·자기 비교 | 구현 sanity check | 수치 오차·정렬 경로가 예상과 맞는지. 일반화 성능으로 집계하지 않음. |
| 속도 변화·시작 지연 | 허용한 템포 변화를 잘 받아들이는지 | 정렬 전/후 오차, 허용 범위, false reject. |
| 잘못된 팔·단계 누락·순서 변경·미완료 | 실제 준수 위반 검출 | 오류 종류별 판정과 위치, false accept. |
| 가림·화면 이탈·pose 누락 | 신뢰도 처리 | 관측 가능 비율, abstention, 잘못된 확신. |
| 별도 인물·별도 촬영 | 일반화 확인 | 미사용 촬영에서 평가. calibration 영상과 분리. |

같은 영상의 시간 변형이나 skeleton 수치 변형은 **통제된 기능 실험**이다. 독립적인 사람 수행을 대신하지 않는다. 합성 reference·candidate 두 개만으로 benchmark 정확도, 실제 춤 지도 수준, 다양한 사람에 대한 일반화를 주장하지 않는다. 독립적인 재촬영 데이터가 없으면 그 점을 결과 표에 명시한다.

판정 기준과 정상/오류 라벨은 모델 결과를 보기 전에 가능한 범위에서 확정한다. 결과를 본 뒤 threshold를 바꾸었다면 그 데이터는 calibration 자료로 표시하고 같은 자료의 개선 수치를 held-out 성능이라고 쓰지 않는다. 소표본은 분모와 confusion matrix를 공개하고, interval 오류 위치·발견 못한 오류도 함께 남긴다.

속도는 pose 추론 시간, alignment 시간, 전체 처리 시간을 구분한다. 전체 파일을 보고 계산한 offline DTW 결과를 실시간 online 평가로 부르지 않는다. Vercel에서 저장된 결과를 재생하면 “기록된 분석 뷰어”로 설명한다. 실제 브라우저 추론을 제공하는 경우에만 해당 실행 경로와 측정치를 별도로 적는다.

## 구현 선택에 대한 결론

현재는 **공개 pose frontend + 관절별 특징 + 제한된 시간 정렬 + 단계별 준수 검사**가 가장 설명 가능하고 검증 가능한 출발점이다. TCC/LAV는 대규모 학습 기반 표현의 후속 후보, Pr-VIPE는 시점 변화 대응 후보, AIST++/FineDance는 실제 춤 검증 자료 후보로 둔다. FineParser·Fitness-AQA의 종목 모델이나 LLaMo의 자연어 응답을 임의 춤의 정답 판정기로 간주하지 않는다.

프로젝트에는 실제 사용한 pose 모델·버전·가중치 출처와 자체 작성한 정렬·판정 코드를 구분해 기록한다. 문헌에 근거한 설계와 논문 구현의 재현은 서로 다른 기여다.
