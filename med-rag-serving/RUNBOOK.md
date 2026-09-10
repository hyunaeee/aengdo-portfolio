# 단계별 실행·중단 절차

현재 단계는 **CPU 검증 완료, GPU 미실행**입니다. 현재 RTX4090 회의 어시스턴트를 변경하지 않습니다. MED-RAG 초기 RTX5090 실행 이력만으로 지금 그 장치를 사용할 수 있다고 가정하지 않습니다.

## 0. 비용과 장치 확정

소유자가 확인한 idle GPU UUID, 사용 시간대, OS(권장 별도 Linux/검증된 WSL2 환경), driver/CUDA 호환성, 실제 VRAM, 허용 메모리/온도/전력 경계, 종료 시각을 기록합니다. `nvidia-smi -L`, 선택한 UUID의 query 출력과 기존 GPU 프로세스 목록은 향후 실행자가 직접 확인합니다. 기존 서비스가 점유한 GPU라면 여기서 멈춥니다.

자체 장치의 첫 pilot은 다운로드 완료 후 10분 이내·동시 요청 1·최대 출력 128 token으로 시작합니다. 임대가 필요하면 **요율×사용시간 + 저장·전송 비용** 한도를 먼저 정하고 한 세션 단위로 종료·청구를 확인합니다. 현재 가격, 크레딧, 가용 GPU를 이 문서가 가정하지 않습니다. 자동 임대/추가 구매/재시도 반복은 없습니다.

실행자 기록: 날짜 / 선택 UUID / GPU명·VRAM / 사용 허가된 시간 / 과금 방식·상한 / 종료 담당자 / 기존 서비스와의 분리 근거. 공개 증거에는 불필요한 사용자명·서버 경로·UUID 전체를 가립니다.

## 1. CPU 계약 검증

README의 unit test와 `cpu-demo`를 실행합니다. good fixture 통과와 bad fixture 차단이 모두 필수입니다. 모델 pin, prompt, dataset, runtime hash의 변조 검사도 통과해야 합니다. 여기서 나오는 benchmark 수치는 모두 가짜 입력이며 포트폴리오 성능 그래프에 사용하지 않습니다.

새 독립 평가셋은 기존 튜닝·회귀셋과 중복을 확인한 후 작성하고 검토자/작성일/hash를 남깁니다. 공개 smoke 12개는 시험 도구 검증용입니다. 이 도구는 제공된 context 이후의 generation을 평가하므로 retriever 평가와 분리합니다. 병원 데이터·실제 환자정보를 public corpus에 넣지 않습니다.

## 2. Pin·환경·pilot

모델 commit과 tokenizer commit, 실제 검증할 vLLM/Python/Prometheus 이미지 digest를 확정하고 `lock`을 실행합니다. model card 라이선스와 선택 GPU에 필요한 CUDA/architecture 지원은 해당 버전 공식 자료로 확인합니다. `latest`는 최종 manifest에 허용되지 않습니다.

`export-env`는 GPU UUID를 명시적으로 받습니다. 생성된 env와 **실험 내부 `runtime/compose.yaml`**로 `docker compose ... config`를 확인합니다. project name은 `medrag-serving-lab`, host port는 기본 18080, engine 포트는 내부 전용입니다. 다른 서비스와 같은 project name/port/GPU를 쓰지 않습니다. `config`가 통과해도 실행·호환성을 증명하지 않습니다.

사용 가능한 장치를 확인한 뒤 수동으로 engine/gateway만 올립니다. 실행한 이미지 ID, vLLM 버전, command/Compose 출력, driver 정보, 시간대·timezone, GPU 메모리와 utilization 기준선을 보관합니다. UUID나 호환성이 틀리면 종료합니다. 실제 OOM을 유도하며 memory fraction을 맞추지 않습니다.

`health --execute` 다음 `benchmark --requests 5 --concurrency 1 --warmup 1 --timeout 15 --max-tokens 128 --execute`로 pilot을 수행합니다. 기본 admission은 4이며 초과 요청에는 429가 나옵니다. gateway `/ready`는 health와 모델 식별 검증이고, warmup generation 성공은 별도 기준입니다.

## 3. SLO 고정·품질·재현 측정

pilot을 본 뒤 제품 상황에 맞는 TTFT/TPOT/e2e ms 임계값과 허용 오류율을 정합니다. `slo.calibrated=true`와 이유를 기록하고 `validate-manifest`를 실행합니다. 이전 pilot 결과에 새 hash를 덮어쓰지 않습니다. gateway가 새 manifest를 읽도록 이 **실험만** 재생성하고 새 결과를 수집합니다.

1. `capture-eval` 전체 사례를 실행합니다. 기계적 gate가 실패하면 원인을 확인하고 후보를 보류합니다. 결과를 보고 gate를 느슨하게 고쳐 통과시키지 않습니다.
2. 최종 baseline은 고정 workload·precision·context/output cap·cache 상태에서 최소 100 완료 요청, 동시성 1로 수집합니다. 현재 기본 error budget 1%, goodput ratio 95%, overrefusal 0%는 계획 값이며 사용 목적에 맞게 사전 확정합니다.
3. 같은 workload에서 concurrency 2, 4를 각각 독립 디렉터리에 측정합니다. engine admission을 넘는 실험은 overload 단계에서만 합니다. 개선 후보는 하나의 변수만 바꾸고 새로운 manifest와 runtime hash를 만듭니다.
4. burst/도착률 시험에서는 `--rate`와 client `--concurrency`를 함께 기록합니다. client drop과 server 429를 분리합니다. 실패를 제외한 latency만 보지 말고 전체 오류율·goodput을 같이 비교합니다.
5. 반복 합성 자료의 prefix cache 효과를 표시합니다. 대표 길이별 context와 출력 분포를 별도로 설계하고, cold/warm 상태를 혼합하지 않습니다. 현재 max-output cap을 실제 출력 token 수라고 쓰지 않습니다.

각 실행의 raw JSONL, report, prompt·dataset·runtime이 포함된 manifest, 실행 명령, 실제 환경 capture, GPU 시계열을 함께 보관합니다. token usage가 없으면 token throughput/TPOT를 추정하지 않습니다. 단일 응답 1 token에는 TPOT가 정의되지 않습니다. 기존 Vertex의 49.44 tokens/s는 여러 단계의 cloud API 전체 요청 수치이므로 이 GPU decode 결과의 baseline으로 사용하지 않습니다.

## 4. 관측·실패 실험

같은 frozen Compose에 `--profile observability`를 명시해서 Prometheus를 올리고 `127.0.0.1:19090`에서 두 target의 scrape를 확인합니다. 현재 경보는 Prometheus rule이며 외부 알림 수신자/Alertmanager는 구성하지 않았습니다. 첫 유효 scrape 및 실제 firing 시각을 관찰해야 탐지시간을 주장할 수 있습니다.

vLLM metric 이름은 고정 버전의 `/metrics` 원문에서 먼저 확인합니다. 최소 대상은 running/waiting 요청, KV cache 사용량, prefix cache hit/query, TTFT/queue/e2e histogram, prompt/generation token 수입니다. gateway는 inflight, rejected, completed, upstream errors, disconnects를 내보냅니다. GPU 전체 메모리·utilization은 별도 선택 장치의 nvidia-smi/DCGM 수집으로 기록하고 관측 sampling interval을 남깁니다.

| 제한된 실험 | 수행 | 중단·복구 확인 |
|---|---|---|
| 과부하 | 별도 lab에서 짧은 bounded rate로 admission 초과 | 429/client drop·queue 증가 구분, 부하 종료 후 기준선 회복 |
| 취소 | 합성 요청 1개를 client deadline으로 조기 종료 | gateway upstream 연결 종료 후 engine running/KV 메모리가 실제 회복하는지 확인 |
| backend 부재 | **해당 Compose project의 engine만** 수동 중지 | `/ready` 실패, upstream 오류, Prometheus unavailable 경보를 확인하고 같은 pinned engine 재시작 |
| bad candidate | CPU bad fixture gate 실행 | release 경로 미생성, current deployment state 불변 |

운영 RTX4090 또는 공유 클러스터에 장애를 주입하지 않습니다. GPU OOM/driver reset/전원 차단 실험은 이 단계 범위 밖입니다. 예상보다 높은 메모리·열·전력, 기존 서비스 영향, 비용/시간 상한 도달 시 즉시 해당 lab의 새 요청을 중단하고 실험을 종료합니다. 종료로 인한 실패도 raw 결과에서 지우지 않습니다.

## 5. 준비·수동 교체·롤백

`prepare-release`에 같은 manifest의 eval 응답과 benchmark raw/report를 전달합니다. gate·hash·SLO·표본 수를 다시 확인한 뒤 `releases/<manifest-sha>/`에 복사합니다. **준비는 배포가 아닙니다.** `release.env`의 UUID placeholder를 그대로 실행하면 안 됩니다. `export-env --manifest releases/<sha>/manifest.json --gpu-device-uuid <검증 UUID> --out releases/<sha>/deploy.env`로 실제 lab env를 별도 생성합니다.

처음 배포는 이전 release가 없어서 rollback이 불가능합니다. pinned 이미지와 weights를 local cache에 유지하고, 첫 안정 baseline을 기록한 뒤 두 번째 release에서 rollback을 연습합니다. registry나 모델 cache를 지우면 복구시간과 네트워크 비용이 달라집니다.

교체 전 새 요청을 멈추고 실험 시작 시각을 기록합니다. 같은 isolated project를 해당 release의 runtime/compose와 deploy.env로 교체하고 `/ready`, 모델·manifest 일치, 합성 warmup을 확인합니다. `record-deployment --release releases/<sha> --state deployment-state.json --execute`로 current/previous를 원자적으로 기록합니다. gateway identity는 설정 연결 근거이며 모델 weights를 원격 증명하는 attestation은 아닙니다.

장애 시 `rollback-plan --state deployment-state.json`으로 previous artifact를 검증하고 그 runtime/compose + 이전의 검증된 deploy.env를 사용해 동일 lab project를 되돌립니다. 출력되는 `release.env`는 준비 시 placeholder가 포함될 수 있으므로 실제 사용했던 deploy.env를 확인합니다. 엔진 준비와 합성 응답을 확인한 뒤 이전 release를 다시 기록합니다. 복구 중 service unavailable이 발생할 수 있으므로 incident 시작/탐지/조치/ready/첫 정상 generation/부하 정상화를 각각 기록합니다.

## 6. 완료 조건

포트폴리오에 실제 LLM serving 실험 완료라고 쓰려면 실제 GPU 환경 capture, 독립 실행 가능한 manifest, raw 요청별 결과, 사전 고정한 품질·SLO gate, 실패 후보 차단 증거, 정상 release 교체 및 rollback timeline, 관측 스냅샷과 한계 분석이 모두 필요합니다. 수치가 개선되지 않아도 실패 원인과 선택 근거를 보고합니다. 이 증거가 쌓인 뒤에만 K8s/MLflow나 다중 GPU 운영으로 확장합니다.
