# 실제 사람의 팔 동작 순서: 소규모 검증 데이터

2026-09-22, v2 pose 추론 전에 영상만 보고 구성했다. **실제 수행 3명분, 촬영 원본 2개, 비교 8개**다. 모델을 보지 않고 동결한 assistant 초안 라벨이며 전문가 판정이나 동작 품질 정답은 아니다. v2 알고리즘 설정은 root가 별도로 먼저 동결했다.

목표는 `arms_low → arms_high → arms_low → arms_high → arms_low`다. 양팔을 두 번 올렸다 내리는 **팔의 단계 순서**만 평가한다. 팔꿈치 각도, 손뼉 여부, 다리 벌리기, 착지, 운동의 안전성이나 정확한 jumping-jack 자세를 평가하지 않는다. 동작의 의미가 같아도 카메라와 팔 굽힘 차이로 좌표 거리가 커질 수 있다.

## 원본과 사용 범위

| 원본 | 출처·사용 조건 | 사용한 실제 수행 |
|---|---|---|
| Fit for Duty: Calisthenics & Stretching, DVIDS 154450 (2007-12-04) | [공식 영상](https://www.dvidshub.net/video/154450/fit-duty-calisthenics-stretching)은 PUBLIC DOMAIN으로 표시되어 있다. [공식 이용 안내](https://www.dvidshub.net/about/copyright)에 따라 출처와 비보증 문구를 함께 표시한다. | 중앙 전경 인물을 참조로, 같은 촬영의 우측 인물을 별도 실제 수행으로 사용. 우측 인물은 팔다리가 잘리는 줌 구간을 피하고 70–72초 와이드 샷 선택. |
| Jumping jacks and burpees, Taco Fleur (2017-11-15) | [Commons 원본 파일 페이지](https://commons.wikimedia.org/wiki/File:Jumping_jacks_and_burpees.webm), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). 출처·저자·라이선스·변경 사항 표시. 파생 영상에도 CC BY-SA 4.0 적용. | 별도 장소·촬영의 단독 수행. 앞부분 두 반복과 뒤쪽 두 반복 사용. 뒤쪽 구간은 새로운 사람이나 독립 촬영이 아니다. |

**공개 뷰어의 DVIDS 출처 옆에 표시할 문구:**

> The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement.

DVIDS 저화질 전체본 69,828,540 bytes를 검토했고, 공개 HLS의 640×360 구간 69–114초와 132–138초만 추가로 받아 사용했다(5,702,792 bytes). 새 영상 다운로드 총량은 **75,531,332 bytes**로 100 MB 미만이다. Commons 6,544,177 bytes 원본은 앞선 실험의 로컬 파일을 복사했으며 추가 다운로드하지 않았다. 원본 및 구간의 SHA-256과 공개 URL은 `data/sources/provenance.json`에 있다.

## 비교 8개와 동결 라벨

모든 비교의 참조는 `reference_center`다. 참조 영상은 15 fps의 실제 32프레임이며, 각 단계 core는 서로 겹치지 않는 연속 3프레임(0.20초, 끝 제외)이다. 레퍼런스의 이벤트는 모델 측정값이 아닌 사람이 화면에서 고른 구간이다.

| case ID | 초안 기대 | 구분 | 라벨의 근거 |
|---|---|---|---|
| `right_two_cycles` | positive | 다른 실제 수행, 같은 촬영 | 우측 사람이 양팔을 두 번 올리고 내린다. |
| `commons_two_cycles` | positive | 다른 촬영의 실제 수행 | 양팔을 두 번 올리고 내린다. 팔 굽힘 형태는 참조와 다르다. |
| `commons_later_two_cycles` | positive | 같은 Commons 수행의 추가 구간 | 뒤쪽에서 같은 순서의 두 반복이 보인다. 독립 표본으로 세지 않는다. |
| `right_standing` | negative | 실제 연속 영상 | 우측 사람이 손을 허리에 두고 서 있다. 두 번의 팔 올리기가 없다. |
| `right_one_cycle` | negative | 결정적 편집 대조군 | 첫 반복까지만 남겨 두 번째 팔 올리기를 제거했다. |
| `commons_one_cycle` | negative | 결정적 편집 대조군 | 별도 촬영에서도 첫 반복까지만 남겼다. |
| `right_missing_middle` | negative | 결정적 편집 대조군 | 중간에 팔을 내리는 구간을 삭제해 낮음→높음→높음→낮음이 된다. |
| `right_frozen_low` | negative | 결정적 편집 대조군 | 실제 낮은 팔 프레임을 반복했다. 실제 사람이 따로 정지 동작을 수행한 영상이 아니다. |

실제 연속 구간 비교는 4개, 편집 대조군은 4개다. 양성 3개 중 **참조와 다른 실제 수행의 양성은 2개**다. 새로운 사람 8명이나 독립 시험 8회로 해석하면 안 된다. DVIDS의 공간적으로 구별되는 두 사람은 촬영, 지도, 배경을 공유한다. 이름이나 얼굴로 신원을 추론하지 않았다.

## 입력 및 재현

- 목록: `data/manifest.json`의 `clips`와 `cases`.
- 각 `clips/<id>/source.mp4`와 `annotations.json`.
- 이벤트: `{phase, start_s, end_s, start_frame, end_frame_exclusive}`. 시간은 파생 클립 기준이며 끝을 포함하지 않는다. 같은 `phase` 이름이 두 번 나와도 별개의 필수 단계다.
- 실제 구간은 연속 trim·공간 crop·H.264 변환·오디오 제거만 수행했다. 시간 배속이나 프레임 보간은 없다. 대조군의 정확한 프레임 매핑은 manifest에 있다.
- 영상과 라벨 동결 기록: `data/FREEZE.json`. source hash는 manifest와 provenance에도 기록했다. 결과를 보고 라벨이나 구간을 다시 고르지 않는다.
- 재현용 추출기: `.v\Scripts\python.exe experiments/motion_compliance_v2/data/build_real_validation.py`. 원본 다운로드 후 실행하며 pose 모델을 호출하지 않는다. 다시 실행하면 동결 시간이 갱신되므로 평가 후에는 새 버전으로 취급해야 한다.

## 관찰 한계와 제외한 후보

DVIDS는 15 fps이고 와이드 샷의 사람이 작으며, 참조 crop에 작은 배경 인물이 남는다. 참조는 가장 큰 중앙 전경 인물을 대상으로 한다. 단일 인물 선택·관절 가시성에 실패하면 UNKNOWN이 올바른 한계 보고다. 영상의 팔 동작은 연속적이므로 정적인 자세 유지 실험과도 다르다. 양팔 높임의 의미만 라벨링했으며 기준 동작을 사전에 전달받아 따라 한 실험은 아니다.

이 데이터는 의도적으로 고른 2개 촬영의 사례 연구다. 독립 피험자 대규모 일반화, 실제 로봇 제어, 접촉·힘·3D 동작 검증, 임상적 운동 평가를 뒷받침하지 않는다. 실제 Physical AI 시스템의 시각 관찰→가시성 확인→순서 준수 진단 단계에 대한 작은 검증으로 한정한다.

[KIMORE 원 논문](https://doi.org/10.1109/TNSRE.2019.2923060)은 공개 depth/skeleton 데이터와 별도로 RGB 접근은 저자 연락을 안내한다. 계정이나 연락 없이 바로 사용할 RGB가 아니므로 제외했다. [UI-PRMD 공식 사이트](https://webpages.uidaho.edu/ui-prmd/)는 조사 당시 403이었으며 RGB 재배포 조건도 확인하지 못했다. MediaPipe 예제 코드는 공개되어 있지만 코드의 Apache 라이선스만으로 예제 영상의 권리를 확정하지 않았다. Commons의 `Burpee.webm`과 `CrossFit Burpee.webm`은 기존 jumping-jacks 원본과 동일한 출처/시연자이므로 별도의 독립 인물 데이터로 늘리지 않았다.
