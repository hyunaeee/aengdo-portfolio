/* Reference dance comparison experiment.
   Pose inference uses an upstream YOLO model; alignment and reporting are independent engineering. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_MOTION_CHECK = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  const LIVE_URL = 'https://relateanything-lab.vercel.app/motion/';
  const CASE_URL = 'https://hyunaeee.github.io/aengdo-portfolio/work/motion-check/';
  const links = [
    { label: L('동작 비교 실험', 'Explore motion comparisons'), url: LIVE_URL, kind: 'demo' },
    { label: L('전체 실험 보고서', 'Full experiment report'), url: LIVE_URL + 'report.html', kind: 'source' },
    { label: L('재현 코드·기록 ZIP', 'Reproduction code and evidence ZIP'), url: LIVE_URL + 'downloads/motion-check-experiment.zip', kind: 'source' },
    { label: L('21개 비교 원시 기록', 'Raw evidence from 21 comparisons'), url: CASE_URL + 'evidence.json', kind: 'source' },
    { label: L('문헌 검토 · 한국어', 'Literature review · Korean'), url: CASE_URL + 'literature-review.md', kind: 'source' },
    { label: L('논문·공개 코드 출처', 'Papers and release evidence'), url: CASE_URL + 'sources.json', kind: 'source' },
    { label: L('원본 pose 모델', 'Upstream pose model'), url: 'https://docs.ultralytics.com/models/yolo11/', kind: 'source' }
  ];
  const summary = L(
    '기준 동작과 후보 영상을 관절 단위로 비교한 21개 실험입니다. 단순 자세 차이를 구분한 결과와 함께, 시간 정렬이 실제 춤의 순서 변경·생략·정지를 놓친 한계를 공개합니다.',
    'Twenty-one comparisons of reference and candidate motion at the joint level. The study reports differences found in simple postures alongside failures to flag reordered, skipped, and frozen intervals in real dance footage.'
  );
  const image = {
    src: 'assets/motion-check.jpg', width: 1280, height: 720,
    alt: L(
      'MotionCheck 실험용 생성 기준 영상의 실제 프레임: 정면에서 양팔을 펼친 전신 인물',
      'Actual frame from the generated MotionCheck reference clip: a full-body performer facing the camera with both arms extended'
    )
  };
  const project = {
    id: 'motion-check', number: '09', title: 'MotionCheck Lab',
    featured: false, nextCase: 'relateanything', summary,
    status: L('AI · 기준 동작 비교 실험', 'AI · Reference motion comparison'),
    role: L('논문 조사 · 영상 검수 · pose 추론 · 시간 정렬 · 오류 분석 · 비교 화면', 'Literature review · footage review · pose inference · temporal alignment · error analysis · comparison viewer'),
    period: '2026.09',
    stack: ['Python', 'YOLO11s Pose', 'CUDA', 'DTW', 'Vercel'],
    image,
    imageCaption: L(
      'Higgsfield로 생성한 기준 영상의 3.0초 프레임 · 생성 프롬프트가 아닌 실제 영상을 검수해 동작 구간을 기록했습니다.',
      'Frame at 3.0 seconds from the Higgsfield-generated reference. Motion intervals were reviewed from the actual footage, not inferred from the generation prompt.'
    ),
    metrics: [
      { value: '21', label: L('완료한 비교', 'Completed comparisons'), note: L('통제 변형 16 + 별도 생성 1쌍 + 자세 4 · 독립 수행자 21명 아님', '16 controlled variants + 1 independent generated pair + 4 postures · not 21 independent performers') },
      { value: '1 + 3', label: L('명시적 자세 사례', 'Explicit posture cases'), note: L('일치 1개 aligned · 불일치 3개 needs_review · 합성 예시 4개', '1 match aligned · 3 mismatches needs_review · four synthetic examples') },
      { value: '4', label: L('놓친 통제 변경', 'Missed controlled changes'), note: L('실제 춤의 순서·생략·정지 + 합성 동작 생략', 'Real-dance order, omission, freeze + a generated-motion omission') }
    ],
    links,
    sections: [
      {
        id: 'question', eyebrow: '01 / PROBLEM',
        title: L('무슨 춤인가에서, 어떻게 달랐는가로', 'From recognizing a dance to locating the differences'),
        body: [
          L('같은 춤으로 인식되어도 팔의 방향이 다르거나 중간 동작을 빠뜨릴 수 있습니다. 이 실험은 기준 영상과 후보 영상을 함께 입력받아, 관절 자세와 시간 흐름을 비교하는 문제로 정의했습니다.', 'A performance can belong to the same dance class while using the wrong arm or skipping a movement. This experiment takes both a reference and a candidate video and compares their joint configurations and progression through time.'),
          L('춤을 생성하는 모델, 행동 종류를 분류하는 모델, 운동선수의 점수를 예측하는 모델을 구분해 조사했습니다. 첫 구현은 공개 pose 모델과 직접 작성한 정렬·분석 코드를 연결해 비교 근거를 확인할 수 있도록 구성했습니다.', 'I separated dance generation, action recognition, and sports quality assessment in the literature review. The first implementation connects an open pose model with independently written alignment and analysis code so that the comparison evidence remains inspectable.')
        ]
      },
      {
        id: 'pipeline', eyebrow: '02 / IMPLEMENTATION',
        title: L('같은 동작의 다른 속도를 맞추기', 'Aligning the same movement at different speeds'),
        body: [
          L('YOLO11s Pose를 CUDA에서 실행해 영상 프레임의 관절 위치와 신뢰도를 추출합니다. hip 중심과 몸통 크기로 자세를 정규화하고, 12Hz 시계열에서 제한된 DTW로 기준과 후보의 대응 시점을 계산합니다.', 'YOLO11s Pose runs on CUDA to extract joint locations and confidence from video frames. Poses are normalized using the hip center and torso size, then compared at 12 Hz with constrained DTW to find corresponding times in the reference and candidate.'),
          L('몸 중심 정규화로 좌우 이동 정보가 사라지지 않도록 root 이동 궤적도 함께 다룹니다. 좌우는 그대로 유지하는 strict mirror 정책을 사용합니다. 프레임마다 유리한 좌우 방향을 고르지 않으며, 관절 신뢰도가 부족하면 관측 불가 상태를 구분합니다.', 'Root motion is retained alongside body-centered pose so that lateral steps are not erased by normalization. A strict mirror policy preserves left and right. The system does not choose a favorable orientation independently in each frame, and separates insufficient-confidence observations from valid comparisons.'),
          L('DTW는 시간 차이를 줄이는 정렬 도구입니다. 긴 정지나 누락까지 늘여 맞출 수 있으므로, 정렬 비용이 낮다는 사실만으로 올바른 수행을 보장하지 않습니다. 통제 실험에서 이 한계가 실제 판정에 어떻게 나타나는지 확인합니다.', 'DTW reduces timing differences by aligning sequences. It can also stretch pauses or missing material, so a low alignment cost alone does not guarantee a correct performance. Controlled cases examine how this limitation appears in the resulting decisions.')
        ],
        diagram: [
          { label: L('기준 + 후보 영상', 'Reference + candidate'), detail: L('각 영상의 실제 시간 유지', 'Preserve each source timeline') },
          { label: L('Pose 추론', 'Pose inference'), detail: L('관절·신뢰도·root 궤적', 'Joints, confidence, root motion') },
          { label: L('시간 정렬', 'Temporal alignment'), detail: L('12Hz · 제한된 DTW', '12 Hz · constrained DTW') },
          { label: L('차이 확인', 'Inspect differences'), detail: L('대응 프레임과 관측 상태', 'Matched frames and observability') }
        ]
      },
      {
        id: 'experiment', eyebrow: '03 / EXPERIMENT DESIGN',
        title: L('통제한 변화와 독립 생성 영상을 구분', 'Separate controlled changes from independent clips'),
        body: [
          L('실제 Floss 춤 영상은 3.1초·31프레임의 짧은 공개 자료입니다. 이 원본과 약 12초의 합성 기준 영상에 각각 동일 입력, 전체·부분 속도 변화, 중간 정지, 구간 생략, 순서 변경, 좌우 반전, 중간 구간 영상 소실의 8개 변형을 적용했습니다. 16개 변형 영상에서 각각 pose를 다시 추론했습니다. 영상 소실 조건은 중간 60% 구간을 검정 프레임으로 대체한 것입니다.', 'The real Floss source contains 31 frames over 3.1 seconds. This source and a roughly 12-second generated reference each received eight variants: identity, global and local tempo changes, a middle freeze, omission, reordering, mirroring, and a missing middle interval. Pose inference was rerun on all 16 transformed videos. The missing-video condition replaces the middle 60% with black frames.'),
          L('기준 안무와 같은 지시의 후보 수행을 Higgsfield로 별도 생성해 한 쌍을 비교했습니다. 또 양팔 머리 위 자세를 기준으로 일치 1개와 한 팔만 들기·양팔 수평·양팔 아래의 불일치 3개를 비교했습니다. 실제 영상의 구간과 자세를 추론 전에 AI 보조 시각 검토 초안으로 고정했으며, 전문가 각도 정답이나 생성 프롬프트를 정답으로 사용하지 않았습니다.', 'A separately generated Higgsfield candidate followed the same instruction as the reference, forming one additional pair. Four posture comparisons used a both-arms-overhead target: one match and three mismatches with one arm raised, both arms horizontal, or both arms down. AI-assisted visual drafts of the actual footage were fixed before inference; they are neither expert angle labels nor labels copied from generation prompts.'),
          L('통제 변형은 특정 변화에 대한 기능 점검이며 독립적인 사람 수행 8개가 아닙니다. 별도 생성 영상도 실제 촬영에서의 일반화 성능을 입증하지 않습니다. 두 실험 묶음을 분리해 해석합니다.', 'Controlled transformations test responses to specific changes; they are not eight independent human performances. Separately generated clips also do not establish generalization to real recordings. The two experiment groups are interpreted separately.')
        ],
        table: {
          headers: [L('실험 자료', 'Input group'), L('확인할 문제', 'Question being tested'), L('해석 범위', 'Interpretation')],
          rows: [
            [L('실제 Floss · 합성 기준 각 8개 변형', 'Eight variants each of real Floss and generated reference'), L('속도 허용과 생략·순서·영상 소실의 영향', 'Tempo tolerance and effects of omissions, ordering, and lost video'), L('동일 원본의 통제 기능 실험 · 16개', 'Controlled tests derived from shared sources · 16')],
            [L('독립 생성 기준·후보', 'Separately generated reference and candidate'), L('두 수행의 정렬과 관측된 차이', 'Alignment and observed differences'), L('정성 비교 · 1쌍', 'Qualitative comparison · one pair')],
            [L('명시적 자세 일치 1 · 불일치 3', 'One explicit posture match and three mismatches'), L('팔의 큰 자세 차이', 'Coarse differences in arm posture'), L('관련 합성 영상의 초안 검사 · 4개', 'Draft checks from related generated footage · four')]
          ]
        },
        links: [
          { label: L('Floss 원본 · LittleT889', 'Floss source · LittleT889'), url: 'https://commons.wikimedia.org/wiki/File:Floss_(dance).gif', kind: 'source' },
          { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', kind: 'source' }
        ]
      },
      {
        id: 'results', eyebrow: '04 / MEASURED RESULTS',
        title: L('자세 차이는 찾았지만, 동작 생략은 놓쳤습니다', 'Posture differences were flagged; omissions were missed'),
        body: [
          L('양팔 머리 위 기준에 대한 일치 예시 1개는 aligned, 명확히 다른 자세 3개는 needs_review였습니다. 한 팔만 든 예시는 전체 평균 거리 0.317로 평균 기준 0.35보다 작았지만, 팔 부위별 신호로 검토 대상으로 표시됐습니다. 이는 관련 합성 영상 4개의 기능 점검이며 정확도 100%라는 일반 성능 추정으로 해석하지 않습니다.', 'One matching overhead-arm example was aligned, while three clearly different postures were needs_review. The one-arm example had a mean distance of 0.317, below the global review threshold of 0.35, but arm-specific signals flagged it. These are four functional checks from related synthetic footage, not an estimate of 100% general accuracy.'),
          L('구간별 속도만 바꾼 합성 영상은 정규화 시간 대응 거리 0.226에서 DTW 거리 0.010으로 줄었습니다. 실제 춤의 같은 조건도 0.170에서 0.041로 줄었습니다. 이 값은 몸통 길이를 단위로 한 평균 관절 거리이며 정확도나 확률이 아닙니다.', 'For a generated clip with nonuniform tempo changes, mean joint distance fell from 0.226 with normalized-time correspondence to 0.010 with DTW. The corresponding real-dance case fell from 0.170 to 0.041. Distances are measured in torso-length units, not accuracy percentages or probabilities.'),
          L('반면 실제 Floss의 순서 교환·중간 생략·중간 정지와 합성 동작의 중간 생략은 모두 aligned로 남았습니다. 합성 생략 사례는 DTW 거리가 0.014로 작아도 필요한 구간이 제거된 영상입니다. 낮은 정렬 비용이 모든 동작을 수행했다는 증거가 되지 않는 실패를 확인했습니다.', 'Real Floss clips with reordered, omitted, and frozen intervals, plus a generated clip with an omitted interval, all remained aligned. The generated omission reached a low DTW distance of 0.014 despite missing required footage. This demonstrates that a low alignment cost does not prove that every movement was performed.'),
          L('별도 생성 후보는 0.074에서 0.055로 줄어 aligned였습니다. 이 쌍에는 전문가의 이진 정답이 없으며 춤을 정확히 따라 했다는 판정으로 집계하지 않았습니다. aligned는 충분히 관측된 좌표에서 설정한 검토 신호가 없다는 진단 상태입니다.', 'The independently generated pair improved from 0.074 to 0.055 and was aligned. It has no expert binary correctness label and was not counted as a correct dance performance. Aligned means that sufficiently observed coordinates did not trigger the configured review signals.'),
          L('중간 구간이 검정 프레임인 두 영상은 unknown이었습니다. 실제 춤의 좌우 반전도 관측률 78.4%로 80% 기준을 밑돌아 unknown으로 남았습니다. 관측 부족과 자세 불일치를 같은 오류로 세지 않았습니다.', 'Both videos with blacked-out middle intervals were unknown. The mirrored real-dance clip also remained unknown, with 78.4% coverage below the 80% threshold. Insufficient observations were kept separate from posture mismatches.'),
          L('검토 기준은 실제 비교 결과에 맞춰 최적화하지 않았습니다. 평균·부위 평균·부위 p95 거리, 관측률, 반복 대응 시간과 root 이동 기준을 기록했습니다. 전체 평균이 한쪽 팔 차이를 희석하는 합성 단위 테스트를 확인한 뒤 실제 영상 비교 전에 p95 기준을 추가했습니다.', 'Review thresholds were not optimized against the actual comparison results. The recorded specification includes global, body-part mean and p95 distances, coverage, repeated alignment duration, and root motion. A p95 rule was added before the video comparisons after a synthetic unit check showed that global averaging could dilute a one-arm difference.')
        ],
        table: {
          headers: [L('사례', 'Case'), L('관측 진단', 'Observed diagnostic'), L('DTW 거리', 'DTW distance')],
          rows: [
            [L('일치하는 양팔 머리 위 자세', 'Matching overhead posture'), 'aligned', '0.070'],
            [L('한 팔만 머리 위 / 수평 팔 / 양팔 아래', 'One arm overhead / horizontal / both down'), 'needs_review × 3', '0.317 / 0.327 / 0.504'],
            [L('실제 춤 순서 교환 / 생략 / 정지', 'Real-dance reorder / omission / freeze'), L('aligned · 놓친 변경', 'aligned · missed changes'), '0.114 / 0.071 / 0.084'],
            [L('합성 동작 중간 생략', 'Generated-motion omission'), L('aligned · 놓친 변경', 'aligned · missed change'), '0.014'],
            [L('합성 동작 순서 교환 / 정지 / 반전', 'Generated-motion reorder / freeze / mirror'), 'needs_review × 3', '0.088 / 0.067 / 0.140'],
            [L('중간 구간 영상 소실 · 실제 / 합성', 'Missing video interval · real / generated'), 'unknown × 2', L('관측률 35.1% / 40.0%', 'Coverage 35.1% / 40.0%')]
          ]
        },
        links: [
          { label: L('한 팔 오류 보기', 'Inspect the one-arm difference'), url: LIVE_URL + '?case=pose_wrong_one_arm', kind: 'demo' },
          { label: L('놓친 생략 사례 보기', 'Inspect a missed omission'), url: LIVE_URL + '?case=real_skip_middle', kind: 'demo' }
        ]
      },
      {
        id: 'research', eyebrow: '05 / RESEARCH',
        title: L('논문에서 가져온 판단과 직접 구현한 범위', 'Research context and the implementation boundary'),
        body: [
          L('시간 정렬, 시점에 강한 pose 표현, 춤 데이터셋, 동작 품질 평가를 나누어 핵심 10편과 관련 6편을 검토했습니다. 논문에서 공개했다고 서술한 것과 실제 저장소에서 실행 코드·가중치를 확인한 것을 구분했습니다.', 'The review covers ten core papers and six related works across temporal alignment, view-invariant pose representations, dance datasets, and action quality assessment. It distinguishes claims of release in papers from executable code and weights actually found in official repositories.'),
          L('이번 시스템은 TCC·LAV의 학습된 영상 표현이나 공식 가중치를 실행한 재현이 아닙니다. 공개 pose 모델 위에 설명 가능한 특징 비교와 시간 정렬을 구현한 독립적인 엔지니어링 실험입니다.', 'This system does not reproduce TCC or LAV using their learned video representations or official weights. It is an independent engineering experiment implementing inspectable feature comparison and temporal alignment on top of a public pose model.')
        ],
        table: {
          headers: [L('연구', 'Research'), L('다루는 문제', 'Scope'), L('이번 설계와의 관계', 'Relation to this design')],
          rows: [
            ['TCC · CVPR 2019', L('영상 프레임의 학습 기반 시간 대응', 'Learned temporal correspondence between video frames'), L('대응 프레임을 근거로 보여 주는 방향', 'Motivates presenting matched-frame evidence')],
            ['LAV · CVPR 2021', L('Soft-DTW와 시간 정규화로 표현 학습', 'Representation learning with Soft-DTW and temporal regularization'), L('정렬과 단계 구별을 함께 평가해야 함', 'Alignment and phase discrimination require separate checks')],
            ['AIST++ · ICCV 2021 / FineDance · ICCV 2023', L('음악·춤 motion과 생성 연구', 'Music-motion data and dance generation'), L('춤 자료 후보이며 수행 준수 정답은 아님', 'Potential dance data, not ready-made compliance labels')],
            ['MotionCheck Lab', L('공개 pose 추론 + 자체 특징·DTW 비교', 'Public pose inference + custom features and DTW'), L('통제 변화와 독립 생성 수행을 구분해 분석', 'Analyze controlled changes separately from independent generated performances')]
          ]
        },
        links: [
          { label: 'TCC · CVPR 2019', url: 'https://openaccess.thecvf.com/content_CVPR_2019/html/Dwibedi_Temporal_Cycle-Consistency_Learning_CVPR_2019_paper.html', kind: 'source' },
          { label: 'LAV · CVPR 2021', url: 'https://arxiv.org/abs/2103.17260', kind: 'source' },
          { label: 'AIST++', url: 'https://google.github.io/aistplusplus_dataset/', kind: 'source' },
          { label: 'FineDance', url: 'https://github.com/li-ronghui/FineDance', kind: 'source' }
        ]
      },
      {
        id: 'physical-ai', eyebrow: '06 / PHYSICAL AI SCOPE',
        title: L('관측·평가 단계에서 확인한 것', 'What this establishes at the perception and evaluation stage'),
        body: [
          L('NVIDIA의 Physical AI 설명은 센서 관측과 공간적 추론뿐 아니라 모터·구동기를 통한 행동과 실제 환경 적응을 포함합니다. Sim-to-real 안내는 시뮬레이션 학습, 실제 로봇 평가, 구동 차이를 다루며, Seattle Robotics Lab도 perception·planning·control을 연결하는 연구를 소개합니다.', 'NVIDIA describes Physical AI as including sensor perception and spatial reasoning, as well as action through motors and actuators and adaptation to real environments. Its sim-to-real guide covers simulation training, real-robot evaluation, and the actuation gap; the Seattle Robotics Lab also connects perception, planning, and control.'),
          L('MotionCheck의 현재 근거는 영상에서 사람의 자세를 관측하고 기준과 비교한 결과까지입니다. 로봇 구동, 행동 정책, 폐루프 제어, 물리 시뮬레이션, sim-to-real 전이는 수행하지 않았습니다. 따라서 Physical AI를 구성할 수 있는 관측·평가 실험으로 위치시키며, 완성된 로봇 시스템의 성능으로 제시하지 않습니다.', 'MotionCheck currently provides evidence for observing human pose from video and comparing it with a reference. It has not executed robot actuation, action policies, closed-loop control, physical simulation, or sim-to-real transfer. It is positioned as a perception and evaluation experiment that could contribute to Physical AI, without claiming the performance of a complete robotic system.')
        ],
        links: [
          { label: 'NVIDIA Seattle Robotics Lab', url: 'https://research.nvidia.com/labs/srl/', kind: 'source' },
          { label: 'NVIDIA Physical AI / Sim-to-real', url: 'https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/01-overview.html', kind: 'source' }
        ]
      },
      {
        id: 'viewer', eyebrow: '07 / RECORDED DEMO',
        title: L('영상과 계산 근거를 함께 확인', 'Inspect footage alongside the computed evidence'),
        body: [
          L('공개 화면은 기준·후보 영상과 저장된 pose·정렬 결과를 탐색하는 뷰어입니다. Vercel에서 GPU 추론을 실행하지 않으며, 기록된 오프라인 분석과 영상 재생 속도를 구분합니다.', 'The public page is a viewer for reference and candidate footage with recorded pose and alignment results. It does not run GPU inference on Vercel, and distinguishes offline analysis from video playback.'),
          L('촬영 조건과 영상 출처, 적용한 변형, 추론 설정을 결과와 함께 남깁니다. 반복 동작에서 정렬이 애매한 구간과 관측 불가 상태도 결과 해석에 포함합니다.', 'Source provenance, recording conditions, transformations, and inference settings accompany the results. Ambiguous alignments in repetitive motion and unobservable intervals remain part of the interpretation.'),
          L('RTX 4090·FP32·입력 크기 960의 원본 영상 pose 추출은 Floss 평균 10.19ms, 생성 기준 12.12ms, 생성 후보 11.65ms/프레임이었습니다. 평균의 역수는 각각 98.12, 82.49, 85.82 FPS입니다. 3회 워밍업 뒤 CUDA 동기화로 디코딩·pose·후처리를 측정했으며 JSON 저장·시각화와 별도 CPU 시간 정렬은 포함하지 않습니다. 온라인 비교 서비스의 전체 FPS가 아닙니다.', 'On an RTX 4090 with FP32 and input size 960, source-video pose extraction averaged 10.19 ms/frame for Floss, 12.12 ms for the generated reference, and 11.65 ms for the generated candidate. Their inverse means are 98.12, 82.49, and 85.82 FPS. CUDA-synchronized timing after three warmups includes decoding, pose inference, and postprocessing; it excludes JSON writes, visualization, and separate CPU alignment. These are not end-to-end online comparison FPS.')
        ],
        table: {
          headers: [L('Pose 추출 영상', 'Pose extraction input'), L('평균 / p95 · ms', 'Mean / p95 · ms'), L('평균 역수 · FPS', 'Inverse mean · FPS')],
          rows: [
            ['Floss · 31 frames', '10.19 / 14.24', '98.12'],
            [L('생성 기준 · 289프레임', 'Generated reference · 289 frames'), '12.12 / 17.82', '82.49'],
            [L('생성 후보 · 289프레임', 'Generated candidate · 289 frames'), '11.65 / 15.86', '85.82']
          ]
        },
        links: [
          { label: L('Pose 추출 시간 원시 기록', 'Raw pose extraction timings'), url: CASE_URL + 'pose-timings.json', kind: 'source' }
        ]
      }
    ],
    decisions: [
      {
        title: L('좌우와 이동을 평가 전에 고정', 'Fix laterality and translation handling before evaluation'),
        body: L('거울 허용 여부를 실행 전에 정하고, 몸 중심 자세와 root 이동을 구분합니다. 비교가 잘 맞도록 좌우·이동 정보를 사후에 지우지 않습니다.', 'Mirroring policy is chosen before a run, and body-centered posture is separated from root translation. Laterality and travel are not removed after seeing the comparison.')
      },
      {
        title: L('관측 불가와 동작 오류를 구분', 'Distinguish missing evidence from motion errors'),
        body: L('가려진 관절의 낮은 신뢰도를 올바른 동작의 근거로 사용하지 않습니다. 정렬 결과와 함께 관측 가능 범위를 확인하도록 구성했습니다.', 'Low-confidence occluded joints are not evidence of a correct motion. Observability is reviewed alongside the alignment result.')
      },
      {
        title: L('변형 영상에서도 모델을 다시 실행', 'Rerun inference on transformed footage'),
        body: L('정답 pose를 직접 조작해 성공을 만드는 대신 실제 변형된 영상에서 추론 경로를 다시 거칩니다. 다만 같은 원본에 의존하는 통제 실험이라는 한계는 유지됩니다.', 'The inference path runs again on transformed video rather than manufacturing success by modifying ideal pose coordinates. These remain controlled tests derived from a shared source.')
      }
    ],
    limitations: [
      L('단안 2D 관절 비교입니다. 깊이·회전·빠른 가림·손가락 표현과 예술적인 춤의 완성도를 평가하지 않습니다.', 'The comparison uses monocular 2D joints. It does not assess depth, complex rotations, fast occlusions, finger articulation, or artistic dance quality.'),
      L('실제 춤 원본은 3.1초로 짧고 반복적입니다. 비슷한 자세가 여러 번 나타나는 만큼 시간 정렬이 유일한 정답이라고 보장할 수 없습니다.', 'The real dance source is short and repetitive at 3.1 seconds. Repeated similar poses mean that a computed alignment is not guaranteed to be uniquely correct.'),
      L('통제 변형과 생성 영상은 개발 실험입니다. 다양한 실제 인물·촬영 환경의 held-out 수행에서 일반화 성능을 검증한 benchmark가 아닙니다.', 'Controlled variants and generated clips are development experiments. They are not a benchmark validated on held-out real performers and recording conditions.'),
      L('전체 영상을 이용하는 오프라인 정렬입니다. 공개 화면은 저장된 결과를 재생하며 실시간 춤 지도 시스템으로 검증하지 않았습니다.', 'Alignment uses the complete videos offline. The public page replays saved outputs and has not been validated as a real-time dance coaching system.'),
      L('YOLO11s Pose를 재학습하지 않았습니다. 기여 범위는 문헌 검토, 자료·라벨 관리, 추론 연동, 특징·정렬·평가와 결과 시각화입니다.', 'YOLO11s Pose was not retrained. Contributions are literature review, data and annotation management, inference integration, feature/alignment/evaluation code, and visualization.'),
      L('실제 영상 출처: LittleT889의 “Floss (dance)”, Wikimedia Commons, CC BY-SA 4.0. 변형 영상은 재인코딩·속도·순서·가림 등의 변경을 명시하고 같은 라이선스로 제공합니다. 표지와 별도 안무 영상은 Higgsfield 생성 자료입니다.', 'Real-footage credit: “Floss (dance)” by LittleT889, Wikimedia Commons, CC BY-SA 4.0. Adaptations identify re-encoding, tempo, order, occlusion, and other changes and retain the same license. The cover and separate choreography clips were generated with Higgsfield.')
    ]
  };
  const archive = {
    id: project.id, title: project.title, summary, category: 'ai',
    status: L('AI / 기준 동작 비교', 'AI / REFERENCE MOTION COMPARISON'),
    period: project.period, image: image.src, imageAlt: image.alt,
    imageWidth: image.width, imageHeight: image.height,
    live: true, caseId: project.id, stack: project.stack, links,
    limitations: L('실제 춤의 통제 변형 + 독립 생성 영상 · 저장된 분석 뷰어', 'Controlled changes to real dance + independent generated clips · recorded analysis viewer')
  };
  return { project, archive, liveUrl: LIVE_URL };
});
