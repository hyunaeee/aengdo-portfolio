/* RoboSkill Lab case study. Measurements come from artifacts/latest/report.json. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_ROBOSKILL = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  const BASE_URL = 'https://hyunaeee.github.io/aengdo-portfolio/robo-skill-lab';
  const REPO_URL = 'https://github.com/hyunaeee/aengdo-portfolio/tree/main/robo-skill-lab';
  const links = [
    { label: L('실행 재생', 'Replay runs'), url: BASE_URL + '/viewer/', kind: 'demo' },
    { label: L('코드', 'Code'), url: REPO_URL, kind: 'code' },
    { label: L('원본 기록 · JSON', 'Run data · JSON'), url: BASE_URL + '/artifacts/latest/report.json', kind: 'source' },
    { label: L('실행 요약', 'Run summary'), url: 'https://github.com/hyunaeee/aengdo-portfolio/blob/main/robo-skill-lab/artifacts/latest/SUMMARY.md', kind: 'source' }
  ];
  const image = {
    src: 'robo-skill-lab/artifacts/latest/mujoco.png', width: 960, height: 720,
    alt: L('MuJoCo에서 실제 렌더한 3축 직교 로봇, 빨간색·파란색 블록과 목표 지점', 'Actual MuJoCo render of the three-axis Cartesian pusher, red and blue blocks, and target region')
  };
  const summary = L(
    '말로 지시한 블록 밀기 작업을 MuJoCo의 물리 접촉으로 실행합니다. 한 번 계획해 미는 방식과 위치를 다시 보며 수정하는 방식을 24회 실행하고, 성공률·소요 시간·실패 기록을 비교했습니다.',
    'Turns a constrained language instruction into a physical pushing task in MuJoCo. Across 24 runs, I compared a single planned push with repeated observation and replanning, including success, time, and failure records.'
  );
  const project = {
    id: 'robo-skill', number: '08', title: 'RoboSkill Lab', featured: true, nextCase: 'visioneye',
    summary,
    status: L('로보틱스 · 물리 실행·평가', 'Robotics · Simulation and evaluation'),
    role: L('과제 설계 · 물리 환경 · 작업 계약 · 제어·평가 · 결과 뷰어', 'Task design · physics environment · task contract · control and evaluation · results viewer'),
    period: '2026.09',
    stack: ['Python', 'MuJoCo', 'NumPy', 'JavaScript'],
    image,
    imageCaption: L('실제 MuJoCo 렌더 · 공개 웹에서는 저장된 실행을 재생합니다.', 'Actual MuJoCo render · the public website replays recorded runs.'),
    labels: { decisions: L('설계 판단', 'Design decisions'), limits: L('현재 범위', 'Current scope') },
    metrics: [
      { value: '5/12 → 12/12', label: L('전략별 성공', 'Success by strategy'), note: L('한 번 밀기 → 재관측·재접근 · 개발 조건', 'Single push → observe and reapproach · development conditions') },
      { value: '7.05 → 17.71 s', label: L('평균 시뮬레이션 시간', 'Mean simulation time'), note: L('한 번 밀기 → 재관측·재접근 · 실제 계산 시간과 구분', 'Single push → observe and reapproach · distinct from compute time') },
      { value: '24', label: L('물리 실행', 'Physics runs'), note: L('4조건 × 3 seed × 2전략 · MuJoCo 3.13.0', '4 conditions × 3 seeds × 2 strategies · MuJoCo 3.13.0') }
    ],
    links,
    sections: [
      {
        id: 'motivation', eyebrow: L('01 / 출발점', '01 / MOTIVATION'),
        title: L('AI의 판단을 물리적인 결과까지 연결하기', 'Connect an AI decision to a physical outcome'),
        body: [
          L('MED-RAG에서는 응답을 평가하고, 에이전트 프로젝트에서는 작업을 실행하며, VisionEye에서는 원본과 인식 결과를 비교했습니다. 다음에는 “명령을 이해했다”에서 한 걸음 더 나아가, 움직인 물체가 실제 목표에 도달했는지 확인하는 시스템을 만들고 싶었습니다.', 'In MED-RAG I evaluated responses; in agent projects I connected actions; in VisionEye I compared source footage with perception results. I wanted to extend that work to a system that checks whether a commanded action actually moves an object to its goal.'),
          L('첫 과제는 “빨간 블록을 오른쪽 목표로 밀어줘”입니다. 툴이 계획한 경로를 끝까지 움직여도 블록은 목표에 도착하지 않을 수 있습니다. 마찰·질량·외력을 바꾸고, 실행 결과를 다시 관찰하는 전략이 이 차이를 줄일 수 있는지 실험했습니다.', 'The first task is “push the red block to the right goal.” A tool can complete its planned path while the block still misses the goal. I varied friction, mass, and an applied force to test whether observing the outcome and replanning could reduce this gap.')
        ]
      },
      {
        id: 'system', eyebrow: L('02 / 구현', '02 / SYSTEM'),
        title: L('지시부터 접촉·재관측까지', 'From instruction to contact and observation'),
        diagram: [
          { label: L('지시', 'Instruction'), detail: L('한국어·영어 규칙 문법', 'Constrained Korean/English grammar') },
          { label: L('작업 명세', 'Task contract'), detail: 'push / object / goal' },
          { label: L('실행', 'Execute'), detail: L('3축 로봇 · 위치 액추에이터', 'Three-axis robot · position actuators') },
          { label: L('관측·수정', 'Observe and revise'), detail: L('물체 위치 → 다시 접근', 'Object position → reapproach') },
          { label: L('검증', 'Verify'), detail: L('안정 도달 · 궤적·이벤트', 'Stable arrival · trajectory and events') }
        ],
        body: [
          L('MuJoCo를 CPU에서 0.002초 간격으로 실행합니다. 제어기는 로봇 액추에이터의 목표 위치를 쓰고, 블록은 중력·마찰·접촉에 따라 움직입니다. 접근→내리기→밀기→들기→재관측 단계를 나누어 어느 단계에서 결과가 달라졌는지 기록합니다.', 'MuJoCo runs on CPU with a 0.002-second timestep. The controller sets robot actuator targets; gravity, friction, and contact move the blocks. Separate approach, lower, push, lift, and observe phases make each run inspectable.'),
          L('현재 공개 실험은 규칙 기반 지시 해석과 시뮬레이터의 정답 좌표를 사용합니다. 선택적 Ollama 연결은 검증된 작업 명세만 전달하도록 구현하고 응답 계약을 시험했습니다. 실제 LLM 추론과 카메라 인식은 다음 단계입니다.', 'The published experiment uses a rule-based parser and ground-truth simulator coordinates. An optional Ollama adapter passes only validated task specifications and has response-contract tests. Actual LLM inference and camera perception are future steps.')
        ]
      },
      {
        id: 'protocol', eyebrow: L('03 / 실험 설계', '03 / PROTOCOL'),
        title: L('동일한 출발점, 다른 실행 전략', 'The same starting state, two execution strategies'),
        body: [
          L('각 조건에서 초기 블록 위치를 seed로 ±2.5 cm 바꾸고 두 전략에 같은 상태를 사용했습니다. 한 번 밀기는 처음 본 위치로 전체 경로를 실행합니다. 재관측 전략은 최대 9.5 cm씩 밀고, 현재 위치를 읽어 다시 접근합니다.', 'For each condition, a seed shifts the initial block positions by up to ±2.5 cm, with matching states for both strategies. Open loop executes one full push from the initial observation. Closed loop pushes at most 9.5 cm, reads the current position, and approaches again.'),
          L('성공은 목표 중심 4.5 cm 안에서 선속도 2.5 cm/s 미만·각속도 0.5 rad/s 미만을 0.3초 유지하는 것입니다. 비표적 블록 이동은 4 cm 미만이어야 하며, 작업 영역 이탈과 24초 시간 초과는 실패로 처리합니다.', 'Success requires staying within 4.5 cm of the goal with linear speed below 2.5 cm/s and angular speed below 0.5 rad/s for 0.3 seconds. The other block must move less than 4 cm; leaving the workspace or exceeding 24 seconds counts as failure.')
        ],
        table: {
          headers: [L('전략', 'Strategy'), L('실행 방식', 'Execution'), L('공통 조건', 'Shared conditions')],
          rows: [
            ['open_loop', L('초기 관측 → 전체 거리 한 번 밀기', 'Initial observation → one full-distance push'), L('같은 seed·목표·액추에이터·속도·24초 예산', 'Same seed, goal, actuators, speed, and 24-second budget')],
            ['closed_loop', L('최대 9.5 cm 밀기 → 재관측·재접근', 'Push up to 9.5 cm → observe and reapproach'), L('같은 성공 판정과 비표적 이동 제한', 'Same success criteria and distractor movement limit')]
          ]
        },
        bullets: [L('관측 주기와 함께 밀기 구간·재접근 횟수도 달라지는 전략 비교입니다. 관측만의 효과를 분리한 실험은 다음 단계로 남겼습니다.', 'This comparison changes push segments and reapproaches as well as observation frequency. Isolating the effect of observation is a planned follow-up.')]
      },
      {
        id: 'results', eyebrow: L('04 / 측정 · 2026.09.15', '04 / MEASURED · 2026.09.15'),
        title: L('더 많이 도달했지만, 더 오래 걸렸다', 'More goals reached, with more time spent'),
        body: [
          L('4조건 × 3 seed × 2전략을 실제 실행했습니다. 한 번 밀기는 12회 중 5회, 재관측·재접근은 12회 모두 성공했습니다. 평균 최종 거리는 13.28 cm에서 1.08 cm로 줄었고, 평균 시뮬레이션 시간은 7.05초에서 17.71초로 늘었습니다.', 'I executed four conditions, three seeds, and two strategies. The single-push strategy succeeded in 5 of 12 runs; observation and reapproach succeeded in all 12. Mean final distance fell from 13.28 cm to 1.08 cm, while mean simulation time rose from 7.05 to 17.71 seconds.'),
          L('낮은 마찰에서는 두 전략 모두 3/3으로 성공했습니다. 질량과 마찰을 함께 높인 조건, 외력을 가한 조건에서는 결과 차이가 컸습니다. 이 조건과 seed는 제어기 개발에도 사용한 작은 개발 세트입니다.', 'Both strategies succeeded in all three low-friction runs. Larger differences appeared when mass and friction increased together and when a force was applied. These conditions and seeds form a small development set also used while building the controller.')
        ],
        table: {
          headers: [L('조건', 'Condition'), L('설정', 'Settings'), L('한 번 밀기', 'Single push'), L('재관측·재접근', 'Observe and reapproach')],
          rows: [
            [L('기본', 'Nominal'), L('질량 80 g · 마찰 0.50', 'Mass 80 g · friction 0.50'), '2/3', '3/3'],
            [L('낮은 마찰', 'Low friction'), L('질량 80 g · 마찰 0.12', 'Mass 80 g · friction 0.12'), '3/3', '3/3'],
            [L('질량·마찰 증가', 'Higher mass and friction'), L('질량 180 g · 마찰 0.70', 'Mass 180 g · friction 0.70'), '0/3', '3/3'],
            [L('외력', 'Applied force'), L('기본 조건 + x 방향 1.2 N · 0.10초', 'Nominal + 1.2 N along x for 0.10 s'), '0/3', '3/3']
          ]
        },
        bullets: [L('숫자는 저장된 원본 JSON과 요약에 대응합니다. 시뮬레이션 시간은 가상 환경의 경과 시간이며, CPU 계산 시간은 별도 기록합니다.', 'These values correspond to the saved JSON and summary. Simulation time is elapsed time in the simulated world; CPU execution time is recorded separately.')]
      },
      {
        id: 'failure-analysis', eyebrow: L('05 / 사례 분석', '05 / CASE ANALYSIS'),
        title: L('외력 이후, 무엇이 달라졌는가', 'What changed after the applied force'),
        body: [
          L('외력 조건 seed 0에서는 두 전략 모두 2.868초에 같은 힘이 적용됐습니다. 한 번 밀기는 최종 목표 거리 28.95 cm로 끝났습니다. 재관측 전략은 3.874초부터 네 번 경로를 다시 계획했고, 16.81초에 목표에서 1.43 cm 떨어진 위치로 안정적으로 도달했습니다.', 'For seed 0 in the force-disturbance condition, both strategies received the same force at 2.868 seconds. The single push ended 28.95 cm from the goal. The observation strategy replanned four times starting at 3.874 seconds and reached a stable position 1.43 cm from the goal at 16.81 seconds.'),
          L('이 성공에도 비표적 접촉은 있었습니다. 20개 물리 step에서 접촉이 기록됐고 다른 블록은 약 2.97 mm 움직였습니다. 현재 허용 범위에는 들어가지만, 다음 제어기가 줄여야 할 부작용으로 남겼습니다.', 'This successful run still touched the other block. Contact was recorded on 20 physics steps, and that block moved approximately 2.97 mm. It met the current tolerance, but remains an unwanted effect for the next controller to reduce.')
        ],
        table: {
          headers: [L('외력 · seed 0', 'Force disturbance · seed 0'), L('한 번 밀기', 'Single push'), L('재관측·재접근', 'Observe and reapproach')],
          rows: [
            [L('최종 목표 거리', 'Final goal distance'), '28.95 cm', '1.43 cm'],
            [L('재계획', 'Replans'), '0', '4'],
            [L('시뮬레이션 시간', 'Simulation time'), '7.05 s', '16.81 s'],
            [L('비표적 접촉 step', 'Steps with distractor contact'), '0', '20 / 0.04 s']
          ]
        },
        bullets: [L('기록은 도달 실패와 재계획 후 회복을 보여줍니다. 마찰·접촉·밀기 구간 각각의 기여도는 이 비교만으로 확정하지 않았습니다.', 'The records show a missed goal and recovery with replanning. This comparison does not isolate the contributions of friction, contact, or push segmentation.')]
      },
      {
        id: 'improvements', eyebrow: L('06 / 검증하며 고친 것', '06 / VALIDATION CHANGES'),
        title: L('성공 숫자를 믿을 수 있게 만들기', 'Make the result worth inspecting'),
        body: [L('제어기뿐 아니라 실험 자체도 확인했습니다. 초기 위치가 유지되는지, 잠깐 목표를 통과한 경우가 성공으로 잡히는지, 실행과 재생의 근거가 섞이지 않는지를 점검해 수정했습니다.', 'I checked the experiment as well as the controller: whether initial positions survived setup, whether briefly passing the goal could count as success, and whether replay artifacts were distinguishable from execution evidence.')],
        table: {
          headers: [L('점검한 문제', 'Issue checked'), L('반영한 변경', 'Implemented change')],
          rows: [
            [L('상수 재계산 중 초기 위치가 리셋될 수 있음', 'Recomputing model constants can reset initial positions'), L('mj_setConst 전 qpos를 저장하고 복원. 같은 seed의 일치와 다른 seed의 차이를 시험', 'Save and restore qpos around mj_setConst; test repeatability and variation across seeds')],
            [L('한 순간의 위치·속도만으로 성공 판정', 'Success based on one position and velocity sample'), L('목표 영역에서 선속도·각속도 기준을 0.3초 유지하고, 시간 초과는 실패 처리', 'Require 0.3 seconds within the goal and speed limits; reject timeouts')],
            [L('시뮬레이션 결과와 화면 재생의 역할 혼동', 'Confusing simulation evidence with display replay'), L('코드 hash·환경·궤적·이벤트를 JSON에 기록. 웹은 저장된 결과를 읽어 재생', 'Record code hashes, environment, trajectories, and events in JSON; the web viewer reads recorded results')],
            [L('성공만 보면 가려지는 비표적 접촉', 'Success can hide contact with the other block'), L('접촉 step·비표적 이동·개별 접촉점 최대 힘을 별도 기록', 'Record contact steps, distractor displacement, and peak force at an individual contact point')]
          ]
        }
      },
      {
        id: 'next-experiments', eyebrow: L('07 / 다음 실험 · 제안', '07 / NEXT EXPERIMENTS · PROPOSED'),
        title: L('평가를 고정하고, 관측과 AI를 확장하기', 'Fix the evaluation, then expand perception and AI'),
        body: [L('다음 순서는 비교의 공정성을 높인 뒤 카메라와 실제 LLM을 연결하는 것입니다. 아래 표는 아직 실행하지 않은 제안이며, 통과 기준도 후속 실험 전에 고정할 목표입니다.', 'The next priorities are a more controlled comparison, camera perception, and actual LLM execution. The table below proposes work not yet run, with acceptance targets to fix before those experiments.')],
        table: {
          headers: [L('우선순위', 'Priority'), L('실험', 'Experiment'), L('제안한 통과 기준', 'Proposed acceptance target')],
          rows: [
            ['01', L('밀기 구간·재접근·시간 예산을 맞춘 기준 전략, 개발에 쓰지 않은 seed 100개', 'A matched baseline with the same push segments, reapproaches, and time budget; 100 unseen seeds'), L('같은 조건에서 성공률·시간·비표적 접촉을 함께 공개하고, 관측의 추가 효과를 분리', 'Report success, time, and distractor contact together; isolate the added effect of updated observations')],
            ['02', L('렌더 RGB에서 블록 위치 추정, 가림·조명 조건 추가', 'Estimate block positions from rendered RGB; add occlusion and lighting conditions'), L('분리한 평가셋에서 위치 오차 p95 ≤2 cm, 좌표 정답 대비 성공률 하락 ≤10%p', 'On held-out data: position-error p95 ≤2 cm and success drop ≤10 percentage points versus oracle coordinates')],
            ['03', L('실제 로컬 LLM으로 정상·모호·거부 지시 평가', 'Run a local LLM on valid, ambiguous, and unsupported instructions'), L('고정한 지시 100개에서 작업 명세 정확도 ≥95%, 거부 세트의 잘못된 실행 0건', 'On 100 fixed instructions: task-specification accuracy ≥95% and zero executions on the refusal set')],
            ['04', L('전문가 궤적으로 모방학습, 독립 조건에서 기준 제어기와 비교', 'Train an imitation policy from expert trajectories and compare on independent conditions'), L('같은 24초 예산에서 기준 성공률을 유지하며 실행 시간 또는 비표적 접촉을 줄이기', 'Match baseline success within the same 24-second budget while reducing execution time or distractor contact')]
          ]
        }
      }
    ],
    decisions: [
      { title: L('작업 계약을 고정', 'Fix the task contract'), body: L('허용 동작·물체·목표를 명세로 검증하고 좌표와 모터 명령은 제어기가 결정하게 했습니다. 지시 해석 실패와 물리 실행 실패를 나누어 볼 수 있습니다.', 'Validate the action, object, and named goal as a task specification; the controller owns coordinates and motor commands. This keeps instruction errors distinct from physical execution failures.') },
      { title: L('도달과 안정 상태를 함께 평가', 'Evaluate arrival and stability'), body: L('목표 근처를 지나가는 장면만으로는 충분하지 않아 속도와 유지 시간을 성공 조건에 넣었습니다. 비표적 이동과 시간 초과도 같은 판정에 포함했습니다.', 'A frame near the goal is insufficient, so speed and dwell time are part of success. The same check includes distractor movement and timeouts.') },
      { title: L('결과를 다시 살펴볼 수 있게', 'Keep the result inspectable'), body: L('성공 횟수 옆에 시간·접촉·실패 기록과 궤적을 두었습니다. 저장된 기록을 웹에서 비교하고 JSON으로 내려받을 수 있게 했습니다.', 'Pair success counts with time, contact, failure events, and trajectories. Recorded runs can be inspected in the browser and downloaded as JSON.') }
    ],
    limitations: [
      L('24회는 제어기 개발에 사용한 소규모 실험입니다. 12/12는 이 조건의 관측값이며 새로운 환경의 성공률은 미측정입니다.', 'The 24 runs belong to a small development set. The 12/12 result applies to these conditions; success in new environments is unmeasured.'),
      L('공개 측정은 규칙 파서·비학습 제어기·시뮬레이터 좌표를 사용합니다. LLM·VLM·VLA·강화학습 모델의 성능은 아직 측정하지 않았습니다.', 'Published measurements use a rule parser, a hand-coded controller, and simulator coordinates. LLM, VLM, VLA, and reinforcement-learning model performance has not been measured.'),
      L('3축 직교 로봇의 탁상 밀기 과제입니다. 6축 로봇팔, 집기, 실제 로봇 이전은 후속 범위입니다.', 'This is a tabletop pushing task with a three-axis Cartesian robot. Six-axis arms, grasping, and transfer to physical hardware remain future work.'),
      L('개인 프로젝트로 자동화 도구의 도움을 받아 구현·실행했습니다. 공개 웹은 저장된 궤적을 재생하며, 실행 코드와 원본 기록을 함께 제공합니다.', 'This personal project was implemented and run with automation assistance. The public website replays saved trajectories, alongside executable code and original records.')
    ]
  };
  return {
    project,
    archive: {
      id: project.id, title: project.title, summary, category: 'ai',
      status: project.status, period: project.period,
      image: image.src, imageAlt: image.alt, imageWidth: image.width, imageHeight: image.height,
      live: true, caseId: project.id, caseLabel: L('사례 보기', 'View case'), stack: project.stack, links,
      limitations: L('실제 물리 실행 24회 · 규칙 기반 제어 · 공개 웹은 저장된 실행 재생', '24 actual physics runs · rule-based control · public web replay of recorded runs')
    }
  };
});
