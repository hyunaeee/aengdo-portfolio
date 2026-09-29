/* Overview of five independently implemented experiments using credited models.
   Detailed evidence stays in the existing RelateAnything and MotionCheck cases. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_VISION_LAB = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  const LIVE_URL = 'https://relateanything-lab.vercel.app/';
  // The portfolio builder resolves this canonical source origin to local links.
  const PORTFOLIO_URL = 'https://hyunaeee.github.io/aengdo-portfolio';
  const links = [
    { label: L('다섯 가지 실험 둘러보기', 'Explore the five experiments'), url: LIVE_URL, kind: 'demo' },
    { label: L('관계 인식 상세 사례', 'Relation prediction case'), url: PORTFOLIO_URL + '/work/relateanything/index.html', urlEn: PORTFOLIO_URL + '/work/relateanything/en.html', kind: 'source' },
    { label: L('동작·제어 상세 사례', 'Motion and control case'), url: PORTFOLIO_URL + '/work/motion-check/index.html', urlEn: PORTFOLIO_URL + '/work/motion-check/en.html', kind: 'source' }
  ];
  const summary = L(
    '공개 비전 모델의 추론을 연결하고 평가·시각화를 구현했습니다. 객체 관계, 동작 비교, 물리 제어, 3D 추적, 키포인트 추정의 실행 결과와 남은 오류를 다섯 실험에서 비교합니다.',
    'Built a shared lab for object relations, motion comparison, simulated control, 3D tracking, and keypoint estimation. I integrated open models and implemented evaluation and visualization to compare recorded results and unresolved errors across five experiments.'
  );
  const image = {
    src: 'assets/vision-lab.jpg', width: 512, height: 272,
    alt: L('DAVIS 기차 영상 위에 투영한 TraceAnything의 3D 궤적', 'TraceAnything 3D trajectories projected onto a DAVIS train frame')
  };
  const project = {
    id: 'vision-lab', number: '10', title: 'Vision Lab',
    featured: false, nextCase: 'relateanything', summary,
    status: L('AI · 컴퓨터 비전 실험 모음', 'AI · Computer vision experiments'),
    role: L('추론 연동 · 평가 설계 · 오류 분석 · 제어 구현 · 결과 뷰어', 'Inference integration · evaluation design · failure analysis · control implementation · results viewer'),
    period: '2026.09',
    stack: ['Python', 'PyTorch', 'MuJoCo', 'WebGL', 'Vercel'],
    image,
    imageCaption: L(
      '직접 실행한 기차 80프레임 실험의 한 장면. 색 궤적은 모델 추정치이며, 웹에서는 저장된 결과를 탐색합니다.',
      'A frame from the 80-frame train run. Colored trajectories are model estimates; the website explores recorded outputs.'
    ),
    metrics: [
      { value: '5', label: L('탐색 가능한 실험', 'Experiments to explore'), note: L('관계 · 동작 · 물리 제어 · 3D 추적 · 키포인트', 'Relations · motion · simulated control · 3D tracking · keypoints') },
      { value: '481', label: L('관계 인식 입력 프레임', 'Relation experiment frames'), note: L('하나의 생성 영상 · 기본·개선 실행 비교', 'One generated clip · baseline and revised runs') },
      { value: '400', label: L('물리 시뮬레이션 평가', 'Physics simulation evaluations'), note: L('한 기준 동작·4관절 모형의 내부 반복', 'Internal repeats of one reference motion and four-joint model') }
    ],
    links,
    sections: [
      {
        id: 'experiments', eyebrow: '01 / EXPERIMENT MAP',
        title: L('다섯 가지 실험과 탐색 경로', 'Five experiments and their viewers'),
        body: [L(
          '서로 다른 질문을 다섯 개의 실험으로 나눴습니다. 각 뷰어에서 입력 영상과 저장된 결과를 비교하고, 관계 인식과 동작·제어의 상세 설계는 기존 사례에서 이어 볼 수 있습니다.',
          'Five experiments address different questions. Each viewer compares input footage with saved outputs; the existing cases retain the detailed relation and motion-control designs.'
        )],
        table: {
          headers: [L('실험', 'Experiment'), L('살펴보는 것', 'What it investigates'), L('실행 범위', 'Run scope')],
          rows: [
            ['RelateAnything', L('객체 연결 전후의 관계 점수와 오류', 'Relation scores and errors before and after object association'), L('생성 영상 481프레임', '481 generated-video frames')],
            ['MotionCheck V1', L('2D 관절과 시간 정렬로 동작 차이 비교', 'Motion differences using 2D joints and temporal alignment'), L('기준·수행 영상과 오류 사례', 'Reference and performed clips, including failures')],
            ['MotionCheck V2', L('동작 단계 판정과 MuJoCo 팔의 토크 제어', 'Motion-stage decisions and torque control of simulated arms'), L('내부 시뮬레이션 400회', '400 internal simulation evaluations')],
            ['Track3D', L('TraceAnything의 영상 위 궤적과 3D 점군', 'TraceAnything trajectories over footage and in a 3D point cloud'), L('기차 80·춤 90프레임과 입력 변형', '80 train and 90 dance frames, plus input variants')],
            ['DeepLabCut', L('사람·생쥐의 2D 키포인트와 사람의 3D 포즈 추정', '2D human and mouse keypoints and human 3D pose estimates'), L('춤 90프레임·17관절, 생쥐 120프레임·27점', '90 dance frames with 17 joints; 120 mouse frames with 27 points')]
          ]
        },
        links: [
          { label: L('관계 인식', 'Object relations'), url: LIVE_URL + 'relateanything/', kind: 'demo' },
          { label: L('동작 비교 V1', 'Motion comparison V1'), url: LIVE_URL + 'motion/', kind: 'demo' },
          { label: L('물리 제어 V2', 'Simulated control V2'), url: LIVE_URL + 'motion/v2/', kind: 'demo' },
          { label: L('3D 추적', '3D tracking'), url: LIVE_URL + 'track3d/', kind: 'demo' },
          { label: L('DeepLabCut 키포인트', 'DeepLabCut keypoints'), url: LIVE_URL + 'deeplabcut/', kind: 'demo' }
        ]
      },
      {
        id: 'contribution', eyebrow: '02 / MY CONTRIBUTION',
        title: L('구현한 기능과 검증 범위', 'Implementation and validation scope'),
        body: [
          L('구현에서는 객체 연결·시간 후처리, 관절 비교·단계 판정, MuJoCo 토크 제어를 구성했습니다. TraceAnything 추론은 Windows와 24GB GPU에 맞춰 실행 순서와 attention 호환 처리를 조정하고, 내보낸 좌표가 원시 예측과 일치하는지 확인했습니다.', 'I implemented object association and temporal processing, joint comparison and stage decisions, and MuJoCo torque control. For TraceAnything inference, I adapted execution scheduling and attention compatibility for Windows and a 24 GB GPU, then checked exported coordinates against raw predictions.'),
          L('평가에서는 관측 누락과 관계 오분류, 자세 차이와 시간 차이, 제어 오차와 완료 여부를 구분했습니다. DeepLabCut은 기본 설정과 대상 박스 선택 조건을 비교하고, 예측 신뢰도와 실제 정확도를 구분해 기록했습니다. 영상·수치·실패 기록을 보존하고, 다섯 실험을 같은 Vercel 사이트에서 탐색하도록 연결했습니다.', 'Evaluation separates missing observations from relation errors, pose differences from timing, and control error from task completion. For DeepLabCut, I compared default and bounding-box selection settings and distinguished prediction confidence from accuracy. I preserved footage, measurements, and failure records, then connected all five experiments on one Vercel site.')
        ]
      },
      {
        id: 'deeplabcut', eyebrow: '03 / LATEST EXPERIMENT',
        title: L('DeepLabCut: 키포인트·3D 포즈·대상 선택 비교', 'DeepLabCut: keypoints, 3D pose, and target selection'),
        body: [
          L('SuperAnimalHumanBody의 RTMPose-x로 춤 영상 90프레임의 17관절을, SuperAnimalTopViewMouse의 HRNet-w32로 생쥐 영상 120프레임의 27개 키포인트를 추론했습니다. 원본과 예측 영상을 같은 프레임으로 비교하고, 실행 조건·신뢰도·예측 데이터를 함께 제공합니다.', 'SuperAnimalHumanBody with RTMPose-x estimated 17 joints across 90 dance frames; SuperAnimalTopViewMouse with HRNet-w32 estimated 27 keypoints across 120 mouse frames. The viewer compares source and prediction videos at matching frames and provides execution settings, confidence values, and prediction data.'),
          L('여러 사람이 있는 춤 영상의 기본 설정에서 대상 인물이 바뀌는 오류를 확인했습니다. 프레임마다 가장 큰 검출 박스를 선택하는 조건을 추가해 비교했습니다. 이 규칙은 사람의 신원을 연결하는 추적기가 아니며, 같은 인물이 계속 선택되거나 관절 위치가 정확하다는 보장은 없습니다.', 'The default run switched people in the dance footage. I added a comparison that selects the largest detected bounding box in each frame. This rule does not track identity and does not guarantee that the same person stays selected or that joint locations are correct.'),
          L('같은 춤 90프레임에 FMPose3D 0.0.10의 공식 연동으로 H36M 17관절의 3D 추정을 실행했습니다. 별도 YOLOv3·HRNet-w48 입력을 사용하며, 기본·최대 박스 선택의 예측과 회전 영상을 비교합니다. 골반 기준 상대 좌표이고, 최대 박스 선택에서도 60프레임 부근의 관절 오배치가 남아 있습니다.', 'FMPose3D 0.0.10, through the official integration, estimated 17 H36M 3D joints for the same 90 dance frames. It uses a separate YOLOv3 and HRNet-w48 pipeline; the viewer compares default and largest-box predictions with rotating 3D views. Coordinates are pelvis-relative, and joint-placement errors remain near frame 60 even with largest-box selection.')
        ],
        links: [
          { label: L('사람·생쥐 추론 결과 비교', 'Compare human and mouse predictions'), url: LIVE_URL + 'deeplabcut/', kind: 'demo' },
          { label: L('FMPose3D의 3D 관절 결과', 'FMPose3D joint predictions'), url: LIVE_URL + 'deeplabcut/?sample=human_3d', kind: 'demo' }
        ]
      },
      {
        id: 'tracking', eyebrow: '04 / 3D TRACKING',
        title: L('3D 추적: 표시되는 점과 정확도 구분', '3D tracking: visible points and actual accuracy'),
        body: [
          L('TraceAnything으로 DAVIS 기차 80프레임과 춤 90프레임을 추론했습니다. 춤은 전체 90프레임, 3프레임마다 선택한 30프레임, 인물 주변을 고정 크롭한 30프레임을 비교합니다. 원영상 위 투영과 회전 가능한 3D 뷰를 함께 제공합니다.', 'TraceAnything processed 80 DAVIS train frames and 90 dance frames. The dance viewer compares all 90 frames, 30 frames sampled every third frame, and a fixed person crop of those 30 frames, with projected overlays and a rotatable 3D view.'),
          L('DAVIS 마스크는 표시할 대상, 고정 크롭과 카메라 정합 가중치에 사용했습니다. 마스크가 예측된 3D 좌표를 교정하지는 않습니다. 빠른 회전과 가림에서 점이 몸 표면을 벗어나는 오차가 남아 있어 현재 품질 검토 중입니다.', 'DAVIS masks select displayed tracks, define the fixed crop, and weight camera fitting. They do not correct predicted 3D coordinates. Points still drift from body surfaces during fast rotation and occlusion; tracking quality remains under review.')
        ],
        links: [
          { label: L('실제 추적 결과 비교', 'Compare the tracking outputs'), url: LIVE_URL + 'track3d/', kind: 'demo' },
          { label: L('모델·데이터 출처와 사용 범위', 'Model, data, and usage scope'), url: LIVE_URL + 'track3d/SOURCES.md', kind: 'source' }
        ]
      }
    ],
    decisions: [
      { title: L('추론과 결과 탐색 분리', 'Separate inference from result exploration'), body: L('GPU 추론은 로컬에서 실행하고 프레임별 출력과 실행 조건을 저장합니다. 브라우저에서는 모델을 다시 실행하지 않고 같은 시점의 입력과 결과를 비교합니다.', 'GPU inference runs locally, with per-frame outputs and execution conditions saved. The browser compares inputs and outputs at the same timestamp without rerunning the model.') },
      { title: L('예측·후처리·시각화를 구분', 'Distinguish predictions, processing, and display'), body: L('마스크 선택이나 보기 좋은 시각화를 정확도 개선으로 표현하지 않습니다. 원시 출력과 처리 조건을 남겨 결과를 다시 확인할 수 있게 합니다.', 'Mask selection and clearer visualization are not presented as accuracy improvements. Raw outputs and processing conditions remain available for inspection.') }
    ],
    limitations: [
      L('이 프로젝트의 기여는 공개 모델을 연결한 구현·평가·시각화입니다. 원본 모델을 개발하거나 재학습한 결과가 아니며, Vercel은 저장된 결과를 제공하고 새 영상의 GPU 추론을 실행하지 않습니다.', 'The contribution is integration, evaluation, and visualization using credited public models. I did not develop or retrain the original models; Vercel serves recorded results rather than GPU inference on new uploads.'),
      L('관계 인식의 on 관계 실패, 실제 동작 영상의 판정 보류·오거절, 3D 추적의 드리프트, DeepLabCut의 대상 전환과 키포인트 오차가 남아 있습니다. 제한된 입력의 개발 실험이며 실제 로봇이나 새로운 사람·장면에 대한 일반화 성능을 입증하지 않습니다.', 'Unresolved failures include the on relation, abstention and false rejection on real motion footage, 3D tracking drift, and DeepLabCut target switches and keypoint errors. These are development experiments on limited inputs, without demonstrated generalization to real robots or new people and scenes.'),
      L('DeepLabCut 화면의 신뢰도는 2D 모델의 출력이며, 정답 대비 정확도나 FMPose3D의 3D 정확도를 뜻하지 않습니다. FMPose3D는 골반 원점의 상대 좌표로, 실제 세계 좌표 이동·미터 단위·정답 대비 3D 정확도를 검증하지 않았습니다. 장시간 개인 식별 추적도 검증 범위에 포함되지 않습니다.', 'Confidence in the DeepLabCut viewer comes from 2D models; it is neither ground-truth accuracy nor FMPose3D 3D accuracy. FMPose3D outputs pelvis-relative coordinates. World-space translation, metric scale, ground-truth 3D accuracy, and long-term identity tracking have not been validated.'),
      L('Track3D 실험은 TraceAnything을 사용합니다. 2026년 9월 29일 조사에서 코드 공개를 확인하지 못한 TrackEverything과는 별도 모델이며, 999프레임 이상 추적이나 정답 대비 3D 정확도를 검증한 결과가 아닙니다.', 'The Track3D experiment uses TraceAnything, a separate model from TrackEverything, whose code release was not found in the September 29, 2026 review. These runs do not validate 999-plus-frame tracking or 3D accuracy against ground truth.')
    ]
  };
  const archive = {
    id: project.id, title: project.title, summary, category: 'ai',
    status: L('AI / 비전 실험 5종', 'AI / FIVE VISION EXPERIMENTS'),
    period: project.period, image: image.src, imageAlt: image.alt,
    imageWidth: image.width, imageHeight: image.height,
    live: true, caseId: project.id, caseLabel: L('실험 개요 보기', 'Explore the lab'), stack: project.stack, links,
    keywords: ['RelateAnything', 'MotionCheck', 'TraceAnything', 'Track3D', 'DeepLabCut', 'SuperAnimal', 'FMPose3D', 'Pose', 'DTW', '관계 인식', '춤'],
    limitations: L('저장된 실행 결과를 탐색하는 실험실 · 입력별 오차와 범위 공개', 'A viewer for recorded runs · input-specific errors and scope documented')
  };
  return { project, archive, liveUrl: LIVE_URL };
});
