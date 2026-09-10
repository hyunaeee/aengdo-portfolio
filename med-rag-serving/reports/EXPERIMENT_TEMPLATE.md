# GPU experiment record — NOT RUN

빈칸을 추정값으로 채우지 않습니다. 실행 전 계획 값과 실행 후 측정값을 별도 칸에 기록합니다.

| 항목 | 실행 전 계획 | 실행 후 증거 |
|---|---|---|
| 실험 ID / manifest SHA | 미정 | null |
| baseline / candidate의 단일 변경점 | 미정 | null |
| 장치·VRAM·driver·OS·image digest | 미확정 | null |
| 모델·tokenizer commit·precision | 미확정 | null |
| workload hash·길이 분포·cache 상태 | 미정 | null |
| warmup / concurrency / rate / 표본 수 | 미정 | null |
| TTFT / TPOT / e2e SLO | 미정 | null |
| 품질 gate / 과잉 거부 / 인용 실패 | 계획 기준만 설정 | null |
| p50/p95 TTFT·TPOT·e2e | 측정 예정 | null |
| 요청 오류 / server 429 / client drop | 측정 예정 | null |
| request goodput / output tokens/s | 측정 예정 | null |
| peak VRAM / utilization / sampling interval | 측정 예정 | null |
| 비용 상한 / 실제 비용 / 산식 | 미정 | null |
| raw JSONL·환경 capture·관측 링크 | 저장 경로 계획 | null |

결정: 보류 / 채택 / 개선 없음. 이유와 실패 사례: 미작성.

## Incident timeline — NOT RUN

시나리오·예상 영향·중단 조건·복구 담당자를 실행 전에 기록합니다.

| 이벤트 | UTC timestamp | 증거 |
|---|---|---|
| 실험 시작 / 마지막 정상 응답 | null | null |
| 장애 주입 | null | null |
| 최초 readiness 실패 | null | null |
| 최초 관측 경보 firing | null | null |
| 복구 조치 시작 | null | null |
| engine ready / 첫 정상 generation | null | null |
| 정상 부하 및 메모리 기준선 회복 | null | null |

실제 탐지시간·사용자 영향·복구시간·실패 요청 수: null. 단일 GPU의 중단시간을 0으로 가정하지 않습니다.
