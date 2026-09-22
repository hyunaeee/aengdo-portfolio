/* RelateAnything experiment case. This project integrates an upstream model;
   it does not claim authorship of the model or RA-4M. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_RELATEANYTHING = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  // Public results viewer; model inference is run locally.
  const LIVE_URL = 'https://relateanything-lab.vercel.app/';
  const links = [
    { label: L('실험 결과 비교', 'Compare recorded runs'), url: LIVE_URL, kind: 'demo' },
    { label: L('측정 기록', 'Measured evidence'), url: 'https://hyunaeee.github.io/aengdo-portfolio/work/relateanything/evidence.json', kind: 'source' },
    { label: L('원본 모델 코드', 'Upstream model'), url: 'https://github.com/Maelic/RelateAnything', kind: 'code' },
    { label: L('원본 논문', 'Original paper'), url: 'https://arxiv.org/abs/2609.12552', kind: 'source' }
  ];
  const summary = L(
    '물체 사이의 관계를 예측하는 공개 모델을 RTX 4090에서 실행했습니다. 생성 영상에서 검출 분류가 바뀌며 병의 관계 점수가 사라지는 원인을 분석하고, 객체 연결과 시간 후처리를 분리해 비교합니다.',
    'Ran an open-vocabulary relation model on an RTX 4090. On a generated clip, I diagnosed missing relation scores caused by changing detector classes, then compared persistent object association and temporal postprocessing separately.'
  );
  const image = {
    src: 'assets/relateanything.jpg', width: 1280, height: 720,
    alt: L(
      '관계 예측 실험에 사용한 생성 영상: 사람이 테이블 위에서 파란 병을 들고 있는 장면',
      'Generated footage used for the relation experiment: a person holding a blue bottle above a table'
    )
  };
  const project = {
    id: 'relateanything', number: '07', title: 'RelateAnything Lab',
    featured: false, nextCase: 'visioneye', summary,
    status: L('AI · 관계 예측 실험', 'AI · Relation prediction experiments'),
    role: L('추론 연동 · 오류 분석 · 객체 연결 · 평가 · 결과 비교 화면', 'Inference integration · failure analysis · object association · evaluation · recorded-run viewer'),
    period: '2026.09',
    stack: ['Python', 'PyTorch', 'YOLO11s', 'RelateAnything', 'Vercel'],
    image,
    imageCaption: L(
      '실험용으로 생성한 20.04초 영상의 실제 프레임 · 웹 데모는 이 영상과 저장된 추론 결과를 재생합니다.',
      'Actual frame from the 20.04-second clip generated for this experiment. The web demo replays this footage and recorded inference.'
    ),
    metrics: [
      { value: '59.7% → 100%', label: L('병 영역 확보', 'Bottle-region availability'), note: L('287/481 → 481/481 · 같은 생성 영상', '287/481 → 481/481 · the same generated clip') },
      { value: '0.120 → 0.825', label: L('holding F1', 'holding F1'), note: L('전체 파이프라인 · 시간 후처리 전 · 유효 초안 라벨 74개', 'End to end · before temporal postprocessing · 74 eligible draft labels') },
      { value: '0 / 56', label: L('on 양성 검출 · 미해결', 'on positives detected · unresolved'), note: L('임계값 0.5 · 추적 후에도 재현율 0', 'Threshold 0.5 · recall remains zero after association') }
    ],
    links,
    sections: [
      {
        id: 'problem', eyebrow: '01 / DIAGNOSIS',
        title: L('관계 점수가 사라지는 이유를 추적하기', 'Tracing the missing relation scores'),
        body: [
          L('병을 잡아 올렸다가 테이블에 내려놓는 약 20초 영상을 생성했습니다. 같은 영상의 모든 프레임에 YOLO11s와 RelateAnything을 실행하고, 사람이 병을 잡는 관계와 병이 테이블 위에 있는 관계를 살펴봤습니다.', 'I generated a roughly 20-second clip of picking up a bottle and placing it on a table. YOLO11s and RelateAnything ran on every frame to inspect person–holding–bottle and bottle–on–table relations.'),
          L('초기 실행은 프레임마다 bottle로 분류된 검출만 선택했습니다. 그런데 병을 든 구간의 물체가 vase, cell phone, cup으로 바뀌어 분류되면서, 위치가 검출되어도 병의 관계 모델 입력에서는 제외됐습니다.', 'The baseline selected detections classified as bottle in each frame. During the lift, the same object was labeled vase, cell phone, or cup, so valid localizations were dropped from the bottle relation input.')
        ]
      },
      {
        id: 'pipeline', eyebrow: '02 / IMPLEMENTATION',
        title: L('물체의 동일성과 관계 점수 분리', 'Separating object identity and relation scores'),
        body: [
          L('신뢰도가 높은 bottle 검출로 객체를 초기화한 뒤, 다음 프레임의 모든 분류 후보를 위치·이동·크기로 연결합니다. 현재 프레임에서 실제로 관찰된 박스만 관계 모델에 전달합니다. 검출이 없으면 점수를 미관측으로 남깁니다.', 'A confident bottle detection initializes the object identity. Later observations are associated across detector classes using position, motion, and size. Only boxes actually observed in the current frame enter the relation model; a missing detection remains unobserved.'),
          L('RelateAnything은 이미지 한 장과 영역, 관계 어휘를 입력받는 프레임별 모델입니다. 이전 프레임을 기억하는 객체 연결과 EMA·히스테리시스는 별도로 구현했습니다. 모델 점수와 시간 후처리의 상태를 나누어 표시합니다.', 'RelateAnything receives a single image, regions, and predicate strings per frame. Object association, EMA, and hysteresis are separate temporal components. The viewer distinguishes model scores from temporal system state.')
        ],
        diagram: [
          { label: L('영상 프레임', 'Video frame'), detail: L('원본 시간과 프레임 번호', 'Original timestamp and frame index') },
          { label: L('검출·객체 연결', 'Detect and associate'), detail: L('현재 관찰된 영역', 'Currently observed regions') },
          { label: 'RelateAnything', detail: L('방향성 객체 쌍 × 관계 점수', 'Ordered object pairs × predicate scores') },
          { label: L('기록·비교', 'Record and compare'), detail: L('원시 예측 / 시간 후처리', 'Unsmoothed output / temporal state') }
        ]
      },
      {
        id: 'evaluation', eyebrow: '03 / EVIDENCE',
        title: L('누락과 오탐을 따로 평가하기', 'Measuring missing observations and false positives'),
        body: [
          L('추론 전에 영상을 보고 0.25초 간격으로 초안 라벨을 작성했습니다. 접촉 전환이 불명확한 프레임은 uncertain으로 제외하고, 프레임 번호를 정확히 맞춰 평가합니다. 생성 요청에 적은 동작 시간은 정답으로 사용하지 않았습니다.', 'Draft labels were created by reviewing the clip before inference at 0.25-second intervals. Ambiguous contact transitions are marked uncertain and excluded. Evaluation matches exact frame indices; timings requested in the generation prompt are not treated as ground truth.'),
          L('검출 누락은 관계가 거짓이라는 관찰과 다릅니다. 조건부 지표와 전체 파이프라인 지표를 함께 확인하며, 전체 평가에서는 양성 관계를 관찰하지 못한 경우도 FN에 포함합니다. 0.5 임계값은 별도 검증셋에서 최적화한 값이 아닙니다.', 'A missing detection is different from observing a false relation. Conditional and end-to-end metrics are reported separately; missed positive relations count as false negatives end to end. The 0.5 threshold has not been optimized on a separate validation set.'),
          L('초기 자동 검출은 병 영역을 287/481프레임에서 제공했고 holding F1은 0.120이었습니다. 분류에 관계없이 같은 물체를 연결한 뒤에는 481프레임 모두에서 실제 관찰 박스를 확보했고, 시간 후처리 전 F1은 0.825였습니다. 정밀도는 70.2%, 재현율은 100%였으며 오탐 14개는 남았습니다.', 'The baseline supplied bottle regions in 287 of 481 frames and reached holding F1 0.120. Class-agnostic association recovered observed boxes in all 481 frames and reached F1 0.825 before temporal postprocessing: precision 70.2%, recall 100%, with 14 false positives remaining.'),
          L('시간 후처리는 holding 오탐을 14개에서 13개로 줄였고 F1은 0.835였습니다. on 관계는 추적 후에도 양성 56개를 모두 놓쳤습니다. 객체를 유지하는 개선과 관계를 정확히 판정하는 문제를 구분해 남은 실패도 함께 공개합니다.', 'Temporal postprocessing reduced holding false positives from 14 to 13, yielding F1 0.835. The on relation still missed all 56 positives after association. The result separates recovered object availability from accurate relation decisions and keeps the unresolved failure visible.'),
          L('RTX 4090·FP32·배치 1에서 추적과 후처리를 포함한 파이프라인의 평균은 38.68ms/프레임, p95는 46.14ms였습니다. 평균 시간의 역수는 약 25.85 FPS이며 웹 재생 속도나 배포 서버의 성능 수치는 아닙니다.', 'On an RTX 4090 with FP32 and batch size 1, the pipeline including association and postprocessing averaged 38.68 ms/frame, with p95 46.14 ms. The inverse mean is about 25.85 FPS; it is not the web playback rate or deployed-server performance.')
        ],
        table: {
          headers: [L('측정', 'Measure'), L('초기 자동 검출', 'Automatic baseline'), L('객체 연결 후', 'With object association')],
          rows: [
            [L('병 영역 · 전체 481프레임', 'Bottle regions · 481 frames'), '287 / 481', '481 / 481'],
            [L('holding · TP / FP / FN', 'holding · TP / FP / FN'), '3 / 14 / 30', '33 / 14 / 0'],
            [L('holding F1 · 후처리 전', 'holding F1 · before postprocessing'), '0.120', '0.825'],
            [L('on 재현율 · 양성 56개', 'on recall · 56 positives'), '0%', '0%']
          ]
        }
      },
      {
        id: 'viewer', eyebrow: '04 / RECORDED DEMO',
        title: L('원본·추론·후처리를 같은 시점에 비교', 'Compare footage, inference, and postprocessing'),
        body: [
          L('공개 데모에서는 원본 영상과 저장된 실행 결과를 같은 시점에 확인합니다. 객체가 어떤 분류로 관찰됐는지, 관계 점수가 있는지, 시간 후처리로 표시 상태가 어떻게 바뀌는지 구분합니다.', 'The public demo aligns source footage with saved run outputs. It distinguishes the detector class observed for the object, availability of a relation score, and changes introduced by temporal postprocessing.'),
          L('Vercel은 결과 탐색 화면을 제공합니다. 이 공개 페이지에서 GPU 모델을 실행하거나 업로드한 새 영상의 관계를 계산하지 않습니다. 표시된 실행 시간은 로컬 RTX 4090에서 측정한 기록입니다.', 'Vercel hosts the results viewer. The public page does not run GPU inference or calculate relations for newly uploaded videos. Displayed inference timings were measured locally on an RTX 4090.')
        ]
      }
    ],
    decisions: [
      { title: L('검출 분류가 변해도 객체 연결 유지', 'Keep identity when detector labels change'), body: L('병의 위치를 이미 검출한 프레임을 버리는 경로를 확인했습니다. 신뢰도 높은 초기 관찰 이후에는 객체 연결을 유지하며 분류 변화를 기록합니다. 색상이나 수동 영역은 최종 추적 방식의 입력으로 사용하지 않습니다.', 'The failure path discarded frames where the bottle had already been localized. After a confident initial observation, association preserves identity while recording detector label changes. The tracking approach does not use color or manual regions.') },
      { title: L('모델 출력과 시간 후처리 구분', 'Separate model output and temporal processing'), body: L('공개 체크포인트의 점수 보정을 적용한 프레임별 점수와 EMA·히스테리시스 결과를 따로 저장합니다. 후처리 상태를 모델이 예측한 확률로 표현하지 않습니다.', 'Per-frame scores with the released calibration are saved separately from EMA and hysteresis outputs. Temporal system state is not presented as a probability predicted by the model.') },
      { title: L('실제 실행 기록으로 재현', 'Reproduce from recorded runs'), body: L('모델·검출기 버전, 어휘, 입력 영상 해시, 점수 공식과 시간 측정 범위를 남깁니다. 결과 화면을 다시 만드는 데 모델을 재실행할 필요가 없습니다.', 'Records retain model and detector versions, vocabulary, input-video hash, score formula, and timing scope. The results view can be rebuilt without rerunning the model.') }
    ],
    limitations: [
      L('박스 확보율은 위치 정확도 지표가 아닙니다. 테이블 박스의 범위가 프레임별로 달라지는 한계가 남아 있으며, 수동 박스 정답에 대한 정확도는 평가하지 않았습니다.', 'Box availability is not localization accuracy. Table regions still vary between frames, and localization has not been evaluated against manually labeled boxes.'),
      L('하나의 생성 영상과 같은 영상에서 검수한 초안 라벨을 사용한 개발 실험입니다. 별도 실제 영상이나 held-out 영상에서 일반화 성능을 검증하지 않았습니다.', 'This is a development experiment using one generated clip and draft annotations reviewed on that clip. Generalization has not been tested on separate real-world or held-out footage.'),
      L('객체별 한 인스턴스를 가정합니다. 여러 병, 완전 가림, 카메라 이동에서의 안정적인 동일성 유지는 별도 실험이 필요합니다.', 'Association assumes one target instance per class. Multiple bottles, full occlusion, and camera motion require separate identity tests.'),
      L('모델이나 검출기를 재학습하지 않았습니다. RelateAnything과 RA-4M은 Maëlic Neau의 원본 연구이며, 이 사례의 기여는 추론 연동·분석·추적·평가·시각화입니다.', 'Neither the relation model nor the detector was retrained. RelateAnything and RA-4M are Maëlic Neau’s original research; this case contributes integration, diagnosis, association, evaluation, and visualization.'),
      L('처리 시간은 워밍업 후 GPU 동기화로 측정했으며 영상 읽기·검출·관계 계산·후처리를 포함합니다. JSON 저장과 웹 렌더링·결과 영상 인코딩은 제외합니다.', 'Timings use GPU synchronization after warmup and include frame decoding, detection, relation computation, and postprocessing. JSON writes, web rendering, and output-video encoding are excluded.')
    ]
  };
  const archive = {
    id: project.id, title: project.title, summary, category: 'ai',
    status: L('AI / 저장된 추론 비교', 'AI / RECORDED INFERENCE VIEWER'),
    period: project.period, image: image.src, imageAlt: image.alt,
    imageWidth: image.width, imageHeight: image.height,
    live: true, caseId: project.id, stack: project.stack, links,
    limitations: L('20초 생성 영상 1개의 개발 실험 · 웹은 저장된 결과를 재생', 'One 20-second generated development clip · web replays recorded results')
  };
  return { project, archive, liveUrl: LIVE_URL };
});
