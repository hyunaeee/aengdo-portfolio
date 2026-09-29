/* Thirteen technology pages with recorded results and preparation status.
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
    { label: L('13개 기술 페이지 둘러보기', 'Explore 13 technology pages'), url: LIVE_URL, kind: 'demo' },
    { label: L('관계 인식 상세 사례', 'Relation prediction case'), url: PORTFOLIO_URL + '/work/relateanything/index.html', urlEn: PORTFOLIO_URL + '/work/relateanything/en.html', kind: 'source' },
    { label: L('동작·제어 상세 사례', 'Motion and control case'), url: PORTFOLIO_URL + '/work/motion-check/index.html', urlEn: PORTFOLIO_URL + '/work/motion-check/en.html', kind: 'source' }
  ];
  const summary = L(
    '공개 비전 모델의 추론을 연결하고 평가·시각화를 구현했습니다. 13개 기술 페이지에서 객체 관계, 동작 비교, 물리 제어, 추적·자세 추정의 실행 결과와 오류를 살펴보고, 실행한 단계와 모델 접근·파일 준비가 필요한 단계를 구분합니다.',
    'Integrated public vision models with evaluation and visualization across 13 technology pages. The lab presents recorded results and errors in object relations, motion comparison, simulated control, tracking, and pose estimation, while distinguishing executed stages from stages awaiting model access or required files.'
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
      { value: '13', label: L('기술별 페이지', 'Technology pages'), note: L('실제 실행 결과 · 단계별 진행 · 모델 준비 상태', 'Recorded results · stage progress · model preparation status') },
      { value: '481', label: L('관계 인식 입력 프레임', 'Relation experiment frames'), note: L('하나의 생성 영상 · 기본·개선 실행 비교', 'One generated clip · baseline and revised runs') },
      { value: '400', label: L('물리 시뮬레이션 평가', 'Physics simulation evaluations'), note: L('한 기준 동작·4관절 모형의 내부 반복', 'Internal repeats of one reference motion and four-joint model') }
    ],
    links,
    sections: [
      {
        id: 'experiments', eyebrow: '01 / EXPERIMENT MAP',
        title: L('기술별 실행 범위', 'Execution scope by technology'),
        body: [L(
          '기존 5개 실험에 8개 기술 페이지를 추가했습니다. 13개는 페이지 수이며, 13개 모델의 전체 파이프라인 실행 성공을 뜻하지 않습니다. 결과가 있는 페이지에서는 입력과 원시 예측을 비교하고, 준비 중인 페이지에는 완료 단계와 필요한 모델 접근·파일을 기록합니다. 관계 인식과 동작·제어의 상세 설계는 기존 사례로 연결합니다.',
          'Eight technology pages extend the five existing experiments. Thirteen is the page count, not a claim that 13 complete model pipelines ran successfully. Result pages compare inputs with raw predictions; preparation pages document completed stages and required model access or files. Existing cases retain the detailed relation and motion-control designs.'
        )],
        table: {
          headers: [L('실험', 'Experiment'), L('살펴보는 것', 'What it investigates'), L('실행 범위', 'Run scope')],
          rows: [
            ['RelateAnything', L('객체 연결 전후의 관계 점수와 오류', 'Relation scores and errors before and after object association'), L('생성 영상 481프레임', '481 generated-video frames')],
            ['MotionCheck V1', L('2D 관절과 시간 정렬로 동작 차이 비교', 'Motion differences using 2D joints and temporal alignment'), L('기준·수행 영상과 오류 사례', 'Reference and performed clips, including failures')],
            ['MotionCheck V2', L('동작 단계 판정과 MuJoCo 팔의 토크 제어', 'Motion-stage decisions and torque control of simulated arms'), L('내부 시뮬레이션 400회', '400 internal simulation evaluations')],
            ['TraceAnything', L('영상 위 궤적과 3D 점군', 'Trajectories over footage and in a 3D point cloud'), L('기차 80·춤 90프레임과 입력 변형', '80 train and 90 dance frames, plus input variants')],
            ['DeepLabCut', L('사람·생쥐의 2D 키포인트와 사람의 3D 포즈 추정', '2D human and mouse keypoints and human 3D pose estimates'), L('춤 90프레임·17관절, 생쥐 120프레임·27점', '90 dance frames with 17 joints; 120 mouse frames with 27 points')],
            ['TAPNext++', L('영상 속 표면 점의 2D 궤적', '2D trajectories of surface points in video'), L('춤 90·기차 80프레임 실제 추론', 'Inference on 90 dance and 80 train frames')],
            ['Sapiens2', L('308개 키포인트와 신체·의복 영역 분할', '308 keypoints and body/clothing segmentation'), L('춤 90프레임, pose·segmentation 각각 실행', '90 dance frames, pose and segmentation run separately')],
            ['HTD-Refine', L('PVA-Net의 관절 위치·속도·가속도 추정', 'PVA-Net joint position, velocity, and acceleration estimates'), L('90프레임 PVA-Net 실행 · 최종 메시 보정 대기', 'PVA-Net on 90 frames · final mesh refinement pending')],
            ['ReViV', L('1인칭 영상의 몸·양손·카메라·시선·상대 깊이 추정', 'Body, hands, camera, gaze, and relative-depth estimates from egocentric video'), L('공식 2초 예제 · 256 모델의 16입력 프레임 → 60모션 프레임', 'Official 2-second sample · 256 model, 16 input frames → 60 motion frames')],
            ['4DAnyone', L('사람 영상에서 새로운 시점의 영상 생성', 'Novel-view generation from a human video'), L('공개 가중치 준비 · SMPLX_NEUTRAL.npz 파일 필요', 'Public weights prepared · SMPLX_NEUTRAL.npz required')],
            ['SAM 3.1', L('텍스트로 지정한 대상의 마스크·ID 추적', 'Mask and ID tracking of text-prompted targets'), L('코드·환경 준비 · 모델 접근 승인 대기', 'Code and environment prepared · model access approval pending')],
            ['Fast SAM 3D Body', L('이미지별 인체 메시 추정 가속', 'Accelerated per-image human mesh estimation'), L('모델 API import 확인 · 가중치 접근 승인 대기', 'Model API imports verified · checkpoint access approval pending')],
            ['CARI4D', L('사람과 물체의 3D 동작·상호작용 복원', '3D human-object motion and interaction reconstruction'), L('코드·환경 준비 · SMPL-H 모델 파일 필요', 'Code and environment prepared · SMPL-H model files required')]
          ]
        },
        links: [
          { label: L('RelateAnything', 'RelateAnything'), url: LIVE_URL + 'relateanything/', kind: 'demo' },
          { label: L('MotionCheck V1', 'MotionCheck V1'), url: LIVE_URL + 'motion/', kind: 'demo' },
          { label: L('MotionCheck V2', 'MotionCheck V2'), url: LIVE_URL + 'motion/v2/', kind: 'demo' },
          { label: L('TraceAnything', 'TraceAnything'), url: LIVE_URL + 'track3d/', kind: 'demo' },
          { label: L('DeepLabCut', 'DeepLabCut'), url: LIVE_URL + 'deeplabcut/', kind: 'demo' },
          { label: L('TAPNext++', 'TAPNext++'), url: LIVE_URL + 'tapnextpp/', kind: 'demo' },
          { label: L('Sapiens2', 'Sapiens2'), url: LIVE_URL + 'sapiens2/', kind: 'demo' },
          { label: L('HTD-Refine', 'HTD-Refine'), url: LIVE_URL + 'htd-refine/', kind: 'demo' },
          { label: L('ReViV', 'ReViV'), url: LIVE_URL + 'reviv/', kind: 'demo' },
          { label: L('4DAnyone', '4DAnyone'), url: LIVE_URL + '4danyone/', kind: 'demo' },
          { label: L('SAM 3.1', 'SAM 3.1'), url: LIVE_URL + 'sam31/', kind: 'demo' },
          { label: L('Fast SAM 3D Body', 'Fast SAM 3D Body'), url: LIVE_URL + 'fast-sam3d/', kind: 'demo' },
          { label: L('CARI4D', 'CARI4D'), url: LIVE_URL + 'cari4d/', kind: 'demo' }
        ]
      },
      {
        id: 'contribution', eyebrow: '02 / MY CONTRIBUTION',
        title: L('구현한 기능과 검증 범위', 'Implementation and validation scope'),
        body: [
          L('구현에서는 객체 연결·시간 후처리, 관절 비교·단계 판정, MuJoCo 토크 제어를 구성했습니다. TraceAnything 추론은 Windows와 24GB GPU에 맞춰 실행 순서와 attention 호환 처리를 조정하고, 내보낸 좌표가 원시 예측과 일치하는지 확인했습니다.', 'I implemented object association and temporal processing, joint comparison and stage decisions, and MuJoCo torque control. For TraceAnything inference, I adapted execution scheduling and attention compatibility for Windows and a 24 GB GPU, then checked exported coordinates against raw predictions.'),
          L('평가에서는 관측 누락과 관계 오분류, 자세 차이와 시간 차이, 제어 오차와 완료 여부를 구분했습니다. DeepLabCut은 기본 설정과 대상 박스 선택 조건을 비교하고, 예측 신뢰도와 실제 정확도를 구분해 기록했습니다. 추가 모델은 실행한 단계·내보낸 데이터·남은 조건을 기록하고, 실제 결과와 준비 상태를 같은 Vercel 사이트의 13개 기술 페이지로 연결했습니다.', 'Evaluation separates missing observations from relation errors, pose differences from timing, and control error from task completion. For DeepLabCut, I compared default and bounding-box selection settings and distinguished prediction confidence from accuracy. For additional models, I recorded executed stages, exported data, and remaining requirements, connecting results and preparation status through 13 technology pages on one Vercel site.')
        ]
      },
      {
        id: 'tapnextpp', eyebrow: '03 / 2D POINT TRACKING',
        title: L('TAPNext++', 'TAPNext++'),
        body: [
          L('공식 공개 가중치로 춤 90프레임과 기차 80프레임의 2D 점 추적을 실행했습니다. 원본 영상 위 궤적과 프레임별 예측을 함께 제공해 같은 점이 어디로 이동하는지, 어느 구간에서 표면을 벗어나는지 확인할 수 있습니다.', 'Using the official public checkpoint, I ran 2D point tracking on 90 dance frames and 80 train frames. Trajectories over the source footage and per-frame predictions show where points move and where they drift from the surface.'),
          L('결과는 영상 픽셀 좌표의 점 궤적입니다. 인체 관절 이름이나 세계 좌표의 3D 이동을 추정한 결과가 아니며, 가림·빠른 회전에서의 오류와 정답 대비 정확도는 별도 검증이 필요합니다.', 'These outputs are point trajectories in image pixel coordinates. They do not estimate named body joints or world-space 3D motion; occlusion, fast rotation, and accuracy against ground truth require separate evaluation.')
        ],
        links: [{ label: L('TAPNext++', 'TAPNext++'), url: LIVE_URL + 'tapnextpp/', kind: 'demo' }]
      },
      {
        id: 'sapiens2', eyebrow: '04 / POSE AND SEGMENTATION',
        title: L('Sapiens2', 'Sapiens2'),
        body: [
          L('같은 춤 90프레임에 Sapiens2-0.4B의 pose와 segmentation을 각각 실행했습니다. 308개 키포인트와 배경을 포함한 29개 신체·의복 분할 클래스의 결과를 원본과 비교합니다. 모델 가중치는 로컬에 두고 영상, 원시 예측, 실행 조건을 내보냈습니다.', 'I ran Sapiens2-0.4B pose and segmentation separately on the same 90 dance frames. The viewer compares 308 keypoints and 29 body/clothing segmentation classes, including background, with the source footage. Model weights stay local; videos, raw predictions, and execution settings are exported.'),
          L('Pose는 프레임마다 가장 큰 사람 검출 박스를 선택하고, segmentation은 프레임별로 영역을 분할합니다. 시간에 걸친 사람 ID나 마스크 일관성을 보장하지 않습니다. 관절 점수는 1을 넘을 수 있는 원시 heatmap 값이며, 확률·정확도로 표시하지 않았습니다. 내보낸 90프레임과 원시 데이터의 일치를 확인했습니다.', 'Pose selects the largest detected person box in each frame; segmentation labels each frame independently. Neither guarantees persistent identity or temporal mask consistency. Joint scores are raw heatmap values that can exceed 1, not probabilities or accuracy. I verified alignment of all 90 exported frames and their raw data.')
        ],
        links: [{ label: L('Sapiens2', 'Sapiens2'), url: LIVE_URL + 'sapiens2/', kind: 'demo' }]
      },
      {
        id: 'htd-refine', eyebrow: '05 / PARTIAL PIPELINE',
        title: L('HTD-Refine', 'HTD-Refine'),
        body: [
          L('HTD-Refine의 PVA-Net 단계에서 공식 운동 예제 90프레임의 관절 위치·속도·가속도를 추정했습니다. 이 단계의 실제 출력과 입력을 공개하고, 전체 파이프라인에서 어디까지 실행했는지 구분했습니다.', 'I executed the PVA-Net stage of HTD-Refine to estimate joint positions, velocities, and accelerations across 90 frames of the official exercise sample. The page exposes this stage’s actual outputs and inputs and identifies how far the full pipeline has run.'),
          L('최종 인체 메시 보정은 실행하지 않았습니다. 별도 SMPLX_NEUTRAL.npz 모델 파일이 필요하며, PVA-Net 결과를 완성된 3D 모션 보정이나 메시 복원으로 표현하지 않습니다.', 'Final human mesh refinement has not run. It requires the separate SMPLX_NEUTRAL.npz model file; PVA-Net outputs are not presented as completed 3D motion refinement or mesh reconstruction.')
        ],
        links: [{ label: L('HTD-Refine', 'HTD-Refine'), url: LIVE_URL + 'htd-refine/', kind: 'demo' }]
      },
      {
        id: 'reviv', eyebrow: '06 / EGOCENTRIC MOTION',
        title: L('ReViV', 'ReViV'),
        body: [
          L('공식 2초 RGB 예제에 256×256 reviv_500b 모델을 실행해 몸, 양손, 카메라, 시선과 상대 깊이를 추정했습니다. 원본 32프레임·16fps에서 16프레임·8fps를 입력으로 선택했고, 몸·손·카메라·시선은 60프레임·30fps로 출력됩니다. 상대 깊이는 16프레임·8fps 출력입니다. 뷰어에서는 원본과 깊이 프레임을 반복해 같은 시간축으로 비교합니다.', 'I ran the 256×256 reviv_500b model on an official two-second RGB sample to estimate body motion, both hands, camera motion, gaze, and relative depth. From the original 32 frames at 16 fps, I selected 16 frames at 8 fps as input. Body, hand, camera, and gaze outputs contain 60 frames at 30 fps; relative depth contains 16 frames at 8 fps. The viewer repeats source and depth frames to align their timelines.'),
          L('몸·카메라 3D 뷰는 예측 좌표계를 그대로 사용했습니다. 양손의 화면 재투영에만 공식 예제의 정답 카메라 내부 파라미터 K를 사용했고, 모델 추론 입력에는 넣지 않았습니다. 특히 첫 프레임의 손 위치가 영상과 크게 어긋나는 결과를 수동 수정 없이 보존했습니다.', 'The body and camera 3D view retains the predicted coordinate system. Ground-truth camera intrinsics K from the official sample are used only to project the predicted hands onto the image, not as model inputs. I preserved the substantial hand-position mismatch, especially in the first frame, without manually correcting coordinates.'),
          L('단일 공식 예제의 실행·출력 형식을 확인한 실험이며, 정답 관절·시선과 정확도를 비교하지 않았습니다. 회색조 상대 깊이는 실제 미터 단위 거리로 검증하지 않았습니다. Cosmos 1.0 접근 동의가 필요한 512×512 metric_depth 모델은 실행하지 않았습니다.', 'This experiment verifies execution and output formats on one official sample; joint and gaze accuracy were not evaluated against ground truth. The grayscale relative-depth output has not been validated as distance in meters. The 512×512 metric_depth model, which requires Cosmos 1.0 access agreement, was not run.')
        ],
        links: [{ label: L('ReViV', 'ReViV'), url: LIVE_URL + 'reviv/', kind: 'demo' }]
      },
      {
        id: 'deeplabcut', eyebrow: '07 / KEYPOINT ESTIMATION',
        title: L('DeepLabCut', 'DeepLabCut'),
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
        id: 'tracking', eyebrow: '08 / 3D TRACKING',
        title: L('TraceAnything', 'TraceAnything'),
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
      L('13개 기술 페이지에는 실제 결과, 일부 단계만 실행한 결과, 모델 접근·파일 준비 중인 항목이 함께 있습니다. SAM 3.1·Fast SAM 3D Body는 공식 가중치 접근 승인이, 4DAnyone·HTD-Refine의 후속 단계는 SMPLX_NEUTRAL.npz가, CARI4D는 SMPL-H 모델 파일이 필요합니다. 코드 설치·import 성공을 추론 완료로 세지 않습니다.', 'The 13 technology pages include recorded results, partially executed pipelines, and items awaiting model access or files. SAM 3.1 and Fast SAM 3D Body require official checkpoint access approval; later stages of 4DAnyone and HTD-Refine require SMPLX_NEUTRAL.npz; CARI4D requires SMPL-H model files. Code installation or successful imports do not count as completed inference.'),
      L('관계 인식의 on 관계 실패, 실제 동작 영상의 판정 보류·오거절, 3D 추적의 드리프트, DeepLabCut의 대상 전환과 키포인트 오차가 남아 있습니다. 제한된 입력의 개발 실험이며 실제 로봇이나 새로운 사람·장면에 대한 일반화 성능을 입증하지 않습니다.', 'Unresolved failures include the on relation, abstention and false rejection on real motion footage, 3D tracking drift, and DeepLabCut target switches and keypoint errors. These are development experiments on limited inputs, without demonstrated generalization to real robots or new people and scenes.'),
      L('DeepLabCut 화면의 신뢰도는 2D 모델의 출력이며, 정답 대비 정확도나 FMPose3D의 3D 정확도를 뜻하지 않습니다. FMPose3D는 골반 원점의 상대 좌표로, 실제 세계 좌표 이동·미터 단위·정답 대비 3D 정확도를 검증하지 않았습니다. 장시간 개인 식별 추적도 검증 범위에 포함되지 않습니다.', 'Confidence in the DeepLabCut viewer comes from 2D models; it is neither ground-truth accuracy nor FMPose3D 3D accuracy. FMPose3D outputs pelvis-relative coordinates. World-space translation, metric scale, ground-truth 3D accuracy, and long-term identity tracking have not been validated.'),
      L('TraceAnything은 2026년 9월 29일 조사에서 코드 공개를 확인하지 못한 TrackEverything과는 별도 모델입니다. 이 실행은 999프레임 이상 추적이나 정답 대비 3D 정확도를 검증한 결과가 아닙니다. TAPNext++는 2D 점 추적이고, Sapiens2는 프레임별 자세·분할 추정입니다.', 'TraceAnything is a separate model from TrackEverything, whose code release was not found in the September 29, 2026 review. These runs do not validate 999-plus-frame tracking or 3D accuracy against ground truth. TAPNext++ performs 2D point tracking; Sapiens2 estimates pose and segmentation per frame.')
    ]
  };
  const archive = {
    id: project.id, title: project.title, summary, category: 'ai',
    status: L('AI / 비전 기술 페이지 13개', 'AI / 13 VISION TECHNOLOGY PAGES'),
    period: project.period, image: image.src, imageAlt: image.alt,
    imageWidth: image.width, imageHeight: image.height,
    live: true, caseId: project.id, caseLabel: L('실험 개요 보기', 'Explore the lab'), stack: project.stack, links,
    keywords: ['RelateAnything', 'MotionCheck', 'TraceAnything', 'DeepLabCut', 'TAPNext++', 'Sapiens2', 'HTD-Refine', 'ReViV', '4DAnyone', 'SAM 3.1', 'Fast SAM 3D Body', 'CARI4D', 'SuperAnimal', 'FMPose3D', 'Pose', 'DTW', '관계 인식', '춤'],
    limitations: L('실제 결과와 준비 상태 구분 · 입력별 오차와 실행 범위 공개', 'Recorded results separated from preparation status · errors and execution scope documented')
  };
  return { project, archive, liveUrl: LIVE_URL };
});
