# MED-RAG Serving Lab

**CPU에서 검증한 LLM serving / MLOps 실행 기반입니다. 실제 GPU serving, 성능 개선, 운영 롤백은 아직 측정하지 않았습니다.** 기존 `med-rag-vertex`의 근거 기반 응답과 `med-rag-tune`의 과잉 거부 실패를, 배포 전에 확인할 수 있는 실험으로 연결합니다.

현재 RTX4090 회의 어시스턴트 운영과 MED-RAG 초기 RTX5090 로컬 실행은 사용자에게 확인된 별도 이력입니다. 이 디렉터리의 코드는 그 서버를 조회·수정하거나 GPU를 사용하지 않았습니다. 아래 GPU 단계는 사용 가능한 장치를 확인한 뒤 별도로 실행합니다.

## 바로 확인하기 — CPU만 사용

Python 3.11 이상, 외부 Python 패키지 불필요:

```sh
cd med-rag-serving
python -m unittest discover -s tests -v
python -m serving_lab cpu-demo --out artifacts/local-simulated
```

`cpu-demo`는 네트워크 없이 12개 공개 합성 사례에 준비된 답을 넣습니다. 정상 fixture는 통과하고, 존재하지 않는 인용과 답할 수 있는 질문의 거부를 넣은 candidate는 release 디렉터리가 생성되기 전에 차단됩니다. 실행 결과는 `demo-result.json`, `good.gate.json`, `bad.gate.json`에서 볼 수 있습니다. 출력 경로는 새 디렉터리여야 합니다.

demo의 숫자는 **측정값이 아닌 코드 검사용 값**이며 모든 파일에 `simulated-cpu`가 붙습니다. fixture manifest는 live inference 설정 내보내기와 실제 배포 기록에 사용할 수 없습니다. CI도 CPU unit test와 이 demo만 수행하며 Docker, 모델 다운로드, API inference는 수행하지 않습니다.

## 구현된 경계

| 구성 | 하는 일 | 현재 증거 |
|---|---|---|
| Manifest lock | 모델·tokenizer commit, 이미지 digest, prompt·dataset·Python/Compose runtime hash 고정 | CPU에서 hash/변조 검사 |
| Quality gate | 인용 존재, 인용 없는 사실 답변, 조작된 직접 인용, 기대 사실 누락, 과잉 거부·무근거 응답 검사 | 공개 합성 12건과 good/bad fixture |
| Streaming client | 실제 SSE 도착 시각, TTFT/TPOT/e2e, usage token 수, 오류, request별 raw JSONL | localhost 가짜 HTTP 서버 protocol 시험 |
| Gateway | readiness 및 manifest 식별, 최대 동시 요청, 429, deadline, stream 취소 연결 정리 | 구현 완료, GPU backend 통합 미실행 |
| Release | 응답과 raw benchmark를 재계산해서 gate 통과한 artifact만 불변 경로에 준비 | CPU에서 bad candidate·변조·중복 생성 차단 |
| Rollback | 검증된 previous artifact 확인, 수동 교체 절차, readiness 후 배포 상태 기록 | 구현 완료, 실제 중단시간 미측정 |
| 관측 | vLLM/gateway Prometheus scrape와 경보 규칙 | 설정 준비, 실제 scrape·경보 미실행 |

로컬 검증은 Python 3.12.14에서 25개 시험이 통과했습니다. Docker CLI가 있으면 unit test가 `docker compose config`로 localhost 포트·GPU UUID·image digest 설정도 파싱합니다. 이미지 pull이나 컨테이너 실행을 하지 않습니다. Docker CLI가 없으면 이 설정 시험만 skip합니다.

상세 순서와 중단 조건은 [RUNBOOK.md](RUNBOOK.md), 현재 공개 가능한 주장 범위는 [reports/STATUS.md](reports/STATUS.md), 측정 양식은 [reports/EXPERIMENT_TEMPLATE.md](reports/EXPERIMENT_TEMPLATE.md)에 있습니다.

## 실제 엔드포인트 실험

아래 명령은 **향후 실행 예시**입니다. 현재 기본 manifest는 의도적으로 미해결 pin과 빈 SLO를 포함하고 있어 배포 검증에 실패합니다.

1. [Qwen 모델 commit](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/commits/main)의 전체 40자리 commit과 검증한 컨테이너 tag의 registry digest를 확인합니다. `latest`, `main`, 움직이는 tag만으로 실행하지 않습니다. `docker buildx imagetools inspect <검증할-tag>` 출력과 OS/architecture를 저장하고, 실제 실행한 image ID/RepoDigests도 보관합니다. 이 확인/다운로드는 CPU demo에 포함되지 않습니다.
2. `lock`에 그 값을 전달합니다. 문법과 로컬 내용 hash 검사는 자동화되어 있지만, remote pin 존재·공급망 신뢰·RTX5090/CUDA 호환성은 이 도구가 대신 증명하지 않습니다.

```sh
python -m serving_lab lock --out experiments/baseline --revision FULL_40_HEX_COMMIT --tokenizer-revision FULL_40_HEX_COMMIT --vllm-image vllm/vllm-openai@sha256:VERIFIED_DIGEST --python-image python@sha256:VERIFIED_DIGEST --prometheus-image prom/prometheus@sha256:VERIFIED_DIGEST
python -m serving_lab validate-manifest experiments/baseline/manifest.json
python -m serving_lab export-env --manifest experiments/baseline/manifest.json --gpu-device-uuid CONFIRMED_IDLE_GPU_UUID --out experiments/baseline/lab.env
```

명령의 대문자 placeholder는 실제 검증값으로 교체해야 합니다. `lock`은 runtime도 실험 안에 복사합니다. 이후 해당 복사본의 Compose를 실행해야 구현·설정 hash가 실험과 일치합니다.

```sh
docker compose --project-name medrag-serving-lab --env-file experiments/baseline/lab.env -f experiments/baseline/runtime/compose.yaml config
# 사용 가능한 GPU, 비용·시간 한도와 별도 운영 경계를 확인한 후에만:
docker compose --project-name medrag-serving-lab --env-file experiments/baseline/lab.env -f experiments/baseline/runtime/compose.yaml up --build -d engine gateway
python -m serving_lab health --execute
python -m serving_lab capture-eval --manifest experiments/baseline/manifest.json --out artifacts/baseline-quality --execute
python -m serving_lab benchmark --manifest experiments/baseline/manifest.json --out artifacts/baseline-c1 --requests 100 --concurrency 1 --warmup 2 --execute
```

실험은 `127.0.0.1:18080` gateway를 사용하고 engine 포트는 Docker 내부에서만 노출합니다. 외부 endpoint는 `--allow-remote`까지 명시해야 합니다. HTTPS 또는 SSH tunnel을 사용하세요. gateway 자체는 공개 다중 사용자 서비스용 인증·rate limit·프록시가 아닙니다. gateway의 `--execute` 없는 서버 실행은 프로세스만 시작하며 GPU 엔진을 생성하지 않습니다. 모델 다운로드는 Compose를 실제로 시작할 때 발생할 수 있습니다.

기본 설정은 Qwen2.5-7B-Instruct BF16, context 2048, engine concurrency 4, memory fraction 0.7, prefix cache 켜짐입니다. GPU 적합성을 보장하는 값이 아닙니다. NF4 QLoRA 학습 이력과 이 BF16 baseline은 서로 다른 설정입니다. LoRA 동적 로딩과 quantization 후보는 기본 GPU 검증 이후 별도 manifest·artifact로 추가합니다.

gateway는 시작 시 Compose가 engine 명령과 image에 사용하는 동일 변수(model/tokenizer revision, precision, context·concurrency·memory, image digest)를 manifest와 대조합니다. 누락·불일치, 실행 중인 Python 코드와 frozen runtime의 불일치는 시작을 차단합니다. 독립적으로 gateway를 실행해도 이 환경값이 필요합니다. 이 검사는 표준 Compose 경로의 설정 불일치를 막으며 실제 Docker image ID·weights 원격 attestation을 대체하지 않습니다.

## 측정과 승격 규칙

- TTFT는 client가 요청을 시작한 시각부터 첫 비어 있지 않은 `delta.content`까지입니다. role, heartbeat와 usage frame은 token으로 세지 않습니다.
- TPOT는 `(마지막 content 도착 − 첫 content 도착)/(최종 서버 completion_tokens − 1)`입니다. SSE chunk 수를 token 수로 바꾸지 않습니다. 여러 token이 한 chunk로 묶이면 client 관측 TPOT의 한계가 있으므로 vLLM server 지표와 함께 해석합니다. usage가 없거나 출력이 1 token이면 TPOT는 `null`입니다.
- e2e는 요청 시작부터 정상 `[DONE]` 수신까지입니다. 끝이 끊긴 stream, deadline 초과, 다른 모델/manifest, HTTP 오류는 실패입니다. p95는 성공 측정 20개 미만이면 `null`입니다.
- goodput은 사전에 고정한 TTFT/TPOT/e2e SLO를 모두 만족한 요청 수/전체 wall time입니다. 비율의 분모는 **실패와 client admission drop을 포함한 모든 요청**입니다. token usage가 없는 요청은 SLO 통과로 처리하지 않습니다.
- `--rate`를 생략하면 bounded closed-loop입니다. 지정하면 일정 도착률을 시도하고 client concurrency 초과는 raw JSONL의 명시적 drop으로 기록합니다. 이를 서버 429와 구분해서 봅니다. 도중 종료된 실행에는 완성 보고서가 없으며 release 근거가 될 수 없습니다.
- 현재 workload는 짧고 반복되는 공개 smoke 사례입니다. prefix cache와 반복 입력으로 인한 warm-cache 결과를 일반 RAG 성능으로 주장하면 안 됩니다. 실험 확장 시 길이 구간별 합성 context와 요청 순서를 고정해 별도 manifest를 만듭니다.
- 공개 gate는 regex와 기대 문자열로 확인하는 **기계적 계약 검사**입니다. 임상 정확성, 문장 전체 근거성, 실제 검색 성능, 독립 heldout 일반화는 증명하지 않습니다. 새 평가셋을 만들고 사람 검토를 병행해야 합니다.

pilot 뒤 SLO를 고정하면 manifest hash가 달라집니다. 새 hash로 gateway를 다시 만들고 최종 quality/benchmark를 다시 수집합니다. 최종 artifact 준비:

```sh
python -m serving_lab prepare-release --manifest experiments/baseline/manifest.json --responses artifacts/baseline-quality/responses.jsonl --raw artifacts/baseline-c1/benchmark.raw.jsonl --benchmark artifacts/baseline-c1/benchmark.json --out releases
```

이 명령은 GPU 서비스를 교체하지 않습니다. gate 결과의 `pass` 문자열을 신뢰하지 않고 원본 응답과 raw benchmark를 다시 검사합니다. 모델·tokenizer·runtime·데이터·SLO가 바뀌면 다른 manifest입니다. 보관 파일 hash는 재현·변조 감지용이며 임의 편집 가능한 로컬 결과를 외부 서명된 GPU 증거로 만들지는 않습니다.

배포 이후 `/ready`가 해당 release manifest와 모델을 보고할 때만 `record-deployment --release ... --state deployment-state.json --execute`를 실행합니다. `rollback-plan --state deployment-state.json`은 이전 검증 artifact를 확인하고 교체 절차를 출력합니다. 단일 GPU 교체에는 중단이 있을 수 있으며 실제 중단시간을 별도로 측정합니다.

vLLM의 [공식 Docker 실행 방식](https://docs.vllm.ai/en/stable/deployment/docker/), [benchmark CLI의 latency·goodput 정의](https://docs.vllm.ai/en/stable/cli/bench/serve/), [Prometheus metrics](https://docs.vllm.ai/en/stable/design/metrics/)를 참고했습니다. 실제 고정 버전에 맞는 flag와 metric 이름을 실행 전에 확인합니다.
