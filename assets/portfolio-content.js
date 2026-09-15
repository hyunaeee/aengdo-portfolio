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
    updatedAt: '2026-09-15',
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
        id: 'med-rag', number: '01', title: 'MED-RAG', nextCase: 'meeting',
        summary: L('고려대학교 안암병원 유방암 진료 교수의 개인 PC에서 사용하는 진료 보조 RAG. 2025년 10월 설치 이후 진료·필요 시 사용되며 원격 업데이트를 이어가고 있습니다.', 'A local RAG assistant used on the personal computer of a professor treating breast cancer at Korea University Anam Hospital. Installed in October 2025, it is used during clinical work and as needed, with ongoing remote updates.'),
        status: L('개인 PC에서 사용 중 · 원격 유지보수', 'In use on a personal PC · remote maintenance'),
        role: L('RAG 구현 · 설치·원격 유지보수 · 공개 평가·튜닝', 'RAG implementation · installation and remote maintenance · public evaluation and tuning'),
        period: '2025.10–',
        stack: ['Python', 'Ollama', 'Chroma', 'Vertex AI / ADK', 'QLoRA'],
        image: { src: 'assets/medrag.jpg', alt: L('합성 예시로 재현한 MED-RAG 화면: 답변 옆에서 검색 근거를 확인', 'MED-RAG UI demo with synthetic examples and visible retrieved evidence') },
        imageCaption: L('공개 UI 데모 · 예시 답변은 사전 구성된 합성 데이터입니다.', 'Public UI demo · responses are preconfigured synthetic examples.'),
        metrics: [
          { value: '23 / 24', label: L('정답 문서 검색', 'Gold-source retrieval'), note: L('39개 합성 문서 · 184개 청크', '39 synthetic documents · 184 chunks') },
          { value: '20 / 24', label: L('근거를 확인한 답변 평가 통과', 'Evidence-aware answer evaluation'), note: L('Gemini 2.5 Pro judge · 2026.07.29', 'Gemini 2.5 Pro judge · Jul 29, 2026') },
          { value: 'RTX 5090', label: L('초기 로컬 실행 환경', 'Initial local run'), note: L('초기 실행 기록 · 교수 개인 PC 사양과 구분', 'Initial run record · distinct from the professor’s PC specifications') }
        ],
        links: [
          link('평가 보고서', 'Evaluation report', repo + '/blob/main/med-rag-vertex/eval/report.md'),
          link('공개 코드', 'Public code', repo + '/tree/main/med-rag-vertex', 'code'),
          link('UI 데모', 'UI demo', origin + 'med-rag/', 'demo'),
          link('QLoRA 실험', 'QLoRA experiment', repo + '/tree/main/med-rag-tune'),
          link('Serving Lab 실행 기록', 'Serving Lab evidence', origin + 'work/serving-lab/', 'demo')
        ],
        decisions: [
          { title: L('개인 PC에서 실행하고 원격으로 유지보수', 'Local execution with remote maintenance'), body: L('Gemma 3 27B와 Ollama 기반 로컬 추론을 구성해 교수 개인 PC에 설치했습니다. 설치 이후에도 원격 업데이트를 담당하고 있습니다. 초기 RTX 5090 실행 기록은 교수 PC의 하드웨어 사양과 구분합니다.', 'The local Gemma 3 27B and Ollama system was installed on the professor’s personal PC, with remote updates after installation. The initial RTX 5090 run is separate from the hardware specification of that PC.') },
          { title: L('평가자에게 근거를 함께 전달하기', 'Give the judge the evidence'), body: L('질문과 답변만 평가하면 그럴듯한 설명이 높은 점수를 받았습니다. 검색된 문서를 함께 전달해 실제 근거성을 검사했습니다.', 'A judge that only sees a question and answer can reward plausibility. Passing the retrieved documents made grounding testable.') },
          { title: L('튜닝보다 나은 선택을 인정하기', 'Choose the stronger baseline'), body: L('QLoRA는 위조 인용을 줄였지만 과잉 거부를 늘렸습니다. 라벨을 고쳐도 기본 모델이 전반적인 judge 점수에서 앞서, 기본 모델과 엄격한 프롬프트를 권장했습니다.', 'QLoRA reduced fabricated quotes but increased over-refusal. Even after label repair, the base model led on overall judge scores, supporting a base-model-and-strict-prompt recommendation.') }
        ],
        sections: [
          { id: 'context', eyebrow: '01 / INSTALLATION & USE', title: L('설치와 현재 사용', 'Installation and current use'), body: [L('2025년 10월, 고려대학교 안암병원에서 유방암 진료를 담당하는 교수의 개인 PC에 설치했습니다. 교수는 진료 중이나 필요할 때 사용하고 있으며, 설치 이후에도 제가 원격으로 중간중간 업데이트하고 있습니다.', 'In October 2025, I installed the system on the personal computer of a professor treating breast cancer at Korea University Anam Hospital. The professor uses it during clinical work and as needed, and I continue to provide remote updates.'), L('증례와 가이드라인을 검색하고 답변의 근거 문서를 확인하는 구조입니다. 납품판 코드와 자료는 비공개이며, 공개한 성능 수치는 별도로 만든 Vertex 포트와 합성 데이터 실험의 결과입니다.', 'The system retrieves cases and guidelines and exposes the sources behind answers. The delivered code and material remain private; published performance metrics come from a separate Vertex port and synthetic-data experiments.')] },
          { id: 'delivery-scope', eyebrow: '02 / USE & EXPERIMENTS', title: L('개인 PC 운영과 공개 실험', 'Personal-PC use and public experiments'), body: [L('현재 사용·지원 현황은 2026.09.15 프로젝트 담당자가 제공한 내용입니다. 설치 범위는 교수 개인 PC이며, 원격 업데이트로 사용을 지원합니다. 공개 실험에서는 검색·답변 품질과 튜닝 선택을 별도로 검증했습니다.', 'Current use and support are reported by the project owner as of Sep 15, 2026. The installation is scoped to the professor’s personal PC, supported through remote updates. Separate public experiments evaluate retrieval, answer quality, and tuning choices.')], table: { headers: [L('단계', 'Stage'), L('환경', 'Environment'), L('사용·지원 또는 검증 범위', 'Use, support, or evaluation scope')], rows: [
            [L('설치 · 2025.10', 'Installed · Oct 2025'), L('교수 개인 PC · 로컬 추론', 'Professor’s personal PC · local inference'), L('진료 중·필요 시 사용 · 이후 원격 업데이트', 'Used during clinical work and as needed · remote updates since installation')],
            [L('공개 RAG 평가', 'Public RAG evaluation'), 'Vertex AI / ADK · Gemini 2.5 Flash', L('합성 문서 39개 · 질문 24개 · 코드와 평가 보고서', '39 synthetic documents · 24 questions · code and evaluation report')],
            [L('튜닝 비교', 'Fine-tuning comparison'), 'Qwen2.5-7B · QLoRA · RTX 4090', L('학습 154개 · 검증 30개 · Base / v1 / v2 비교', '154 training examples · 30 validation cases · Base / v1 / v2 comparison')]
          ] } },
          { id: 'architecture', eyebrow: '03 / SYSTEM', title: L('시스템 구조', 'Architecture'), body: [L('증례를 먼저 찾고 가이드라인으로 보완합니다. 같은 나이와 성별만으로 같은 증례라고 판단하지 않도록 조건을 두고, 근거가 약할 때 불확실성을 드러내게 했습니다. 공개 Vertex 포트에서는 검색·초안과 검토를 두 단계 에이전트로 구성했습니다.', 'Cases are retrieved first, then supported by guidelines. The system checks clinical similarity beyond age and sex and surfaces uncertainty when evidence is insufficient. The public Vertex port uses a two-stage research-and-review agent.')], diagram: [
            { label: L('질문', 'Question'), detail: L('증례 · 필요한 근거', 'Case and evidence needs') },
            { label: L('검색', 'Retrieve'), detail: L('Chroma · 증례 / 가이드라인', 'Chroma · cases / guidelines') },
            { label: L('초안', 'Research'), detail: L('근거를 포함한 답변', 'Draft with source evidence') },
            { label: L('검토', 'Review'), detail: L('근거 · 불확실성 확인', 'Grounding and uncertainty') }
          ] },
          { id: 'evaluation', eyebrow: '04 / EVIDENCE', title: L('평가 결과', 'Evaluation'), body: [L('기존 평가자는 실제 검색 문서를 보지 못했습니다. 문서를 전달한 뒤 답변 평가가 24/24에서 20/24로 바뀌었고, 존재하지 않는 인용과 근거 없는 설명을 발견했습니다.', 'The original judge never saw the retrieved documents. Including them changed the answer pass rate from 24/24 to 20/24 and exposed invented quotations and unsupported claims.'), L('검색 성공과 답변 품질을 나눠 평가했습니다. 정답 문서를 찾는 것만으로 근거 있는 답변이 보장되지는 않았습니다.', 'Retrieval and answer quality are measured separately: finding the right document did not guarantee a grounded answer.')], table: { headers: [L('검증 항목', 'Measure'), L('결과', 'Result'), L('조건', 'Conditions')], rows: [
            [L('정답 문서 검색', 'Gold document retrieved'), '23/24', L('파일명 기준 객관 평가', 'Objective source-filename check')],
            [L('답변 평가 통과', 'Answer evaluation pass'), '20/24', L('검색 문서를 보는 LLM judge', 'Evidence-aware LLM judge')],
            [L('근거성', 'Groundedness'), '4.42 / 5', L('24개 합성 질문', '24 synthetic questions')],
            [L('응답 시간 p50 / p95', 'Latency p50 / p95'), '35.98s / 52.99s', L('2단계 에이전트 전체 · n=24', 'Whole two-stage agent · n=24')],
            [L('요청당 비용', 'Cost per request'), '$0.006542', L('생성 + 임베딩 추정 · judge 제외', 'Generation + estimated embedding · excludes judge')]
          ] } },
          { id: 'failure-evidence', eyebrow: '05 / FAILURE ANALYSIS', title: L('정답 문서를 찾고도 실패한 답변', 'A retrieved source does not guarantee a grounded answer'), body: [L('q14는 정답 문서를 찾았지만, 평가에 제공된 근거에 없는 인용문으로 실패 판정을 받았습니다. 평가 보고서에서 실패한 q06·q14·q22·q23은 모두 정답 문서를 검색한 사례였습니다. 검색 recall만 보고 통과시키면 이 오류를 놓칩니다.', 'In q14, the correct source was retrieved, but the judge failed a quotation absent from the evidence it was given. All four failed cases, q06, q14, q22, and q23, retrieved a gold document. A retrieval-recall gate alone would miss these errors.'), L('반대로 q08은 정답 문서를 찾지 못했지만 적절한 답변 유보로 judge 평가를 통과했습니다. 검색 누락, 잘못된 근거 주장, 적절한 유보를 서로 다른 결과로 기록해야 한다는 판단으로 이어졌습니다.', 'Conversely, q08 missed the gold source but passed the judge through appropriate abstention. Retrieval misses, unsupported claims, and appropriate abstention therefore need separate outcomes.')], diagram: [
            { label: L('검색 검사', 'Retrieval check'), detail: L('정답 파일명과 대조', 'Compare gold source filenames') },
            { label: L('근거 전달', 'Evidence to judge'), detail: L('검색 문서 텍스트 포함', 'Include retrieved document text') },
            { label: L('답변 검사', 'Answer check'), detail: L('주장 · 인용 · 유보 구분', 'Claims · quotes · abstention') },
            { label: L('실패 분석', 'Inspect failures'), detail: L('문항별 판정 사유 확인', 'Read per-case reasons') }
          ], links: [link('문항별 평가 보고서', 'Per-case evaluation report', repo + '/blob/main/med-rag-vertex/eval/report.md'), link('평가 구현', 'Evaluation code', repo + '/blob/main/med-rag-vertex/eval/run_eval.py', 'code')] },
          { id: 'iteration', eyebrow: '06 / ITERATION', title: L('QLoRA 실험과 모델 선택', 'QLoRA experiments and model selection'), body: [L('Qwen2.5-7B를 154개 예제로 QLoRA 학습했습니다. 위조 인용은 2건에서 0건으로 줄었지만, 답할 수 있는 질문까지 거부하는 문제가 생겼습니다.', 'QLoRA training on 154 examples reduced fabricated quotes from two to zero, but the Qwen2.5-7B model began refusing answerable questions.'), L('거부 예제 37개 중 8개(약 22%)에 잘못된 라벨이 있었습니다. 이를 수정한 v2에서 근거성과 유용성이 회복됐지만 기본 모델은 넘지 못했습니다. 22%의 분모는 전체 학습셋이 아닌 거부 예제입니다.', 'Eight of 37 abstention examples (about 22%) were mislabeled. Repairing them improved v2, but it still trailed the base model. The 22% denominator is the abstention subset, not the full training set.'), L('이 비교에서는 기본 모델에 엄격한 프롬프트와 검토 단계를 결합하는 구성을 권장했습니다. 공개 실험의 모델 선택 결론이며 병원 납품판의 모델을 교체했다는 의미는 아닙니다.', 'This comparison supports recommending the base model with a strict prompt and review stage. It is a public-experiment recommendation, not evidence that the hospital delivery changed models.')], table: { headers: [L('모델', 'Model'), L('위조 인용', 'Fabricated quotes'), L('근거성 / 유용성', 'Grounding / helpfulness')], rows: [['Base', '2', '4.80 / 4.63'], ['QLoRA v1', '0', '4.40 / 4.13'], ['QLoRA v2', '0', '4.63 / 4.30']] }, bullets: [L('같은 30개 검증 문항을 Base·v1·v2 비교에 재사용했습니다. 반복 개선 후 처음 보는 최종 테스트셋 성적은 아닙니다.', 'The same 30 validation cases were reused for Base, v1, and v2. These are not results on an untouched final test set after iteration.'), L('초기 RTX 5090 로컬 실행과 QLoRA 기록의 RTX 4090 학습은 서로 다른 실험입니다.', 'Initial local inference on RTX 5090 and recorded QLoRA training on RTX 4090 are separate experiments.')] },
          { id: 'operations', eyebrow: '07 / SERVING LAB', title: L('MED-RAG Serving Lab', 'MED-RAG Serving Lab'), body: [L('품질 gate, 모델·데이터 버전 고정, 스트리밍 지연 측정과 수동 롤백 절차를 공개 코드로 구현했습니다. CPU 테스트 31개와 실제 로컬 HTTP 시나리오 계약 14개를 확인했습니다. 정상 fixture 통과, 결함 후보 및 변조된 요약의 release 차단을 실행 기록 탐색 페이지에서 확인할 수 있습니다.', 'Public code implements quality gates, pinned model and data versions, streaming latency measurement, and manual rollback procedures. Thirty-one CPU tests and 14 real-loopback rehearsal contracts pass. The evidence explorer shows a good fixture passing and defective candidates and edited summaries blocked before release preparation.'), L('GPU 성능과 복구 시간은 아직 측정하지 않았습니다. 현재 운영 중인 RTX 4090 회의 서비스와 분리된 환경에서 측정한 뒤 결과를 추가합니다.', 'GPU performance and recovery time have not yet been measured. Results will be added after testing in an environment separated from the active RTX 4090 meeting service.')], diagram: [
            { label: L('버전 기록', 'Version'), detail: L('코드 · 모델 · 데이터', 'Code · model · data') },
            { label: L('품질 확인', 'Evaluate'), detail: L('인용 오류 · 과잉 거부', 'Citation errors · over-refusal') },
            { label: L('서빙', 'Serve'), detail: L('지연 · 큐 · GPU', 'Latency · queues · GPU') },
            { label: L('복구', 'Recover'), detail: L('이전 artifact', 'Previous artifact') }
          ] }
        ],
        limitations: [L('실제 사용 범위는 교수 개인 PC입니다. 사용 횟수·시간 절감·임상 효과의 수치는 제시하지 않으며, 공개 합성 실험 점수는 이 운영 성과를 나타내지 않습니다.', 'Actual use is scoped to the professor’s personal PC. Usage counts, time savings, and clinical outcomes are not reported; public synthetic scores do not represent those operating outcomes.'), L('평가자에게 전달하는 문서는 파일별 앞 2,200자로 제한됩니다. LLM judge 점수는 전문가 검토와 독립적인 최종 테스트를 대신하지 않습니다.', 'Evidence sent to the judge is limited to the first 2,200 characters per document. LLM-judge scores do not replace expert review or an independent final test.'), L('MED-RAG 모델 서빙의 처리량·장애 복구 실측은 별도 실험 과제로 남아 있습니다.', 'MED-RAG model-serving throughput and incident recovery remain separate measurement tasks.')]
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
        id: 'meeting', number: '03', title: 'Meeting Assistant', nextCase: 'med-rag',
        summary: L('약 32명 규모 회사의 교육부·개발부에서 사용하는 회의 어시스턴트. 기획부터 개발·배포·운영·유지보수까지 담당하며 RTX 4090 서버에서 운영합니다.', 'A meeting assistant used by the education and development departments of a company of approximately 32 people. I own planning, development, deployment, operations, and maintenance on an RTX 4090 server.'),
        status: L('사내 운영 · 공개 UI 데모', 'Internal operation · public UI demo'),
        role: L('단독 담당 · 기획 / 개발 / 배포 / 운영 / 유지보수', 'Sole owner · planning / development / deployment / operations / maintenance'), period: '2026.06–',
        stack: ['Python', 'faster-whisper', 'pyannote', 'Claude API', 'Docker', 'Google SSO'],
        image: { src: 'assets/meeting.jpg', alt: L('회의 어시스턴트의 녹음 설정과 마이크 테스트 UI 데모', 'Meeting Assistant UI demo showing meeting setup and microphone testing') },
        imageCaption: L('공개 UI 데모 · 샘플 데이터로 흐름을 체험합니다.', 'Public UI demo · explore the workflow with sample data.'),
        metrics: [
          { value: '32', label: L('통계에 기록된 회의 건수', 'Recorded meetings'), note: L('2026.08 + 09월 제공 통계 · 활성 사용자 수 아님', 'Aug + Sep 2026 supplied counts · not active users') },
          { value: '833 min', label: L('기록된 회의 길이 합계', 'Total recorded meeting duration'), note: L('월별 363 + 470분 · 절감 시간 아님', '363 + 470 minutes · not time saved') },
          { value: 'RTX 4090', label: L('현재 운영 환경', 'Current deployment'), note: L('사내 서비스 · 단독 운영·유지보수', 'Internal service · sole operations and maintenance owner') }
        ],
        links: [link('UI 데모', 'UI demo', origin + 'meeting/', 'demo')],
        decisions: [
          { title: L('요청 수명과 작업 수명 분리', 'Separate requests from jobs'), body: L('긴 GPU 처리는 서버 작업으로 유지하고 화면은 작업 ID로 진행 상황을 조회합니다. 업로드 시작 응답이 유실된 경우에는 조건에 맞는 기존 작업을 찾아 연결합니다.', 'Long GPU processing lives in a server job while the UI polls its ID. If the upload response is lost, the client looks for a matching existing job and reconnects.') },
          { title: L('완성되지 않아도 남길 수 있는 결과 보존', 'Preserve useful partial results'), body: L('화자 분리 실패 시 화자 없는 전사로 이어가고, 요약 실패 시 전사본을 보존합니다. 생성된 회의록과 Notion 전달 오류도 각각 기록합니다.', 'Diarization failure can fall back to a transcript without speaker labels; summarization failure preserves the transcript. Generated minutes and Notion delivery errors are recorded separately.') },
          { title: L('복구 가능성과 성공률 구분', 'Distinguish recovery paths from success rates'), body: L('재연결·재처리 경로가 있다는 사실과 실제 복구 성공률은 다릅니다. 완료 상태만 세면 요약·외부 저장 실패가 누락될 수 있어 단계별 결과를 함께 봐야 합니다.', 'Implemented reconnection and retry paths do not establish a recovery success rate. A done status can coexist with summary or external-storage failure, so stage outcomes must be counted separately.') }
        ],
        sections: [
          { id: 'context', eyebrow: '01 / WORKFLOW', title: L('사용 맥락과 구현 범위', 'Workflow and implementation'), body: [L('CLI 도구를 사내 직원이 브라우저에서 사용하는 웹 UI와 Docker 서비스로 확장했습니다. 녹음 이후 전사, 발언자 구분, 회의록 작성, Notion 저장과 메일 전달까지 연결한 프로젝트입니다.', 'A CLI tool became a web interface and Docker service for internal staff, connecting recording, transcription, speaker attribution, minutes, Notion storage, and email delivery.'), L('기획부터 음성 처리 파이프라인과 웹 UI 개발, 로그인·권한 구성, 배포, 운영·유지보수까지 단독으로 담당했습니다. 교육부·개발부 사용자의 요청을 받아 오류 대응 화면, 녹음 파일 백업, 안드로이드 웹앱을 추가했습니다.', 'I am the sole owner across planning, the speech pipeline and web UI, sign-in and access boundaries, deployment, operations, and maintenance. Requests from education and development staff led to an error-management UI, recording backups, and an Android web app.')] },
          { id: 'usage-evidence', eyebrow: '02 / USAGE · 2026.08–09', title: L('월별 이용 기록', 'Monthly usage records'), body: [L('약 32명 규모 회사의 교육부·개발부에서 사용합니다. 아래는 2026.09.15에 공유된 운영 화면의 월별 집계입니다. 개인별 이름과 이용 내역은 제외했습니다.', 'The service is used by the education and development departments of a company of approximately 32 people. These monthly aggregates were supplied from the operating UI on Sep 15, 2026; individual names and activity are omitted.')], table: { headers: [L('기간', 'Period'), L('기록 건수', 'Recorded meetings'), L('회의 길이 합계', 'Meeting duration')], rows: [
            ['2026.08', '10', L('363분', '363 min')],
            [L('2026.09 · 9/15 제공 시점', '2026.09 · supplied Sep 15'), '22', L('470분', '470 min')]
          ] }, bullets: [L('합계 32건·833분. 분 단위 값은 기록된 회의 길이이며 모델 처리 시간이나 업무 절감 시간이 아닙니다.', 'Total: 32 recorded meetings and 833 minutes. Minutes describe recorded meeting duration, not model latency or staff time saved.'), L('9월은 월중 집계입니다. 회사 인원은 활성 사용자 수가 아니며, 이 통계만으로 성공률·반복 사용률·월간 성장률을 계산하지 않습니다.', 'September is a partial month. Company headcount is not active users; these aggregates alone do not establish success, retention, or monthly growth rates.')] },
          { id: 'user-feedback', eyebrow: '03 / USER REQUESTS', title: L('사용자 요청으로 바꾼 기능', 'Changes driven by user requests'), body: [L('오류가 나면 운영 담당자인 제가 바로 상태를 파악하고 처리할 수 있도록 로그·완료·실패 기록과 재시도를 UI에 모았습니다. 녹음 보관과 쉬운 모바일 사용 요청도 각각 백업 기능과 안드로이드 웹앱에 반영했습니다.', 'As the operations owner, I brought logs, completed and failed jobs, and retry actions into the UI so I can investigate failures and respond. Requests to retain recordings and simplify mobile use led to backups and an Android web app.')], table: { headers: [L('요청·운영 필요', 'Request or operational need'), L('반영한 변경', 'Delivered change')], rows: [
            [L('오류 위치를 확인하고 바로 대응', 'Locate failures and respond'), L('로그와 완료·실패 기록 조회, UI에서 재처리', 'Inspect logs and completed/failed records; retry from the UI')],
            [L('녹음 파일을 따로 보관', 'Keep a separate recording copy'), L('녹음 파일 백업 기능', 'Recording-file backup')],
            [L('고령 사용자도 쉽게 모바일 녹음', 'Make mobile recording easier for older users'), L('안드로이드 웹앱과 간단한 녹음 흐름', 'Android web app with a simplified recording flow')]
          ] }, bullets: [L('운영 담당자가 제공한 요청 요약과 구현 내용입니다. 사용자 발언의 직접 인용이나 만족도 평가로 제시하지 않습니다.', 'These are request summaries and implementation details supplied by the project owner, not verbatim user quotations or satisfaction measurements.')] },
          { id: 'architecture', eyebrow: '04 / SYSTEM', title: L('시스템 구조', 'Architecture'), diagram: [
            { label: L('음성', 'Audio'), detail: 'faster-whisper' },
            { label: L('화자 분리', 'Diarize'), detail: 'pyannote · RTX 4090' },
            { label: L('회의록', 'Minutes'), detail: 'Claude · structured JSON' },
            { label: L('저장·전달', 'Deliver'), detail: 'Notion · SMTP' }
          ], body: [L('RTX 4090에서 faster-whisper와 pyannote를 실행합니다. 전사·화자 분리 구간은 한 번에 하나씩 처리하고, 대기 중인 작업은 queued 상태로 표시합니다. 전사 텍스트는 외부 Claude API로 보내 구조화한 회의록을 생성합니다.', 'An RTX 4090 runs faster-whisper and pyannote. Transcription and diarization are serialized, with waiting jobs marked queued. Transcript text is sent to the external Claude API to generate structured minutes.'), L('음성 처리 전체를 하나의 HTTP 응답으로 기다리지 않고 작업 ID를 먼저 반환합니다. 화면은 짧은 상태 조회를 반복하므로, 긴 추론 작업의 수명을 프록시 요청 제한과 분리할 수 있습니다.', 'The server returns a job ID instead of holding an HTTP response for the full audio pipeline. Short status polls separate long inference jobs from proxy request limits.')] },
          { id: 'reconnection', eyebrow: '05 / CHANGE · 2026.09', title: L('업로드 응답이 끊겼을 때', 'When the upload response is lost'), body: [L('서버에는 작업이 생성됐는데 시작 응답이 HTML 오류로 돌아오면, 화면에서 JSON 해석 오류가 나고 사용자는 업로드 실패로 받아들일 수 있습니다. 이 경우 새로 업로드하기 전에 본인의 진행 중 작업을 찾아 연결하도록 변경했습니다.', 'A job can be created on the server while its start response arrives as an HTML error. A JSON parsing error then makes the upload appear to have failed. The client now looks for an existing in-progress job before asking the user to upload again.')], diagram: [
            { label: L('응답 확인', 'Inspect response'), detail: L('HTML / 5xx 감지', 'Detect HTML / 5xx') },
            { label: L('작업 조회', 'Find job'), detail: L('본인의 진행 중 작업', 'Own in-progress jobs') },
            { label: L('조건 비교', 'Match context'), detail: L('시각 · 부서 · 등록자 · 길이', 'Time · department · sender · duration') },
            { label: L('다시 연결', 'Reconnect'), detail: L('기존 작업 ID로 상태 조회', 'Poll the existing job ID') }
          ], bullets: [L('서버와 클라이언트의 시각 차이를 보정하고 여러 조건이 일치하는 경우에만 연결합니다. 조건 기반 재연결이며 중복 실행을 완전히 막는 idempotency 보장은 아닙니다.', 'Matching compensates for server/client clock differences and requires several conditions. This is heuristic reconnection, not an idempotency guarantee.'), L('2026.09.11 변경 기록과 구현에서 확인한 동작입니다. 실제 재연결 성공률이나 중복 감소율은 아직 집계하지 않았습니다.', 'The behavior is documented in the Sep 11, 2026 change and implementation. Reconnection success and duplicate reduction have not been aggregated.')] },
          { id: 'recovery', eyebrow: '06 / FAILURE HANDLING', title: L('단계별 실패와 결과 보존', 'Failures and retained results'), table: { headers: [L('상황', 'Failure'), L('구현한 처리', 'Implemented behavior')], rows: [
            [L('화자 분리 실패', 'Diarization fails'), L('화자 라벨 없이 전사 결과로 다음 단계 진행', 'Continue with the transcript without speaker labels')],
            [L('요약 API 실패', 'Summary API fails'), L('전사본과 요약 실패 안내를 저장', 'Save the transcript with a summary-failure notice')],
            [L('Notion 전달 실패', 'Notion delivery fails'), L('회의록을 로컬에 보존하고 전달 오류를 별도로 기록', 'Retain minutes locally and record the delivery error separately')],
            [L('처리 중 서버 재시작', 'Server restarts mid-job'), L('작업 기록을 복원해 중단 상태로 표시. 녹음이 남아 있으면 재처리', 'Restore the job record as interrupted; retry if source audio remains')]
          ] }, body: [L('서버 재시작 후 재처리는 남은 녹음으로 새 작업을 시작하는 방식입니다. 이전 추론의 중간 지점에서 자동 재개하는 구조는 아닙니다.', 'Retry after a restart starts a new job from retained audio; it does not resume inference at a saved checkpoint.')] },
          { id: 'access', eyebrow: '07 / DATA FLOW', title: L('SSO와 데이터 전달 범위', 'Sign-in and data flow'), body: [L('Google SSO로 로그인하며 앱의 목록·상세 화면에서는 본인이 등록한 회의록을 조회합니다. Notion은 별도의 부서별 전달 경로를 사용합니다. 음성의 로컬 처리와 전사 텍스트의 외부 요약 API 전송을 구분해 설명합니다.', 'Google SSO identifies the user; the app lists and opens meetings created by that user. Notion uses separate department delivery routes. Local audio processing is distinct from sending transcript text to an external summary API.'), L('공개 데모는 샘플 데이터로만 동작합니다. 사내 녹음, 전사본, 고객 정보와 운영 자격 증명은 공개 페이지에 포함하지 않습니다.', 'The public demo runs on sample data. Internal recordings, transcripts, customer information, and operational credentials are excluded.')] },
          { id: 'evaluation', eyebrow: '08 / EVIDENCE', title: L('확인한 결과와 측정 범위', 'Evidence and measurement scope'), body: [L('2026.09.15 기준 구현과 변경 기록에서 작업 재연결, 중단 기록 복원, 부분 결과 보존 경로를 확인했습니다. 현재 RTX 4090 사내 운영 환경과 공개 UI 데모는 별도입니다.', 'A Sep 15, 2026 review of implementation and change history confirms reconnection, interrupted-job records, and partial-result retention paths. The current internal RTX 4090 service is separate from the public UI demo.'), L('기존 기록의 “56분 파일, 약 28초”는 청크 방식 화자 분리 단계의 단일 사례입니다. 전체 처리 시간이나 반복 벤치마크로 사용하지 않습니다. 사용 기록은 월별 이용 통계에 제시했습니다. 사람이 절약한 시간, 사용자 만족도와 단계별 성공률은 아직 측정하지 않았습니다.', 'The historical “56-minute file, about 28 seconds” observation covers chunked diarization only. It is not an end-to-end or repeated benchmark. Recorded usage appears in the monthly statistics. Human time savings, satisfaction, and stage-level success rates have not been measured.')] }
        ],
        limitations: [L('구현 기록 검토는 장기 운영 성능이나 전체 보안 검증을 대신하지 않습니다. 사내 코드와 회의 데이터는 비공개입니다.', 'Implementation review does not establish long-term operating performance or a full security assessment. Internal code and meeting data remain private.'), L('완료 작업 수와 요약·전달 성공 수를 구분해야 합니다. 반복 사용, 수동 수정 시간, 재처리 성공률은 별도 집계가 필요합니다.', 'Completed jobs must be distinguished from successful summaries and deliveries. Repeat usage, manual editing time, and retry success require separate aggregation.')]
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
  const serving = typeof module === 'object' && module.exports ? require('./portfolio-serving.js') : globalThis.HYUNAE_SERVING;
  data.projects.push(serving.project);
  const visioneye = typeof module === 'object' && module.exports ? require('./portfolio-visioneye.js') : globalThis.HYUNAE_VISIONEYE;
  data.projects.push(visioneye.project);
  const visioneyePosition = Math.max(0, archive.findIndex(item => item.id === 'serving-lab') + 1);
  data.archive = [...archive.slice(0, visioneyePosition), visioneye.archive, ...archive.slice(visioneyePosition)];
  return data;
});
