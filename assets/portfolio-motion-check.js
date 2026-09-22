/* Independently engineered perception and physics-control experiments; upstream models credited. */
(function(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_MOTION_CHECK = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  return {
  "project": {
    "id": "motion-check",
    "number": "09",
    "title": "MotionCheck Lab",
    "featured": false,
    "nextCase": "relateanything",
    "summary": {
      "ko": "영상에서 추출한 목표를 MuJoCo의 4관절 팔로 실행하고 관절 피드백으로 보정했습니다. 400개 물리 평가에서 제어 항목을 분리해 비교하고, 실제 영상의 전부 보류·사후 오거절 결과까지 공개합니다.",
      "en": "Video-derived targets drive four arm joints in MuJoCo with joint feedback. The case isolates controller contributions across 400 physical simulations and reports both total abstention and post-hoc false rejections on real footage."
    },
    "status": {
      "ko": "Physical AI · 영상 지각 + 물리 제어",
      "en": "Physical AI · Perception and simulated control"
    },
    "role": {
      "ko": "평가 설계 · pose 추론 · 단계 판정 · 토크 제어 · 쌍 비교 · 실패 분석",
      "en": "Evaluation design · pose inference · stage verification · torque control · paired ablation · failure analysis"
    },
    "period": "2026.09",
    "stack": [
      "Python",
      "YOLO11s Pose",
      "CUDA",
      "MuJoCo",
      "Inverse dynamics",
      "PD control",
      "Vercel"
    ],
    "image": {
      "src": "assets/motion-control.jpg",
      "width": 1280,
      "height": 720,
      "alt": {
        "ko": "같은 토크 계획을 사용하는 open-loop와 encoder 피드백의 MuJoCo 팔 모형 비교. 초록색은 실제 물리 상태, 주황색은 영상에서 만든 목표.",
        "en": "MuJoCo arms comparing open-loop replay and encoder feedback with the same torque plan. Green shows physical state; orange shows the video-derived target."
      }
    },
    "imageCaption": {
      "ko": "원래 복합 조건 · seed 100 · 6.10초의 실제 시뮬레이션 상태. 오른쪽 피드백에도 오차가 남습니다. 아래의 새 PD-only 비교와는 별도 실행이며, 실제 로봇 사진이 아닙니다.",
      "en": "Original combined condition · seed 100 · physical simulation state at 6.10 s. Feedback on the right still has error. This is separate from the fresh PD-only comparison below and is not a photograph of a real robot."
    },
    "metrics": [
      {
        "value": "3.11° → 0.66°",
        "label": {
          "ko": "명목 조건 관절 RMSE",
          "en": "Nominal joint RMSE"
        },
        "note": {
          "ko": "새 시드 20개 · 동일 PD 이득에서 사전 토크 계획 추가",
          "en": "20 fresh seeds · add feedforward at the same PD gains"
        }
      },
      {
        "value": "400",
        "label": {
          "ko": "물리 시뮬레이션 평가",
          "en": "Physics simulation evaluations"
        },
        "note": {
          "ko": "원래 160 + 추가 240 · 개발 60은 별도 · 한 기준 동작",
          "en": "Original 160 + additional 240 · 60 development runs separate · one reference motion"
        }
      },
      {
        "value": "0 / 8",
        "label": {
          "ko": "동결된 실제 영상의 판정 수",
          "en": "Decided frozen real-footage cases"
        },
        "note": {
          "ko": "원래 8개 모두 unknown · 사후 수정도 양성 3개 전부 거절",
          "en": "Original eight all unknown · later repair rejected all three positives"
        }
      }
    ],
    "links": [
      {
        "label": {
          "ko": "V2 영상·물리 제어 실험",
          "en": "Explore V2 perception and control"
        },
        "url": "https://relateanything-lab.vercel.app/motion/v2/",
        "kind": "demo"
      },
      {
        "label": {
          "ko": "V2 전체 보고서",
          "en": "Full V2 report"
        },
        "url": "https://relateanything-lab.vercel.app/motion/v2/report.html",
        "kind": "source"
      },
      {
        "label": {
          "ko": "새 3제어기 비교 원시 기록",
          "en": "Raw three-controller ablation"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-ablation.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "원래 160개 제어 평가",
          "en": "Original 160 controller evaluations"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-original.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "실제 영상 8개 평가",
          "en": "Eight real-footage evaluations"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/human-evaluation.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "평가 프로토콜",
          "en": "Research and evaluation protocol"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/research-protocol-v2.md",
        "kind": "source"
      },
      {
        "label": {
          "ko": "V2 논문·공식 문서",
          "en": "V2 primary research sources"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/sources-v2.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "V1 기록과 실패 사례",
          "en": "V1 record and failure cases"
        },
        "url": "https://relateanything-lab.vercel.app/motion/",
        "kind": "demo"
      }
    ],
    "sections": [
      {
        "id": "question",
        "eyebrow": "01 / PROBLEM",
        "title": {
          "ko": "보이는 동작을 비교하고, 물리 모형이 따라가게 하기",
          "en": "Compare observed motion, then make a physical model track it"
        },
        "body": [
          {
            "ko": "V1에서는 시간 정렬 비용이 작아도 실제 춤의 순서 변경·생략·정지를 놓쳤습니다. V2는 필수 단계의 순서·유지 시간·관측 가능성을 분리하고, 영상으로 만든 목표를 물리 모형에 실행하는 별도 제어 실험을 추가했습니다.",
            "en": "V1 missed reordering, omissions, and freezes in real dance despite low alignment costs. V2 separates required stage order, dwell, and observability, then adds a separate control experiment that executes video-derived targets in a physical model."
          },
          {
            "ko": "두 질문의 결과를 섞지 않았습니다. 실제 영상의 단계 판정은 모두 보류됐고, 시뮬레이션에서는 관절 상태 피드백과 사전 토크 계획의 기여를 측정했습니다. 사람이 춤을 정확히 따라 하는지와 로봇이 목표를 추종하는지는 서로 다른 검증입니다.",
            "en": "The two outcomes remain separate. All real-footage stage decisions were deferred, while simulation measured contributions from joint feedback and planned feedforward torque. Human choreography compliance and a robot model tracking its target require different evidence."
          }
        ]
      },
      {
        "id": "perception",
        "eyebrow": "02 / PERCEPTION",
        "title": {
          "ko": "낮은 정렬 비용에서, 필수 단계의 증거로",
          "en": "From low alignment cost to evidence for required stages"
        },
        "body": [
          {
            "ko": "공개 YOLO11s Pose로 관절과 신뢰도를 추출합니다. 몸통 크기와 중심을 기준으로 좌표를 정규화하고, 기준에 정의한 필수 단계마다 유효한 관측과 유지 시간을 요구합니다. 선택된 표본을 여러 단계에 재사용하지 않으며 관측 불가 표본은 유지 시간을 끊습니다. 다만 원래 구현은 샘플링 사이의 짧은 가림, 동일한 기하 자세를 가진 다른 단계 이름, 누락된 시각과 중복 ID를 완전히 처리하지 못합니다. 이 반례는 V2 보고서의 구현 감사에 공개했습니다.",
            "en": "An upstream YOLO11s Pose model extracts joints and confidence. Coordinates are normalized by torso scale and body center, and each required reference stage needs valid observations and dwell. Selected samples cannot be reused across stages, and unknown samples break dwell. The original implementation still has gaps for occlusion between samples, differently named stages with identical geometry, missing timestamps, and duplicate IDs. Counterexamples are documented in the V2 implementation audit."
          },
          {
            "ko": "기존 V1의 21개 비교는 모두 본 개발 자료로 명시했습니다. 규칙과 임계값을 고정한 뒤, 새 실제 영상의 원본·구간·AI 보조 시각 라벨을 별도로 고정하고 추론했습니다. unknown을 실패나 성공으로 바꾸어 집계하지 않습니다.",
            "en": "All 21 V1 comparisons are declared observed development data. Rules and thresholds were frozen before separately fixing the new real footage, intervals, and AI-assisted visual labels and running inference. Unknown is counted separately from success and failure."
          }
        ],
        "diagram": [
          {
            "label": {
              "ko": "기준·후보 영상",
              "en": "Reference and candidate"
            },
            "detail": {
              "ko": "원본과 시각 라벨 고정",
              "en": "Freeze sources and visual labels"
            }
          },
          {
            "label": {
              "ko": "Pose와 가시성",
              "en": "Pose and visibility"
            },
            "detail": {
              "ko": "관절 신뢰도·유효 관측",
              "en": "Joint confidence and valid observations"
            }
          },
          {
            "label": {
              "ko": "순서·유지 조건",
              "en": "Order and dwell"
            },
            "detail": {
              "ko": "모든 필수 단계의 증거",
              "en": "Evidence for every required stage"
            }
          },
          {
            "label": {
              "ko": "판정과 보류",
              "en": "Decision or abstention"
            },
            "detail": {
              "ko": "pass / fail / unknown",
              "en": "pass / fail / unknown"
            }
          }
        ]
      },
      {
        "id": "human-results",
        "eyebrow": "03 / REAL-FOOTAGE EVALUATION",
        "title": {
          "ko": "새 영상 8개 모두 보류: 기준 관측부터 실패",
          "en": "All eight new comparisons abstained: the reference was not observable"
        },
        "body": [
          {
            "ko": "새 자료는 촬영 원본 2개에서 보이는 실제 수행 3명분입니다. 연속 구간 비교 4개와 편집 대조군 4개로 총 8개를 구성했습니다. 양팔을 두 번 올렸다 내리는 순서만 평가하며, 새로운 사람 8명이나 독립 촬영 8회가 아닙니다.",
            "en": "The new material contains three visible performances from two recordings. Four contiguous-segment comparisons and four edited controls make eight cases. The contract covers raising and lowering both arms twice; these are not eight new people or eight independent recording sessions."
          },
          {
            "ko": "추론 전 초안 라벨은 양성 3개·음성 5개였습니다. 동결된 판정기는 8개 모두 reference_contract_not_observable로 unknown을 반환했습니다. 기준 pose의 가시성과 일부 짧은 핵심 구간이 요구한 증거량을 충족하지 못해, 후보가 잘 보이는 경우에도 판정하지 못했습니다.",
            "en": "Pre-inference draft labels contain three positives and five negatives. The frozen verifier returned unknown for all eight, with reference_contract_not_observable. Reference visibility and some short core intervals did not satisfy the evidence requirements, preventing decisions even when a candidate was observable."
          },
          {
            "ko": "판정률은 0/8이고, 양성 unknown 3개·음성 unknown 5개입니다. FP와 FN이 0이라는 값은 정확하다는 뜻이 아닙니다. 이 실행에서는 올바른 수행도 위반도 검출하지 못했습니다. 결과를 본 뒤의 수정은 동일 자료의 사후 개발 분석으로 분리하며 독립 검증 점수를 대체하지 않습니다.",
            "en": "Decision coverage is 0/8, with three positive and five negative unknowns. Zero false positives and false negatives do not indicate correctness: this run detected neither compliant performances nor violations. Any revision after observing these results is a post-hoc development analysis on the same data and cannot replace this evaluation."
          }
        ],
        "table": {
          "headers": [
            {
              "ko": "추론 전 초안 정답",
              "en": "Pre-inference draft label"
            },
            {
              "ko": "pass",
              "en": "pass"
            },
            {
              "ko": "fail",
              "en": "fail"
            },
            {
              "ko": "unknown",
              "en": "unknown"
            }
          ],
          "rows": [
            [
              {
                "ko": "준수 · 3개",
                "en": "Compliant · 3"
              },
              "0",
              "0",
              "3"
            ],
            [
              {
                "ko": "위반 · 5개",
                "en": "Noncompliant · 5"
              },
              "0",
              "0",
              "5"
            ]
          ]
        },
        "links": [
          {
            "label": {
              "ko": "8개 전 사례 기록",
              "en": "All eight case records"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/human-evaluation.json",
            "kind": "source"
          },
          {
            "label": {
              "ko": "자료와 라벨 검수",
              "en": "Data and annotation review"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/human-data-review.md",
            "kind": "source"
          }
        ]
      },
      {
        "id": "human-repair",
        "eyebrow": "04 / POST-HOC FAILURE",
        "title": {
          "ko": "같은 8개를 수정 후 재평가해도, 올바른 수행을 거절",
          "en": "The same eight cases still rejected correct performances after repair"
        },
        "body": [
          {
            "ko": "기준 pose를 관측하지 못한 결과를 본 뒤, 손 높이로 낮음·높음 상태를 정의하는 별도 규칙을 같은 8개 자료에 적용했습니다. 이미 결과를 본 자료의 사후 분석이며 원래 동결 평가를 대체하지 않습니다.",
            "en": "After observing the unobservable-reference result, a separate rule defined low and high arm states from hand height and was applied to the same eight cases. This is a post-hoc analysis of already observed material and does not replace the original frozen evaluation."
          },
          {
            "ko": "7/8에서 결정을 내렸지만 초안 양성 3개를 모두 틀렸다고 거절했습니다. TP 0·FN 3·TN 4·FP 0이며 음성 1개는 unknown입니다. 판정률 증가를 정확도 개선으로 표현할 수 없습니다. 실제 사람 영상을 자동으로 통과·거절하는 배포 품질은 확보하지 못했습니다.",
            "en": "Although seven of eight cases received decisions, all three draft positives were incorrectly rejected. Counts are TP 0, FN 3, TN 4, and FP 0, with one negative unknown. Higher decision coverage cannot be described as improved accuracy. The experiment did not achieve deployment quality for automatically accepting or rejecting real human performances."
          }
        ],
        "table": {
          "headers": [
            {
              "ko": "같은 자료의 초안 정답",
              "en": "Draft label on the same data"
            },
            "pass",
            "fail",
            "unknown"
          ],
          "rows": [
            [
              {
                "ko": "준수 · 3개",
                "en": "Compliant · 3"
              },
              "0",
              "3",
              "0"
            ],
            [
              {
                "ko": "위반 · 5개",
                "en": "Noncompliant · 5"
              },
              "0",
              "4",
              "1"
            ]
          ]
        },
        "links": [
          {
            "label": {
              "ko": "사후 수정 8개 원시 결과",
              "en": "All eight post-hoc repair outcomes"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/human-posthoc.json",
            "kind": "source"
          }
        ]
      },
      {
        "id": "simulation",
        "eyebrow": "05 / PHYSICS IMPLEMENTATION",
        "title": {
          "ko": "영상의 각도를 목표로, 실제 토크로 움직이기",
          "en": "Video-derived angles as targets, motor torque as the action"
        },
        "body": [
          {
            "ko": "생성 기준 영상의 어깨·팔꿈치 좌표를 영상 평면 각도로 바꾸고, 몸통을 고정한 네 개 hinge 관절에 대응시켰습니다. 평활화한 목표의 위치·속도·가속도로 명목 모델의 역동역학 토크를 미리 계산합니다. 깊이와 축 회전을 복원하는 3D 인체 모션 추정은 아닙니다.",
            "en": "Shoulder and elbow coordinates from the generated reference become image-plane angles for four hinge joints on a fixed torso. Smoothed target positions, velocities, and accelerations produce nominal inverse-dynamics torque in advance. This is not a reconstruction of full 3D human motion, depth, or axial rotation."
          },
          {
            "ko": "MuJoCo 3.13.0에서 중력·관성·감쇠가 있는 팔을 motor torque로 움직입니다. 실제 관절 상태 q·q̇는 매 물리 스텝에서 전개되며 목표 값으로 덮어쓰지 않습니다. FF+PD는 사전 토크에 encoder 오차 보정을 더하고, 모든 조건에 같은 토크 예산을 적용합니다.",
            "en": "MuJoCo 3.13.0 advances arms with gravity, inertia, and damping under motor torque. Actual q and q̇ evolve through physics steps rather than being overwritten by the target. FF+PD adds encoder error correction to planned torque, under the same torque budgets used by the comparison policies."
          },
          {
            "ko": "온라인 피드백은 이상적인 시뮬레이터 관절 센서입니다. 영상 pose는 오프라인 목표 생성에만 쓰였으며, 카메라가 로봇을 다시 관측하는 폐루프나 실제 하드웨어를 실행하지 않았습니다.",
            "en": "Online feedback comes from ideal simulated joint encoders. Video pose is used only to produce offline targets; there is no camera observing the robot in a visual feedback loop and no physical hardware execution."
          }
        ],
        "diagram": [
          {
            "label": {
              "ko": "영상 기반 목표",
              "en": "Video-derived target"
            },
            "detail": {
              "ko": "2D 어깨·팔꿈치 각도",
              "en": "2D shoulder and elbow angles"
            }
          },
          {
            "label": {
              "ko": "사전 토크 계획",
              "en": "Feedforward torque"
            },
            "detail": {
              "ko": "명목 모델의 역동역학",
              "en": "Nominal inverse dynamics"
            }
          },
          {
            "label": {
              "ko": "물리 시뮬레이션",
              "en": "Physics simulation"
            },
            "detail": {
              "ko": "4 hinge · motor torque",
              "en": "4 hinges · motor torque"
            }
          },
          {
            "label": {
              "ko": "Encoder 보정",
              "en": "Encoder correction"
            },
            "detail": {
              "ko": "같은 이득의 PD 피드백",
              "en": "PD feedback at fixed gains"
            }
          }
        ]
      },
      {
        "id": "control-results",
        "eyebrow": "06 / PAIRED CONTROLLER ABLATION",
        "title": {
          "ko": "같은 PD 이득에서 사전 토크의 기여를 분리",
          "en": "Isolate feedforward contribution at the same PD gains"
        },
        "body": [
          {
            "ko": "처음의 open-loop 비교가 약한 기준선임을 확인한 뒤, PD-only를 추가하는 사후 실험을 별도로 설계했습니다. 새 시드 200–219를 보기 전에 조건을 다시 고정하고, 4조건 × 20시드 × 3제어기의 240개 평가를 실행했습니다. 기존 160개 결과는 보존했으며 개발 60개는 평가 수에 포함하지 않았습니다.",
            "en": "After finding that the initial open-loop comparator was weak, a separate post-hoc experiment added PD-only. Its specification was frozen before observing fresh seeds 200–219, producing 240 evaluations across four conditions, 20 seeds, and three policies. The original 160 results remain intact; 60 development runs are excluded from the evaluation count."
          },
          {
            "ko": "PD-only와 FF+PD는 같은 Kp·Kd, 초기 상태, 교란, 모터 제한과 14초 예산을 사용합니다. 차이는 사전 계산 토크의 추가 여부입니다. 제어기별로 각각 최적화한 성능 경쟁이 아니라, 같은 피드백 이득에서 feedforward 항의 기여를 분리한 비교입니다.",
            "en": "PD-only and FF+PD share Kp and Kd, initial state, perturbations, motor limits, and a 14-second budget. They differ only in adding the precomputed torque. This isolates the feedforward contribution at fixed feedback gains rather than comparing independently optimized controllers."
          },
          {
            "ko": "복합 조건의 평균 RMSE는 11.656°에서 10.024°로 줄었습니다. 쌍별 감소 평균은 1.632°이며 내부 시뮬레이션 시드 부트스트랩 95% 구간은 1.299–1.964°입니다. 완료 수는 13/20에서 14/20으로 1개 차이이고, 완료율 차이 구간은 0–0.15이므로 완료 성공률이 확실히 높아졌다고 주장하지 않습니다.",
            "en": "Combined-condition mean RMSE decreased from 11.656° to 10.024°. The paired reduction is 1.632°, with an internal simulator-seed bootstrap 95% interval of 1.299–1.964°. Completion changed by one episode, from 13/20 to 14/20; its rate-difference interval is 0–0.15, so the experiment does not establish a clear improvement in completion success."
          }
        ],
        "table": {
          "headers": [
            {
              "ko": "새 시드의 조건",
              "en": "Fresh-seed condition"
            },
            "PD-only RMSE",
            "FF+PD RMSE",
            {
              "ko": "구간 완료 PD / FF+PD",
              "en": "Window completion PD / FF+PD"
            }
          ],
          "rows": [
            [
              {
                "ko": "명목 모델 + 초기 미세 오차",
                "en": "Nominal model + initial jitter"
              },
              "3.11°",
              "0.66°",
              "20/20 · 20/20"
            ],
            [
              {
                "ko": "외란 토크",
                "en": "Torque disturbance"
              },
              "3.13°",
              "0.76°",
              "20/20 · 20/20"
            ],
            [
              {
                "ko": "모터 출력 저하",
                "en": "Reduced motor gain"
              },
              "4.75°",
              "2.31°",
              "20/20 · 20/20"
            ],
            [
              {
                "ko": "출력·질량·감쇠 변화 + 외란",
                "en": "Gain, mass, damping change + disturbance"
              },
              "11.66°",
              "10.02°",
              "13/20 · 14/20"
            ]
          ]
        },
        "links": [
          {
            "label": {
              "ko": "새 240개 평가 요약",
              "en": "Fresh 240-evaluation summary"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-ablation.json",
            "kind": "source"
          },
          {
            "label": {
              "ko": "물리 제어 상세 보고서",
              "en": "Detailed control report"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-report.md",
            "kind": "source"
          }
        ]
      },
      {
        "id": "audit",
        "eyebrow": "07 / FAILURE ANALYSIS",
        "title": {
          "ko": "수치가 커 보여도, 비교 기준과 완료 정의를 확인",
          "en": "Check the comparator and completion definition behind the numbers"
        },
        "body": [
          {
            "ko": "원래 시드 100–119의 복합 조건에서 FF+PD는 8/20만 완료했고 평균 RMSE는 13.93°였습니다. 새 시드의 14/20은 다른 표본의 결과이며, 제어기를 개선해 8에서 14로 높였다는 뜻이 아닙니다. 새 평가에서도 6/20은 기준을 충족하지 못했습니다.",
            "en": "On original seeds 100–119, FF+PD completed only 8/20 combined-condition episodes with 13.93° mean RMSE. The new 14/20 result comes from different samples; it does not mean a controller change improved eight successes to fourteen. Six of twenty fresh episodes still failed the criterion."
          },
          {
            "ko": "완료는 다섯 개 고정 시간창 각각에서 네 관절 오차가 12° 이내인 상태를 0.35초 유지하는 조건입니다. 창 밖의 오차나 춤의 의미·예술성 전체를 보증하지 않습니다. 복구 시간도 허용범위 내 구간의 시작이며, 이미 범위 안인 경우의 약 1ms를 초고속 복구 성능으로 해석하지 않습니다.",
            "en": "Completion requires all four joint errors to stay within 12° for 0.35 seconds inside each of five fixed windows. It does not certify errors outside those windows or semantic and artistic dance quality. Recovery time marks the start of an in-tolerance interval; roughly 1 ms for an already-in-range case is not ultrafast recovery performance."
          },
          {
            "ko": "독립 점검에서 역동역학 토크의 순동역학 가속도 잔차는 2.84e−14였습니다. 그러나 초기 오차를 없애고 토크 한도를 ±30Nm로 넓힌 진단에서도 open-loop RMSE는 32.10°였습니다. 원래 목표 토크가 12Nm 어깨 제한을 넘는 구간도 있어, 명목 baseline의 큰 오차를 초기 0.25° 오차만의 효과로 설명하지 않습니다.",
            "en": "An independent check found an inverse-to-forward acceleration residual of 2.84e−14. Yet an exact-initial-state diagnostic with torque limits widened to ±30 Nm still produced 32.10° open-loop RMSE. Some original target torques also exceed the 12 Nm shoulder limits, so the large nominal baseline gap cannot be attributed solely to 0.25° initial jitter."
          }
        ],
        "links": [
          {
            "label": {
              "ko": "독립 구현 점검 JSON",
              "en": "Independent implementation audit"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-sanity.json",
            "kind": "source"
          },
          {
            "label": {
              "ko": "원래 160개 평가 보존본",
              "en": "Preserved original 160 evaluations"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-original.json",
            "kind": "source"
          }
        ]
      },
      {
        "id": "research",
        "eyebrow": "08 / RESEARCH AND SCOPE",
        "title": {
          "ko": "모방 학습 논문과, 이번에 실제 실행한 제어를 구분",
          "en": "Separate motion-imitation research from the controller actually executed"
        },
        "body": [
          {
            "ko": "V1의 16편 문헌 검토에 이어 V2는 TCC·LAV의 시간 정렬, FineDiving·CaptainCook4D의 단계·오류 평가, DeepMimic·AMP의 물리 모방 제어와 MuJoCo 공식 문서 등 7개 핵심 근거를 묶었습니다.",
            "en": "Following the 16-paper V1 review, V2 focuses on seven primary sources: TCC and LAV for temporal alignment, FineDiving and CaptainCook4D for stages and errors, DeepMimic and AMP for physical motion imitation, and official MuJoCo documentation."
          },
          {
            "ko": "이번 구현은 YOLO pose 추론, 직접 작성한 단계 판정, 명목 역동역학과 PD 제어입니다. TCC/LAV의 학습 가중치, DeepMimic/AMP의 강화학습 정책을 재현하거나 새 동작 정책을 학습한 것이 아닙니다.",
            "en": "The implementation uses YOLO pose inference, a custom stage verifier, nominal inverse dynamics, and PD control. It does not reproduce learned TCC/LAV representations or DeepMimic/AMP reinforcement-learning policies, and trains no new motion policy."
          },
          {
            "ko": "Physical AI 연결은 영상 관측→목표 변환→물리 행동→관절 피드백까지입니다. 몸통을 고정하고 충돌 접촉을 끈 네 팔 관절만 다뤘으므로 전신 균형·보행·접촉 조작·실제 로봇·sim-to-real 성능을 주장하지 않습니다.",
            "en": "The Physical AI connection spans video observation, target conversion, physical action, and joint feedback. It covers only four arm joints with a fixed torso and disabled collision contacts, providing no evidence for whole-body balance, locomotion, contact manipulation, real robots, or sim-to-real performance."
          }
        ],
        "links": [
          {
            "label": {
              "ko": "7개 1차 자료와 구현 경계",
              "en": "Seven primary sources and implementation boundaries"
            },
            "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/sources-v2.json",
            "kind": "source"
          },
          {
            "label": {
              "ko": "DeepMimic · SIGGRAPH 2018",
              "en": "DeepMimic · SIGGRAPH 2018"
            },
            "url": "https://xbpeng.github.io/projects/DeepMimic/",
            "kind": "source"
          },
          {
            "label": {
              "ko": "AMP · SIGGRAPH 2021",
              "en": "AMP · SIGGRAPH 2021"
            },
            "url": "https://xbpeng.github.io/projects/AMP/",
            "kind": "source"
          },
          {
            "label": {
              "ko": "MuJoCo 동역학",
              "en": "MuJoCo dynamics"
            },
            "url": "https://mujoco.readthedocs.io/en/stable/computation/index.html",
            "kind": "source"
          }
        ]
      },
      {
        "id": "viewer",
        "eyebrow": "09 / RECORDED EVIDENCE",
        "title": {
          "ko": "판정 보류와 제어 실패도 재생 가능한 기록으로",
          "en": "Replay abstentions and controller failures alongside successes"
        },
        "body": [
          {
            "ko": "공개 V2 화면은 실제 영상·저장된 pose·단계 판정과 MuJoCo의 기록된 물리 궤적을 탐색하는 뷰어입니다. Vercel에서 GPU pose 추론이나 물리 제어를 실시간 실행하지 않습니다. 시뮬레이션 영상은 기록된 qpos를 렌더링하지만 평가 당시 상태는 실제 동역학 적분으로 생성했습니다.",
            "en": "The public V2 page explores real footage, saved pose and stage decisions, and recorded MuJoCo trajectories. It does not run live GPU pose inference or physical control on Vercel. The simulation video renders recorded qpos, while the evaluated states were generated by physical integration."
          },
          {
            "ko": "기준 영상, 코드·설정 해시, 시드, 교란, 실패와 보류 결과를 함께 남깁니다. 개발에 쓴 자료, 잠근 새 평가, 결과를 본 뒤 추가한 분석을 구분해 열람할 수 있도록 했습니다.",
            "en": "Reference footage, code and configuration hashes, seeds, perturbations, failures, and abstentions accompany the results. Development data, frozen new evaluations, and analyses added after seeing results remain distinct."
          }
        ],
        "links": [
          {
            "label": {
              "ko": "V2 실험 열기",
              "en": "Open the V2 experiment"
            },
            "url": "https://relateanything-lab.vercel.app/motion/v2/",
            "kind": "demo"
          },
          {
            "label": {
              "ko": "전체 보고서",
              "en": "Full report"
            },
            "url": "https://relateanything-lab.vercel.app/motion/v2/report.html",
            "kind": "source"
          }
        ]
      }
    ],
    "decisions": [
      {
        "title": {
          "ko": "약한 기준선에서 멈추지 않기",
          "en": "Add a stronger comparator"
        },
        "body": {
          "ko": "Open-loop와의 큰 차이 뒤에 같은 이득의 PD-only를 추가해 사전 토크의 기여를 따로 측정했습니다. 추가 실험의 사후 설계와 새 시드를 기록했습니다.",
          "en": "After the large open-loop gap, a same-gain PD-only comparator isolated feedforward contribution. The post-hoc design and fresh seeds are recorded."
        }
      },
      {
        "title": {
          "ko": "판정하지 못한 결과도 보존",
          "en": "Preserve abstentions"
        },
        "body": {
          "ko": "동결된 실제 영상 8개의 unknown과 사후 수정의 양성 오거절 3개를 함께 남겼습니다. 같은 자료에서 수정한 결과는 새 독립 검증으로 부르지 않습니다.",
          "en": "The eight frozen unknowns and three false rejections after repair remain visible together. Revisions tested on the same data are not relabeled independent validation."
        }
      },
      {
        "title": {
          "ko": "실제 상태와 목표를 함께 기록",
          "en": "Record actual state alongside the target"
        },
        "body": {
          "ko": "토크 명령, 실제 관절, 목표 궤적과 외란을 분리해 저장했습니다. 물리 평가 중 목표 자세를 그대로 대입하는 재생을 사용하지 않았습니다.",
          "en": "Commands, actual joints, reference trajectories, and disturbances are stored separately. Evaluated motion was not generated by assigning target poses directly."
        }
      }
    ],
    "limitations": [
      {
        "ko": "실제 영상은 2개 촬영의 3명분 수행에서 만든 8개 비교입니다. 선택된 작은 사례 연구이며 사람 8명의 일반화 정확도가 아닙니다.",
        "en": "The eight real-footage cases derive from three visible performances in two recordings. This small selected case study is not generalization accuracy across eight people."
      },
      {
        "ko": "400개 제어 평가는 한 합성 영상 기준과 같은 4관절 모형의 내부 반복입니다. 시드별 부트스트랩 구간은 새로운 사람·동작·하드웨어의 불확실성을 나타내지 않습니다.",
        "en": "The 400 control evaluations are internal repeats of one synthetic-video reference and the same four-joint model. Seed-bootstrap intervals do not represent uncertainty across new people, motions, or hardware."
      },
      {
        "ko": "PD-only와 FF+PD는 같은 이득을 사용합니다. 각각 최적화한 제어기나 최신 학습 기반 제어에 대한 우월성 비교가 아닙니다.",
        "en": "PD-only and FF+PD share gains. This does not establish superiority over separately optimized controllers or modern learned control."
      },
      {
        "ko": "오프라인 단안 2D 목표, 이상적인 encoder, 고정 몸통과 비활성 충돌입니다. 실시간 카메라 폐루프·균형·현실 전이는 실행하지 않았습니다.",
        "en": "Targets are offline monocular 2D estimates, with ideal encoders, a fixed torso, and disabled collisions. Live visual feedback, balance, and real-world transfer were not executed."
      },
      {
        "ko": "DVIDS 공개 영상과 Taco Fleur의 Commons 영상(CC BY-SA 4.0)을 출처·변경 사항과 함께 사용했습니다. DVIDS 자료는 기관의 보증을 뜻하지 않습니다. 원래 Floss 자료는 LittleT889의 CC BY-SA 4.0이며, 제어 기준과 V1의 별도 안무는 Higgsfield 생성 자료입니다.",
        "en": "DVIDS public footage and Taco Fleur’s Commons footage (CC BY-SA 4.0) retain source and adaptation notices. DVIDS material implies no institutional endorsement. Original Floss footage is by LittleT889 under CC BY-SA 4.0; the control reference and separate V1 choreography are Higgsfield-generated."
      }
    ]
  },
  "archive": {
    "id": "motion-check",
    "title": "MotionCheck Lab",
    "summary": {
      "ko": "영상에서 추출한 목표를 MuJoCo의 4관절 팔로 실행하고 관절 피드백으로 보정했습니다. 400개 물리 평가에서 제어 항목을 분리해 비교하고, 실제 영상의 전부 보류·사후 오거절 결과까지 공개합니다.",
      "en": "Video-derived targets drive four arm joints in MuJoCo with joint feedback. The case isolates controller contributions across 400 physical simulations and reports both total abstention and post-hoc false rejections on real footage."
    },
    "category": "ai",
    "status": {
      "ko": "PHYSICAL AI / 지각·물리 제어",
      "en": "PHYSICAL AI / PERCEPTION + CONTROL"
    },
    "period": "2026.09",
    "image": "assets/motion-control.jpg",
    "imageAlt": {
      "ko": "같은 토크 계획을 사용하는 open-loop와 encoder 피드백의 MuJoCo 팔 모형 비교. 초록색은 실제 물리 상태, 주황색은 영상에서 만든 목표.",
      "en": "MuJoCo arms comparing open-loop replay and encoder feedback with the same torque plan. Green shows physical state; orange shows the video-derived target."
    },
    "imageWidth": 1280,
    "imageHeight": 720,
    "live": true,
    "caseId": "motion-check",
    "stack": [
      "Python",
      "YOLO11s Pose",
      "CUDA",
      "MuJoCo",
      "Inverse dynamics",
      "PD control",
      "Vercel"
    ],
    "links": [
      {
        "label": {
          "ko": "V2 영상·물리 제어 실험",
          "en": "Explore V2 perception and control"
        },
        "url": "https://relateanything-lab.vercel.app/motion/v2/",
        "kind": "demo"
      },
      {
        "label": {
          "ko": "V2 전체 보고서",
          "en": "Full V2 report"
        },
        "url": "https://relateanything-lab.vercel.app/motion/v2/report.html",
        "kind": "source"
      },
      {
        "label": {
          "ko": "새 3제어기 비교 원시 기록",
          "en": "Raw three-controller ablation"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-ablation.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "원래 160개 제어 평가",
          "en": "Original 160 controller evaluations"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/control-original.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "실제 영상 8개 평가",
          "en": "Eight real-footage evaluations"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/human-evaluation.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "평가 프로토콜",
          "en": "Research and evaluation protocol"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/research-protocol-v2.md",
        "kind": "source"
      },
      {
        "label": {
          "ko": "V2 논문·공식 문서",
          "en": "V2 primary research sources"
        },
        "url": "https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/sources-v2.json",
        "kind": "source"
      },
      {
        "label": {
          "ko": "V1 기록과 실패 사례",
          "en": "V1 record and failure cases"
        },
        "url": "https://relateanything-lab.vercel.app/motion/",
        "kind": "demo"
      }
    ],
    "limitations": {
      "ko": "400개 시뮬레이션 평가 · 실제 영상 판정은 보류·오거절 한계 · 기록 뷰어",
      "en": "400 simulation evaluations · real-footage abstention and false-rejection limits · recorded viewer"
    }
  },
  "liveUrl": "https://relateanything-lab.vercel.app/motion/v2/"
};
});
