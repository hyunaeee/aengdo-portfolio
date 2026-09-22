# 지정 동작 따라 하기: 포즈·시간 정렬 실험

작성: 2026-09-22 · 완료 21/21개 비교

이 실험은 지정된 기준 영상과 후보 영상 사이에서 관측된 자세·동작 순서를 비교한다. YOLO11s-pose로 관절을 추출하고, 해석 가능한 2D 좌표 비교와 단조 DTW를 사용했다. 학습된 춤 심사 모델, 동작 의미 인식기, 또는 검증된 합격 판정기가 아니다.

## 데이터와 사전 기준

- 실제 Floss 춤 원본과 결정적 변형 8개: 동일 수행자·동일 원본에 대한 스트레스 검사다.
- 12초 합성 기준 동작과 결정적 변형 8개: 속도 변화, 순서 교환, 생략, 정지, 반전, 중간 구간 영상 소실을 검사한다. `occluded` 변형은 영상 가운데 60% 구간의 모든 픽셀을 검정으로 바꾼다. 일부 관절이나 상체만 가린 실험이 아니다.
- 같은 지시로 별도 생성한 기준·후보 영상 1쌍: 영상의 실제 모습으로 팔 모양과 시점 차이를 검토했다. 생성 프롬프트는 정답이 아니다.
- 명시적 자세 4개: 양팔 머리 위 기준에 대한 일치 1개, 한 팔·수평 팔·양팔 아래의 불일치 3개. 포즈 추론 전에 시각 초안으로 고정했다.

평균 거리 0.35, 부위 평균 0.50, 부위 p95 0.75 몸통 길이를 임시 검토 기준으로 사용한다. 관절 신뢰도는 0.30 이상, 보수적 관측률 80% 미만은 unknown이다. 각 기준은 실제 비교 결과에 맞춰 최적화하지 않았다. 합성 단위 테스트에서 평균이 한쪽 팔 오류를 희석하는 현상을 확인하여, 실제 영상 비교 전에 p95 기준을 추가했다.

## 방법

골반 중점을 원점으로 하고 어깨 중점–골반 중점 거리를 1로 정규화한다. 본체 비교는 COCO 관절 5–16을 사용하며, 머리를 포함한 17개 관절별 거리도 보고한다. 양쪽 어깨·골반이 관측되지 않으면 정규화는 미확인이다. 누락 관절을 0오차로 채우지 않는다.

기본 비교는 전체 길이를 맞춘 정규화 시간 대응이다. DTW는 시작·끝점을 고정하고 단조 순서를 유지하며 진행도 차이를 25%로 제한한다. 수평·수직 이동에는 0.05 비용을 더한다. 관측 불가 쌍의 경로 계산 비용 1.0은 실제 관측 오차가 아니다. 전체 DTW 경로의 반복 쌍을 집계하므로 후보 프레임별 표시 평균과 결과가 다를 수 있다.

시간 왜곡이 오류를 숨길 수 있어 진행도 차이, 수평·수직 이동 비율, 동일 기준 프레임에 머문 최장 시간도 보고한다. 1초 초과 반복 대응은 검토 신호다. `reference_progress_coverage`는 경로에서 방문한 기준 샘플 번호의 비율이며, 의미 있는 동작 단계를 모두 수행했다는 비율이 아니다. 초기 골반 대비 이동도 별도로 비교하며 0.50 이상 차이를 표시한다. 이 이동 지표는 카메라 이동에 강건하지 않다.

aligned는 충분히 관측된 좌표에서 설정한 검토 신호가 없다는 뜻이다. 춤을 정확히 수행했다는 합격 판정이 아니다. 좌우 반전은 기본적으로 허용하지 않으며, 반전 보정을 선택한 추가 결과를 별도로 기록한다.

## 전체 비교 결과

| 그룹 / 사례 | 기대 신호 | 관측 진단 | 시간 대응 평균 | DTW 평균 | 관측률 | 해석 |
|---|---|---|---:|---:|---:|---|
| real_dance / 원본 동일 입력 | aligned | aligned | 0.000 | 0.000 | 94.6% | expected_diagnostic |
| real_dance / 전체 속도 1.35배 느리게 | aligned | aligned | 0.053 | 0.021 | 90.2% | expected_diagnostic |
| real_dance / 구간별 속도 변화 | aligned | aligned | 0.170 | 0.041 | 88.6% | expected_diagnostic |
| real_dance / 동작 구간 순서 교환 | needs_review | aligned | 0.161 | 0.114 | 87.8% | unexpected_diagnostic |
| real_dance / 중간 동작 생략 | needs_review | aligned | 0.186 | 0.071 | 85.7% | unexpected_diagnostic |
| real_dance / 중간 프레임 정지 | needs_review | aligned | 0.084 | 0.084 | 86.5% | unexpected_diagnostic |
| real_dance / 좌우 반전 · 엄격한 좌우 대응 | needs_review | unknown | 0.271 | 0.178 | 78.4% | inconclusive |
| real_dance / 중간 구간 영상 소실 · 전체 검정 프레임 | visibility_loss | unknown | 0.017 | 0.017 | 35.1% | observed_visibility_loss |
| generated_controls / 원본 동일 입력 | aligned | aligned | 0.000 | 0.000 | 100.0% | expected_diagnostic |
| generated_controls / 전체 속도 1.35배 느리게 | aligned | aligned | 0.009 | 0.008 | 100.0% | expected_diagnostic |
| generated_controls / 구간별 속도 변화 | aligned | aligned | 0.226 | 0.010 | 100.0% | expected_diagnostic |
| generated_controls / 동작 구간 순서 교환 | needs_review | needs_review | 0.169 | 0.088 | 100.0% | expected_diagnostic |
| generated_controls / 중간 동작 생략 | needs_review | aligned | 0.139 | 0.014 | 100.0% | unexpected_diagnostic |
| generated_controls / 중간 프레임 정지 | needs_review | needs_review | 0.111 | 0.067 | 100.0% | expected_diagnostic |
| generated_controls / 좌우 반전 · 엄격한 좌우 대응 | needs_review | needs_review | 0.140 | 0.140 | 100.0% | expected_diagnostic |
| generated_controls / 중간 구간 영상 소실 · 전체 검정 프레임 | visibility_loss | unknown | 0.004 | 0.004 | 40.0% | observed_visibility_loss |
| independent_generated / 같은 지시, 별도 생성 영상 | qualitative_review | aligned | 0.074 | 0.055 | 100.0% | qualitative_only |
| pose_cases / 양팔 머리 위 · 일치 예시 | aligned | aligned | 0.070 | 0.070 | 100.0% | expected_diagnostic |
| pose_cases / 한쪽 팔만 머리 위 | needs_review | needs_review | 0.317 | 0.317 | 100.0% | expected_diagnostic |
| pose_cases / 양팔 수평 · 다른 자세 | needs_review | needs_review | 0.327 | 0.327 | 100.0% | expected_diagnostic |
| pose_cases / 양팔 아래 · 다른 자세 | needs_review | needs_review | 0.504 | 0.504 | 100.0% | expected_diagnostic |

거리 단위는 몸통 길이이며 정확도 백분율이 아니다. 변형 사례의 기대 신호는 설계한 스트레스 조건이고, 독립 평가자의 정답 라벨이 아니다.

## 명시적 자세 사례의 제한된 혼동 집계

양성은 기준의 양팔 머리 위 자세와 대략적으로 일치하는 경우다.

| 사전 시각 초안 | aligned | needs_review | unknown |
|---|---:|---:|---:|
| aligned | 1 | 0 | 0 |
| needs_review | 0 | 3 | 0 |

집계: `{"tp": 1, "fn": 0, "fp": 0, "tn": 3, "unknown_positive": 0, "unknown_negative": 0}`. 양성 1개·음성 3개인 관련 합성 영상의 초안 평가이므로 일반 정확도나 성공률을 계산하지 않았다.

## 실패·불확실 사례

- **real_order_swap**: 기대 `needs_review` → 관측 `aligned`; `unexpected_diagnostic`. 신호: 없음. DTW 0.114, 관측률 87.8%.
- **real_skip_middle**: 기대 `needs_review` → 관측 `aligned`; `unexpected_diagnostic`. 신호: 없음. DTW 0.071, 관측률 85.7%.
- **real_freeze_middle**: 기대 `needs_review` → 관측 `aligned`; `unexpected_diagnostic`. 신호: 없음. DTW 0.084, 관측률 86.5%.
- **real_mirror**: 기대 `needs_review` → 관측 `unknown`; `inconclusive`. 신호: insufficient_pose_coverage. DTW 0.178, 관측률 78.4%.
- **generated_skip_middle**: 기대 `needs_review` → 관측 `aligned`; `unexpected_diagnostic`. 신호: 없음. DTW 0.014, 관측률 100.0%.

반복되는 춤의 구간을 바꾸거나 일부 동작을 생략하면, 남은 유사 자세 사이의 정렬 비용이 여전히 작을 수 있다. 낮은 DTW 거리만으로 지정된 모든 단계의 수행을 증명할 수 없다. 관측률이 낮으면 어떤 자세가 맞거나 틀렸는지 판단하지 않는다.

## 별도 반전 정책 비교

| 사례 | 엄격한 좌우 대응 | 명시적 반전 보정 | 기본 결과 자동 교체 |
|---|---:|---:|---|
| real_mirror | 0.178 | 0.045 | 하지 않음 |
| generated_mirror | 0.140 | 0.034 | 하지 않음 |

## 실행 시간과 재현

각 포즈 파일에는 3회 워밍업 후 RTX 4090에서 CUDA 동기화로 측정한 프레임별 시간이 있다. 디코딩·포즈 추론·후처리를 포함하며 JSON 기록과 시각화는 제외한다. 비교 파일의 CPU 시간은 관절 배열 준비·정렬·지표 집계만 측정했다. 이 둘을 전체 온라인 서비스 FPS로 제시하지 않는다.

```powershell
.v\Scripts\python.exe experiments/motion_compliance/test_compare_motion.py
.v\Scripts\python.exe experiments/motion_compliance/summarize_experiment.py
.v\Scripts\python.exe experiments/motion_compliance/export_motion_web.py
```

원본 포즈를 재추출하려면 `extract_pose.py --video <source.mp4> --out <new poses.json>`을 사용한다. 모든 변형은 실제 변형 영상에서 포즈를 다시 추출했다. 단순히 기준 포즈 배열을 복사해 성공을 가정하지 않았다.

## 출처와 다음 검증

실제 춤은 [LittleT889의 Floss (dance)](https://commons.wikimedia.org/wiki/File:Floss_(dance).gif), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)이다. GIF를 H.264로 변환하고 명시한 시간·반전·중간 구간 전체 검정 변형을 적용했다. 배포하는 해당 파생 미디어에도 동일 라이선스를 표시한다. 합성 영상은 Higgsfield / Seedance 2.5로 생성했다.

논문 16편의 원문·공식 구현과 이 실험의 관련성은 `sources.json`에 정리했다. 논문의 학습 모델을 실행하거나 해당 벤치마크 점수를 재현한 실험은 아니다. 다음 검증에는 서로 다른 실제 수행자, 사람이 검토한 구간별 오류, 시점 변화와 가림, 별도의 검증·테스트 분리가 필요하다.
