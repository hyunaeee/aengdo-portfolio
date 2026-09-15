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
    { label: L('결과', 'Results'), url: source('docs/COMPARISON_RESULTS.md'), kind: 'source' },
    { label: L('기록', 'Runs'), url: REPO_URL + '/tree/main/experiments/results/2026-09-15', kind: 'source' },
    { label: L('검수', 'Review'), url: source('experiments/results/2026-09-15/tracker-review.md'), kind: 'source' },
    { label: L('논문', 'Papers'), url: source('docs/NEXT_EXPERIMENTS.md'), kind: 'source' }
  ];
  const image = {
    src: 'assets/visioneye.png', width: 1280, height: 720,
    alt: L('VisionEye 실제 비교 화면: 같은 시점의 원본 영상과 반투명 추적 결과', 'Actual VisionEye comparison: synchronized source footage and translucent tracking results')
  };
  const summary = L(
    '사람의 이동과 선 통과를 추적합니다. AI 생성 영상 2개에서 검출기 3개와 추적 설정 3개를 실행하고, 원본·결과 영상과 실행 기록을 함께 비교했습니다.',
    'Tracks people and line crossings. Three detectors and three tracker settings were run on two AI-generated clips, with synchronized source/result videos and recorded evidence.'
  );
  const project = {
    id: 'visioneye', number: '06', title: 'VisionEye', featured: false,
    summary,
    status: L('AI · 모델 비교', 'AI · Model comparison'),
    role: L('영상 처리 · 추적·집계 · 비교 화면 · 검수', 'Video processing · tracking and counting · comparison UI · validation'),
    period: '2026.09',
    stack: ['Python', 'YOLO26n', 'ByteTrack', 'TrackTrack'],
    image,
    imageCaption: L('실제 비교 화면 · 웹은 저장된 결과를 재생하며 모델을 실행하지 않습니다.', 'Actual comparison UI · the website replays recorded results and does not run the model.'),
    labels: { decisions: L('판단', 'Decisions'), limits: L('한계', 'Limits') },
    metrics: [
      { value: '4 IN / 8 OUT', label: L('통과', 'Crossings'), note: L('다인 영상 · 방향별 선 통과 이벤트', 'Crowd clip · directional line-crossing events') },
      { value: '602', label: L('원본 프레임', 'Source frames'), note: L('영상 2개 · 조건별 3회 반복', 'Two clips · three repeats per condition') },
      { value: '3', label: L('검출기', 'Detectors'), note: L('검출 3종 · 추적 3설정 실행', 'Three detectors · three tracker settings run') }
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
        body: [L('기본 앱은 YOLO26n + ByteTrack입니다. confidence 0.1, 선 (0.1, 0.55)→(0.9, 0.55), 아래 방향 IN, 경계 여유 8px을 고정했습니다. 비교 영상은 저장된 좌표로 렌더하며 모델을 다시 실행하지 않습니다.', 'The default app uses YOLO26n + ByteTrack. Confidence 0.1, a gate from (0.1, 0.55) to (0.9, 0.55), downward IN and an 8 px boundary band stay fixed. Comparison videos are rendered from saved coordinates without rerunning the model.'),
          L('검출기 비교에는 같은 ByteTrack·집계기를 연결했습니다. 추적기 비교는 첫 YOLO 실행의 박스·점수를 재사용했습니다. 평가 영상에 맞춘 재학습이나 임계값 조정은 하지 않았습니다.', 'Detector comparisons share ByteTrack and the counter. Tracker comparisons reuse boxes and scores from the first YOLO run. No retraining or threshold tuning was performed on the evaluation clips.')]
      },
      {
        id: 'evidence', eyebrow: L('03 / 검출', '03 / Detection'), title: L('검출 비교', 'Detector comparison'),
        body: [L('검출기 3개를 고유 602프레임에서 각각 3회 실행했습니다. 모든 반복에서 다인 영상은 IN 4 / OUT 8, 2인 영상은 IN 1 / OUT 1이었습니다. 반복한 영상을 독립 표본으로 세지 않습니다.', 'Each of three detectors ran three times over 602 unique source frames. Every repeat produced 4 IN / 8 OUT for the crowd clip and 1 IN / 1 OUT for the two-person clip. Repeated footage is not an independent sample.'),
          L('아래 FPS는 RTX 4090의 3회 중앙값과 최솟값–최댓값입니다. 읽기·검출·추적·집계·JSONL 기록을 포함하고 초기화·첫 프레임 5회 워밍업·렌더·영상 인코딩을 제외합니다. GPU 작업은 순차 실행하고 CUDA 완료까지 동기화했습니다.', 'FPS below shows the median and min–max of three runs on RTX 4090. It includes reading, detection, tracking, counting and JSONL logging; initialization, five first-frame warm-ups, rendering and video encoding are excluded. GPU runs were sequential and synchronized through CUDA completion.')],
        table: {
          headers: [L('검출기', 'Detector'), L('입력 · 정밀도', 'Input · precision'), L('다인 FPS', 'Crowd FPS'), L('2인 FPS', 'Two-person FPS')],
          rows: [
            ['YOLO26n', '640 · FP16', '60.89 (58.61–61.23)', '67.01 (59.29–74.07)'],
            ['RF-DETR Small', '512 · FP32 eager', '31.66 (31.04–33.40)', '31.07 (30.81–33.31)'],
            ['DEIMv2-S', '640 · FP32 deploy', '18.29 (15.73–20.88)', '21.57 (20.40–23.01)']
          ]
        },
        bullets: [L('모델별 native 입력·전처리·정밀도가 다릅니다. 동일 연산량의 비교나 일반적인 모델 순위가 아닙니다.', 'Native input size, preprocessing and precision differ by model. This is not an equal-compute comparison or a general model ranking.'),
          L('기존 데모의 24.08 FPS는 solid 대시보드 렌더·저장과 첫 추론을 포함했습니다. 새 표의 렌더 제외 FPS와 직접 비교하지 않습니다.', 'The earlier demo’s 24.08 FPS included solid dashboard rendering, storage and first inference. Its scope differs from the new FPS values, which exclude rendering.'),
          L('사용 중인 데스크톱에서 측정했습니다. 전용 격리 벤치마크나 촬영→표시 지연 측정은 아닙니다.', 'Measurements were taken on a desktop in use, not an isolated benchmark machine. Capture-to-display latency was not measured.')]
      },
      {
        id: 'next', eyebrow: L('04 / 추적', '04 / Tracking'), title: L('추적 비교', 'Tracker comparison'),
        body: [L('602프레임 × 3설정 × 3회, 총 5,418개 프레임 기록의 순서·시각·박스·점수가 같은 YOLO 캐시와 일치했습니다. 세 설정 모두 다인 4 / 8, 2인 1 / 1을 기록했습니다.', 'Across 602 frames × three settings × three repeats, all 5,418 frame records preserved the same YOLO cache order, timestamps, boxes and scores. All settings produced crowd counts of 4 / 8 and two-person counts of 1 / 1.'),
          L('아래는 다인 영상의 검출 제외 추적 단계 지연입니다. 각 반복의 p50·p95를 구한 뒤 3회 중앙값으로 요약했습니다. 캐시 재생 FPS를 전체 추론 FPS로 쓰지 않습니다.', 'These are tracker-stage latencies for the crowd clip, excluding detection. Each value is the median of the three per-run p50 or p95 values. Cached playback FPS is not full inference FPS.')],
        table: {
          headers: [L('추적기', 'Tracker'), L('추적 ID', 'Track IDs'), 'p50 ms', 'p95 ms'],
          rows: [
            ['ByteTrack', '22', '0.720', '1.607'],
            ['TrackTrack', '18', '1.307', '3.004'],
            ['TrackTrack + ReID', '18', '16.333', '98.002']
          ]
        },
        bullets: [L('ReID ON/OFF는 모든 프레임의 ID 할당까지 같았습니다. 이 두 영상에서는 ReID의 추가 이득이 관측되지 않았습니다.', 'ReID ON and OFF produced identical ID assignments in every frame. No additional ReID benefit was observed on these two clips.'),
          L('코트 인물은 ByteTrack의 ID 16/35 중복 뒤 35로 바뀌었습니다. TrackTrack은 ID 12로 복귀했지만 F291–293에는 ID가 없었습니다. ID 22→18을 전체 분절률 개선으로 해석하지 않습니다.', 'The coat-region ByteTrack boxes had duplicate IDs 16/35 before continuing as 35. TrackTrack recovered ID 12 but left frames 291–293 unassigned. A reduction from 22 to 18 IDs does not establish a lower overall fragmentation rate.'),
          L('Ultralytics TrackTrack 구현을 비교했습니다. ReID는 공식 ONNX·CUDAExecutionProvider·224×224 crop이며, ON/OFF 설정은 with_reid 외 같습니다. 원 논문의 전체 재현은 아닙니다.', 'This compares the Ultralytics TrackTrack implementation. ReID uses the official ONNX, CUDAExecutionProvider and 224×224 crops; ON/OFF settings differ only in with_reid. This is not a full reproduction of the paper.')]
      },
      {
        id: 'review', eyebrow: L('05 / 검수', '05 / Review'), title: L('원본 검수', 'Source review'),
        body: [L('기존 AI 원본 시각 검수의 14개 시간 구간을 고정했습니다. YOLO26n·DEIMv2-S·TrackTrack 두 설정은 14 / 14, RF-DETR는 13 / 14가 대응했습니다. RF-DETR의 한 OUT은 구간보다 0.083초 늦었으며 ±0.5초 보조 대조에서는 14 / 14였습니다.', 'The 14 intervals from the existing AI source review stayed fixed. YOLO26n, DEIMv2-S and both TrackTrack settings matched 14 / 14; RF-DETR matched 13 / 14. One RF-DETR OUT was 0.083 s beyond its interval; an auxiliary ±0.5 s comparison matched 14 / 14.'),
          L('대조 기준은 클립·방향·시간의 일대일 대응입니다. 같은 인물인지 확인한 정답이나 사람 검수자 합의는 아닙니다.', 'Matching uses clip, direction and time one to one. It does not verify person identity and is not human-consensus ground truth.')],
        bullets: [L('F0의 왼쪽 아래 잘린 인물은 YOLO가 놓쳤고 RF-DETR·DEIM은 검출했지만 겹친 추가 박스도 냈습니다. F291 코트 영역에는 세 검출기 모두 겹친 박스 2개가 남았습니다.', 'At frame 0, YOLO missed the lower-left partial person; RF-DETR and DEIM detected it but also emitted overlapping boxes. At frame 291, all three retained two overlapping coat-region boxes.'),
          L('이 두 프레임의 관찰로 전체 검출 재현율을 판단하지 않습니다. 프레임·좌표·점수는 검수 기록에 공개했습니다.', 'These two observations do not establish full-clip detection recall. Frame numbers, coordinates and scores are available in the review record.')]
      },
      {
        id: 'model-server', eyebrow: L('06 / 서버', '06 / Server'), title: L('모델 서버', 'Model server'),
        body: [L('별도의 로컬 HTTP 서버에서 YOLO26n 실제 가중치를 CPU로 실행했습니다. 정상 추론 20건과 시간 초과·추론 프로세스 종료 후의 자동 재시작을 확인하고, 실제 검출 좌표·응답 시간·오류 기록을 공개했습니다.', 'A separate local HTTP server runs the actual YOLO26n weights on CPU. Recorded evidence covers 20 normal inferences, deadline handling and automatic recovery after inference-worker termination, with actual boxes, HTTP timings and error logs.'),
          L('CPU FP32·2개 스레드·동시 추론 1개로 고정했습니다. 웹은 기록 뷰어이며 검증 서버는 종료했습니다. GPU 서빙, 장시간 운용, HTTP 서버·호스트 복구 또는 다른 모델 버전으로의 롤백을 검증한 것은 아닙니다.', 'The run fixes CPU FP32, two threads and one inference slot. The website is an evidence viewer and the rehearsal server was stopped. GPU serving, long-running operation, HTTP-server/host recovery and model-version rollback were not tested.')],
        table: { headers: [L('항목', 'Check'), L('관측', 'Observed')], rows: [
          [L('실제 모델 추론', 'Actual model inference'), '20 / 20'],
          [L('동시 요청 제한 / 시간 초과', 'Admission limit / deadline'), '429 / 504'],
          [L('worker 종료 후 재시작', 'Restart after worker exit'), '503 → 200'],
          [L('복구 후 처리 중 요청', 'Inflight after recovery'), '0']
        ]}
      }
    ],
    decisions: [
      { title: L('후속 검증', 'Next validation'), body: L('이 두 영상의 결과를 바탕으로 YOLO26n + TrackTrack, ReID OFF를 후속 검증 후보로 봅니다. ID 복귀와 추적 공백을 실제 영상에서 다시 확인해야 합니다. 기본 앱의 ByteTrack은 변경하지 않았습니다.', 'These two clips support testing YOLO26n + TrackTrack with ReID OFF next. ID recovery and tracking gaps still need validation on real footage. The default app remains on ByteTrack.') },
      { title: L('원본을 기준으로', 'Review the source'), body: L('생성 프롬프트의 인원과 동선을 정답으로 쓰지 않았습니다. 완성된 원본의 출입을 먼저 검수한 뒤 실행 결과와 대조했습니다.', 'Requested people and paths in the generation prompt were not ground truth. Crossings in the completed source were reviewed before comparison with the run.') },
      { title: L('재실은 미정', 'Occupancy is unknown'), body: L('초기 재실 인원을 모르므로 계산 기준 0과 실제 인원을 구분합니다. 순증감 −4나 하한 보정된 0을 절대 재실 인원으로 해석하지 않습니다.', 'With unknown initial occupancy, the calculation baseline of zero is separate from actual people present. Neither net change −4 nor the clamped zero establishes absolute occupancy.') },
      { title: L('가림과 비교', 'Masking and comparison'), body: L('로컬 기본 마스킹은 solid입니다. 웹의 12% 채움은 원본을 살펴보기 위한 표시로 privacy_protection=false이며, 검출되지 않은 사람은 solid에서도 가려지지 않습니다.', 'The local default is solid masking. The website’s 12% fill is an inspection overlay with privacy_protection=false; undetected people also remain unmasked in solid mode.') }
    ],
    limitations: [
      L('AI 생성 원본 2개, 총 602프레임의 검증입니다. 전 프레임 박스·ID·마스크 정답과 인간 합의 주석이 없어 HOTA·IDF1·현장 정확도는 측정하지 않았습니다.', 'Validation covers two AI-generated clips and 602 frames. Without full-frame box/ID/mask ground truth and human-consensus labels, HOTA, IDF1 and field accuracy remain unmeasured.'),
      L('생성 영상의 부자연스러운 보행, 가장자리 잘림과 유사한 외형이 있습니다. 초기 인원은 미정이며 ID 분절을 고유 인원 증가로 보지 않습니다.', 'Generated footage has unnatural strides, edge cropping and similar appearances. Initial occupancy is unknown, and fragmented IDs are not additional unique people.'),
      L('실제 CCTV·웹캠·RTSP, 장시간 운용, 촬영→표시 지연은 검증하지 않았습니다. 같은 정밀도의 비교와 추론 최적화는 후속 과제입니다.', 'Real CCTV, webcams, RTSP, long-running operation and capture-to-display latency remain unverified. Equal-precision comparisons and inference optimization remain future work.'),
      L('SAM 3.1은 공식 체크포인트의 접근 승인 문제(HTTP 401)로 실행하지 못했습니다.', 'SAM 3.1 was not run because its official checkpoint requires access approval (HTTP 401).')
    ]
  };
  return {
    urls: { live: LIVE_URL, repo: REPO_URL },
    project,
    archive: {
      id: project.id, title: project.title, summary, category: 'ai',
      status: L('AI · 모델 비교', 'AI · Model comparison'), period: project.period,
      image: image.src, imageAlt: image.alt, imageWidth: image.width, imageHeight: image.height, live: true, caseId: project.id,
      caseLabel: L('보기', 'View'), stack: project.stack, links,
      limitations: L('검출 3종·추적 3설정 실행 · 원본 602프레임 · 현장 성능 미검증', 'Three detectors and three tracker settings run · 602 source frames · field performance unverified')
    }
  };
});
