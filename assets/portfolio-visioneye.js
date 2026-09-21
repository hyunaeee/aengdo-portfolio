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
    { label: L('비교', 'Compare'), url: LIVE_URL + '/?panel=models', kind: 'demo' },
    { label: L('서버 검증', 'Model server'), url: 'https://hyunaeee.github.io/aengdo-portfolio/work/visioneye/operations.html', urlEn: 'https://hyunaeee.github.io/aengdo-portfolio/work/visioneye/operations-en.html', kind: 'source' },
    { label: L('코드', 'Code'), url: REPO_URL, kind: 'code' },
    { label: L('보강', 'Stress tests'), url: source('docs/ROBUSTNESS_RESULTS.md'), kind: 'source' },
    { label: L('기록', 'Runs'), url: REPO_URL + '/tree/main/experiments/results/2026-09-21', kind: 'source' },
    { label: L('검수', 'Review'), url: source('experiments/results/2026-09-21/identity-review.md'), kind: 'source' },
    { label: L('09.15', '09.15'), url: source('docs/COMPARISON_RESULTS.md'), kind: 'source' },
    { label: L('논문', 'Papers'), url: source('docs/NEXT_EXPERIMENTS.md'), kind: 'source' }
  ];
  const image = {
    src: 'assets/visioneye.png', width: 1280, height: 720,
    alt: L('VisionEye 실제 비교 화면: 같은 시점의 원본 영상과 반투명 추적 결과', 'Actual VisionEye comparison: synchronized source footage and translucent tracking results')
  };
  const summary = L(
    '사람의 이동과 선 통과를 추적합니다. 원근·가림·재등장 영상 3개를 보강해 검출기 4개와 추적 설정 3개를 비교했습니다. 원본·결과 영상, 63회 실행 기록과 누락 사례를 공개했습니다.',
    'Tracks people and line crossings. Three new clips cover perspective, occlusion and reappearance, comparing four detectors and three tracker settings. Synchronized videos, 63 runs and a missed-crossing case are published.'
  );
  const project = {
    id: 'visioneye', number: '06', title: 'VisionEye', featured: false,
    summary,
    status: L('AI · 모델 비교', 'AI · Model comparison'),
    role: L('영상 처리 · 추적·집계 · 비교 화면 · 검수', 'Video processing · tracking and counting · comparison UI · validation'),
    period: '2026.09',
    stack: ['Python', 'YOLO', 'RT-DETRv2', 'BoT-SORT'],
    image,
    imageCaption: L('실제 비교 화면 · 웹은 저장된 결과를 재생하며 모델을 실행하지 않습니다.', 'Actual comparison UI · the website replays recorded results and does not run the model.'),
    labels: { decisions: L('판단', 'Decisions'), limits: L('한계', 'Limits') },
    metrics: [
      { value: '1,083', label: L('보강 프레임', 'New source frames'), note: L('09.21 · 원본 3개 · 반복 제외', '09.21 · three source clips · repeats excluded') },
      { value: '4', label: L('검출기', 'Detectors'), note: L('YOLO26n · v8n · 11n · RT-DETRv2-S', 'YOLO26n · v8n · 11n · RT-DETRv2-S') },
      { value: '63', label: L('보강 실행', 'New runs'), note: L('검출 36회 · 캐시 추적 27회', '36 detector runs · 27 cached-tracker runs') }
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
        id: 'robustness', eyebrow: L('2026.09.21 / 보강', '2026.09.21 / Stress tests'), title: L('보강 실험', 'Stress tests'),
        body: [L('Higgsfield Seedance 2.5로 15초 영상 3개를 새로 만들었습니다. 각 361프레임, 총 1,083개 고유 프레임에 검출 4종과 캐시 추적 3설정을 각각 3회 실행했습니다. 원본만 본 AI 검수의 통과 15건을 추론 전에 고정했습니다.', 'Three new 15-second clips were generated with Higgsfield Seedance 2.5. Each has 361 frames, totaling 1,083 unique frames. Four detectors and three cached-tracker settings ran three times each. Fifteen crossing intervals were locked from source-only AI review before inference.'),
          L('FP32·TF32 OFF·640×640·batch 1을 고정하고 같은 ByteTrack·집계기를 연결했습니다. YOLO26n은 one-to-many + 외부 NMS 경로입니다. YOLO의 letterbox와 RT-DETRv2의 warp 전처리, 모델 규모는 서로 다릅니다.', 'The run fixes FP32, TF32 OFF, 640×640 and batch 1, with the same ByteTrack and counter. YOLO26n uses its one-to-many head with external NMS. YOLO letterboxing, RT-DETRv2 warping and model capacities still differ.'),
          L('검출기 4종 모두 원근 IN 5 / OUT 0, 가림 0 / 0, 재등장 5 / 5였습니다. 엄격한 시간창은 총 13 / 15, 사전 정의한 ±0.5초 분석은 15 / 15가 대응했습니다. 방향·시간 대응이며 인물 신원 정확도는 아닙니다.', 'All four detectors produced 5 IN / 0 OUT for perspective, 0 / 0 for occlusion and 5 / 5 for reappearance. Strict source intervals matched 13 / 15 events; the predefined ±0.5 s analysis matched 15 / 15. This is direction/time agreement, not identity accuracy.')],
        table: {
          headers: [L('검출기', 'Detector'), L('원근 FPS', 'Perspective FPS'), L('가림 FPS', 'Occlusion FPS'), L('재등장 FPS', 'Reappearance FPS')],
          rows: [
            ['YOLO26n', '89.91 (86.27–90.54)', '93.63 (92.73–94.84)', '91.03 (88.71–92.00)'],
            ['YOLOv8n', '105.11 (104.85–109.41)', '116.71 (116.42–120.73)', '113.61 (112.70–117.24)'],
            ['YOLO11n', '94.14 (93.39–94.74)', '99.65 (96.28–101.62)', '100.22 (94.94–100.63)'],
            ['RT-DETRv2-S', '39.08 (38.22–40.03)', '38.73 (38.21–41.30)', '39.17 (38.98–39.74)']
          ]
        },
        bullets: [L('FPS: RTX 4090의 3회 중앙값·최솟값–최댓값. 읽기·검출·추적·집계·JSONL 포함, 초기화·5회 워밍업·렌더·인코딩 제외입니다. 사용 중인 PC에서 GPU 작업을 순차 실행했습니다.', 'FPS: median and min–max of three RTX 4090 runs. Reading, detection, tracking, counting and JSONL are included; initialization, five warm-ups, rendering and encoding are excluded. GPU jobs ran sequentially on a desktop in use.'),
          L('원근 영상은 양방향 교차 생성에 실패해 5명이 단방향으로 접근합니다. 가림 영상에서는 보이는 통과가 0건이며, 벽 뒤의 통과 부재까지 증명하지 않습니다. 생성 의도와 실제 원본을 구분했습니다.', 'The requested bidirectional crossing failed to generate: five people approach in one direction. The occlusion clip has zero visible crossings, which does not prove no crossing occurred behind the wall. Requested motion and actual footage are distinguished.'),
          L('이번 조건의 처리량은 YOLOv8n이 가장 높았습니다. 같은 집계 결과가 전체 검출 품질이나 모든 환경의 순위를 보장하지 않습니다. 기존 09.15의 FP16·모델별 입력 비교와 분리합니다.', 'YOLOv8n had the highest throughput in these conditions. Equal counts do not establish overall detection quality or a ranking across environments. These runs are separate from the 09.15 FP16/native-input comparisons.')]
      },
      {
        id: 'robustness-tracking', eyebrow: L('2026.09.21 / 추적', '2026.09.21 / Tracking'), title: L('집계 누락', 'Missed crossing'),
        body: [L('동일한 YOLO26n 첫 실행의 박스·점수·순서를 ByteTrack·BoT-SORT·TrackTrack에 전달했습니다. ReID와 카메라 이동 보정은 끄고 lost buffer는 24프레임으로 맞췄습니다. 추적기별 기본 연관 임계값은 조정하지 않았습니다.', 'ByteTrack, BoT-SORT and TrackTrack receive the same ordered boxes and scores from the first YOLO26n run. ReID and camera-motion compensation are off, and the lost buffer is 24 frames. Each tracker retains its native association thresholds.'),
          L('원근 영상에서 TrackTrack은 원본의 5건 중 1건을 놓쳤습니다. 세 반복 모두 같았습니다. ID 수는 12→10→5로 줄었지만 집계는 5→5→4가 되어, 적은 ID 수를 성능 향상으로 해석할 수 없었습니다.', 'TrackTrack missed one of five reviewed crossings in the perspective clip in all three repeats. IDs decreased from 12 to 10 to 5 while counts changed from 5 to 5 to 4; fewer IDs did not establish better performance.'),
          L('누락 대상은 선두 회색 상의였습니다. F135에서 ByteTrack·BoT-SORT는 ID 4로 IN을 기록했지만 TrackTrack은 같은 박스에 ID를 배정하지 않았습니다. F0–138에서 대상의 발을 포함한 후보의 최대 점수는 0.674920으로 신규 트랙 기준 0.7보다 낮았습니다. ID가 있는 점만 집계기에 들어가므로 신규 ID 미성립이 입력 누락으로 이어졌습니다. 혼합·중복 박스가 있는 이 구성의 관측이며, 임계값을 바꾼 대조 실험은 하지 않았습니다.', 'The missed subject was the leading gray-shirt person. At F135, ByteTrack and BoT-SORT counted IN with ID 4 while TrackTrack left the same box unassigned. The maximum score among foot-covering candidates in F0–138 was 0.674920, below the 0.7 new-track threshold. Only ID-assigned points enter the counter, so the missing new ID excluded this input. This observation involves mixed/duplicate boxes in this configuration; no threshold-change experiment was run.'),
          L('첫 반복의 고정 앵커 검수에서는 벽 가림 F18→192와 화면 밖 복귀 F120→240 모두 7조건에서 같은 ID 유지를 확인하지 못했습니다. ID 변경 또는 검출·ID 부재가 있었습니다. 짧은 교행 F48→72의 두 앵커는 7조건 모두 같은 ID였지만, 사이 전 프레임의 신원 유지를 보장하지 않습니다. 원본에서도 동일인 여부는 외양에 따른 추정이며, 긴 부재는 24프레임 유지 범위를 넘습니다.', 'In the first-repeat fixed-anchor review, none of the seven conditions confirmed the same ID across wall occlusion at F18→192 or exit/reappearance at F120→240: IDs changed or detections/IDs were absent. All seven retained the same ID at the two short-passing anchors F48→72, which does not establish continuity in every intervening frame. Source identity remains an appearance-based inference, and the long absences exceed the 24-frame retention window.')],
        table: {
          headers: [L('추적기', 'Tracker'), L('원근 IN / OUT', 'Perspective IN / OUT'), L('추적 ID', 'Track IDs'), 'p50 / p95 ms'],
          rows: [['ByteTrack', '5 / 0', '12', '0.528 / 0.699'], ['BoT-SORT', '5 / 0', '10', '0.511 / 0.688'], ['TrackTrack', '4 / 0', '5', '0.599 / 0.788']]
        },
        bullets: [L('위 시간은 검출을 제외한 추적 단계의 3회 중앙값입니다. 파이프라인 FPS와 직접 비교하지 않습니다.', 'These times are the three-run medians of tracker-stage latency, excluding detection. They are not directly comparable with pipeline FPS.'),
          L('가림과 재등장 집계는 세 설정 모두 각각 0 / 0, 5 / 5였습니다. 장시간 가림·화면 이탈은 24프레임 유지 범위를 넘으며, ReID OFF의 신원 복귀를 보장하지 않습니다.', 'All three settings produced 0 / 0 for occlusion and 5 / 5 for reappearance. Long occlusions and exits exceed the 24-frame retention window; identity recovery with ReID off is not guaranteed.'),
          L('원본 검수·반복별 사건·프레임 좌표·영상 정렬 기록을 공개했습니다. 기본 앱의 ByteTrack은 변경하지 않았습니다.', 'Source reviews, per-repeat events, frame coordinates and video-alignment evidence are published. The default app remains on ByteTrack.')]
      },
      {
        id: 'evidence', eyebrow: L('03 / 09.15 검출', '03 / 09.15 Detection'), title: L('기존 검출', 'Earlier detectors'),
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
        id: 'next', eyebrow: L('04 / 09.15 추적', '04 / 09.15 Tracking'), title: L('기존 추적', 'Earlier trackers'),
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
        id: 'review', eyebrow: L('05 / 09.15 검수', '05 / 09.15 Review'), title: L('기존 검수', 'Earlier review'),
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
      { title: L('집계 기준', 'Count evidence'), body: L('09.15의 적은 TrackTrack ID 수만으로 설정을 선택하지 않았습니다. 보강 원근 영상에서는 1건 누락이 드러났고, ByteTrack·BoT-SORT는 5건을 유지했습니다. 실제 영상의 신원 정답으로 재검증할 때까지 기본 ByteTrack을 유지합니다.', 'The lower TrackTrack ID count on 09.15 was insufficient to choose it. The added perspective clip exposed one missed crossing while ByteTrack and BoT-SORT retained five. The default stays ByteTrack pending identity-grounded evaluation on real footage.') },
      { title: L('원본을 기준으로', 'Review the source'), body: L('생성 프롬프트의 인원과 동선을 정답으로 쓰지 않았습니다. 완성된 원본의 출입을 먼저 검수한 뒤 실행 결과와 대조했습니다.', 'Requested people and paths in the generation prompt were not ground truth. Crossings in the completed source were reviewed before comparison with the run.') },
      { title: L('재실은 미정', 'Occupancy is unknown'), body: L('초기 재실 인원을 모르므로 계산 기준 0과 실제 인원을 구분합니다. 순증감 −4나 하한 보정된 0을 절대 재실 인원으로 해석하지 않습니다.', 'With unknown initial occupancy, the calculation baseline of zero is separate from actual people present. Neither net change −4 nor the clamped zero establishes absolute occupancy.') },
      { title: L('가림과 비교', 'Masking and comparison'), body: L('로컬 기본 마스킹은 solid입니다. 웹의 12% 채움은 원본을 살펴보기 위한 표시로 privacy_protection=false이며, 검출되지 않은 사람은 solid에서도 가려지지 않습니다.', 'The local default is solid masking. The website’s 12% fill is an inspection overlay with privacy_protection=false; undetected people also remain unmasked in solid mode.') }
    ],
    limitations: [
      L('기존 2개·602프레임과 보강 3개·1,083프레임의 AI 생성 영상 실험입니다. 반복 실행은 새 표본이 아닙니다. 전 프레임 박스·ID·마스크 정답과 인간 합의 주석이 없어 HOTA·IDF1·현장 정확도는 측정하지 않았습니다.', 'The experiments cover two earlier AI-generated clips with 602 frames and three added clips with 1,083 frames. Repeated runs are not new samples. Full-frame box/ID/mask ground truth and human-consensus labels are absent; HOTA, IDF1 and field accuracy remain unmeasured.'),
      L('생성 영상의 부자연스러운 보행, 가장자리 잘림과 유사한 외형이 있습니다. 초기 인원은 미정이며 ID 분절을 고유 인원 증가로 보지 않습니다.', 'Generated footage has unnatural strides, edge cropping and similar appearances. Initial occupancy is unknown, and fragmented IDs are not additional unique people.'),
      L('실제 CCTV·웹캠·RTSP, 장시간 운용, 촬영→표시 지연은 검증하지 않았습니다. 보강 비교는 FP32·입력 크기를 맞췄지만 전처리·모델 규모는 다릅니다. 혼잡한 반복 교차 장면은 충분히 생성하지 못했습니다.', 'Real CCTV, webcams, RTSP, long-running operation and capture-to-display latency remain unverified. The added comparison matches FP32 and input dimensions, while preprocessing and model size differ. Dense repeated crossings were not adequately generated.'),
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
      limitations: L('보강 63회 · 원본 1,083프레임 · TrackTrack 통과 1건 누락 · 현장 성능 미검증', '63 added runs · 1,083 source frames · one TrackTrack crossing missed · field performance unverified')
    }
  };
});
