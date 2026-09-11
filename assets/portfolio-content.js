/* Single source for the generated website and browser PDF. Run node scripts/build-portfolio.cjs after editing. */
(function (root, factory) {
  const data = factory(typeof module === 'object' && module.exports ? require('./portfolio-archive.js') : root.HYUNAE_ARCHIVE || []);
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_PORTFOLIO = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (archive) {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  const repo = 'https://github.com/hyunaeee/aengdo-portfolio';
  const origin = 'https://hyunaeee.github.io/aengdo-portfolio/';
  const link = (ko, en, url, kind = 'source') => ({ label: L(ko, en), url, kind });
  const data = {
    updatedAt: '2026-09-11',
    history: typeof module === 'object' && module.exports ? require('./portfolio-history.js') : globalThis.HYUNAE_HISTORY || [],
    person: {
      name: 'Hyunae Park', email: 'hyunaeee@gmail.com', github: 'https://github.com/hyunaeee',
      role: L('AI Builder', 'AI Builder'),
      headline: L('Hyunae Park · AI Builder', 'Hyunae Park · AI Builder'),
      intro: L('RAG · AI 에이전트 · MLOps', 'RAG · AI agents · MLOps'),
      location: L('대한민국 · 한국어 / 영어', 'South Korea · Korean / English')
    },
    projects: [
      {
        id: 'med-rag', number: '01', title: 'MED-RAG',
        summary: L('병원망 안에서 동작하는 진료 보조 RAG. 공개 실험에서는 평가자에게 검색 근거를 보여주자, 이전에 통과했던 답변의 실패가 드러났습니다.', 'An on-prem clinical RAG assistant. In a separate public experiment, giving the evaluator the retrieved evidence exposed failures that a plausibility check had missed.'),
        status: L('납품 경험 · 공개 합성 데이터 실험', 'Client delivery · public synthetic-data experiments'),
        role: L('RAG 파이프라인 구현 · 공개 평가 및 튜닝 실험', 'RAG implementation · public evaluation and fine-tuning experiments'),
        period: '2025.10 / 2026.07–09',
        stack: ['Python', 'Ollama', 'Chroma', 'Vertex AI / ADK', 'QLoRA'],
        image: { src: 'assets/medrag.jpg', alt: L('합성 예시로 재현한 MED-RAG 화면: 답변 옆에서 검색 근거를 확인', 'MED-RAG UI demo with synthetic examples and visible retrieved evidence') },
        imageCaption: L('공개 UI 데모 · 예시 답변은 사전 구성된 합성 데이터입니다.', 'Public UI demo · responses are preconfigured synthetic examples.'),
        metrics: [
          { value: '23 / 24', label: L('정답 문서 검색', 'Gold-source retrieval'), note: L('39개 합성 문서 · 184개 청크', '39 synthetic documents · 184 chunks') },
          { value: '20 / 24', label: L('근거를 확인한 답변 평가 통과', 'Evidence-aware answer evaluation'), note: L('Gemini 2.5 Pro judge · 2026.07.29', 'Gemini 2.5 Pro judge · Jul 29, 2026') },
          { value: 'RTX 5090', label: L('초기 로컬 실행 환경', 'Initial local deployment'), note: L('Vertex 평가와 별도 환경', 'Separate from the Vertex evaluation') }
        ],
        links: [
          link('평가 보고서', 'Evaluation report', repo + '/blob/main/med-rag-vertex/eval/report.md'),
          link('공개 코드', 'Public code', repo + '/tree/main/med-rag-vertex', 'code'),
          link('UI 데모', 'UI demo', origin + 'med-rag/', 'demo'),
          link('QLoRA 실험', 'QLoRA experiment', repo + '/tree/main/med-rag-tune'),
          link('Serving Lab', 'Serving Lab', repo + '/tree/main/med-rag-serving', 'code')
        ],
        decisions: [
          { title: L('데이터가 있는 곳에서 추론하기', 'Inference stays with the data'), body: L('외부 전송 제약에 맞춰 Gemma 3 27B와 Ollama 기반 로컬 추론을 구성했습니다. 초기 로컬 실행에는 RTX 5090을 사용했습니다.', 'The delivery used local Gemma 3 27B inference through Ollama to respect network constraints. The initial local run used an RTX 5090.') },
          { title: L('평가자에게 근거를 함께 전달하기', 'Give the judge the evidence'), body: L('질문과 답변만 평가하면 그럴듯한 설명이 높은 점수를 받았습니다. 검색된 문서를 함께 전달해 실제 근거성을 검사했습니다.', 'A judge that only sees a question and answer can reward plausibility. Passing the retrieved documents made grounding testable.') },
          { title: L('튜닝보다 나은 선택을 인정하기', 'Choose the stronger baseline'), body: L('QLoRA는 위조 인용을 줄였지만 과잉 거부를 늘렸습니다. 라벨을 고쳐도 기본 모델이 전반적인 judge 점수에서 앞서, 기본 모델과 엄격한 프롬프트를 권장했습니다.', 'QLoRA reduced fabricated quotes but increased over-refusal. Even after label repair, the base model led on overall judge scores, supporting a base-model-and-strict-prompt recommendation.') }
        ],
        sections: [
          { id: 'context', eyebrow: L('01 / CONTEXT', '01 / CONTEXT'), title: L('프로젝트 개요', 'Overview'), body: [L('고려대 안암병원 진료 보조 에이전트 납품 경험에서 출발했습니다. 증례와 가이드라인을 검색하고, 모델이 어떤 문서를 바탕으로 답하는지 사용자가 확인할 수 있도록 구성했습니다.', 'This work began with a clinical-assistant delivery for Korea University Anam Hospital. The system retrieves cases and guidelines and exposes the sources behind an answer.'), L('납품판 코드와 자료는 비공개입니다. 여기에서 공개하는 수치는 이후 별도로 만든 Vertex 포트와 합성 데이터 실험의 결과입니다. 실제 환자에 대한 임상 성과를 의미하지 않습니다.', 'The delivered code and material remain private. Published metrics come from a later Vertex port using synthetic data, and do not measure clinical outcomes.')] },
          { id: 'architecture', eyebrow: L('02 / SYSTEM', '02 / SYSTEM'), title: L('시스템 구조', 'Architecture'), body: [L('증례를 먼저 찾고 가이드라인으로 보완합니다. 같은 나이와 성별만으로 같은 증례라고 판단하지 않도록 조건을 두고, 근거가 약할 때 불확실성을 드러내게 했습니다.', 'Cases are retrieved first, then supported by guidelines. The system checks clinical similarity beyond age and sex and surfaces uncertainty when evidence is insufficient.')], diagram: [
            { label: L('질문', 'Question'), detail: L('증례 · 필요한 근거', 'Case and evidence needs') },
            { label: L('검색', 'Retrieve'), detail: L('Chroma · 증례 / 가이드라인', 'Chroma · cases / guidelines') },
            { label: L('초안', 'Research'), detail: L('근거를 포함한 답변', 'Draft with source evidence') },
            { label: L('검토', 'Review'), detail: L('근거 · 불확실성 확인', 'Grounding and uncertainty') }
          ] },
          { id: 'evaluation', eyebrow: L('03 / EVIDENCE', '03 / EVIDENCE'), title: L('평가 결과', 'Evaluation'), body: [L('기존 평가자는 실제 검색 문서를 보지 못했습니다. 문서를 전달한 뒤 답변 평가가 24/24에서 20/24로 바뀌었고, 존재하지 않는 인용과 근거 없는 설명을 발견했습니다.', 'The original judge never saw the retrieved documents. Including them changed the answer pass rate from 24/24 to 20/24 and exposed invented quotations and unsupported claims.'), L('검색 성공과 답변 품질을 나눠 평가했습니다. 정답 문서를 찾는 것만으로 근거 있는 답변이 보장되지는 않았습니다.', 'Retrieval and answer quality are measured separately: finding the right document did not guarantee a grounded answer.')], table: { headers: [L('검증 항목', 'Measure'), L('결과', 'Result'), L('조건', 'Conditions')], rows: [
            [L('정답 문서 검색', 'Gold document retrieved'), '23/24', L('파일명 기준 객관 평가', 'Objective source-filename check')],
            [L('답변 평가 통과', 'Answer evaluation pass'), '20/24', L('검색 문서를 보는 LLM judge', 'Evidence-aware LLM judge')],
            [L('근거성', 'Groundedness'), '4.42 / 5', L('24개 합성 질문', '24 synthetic questions')],
            [L('응답 시간 p50 / p95', 'Latency p50 / p95'), '35.98s / 52.99s', L('2단계 에이전트 전체 · n=24', 'Whole two-stage agent · n=24')],
            [L('요청당 비용', 'Cost per request'), '$0.006542', L('생성 + 임베딩 추정 · judge 제외', 'Generation + estimated embedding · excludes judge')]
          ] } },
          { id: 'iteration', eyebrow: L('04 / ITERATION', '04 / ITERATION'), title: L('QLoRA 실험', 'QLoRA experiments'), body: [L('Qwen2.5-7B를 154개 예제로 QLoRA 학습했습니다. 위조 인용은 2건에서 0건으로 줄었지만, 답할 수 있는 질문까지 거부하는 문제가 생겼습니다.', 'QLoRA training on 154 examples reduced fabricated quotes from two to zero, but the Qwen2.5-7B model began refusing answerable questions.'), L('거부 예제 37개 중 8개(약 22%)에 잘못된 라벨이 있었습니다. 이를 수정한 v2에서 근거성과 유용성이 회복됐지만 기본 모델은 넘지 못했습니다. 22%의 분모는 전체 학습셋이 아닌 거부 예제입니다.', 'Eight of 37 abstention examples (about 22%) were mislabeled. Repairing them improved v2, but it still trailed the base model. The 22% denominator is the abstention subset, not the full training set.')], table: { headers: [L('모델', 'Model'), L('위조 인용', 'Fabricated quotes'), L('근거성 / 유용성', 'Grounding / helpfulness')], rows: [['Base', '2', '4.80 / 4.63'], ['QLoRA v1', '0', '4.40 / 4.13'], ['QLoRA v2', '0', '4.63 / 4.30']] }, bullets: [L('검증셋 30개. 작은 표본의 judge 점수와 개별 실패를 함께 해석했습니다.', 'Held-out n=30. Small-sample judge scores are interpreted alongside individual failures.'), L('초기 RTX 5090 로컬 실행과 QLoRA 기록의 RTX 4090 학습은 서로 다른 실험입니다.', 'Initial local inference on RTX 5090 and recorded QLoRA training on RTX 4090 are separate experiments.')] },
          { id: 'operations', eyebrow: L('05 / SERVING LAB', '05 / SERVING LAB'), title: L('MED-RAG Serving Lab', 'MED-RAG Serving Lab'), body: [L('품질 gate, 모델·데이터 버전 고정, 스트리밍 지연 측정과 수동 롤백 절차를 공개 코드로 구현했습니다. CPU 테스트 25개를 통과했고, 정상 fixture 통과와 결함 후보의 release 차단을 확인했습니다.', 'Public code implements quality gates, pinned model and data versions, streaming latency measurement, and manual rollback procedures. Twenty-five CPU tests pass, including a passing fixture and a deliberately defective release candidate blocked by the gate.'), L('GPU 성능과 복구 시간은 아직 측정하지 않았습니다. 현재 운영 중인 RTX 4090 회의 서비스와 분리된 환경에서 측정한 뒤 결과를 추가합니다.', 'GPU performance and recovery time have not yet been measured. Results will be added after testing in an environment separated from the active RTX 4090 meeting service.')], diagram: [
            { label: L('버전 기록', 'Version'), detail: L('코드 · 모델 · 데이터', 'Code · model · data') },
            { label: L('품질 확인', 'Evaluate'), detail: L('인용 오류 · 과잉 거부', 'Citation errors · over-refusal') },
            { label: L('서빙', 'Serve'), detail: L('지연 · 큐 · GPU', 'Latency · queues · GPU') },
            { label: L('복구', 'Recover'), detail: L('이전 artifact', 'Previous artifact') }
          ] }
        ],
        limitations: [L('공개 평가는 합성 데이터의 작은 표본입니다. 실제 임상 효과나 일반적인 무오류를 입증하지 않습니다.', 'Public evaluations use small synthetic datasets and do not establish clinical effectiveness or universal correctness.'), L('모델 서빙의 처리량·장애 복구 실측은 별도 실험 과제로 남아 있습니다.', 'Model-serving throughput and incident recovery remain separate measurement tasks.')]
      },
      {
        id: 'terracotta', number: '02', title: 'Terracotta',
        summary: L('모델 선택부터 도구 승인, 비용 기록, 셀프호스팅까지 연결한 개인 AI 작업실. 사용자가 무엇이 실행되는지 알 수 있는 제품을 만들었습니다.', 'A personal AI workspace connecting model selection, tool approval, cost accounting, and self-hosting, with visible control over what gets executed.'),
        status: L('공개 코드 · 셀프호스팅 프로토타입', 'Public code · self-hosted prototype'),
        role: L('제품 기획 · UI · 에이전트/API · 배포 구성', 'Product design · UI · agent/API implementation · deployment'), period: '2026.07–',
        stack: ['TypeScript', 'React / Next.js', 'Cloudflare Workers', 'D1', 'MCP', 'Docker'],
        image: { src: 'assets/terracotta.jpg', alt: L('Terracotta 작업실: 대화, 모델 선택, 개인 가든', 'Terracotta workspace with chat, model selection, and a personal garden') },
        imageCaption: L('제품 화면 · 모델 호출에는 공급사 API 연결이 필요합니다.', 'Product interface · model calls require provider API access.'),
        metrics: [
          { value: 'MCP', label: L('도구 실행 전 승인', 'Approval before tool actions'), note: L('도구 · 인자 · 만료 조건 표시', 'Tool, arguments, and expiry are visible') },
          { value: 'GHCR', label: L('컨테이너 이미지 발행', 'Container image publishing'), note: L('GitHub Actions 실행 기록 공개', 'Public GitHub Actions run history') },
          { value: 'D1', label: L('데이터 보존과 상태 확인', 'Persistence and health checks'), note: L('로컬 볼륨 · 백업 절차', 'Local volume · backup procedure') }
        ],
        links: [link('공개 코드', 'Source code', 'https://github.com/hyunaeee/terracotta', 'code'), link('셀프호스팅 가이드', 'Self-hosting guide', 'https://github.com/hyunaeee/terracotta/blob/main/SELF_HOSTING.md'), link('배포 기록', 'Build history', 'https://github.com/hyunaeee/terracotta/actions')],
        decisions: [
          { title: L('쓰는 행동에는 명시적 승인', 'Explicit approval for writes'), body: L('외부 상태를 바꾸는 도구는 실행 전 서비스·인자를 표시합니다. 승인 상태와 실행 흔적을 함께 남겨 에이전트의 행동을 추적하게 했습니다.', 'Tools that change external state expose their service and arguments before execution. Approval state and traces make agent actions inspectable.') },
          { title: L('제품 상태를 컨테이너 수명과 분리', 'Keep state beyond a container'), body: L('사용량, 설정, 승인 기록과 암호화 키를 영속 볼륨에 보관하고 앱과 데이터베이스를 함께 검사합니다.', 'Usage, settings, approval records, and encryption keys persist in a volume. Health checks inspect both the application and database.') },
          { title: L('측정하지 않은 품질 주장은 철회', 'Remove an unmeasured quality claim'), body: L('정책 시뮬레이션의 직접 정의한 품질 상수를 모델 성능으로 볼 수 없어 품질 증가 주장을 제거했습니다. 비용도 비교 기준에 따라 해석합니다.', 'Hand-defined quality constants in a policy simulation cannot establish model quality. That claim was removed, and cost comparisons retain their baseline conditions.') }
        ],
        sections: [
          { id: 'context', eyebrow: L('01 / PRODUCT', '01 / PRODUCT'), title: L('프로젝트 개요', 'Overview'), body: [L('사용자가 여러 AI 창을 오가며 맥락과 비용을 따로 관리하는 문제에서 시작했습니다. 모델 선호, 연결된 도구, 작업 기록을 한 화면과 하나의 데이터 흐름으로 연결했습니다.', 'The product starts with the friction of switching AI tools while tracking context and cost separately. Model preferences, connected tools, and work history share a single flow.')] },
          { id: 'architecture', eyebrow: L('02 / SYSTEM', '02 / SYSTEM'), title: L('시스템 구조', 'Architecture'), diagram: [
            { label: L('라우터', 'Router'), detail: L('과제 · 모델 선호', 'Task and model preference') },
            { label: L('도구 루프', 'Tool loop'), detail: L('MCP · 승인 대기', 'MCP · pending approvals') },
            { label: L('교차 검토', 'Review'), detail: L('다른 공급사 모델', 'A second provider') },
            { label: L('원장', 'Ledger'), detail: L('사용량 · 실행 trace', 'Usage and execution traces') }
          ], body: [L('공급사의 모델 목록과 가격 정보, 실제 실행 사용량을 구분합니다. 모델 목록을 갱신하는 기능은 학습 artifact를 승격하는 모델 registry와 다른 역할입니다.', 'Provider model catalogs, price data, and execution usage are kept conceptually separate. Catalog refresh is distinct from a registry that promotes trained model artifacts.')] },
          { id: 'delivery', eyebrow: L('03 / DELIVERY', '03 / DELIVERY'), title: L('배포와 검증', 'Deployment and validation'), body: [L('Docker 이미지와 Compose 구성, DB healthcheck, 데이터 백업·업데이트 절차를 제공합니다. 컨테이너 이미지는 GitHub Actions에서 GHCR로 발행하며 실행 기록을 공개합니다.', 'Docker and Compose configuration, database health checks, backup instructions, and update procedures are published. GitHub Actions builds container images for GHCR with public run records.'), L('셀프호스트판은 개인용 프로토타입입니다. 공개 인터넷에서의 다중 사용자 운영과 고가용성을 입증하는 배포는 아닙니다.', 'The self-hosted edition is a personal prototype. It does not establish multi-user internet operation or high availability.')], bullets: [L('이미지 버전과 영속 데이터의 역할을 분리해 업데이트와 복원을 설명합니다.', 'Image versions and persistent state have separate update and recovery procedures.'), L('발행 전 lint·빌드·테스트를 실행하는 CI 의존성을 구성했습니다. 로컬 14개 테스트에서 D1 복원, 암호화 키, 공급사 504 대체 경로와 healthcheck 실패를 확인했습니다.', 'CI requires lint, build, and tests before publishing. Fourteen local tests pass, covering D1 restore, encryption keys, provider HTTP 504 fallback, and healthcheck failures.')] },
          { id: 'evaluation', eyebrow: L('04 / TRADE-OFF', '04 / TRADE-OFF'), title: L('평가 결과', 'Evaluation'), body: [L('24개 태스크의 오프라인 정책 벤치마크에서 높은 가격의 단일 모델과 비교하면 비용이 낮아졌지만, 저가 모델 고정 정책보다 비쌌습니다. 라이브 API 호출로 측정한 절감률이 아닙니다.', 'An offline policy benchmark of 24 tasks estimated lower cost against a high-price single-model baseline, but higher cost against a low-price fixed model. This is not measured savings from live API traffic.'), L('품질 축은 직접 정의한 상수에 의존해 공개 성과에서 제외했습니다. 다음 검증은 실제 분류 결과, 사용자 과제 성공률과 비용을 함께 비교하는 일입니다.', 'The quality axis depended on hand-defined constants and was excluded from performance claims. The next evaluation compares real classification, task success, and cost together.')] }
        ],
        limitations: [L('실제 모델 응답에는 공급사 API가 필요합니다. 현재 구독·크레딧 UX는 프로토타입입니다.', 'Real model responses require provider APIs. Subscription and credit UX remain prototypes.'), L('컨테이너 발행 이력은 서비스 가용성이나 대규모 모델 서빙 성과와 다릅니다.', 'Container publication history is distinct from service availability or large-scale model serving.')]
      },
      {
        id: 'meeting', number: '03', title: 'Meeting Assistant',
        summary: L('녹음, 전사, 화자 분리, 회의록과 저장을 하나의 흐름으로 연결했습니다. 현재 RTX 4090에서 운영하는 사내 회의 어시스턴트입니다.', 'A connected workflow for recording, transcription, speaker diarization, minutes, and storage. The internal assistant currently runs on an RTX 4090.'),
        status: L('사내 운영 · 공개 UI 데모', 'Internal operation · public UI demo'),
        role: L('파이프라인 · 웹 UI · 인증/권한 · 배포', 'Pipeline · web UI · authentication/access · deployment'), period: '2026.06–',
        stack: ['Python', 'faster-whisper', 'pyannote', 'Claude API', 'Docker', 'Google SSO'],
        image: { src: 'assets/meeting.jpg', alt: L('회의 어시스턴트의 녹음 설정과 마이크 테스트 UI 데모', 'Meeting Assistant UI demo showing meeting setup and microphone testing') },
        imageCaption: L('공개 UI 데모 · 샘플 데이터로 흐름을 체험합니다.', 'Public UI demo · explore the workflow with sample data.'),
        metrics: [
          { value: 'RTX 4090', label: L('현재 운영 환경', 'Current deployment'), note: L('사내 회의 어시스턴트', 'Internal meeting assistant') },
          { value: 'SSO', label: L('로그인과 열람 권한', 'Sign-in and access control'), note: L('사용자 · 부서별 접근', 'User and department access') },
          { value: '5 stages', label: L('녹음부터 전달까지', 'From audio to delivery'), note: L('전사 · 분리 · 요약 · 저장 · 메일', 'Transcribe · diarize · summarize · save · email') }
        ],
        links: [link('UI 데모', 'UI demo', origin + 'meeting/', 'demo')],
        decisions: [
          { title: L('GPU 작업과 외부 서비스를 연결', 'Connect local GPU work with services'), body: L('음성 처리와 화자 분리는 로컬 GPU에서 수행하고, 구조화한 회의록을 후속 저장·전달 단계로 연결했습니다.', 'Local GPU speech processing and diarization feed structured minutes into storage and delivery steps.') },
          { title: L('화면보다 먼저 권한을 설계', 'Design access around the workflow'), body: L('로그인한 사용자와 부서별 접근 범위를 고려해 회의록을 조회하게 구성했습니다.', 'Meeting access follows the signed-in user and department context.') },
          { title: L('전체 시간과 단계별 시간을 분리', 'Measure stages separately'), body: L('화자 분리 개선 수치를 회의록 전체 처리 시간으로 표현하지 않습니다. 입력 길이, 실행 환경, 처리 단계를 함께 기록합니다.', 'Diarization timing is not presented as full meeting-processing time. Measurements identify input duration, environment, and pipeline stage.') }
        ],
        sections: [
          { id: 'context', eyebrow: L('01 / WORKFLOW', '01 / WORKFLOW'), title: L('프로젝트 개요', 'Overview'), body: [L('CLI 도구에서 시작해 웹 UI와 Docker 서비스로 확장했습니다. 녹음 이후의 전사, 발언자 구분, 회의록 작성과 공유를 한 흐름에서 다루도록 만들었습니다.', 'The project grew from a CLI into a web interface and Docker service, bringing transcription, speaker attribution, minutes, and sharing into one workflow.')] },
          { id: 'architecture', eyebrow: L('02 / SYSTEM', '02 / SYSTEM'), title: L('시스템 구조', 'Architecture'), diagram: [
            { label: L('음성', 'Audio'), detail: 'faster-whisper' },
            { label: L('화자 분리', 'Diarize'), detail: 'pyannote · RTX 4090' },
            { label: L('회의록', 'Minutes'), detail: 'Claude · structured JSON' },
            { label: L('저장·전달', 'Deliver'), detail: 'Notion · SMTP' }
          ], body: [L('현재 RTX 4090에서 운영합니다. 공개 데모는 동일한 작업 흐름을 샘플 데이터로 보여주며, 실제 음성 처리와 외부 API 호출은 사내 서비스에서 수행합니다.', 'The service currently operates on an RTX 4090. The public demo uses sample data; actual speech processing and external API calls run in the internal service.')] },
          { id: 'evaluation', eyebrow: L('03 / PERFORMANCE', '03 / PERFORMANCE'), title: L('평가 결과', 'Evaluation'), body: [L('기존 기록의 “56분 파일, 약 28초”는 청크 방식 화자 분리 단계의 사례입니다. 전사·요약·저장까지 포함한 전체 시간이나 반복 벤치마크로 해석하지 않습니다.', 'The historical “56-minute file, about 28 seconds” record refers to a chunked diarization stage. It is not total transcription-to-delivery latency or a repeated benchmark.'), L('운영 성능을 설명할 다음 근거는 단계별 지연, 화자 분리 품질, 실패·재처리 비율입니다. 현재 사용 중인 서비스를 보존하면서 별도 환경에서 측정을 준비합니다.', 'The next operational evidence is per-stage latency, diarization quality, and failure/reprocessing rates, measured without disrupting the active service.')] },
          { id: 'access', eyebrow: L('04 / ACCESS', '04 / ACCESS'), title: L('SSO와 접근 권한', 'SSO and access control'), body: [L('Google SSO와 사용자·부서별 열람 범위를 작업 흐름에 연결했습니다. 공개 화면과 사내 데이터를 분리해 제품을 체험할 수 있도록 했습니다.', 'Google SSO and user/department access boundaries are part of the workflow. The public interface is separated from internal meeting data.')] }
        ],
        limitations: [L('사내 코드·회의 데이터는 공개하지 않습니다. 데모의 음성과 결과는 샘플입니다.', 'Internal code and meeting data are private. Demo audio and results are samples.'), L('처리 단계의 사례 수치를 전체 서비스 SLA로 표현하지 않습니다.', 'A stage-specific observation is not presented as an end-to-end service SLA.')]
      },
      {
        id: 'anatomy', number: '04', title: 'Anatomy Atlas',
        summary: L('계통별 분리, 구조 검색, 숨김과 투명도, 원본 모델 내보내기를 지원하는 한국어 3D 해부학 탐색기입니다.', 'A Korean-language 3D anatomy explorer with system separation, structure search, isolation, opacity controls, and original-model export.'),
        status: L('라이브 · 인터랙티브 3D', 'Live · interactive 3D'), role: L('인터랙션 · 데이터 처리 · 웹 구현', 'Interaction · data processing · web implementation'), period: '2026.09',
        stack: ['React', 'TypeScript', 'Three.js', 'Web Worker', 'meshoptimizer'],
        image: { src: 'assets/anatomy-exploded.jpg', alt: L('Anatomy Atlas 실제 캡처: 근육, 장기, 순환계, 골격의 계통 분해도', 'Actual Anatomy Atlas capture: separated muscles, organs, circulation, and skeleton') },
        imageCaption: L('라이브 사이트 실제 캡처 · 계통별 분리 상태', 'Actual live-site capture · separated body systems'),
        metrics: [{ value: '2,234', label: L('남성 참조 부품', 'Male reference parts'), note: 'BodyParts3D' }, { value: '964', label: L('여성 참조 부품', 'Female reference parts'), note: L('HRA · 전신 커버리지 차이', 'HRA · incomplete full-body coverage') }],
        links: [link('라이브 열기', 'Open live site', 'https://anatomy-sample.vercel.app/', 'live')],
        decisions: [{ title: L('화면 상세도와 원본 데이터 분리', 'Separate display detail from source data'), body: L('화면에서는 Worker로 표시 상세도를 계산하고, 내보낼 때에는 원본 모델을 사용하도록 분리했습니다.', 'Workers compute display detail while exports preserve original model data.') }],
        sections: [{ id: 'explore', eyebrow: '01 / INTERACTION', title: L('기능과 데이터', 'Features and data'), body: [L('참조 데이터를 한국어·영어 이름과 계통으로 탐색합니다. 부품을 단독으로 보거나 투명도를 조절하고, GLB·OBJ·STL 형식으로 원본을 내려받을 수 있습니다.', 'Reference data can be explored by Korean/English names and body systems. Parts can be isolated, made transparent, and exported in GLB, OBJ, or STL formats.')], bullets: [L('부품 수는 데이터 규모이며 직접 모델링한 수나 사용자 성과가 아닙니다.', 'Part counts describe dataset size, not authored models or user outcomes.'), L('여성 데이터는 일부 전신 골격·근육이 없는 참조 장기 세트입니다.', 'The female reference set lacks some full-body skeletal and muscular coverage.')] }],
        limitations: [L('교육·탐색용 시각화이며 데이터 출처와 성별 커버리지가 다릅니다.', 'An educational explorer with different data sources and coverage by reference set.')]
      }
    ],
    experience: [
      { period: '2025.09–', org: L('라이크 코퍼레이션', 'LIKE Corporation'), role: L('AI 제품 개발', 'AI product engineering'), description: L('진료 보조 RAG, 회의 어시스턴트, 사내 서비스와 생성형 콘텐츠 제작.', 'Clinical RAG, a meeting assistant, internal products, and generative content.') },
      { period: '2025.08–', org: L('스마트 도슨트', 'Smart Docent'), role: L('4인 팀 리더', 'Team lead · four people'), description: L('위치 기반 AI 가이드의 기획과 개발. 문제 정의와 구현을 함께 이끌었습니다.', 'Planning and development of a location-aware AI guide, connecting problem definition and implementation.') },
      { period: '2023.04–2025.12', org: L('비욘드 코딩', 'Beyond Coding'), role: L('코딩 강의 · 영어 수업', 'Coding instructor · English-language classes'), description: L('국제학교 학생 대상 코딩 수업. 기술 개념을 상대방의 언어로 설명하는 경험.', 'Coding classes for international-school students, explaining technical ideas to a different audience.') },
      { period: '2023.08', org: L('고려대학교', 'Korea University'), role: L('컴퓨터융합소프트웨어 · 뇌인지융합과학', 'Computer software · brain and cognitive science'), description: L('컴퓨터융합소프트웨어와 뇌인지융합과학 융합전공 졸업. NUS Computer Science 교환 경험.', 'Graduated with interdisciplinary study in computer software and brain/cognitive science, with a Computer Science exchange at NUS.') }
    ],
    creative: [
      { title: L('KHNP · 어린이 에너지 교육', 'KHNP · energy education'), subtitle: L('5부작 교육 영상 · 2026.03', 'Five-part educational series · Mar 2026'), image: 'assets/khnp1.jpg', links: [link('EP.01', 'EP.01', 'https://drive.google.com/file/d/1qXeo93qAtf5ZScoGAg2sr_XUSUJUUD4k/view'),link('EP.02', 'EP.02','https://drive.google.com/file/d/1oCVM7z9ByHbd61RsIWd_DtN5Ya-glV-X/view'),link('EP.03','EP.03','https://drive.google.com/file/d/1OmeKei2SqGnEZbQDR4XhA7_KWz8U78xq/view'),link('EP.04','EP.04','https://drive.google.com/file/d/1Y9VC2tBBBYpbxYZggKfIQfQwfGhqx7TB/view'),link('EP.05','EP.05','https://drive.google.com/file/d/1FZ0CYLo6OuPIOsXauWf5Ls1_P6Nn6TWg/view')] },
      { title: 'N.O.W', subtitle: L('서울콘 DDP 초대 전시 · 2025.12', 'Invited exhibition · SeoulCon DDP · Dec 2025'), image: 'assets/now-art.jpg', links: [link('작품 보기','View artwork',origin+'assets/now-art.jpg')] },
      { title: L('안암병원 앱 스플래시', 'Anam Hospital app splash'), subtitle: L('오프닝 · 로딩 디자인 · 2026.07', 'Opening and loading design · Jul 2026'), image: 'assets/anam-splash.jpg', links: [link('영상 보기','Watch video','https://drive.google.com/file/d/1gbLiowTyFQ6U6GwdoBja8qWKGgK_bbvH/view')] }
    ],
    archive
  };
  return data;
});
