/* Banjjak Note (반짝 노트) case — a classroom AI notebook for elementary science.
   The public site runs in demo mode. Model evidence here was gathered by sending
   this app's prompt rules to the same models directly, not through the deployed app. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HYUNAE_BANJJAK = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const L = (ko, en) => ({ ko, en });
  const LIVE_URL = 'https://banjjak-note.vercel.app/';
  const links = [
    { label: L('라이브 · 체험 모드', 'Live · demo mode'), url: LIVE_URL, kind: 'demo' }
  ];
  const summary = L(
    '초등 과학 수업에서 학생이 AI에게 받은 설명·그림·만화·영상을 자기 보드에 모으고, 자료가 맞는지 확인한 근거와 자기 말로 쓴 설명을 남기는 수업용 웹앱입니다. 학번과 이름만으로 들어오고, 교사는 학생·노트·하루 비용을 한 화면에서 관리합니다.',
    'A classroom web app for elementary science. Students ask an AI for explanations, images, comics and short videos, collect them on a personal board, record how they checked each item, and write their own explanation. They sign in with a student number and name; the teacher manages students, notebooks and daily spend from one screen.'
  );
  const status = L('LIVE / 체험 모드 · 수업용 AI 노트', 'LIVE / DEMO MODE · CLASSROOM AI NOTEBOOK');
  const image = {
    src: 'assets/banjjak-note.jpg', width: 1600, height: 1000,
    alt: L(
      'AI 화면: 왼쪽 대화창의 만들기 종류·도움말 단어·질문 틀, 오른쪽에 크게 뜬 ‘목성과 지구’ 그림과 미확인 도장, 보드에 넣기 버튼',
      'AI screen: formats, helper words and question frames in the chat on the left; on the right, an enlarged “Jupiter and Earth” image stamped unverified, with a Place on board button'
    )
  };
  const board = {
    src: 'assets/banjjak-board.jpg', width: 1600, height: 1000,
    alt: L(
      '보드 화면: 학습 문제, 내 질문, 확인한 그림 카드, 미확인 설명·영상 카드, 확인 근거와 내 설명 메모',
      'Board with the learning question, the student’s question, a verified image card, unverified explanation and video cards, and evidence and explanation notes'
    )
  };
  const project = {
    id: 'banjjak-note', number: '11', title: 'Banjjak Note · 반짝 노트',
    featured: false, nextCase: 'terracotta', summary, status,
    role: L(
      '요구사항 정의 · 수업 계획서 반영 · Claude Code로 구현·검증 · 배포',
      'Requirements · lesson-plan mapping · build and verification with Claude Code · deployment'
    ),
    period: '2026.09',
    stack: ['FastAPI', 'Claude Sonnet', 'GPT Image 2', 'Kling 3.0', 'Neon Postgres', 'Vercel', 'Claude Code'],
    image,
    imageCaption: L(
      '실제 화면 · 체험 모드. 그림은 이 앱의 프롬프트 규칙으로 GPT Image 2에서 미리 만든 견본이며, 공개 사이트는 같은 견본으로 응답합니다.',
      'Actual screen in demo mode. The image is a sample pre-generated with GPT Image 2 using this app’s prompt rules; the public site answers with the same samples.'
    ),
    metrics: [
      { value: '28 / 28', label: L('그림 속 한글 문구 정확', 'Korean text elements rendered correctly'), note: L('GPT Image 2 medium · 검증 이미지 5장', 'GPT Image 2 medium · 5 verification images') },
      { value: '0 / 2', label: L('지구 자전 방향이 맞은 영상', 'Videos with the correct rotation direction'), note: L('Kling 3.0 · 프롬프트 2종 · ‘미확인’ 설계의 근거', 'Kling 3.0 · two prompts · why cards start unverified') },
      { value: '≈ ₩885', label: L('학생 1명 · 수업 1시간 예상 비용', 'Estimated cost per student per class hour'), note: L('설명 5 + 그림 3 + 영상 1 · 글 비용은 추정', '5 explanations + 3 images + 1 video · text cost estimated') }
    ],
    links,
    sections: [
      {
        id: 'context', eyebrow: '01 / PRODUCT',
        title: L('수업에서 필요한 것', 'What the classroom needed'),
        body: [
          L('4·5·6학년 과학 ‘태양계’ 단원을 위한 도구입니다. 수업 계획서의 흐름은 질문 만들기, 개인 AI로 자료 받기, AI 자료의 오류를 고치고 확인 근거 적기, 내 질문·자료·확인 근거·내 설명을 보드에 남기기, 내 설명을 가리고 정리 답 쓰기입니다. 이 흐름을 그대로 화면의 기능으로 옮겼습니다.', 'Built for the grade 4–6 science unit on the solar system. The lesson plan asks students to form a question, get material from a personal AI, correct errors in that material and record evidence, keep their question, material, evidence and explanation on a board, then cover the explanation and answer a wrap-up question. The app turns that sequence into screen features.'),
          L('요구사항은 열 개 항목이었습니다. 가입 없이 학번과 이름으로 들어오기, 교사의 삭제와 복원, 노트 모음, 무한 캔버스 보드, 왼쪽 대화·오른쪽 보드로 나뉜 AI 화면과 아이가 눌러 고르는 도움말 단어, 결과가 보드로 들어가는 움직임, 보드를 메일·이미지로 가져가기, 글·그림·영상 세 모델, 아이가 쓰고 싶어 하는 화면, 그리고 화면에 필요한 그림을 생성 모델로 만드는 것입니다.', 'The brief had ten items: sign-in with a student number and name and no signup; teacher-side delete and restore; a notebook shelf; an infinite-canvas board; an AI screen split into chat and board, with tappable helper words; a visible move of each result onto the board; taking the board home by email or image; three models for text, images and video; a screen children want to use; and making the artwork the UI needs with image models.')
        ],
        diagram: [
          { label: L('들어오기', 'Sign in'), detail: L('학번 + 이름 · 가입 없음', 'Student number + name · no signup') },
          { label: L('노트 고르기', 'Pick a notebook'), detail: L('수업을 고르면 학습 문제가 붙은 보드', 'A lesson adds its learning question to the board') },
          { label: L('AI에게 묻기', 'Ask the AI'), detail: L('형식 · 도움말 단어 · 질문 틀', 'Format · helper words · question frames') },
          { label: L('보드에 남기기', 'Keep on the board'), detail: L('미확인 → 확인 근거 → 내 설명', 'Unverified → evidence → own explanation') }
        ],
        figures: [
          {
            src: 'assets/banjjak-notes.jpg', width: 1600, height: 1090,
            alt: L('노트 모음 화면: 표지가 있는 노트 여섯 권과 새 노트 만들기', 'Notebook shelf with six covered notebooks and a new-notebook tile'),
            caption: L('노트 모음 · 표지 8종과 부엉이 선생님은 GPT Image 2로 제작', 'Notebook shelf · the eight covers and the owl teacher were made with GPT Image 2')
          },
          {
            src: 'assets/banjjak-ask.jpg', width: 1600, height: 1000,
            alt: L('AI 화면: 질문 틀과 낱말 칩으로 ‘목성과 지구의 모습은 어떻게 달라요?’를 만든 모습', 'AI screen with the question “How do Jupiter and Earth look different?” built from a frame and word chips'),
            caption: L('질문 틀에 낱말 칩을 넣으면 ‘목성과 지구’처럼 조사까지 맞춰 채웁니다', 'Dropping word chips into a frame also fixes the Korean particle (“목성과 지구”)')
          }
        ]
      },
      {
        id: 'lesson', eyebrow: '02 / LESSON DESIGN',
        title: L('수업 계획서를 기능으로 옮기기', 'Turning the lesson plan into features'),
        body: [
          L('수업 계획서의 단계마다 화면 장치와 서버 규칙을 하나씩 두었습니다. 학습 문제, 질문 틀, 낱말 칩, 주의할 점, 정리 문제는 학년마다 다르며 4·5·6학년 세 가지를 넣었습니다.', 'Each step of the lesson plan has a matching screen control and a server rule. The learning question, question frames, word chips, cautions and wrap-up question differ by grade; presets for grades 4, 5 and 6 are included.')
        ],
        table: {
          headers: [L('수업 단계', 'Lesson step'), L('화면 장치', 'On screen'), L('서버 규칙', 'Server rule')],
          rows: [
            [L('질문 틀로 내 질문 만들기', 'Build a question from a frame'), L('학년별 질문 틀 5개와 낱말 칩 · 조사 자동 맞춤', 'Five frames per grade with word chips · automatic particle fix'), L('학년별 사실 자료를 Claude 시스템 프롬프트에 추가', 'Grade fact sheet appended to the Claude system prompt')],
            [L('형식 고르기', 'Choose a format'), L('설명·그림·만화·영상 4종과 도움말 단어(최대 4개)', 'Explanation, image, comic or video, plus up to four helper words'), L('학생별 하루 한도와 하루 전체 예산 확인', 'Per-student daily limits and a class-wide daily budget')],
            [L('오류를 고치고 확인 근거 적기', 'Correct errors and record evidence'), L('AI 카드는 ‘미확인’ 도장 · 근거를 적으면 ‘확인함’', 'AI cards arrive stamped “unverified” and switch to “verified” once evidence is written'), L('근거가 비어 있으면 확인 상태를 저장하지 않음', 'A verified flag without evidence text is rejected')],
            [L('내 질문·자료·확인 근거·내 설명 남기기', 'Keep question, material, evidence and explanation'), L('보드 위 네 칸 체크', 'A four-dot checklist on the board'), L('같은 규칙을 서버와 브라우저가 각각 계산', 'The same rule is computed on both server and client')],
            [L('내 설명을 가리고 정리 답 쓰기', 'Cover the explanation and answer the wrap-up'), L('‘정리 문제’가 내 설명을 가리고 답 메모를 엶', 'The wrap-up button covers the explanation and opens an answer note'), L('가림은 내 설명·정리 답 메모에만 허용', 'The cover flag is accepted only on those two note types')]
          ]
        },
        figureLayout: 'stack',
        figures: [
          {
            src: board.src, width: board.width, height: board.height, alt: board.alt,
            caption: L('보드 · 가상 학생의 견본 데이터. 위쪽 점 네 개가 수업에서 남겨야 하는 네 가지를 표시합니다', 'Board · sample data for a fictional student. The four dots track the lesson’s four required items')
          },
          {
            src: 'assets/banjjak-verify.jpg', width: 1600, height: 1000,
            alt: L('확대한 그림 카드: 확인함 도장, 내 질문, 확인 근거, 고친 곳', 'Zoomed image card showing the verified stamp, the question, the evidence and the correction'),
            caption: L('카드를 누르면 가운데로 확대되고 확인 근거와 고친 곳이 함께 보입니다', 'Tapping a card zooms it to the centre with its evidence and correction')
          }
        ]
      },
      {
        id: 'generation', eyebrow: '03 / SYSTEM',
        title: L('서버리스에서 끊기지 않는 생성', 'Generation that survives serverless'),
        body: [
          L('영상 한 편을 만드는 데 2–3분이 걸리지만 서버리스 함수는 응답을 보내면 멈춥니다. 별도 워커 없이, 브라우저가 몇 초마다 상태를 물을 때마다 서버가 한 걸음씩 나아가는 상태 기계로 만들었습니다. 생각 중 → 대기 → 만드는 중 → 옮기는 중 → 완료 순서입니다.', 'A video takes two to three minutes, but a serverless function stops once it responds. Instead of a separate worker, generation is a state machine that advances one step each time the browser polls: thinking → waiting → making → saving → done.'),
          L('Claude가 쓴 프롬프트를 먼저 기록하고 외부 작업 ID는 받는 즉시 저장합니다. 함수가 다시 시작되거나 화면을 닫았다 열어도 같은 작업을 이어 받습니다. 결과를 저장소로 옮기다 실패하면 생성은 다시 하지 않고 옮기기만 다시 시도합니다.', 'The prompt written by Claude is stored first, and the external job ID is saved as soon as it is returned. If the function restarts, or the page is closed and reopened, the same job is picked up again. If moving the result into storage fails, only the transfer is retried, not the generation.'),
          L('같은 작업을 두 곳에서 동시에 진행하지 않도록 DB에 90초 잠금을 두었습니다. 힉스필드에는 동시에 3건까지만 걸고 나머지는 ‘앞에 n명’으로 기다립니다. 학생 한 명은 한 번에 하나만 만들 수 있습니다.', 'A 90-second database lock keeps two requests from advancing the same job. At most three jobs are submitted to Higgsfield at once; the rest wait with an “n ahead of you” message. Each student can run one generation at a time.'),
          L('저장소는 두 가지입니다. 내 컴퓨터에서는 SQLite와 파일, Vercel에서는 Neon Postgres와 Vercel Blob을 같은 코드로 씁니다. AI 화면과 보드 화면이 같은 보드를 고칠 수 있어, 저장은 판 번호가 같을 때만 덮어쓰고 다르면 최신 보드를 돌려줍니다.', 'Storage has two modes behind the same code: SQLite and files on a local machine, Neon Postgres and Vercel Blob on Vercel. Because the AI screen and the board screen can edit the same board, a save overwrites only when the revision number matches; otherwise the latest board is returned.')
        ],
        diagram: [
          { label: L('요청', 'Request'), detail: L('하루 한도·예산 확인 후 기록', 'Check limits and budget, then record') },
          { label: L('계획', 'Plan'), detail: L('Claude가 장면 계획을 JSON으로 작성', 'Claude writes a scene plan as JSON') },
          { label: L('생성·보관', 'Generate and store'), detail: L('GPT Image 2 · Kling 3.0 → 저장소', 'GPT Image 2 · Kling 3.0 → storage') },
          { label: L('미리보기', 'Preview'), detail: L('보드에 넣기 · 다시 만들기', 'Place on the board or regenerate') }
        ]
      },
      {
        id: 'models', eyebrow: '04 / MODELS',
        title: L('모델과 프롬프트 규칙', 'Models and prompt rules'),
        body: [
          L('글은 Claude Sonnet이 초등학교 선생님 말투로 씁니다. 해요체, 한 문장에 한 가지 내용, 어려운 낱말은 괄호로 풀이, 3–5문장, 끝에는 스스로 해 볼 질문이 규칙입니다. 답은 JSON 스키마로 받아 제목·본문·이어서 물을 말 세 개로 나눕니다.', 'Text comes from Claude Sonnet in an elementary teacher’s voice: polite informal Korean, one idea per sentence, hard words explained in parentheses, three to five sentences, and a closing question to try. Replies follow a JSON schema that separates title, body and three follow-up suggestions.'),
          L('그림·만화·영상은 Claude가 먼저 장면 계획을 쓰고, 서버가 고정된 형식의 프롬프트로 조립합니다. 그림 속 한글을 위해 장면은 영어로 쓰고, 한글은 큰따옴표 안에 위치와 함께 적으며, 제목 하나와 이름표 8개까지만 넣고, 끝에 같은 규칙 문장을 붙입니다. 글자가 필요 없는 그림에는 글자 금지 문장을 붙입니다.', 'For images, comics and videos, Claude writes a scene plan and the server assembles a fixed-format prompt. To get Korean text right, the scene is described in English, Korean words appear only inside double quotes with their position, text is limited to one title and eight short labels, and the same rule sentence closes every prompt. Images that need no text get a no-text sentence instead.'),
          L('이 규칙으로 GPT Image 2의 medium 품질에서 만든 검증 이미지 5장의 한글 문구 28개가 모두 정확했습니다. 그래서 기본 품질을 high(3.5크레딧) 대신 medium(1크레딧)으로 정했습니다.', 'With these rules, all 28 Korean text elements in five verification images were correct at GPT Image 2’s medium quality. The default quality is therefore medium (1 credit) rather than high (3.5 credits).'),
          L('내용의 정확성은 달랐습니다. 목성과 지구 그림은 지름 비율이 약 3배로 그려졌고(실제 약 11배), 지구 자전 영상은 프롬프트를 바꿔 만든 2개 모두 방향이 반대였습니다. 모델을 바꾸는 대신 AI 카드를 ‘미확인’으로 들이고 아이가 확인 근거와 고친 곳을 적게 했습니다.', 'Factual accuracy was another matter. The Jupiter–Earth image drew the diameter ratio at about 3× (the real ratio is about 11×), and both Earth-rotation videos, made with two different prompts, spun the wrong way. Rather than swap models, AI cards enter the board as “unverified” and the student records evidence and corrections.')
        ],
        table: {
          headers: [L('확인한 것', 'Check'), L('결과', 'Result'), L('조건', 'Conditions')],
          rows: [
            [L('그림 속 한글 문구', 'Korean text in images'), L('28 / 28 정확', '28 / 28 correct'), L('GPT Image 2 medium · 5장 · 제목·이름표·말풍선', 'GPT Image 2 medium · 5 images · titles, labels, speech bubbles')],
            [L('글자 없는 그림', 'No-text image'), L('글자 없음', 'No text appeared'), L('글자 금지 문장 · 1장', 'No-text rule · 1 image')],
            [L('영상 생성 시간', 'Video generation time'), L('약 2–3분', 'About 2–3 minutes'), L('Kling 3.0 · 5초 · 소리 포함', 'Kling 3.0 · 5 seconds · with sound')],
            [L('지구 자전 방향', 'Earth’s rotation direction'), L('0 / 2 정확', '0 / 2 correct'), L('프롬프트 2종 · 체험용 견본은 역재생으로 바로잡음', 'Two prompts · the demo sample was corrected by reversing playback')],
            [L('목성·지구 크기 비율', 'Jupiter–Earth size ratio'), L('약 3배로 그려짐', 'Drawn at about 3×'), L('실제 지름 비율은 약 11배', 'The real diameter ratio is about 11×')]
          ]
        }
      },
      {
        id: 'cost', eyebrow: '05 / COST',
        title: L('한 번 만들 때마다 얼마인지', 'What each generation costs'),
        body: [
          L('교사가 예산을 가늠할 수 있게 크레딧과 토큰을 원화로 바꿔 한 번당 가격으로 보여 줍니다. 기준은 1달러 1,360원, 힉스필드 1크레딧 0.048달러입니다.', 'So a teacher can plan a budget, credits and tokens are converted to Korean won and shown as a price per use. The basis is ₩1,360 per US dollar and US$0.048 per Higgsfield credit.'),
          L('학생별 하루 한도(설명 40 · 그림 10 · 만화 5 · 영상 2)와 하루 전체 예산(기본 30,000원)을 요청을 받기 전에 확인합니다. 넘으면 그날은 만들기가 멈추고, 교사는 영상 만들기만 따로 끌 수 있습니다.', 'Per-student daily limits (40 explanations, 10 images, 5 comics, 2 videos) and a class-wide daily budget (₩30,000 by default) are checked before a request is accepted. Past either one, generation stops for the day; the teacher can also switch off video alone.')
        ],
        table: {
          headers: [L('만드는 것', 'Item'), L('한 번', 'Per use'), L('근거', 'Basis')],
          rows: [
            [L('설명', 'Explanation'), L('약 13원', '≈ ₩13'), L('Claude Sonnet · 토큰 수 추정, 실제 호출로 재지 않음', 'Claude Sonnet · estimated tokens, not measured on live calls')],
            [L('그림', 'Image'), L('약 79원', '≈ ₩79'), L('GPT Image 2 medium 1크레딧 + 계획용 Claude 호출', 'GPT Image 2 medium, 1 credit + the Claude planning call')],
            [L('네 컷 만화', 'Four-panel comic'), L('약 79원', '≈ ₩79'), L('GPT Image 2 medium 1크레딧 + 계획용 Claude 호출', 'GPT Image 2 medium, 1 credit + the Claude planning call')],
            [L('영상 5초', '5-second video'), L('약 583원', '≈ ₩583'), L('Kling 3.0 8.75크레딧 + 계획용 Claude 호출', 'Kling 3.0, 8.75 credits + the Claude planning call')],
            [L('학생 1명 · 수업 1시간', 'One student · one class hour'), L('약 885원', '≈ ₩885'), L('설명 5 + 그림 3 + 영상 1', '5 explanations + 3 images + 1 video')],
            [L('한 반 25명', 'A class of 25'), L('약 22,000원', '≈ ₩22,000'), L('같은 사용량 가정', 'Same usage assumed')]
          ]
        }
      },
      {
        id: 'safety', eyebrow: '06 / CLASSROOM SAFETY',
        title: L('아이들이 쓰는 화면이라서', 'Because children use it'),
        body: [
          L('학급에서 쓸 도구라 무엇을 저장하고 어디까지 되돌릴 수 있는지를 먼저 정했습니다.', 'Since this is meant for a classroom, what is stored and what can be undone were decided first.')
        ],
        bullets: [
          L('학번과 이름만 받습니다. 비밀번호나 생년월일을 묻지 않고, 보드를 메일로 보낼 때 입력한 주소는 일부를 가린 기록만 남깁니다. 처음 보는 학번의 자동 등록은 교사가 끌 수 있습니다.', 'Only a student number and name are collected. No password or birth date is asked for, and an address entered to email a board is logged only in masked form. The teacher can turn off auto-registration of new numbers.'),
          L('삭제는 휴지통으로 갑니다. 교사가 학생과 노트를 복원하거나 완전히 지울 수 있고, 완전 삭제는 저장된 그림·영상도 함께 지웁니다.', 'Deletion goes to a trash first. The teacher can restore or permanently remove students and notebooks; permanent removal also deletes stored images and videos.'),
          L('브라우저가 보낸 보드를 그대로 믿지 않습니다. 허용한 종류와 필드만 남기고 그림 주소는 이 서버가 저장한 파일만 받습니다. 화면에는 글자를 textContent로만 넣고, 스크립트는 같은 출처의 파일만 실행합니다.', 'Board data from the browser is not trusted as-is: only allowed object types and fields are kept, and image URLs must point to files this server stored. Text is inserted with textContent, and the content security policy allows scripts from the same origin only.'),
          L('힉스필드는 교사 계정 하나를 OAuth로 연결하고 토큰은 암호화해 DB에 둡니다. 학생 브라우저에는 키나 토큰이 가지 않습니다.', 'Higgsfield is connected once through the teacher’s account with OAuth, and tokens are stored encrypted in the database. No key or token reaches a student’s browser.'),
          L('Claude가 거절한 요청은 별도 상태로 처리해 안내 문구만 보여 주고 보드에 넣을 카드를 만들지 않습니다.', 'A request Claude refuses is handled as a separate state: the student sees a short notice and no card is produced.')
        ]
      },
      {
        id: 'verification', eyebrow: '07 / EVIDENCE',
        title: L('확인한 범위', 'What was verified'),
        body: [
          L('로그인부터 내보내기까지 29개 항목의 API 검사를 로컬 SQLite, 로컬 Postgres+Blob, 운영 배포 세 환경에서 통과했습니다. 다른 사이트에서 온 요청 거절, 옛 판으로 저장할 때의 409, 밖의 주소 그림 제거, 만드는 중의 새 요청 거절, 경로 탈출 차단, 내보낸 HTML의 스크립트 주입 검사가 들어 있습니다.', 'A 29-item API check covering sign-in through export passes in three environments: local SQLite, local Postgres + Blob, and the production deployment. It includes rejecting cross-site requests, a 409 on saving a stale revision, dropping images from outside URLs, refusing a new request during generation, blocking path traversal, and checking the exported HTML for script injection.'),
          L('화면은 헤드리스 Chrome으로 로그인, 노트 모음, 카드 확대·축소, AI 흐름, 확인 근거 입력, 정리 문제, PNG·HTML 내보내기, 메일 발송(로컬 수신기)을 확인했고 태블릿·휴대폰 폭도 점검했습니다. 내보낸 HTML은 파일로 열어 서버 없이 동작하는지 확인했습니다.', 'Screens were driven in headless Chrome: sign-in, the shelf, card zoom in and out, the AI flow, entering evidence, the wrap-up step, PNG and HTML export, and email delivery to a local SMTP sink, plus tablet and phone widths. The exported HTML was opened from a file to confirm it works without a server.'),
          L('보드 이미지는 DOM을 캡처하지 않고 캔버스에 직접 그립니다. 한글 웹폰트가 부분 집합으로 내려와 DOM 캡처에서는 글자가 빠졌기 때문입니다.', 'The board image is drawn directly on a canvas rather than captured from the DOM, because Korean web fonts arrive as subsets and DOM capture dropped glyphs.')
        ]
      }
    ],
    decisions: [
      { title: L('AI 자료는 ‘미확인’으로 들어온다', 'AI material starts unverified'), body: L('이미지 모델은 한글은 정확히 썼지만 크기 비율을 틀렸고, 영상 모델은 자전 방향을 틀렸습니다. 수업 계획서의 ‘오류를 고치고 확인 근거 적기’를 제품의 기본 상태로 삼아, 근거 없이는 서버가 확인 상태를 받지 않게 했습니다.', 'The image model wrote Korean correctly but got size ratios wrong, and the video model got the rotation direction wrong. The lesson plan’s “correct errors and record evidence” step became the product’s default state: the server rejects a verified flag that has no evidence.') },
      { title: L('작업 큐 대신 폴링으로 나아가는 상태 기계', 'A poll-driven state machine instead of a job queue'), body: L('한 학급 규모에서는 워커와 큐를 따로 운영할 이유가 작았습니다. 브라우저의 상태 확인을 진행 신호로 쓰고, 프롬프트와 작업 ID를 DB에 남겨 재시작 뒤에도 이어지게 했습니다. 화면을 닫은 동안에는 진행하지 않고 다시 열면 이어 갑니다. 제출 직후 ID를 저장하기 전에 중단되는 경우는 막지 못합니다.', 'At classroom scale there was little reason to run a separate worker and queue. The browser’s status check doubles as the progress signal, and the prompt and job ID are kept in the database so work resumes after a restart. Nothing advances while the page is closed; it continues when reopened. An interruption between submission and saving the job ID is not covered.') },
      { title: L('비용은 원화와 횟수로', 'Cost in won, per use'), body: L('교사에게 필요한 숫자는 크레딧이 아니라 한 반이 한 시간에 쓰는 금액입니다. 단가를 원화로 환산해 관리자 화면과 학생의 남은 횟수에 연결하고, 하루 예산을 넘는 요청은 서버가 거절합니다. medium 품질에서도 한글이 정확했던 결과를 근거로 그림 단가를 3.5크레딧에서 1크레딧으로 낮췄습니다.', 'A teacher needs the cost of one class hour, not a credit count. Unit prices are converted to won and tied to the admin screen and each student’s remaining count, and the server rejects requests beyond the daily budget. Because Korean text was accurate at medium quality, the image unit cost went from 3.5 credits to 1.') },
      { title: L('로컬과 서버리스를 같은 코드로', 'One codebase for local and serverless'), body: L('교사 PC에서 바로 띄우는 실행과 Vercel 배포를 같은 코드로 지원합니다. SQL 문장은 같게 두고 자리표시자만 바꾸며, 트랜잭션 대신 판 번호 비교로 동시 수정을 처리해 SQLite와 Postgres에서 같은 동작을 얻었습니다.', 'The same code runs directly on a teacher’s PC and as a Vercel deployment. The SQL is identical apart from placeholders, and concurrent edits are handled by comparing revision numbers rather than transactions, giving the same behaviour on SQLite and Postgres.') }
    ],
    limitations: [
      L('공개 사이트는 체험 모드입니다. Claude 키와 힉스필드 계정을 연결하지 않아 미리 만든 견본으로 응답합니다.', 'The public site runs in demo mode. No Claude key or Higgsfield account is connected, so it answers with pre-generated samples.'),
      L('실제 Claude 호출은 검증하지 못했습니다. 요청 형식은 모의 전송으로만 확인했고, 설명 1회 13원은 토큰 수를 가정한 추정입니다.', 'Live Claude calls have not been verified. The request format was checked only against a mock transport, and the ₩13 per explanation is an estimate from assumed token counts.'),
      L('앱의 OAuth 경로로 생성한 결과는 아직 없습니다. 모델 확인은 같은 프롬프트 규칙을 힉스필드에 직접 넣어 수행했습니다.', 'Nothing has yet been generated through the app’s own OAuth path. Model checks were run by sending the same prompt rules to Higgsfield directly.'),
      L('표본이 작습니다. 한글 확인은 5장, 자전 방향은 영상 2개이며 다른 주제나 긴 문구의 정확도는 측정하지 않았습니다.', 'The samples are small: five images for Korean text and two videos for rotation. Accuracy on other topics or longer text was not measured.'),
      L('실제 수업에서 쓴 기록이 없습니다. 25명 동시 사용, 아이들의 실제 질문에서 나오는 거절·오답 빈도는 측정하지 않았습니다.', 'It has not been used in a real class. Load from 25 simultaneous students and the rate of refusals or wrong answers on real children’s questions are unmeasured.'),
      L('학번과 이름만 확인하므로 둘을 아는 사람은 들어올 수 있습니다. 교사가 지켜보는 수업용이며 성적이나 개인 기록을 담는 용도가 아닙니다.', 'Sign-in checks only a student number and name, so anyone who knows both can enter. It is meant for supervised class use, not for grades or personal records.'),
      L('Claude Code(AI 코딩 에이전트)로 구현했습니다. 요구사항 열 가지, 모델 선택, 비용 표시 기준을 정하고 수업 계획서를 제공했으며, 코드와 검증 스크립트는 에이전트가 작성했습니다. 소스는 공개하지 않았습니다.', 'Built with Claude Code, an AI coding agent. I set the ten requirements, the model choices and the cost-display criteria and supplied the lesson plan; the agent wrote the code and verification scripts. The source is not public.')
    ]
  };
  const cardSummary = L(
    '초등 과학 수업용 AI 노트 보드. AI가 만든 설명·그림·영상을 보드에 모으고, 확인한 근거와 내 설명까지 남깁니다. 교사는 학생·노트·하루 비용을 관리합니다.',
    'A classroom AI notebook for elementary science. Students collect AI-made explanations, images and videos on a board, then record evidence and their own explanation. The teacher controls daily spend.'
  );
  const archive = {
    id: project.id, title: project.title, summary: cardSummary, category: 'ai', status,
    period: project.period, image: board.src, imageAlt: board.alt,
    imageWidth: board.width, imageHeight: board.height,
    live: true, caseId: project.id, stack: project.stack, links,
    keywords: ['반짝 노트', '초등', '교육', '수업', '에듀테크', '태양계', '무한 캔버스', 'education', 'edtech', 'classroom', 'infinite canvas', 'Higgsfield', 'serverless'],
    limitations: L('공개 사이트는 체험 모드 · 실제 Claude 호출과 교실 사용은 미검증', 'Public site runs in demo mode · live Claude calls and classroom use are unverified')
  };
  return { project, archive, liveUrl: LIVE_URL };
});
