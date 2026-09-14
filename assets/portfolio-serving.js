/* Serving Lab case content shared by the website and PDF. */
(function(root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.HYUNAE_SERVING = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const L = (ko, en) => ({ko, en});
  const repo = 'https://github.com/hyunaeee/aengdo-portfolio';
  const origin = 'https://hyunaeee.github.io/aengdo-portfolio/';
  const modules = [
    {id:'manifest',name:'Manifest',file:'manifest.py',tag:'SHA-256',title:L('실행 조건을 하나의 버전으로 고정','Pin the complete execution context'),body:L('모델·tokenizer revision과 이미지 digest, 프롬프트·데이터·실행 코드의 hash를 하나의 manifest로 묶었습니다. 설정이나 파일이 바뀌면 같은 후보로 통과하지 못합니다.','Model and tokenizer revisions, image digests, and prompt, data and runtime hashes share one manifest. Changed inputs cannot pass as the same candidate.'),proof:L('프롬프트·runtime 변조와 환경 불일치 차단','Prompt/runtime tampering and environment mismatch rejected')},
    {id:'quality',name:'Quality gate',file:'quality.py',tag:'12 CASES',title:L('존재하지 않는 인용과 과잉 거부 차단','Reject invented citations and over-refusal'),body:L('MED-RAG 실험에서 드러난 실패를 합성 회귀 검사로 옮겼습니다. 출처 파일, 직접 인용, 기대 사실과 답변 가능 여부를 확인합니다. 아래에서 정상·결함 답변을 직접 비교할 수 있습니다.','Failures from MED-RAG informed synthetic regression checks for sources, direct quotations, expected facts and answerability. Compare the good and defective responses below.'),proof:L('정상 12/12 · 결함 2건 탐지','Good 12/12 · two defective cases detected')},
    {id:'release',name:'Release',file:'release.py',tag:'RECOMPUTE',title:L('요약의 pass 대신 원본을 다시 검사','Recheck raw evidence before packaging'),body:L('저장된 pass 표시만 믿지 않고 응답과 raw 측정 기록에서 결과를 다시 계산합니다. 통과한 후보만 manifest hash 경로에 준비하고, 기존 artifact 덮어쓰기를 막았습니다.','The release gate recomputes results from responses and raw records instead of trusting a saved pass flag. Passing candidates are prepared under the manifest hash without overwriting existing artifacts.'),proof:L('결함 후보·요약 변조 모두 artifact 생성 전 차단','Bad candidate and edited summary blocked before artifact creation')},
    {id:'gateway',name:'Gateway',file:'gateway.py',tag:'HTTP / SSE',title:L('요청 수와 응답 수명에 경계 설정','Bound admission and streaming lifetime'),body:L('동시 요청 제한, readiness와 manifest 식별, SSE 전달, deadline과 연결 정리를 구현했습니다. 실제 게이트웨이를 로컬 합성 upstream에 연결해 429·503·504와 끊긴 스트림을 확인했습니다.','Implemented admission limits, readiness and manifest identity, SSE forwarding, deadlines and connection cleanup. The real gateway was exercised against a local scripted upstream for 429, 503, 504 and interrupted streams.'),proof:L('10개 실제 HTTP 요청 · 마지막 inflight 0','10 real HTTP requests · final inflight 0')},
    {id:'observe',name:'Evidence',file:'rehearsal.py',tag:'CI / METRICS',title:L('검증 과정을 다시 실행할 수 있게 기록','Make the verification reproducible'),body:L('격리된 두 CPU 서버를 임시 포트로 실행하고, 실패 주입과 복구 확인 후 종료합니다. 요청 카운터·실행 순서·소스 hash를 JSON과 Prometheus 형식으로 저장하고 CI에서 반복합니다.','Two isolated CPU servers run on temporary ports, exercise failure and recovery, and then stop. Request counters, event order and source hashes are captured as JSON and Prometheus text and repeated in CI.'),proof:L('14개 계약 확인 · 31개 Python 테스트','14 rehearsal contracts · 31 Python tests')}
  ];
  const project = {
    id:'serving-lab',number:'05',title:'MED-RAG Serving Lab',period:'2026.09',
    summary:L('LLM 변경을 검사하고 배포 후보를 준비하는 MLOps 실험. 실제 HTTP 게이트웨이에 장애를 주입하고, 품질 회귀와 artifact 변조를 배포 준비 단계에서 차단했습니다.','An MLOps lab for validating LLM changes and preparing release candidates. It exercises the real HTTP gateway under injected faults and blocks quality regressions and artifact tampering before packaging.'),
    status:L('공개 코드 · CPU 통합 검증 · 실행 기록','Public code · CPU integration checks · recorded evidence'),
    role:L('버전 고정 · 평가 gate · SSE gateway · 릴리스 검사 · CI · 시각화','Version locking · evaluation gate · SSE gateway · release checks · CI · visualization'),
    stack:['Python','HTTP / SSE','Docker Compose','Prometheus','GitHub Actions'],
    image:{src:'assets/serving-lab.png',alt:L('MED-RAG Serving Lab의 실제 화면: 구현 모듈과 품질 gate, 요청 기록','Actual MED-RAG Serving Lab interface: implemented modules, quality gates and request evidence')},
    imageCaption:L('실행 기록 탐색 화면 · 실제 로컬 HTTP와 고정 합성 응답 사용','Recorded evidence explorer · real loopback HTTP and fixed synthetic responses'),
    metrics:[
      {value:'31',label:L('Python 테스트 통과','Python tests passed'),note:L('CPU 계약 · HTTP 통합 검사','CPU contracts · HTTP integration')},
      {value:'14',label:L('실행 시나리오 계약 확인','Rehearsal contracts checked'),note:L('정상 · 과부하 · 장애 · 복구 · gate','Normal · overload · faults · recovery · gates')},
      {value:'2 / 12',label:L('결함 fixture 탐지','Defective fixture cases detected'),note:L('모델 품질 점수가 아닌 검사 검증','Validates checks, not model quality')}
    ],
    links:[
      {label:L('실행 기록 탐색','Explore recorded evidence'),url:origin+'work/serving-lab/',kind:'demo'},
      {label:L('구현 코드','Source code'),url:repo+'/tree/main/med-rag-serving',kind:'code'},
      {label:L('원본 실행 기록','Raw run evidence'),url:origin+'med-rag-serving/reports/rehearsal/evidence.json',kind:'source'},
      {label:L('자동 검사','CI runs'),url:repo+'/actions/workflows/serving-lab.yml',kind:'source'}
    ],
    sections:[
      {id:'implementation',eyebrow:'01 / IMPLEMENTATION',title:L('구현 범위','Implementation'),body:[L('모델·데이터·runtime을 manifest로 고정하고, 인용·과잉 거부 검사를 릴리스 준비에 연결했습니다. 게이트웨이는 동시 요청 4개, readiness, SSE 전달과 deadline을 관리합니다.','A manifest pins model, data and runtime inputs. Citation and over-refusal checks gate release preparation. The gateway manages four concurrent requests, readiness, SSE forwarding and deadlines.')],diagram:modules.slice(0,4).map(m=>({label:m.name,detail:m.tag}))},
      {id:'evidence',eyebrow:'02 / EVIDENCE',title:L('실행 결과','Recorded results'),body:[L('실제 loopback HTTP 10건에서 완료 6건, 용량 초과 1건, 주입한 상류 오류 3건을 기록했습니다. 장애 해제 후 200 응답과 inflight 0을 확인했습니다. 정상 fixture는 12건 통과했고, 결함 2건과 변조한 요약은 artifact 생성 전에 차단됐습니다.','Ten real loopback HTTP requests yielded six completions, one capacity rejection and three injected upstream errors. After fault removal, responses returned to 200 and inflight to zero. All 12 good fixtures passed; two defective cases and an edited summary were blocked before packaging.')]}
    ],
    decisions:[{title:L('서버 동작 검증과 모델 성능을 분리','Separate server contracts from model performance'),body:L('실제 gateway와 client를 사용하되 upstream 답변은 고정했습니다. 제어 로직을 재현하면서 GPU 성능으로 오인할 숫자를 만들지 않았습니다.','The real gateway and client run against fixed upstream replies, making control behavior reproducible without presenting it as GPU performance.')}],
    limitations:[L('GPU inference·모델 지연·처리량·독립 품질 평가·실제 배포 교체 및 롤백은 미측정입니다. 현재 사이트는 저장된 실행 기록을 탐색하며 inference 서버를 호출하지 않습니다.','GPU inference, model latency/throughput, independent quality and live rollout/rollback remain unmeasured. This site explores recorded evidence and does not call an inference service.')]
  };
  return {project,modules};
});
