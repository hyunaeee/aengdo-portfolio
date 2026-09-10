# Hyunae Park — 목표 공고에 맞춘 GitHub·MLOps 포트폴리오 계획

작성: 2026-09-10 · 상태: 사이트·문서·CPU 실험 기반 구현, GPU 실측 대기 · 대상: 토스 / Motif / Cohere

## 실행 현황

- 사용자 확인: 회의 어시스턴트는 현재 RTX 4090에서 운영 중이며 MED-RAG는 초기에 로컬 RTX 5090으로 실행했다. 두 이력과 공개 QLoRA의 RTX 4090 학습 기록은 구분한다.
- `med-rag-serving/`에 manifest, 합성 데이터 품질 gate, SSE 부하 측정, gateway, Compose, 관측 설정, release 준비와 수동 rollback 절차를 구현했다. CPU 시험 25개 통과. 실제 GPU inference·성능·알림·복구 시간은 미측정이다.
- Terracotta CI·D1 복원·암호화 키·HTTP 504 fallback·healthcheck 검증을 로컬 커밋으로 준비했다. 로컬 14개 시험과 lint 통과. 원격 CI·새 이미지 실행은 미확인이다.
- 프로필과 CTR-CVR README의 코드·공개 범위 정정은 로컬 커밋으로 준비했다. 원격 게시 명령이 자동 승인 검토에서 거절되어 재시도하지 않았으며, 사용자에게 게시 범위의 명시적 승인을 요청할 예정이다.
- 한·영 웹 사례와 지원 회사별 PDF가 같은 콘텐츠를 사용한다. 실제 GPU 측정은 현재 회의 서비스와 분리된 실행 환경이 확정된 뒤 진행한다.

## 1. 방향

공통 정체성은 **업무 문제를 AI 제품으로 구현하고, 평가·배포·운영까지 책임지는 엔지니어**로 잡는다. 현재 공개 근거는 RAG 평가, 에이전트 구성, 제품 구현과 컨테이너 배포에 있다. 다음 보강은 모델 변경의 검증부터 실제 GPU 서빙·복구까지 이어지는 하나의 사례다.

이번 확인 범위는 GitHub 프로필 원본, 공개 저장소 목록, 주요 저장소의 README·코드·설정·평가 산출물과 Terracotta의 Actions 실행 기록이다. 전체 저장소를 설치하거나 실행 검증한 것은 아니다. 공개 파일에서 확인하지 못한 역량을 본인의 경험 부재로 단정하지 않는다.

## 2. 세 공고가 요구하는 서로 다른 증거

| 회사·정확한 직무 | 공고의 중심 | 포트폴리오에서 앞에 둘 근거 |
|---|---|---|
| 토스 — AI Platform Engineer (Serving) | vLLM·Dynamo·Triton 등 서빙 운영, GPU/LLM 동작 이해, 추론 성능·자원 효율·모니터링·장애 대응 | 실제 GPU 부하 실험, 병목 분석, 지연 목표를 만족하는 처리량, 실패한 배포 복구 |
| Motif — Applied AI Engineer | 프론트부터 백엔드까지 LLM 제품 구현, RAG·tool-calling·agent, API·서빙·모니터링, 제품 협업 | 작동하는 제품, 요구사항과 설계 선택, 배포·평가·실패 처리. MLOps는 차별점 |
| Cohere — Forward Deployed Engineer, Agentic Platform (Korea) | 고객 문제 정의, 에이전트 구축·평가·개선, 제품 통합, 기술 리더십 | 고객 제약과 본인 기여, 성공 기준, 회귀 평가, 실패 분석, 기업 환경의 권한·감사 가능성 |

직무 해석 출처: [토스 공식 공고](https://toss.im/career/job-detail?job_id=7786567003), [Motif 공식 공고](https://motiftech.career.greetinghr.com/ko/o/206743), [Cohere 공식 공고](https://jobs.ashbyhq.com/cohere/031c2335-db85-4265-8a88-a54b911be36a).

지원 조건에서 놓치지 않을 점:

- Cohere는 senior 수준의 개발·운영 및 기술 리더십, 한국어·영어 유창성, 고객 방문 출장을 요구한다. 프로젝트 추가와 별도로 실제 경력·협업·영어 설명 근거를 정리한다.
- Motif의 확인 당시 공식 HTML은 경력 무관(`NOT_MATTER`)으로 표기하지만 본문은 프로덕션 경험을 요구한다. 과거 검색 캐시의 3년 이상 표기와 달라 지원 시 원문을 다시 확인한다.
- Motif 회사 소개에 있는 대규모 기반모델 학습을 Applied AI 직무의 필수 경력으로 옮기지 않는다. 세 공고를 하나의 일반 MLOps 직무로 취급하지 않는다.

현재 공개 작업과 업무 내용의 연결은 Motif·Cohere 쪽이 더 많다. 토스에 대해서는 실제 모델 서빙과 GPU 운영 증거의 보강 비중이 더 크다. 이는 합격 가능성이나 경력 수준의 판정이 아니다.

## 3. GitHub에서 확인한 재료와 보강점

| 프로젝트 | 실제로 확인한 공개 근거 | 다음 보강 |
|---|---|---|
| MED-RAG Vertex + Tune | 평가 코드·합성 데이터·24건 보고서, 검색/응답 평가 분리, 지연·비용 계측, QLoRA 학습·라벨 감사·실패 기록 | 코드/데이터/모델/환경 버전 연결, 실행 가능한 배포 구성, 품질 gate, 실제 GPU 서빙·복구 |
| Terracotta | Docker·Compose, 영속 데이터, DB healthcheck, 백업·업데이트 문서, 실제 GHCR 발행 성공 | 발행 전 동작 테스트, 백업 복원 검증, provider timeout·재시도·승인 흐름 검증, 운영 지표 |
| Agent Orchestra | LangGraph 실행, 평가와 mutation 결과, 선택적 tracing | 실제 모델 평가와 구조 검증 구분, CI 연결, 도구 실패·중복 실행·timeout 시나리오 |
| HiggsMCP | FastAPI와 Docker·Compose, 생성·게시 모듈 | scheduler의 자동 게시 미연결 범위를 정확히 표기, 재시도·작업 상태·실행 증거 |
| CTR-CVR | 전처리·학습·추론을 담은 모델 코드 | README의 배포 구성·실행법을 실제 파일과 맞추고 결과 재현 자료 확보 |
| daily-study-briefing / opensource | 정적 학습 포털과 로컬 갱신 스크립트 / 실습 노트북 | 제품·학습 아카이브로 유지. 현재 상태를 모델 운영의 대표 근거로 쓰지 않음 |

MED-RAG 출처: [평가 보고서](https://github.com/hyunaeee/aengdo-portfolio/blob/main/med-rag-vertex/eval/report.md), [튜닝 실험](https://github.com/hyunaeee/aengdo-portfolio/blob/main/med-rag-tune/README.md). 납품판은 비공개이며 공개 평가의 합성 데이터 성과와 분리한다.

Terracotta 출처: [Dockerfile](https://github.com/hyunaeee/terracotta/blob/main/Dockerfile), [SELF_HOSTING](https://github.com/hyunaeee/terracotta/blob/main/SELF_HOSTING.md), [성공한 이미지 발행 실행](https://github.com/hyunaeee/terracotta/actions/runs/30502168732). 이 실행은 커밋 `9b5026e2b3d5f30bfd757b8b5d34976d670533bd`에 대한 성공 기록이다. 이미지 발행 성공이 서비스의 지속 운영을 증명하지는 않는다. 셀프호스트판은 개인용이며 외부 모델 API를 사용한다.

그 외 근거: [Orchestra mutation 결과](https://github.com/hyunaeee/agent-orchestra/blob/main/eval/mutation_results.json), [HiggsMCP scheduler](https://github.com/hyunaeee/higgsMCP/blob/main/scripts/scheduler.py), [CTR-CVR 파일 목록](https://github.com/hyunaeee/CTR-CVR), [Daily Study Briefing](https://github.com/hyunaeee/daily-study-briefing), [실습 노트북](https://github.com/hyunaeee/opensource).

### 먼저 맞출 주장과 근거

1. Terracotta [발행 workflow](https://github.com/hyunaeee/terracotta/blob/main/.github/workflows/docker-publish.yml)는 이미지 빌드·발행을 수행하지만 테스트·lint 단계가 없다. 테스트를 실행하고 실패 시 발행이 차단되는 것을 증명한다. API 동작과 데이터 복원을 검증하는 테스트를 우선한다.
2. Terracotta [현재 README](https://github.com/hyunaeee/terracotta/blob/main/README.md)는 품질 증가 수치를 측정값으로 제시하지 않기로 정정했다. GitHub 프로필과 포트폴리오의 이전 품질/비용 문구를 같은 조건으로 맞춘다. 비용은 정책 시뮬레이션이라는 조건과 비교 기준을 붙인다.
3. CTR-CVR 기본 브랜치에는 `LICENSE`, `NOTICE`, `README.md`, `model-code.py`가 있다. README의 `requirements.txt`, `train.py`, `serve.py`, Docker 배포 설명과 일치하지 않는다. 측정 원본과 실행 구조가 준비되기 전에는 MLOps 대표작으로 올리지 않는다.
4. HiggsMCP의 scheduler는 게시 호출 일부가 주석 처리돼 있다. 현재 공개 코드가 뒷받침하는 자동화 범위까지 설명한다.
5. 기존 계획의 MED-RAG 수치 버전, QLoRA 오라벨 분모, 회의 처리 시간의 측정 단계 정리도 함께 수행한다.

## 4. 추천 MLOps 프로젝트: MED-RAG Serving Lab

**주제: 근거 기반 응답 품질을 유지하면서 모델의 처리 용량을 늘리고, 실패한 변경을 이전 버전으로 복구한다.**

기존 MED-RAG의 공개 합성 코퍼스와 평가 경험을 재사용한다. 병원 배포와 구분되는 개인 운영 실험이며, MED-RAG 사례의 새로운 기술 장으로 연결한다. 저장소는 독립 실행이 쉽도록 분리할 수 있지만 같은 작업의 성과를 중복 계산하지 않는다.

핵심 실험 질문은 “긴 문서를 읽는 요청이 짧은 요청을 얼마나 지연시키며, 어떤 설정으로 품질과 응답 시간을 함께 지킬 수 있는가”다. 개선 효과가 작거나 특정 조건에서 악화돼도 측정과 선택 이유를 남긴다.

### 초기 범위

- GPU 1개와 모델 1개. 기존 7B 모델은 후보이며 현재 GPU·VRAM·서빙 호환성을 확인한 뒤 확정한다.
- vLLM 서빙, 요청/평가를 연결할 얇은 API, Docker 실행 환경.
- 버전 manifest와 평가 산출물, CI에서의 실패 후보 차단.
- Prometheus/Grafana 등으로 요청 지연·큐·오류·GPU 자원·품질 회귀를 관측.
- 이전 버전 복원과 제한된 장애 실험.

기술 스택보다 아래 산출물로 완료 여부를 판정한다. 초기 registry는 실행 ID와 불변 artifact 목록만으로 시작할 수 있다. MLflow는 실험 비교·artifact 추적이 필요해질 때, Kubernetes는 복수 replica와 트래픽 관리 검증이 가능해질 때 도입한다.

### 단계와 완료 조건

| 단계 | 할 일 | 남길 증거 |
|---|---|---|
| 0. 실험 환경 | GPU·VRAM·OS·사용 시간과 예산 확인. 모델·tokenizer·정밀도·라이선스·데이터 버전 확정 | 실행 명령, 환경 manifest, 비용 상한, 데이터 출처 |
| 1. 품질·재현성 | 학습/개발용과 새 검증 세트 분리. 인용 오류·과잉 거부·부분 답변을 평가. 모델·프롬프트·데이터·코드·이미지를 한 실행 ID로 추적 | 재실행 결과, 고정 기준, 품질이 나쁜 후보를 배포에서 차단한 기록 |
| 2. 실제 서빙 | 모델 적재, cold/warm 분리, 스트리밍 요청, 취소·timeout·과부하 제한 | 원본 요청 로그와 메트릭. CPU/mock 검증은 GPU 측정과 별도 표시 |
| 3. 부하·최적화 | 입력/출력 길이와 도착 패턴을 고정하고 baseline과 후보 설정 비교. 한 번에 한 변수 변경 | 목표 지연을 만족하는 처리량, 첫 토큰·토큰 간·전체 응답 지연, 오류율, GPU 메모리, 반복 간 변동 |
| 4. 배포·복구 | 검증된 artifact 승격, readiness 확인, 실패 후보 차단, 이전 artifact 복원 | 정상 승격과 실패 차단 로그, 복구 시간, 교체 중 실패·중단 요청 수 |
| 5. 장애 기록 | 실험 환경의 요청 급증·프로세스 종료·잘못된 설정·검색 지연을 제한적으로 재현 | 발생→탐지→진단→완화→복구 타임라인과 장애 보고서 |

벤치마크에서는 TTFT(첫 토큰까지), TPOT(출력 토큰당), 전체 응답 지연과 목표 지연을 충족하는 처리량을 함께 본다. 파일럿 후 목표를 고정하고 baseline·후보를 같은 요청으로 반복한다. 작은 표본의 p99를 대표 성과로 쓰지 않는다. [vLLM 공식 벤치마크](https://docs.vllm.ai/en/stable/cli/bench/serve/)

큐 대기·KV cache·prefill/decode 지표로 병목을 설명한다. prefix cache 실험은 반복 prefix와 고유 prefix 입력을 나눠 효과가 나타나는 조건을 밝힌다. GPU 메모리·활용률은 별도 GPU 계측과 연결한다. [vLLM 운영 지표](https://docs.vllm.ai/en/stable/design/metrics/)

품질 gate에서는 지정한 치명적 인용 오류 0건 같은 명시적 조건을 정하고, 답변 가능한 질문을 과도하게 거부하는지도 별도로 측정한다. 이 조건은 유한한 검증 세트의 통과 기준이며 일반적인 무오류를 뜻하지 않는다. 모델 정밀도나 프롬프트가 달라지면 품질을 재평가한다.

단일 GPU에서 두 버전을 동시에 적재할 수 없다면 순차 교체와 중단 시간을 측정한다. 두 replica를 실제로 구동하기 전에는 무중단·고가용성을 성과로 표현하지 않는다. Vertex 보고서의 49.44 tok/s는 두 단계 API 파이프라인 전체 지표이므로 새 GPU의 decode 성능과 직접 비교하지 않는다.

### 최종 공개물

- README 첫 화면: 문제, 실험 환경, 주요 결과, 한계, 재현 명령.
- `reports/`: 성능 비교와 설정 선택 이유, 결과가 나빠진 조건, 짧은 장애 보고서.
- `benchmarks/`: 입력 생성법·설정·원본 JSONL·실행 manifest.
- `eval/`: 고정 회귀 평가와 별도 검증 세트, 후보 통과/실패 결과.
- `deploy/`: 버전 고정 실행·복구 명령과 검증 기록.
- 웹/PDF: 구조도 1개, 성능 비교 차트, 배포 차단/복구 사례, 코드 링크.

위 폴더는 제안 구조다. 현재 생성·배포 완료된 기능으로 소개하지 않는다.

## 5. GitHub·사이트·PDF 편집 변경

### GitHub

- [프로필 README](https://github.com/hyunaeee/hyunaeee/blob/main/README.md)의 이름을 Hyunae Park으로 통일하고, 강점을 Applied AI·평가·운영 경험으로 명료하게 쓴다.
- MED-RAG의 평가·튜닝 코드는 현재 포트폴리오 저장소 하위에 있어 찾기 어렵다. 프로필에서 해당 디렉터리에 직접 링크하고 독립 사례 README로 안내한다.
- 고정 후보는 MED-RAG의 실행 가능한 공개 저장소, Terracotta, Agent Orchestra, 포트폴리오다. Serving Lab은 재현·실험 증거가 갖춰진 뒤 고정한다.
- 각 대표 README는 현재 상태 → 문제/역할 → 실행 → 검증 결과 → 설계 선택 → 한계 → 자료 순서로 정리한다.
- 기술 배지는 실제 사용과 검증 범위에 맞춘다. 라이브 제품·UI 데모·실험·비공개 납품을 구분한다.

### 사이트

현재 준비 가능한 대표 사례는 MED-RAG, Terracotta, 회의 어시스턴트다. Anatomy는 **Live Engineering** 영역에 큰 실제 분해도 캡처와 라이브 링크로 유지한다. 3D 안내 캐릭터는 평가·운영 근거를 찾는 데 도움을 주도록 연결한다.

Serving Lab이 완성되면 MED-RAG 사례 안에 Delivery / Evaluation / Serving & Operations 장을 구성한다. 공통 사이트 데이터에서 회사별 읽기 순서를 제공한다.

| 지원 대상 | 먼저 읽히게 할 순서 |
|---|---|
| 토스 | MED-RAG 서빙·운영 실험 → 성능/복구 근거 → Terracotta 배포 → 평가·튜닝 판단 |
| Motif | Terracotta 제품·전체 구현 → MED-RAG 평가와 배포 → 회의 워크플로 |
| Cohere | MED-RAG 고객 제약·본인 기여 → 회의 자동화 → 에이전트 평가·권한·실패 처리 |

각 경로는 같은 프로젝트를 다른 순서로 설명한다. 미완성 MLOps 작업은 예정으로 명확히 표시하고 검증된 결과가 있을 때 승격한다.

### PDF

기본 6–8쪽 사례집과 회사별 강조 순서를 같은 데이터로 만든다. 토스판은 서빙 성능/복구에, Motif판은 제품 구현과 운영에, Cohere판은 고객 문제와 평가·협업에 지면을 더 준다. Cohere용 영문 사례에는 기술 선택과 제약을 영어로 설명한 자료를 연결한다.

## 6. 추천 실행 순서

1. **주장·링크 정리:** 프로필/README/사이트/PDF의 수치·상태·이름을 맞추고 현재 근거를 연결한다.
2. **빠른 운영 증거 보강:** Terracotta 발행 전 테스트, 데이터 복원, 외부 API 실패 처리 검증을 기록한다.
3. **MLOps 기반 완성:** MED-RAG의 버전 manifest·새 검증 세트·품질 gate를 CPU 환경에서 준비한다.
4. **GPU 실험:** 짧은 환경 검증 후 baseline·최적화·배포 복구를 묶어 실행한다. GPU 접근과 실제 요금 확인 전 비용을 확정하지 않는다.
5. **사례 편집:** 측정이 끝난 뒤 홈·상세·GitHub·회사별 PDF에 반영한다.

현재 미확정 사항은 사용할 GPU와 예산, 실제 고객 업무에서 공개 가능한 기여·운영 범위, Cohere용 영어·협업·리더십 근거다. GPU 답변 전에도 1–3단계 계획과 CPU 준비 범위는 정할 수 있다.
