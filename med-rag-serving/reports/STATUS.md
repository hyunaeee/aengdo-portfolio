# Evidence status — 2026-09-14

[실행 기록 탐색](https://hyunaeee.github.io/aengdo-portfolio/work/serving-lab/) · [원본 기록과 재현 설명](rehearsal/README.md)

| 항목 | 상태 |
|---|---|
| Python stdlib 구현 및 CPU 계약/HTTP protocol 시험 | Python 3.12.14에서 31개 통과 |
| 실제 gateway + 합성 upstream HTTP | 14개 시나리오 계약 확인; 요청 10건, 완료 6건, 429 1건, 주입 오류 3건 |
| Readiness·deadline·stream 중단 | 503 / 504 / missing_done 확인 |
| 장애 해제 후 응답과 슬롯 반환 | 정상 SSE 200, 마지막 inflight 0 |
| Gateway /metrics | 실제 HTTP 응답 카운터 캡처; Prometheus scrape와 별도 |
| good fixture pass / bad candidate release 차단 | CPU에서 검증 |
| 실험별 불변 model·tokenizer·image pin 입력 방법 | 구현, 실제 live pin 미확정 |
| Docker Compose / GPU architecture 호환성 | `docker compose config` 격리 설정 검사 통과; 컨테이너 실행·GPU 호환성 미검증 |
| GPU streaming inference, TTFT/TPOT/goodput | **NOT RUN / null** |
| GPU 메모리·utilization·전력 | **NOT MEASURED / null** |
| 독립 heldout 모델 품질·검색 품질 | **NOT EVALUATED** |
| Prometheus 실제 scrape·경보 firing | **NOT RUN** |
| 실제 배포 교체·rollback 중단시간 | **NOT RUN / null** |
| 비용·GPU 임대 사용량 | GPU/API 작업 없음; 비용 성능 측정 없음 |

공개할 수 있는 설명: “MED-RAG의 인용·과잉 거부 실패를 배포 전 검증으로 연결하는 serving lab을 만들고, 재현 manifest와 raw streaming 측정, gate 기반 release 준비를 CPU에서 검증했습니다. 실제 GPU serving 실험은 다음 단계입니다.”

공개하면 안 되는 설명: “GPU serving 최적화 달성”, “무중단 rollback 검증”, “실제 모델 품질 100%”, “GPU 1초 처리량” 등 CPU fixture에서 유추한 주장.

현재 RTX4090 회의 어시스턴트 운영과 초기 RTX5090 MED-RAG 로컬 실행 이력은 별도 프로젝트의 사용자 확인 정보입니다. 이 serving lab의 GPU 검증 결과로 합치지 않습니다. `artifacts/*simulated*`는 검사 입력과 예상 결과를 담은 CPU fixture이며 성능 자료가 아닙니다.

검증 명령: `python -m unittest discover -s tests -v`, `python -m serving_lab rehearsal --out artifacts/new-rehearsal`. 새로운 loopback rehearsal은 실제 gateway 제어 로직과 품질·릴리스 계약 14개를 확인합니다. 고정 합성 응답과 원본 재계산을 사용하며, 이벤트 시각은 모델 성능 수치가 아닙니다. 장애 해제 후 응답 복원을 검증한 것이며 실제 배포 롤백은 수행하지 않았습니다.

Python 3.11/3.12 GitHub Actions가 테스트, 고정 CPU controls와 loopback rehearsal을 실행하고 결과를 artifact로 저장하도록 연결했습니다. 공개 포트폴리오의 2026-09-11 CI는 성공했으며, 후속 실행은 [workflow 기록](https://github.com/hyunaeee/aengdo-portfolio/actions/workflows/serving-lab.yml)에서 확인할 수 있습니다.
