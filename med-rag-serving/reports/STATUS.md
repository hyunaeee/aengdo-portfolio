# Evidence status — 2026-09-10

| 항목 | 상태 |
|---|---|
| Python stdlib 구현 및 CPU 계약/HTTP protocol 시험 | Python 3.12.14에서 25개 통과 |
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

검증 명령: `python -m unittest discover -s tests -v`, `python -m serving_lab cpu-demo --out artifacts/verified-cpu-20260910`. 후자는 good gate pass, bad candidate release blocked, `gpu_executed=false`, `network_called=false`를 반환했습니다. CI workflow는 준비했으며 원격 GitHub Actions 실행 결과를 아직 확인하지 않았습니다.
