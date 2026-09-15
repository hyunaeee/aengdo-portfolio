/* VisionEye case and archive data. Public app and source URLs are kept here. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_VISIONEYE = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIVE_URL = 'https://visioneye-lab.vercel.app';
  const REPO_URL = 'https://github.com/hyunaeee/visioneye-lab';
  const L = (ko, en) => ({ ko, en });
  const source = file => REPO_URL + '/blob/main/' + file;
  const links = [
    { label: L('비교', 'Compare'), url: LIVE_URL, kind: 'demo' },
    { label: L('서버 검증', 'Model server'), url: 'https://hyunaeee.github.io/aengdo-portfolio/work/visioneye/operations.html', urlEn: 'https://hyunaeee.github.io/aengdo-portfolio/work/visioneye/operations-en.html', kind: 'source' },
    { label: L('코드', 'Code'), url: REPO_URL, kind: 'code' },
    { label: L('기록', 'Evidence'), url: source('web/assets/crowd-summary.json'), kind: 'source' },
    { label: L('검수', 'Review'), url: source('web/assets/crowd-review-comparison.json'), kind: 'source' },
    { label: L('논문', 'Papers'), url: source('docs/NEXT_EXPERIMENTS.md'), kind: 'source' }
  ];
  const image = {
    src: 'assets/visioneye.png', width: 1280, height: 720,
    alt: L('VisionEye 실제 비교 화면: 같은 시점의 원본 영상과 반투명 추적 결과', 'Actual VisionEye comparison: synchronized source footage and translucent tracking results')
  };
  const summary = L(
    'YOLO26n과 ByteTrack으로 사람의 이동과 선 통과를 추적합니다. AI 생성 영상의 원본과 분석 결과를 같은 시점에서 비교하고, 실행 기록과 원본 검수로 동작을 확인했습니다.',
    'Tracks people and line crossings with YOLO26n and ByteTrack. Synchronized source and result views make an AI-generated clip inspectable against recorded runs and source-only review.'
  );
  const project = {
    id: 'visioneye', number: '06', title: 'VisionEye', featured: false,
    summary,
    status: L('AI · 생성 영상 검증', 'AI · Generated-video validation'),
    role: L('영상 처리 · 추적·집계 · 비교 화면 · 검수', 'Video processing · tracking and counting · comparison UI · validation'),
    period: '2026.09',
    stack: ['Python', 'YOLO26n', 'ByteTrack'],
    image,
    imageCaption: L('실제 비교 화면 · 웹은 저장된 결과를 재생하며 모델을 실행하지 않습니다.', 'Actual comparison UI · the website replays recorded results and does not run the model.'),
    labels: { decisions: L('판단', 'Decisions'), limits: L('한계', 'Limits') },
    metrics: [
      { value: '4 IN / 8 OUT', label: L('통과', 'Crossings'), note: L('다인 영상 · 방향별 선 통과 이벤트', 'Crowd clip · directional line-crossing events') },
      { value: '361', label: L('프레임', 'Frames'), note: L('1280×720 · 24fps 원본', '1280×720 · 24 fps source') },
      { value: '24.08 FPS', label: L('처리', 'Processing'), note: L('RTX 4090 · 앱 처리 구간 14.991초', 'RTX 4090 · 14.991 s application processing') }
    ],
    links,
    sections: [
      {
        id: 'overview', eyebrow: L('01 / 개요', '01 / Overview'), title: L('개요', 'Overview'),
        body: [L('검출 표시만으로는 사람이 빠지거나 ID가 바뀌는 지점을 확인하기 어렵습니다. 같은 프레임의 원본과 결과를 나란히 재생하고, 반투명 표시와 출입 기록을 함께 살펴보도록 만들었습니다.', 'Detection overlays alone can hide missed people or broken identities. The interface replays the same source and result frames side by side, with translucent overlays and crossing records.'),
          L('로컬 Python 앱이 검출·추적·집계를 수행합니다. 공개 웹은 저장된 영상·CSV·JSON을 보여주는 결과 뷰어입니다.', 'A local Python app performs detection, tracking and counting. The public website is a viewer for recorded videos, CSV and JSON.')]
      },
      {
        id: 'system', eyebrow: L('02 / 구조', '02 / System'), title: L('구조', 'System'),
        diagram: [
          { label: L('입력', 'Input'), detail: L('원본 프레임', 'Source frames') },
          { label: L('검출', 'Detect'), detail: 'YOLO26n' },
          { label: L('추적', 'Track'), detail: 'ByteTrack' },
          { label: L('통과', 'Count'), detail: L('유한한 선 · IN / OUT', 'Finite gate · IN / OUT') },
          { label: L('비교', 'Compare'), detail: L('영상 · 실행 기록', 'Video · run evidence') }
        ],
        body: [L('imgsz 640, confidence 0.1, 선 (0.1, 0.55)→(0.9, 0.55), 아래 방향 IN, 경계 여유 8px을 고정했습니다. 비교 영상은 저장된 검출 좌표로 후처리하며 YOLO를 다시 실행하지 않습니다.', 'The run fixes imgsz 640, confidence 0.1, a gate from (0.1, 0.55) to (0.9, 0.55), downward IN and an 8 px boundary band. Comparison videos are rendered from saved detections without rerunning YOLO.')]
      },
      {
        id: 'evidence', eyebrow: L('03 / 검증', '03 / Evidence'), title: L('검증', 'Evidence'),
        body: [L('Higgsfield로 생성한 다인 영상 361프레임에서 IN 4 / OUT 8을 관측했습니다. 12개 이벤트는 YOLO 결과를 보지 않은 AI의 원본 시각 검수와 대응했습니다. 사람 검수자의 합의 정답이나 현장 정확도 평가는 아닙니다.', 'The 361-frame Higgsfield crowd clip produced 4 IN / 8 OUT. All 12 events matched AI visual review of the source without seeing YOLO results. This is not human-consensus ground truth or a field accuracy evaluation.'),
          L('RTX 4090에서 앱 처리 구간은 14.991초·24.08 FPS, 초기화 포함 전체 실행은 19.722초였습니다. 읽기·검출·추적·집계·solid 렌더·기록·첫 추론 워밍업을 포함하며, 모델 초기화·최종 마무리·별도 반투명 후처리는 처리 FPS에서 제외합니다.', 'On RTX 4090, application processing took 14.991 s at 24.08 FPS; total runtime including initialization was 19.722 s. Processing includes reading, detection, tracking, counting, solid rendering, logging and first-inference warm-up, but excludes model initialization, finalization and separate translucent rendering.')],
        table: {
          headers: [L('입력', 'Input'), L('프레임', 'Frames'), L('IN / OUT', 'IN / OUT'), L('처리 FPS', 'Processing FPS')],
          rows: [[L('다인 AI 영상', 'AI crowd clip'), '361', '4 / 8', '24.08'], [L('2인 AI 영상', 'Two-person AI clip'), '241', '1 / 1', '26.45']]
        },
        bullets: [L('입력 SHA-256, 모델·추적 설정과 실행 기록을 공개합니다. 위 FPS는 단일 파일 실행값이며 카메라 촬영→표시 지연이 아닙니다.', 'Input SHA-256, model/tracker settings and run evidence are published. These FPS values are single-file runs, not camera-to-display latency.'),
          L('가장자리 검출 누락과 ID 16→35 중복·분절을 확인했습니다. 22개 추적 ID를 22명으로 해석하지 않습니다.', 'Observed edge misses and duplicate/fragmented IDs 16→35. Twenty-two track IDs do not mean 22 people.')]
      },
      {
        id: 'model-server', eyebrow: L('04 / 서버', '04 / Server'), title: L('모델 서버', 'Model server'),
        body: [L('별도의 로컬 HTTP 서버에서 YOLO26n 실제 가중치를 CPU로 실행했습니다. 정상 추론 20건과 시간 초과·추론 프로세스 종료 후의 자동 재시작을 확인하고, 실제 검출 좌표·응답 시간·오류 기록을 공개했습니다.', 'A separate local HTTP server runs the actual YOLO26n weights on CPU. Recorded evidence covers 20 normal inferences, deadline handling and automatic recovery after inference-worker termination, with actual boxes, HTTP timings and error logs.'),
          L('CPU FP32·2개 스레드·동시 추론 1개로 고정했습니다. 웹은 기록 뷰어이며 검증 서버는 종료했습니다. GPU 서빙, 장시간 운용, HTTP 서버·호스트 복구 또는 다른 모델 버전으로의 롤백을 검증한 것은 아닙니다.', 'The run fixes CPU FP32, two threads and one inference slot. The website is an evidence viewer and the rehearsal server was stopped. GPU serving, long-running operation, HTTP-server/host recovery and model-version rollback were not tested.')],
        table: { headers: [L('항목', 'Check'), L('관측', 'Observed')], rows: [
          [L('실제 모델 추론', 'Actual model inference'), '20 / 20'],
          [L('동시 요청 제한 / 시간 초과', 'Admission limit / deadline'), '429 / 504'],
          [L('worker 종료 후 재시작', 'Restart after worker exit'), '503 → 200'],
          [L('복구 후 처리 중 요청', 'Inflight after recovery'), '0']
        ]}
      },
      {
        id: 'next', eyebrow: L('05 / 다음', '05 / Next'), title: L('다음', 'Next'),
        body: [L('아래 후보는 모두 미실행입니다. 추적기부터 비교하고, 검출기와 마스크 시스템을 나누어 같은 입력·집계 규칙으로 검증할 계획입니다. 개선 효과·속도·메모리 사용량은 아직 측정하지 않았습니다.', 'All candidates below are untested. Planned comparisons start with the tracker, then separate detector and mask-system changes while holding inputs and counting rules fixed. Improvements, speed and memory use have not been measured.')],
        table: {
          headers: [L('후보', 'Candidate'), L('확인할 점', 'Question'), L('상태', 'Status')],
          rows: [
            ['TrackTrack + ReID', L('ID 분절·연속성과 추가 지연', 'ID continuity, fragmentation and added latency'), L('미실행', 'Not run')],
            ['RF-DETR Small', L('가장자리·부분 인물 검출', 'Edge and partial-person detection'), L('미실행', 'Not run')],
            ['DEIMv2-S', L('검출 누락과 처리 비용', 'Detection misses and processing cost'), L('미실행', 'Not run')],
            ['SAM 3.1', L('마스크·ID 연속성의 시스템 비교', 'System-level mask and ID continuity'), L('미실행', 'Not run')]
          ]
        }
      }
    ],
    decisions: [
      { title: L('원본을 기준으로', 'Review the source'), body: L('생성 프롬프트의 인원과 동선을 정답으로 쓰지 않았습니다. 완성된 원본의 출입을 먼저 검수한 뒤 실행 결과와 대조했습니다.', 'Requested people and paths in the generation prompt were not ground truth. Crossings in the completed source were reviewed before comparison with the run.') },
      { title: L('재실은 미정', 'Occupancy is unknown'), body: L('초기 재실 인원을 모르므로 계산 기준 0과 실제 인원을 구분합니다. 순증감 −4나 하한 보정된 0을 절대 재실 인원으로 해석하지 않습니다.', 'With unknown initial occupancy, the calculation baseline of zero is separate from actual people present. Neither net change −4 nor the clamped zero establishes absolute occupancy.') },
      { title: L('가림과 비교', 'Masking and comparison'), body: L('로컬 기본 마스킹은 solid입니다. 웹의 12% 채움은 원본을 살펴보기 위한 표시로 privacy_protection=false이며, 검출되지 않은 사람은 solid에서도 가려지지 않습니다.', 'The local default is solid masking. The website’s 12% fill is an inspection overlay with privacy_protection=false; undetected people also remain unmasked in solid mode.') }
    ],
    limitations: [
      L('AI 생성 원본 2개, 총 602프레임의 검증입니다. 전 프레임 박스·ID·마스크 정답과 인간 합의 주석이 없어 HOTA·IDF1·현장 정확도는 측정하지 않았습니다.', 'Validation covers two AI-generated clips and 602 frames. Without full-frame box/ID/mask ground truth and human-consensus labels, HOTA, IDF1 and field accuracy remain unmeasured.'),
      L('생성 영상의 부자연스러운 보행, 가장자리 잘림과 유사한 외형이 있습니다. 초기 인원은 미정이며 ID 분절을 고유 인원 증가로 보지 않습니다.', 'Generated footage has unnatural strides, edge cropping and similar appearances. Initial occupancy is unknown, and fragmented IDs are not additional unique people.'),
      L('실제 CCTV·웹캠·RTSP, 장시간 운용, 촬영→표시 지연은 검증하지 않았습니다. 다음 후보의 비교 실험은 수행하지 않았습니다.', 'Real CCTV, webcams, RTSP, long-running operation and capture-to-display latency remain unverified. The planned candidate comparisons have not been run.')
    ]
  };
  return {
    urls: { live: LIVE_URL, repo: REPO_URL },
    project,
    archive: {
      id: project.id, title: project.title, summary, category: 'ai',
      status: L('AI · 실행 검증', 'AI · Run validation'), period: project.period,
      image: image.src, imageAlt: image.alt, imageWidth: image.width, imageHeight: image.height, live: true, caseId: project.id,
      caseLabel: L('보기', 'View'), stack: project.stack, links,
      limitations: L('생성 영상 2개 · 초기 인원 미정 · ID 분절 확인 · 현장 성능 미검증', 'Two generated clips · unknown initial occupancy · observed ID fragmentation · field performance unverified')
    }
  };
});
