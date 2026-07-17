const STORAGE_KEY = "blanket-heart-friend-v2";
const NATIVE_SESSION_KEY = "blanket-heart-native-session-v1";
const runtimeConfig = window.__MAUM_RUNTIME__ || { apiBaseUrl: "", buildTarget: "web" };
const isNativeApp = ["android", "ios"].includes(runtimeConfig.buildTarget) || Boolean(window.Capacitor?.isNativePlatform?.());
document.documentElement.dataset.buildTarget = runtimeConfig.buildTarget || "web";
document.documentElement.classList.toggle("native-app", isNativeApp);
const apiBaseUrl = String(runtimeConfig.apiBaseUrl || "").replace(/\/$/, "");
let nativeSessionToken = isNativeApp ? localStorage.getItem(NATIVE_SESSION_KEY) || "" : "";
let deferredInstallPrompt = null;
let oauthCallbackPending = false;
let lastOAuthCallbackKey = "";

function apiUrl(path) {
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (isNativeApp && nativeSessionToken) headers.set("Authorization", `Bearer ${nativeSessionToken}`);
  const response = await fetch(apiUrl(path), { ...options, headers, credentials: "include" });
  if (isNativeApp) {
    const refreshedToken = response.headers.get("X-Maum-Session");
    if (refreshedToken) {
      nativeSessionToken = refreshedToken;
      localStorage.setItem(NATIVE_SESSION_KEY, refreshedToken);
    }
  }
  return response;
}

function nativeHaptic(style = "LIGHT") {
  window.Capacitor?.Plugins?.Haptics?.impact({ style })?.catch(() => {});
}

const moodData = {
  lonely: {
    label: "혼자 덩그러니 느껴져요",
    shortLabel: "외로움",
    caption: "연결이 필요한 마음이에요. 아주 작은 안부부터 건네요.",
    color: "#bbb7d1",
    face: "·",
    messages: [
      "혼자인 느낌이 커져도 네가 사라진 건 아니에요. 여기에는 네 이야기가 머물 자리가 있어요.",
      "긴 설명을 하지 않아도 괜찮아요. 지금 마음 곁에 조용히 같이 앉아 있을게요.",
      "누군가의 온기가 필요한 밤이네요. 먼저 내 편이 되어주는 말 한 줄을 같이 찾아봐요.",
    ],
    steps: [
      "한 사람에게 '오늘 어땠어?'라고 안부 보내기",
      "불을 하나 켜고 사람 목소리 가까이에 머물기",
      "따뜻한 컵을 두 손으로 감싸기",
    ],
    storyTitle: "혼자 덩그러니 느껴질 때",
    storyText: "불을 하나 켜고, 떠오르는 사람에게 안부 한 줄만 보내봐요. 답이 늦어도 연결을 시도한 마음은 남아요.",
    music: [
      { title: "창가의 작은 불빛", detail: "비와 낮은 피아노", type: "rain", notes: [220, 277.18, 329.63] },
      { title: "달 아래 구름", detail: "느린 밤의 패드", type: "moon", notes: [196, 246.94, 293.66] },
      { title: "누군가의 온기", detail: "따뜻한 방의 소리", type: "warm", notes: [261.63, 329.63, 392] },
      { title: "곁에 머물기", detail: "잔잔한 새벽빛", type: "dawn", notes: [233.08, 293.66, 349.23] },
    ],
  },
  numb: {
    label: "마음이 멍한 솜 같아요",
    shortLabel: "멍함",
    caption: "선명해지려 애쓰지 말고 작은 감각 하나만 찾아봐요.",
    color: "#9fc4aa",
    face: "…",
    messages: [
      "아무 감각이 없는 것 같아도 마음이 잠깐 이불 속에 숨어 있는 걸 수 있어요. 억지로 꺼내지 않아도 돼요.",
      "지금은 잘 느끼는 것보다 안전하게 머무는 게 먼저예요. 아주 작은 감각 하나면 충분해요.",
      "멍한 시간도 마음이 버티는 방식일 수 있어요. 서두르지 않고 천천히 돌아와도 괜찮아요.",
    ],
    steps: [
      "보이는 색 세 가지를 천천히 이름 붙이기",
      "차갑거나 따뜻한 물을 한 모금 느껴보기",
      "발바닥이 바닥에 닿는 감각 확인하기",
    ],
    storyTitle: "아무것도 느껴지지 않을 때",
    storyText: "눈앞에서 보이는 색 하나, 들리는 소리 하나만 찾아봐요. 마음을 깨우기보다 몸이 여기 있음을 알려줘요.",
    music: [
      { title: "천천히 선명해져", detail: "맑은 빗방울", type: "rain", notes: [261.63, 329.63, 440] },
      { title: "감각 하나", detail: "구름과 종소리", type: "moon", notes: [293.66, 369.99, 440] },
      { title: "따뜻한 차 한 잔", detail: "포근한 저음", type: "warm", notes: [220, 277.18, 329.63] },
      { title: "빛이 드는 쪽", detail: "가벼운 아침 패드", type: "dawn", notes: [277.18, 349.23, 415.3] },
    ],
  },
  heavy: {
    label: "마음이 폭신하게 무거워요",
    shortLabel: "무거움",
    caption: "오늘은 해결보다 기대어 쉬는 쪽이 먼저예요.",
    color: "#f4a487",
    face: "⌣",
    messages: [
      "오늘도 잘 버텨줘서 정말 대단해요. 지금 이 순간, 여기 있어줘서 고마워요.",
      "마음이 무거운 날엔 이불이 조금 더 포근해져도 돼요. 잘하려고 애쓰지 말고 숨부터 내려놓아요.",
      "오늘의 몫을 다 해내지 않아도 괜찮아요. 여기까지 온 것만으로 이미 충분히 애썼어요.",
    ],
    steps: [
      "어깨의 힘을 한 번만 툭 내려놓기",
      "오늘 하지 않아도 되는 일 하나 미루기",
      "따뜻한 물 한 모금 천천히 마시기",
    ],
    storyTitle: "마음이 무겁게 내려앉을 때",
    storyText: "오늘 해야 할 일 중 하나를 내일로 옮겨도 괜찮아요. 빈틈을 만드는 것도 분명한 돌봄이에요.",
    music: [
      { title: "오늘 밤, 나에게", detail: "부드러운 빗소리", type: "rain", notes: [196, 246.94, 293.66] },
      { title: "마음이 쉬는 곳", detail: "느린 달빛 패드", type: "moon", notes: [220, 261.63, 329.63] },
      { title: "괜찮아, 천천히", detail: "따뜻한 방의 울림", type: "warm", notes: [174.61, 220, 261.63] },
      { title: "조용한 위로", detail: "옅은 새벽 구름", type: "dawn", notes: [233.08, 293.66, 349.23] },
    ],
  },
  anxious: {
    label: "마음이 조마조마해요",
    shortLabel: "불안",
    caption: "미래 전체가 아니라 지금 손에 닿는 것부터 확인해요.",
    color: "#f2c867",
    face: "~",
    messages: [
      "불안이 먼저 멀리 달려갔네요. 우리는 미래 전체 말고 지금 발끝부터 천천히 확인해봐요.",
      "해결책을 바로 찾지 않아도 괜찮아요. 몸에게 '지금은 여기 있어'라는 신호부터 보내요.",
      "걱정이 크게 들리는 밤일수록 작은 사실이 도움이 돼요. 지금 보이는 것 하나를 함께 짚어봐요.",
    ],
    steps: [
      "발바닥으로 바닥을 5초 동안 지그시 누르기",
      "4초 들이쉬고 6초 내쉬기 세 번",
      "지금 확실한 사실 한 가지 소리 내어 말하기",
    ],
    storyTitle: "생각이 자꾸 앞서 달릴 때",
    storyText: "발바닥으로 바닥을 느끼고, 지금 확실한 사실 하나를 말해봐요. '나는 방 안에 있고 지금 숨 쉬고 있어.'",
    music: [
      { title: "창문 밖 잔잔한 비", detail: "고른 빗소리", type: "rain", notes: [220, 293.66, 349.23] },
      { title: "천천히 60 BPM", detail: "낮은 달빛 리듬", type: "moon", notes: [196, 261.63, 311.13] },
      { title: "손끝의 온도", detail: "따뜻한 저음", type: "warm", notes: [174.61, 233.08, 293.66] },
      { title: "아침은 와요", detail: "밝은 숨의 패드", type: "dawn", notes: [261.63, 349.23, 392] },
    ],
  },
  sad: {
    label: "마음에 잔비가 내려요",
    shortLabel: "울적함",
    caption: "이유를 다 찾지 않아도 슬픈 마음은 충분히 머물 수 있어요.",
    color: "#aebdd3",
    face: "︵",
    messages: [
      "울적함을 빨리 걷어내지 않아도 괜찮아요. 오늘 마음에 비가 오는 이유를 몰라도 여기 같이 있을게요.",
      "눈물이 나거나 아무 말도 하기 싫은 날도 있어요. 지금은 버티는 모양 그대로 충분해요.",
      "슬픈 마음을 설명하는 일도 힘이 들어요. 한 문장보다 한숨부터 내쉬어도 괜찮아요.",
    ],
    steps: [
      "따뜻한 이불이나 겉옷으로 몸 감싸기",
      "슬픈 이유를 한 단어로만 적어보기",
      "오늘 꼭 하지 않아도 되는 일 하나 덜기",
    ],
    storyTitle: "마음에 잔비가 오래 머물 때",
    storyText: "슬픔을 멈추려 하지 말고 몸을 먼저 따뜻하게 해요. 감정은 머물다 움직이는 파도라서, 오늘은 젖지 않게 쉬는 것만으로 충분해요.",
    music: [
      { title: "잔비가 머무는 창", detail: "조용한 빗소리", type: "rain", notes: [196, 246.94, 293.66] },
      { title: "울어도 되는 밤", detail: "낮은 달빛 피아노", type: "moon", notes: [174.61, 220, 261.63] },
      { title: "젖지 않는 온기", detail: "따뜻한 저음", type: "warm", notes: [220, 277.18, 329.63] },
      { title: "비 뒤의 옅은 빛", detail: "느린 새벽 패드", type: "dawn", notes: [233.08, 293.66, 349.23] },
    ],
  },
  frustrated: {
    label: "마음속이 꽉 막힌 것 같아요",
    shortLabel: "답답함",
    caption: "화를 없애기보다 다치지 않게 흘려보낼 통로를 만들어요.",
    color: "#e8937e",
    face: "﹀",
    messages: [
      "답답함이 커질 만큼 참고 견딘 일이 있었나 봐요. 지금 화가 난 마음을 나쁘다고 몰아세우지 않을게요.",
      "당장 결론을 내리기보다 몸에 남은 힘부터 안전하게 빼내요. 말은 그 다음이어도 괜찮아요.",
      "억울함과 화는 경계가 침범됐다는 신호일 수 있어요. 다치지 않는 방식으로 내 편을 들어봐요.",
    ],
    steps: [
      "주먹을 5초 쥐었다가 천천히 펴기",
      "지금 싫었던 일을 사실 문장으로 적기",
      "답장이나 결정은 10분 뒤로 미루기",
    ],
    storyTitle: "속이 꽉 막혀 터질 것 같을 때",
    storyText: "바로 말하거나 결정하지 말고 손에 힘을 줬다 풀어봐요. 화를 참는 대신 안전하게 시간을 버는 것도 내 경계를 지키는 일이에요.",
    music: [
      { title: "열을 식히는 비", detail: "고른 빗소리", type: "rain", notes: [207.65, 261.63, 311.13] },
      { title: "말하기 전의 밤", detail: "낮은 리듬", type: "moon", notes: [196, 246.94, 293.66] },
      { title: "내 편의 온도", detail: "단단한 저음", type: "warm", notes: [220, 293.66, 349.23] },
      { title: "조금 열린 창", detail: "맑은 새벽빛", type: "dawn", notes: [261.63, 329.63, 392] },
    ],
  },
  relieved: {
    label: "마음에 숨 쉴 틈이 생겼어요",
    shortLabel: "후련함",
    caption: "가벼워진 순간을 분석하지 말고 몸이 먼저 기억하게 해요.",
    color: "#88bdae",
    face: "◡",
    messages: [
      "마음에 작은 틈이 생겼네요. 이 순간을 붙잡기보다 편안함이 몸에 스며들게 잠깐 머물러요.",
      "후련한 마음을 알아챈 게 반가워요. 잘해낸 이유를 찾지 않아도 이 쉼을 누릴 자격은 충분해요.",
      "조금 가벼워졌다면 오늘의 나에게 고맙다고 한 번만 말해줘도 좋아요.",
    ],
    steps: [
      "지금 편안해진 몸의 부위 알아차리기",
      "좋아진 이유를 한 문장으로 남기기",
      "이 여유를 해치지 않을 작은 선택 하기",
    ],
    storyTitle: "마음에 숨 쉴 틈이 생겼을 때",
    storyText: "어깨와 턱이 조금 풀렸는지 느껴봐요. 편안함을 오래 유지하려 애쓰기보다 지금의 감각을 몸에 저장해두는 것으로 충분해요.",
    music: [
      { title: "비가 그친 창", detail: "맑은 물방울", type: "rain", notes: [261.63, 329.63, 392] },
      { title: "한숨 뒤의 달", detail: "가벼운 패드", type: "moon", notes: [246.94, 311.13, 369.99] },
      { title: "느슨해진 어깨", detail: "포근한 화음", type: "warm", notes: [293.66, 369.99, 440] },
      { title: "열린 아침", detail: "밝은 새벽빛", type: "dawn", notes: [277.18, 349.23, 415.3] },
    ],
  },
  hopeful: {
    label: "조금 기대해보고 싶은 마음이에요",
    shortLabel: "기대",
    caption: "큰 계획보다 기대가 향하는 작은 방향 하나만 남겨봐요.",
    color: "#f0bd68",
    face: "✦",
    messages: [
      "조금 기대해보고 싶은 마음이 반짝이네요. 결과를 약속하지 않아도 이 방향을 바라보는 것만으로 충분해요.",
      "좋아질 가능성을 알아챈 마음이 반가워요. 오늘은 한 걸음보다 발끝만 그쪽으로 두어도 괜찮아요.",
      "기대가 실망으로 바뀔까 걱정될 수도 있어요. 그래도 지금 생긴 작은 빛은 진짜예요.",
    ],
    steps: [
      "기대되는 일을 한 단어로 적기",
      "그 방향으로 5분 안에 할 수 있는 일 고르기",
      "결과 대신 시도한 시간을 기록하기",
    ],
    storyTitle: "조금 기대해보고 싶은 것이 생길 때",
    storyText: "큰 계획표를 만들지 말고 5분짜리 첫 장면만 떠올려봐요. 기대는 완벽한 확신이 아니라 방향을 비추는 작은 불빛이어도 돼요.",
    music: [
      { title: "빛을 기다리는 비", detail: "맑은 빗방울", type: "rain", notes: [277.18, 349.23, 440] },
      { title: "별 하나의 방향", detail: "반짝이는 패드", type: "moon", notes: [293.66, 369.99, 440] },
      { title: "시작의 온기", detail: "밝은 화음", type: "warm", notes: [261.63, 329.63, 415.3] },
      { title: "내일 쪽 창문", detail: "가벼운 새벽빛", type: "dawn", notes: [329.63, 415.3, 493.88] },
    ],
  },
  proud: {
    label: "오늘의 내가 조금 뿌듯해요",
    shortLabel: "뿌듯함",
    caption: "해낸 크기보다 나를 알아봐 준 마음을 오래 남겨요.",
    color: "#d7a8c8",
    face: "⌒",
    messages: [
      "오늘의 나를 알아봐 준 마음이 참 좋아요. 잘한 일을 줄이지 말고 있는 크기 그대로 두어요.",
      "누가 칭찬하지 않아도 내가 나를 인정한 순간은 오래 남아요. 무엇이 가장 뿌듯했는지 들려줄래요?",
      "작은 일을 해낸 힘도 진짜 힘이에요. 오늘의 나에게 조용한 박수를 보내요.",
    ],
    steps: [
      "오늘 해낸 일 하나를 구체적으로 적기",
      "그때 내가 쓴 힘이나 태도 이름 붙이기",
      "내일의 나에게 짧은 칭찬 남기기",
    ],
    storyTitle: "오늘의 내가 조금 자랑스러울 때",
    storyText: "결과보다 내가 들인 마음과 시간을 한 번 바라봐요. 뿌듯함을 겸손하게 줄이지 않아도 괜찮아요. 이 기억은 힘든 날의 근거가 돼요.",
    music: [
      { title: "반짝인 하루", detail: "맑은 빗소리", type: "rain", notes: [293.66, 369.99, 440] },
      { title: "나만의 작은 별", detail: "따뜻한 달빛", type: "moon", notes: [277.18, 349.23, 415.3] },
      { title: "잘해낸 온기", detail: "풍성한 화음", type: "warm", notes: [329.63, 415.3, 493.88] },
      { title: "다음 날의 빛", detail: "맑은 아침 패드", type: "dawn", notes: [349.23, 440, 523.25] },
    ],
  },
  calm: {
    label: "지금은 조금 괜찮아요",
    shortLabel: "괜찮음",
    caption: "편안해진 틈을 서둘러 채우지 말고 그대로 누려봐요.",
    color: "#9ec8d4",
    face: "⌒",
    messages: [
      "지금처럼 조용히 머무는 것도 회복이에요. 마음을 크게 움직이지 않아도 괜찮아요.",
      "조금 편안해진 틈이 있다면 거기에 기대요. 아주 작아도 분명한 쉼이에요.",
      "괜찮은 순간을 알아챈 마음이 반가워요. 이 느낌을 오래 붙잡기보다 가만히 곁에 두어요.",
    ],
    steps: [
      "지금 편안한 이유 한 가지 기억해두기",
      "좋아하는 향이나 온도를 조금 더 누리기",
      "내일의 나에게 짧은 안부 남기기",
    ],
    storyTitle: "조금 괜찮아진 틈이 생길 때",
    storyText: "편안함을 증명하거나 오래 붙잡지 않아도 돼요. 지금 이 온도를 몸이 기억하도록 잠시 머물러요.",
    music: [
      { title: "따뜻한 방", detail: "느린 빗소리", type: "rain", notes: [261.63, 329.63, 392] },
      { title: "밤의 숨", detail: "맑은 달빛 패드", type: "moon", notes: [246.94, 311.13, 369.99] },
      { title: "작은 별의 온기", detail: "부드러운 화음", type: "warm", notes: [293.66, 369.99, 440] },
      { title: "구름 이불", detail: "포근한 아침빛", type: "dawn", notes: [277.18, 349.23, 415.3] },
    ],
  },
};

const voicePersonaData = {
  counselor_female: {
    name: "상담 선생님 · 여성",
    partner: "상담 선생님과 천천히",
    description: "차분한 존댓말로 감정을 먼저 짚고, 한 번에 한 가지 질문만 건네요.",
  },
  counselor_male: {
    name: "상담 선생님 · 남성",
    partner: "상담 선생님과 차분히",
    description: "낮고 안정적인 존댓말로 서두르지 않고 생각을 정리하도록 도와요.",
  },
  friend_female: {
    name: "친구 · 여성",
    partner: "다정한 친구와 편하게",
    description: "가까운 친구처럼 부드러운 반말로 공감하되, 해결을 재촉하지 않아요.",
  },
  friend_male: {
    name: "친구 · 남성",
    partner: "편안한 친구와 솔직히",
    description: "담백하고 편한 반말로 곁을 지키며, 필요한 순간에만 작은 질문을 건네요.",
  },
  mother: {
    name: "부모님 · 엄마",
    partner: "엄마 같은 온기로",
    description: "엄마처럼 포근한 말투를 쓰지만 실제 가족인 척하거나 기억을 아는 척하지 않아요.",
  },
  father: {
    name: "부모님 · 아빠",
    partner: "아빠 같은 든든함으로",
    description: "아빠처럼 든든하고 느긋한 말투를 쓰되 훈계하거나 판단하지 않아요.",
  },
};

function normalizeWeight(value, { legacy = false } = {}) {
  const fallback = legacy ? 3 : 5;
  const parsed = Number.isFinite(Number(value)) ? Number(value) : fallback;
  const tenPointValue = legacy ? parsed * 2 - 1 : parsed;
  return Math.min(10, Math.max(1, Math.round(tenPointValue)));
}

const THEME_MODES = new Set(["system", "light", "dark"]);
const TITLE_FONT_FALLBACK = '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const TITLE_FONT_OPTIONS = Object.freeze({
  seowon: { label: "서원체", family: `"Griun Seowon", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  everyday: { label: "매일정체", family: `"Griun Everyday Jeong", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  moji: { label: "모지체", family: `"Griun Moji", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  cherry: { label: "체리 한 스푼체", family: `"Griun Cherry Spoon", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  ahyoung: { label: "아영 손글씨", family: `"Griun Ahyoung", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  dujun: { label: "두준두준체", family: `"Griun Dujun", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  onhand: { label: "온글씨체", family: `"Griun On Handwriting", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  soly: { label: "솔이체", family: `"Griun Soly", ${TITLE_FONT_FALLBACK}`, weight: "400" },
  system: { label: "기본 고딕", family: TITLE_FONT_FALLBACK, weight: "700" },
});
const TITLE_FONT_KEYS = new Set(Object.keys(TITLE_FONT_OPTIONS));

function normalizeThemeMode(settings = {}) {
  if (THEME_MODES.has(settings.themeMode)) return settings.themeMode;
  if (typeof settings.darkMode === "boolean") return settings.darkMode ? "dark" : "light";
  return "system";
}

function normalizeTitleFont(settings = {}) {
  return TITLE_FONT_KEYS.has(settings.titleFont) ? settings.titleFont : "seowon";
}

function normalizeSettings(settings = {}) {
  return {
    motion: settings.motion !== false,
    sound: settings.sound !== false,
    themeMode: normalizeThemeMode(settings),
    titleFont: normalizeTitleFont(settings),
  };
}

const defaultState = () => ({
  mood: "heavy",
  weight: 5,
  weightScale: 10,
  history: [],
  chat: [],
  voicePersona: "counselor_female",
  settings: { motion: true, sound: true, themeMode: "system", titleFont: "seowon" },
  care: { date: "", completed: [], stepByMood: {}, routine: [], daylight: { minutes: 10, completed: false } },
  breathingSessions: 0,
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return defaultState();
    const isLegacyWeightScale = saved.weightScale !== 10;
    return {
      ...defaultState(),
      ...saved,
      weight: normalizeWeight(saved.weight, { legacy: isLegacyWeightScale }),
      weightScale: 10,
      settings: normalizeSettings(saved.settings),
      care: {
        ...defaultState().care,
        ...(saved.care || {}),
        completed: Array.isArray(saved.care?.completed) ? saved.care.completed : [],
        stepByMood: { ...(saved.care?.stepByMood || {}) },
        routine: Array.isArray(saved.care?.routine) ? saved.care.routine : [],
        daylight: {
          minutes: [3, 10, 20].includes(Number(saved.care?.daylight?.minutes)) ? Number(saved.care.daylight.minutes) : 10,
          completed: Boolean(saved.care?.daylight?.completed),
        },
      },
      history: Array.isArray(saved.history)
        ? saved.history.slice(0, 90).map((entry) => ({
          ...entry,
          weight: normalizeWeight(entry.weight, { legacy: isLegacyWeightScale }),
        }))
        : [],
      chat: Array.isArray(saved.chat) ? saved.chat.slice(-20) : [],
    };
  } catch {
    return defaultState();
  }
}

let state = loadState();
let comfortIndex = 0;
let careStepIndex = 0;
let toastTimer = null;
let audioContext = null;
let audioNodes = [];
let activeTrackIndex = null;
let selectedMinutes = 3;
let totalBreathSeconds = 180;
let breathSecondsLeft = 180;
let breathInterval = null;
let breathStartedAt = 0;
let breathStartRemaining = 180;
let daylightSecondsLeft = 600;
let daylightInterval = null;
let daylightStartedAt = 0;
let daylightStartRemaining = 600;
let lastPromptSignature = "";
let safetyTimerInterval = null;
let safetySecondsLeft = 600;
let safetyStartedAt = 0;
let safetyStartRemaining = 600;
let prescriptionSecondsLeft = 300;
let prescriptionTimerInterval = null;
let prescriptionStartedAt = 0;
let prescriptionStartRemaining = 300;
let appConfig = {
  aiConfigured: false,
  aiAccess: false,
  textModel: "gpt-4.1-mini",
  realtimeModel: "gpt-realtime-2.1-mini",
  plan: "plus",
  planPriceKrw: 6900,
  renewalPriceKrw: 6900,
  priceLabel: "월 6,900원",
  renewalPriceLabel: "월 6,900원",
  launchEventActive: true,
  subscriptionSalesOpen: false,
  voiceAvailable: false,
  loginRequired: false,
  authEmailReady: true,
  oauthProviders: {
    kakao: { label: "카카오", ready: false },
    naver: { label: "네이버", ready: false },
    google: { label: "Google", ready: false },
  },
  billingReady: false,
  billingPortalReady: false,
  account: { signedIn: false, emailMasked: null, providers: [], consentValid: false, consent: null },
  subscription: { active: false, status: "inactive", expiresAt: null },
  limits: { monthlyText: 30, freeMonthlyText: 30, paidMonthlyText: 200, monthlyVoiceMinutes: 30, maxCallMinutes: 10 },
  usage: {
    text: { used: 0, limit: 30, remaining: 30 },
    voice: { usedSeconds: 0, reservedSeconds: 0, limitSeconds: 1800, remainingSeconds: 1800 },
  },
};
let chatPending = false;
let voicePeerConnection = null;
let voiceLocalStream = null;
let voiceTimerInterval = null;
let voiceStartedAt = 0;
let voiceSessionVersion = 0;
let voiceAbortController = null;
let voiceReservationId = "";
let voiceMaxSeconds = 600;
let activeView = "home";
let preferredProviderType = "psychiatry";

const app = document.querySelector("#app");
const appScroll = document.querySelector("#appScroll");
const viewSections = [...document.querySelectorAll("[data-view-section]")];
const viewButtons = [...document.querySelectorAll(".bottom-nav [data-view]")];
const chatModeButtons = [...document.querySelectorAll("[data-chat-mode]")];
const chatPanes = [...document.querySelectorAll("[data-chat-pane]")];
const voicePersonaButtons = [...document.querySelectorAll("[data-persona]")];
const currentTime = document.querySelector("#currentTime");
const dateLabel = document.querySelector("#dateLabel");
const moodButtons = [...document.querySelectorAll(".mood-choice")];
const moodLabel = document.querySelector("#moodLabel");
const moodCaption = document.querySelector("#moodCaption");
const moodWeight = document.querySelector("#moodWeight");
const weightValue = document.querySelector("#weightValue");
const savedCount = document.querySelector("#savedCount");
const friendMessage = document.querySelector("#friendMessage");
const careStep = document.querySelector("#careStep");
const comfortButton = document.querySelector("#comfortButton");
const storyHeading = document.querySelector("#storyHeading");
const storyText = document.querySelector("#storyText");
const storyNumber = document.querySelector("#storyNumber");
const nextPrescription = document.querySelector("#nextPrescription");
const completeCare = document.querySelector("#completeCare");
const prescriptionChecklist = document.querySelector("#prescriptionChecklist");
const prescriptionProgress = document.querySelector("#prescriptionProgress");
const prescriptionTime = document.querySelector("#prescriptionTime");
const prescriptionTimerButton = document.querySelector("#prescriptionTimerButton");
const prescriptionTimerReset = document.querySelector("#prescriptionTimerReset");
const noteForm = document.querySelector("#noteForm");
const noteInput = document.querySelector("#noteInput");
const chatLog = document.querySelector("#chatLog");
const chatSubmitButton = noteForm.querySelector('[type="submit"]');
const inlineSafety = document.querySelector("#inlineSafety");
const promptRow = document.querySelector("#promptRow");
const dailyQuoteText = document.querySelector("#dailyQuoteText");
const dailyQuoteTheme = document.querySelector("#dailyQuoteTheme");
const dailyNextButton = document.querySelector("#dailyNextButton");
const dailyWidgetButton = document.querySelector("#dailyWidgetButton");
const musicList = document.querySelector("#musicList");
const nowPlaying = document.querySelector("#nowPlaying");
const breathStage = document.querySelector("#breathStage");
const breathTime = document.querySelector("#breathTime");
const breathPhase = document.querySelector("#breathPhase");
const breathStart = document.querySelector("#breathStart");
const breathReset = document.querySelector("#breathReset");
const daylightButtons = [...document.querySelectorAll("[data-daylight-minutes]")];
const daylightStatus = document.querySelector("#daylightStatus");
const daylightTime = document.querySelector("#daylightTime");
const daylightStartButton = document.querySelector("#daylightStartButton");
const daylightDoneButton = document.querySelector("#daylightDoneButton");
const routineButtons = [...document.querySelectorAll("[data-routine]")];
const routineCount = document.querySelector("#routineCount");
const routineSummary = document.querySelector("#routineSummary");
const historyList = document.querySelector("#historyList");
const emptyHistory = document.querySelector("#emptyHistory");
const weekSummaryTitle = document.querySelector("#weekSummaryTitle");
const weekSummaryText = document.querySelector("#weekSummaryText");
const weekBars = document.querySelector("#weekBars");
const recordDaysStat = document.querySelector("#recordDaysStat");
const averageWeightStat = document.querySelector("#averageWeightStat");
const lighterDaysStat = document.querySelector("#lighterDaysStat");
const statsPeriod = document.querySelector("#statsPeriod");
const statsInsight = document.querySelector("#statsInsight");
const recoveryTrend = document.querySelector("#recoveryTrend");
const recoverySummary = document.querySelector("#recoverySummary");
const cycleConfidence = document.querySelector("#cycleConfidence");
const cycleValue = document.querySelector("#cycleValue");
const cycleValueLabel = document.querySelector("#cycleValueLabel");
const cycleTitle = document.querySelector("#cycleTitle");
const cycleText = document.querySelector("#cycleText");
const cycleTimeline = document.querySelector("#cycleTimeline");
const homeRhythmTitle = document.querySelector("#homeRhythmTitle");
const homeRhythmText = document.querySelector("#homeRhythmText");
const subscriptionDialog = document.querySelector("#subscriptionDialog");
const consentDialog = document.querySelector("#consentDialog");
const safetyDialog = document.querySelector("#safetyDialog");
const openSubscriptionButton = document.querySelector("#openSubscriptionButton");
const planBadge = document.querySelector("#planBadge");
const planStatus = document.querySelector("#planStatus");
const planPrice = document.querySelector("#planPrice");
const planRenewalPrice = document.querySelector("#planRenewalPrice");
const freeTextLimit = document.querySelector("#freeTextLimit");
const planTextLimit = document.querySelector("#planTextLimit");
const planVoiceLimit = document.querySelector("#planVoiceLimit");
const planCallLimit = document.querySelector("#planCallLimit");
const subscriptionState = document.querySelector("#subscriptionState");
const textUsageLabel = document.querySelector("#textUsageLabel");
const textUsageProgress = document.querySelector("#textUsageProgress");
const voiceUsageLabel = document.querySelector("#voiceUsageLabel");
const voiceUsageProgress = document.querySelector("#voiceUsageProgress");
const subscribeButton = document.querySelector("#subscribeButton");
const billingNote = document.querySelector("#billingNote");
const freeUsageInline = document.querySelector("#freeUsageInline");
const menuAccountStatus = document.querySelector("#menuAccountStatus");
const menuPlanStatus = document.querySelector("#menuPlanStatus");
const myPlanBadge = document.querySelector("#myPlanBadge");
const myPlanUsage = document.querySelector("#myPlanUsage");
const myPlanProgress = document.querySelector("#myPlanProgress");
const myPlanStatus = document.querySelector("#myPlanStatus");
const mySubscriptionButton = document.querySelector("#mySubscriptionButton");
const accountStatus = document.querySelector("#accountStatus");
const socialLoginPanel = document.querySelector("#socialLoginPanel");
const socialLoginHint = document.querySelector("#socialLoginHint");
const accountLoginDivider = document.querySelector("#accountLoginDivider");
const socialLoginButtons = [...document.querySelectorAll("[data-oauth-provider]")];
const accountEmailForm = document.querySelector("#accountEmailForm");
const accountEmail = document.querySelector("#accountEmail");
const accountCodeForm = document.querySelector("#accountCodeForm");
const accountCode = document.querySelector("#accountCode");
const accountCodeHint = document.querySelector("#accountCodeHint");
const linkedAccountPanel = document.querySelector("#linkedAccountPanel");
const linkedAccountLabel = document.querySelector("#linkedAccountLabel");
const logoutAccountButton = document.querySelector("#logoutAccountButton");
const reviewConsentButton = document.querySelector("#reviewConsentButton");
const reviewConsentLabel = document.querySelector("#reviewConsentLabel");
const exportDataButton = document.querySelector("#exportDataButton");
const deleteAccountButton = document.querySelector("#deleteAccountButton");
const installAppButton = document.querySelector("#installAppButton");
const consentForm = document.querySelector("#consentForm");
const ageConsent = document.querySelector("#ageConsent");
const termsConsent = document.querySelector("#termsConsent");
const sensitiveConsent = document.querySelector("#sensitiveConsent");
const overseasConsent = document.querySelector("#overseasConsent");
const consentError = document.querySelector("#consentError");
const voicePanel = document.querySelector(".voice-panel");
const voiceCallButton = document.querySelector("#voiceCallButton");
const voiceStatus = document.querySelector("#voiceStatus");
const voiceTimer = document.querySelector("#voiceTimer");
const personaName = document.querySelector("#personaName");
const personaDescription = document.querySelector("#personaDescription");
const voicePartnerName = document.querySelector("#voicePartnerName");
const remoteAudio = document.querySelector("#remoteAudio");
const safetyDelayButton = document.querySelector("#safetyDelayButton");
const copyHelpButton = document.querySelector("#copyHelpButton");
const safetyCountdown = document.querySelector("#safetyCountdown");
const safetyTime = document.querySelector("#safetyTime");
const safetyTimerCopy = document.querySelector("#safetyTimerCopy");
const motionToggle = document.querySelector("#motionToggle");
const soundToggle = document.querySelector("#soundToggle");
const themeModeButtons = [...document.querySelectorAll("[data-theme-mode]")];
const titleFontSelect = document.querySelector("#titleFontSelect");
const systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") || null;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const supportLocationInput = document.querySelector("#supportLocationInput");
const providerSearchButtons = [...document.querySelectorAll("[data-provider-search]")];
const providerCard = document.querySelector(".provider-card");
const helpPathButtons = [...document.querySelectorAll("[data-help-path]")];
const helpPathPanels = [...document.querySelectorAll("[data-help-panel]")];
const supportPhraseButtons = [...document.querySelectorAll("[data-copy-support]")];
const focusProviderButtons = [...document.querySelectorAll("[data-focus-provider]")];
const toast = document.querySelector("#toast");

const supportPhrases = Object.freeze({
  guide: "요즘 잠과 기분이 무너져서 힘든데, 어디부터 도움받으면 좋을지 안내받고 싶어요.",
  clinic: "요즘 잠이 계속 깨고 불안해서 일상이 버거워졌어요. 원인을 확인받고 싶어요.",
  talk: "진단을 받기보다 요즘 마음과 관계를 천천히 정리해보고 싶어요.",
});

const oauthProviderLabels = Object.freeze({
  email: "이메일",
  kakao: "카카오",
  naver: "네이버",
  google: "Google",
});

const conversationPromptPool = Object.freeze([
  { label: "아무것도 하기 싫어", text: "아무것도 하기 싫고 몸을 일으키는 것도 버거워" },
  { label: "괜찮은 척 지쳤어", text: "사람들 앞에서 괜찮은 척하는 게 너무 지쳤어" },
  { label: "자꾸 내가 싫어져", text: "요즘 자꾸 내가 싫어지고 좋은 점이 하나도 안 보여" },
  { label: "사람들 눈치가 보여", text: "사람들이 나를 어떻게 볼지 계속 신경 쓰여" },
  { label: "내일이 너무 겁나", text: "아직 오지도 않은 내일이 너무 겁나고 피하고 싶어" },
  { label: "이유 없이 불안해", text: "특별한 이유가 없는 것 같은데 계속 불안해" },
  { label: "생각이 멈추지 않아", text: "같은 생각이 계속 돌아서 머리를 쉬게 하고 싶어" },
  { label: "혼자 있고 싶은데 외로워", text: "혼자 있고 싶으면서도 너무 외로운 마음이 같이 있어" },
  { label: "아무도 날 이해 못해", text: "아무도 내 마음을 이해하지 못하는 것처럼 느껴져" },
  { label: "울고 싶은데 안 나와", text: "울고 싶은데 눈물이 안 나고 마음만 꽉 막힌 것 같아" },
  { label: "작은 일에도 무너져", text: "요즘은 작은 일 하나에도 마음이 와르르 무너져" },
  { label: "죄책감이 자꾸 들어", text: "내 잘못이 아닌 것 같은데도 자꾸 죄책감이 들어" },
  { label: "오늘 버틴 걸 알아줘", text: "오늘 하루 버틴 것만으로도 애썼다고 말해줬으면 좋겠어" },
  { label: "해결보다 들어줘", text: "지금은 해결책보다 내 말을 판단하지 않고 들어줬으면 해" },
  { label: "마음을 정리하고 싶어", text: "엉켜 있는 지금 마음을 하나씩 같이 정리하고 싶어" },
  { label: "몸이 너무 무거워", text: "마음뿐 아니라 몸까지 무겁고 기운이 하나도 없어" },
  { label: "잠드는 게 두려워", text: "누우면 생각이 몰려와서 잠드는 시간이 두려워" },
  { label: "관계 때문에 지쳤어", text: "가까운 사람과의 관계 때문에 너무 지치고 혼란스러워" },
  { label: "실수가 떠나지 않아", text: "예전에 한 실수가 계속 떠올라서 나를 자책하게 돼" },
  { label: "미래가 막막해", text: "앞으로 어떻게 살아야 할지 막막하고 자신이 없어" },
  { label: "화를 표현 못하겠어", text: "화가 나는데 표현하면 미움받을까 봐 꾹 참고 있어" },
  { label: "오늘은 조금 나아", text: "오늘은 어제보다 조금 나은데 이 마음도 같이 이야기하고 싶어" },
  { label: "좋은 일이 낯설어", text: "좋은 일이 있었는데 편하게 기뻐해도 되는지 낯설어" },
  { label: "나도 내 편이고 싶어", text: "남에게 하듯 나에게도 다정해지는 방법을 찾고 싶어" },
]);

function renderPromptSuggestions() {
  if (!promptRow) return;
  let selected = [];
  let signature = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shuffled = [...conversationPromptPool];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    selected = shuffled.slice(0, 3);
    signature = selected.map((prompt) => prompt.label).sort().join("|");
    if (signature !== lastPromptSignature) break;
  }
  lastPromptSignature = signature;
  promptRow.replaceChildren();
  selected.forEach((prompt) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.prompt = prompt.text;
    button.textContent = prompt.label;
    promptRow.append(button);
  });
}

function localDaySeed(date = new Date()) {
  const yearStart = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.floor((today - yearStart) / 86400000) + 1;
  return date.getFullYear() * 366 + dayOfYear;
}

let dailyCompanions = [];
let dailyCompanionIndex = 0;

function renderDailyCompanion() {
  if (!dailyCompanions.length) return;
  const companion = dailyCompanions[dailyCompanionIndex % dailyCompanions.length];
  dailyQuoteText.textContent = companion.text;
  dailyQuoteTheme.textContent = companion.label;
  dailyQuoteText.closest(".daily-quote-visual")?.setAttribute("data-companion-id", companion.id);
}

async function loadDailyReading() {
  try {
    const response = await fetch("assets/daily-readings.json?v=2", { cache: "no-cache" });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.entries) || data.entries.length < 300) return;
    dailyCompanions = data.entries.filter((entry) => entry?.id && entry?.label && entry?.text);
    if (dailyCompanions.length < 300) return;
    dailyCompanionIndex = localDaySeed() % dailyCompanions.length;
    renderDailyCompanion();
  } catch {
    // The card keeps its bundled fallback copy when the local asset cannot be read.
  }
}

function showNextDailyCompanion() {
  if (!dailyCompanions.length) return;
  dailyCompanionIndex = (dailyCompanionIndex + 1) % dailyCompanions.length;
  renderDailyCompanion();
  nativeHaptic("LIGHT");
}

async function requestDailyWidget() {
  const widgetPlugin = window.Capacitor?.Plugins?.DailyQuoteWidget;
  if (!isNativeApp || typeof widgetPlugin?.requestPin !== "function") {
    showToast("Android 앱에서는 이 문장을 홈 화면 위젯으로 둘 수 있어요");
    return;
  }
  try {
    const result = await widgetPlugin.requestPin({
      text: dailyQuoteText.textContent,
      label: dailyQuoteTheme.textContent,
    });
    showToast(result?.requested
      ? "홈 화면에서 위젯 추가를 확인해 주세요"
      : "기기의 위젯 목록에서 마음친구를 찾아주세요");
  } catch {
    showToast("위젯을 바로 열지 못했어요. 기기의 위젯 목록에서 추가해 주세요");
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function updateClock() {
  const now = new Date();
  currentTime.textContent = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  dateLabel.textContent = `${new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now)} · 오늘도 여기까지 왔어요`;
}

function updateSavedBadge() {
  const today = state.history.find((entry) => entry.date === todayKey());
  savedCount.textContent = today ? "오늘 기록됨" : "오늘 첫 기록";
}

function recordCurrentMood(note = "") {
  const date = todayKey();
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const existing = state.history.findIndex((entry) => entry.date === date);
  const previousNote = existing >= 0 ? state.history[existing].note || "" : "";
  const entry = {
    date,
    time,
    mood: state.mood,
    weight: state.weight,
    note: note || previousNote,
  };

  if (existing >= 0) state.history.splice(existing, 1);
  state.history.unshift(entry);
  state.history = state.history.slice(0, 90);
  saveState();
  updateSavedBadge();
  renderHistory();
}

function ensureTodayCare() {
  const date = todayKey();
  if (state.care.date === date) return;
  clearInterval(daylightInterval);
  daylightInterval = null;
  daylightSecondsLeft = 600;
  state.care = { date, completed: [], stepByMood: {}, routine: [], daylight: { minutes: 10, completed: false } };
}

function careKeyFor(stepIndex) {
  return `${state.mood}:${stepIndex}`;
}

function currentCareKey() {
  return careKeyFor(careStepIndex);
}

function updateCareUI() {
  ensureTodayCare();
  const data = moodData[state.mood];
  const step = data.steps[careStepIndex];
  const isDone = state.care.completed.includes(currentCareKey());
  const completedCount = data.steps.filter((_, index) => state.care.completed.includes(careKeyFor(index))).length;

  careStep.textContent = step;
  storyText.textContent = careStepIndex === 0
    ? data.storyText
    : `${step}. 완벽히 해내려 하지 말고, 아주 잠깐만 시도해도 충분해요.`;
  storyNumber.textContent = String(careStepIndex + 1).padStart(2, "0");
  completeCare.classList.toggle("is-done", isDone);
  completeCare.setAttribute("aria-pressed", String(isDone));
  completeCare.querySelector("span").textContent = isDone ? "돌봄 완료" : "해봤어요";
  prescriptionProgress.textContent = `${completedCount} / ${data.steps.length}`;
  prescriptionChecklist.replaceChildren();
  data.steps.forEach((stepText, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const stepIsDone = state.care.completed.includes(careKeyFor(index));
    button.type = "button";
    button.dataset.careStepIndex = String(index);
    button.classList.toggle("is-current", index === careStepIndex);
    button.classList.toggle("is-done", stepIsDone);
    button.setAttribute("aria-pressed", String(stepIsDone));
    button.setAttribute("aria-label", `${index + 1}단계 ${stepText}${stepIsDone ? ", 완료됨" : ""}`);
    label.textContent = stepText;
    button.append(label);
    item.append(button);
    prescriptionChecklist.append(item);
  });
  updateRoutineUI();
  updateDaylightUI();
}

function updateRoutineUI() {
  ensureTodayCare();
  const completed = Array.isArray(state.care.routine) ? state.care.routine : [];
  routineButtons.forEach((button) => {
    const isDone = completed.includes(button.dataset.routine);
    button.classList.toggle("is-done", isDone);
    button.setAttribute("aria-pressed", String(isDone));
  });
  routineCount.textContent = `${completed.length} / 3`;
  routineSummary.textContent = completed.length === 0
    ? "하나만 채워도 오늘의 몸을 돌본 일이에요."
    : completed.length === 3
      ? "세 칸을 모두 채웠어요. 오늘의 몸을 다정하게 챙겼네요."
      : `${completed.length}칸을 채웠어요. 여기서 멈춰도 충분한 돌봄이에요.`;
}

function toggleRoutine(routine) {
  ensureTodayCare();
  const existing = state.care.routine.indexOf(routine);
  if (existing >= 0) state.care.routine.splice(existing, 1);
  else state.care.routine.push(routine);
  saveState();
  updateRoutineUI();
  showToast(existing >= 0 ? "돌봄 표시를 다시 열어뒀어요" : "오늘의 작은 돌봄을 채웠어요");
}

function daylightReadyCopy() {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 19) return "지금은 쉬고, 다음 낮에 시작해도 좋아요";
  if (state.care.daylight.minutes === 3) return "커튼을 열고 창가에 머물러요";
  return "신발만 신어도 이미 시작이에요";
}

function updateDaylightUI(isRunning = Boolean(daylightInterval)) {
  ensureTodayCare();
  const selectedMinutes = state.care.daylight.minutes;
  daylightButtons.forEach((button) => {
    const isActive = Number(button.dataset.daylightMinutes) === selectedMinutes;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
  daylightTime.textContent = state.care.daylight.completed ? "완료" : formatSeconds(daylightSecondsLeft);
  daylightStatus.textContent = state.care.daylight.completed
    ? "오늘의 낮빛 돌봄을 남겼어요"
    : isRunning
      ? "낮빛과 걸음을 이어가는 중이에요"
      : daylightSecondsLeft < selectedMinutes * 60
        ? "잠깐 멈춰도 괜찮아요"
        : daylightReadyCopy();
  const startUse = daylightStartButton.querySelector("use");
  const startLabel = daylightStartButton.querySelector("span");
  startUse?.setAttribute("href", isRunning ? "#icon-pause" : "#icon-play");
  startLabel.textContent = isRunning ? "멈춤" : daylightSecondsLeft < selectedMinutes * 60 ? "이어가기" : "시작";
  daylightStartButton.setAttribute("aria-label", isRunning ? "낮빛 돌봄 잠시 멈추기" : "낮빛 돌봄 시작");
  daylightDoneButton.classList.toggle("is-done", state.care.daylight.completed);
  daylightDoneButton.setAttribute("aria-pressed", String(state.care.daylight.completed));
}

function resetDaylightTimer() {
  clearInterval(daylightInterval);
  daylightInterval = null;
  daylightSecondsLeft = state.care.daylight.minutes * 60;
  daylightStartRemaining = daylightSecondsLeft;
  updateDaylightUI(false);
}

function setDaylightMinutes(minutes) {
  if (![3, 10, 20].includes(minutes)) return;
  ensureTodayCare();
  state.care.daylight.minutes = minutes;
  state.care.daylight.completed = false;
  saveState();
  resetDaylightTimer();
}

function pauseDaylightTimer() {
  if (!daylightInterval) return;
  daylightSecondsLeft = Math.max(0, daylightStartRemaining - (Date.now() - daylightStartedAt) / 1000);
  clearInterval(daylightInterval);
  daylightInterval = null;
  updateDaylightUI(false);
}

function completeDaylightSession() {
  ensureTodayCare();
  clearInterval(daylightInterval);
  daylightInterval = null;
  daylightSecondsLeft = 0;
  state.care.daylight.completed = true;
  if (!state.care.routine.includes("light")) state.care.routine.push("light");
  saveState();
  updateRoutineUI();
  updateDaylightUI(false);
  friendMessage.textContent = "낮빛을 만나고 몸을 움직인 시간도 분명한 돌봄이에요. 오늘의 걸음을 잘 남겨뒀어요.";
  showToast("오늘의 낮빛 돌봄을 기록했어요");
}

function startOrPauseDaylightTimer() {
  ensureTodayCare();
  if (daylightInterval) {
    pauseDaylightTimer();
    return;
  }
  if (state.care.daylight.completed || daylightSecondsLeft <= 0) {
    state.care.daylight.completed = false;
    daylightSecondsLeft = state.care.daylight.minutes * 60;
  }
  daylightStartRemaining = daylightSecondsLeft;
  daylightStartedAt = Date.now();
  daylightInterval = setInterval(() => {
    daylightSecondsLeft = Math.max(0, daylightStartRemaining - (Date.now() - daylightStartedAt) / 1000);
    if (daylightSecondsLeft <= 0) {
      completeDaylightSession();
      return;
    }
    updateDaylightUI(true);
  }, 250);
  updateDaylightUI(true);
}

function syncCareForMood() {
  ensureTodayCare();
  const savedStep = Number(state.care.stepByMood[state.mood]);
  careStepIndex = Number.isInteger(savedStep) && savedStep >= 0
    ? savedStep % moodData[state.mood].steps.length
    : 0;
  updateCareUI();
}

function showNextPrescription() {
  ensureTodayCare();
  careStepIndex = (careStepIndex + 1) % moodData[state.mood].steps.length;
  state.care.stepByMood[state.mood] = careStepIndex;
  saveState();
  resetPrescriptionTimer();
  updateCareUI();
  showToast("지금 마음에 맞는 다른 처방을 꺼냈어요");
}

function toggleCareCompletion(stepIndex = careStepIndex) {
  ensureTodayCare();
  careStepIndex = Math.min(moodData[state.mood].steps.length - 1, Math.max(0, Number(stepIndex) || 0));
  state.care.stepByMood[state.mood] = careStepIndex;
  const key = currentCareKey();
  const existing = state.care.completed.indexOf(key);

  if (existing >= 0) {
    state.care.completed.splice(existing, 1);
    showToast("완료 표시를 다시 열어뒀어요");
  } else {
    state.care.completed.push(key);
    nativeHaptic("MEDIUM");
    friendMessage.textContent = "아주 작은 돌봄도 실제로 해낸 일이에요. 오늘의 나를 챙겨줘서 고마워요.";
    showToast("오늘의 작은 돌봄을 남겼어요");
  }

  saveState();
  updateCareUI();
}

function setMood(mood, { record = false } = {}) {
  if (!moodData[mood]) return;
  state.mood = mood;
  const data = moodData[mood];
  app.dataset.mood = mood;
  app.style.setProperty("--active-mood", data.color);

  moodButtons.forEach((button) => {
    const isActive = button.dataset.mood === mood;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  moodLabel.textContent = data.label;
  moodCaption.textContent = data.caption;
  friendMessage.textContent = data.messages[0];
  careStep.textContent = data.steps[0];
  storyHeading.textContent = data.storyTitle;
  storyText.textContent = data.storyText;
  comfortIndex = 0;
  resetPrescriptionTimer();
  syncCareForMood();
  stopSoundscape();
  renderMusic();

  if (record) {
    nativeHaptic("LIGHT");
    recordCurrentMood();
    showToast("오늘 마음을 조용히 기록했어요");
  } else {
    saveState();
  }
}

function renderHistory() {
  historyList.replaceChildren();
  emptyHistory.hidden = state.history.length > 0;

  state.history.slice(0, 10).forEach((entry) => {
    const data = moodData[entry.mood] || moodData.heavy;
    const item = document.createElement("li");
    item.className = "history-item";

    const cloud = document.createElement("span");
    cloud.className = "history-cloud";
    cloud.style.setProperty("--history-color", data.color);
    cloud.textContent = data.face;

    const copy = document.createElement("span");
    copy.className = "history-copy";
    const title = document.createElement("strong");
    title.textContent = data.shortLabel;
    const meta = document.createElement("span");
    const formattedDate = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(`${entry.date}T12:00:00`));
    meta.textContent = entry.note ? `${formattedDate} · ${entry.note}` : `${formattedDate} · ${entry.time}`;
    copy.append(title, meta);

    const weight = document.createElement("span");
    weight.className = "history-weight";
    weight.textContent = `무게 ${entry.weight} / 10`;
    item.append(cloud, copy, weight);
    historyList.append(item);
  });

  renderWeekSummary();
  renderRecoveryAnalytics();
}

function dateKeyFor(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function renderWeekSummary() {
  weekBars.replaceChildren();
  const recentEntries = [];
  const weekdays = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = dateKeyFor(date);
    const entry = state.history.find((item) => item.date === key);
    const day = document.createElement("span");
    day.className = `week-day${entry ? "" : " is-empty"}${offset === 0 ? " is-today" : ""}`;

    const cloud = document.createElement("i");
    cloud.className = "weather-cloud";
    const dayLabel = document.createElement("small");
    dayLabel.textContent = new Intl.DateTimeFormat("ko-KR", { weekday: "narrow" }).format(date);

    if (entry) {
      const data = moodData[entry.mood] || moodData.heavy;
      const weight = normalizeWeight(entry.weight);
      cloud.style.setProperty("--weather-color", data.color);
      cloud.style.setProperty("--weather-scale", String(0.75 + weight * 0.035));
      day.title = `${dayLabel.textContent}요일, ${data.shortLabel}, 마음 무게 ${weight}`;
      recentEntries.push(entry);
      weekdays.push(`${dayLabel.textContent}요일 ${data.shortLabel}`);
    } else {
      day.title = `${dayLabel.textContent}요일, 기록 없음`;
    }

    day.append(cloud, dayLabel);
    weekBars.append(day);
  }

  weekBars.setAttribute("aria-label", recentEntries.length ? `최근 7일 마음 기록: ${weekdays.join(", ")}` : "최근 7일 마음 기록 없음");

  if (!recentEntries.length) {
    weekSummaryTitle.textContent = "최근 7일의 마음 날씨";
    weekSummaryText.textContent = "첫 마음을 남기면 작은 구름으로 함께 살펴볼게요.";
    return;
  }

  const counts = recentEntries.reduce((result, entry) => {
    result[entry.mood] = (result[entry.mood] || 0) + 1;
    return result;
  }, {});
  const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const averageWeight = (recentEntries.reduce((sum, entry) => sum + normalizeWeight(entry.weight), 0) / recentEntries.length).toFixed(1);
  weekSummaryTitle.textContent = `최근 7일 중 ${recentEntries.length}일을 기록했어요`;
  weekSummaryText.textContent = `자주 보인 마음은 ${moodData[dominantMood].shortLabel}, 평균 마음 무게는 ${averageWeight}예요.`;
}

function historyDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetweenDates(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / 86400000);
}

function entriesByDaysAgo(minDaysAgo, maxDaysAgo) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return state.history.filter((entry) => {
    const date = historyDate(entry.date);
    if (!date) return false;
    const daysAgo = daysBetweenDates(today, date);
    return daysAgo >= minDaysAgo && daysAgo <= maxDaysAgo;
  });
}

function averageWeight(entries) {
  if (!entries.length) return null;
  return entries.reduce((sum, entry) => sum + normalizeWeight(entry.weight), 0) / entries.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function analyzeMoodCycle(history = state.history) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const entries = history
    .map((entry) => ({ ...entry, parsedDate: historyDate(entry.date), weightValue: normalizeWeight(entry.weight) }))
    .filter((entry) => entry.parsedDate && daysBetweenDates(today, entry.parsedDate) >= 0 && daysBetweenDates(today, entry.parsedDate) <= 89)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  if (entries.length < 7) {
    return { type: "insufficient", entries, needed: 7 - entries.length, confidence: "관찰 중" };
  }

  const heavyEntries = entries.filter((entry) => entry.weightValue >= 7);
  if (heavyEntries.length >= 3) {
    const intervals = heavyEntries.slice(1).map((entry, index) => daysBetweenDates(entry.parsedDate, heavyEntries[index].parsedDate));
    const cycleDays = Math.round(median(intervals));
    const consistentIntervals = intervals.filter((interval) => Math.abs(interval - cycleDays) <= 2).length;
    const consistency = consistentIntervals / intervals.length;
    if (cycleDays >= 3 && cycleDays <= 21 && consistency >= 0.6) {
      const lastHeavy = heavyEntries.at(-1);
      const daysSinceHeavy = daysBetweenDates(today, lastHeavy.parsedDate);
      const todayEntry = entries.find((entry) => entry.date === todayKey());
      const daysUntilExpected = Math.max(0, cycleDays - daysSinceHeavy);
      return {
        type: "interval",
        entries,
        cycleDays,
        daysSinceHeavy,
        daysUntilExpected,
        isNear: todayEntry?.weightValue >= 7 || daysUntilExpected <= 2,
        confidence: heavyEntries.length >= 4 ? "반복 확인" : "초기 패턴",
      };
    }
  }

  if (entries.length >= 10) {
    const weekdayGroups = Array.from({ length: 7 }, () => []);
    entries.forEach((entry) => weekdayGroups[entry.parsedDate.getDay()].push(entry.weightValue));
    const overallAverage = averageWeight(entries);
    const candidates = weekdayGroups
      .map((weights, day) => ({ day, count: weights.length, average: weights.length ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : 0 }))
      .filter((group) => group.count >= 2)
      .sort((a, b) => b.average - a.average);
    const heaviestWeekday = candidates[0];
    if (heaviestWeekday && heaviestWeekday.average - overallAverage >= 0.7) {
      return {
        type: "weekday",
        entries,
        weekday: heaviestWeekday.day,
        difference: heaviestWeekday.average - overallAverage,
        isToday: today.getDay() === heaviestWeekday.day,
        confidence: heaviestWeekday.count >= 3 ? "반복 확인" : "초기 패턴",
      };
    }
  }

  return { type: "observing", entries, confidence: "관찰 중" };
}

function getRecoveryAnalysis() {
  const recent30 = entriesByDaysAgo(0, 29);
  const recent7 = entriesByDaysAgo(0, 6);
  const previous7 = entriesByDaysAgo(7, 13);
  const recentAverage = averageWeight(recent7);
  const previousAverage = averageWeight(previous7);
  const difference = recentAverage !== null && previousAverage !== null ? recentAverage - previousAverage : null;
  const direction = difference === null
    ? "insufficient"
    : difference <= -0.5
      ? "lighter"
      : difference >= 0.5
        ? "heavier"
        : "steady";
  return {
    recent30,
    recent7,
    previous7,
    average30: averageWeight(recent30),
    lighterDays: recent30.filter((entry) => normalizeWeight(entry.weight) <= 3).length,
    difference,
    direction,
    cycle: analyzeMoodCycle(),
  };
}

function renderStats(analysis) {
  recordDaysStat.textContent = String(analysis.recent30.length);
  averageWeightStat.textContent = analysis.average30 === null ? "-" : analysis.average30.toFixed(1);
  lighterDaysStat.textContent = String(analysis.lighterDays);
  statsPeriod.textContent = `기록 ${analysis.recent30.length}일`;
  lighterDaysStat.parentElement.title = "마음 무게를 1~3으로 기록한 날";

  if (!analysis.recent30.length) {
    statsInsight.textContent = "첫 기록부터 내 마음의 기준선이 생겨요. 숫자는 평가가 아니라 흐름을 알아보는 단서예요.";
    return;
  }

  const moodCounts = analysis.recent30.reduce((counts, entry) => {
    counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    return counts;
  }, {});
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const moodLabelText = moodData[dominantMood]?.shortLabel || "여러 마음";
  statsInsight.textContent = `최근에는 ${moodLabelText}이 자주 보였고, ${analysis.lighterDays}일은 마음 무게가 1~3이었어요. 무거운 날도 회복 흐름을 이해하는 중요한 기록이에요.`;
}

function renderRecoveryTrend(analysis) {
  recoveryTrend.replaceChildren();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const accessibleDays = [];

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dateKeyFor(date);
    const entry = state.history.find((item) => item.date === key);
    const day = document.createElement("span");
    day.className = `trend-day${entry ? "" : " is-empty"}${offset === 0 ? " is-today" : ""}`;
    const track = document.createElement("i");
    track.className = "trend-bar-track";
    const bar = document.createElement("b");
    bar.className = "trend-bar";
    const label = document.createElement("small");
    label.textContent = offset === 0 ? "오늘" : new Intl.DateTimeFormat("ko-KR", { weekday: "narrow" }).format(date);

    if (entry) {
      const weight = normalizeWeight(entry.weight);
      const lightness = ((11 - weight) / 10) * 100;
      bar.style.setProperty("--trend-height", `${lightness}%`);
      day.classList.toggle("is-heavy", weight >= 7);
      day.title = `${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(date)}, 마음 무게 ${weight}`;
      accessibleDays.push(`${label.textContent} 무게 ${weight}`);
    } else {
      day.title = `${label.textContent}, 기록 없음`;
    }

    track.append(bar);
    day.append(track, label);
    recoveryTrend.append(day);
  }

  recoveryTrend.setAttribute("aria-label", accessibleDays.length ? `최근 14일 마음 무게: ${accessibleDays.join(", ")}` : "최근 14일 마음 기록 없음");
  if (analysis.direction === "lighter") {
    recoverySummary.textContent = `최근 7일의 평균 마음 무게가 이전 7일보다 ${Math.abs(analysis.difference).toFixed(1)} 가벼워졌어요. 작아 보여도 실제로 움직인 흐름이에요.`;
  } else if (analysis.direction === "heavier") {
    recoverySummary.textContent = `최근 7일은 이전보다 ${analysis.difference.toFixed(1)} 무거웠어요. 다시 무거워진 날도 실패가 아니라 회복 과정의 한 구간이에요.`;
  } else if (analysis.direction === "steady") {
    recoverySummary.textContent = "최근 2주는 큰 변화 없이 비슷한 무게로 이어졌어요. 버티며 유지한 것도 분명한 흐름이에요.";
  } else {
    recoverySummary.textContent = "두 주를 비교할 기록이 아직 부족해요. 오늘의 한 점부터 천천히 이어가요.";
  }
}

function renderCycleInsight(analysis) {
  const cycle = analysis.cycle;
  cycleTimeline.replaceChildren();
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const entry = state.history.find((item) => item.date === dateKeyFor(date));
    const marker = document.createElement("span");
    if (entry) marker.classList.add("has-entry");
    if (entry && normalizeWeight(entry.weight) >= 7) marker.classList.add("is-heavy");
    if (offset === 0) marker.classList.add("is-today");
    marker.title = entry ? `${dateKeyFor(date)} 마음 무게 ${entry.weight}` : `${dateKeyFor(date)} 기록 없음`;
    cycleTimeline.append(marker);
  }

  cycleConfidence.textContent = cycle.confidence;
  if (cycle.type === "interval") {
    cycleValue.textContent = `${cycle.cycleDays}일`;
    cycleValueLabel.textContent = "예상 간격";
    cycleTitle.textContent = cycle.isNear ? "오늘은 원래 돌아오던 흐름에 가까울 수 있어요" : "무거운 날도 일정한 간격으로 지나갔어요";
    cycleText.textContent = cycle.isNear
      ? `최근 기록에서 약 ${cycle.cycleDays}일 간격으로 무거운 날이 돌아왔어요. 지금의 마음이 이상해진 게 아니라 반복되는 파도일 수 있으니, 오늘은 해결보다 덜어내는 쪽을 골라도 괜찮아요.`
      : `최근에는 약 ${cycle.cycleDays}일마다 마음 무게 7~10인 날이 나타났어요. 기록상 다음 구간까지 약 ${cycle.daysUntilExpected}일로 보이지만, 확정된 예측은 아니에요.`;
  } else if (cycle.type === "weekday") {
    const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(new Date(2024, 0, 7 + cycle.weekday));
    cycleValue.textContent = weekday.slice(0, 1);
    cycleValueLabel.textContent = "무거운 요일";
    cycleTitle.textContent = cycle.isToday ? `${weekday}은 원래 조금 더 무거웠어요` : `${weekday}에 마음 무게가 자주 올라갔어요`;
    cycleText.textContent = cycle.isToday
      ? `최근 기록에서 ${weekday}의 마음 무게가 평소보다 ${cycle.difference.toFixed(1)} 높았어요. 오늘 힘든 건 의지가 약해서가 아니라 반복되는 생활 리듬의 영향일 수 있어요.`
      : `최근 기록에서는 ${weekday}의 마음 무게가 평소보다 ${cycle.difference.toFixed(1)} 높았어요. 그날의 일정이나 수면을 미리 가볍게 조정해볼 수 있어요.`;
  } else if (cycle.type === "observing") {
    cycleValue.textContent = `${cycle.entries.length}일`;
    cycleValueLabel.textContent = "기록한 날";
    cycleTitle.textContent = "아직 뚜렷한 주기는 없어요";
    cycleText.textContent = "오르내림이 불규칙하다는 것도 내 마음에 대한 정보예요. 조금 더 기록하며 요일과 간격을 함께 살펴볼게요.";
  } else {
    cycleValue.textContent = `${cycle.entries.length}일`;
    cycleValueLabel.textContent = "기록한 날";
    cycleTitle.textContent = "아직은 내 리듬을 알아가는 중이에요";
    cycleText.textContent = `${cycle.needed}일만 더 기록하면 반복되는 요일과 무거운 날의 간격을 살펴볼 수 있어요.`;
  }
}

function renderHomeRhythm(analysis) {
  const cycle = analysis.cycle;
  if ((cycle.type === "interval" && cycle.isNear) || (cycle.type === "weekday" && cycle.isToday)) {
    homeRhythmTitle.textContent = "오늘은 내 탓보다 익숙한 흐름에 가까워요";
    homeRhythmText.textContent = "기록에서 비슷한 날이 다시 보였어요. 오늘은 잘해내기보다 덜어내는 날로 보내도 괜찮아요.";
  } else if (analysis.direction === "lighter") {
    homeRhythmTitle.textContent = "조금씩 가벼워지는 흐름이에요";
    homeRhythmText.textContent = "최근 7일의 마음 무게가 이전보다 낮아졌어요. 서두르지 않아도 방향은 움직이고 있어요.";
  } else if (analysis.direction === "heavier") {
    homeRhythmTitle.textContent = "다시 무거운 구간도 회복의 일부예요";
    homeRhythmText.textContent = "회복은 곧은 선이 아니에요. 오늘의 무게도 지나가는 흐름 안에 조용히 남겨둘게요.";
  } else if (analysis.recent30.length) {
    homeRhythmTitle.textContent = "오르내림 속에서도 기록은 이어지고 있어요";
    homeRhythmText.textContent = "좋은 날만 회복은 아니에요. 내 마음을 알아챈 날들이 이미 하나의 리듬을 만들고 있어요.";
  } else {
    homeRhythmTitle.textContent = "첫 기록부터 내 리듬이 시작돼요";
    homeRhythmText.textContent = "며칠의 마음이 쌓이면 반복되는 흐름과 가벼워진 순간을 함께 찾아볼게요.";
  }
}

function renderRecoveryAnalytics() {
  const analysis = getRecoveryAnalysis();
  renderStats(analysis);
  renderRecoveryTrend(analysis);
  renderCycleInsight(analysis);
  renderHomeRhythm(analysis);
}

function renderMusic() {
  musicList.replaceChildren();
  moodData[state.mood].music.forEach((track, index) => {
    const button = document.createElement("button");
    button.className = "track";
    button.type = "button";
    button.dataset.trackIndex = String(index);
    button.dataset.playLabel = `${track.title}, ${track.detail} 재생`;
    button.setAttribute("aria-label", button.dataset.playLabel);

    const art = document.createElement("span");
    art.className = `track-art cover-${index}`;
    const title = document.createElement("strong");
    title.textContent = track.title;
    const detail = document.createElement("small");
    detail.textContent = track.detail;
    button.append(art, title, detail);
    musicList.append(button);
  });
}

function stopSoundscape() {
  audioNodes.forEach((node) => {
    try {
      if (typeof node.stop === "function") node.stop();
      if (typeof node.disconnect === "function") node.disconnect();
    } catch {
      // A node can already be stopped by the browser.
    }
  });
  audioNodes = [];
  activeTrackIndex = null;
  musicList.querySelectorAll(".track").forEach((button) => {
    button.classList.remove("is-playing");
    if (button.dataset.playLabel) button.setAttribute("aria-label", button.dataset.playLabel);
  });
  nowPlaying.textContent = "고르면 바로 재생돼요";
}

async function playSoundscape(index) {
  const track = moodData[state.mood].music[index];
  if (!track) return;

  if (!state.settings.sound) {
    showToast("설정에서 사운드를 켜면 들을 수 있어요");
    return;
  }

  if (activeTrackIndex === index) {
    stopSoundscape();
    return;
  }

  stopSoundscape();
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) {
    showToast("이 브라우저에서는 사운드 재생이 어려워요");
    return;
  }

  audioContext ||= new AudioEngine();
  await audioContext.resume();

  const master = audioContext.createGain();
  master.gain.value = 0.035;
  master.connect(audioContext.destination);
  audioNodes.push(master);

  track.notes.forEach((frequency, noteIndex) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();

    oscillator.type = noteIndex === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency / 2;
    gain.gain.value = noteIndex === 0 ? 0.22 : 0.1;
    lfo.type = "sine";
    lfo.frequency.value = 0.035 + noteIndex * 0.012;
    lfoGain.gain.value = 0.025;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    lfo.start();
    audioNodes.push(oscillator, gain, lfo, lfoGain);
  });

  if (track.type === "rain") {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) channel[i] = Math.random() * 2 - 1;

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const rainGain = audioContext.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    rainGain.gain.value = 0.16;
    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(master);
    noise.start();
    audioNodes.push(noise, filter, rainGain);
  }

  activeTrackIndex = index;
  const button = musicList.querySelector(`[data-track-index="${index}"]`);
  button?.classList.add("is-playing");
  button?.setAttribute("aria-label", `${track.title} 멈추기`);
  nowPlaying.textContent = `${track.title} 재생 중`;
}

function appendChat(role, text, { persist = true, typing = false } = {}) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}${typing ? " typing" : ""}`;
  bubble.textContent = text;
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;

  if (persist) {
    state.chat.push({ role, text, at: Date.now() });
    state.chat = state.chat.slice(-20);
    saveState();
  }
  return bubble;
}

function isHighRisk(text) {
  return /(죽고\s*싶|자살|자해|목숨|끝내고\s*싶|살기\s*싫|사라지고\s*싶|해치고\s*싶|버틸\s*수\s*없)/i.test(text);
}

function crisisReply() {
  return "지금 말해줘서 정말 고마워요. 혹시 지금 당장 자신을 해칠 위험이 있나요? 위험한 물건에서 떨어져 혼자 있지 말고, 가까운 사람에게 지금 위험하다고 알려 주세요. 대한민국에서는 24시간 자살예방 상담전화 109, 즉시 위험하면 112 또는 119로 바로 연결할 수 있어요.";
}

function setChatPending(isPending) {
  chatPending = isPending;
  chatSubmitButton.disabled = isPending;
  noteInput.setAttribute("aria-busy", String(isPending));
}

async function requestAiReply() {
  if (window.location.protocol === "file:") {
    throw new Error("AI 대화는 로컬 서버 주소에서 열어야 연결할 수 있어요.");
  }

  const messages = state.chat.slice(-10).map((entry) => ({
    role: entry.role === "user" ? "user" : "assistant",
    content: String(entry.text || "").slice(0, 800),
  }));

  const response = await apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      mood: state.mood,
      weight: state.weight,
    }),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // The status below still gives the user an actionable connection error.
  }

  if (!response.ok) {
    const error = new Error(payload.error || `AI 연결에 실패했어요. (${response.status})`);
    error.code = payload.code || "AI_REQUEST_FAILED";
    error.usage = payload.usage;
    error.account = payload.account;
    throw error;
  }
  if (!payload.reply) throw new Error("답변을 받지 못했어요. 잠시 후 다시 이야기해 주세요.");
  return payload;
}

function formatUsageMinutes(seconds) {
  const minutes = Math.max(0, Number(seconds) || 0) / 60;
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

function hasAiSubscription() {
  return Boolean(appConfig.voiceAvailable && appConfig.aiConfigured && appConfig.subscription?.active);
}

function renderSubscriptionUI() {
  const limits = appConfig.limits || {};
  const usage = appConfig.usage || {};
  const textLimit = Number(usage.text?.limit || limits.monthlyText || 30);
  const freeLimit = Number(limits.freeMonthlyText || appConfig.trialMessages || 30);
  const paidTextLimit = Number(limits.paidMonthlyText || 200);
  const voiceLimitMinutes = Number(limits.monthlyVoiceMinutes || 30);
  const voiceLimitSeconds = Number(usage.voice?.limitSeconds || voiceLimitMinutes * 60);
  const textUsed = Math.min(textLimit, Number(usage.text?.used || 0));
  const textRemaining = Math.max(0, Number(usage.text?.remaining ?? textLimit - textUsed));
  const voiceUsedSeconds = Math.min(voiceLimitSeconds, Number(usage.voice?.usedSeconds || 0) + Number(usage.voice?.reservedSeconds || 0));

  planBadge.textContent = appConfig.subscription?.active ? appConfig.planLabel || "마음친구 Plus" : "오픈 행사";
  planPrice.textContent = appConfig.priceLabel || "월 6,900원";
  planRenewalPrice.textContent = appConfig.subscriptionSalesOpen
    ? `${appConfig.renewalPriceLabel || "월 6,900원"} 정기 구독`
    : "지금은 결제 없이 무료로 시작해요";
  freeTextLimit.textContent = `${freeLimit}회 무료`;
  planTextLimit.textContent = `${paidTextLimit}회`;
  planVoiceLimit.textContent = appConfig.voiceAvailable ? `${voiceLimitMinutes}분` : "추후 오픈";
  planCallLimit.textContent = `${Number(limits.maxCallMinutes || 10)}분`;
  textUsageLabel.textContent = `${textUsed} / ${textLimit}회`;
  textUsageProgress.max = textLimit;
  textUsageProgress.value = textUsed;
  freeUsageInline.textContent = appConfig.subscription?.active
    ? `Plus 대화 ${textRemaining}회 남음`
    : textRemaining > 0
      ? `AI 대화 ${textRemaining}회 남음`
      : "이번 달 무료 대화 사용 완료";
  myPlanBadge.textContent = appConfig.subscription?.active ? appConfig.planLabel || "마음친구 Plus" : "오픈 행사";
  myPlanUsage.textContent = textRemaining > 0 ? `${textRemaining}회 남음` : "이번 달 사용 완료";
  myPlanProgress.max = textLimit;
  myPlanProgress.value = textUsed;
  voiceUsageLabel.textContent = `${formatUsageMinutes(voiceUsedSeconds)} / ${voiceLimitMinutes}분`;
  voiceUsageProgress.max = voiceLimitSeconds;
  voiceUsageProgress.value = voiceUsedSeconds;

  if (appConfig.subscription?.active) {
    subscriptionState.textContent = appConfig.subscription.status === "canceling" ? "해지 예정 · 기간까지 사용" : "Plus 사용 중";
    planStatus.textContent = "구독 중";
    menuPlanStatus.textContent = "마음친구 Plus 사용 중";
    myPlanStatus.textContent = appConfig.subscription.status === "canceling"
      ? "해지 예정이지만 현재 이용 기간까지 사용할 수 있어요."
      : "Plus 대화 이용량은 매달 다시 채워져요.";
    subscribeButton.disabled = !appConfig.billingPortalReady;
    subscribeButton.textContent = appConfig.billingPortalReady ? "구독 관리" : "Plus 사용 중";
    billingNote.textContent = appConfig.billingPortalReady
      ? `${appConfig.renewalPriceLabel || "월 6,900원"}이며, 결제수단 변경과 해지는 구독 관리에서 진행돼요.`
      : "구독 사용량은 매달 다시 채워져요.";
  } else {
    subscriptionState.textContent = textRemaining > 0 ? "오픈 행사 무료" : "무료 횟수 사용 완료";
    planStatus.textContent = `무료 ${textRemaining}회 남음`;
    menuPlanStatus.textContent = textRemaining > 0 ? `무료 대화 ${textRemaining}회 남음` : "무료 대화 사용 완료";
    myPlanStatus.textContent = textRemaining > 0
      ? "지금은 결제 없이 오픈 행사 무료 횟수를 이용할 수 있어요."
      : "이번 달 무료 횟수를 모두 사용했어요.";
    subscribeButton.disabled = !appConfig.subscriptionSalesOpen || !appConfig.billingReady;
    subscribeButton.textContent = appConfig.subscriptionSalesOpen && appConfig.billingReady
      ? `${appConfig.priceLabel || "월 6,900원"}으로 시작`
      : "월 6,900원 구독 준비 중";
    billingNote.textContent = textRemaining > 0
      ? `오픈 행사로 매달 ${freeLimit}회까지 무료예요. 모두 사용한 뒤 추가 대화에는 구독이 필요해요.`
      : "이번 달 무료 횟수를 모두 사용했어요. 추가 대화에는 구독이 필요하며, 결제 기능은 현재 준비 중이에요.";
  }
}

function renderAccountUI() {
  const account = appConfig.account || {};
  const providers = Array.isArray(account.providers) ? account.providers : [];
  const providerNames = providers.map((provider) => oauthProviderLabels[provider] || provider).filter(Boolean);
  const socialProviderNames = providers
    .filter((provider) => provider !== "email")
    .map((provider) => oauthProviderLabels[provider] || provider)
    .filter(Boolean);
  const accountName = account.emailMasked
    ? `${account.emailMasked}${socialProviderNames.length ? ` · ${socialProviderNames.join(" · ")}` : ""}`
    : (providerNames.length ? `${providerNames.join(" · ")} 계정` : "연결된 계정");
  const statusText = account.signedIn
    ? `${accountName}에 안전하게 연결됨`
    : appConfig.loginRequired
      ? "AI 무료 사용 전 계정 연결 필요"
      : "연결하면 기기를 바꿔도 사용량을 지킬 수 있어요";
  accountStatus.textContent = statusText;
  menuAccountStatus.textContent = account.signedIn
    ? `${accountName} 연결됨`
    : appConfig.loginRequired
      ? "계정 연결 필요"
      : "기기에서 사용 중";
  socialLoginPanel.hidden = Boolean(account.signedIn);
  accountLoginDivider.hidden = Boolean(account.signedIn);
  accountEmailForm.hidden = Boolean(account.signedIn);
  if (account.signedIn) accountCodeForm.hidden = true;
  linkedAccountPanel.hidden = !account.signedIn;
  linkedAccountLabel.textContent = accountName;

  let readyProviderCount = 0;
  socialLoginButtons.forEach((button) => {
    const providerKey = button.dataset.oauthProvider;
    const provider = appConfig.oauthProviders?.[providerKey];
    const ready = Boolean(provider?.ready);
    if (ready) readyProviderCount += 1;
    button.disabled = Boolean(account.signedIn) || !ready;
    button.title = ready ? `${provider?.label || oauthProviderLabels[providerKey]}로 계속하기` : `${provider?.label || oauthProviderLabels[providerKey]} 로그인 준비 중`;
  });
  socialLoginHint.textContent = readyProviderCount
    ? "마음 기록은 보내지 않고 계정 확인에 필요한 정보만 받아요."
    : "배포 서버에 간편로그인 키를 연결하면 바로 사용할 수 있어요.";

  const requestButton = accountEmailForm.querySelector("button");
  requestButton.disabled = !appConfig.authEmailReady;
  requestButton.textContent = appConfig.authEmailReady ? "인증번호 받기" : "이메일 연결 준비 중";
  reviewConsentLabel.textContent = account.consentValid ? "동의 내용 확인 · 완료" : "AI 대화 동의 확인";
  reviewConsentButton.dataset.complete = String(Boolean(account.consentValid));
}

function openConsentReview() {
  const accepted = Boolean(appConfig.account?.consentValid);
  [ageConsent, termsConsent, sensitiveConsent, overseasConsent].forEach((input) => { input.checked = accepted; });
  consentError.hidden = true;
  consentError.textContent = "";
  openDialog(consentDialog);
}

async function loadAppConfig() {
  if (window.location.protocol === "file:") {
    appConfig.authEmailReady = false;
    planStatus.textContent = "로컬 서버 필요";
    menuPlanStatus.textContent = "서버 연결 필요";
    myPlanStatus.textContent = "로컬 서버 주소에서 열면 사용량을 확인할 수 있어요.";
    voiceStatus.textContent = "통화는 로컬 서버에서 연결할 수 있어요.";
    voiceCallButton.disabled = true;
    subscribeButton.disabled = true;
    subscribeButton.textContent = "서버에서 연결해 주세요";
    renderAccountUI();
    accountStatus.textContent = "로컬 서버 주소에서 계정을 연결할 수 있어요";
    return;
  }

  try {
    const response = await apiFetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("설정을 읽지 못했어요.");
    appConfig = { ...appConfig, ...(await response.json()) };
  } catch {
    appConfig.authEmailReady = false;
    Object.values(appConfig.oauthProviders || {}).forEach((provider) => { provider.ready = false; });
    planStatus.textContent = "연결 확인 필요";
    menuPlanStatus.textContent = "연결 확인 필요";
    myPlanStatus.textContent = "서버 연결 상태를 확인해 주세요.";
    voiceStatus.textContent = "서버 연결 상태를 확인해 주세요.";
    voiceCallButton.disabled = true;
    subscribeButton.disabled = true;
    subscribeButton.textContent = "연결 확인 필요";
    renderAccountUI();
    accountStatus.textContent = "서버 연결 상태를 확인해 주세요";
    menuAccountStatus.textContent = "서버 연결 확인 필요";
    if (!appConfig.account?.signedIn) socialLoginHint.textContent = "서버에 연결되면 간편로그인을 사용할 수 있어요.";
    return;
  }

  renderSubscriptionUI();
  renderAccountUI();
  voiceCallButton.disabled = !appConfig.voiceAvailable || !appConfig.aiConfigured;
  voiceCallButton.querySelector("span").textContent = appConfig.voiceAvailable ? "통화 시작" : "추후 오픈";
  voicePersonaButtons.forEach((button) => { button.disabled = !appConfig.voiceAvailable; });
  const selectedPersona = voicePersonaData[state.voicePersona] || voicePersonaData.counselor_female;
  voiceStatus.textContent = !appConfig.voiceAvailable
    ? "비용과 품질을 충분히 확인한 뒤 열 예정이에요."
    : !appConfig.aiConfigured
    ? "서버에 AI 연결을 설정하면 통화를 시작할 수 있어요."
    : appConfig.subscription?.active
      ? `${selectedPersona.name} 목소리로 이야기할 준비가 됐어요.`
      : "마음친구 Plus를 구독하면 목소리 통화가 열려요.";
}

async function handleBillingReturn() {
  const billingResult = new URLSearchParams(window.location.search).get("billing");
  if (!billingResult) return;
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  openDialog(subscriptionDialog);
  if (billingResult === "cancel") {
    showToast("결제를 취소했어요. 청구된 금액은 없어요");
    return;
  }
  if (billingResult !== "success") return;
  if (appConfig.subscription?.active) {
    showToast("마음친구 Plus가 열렸어요");
    return;
  }

  subscriptionState.textContent = "결제 확인 중";
  billingNote.textContent = "결제사 확인이 도착하면 구독 AI 대화가 자동으로 열려요.";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
    try {
      const response = await apiFetch("/api/config", { cache: "no-store" });
      if (!response.ok) continue;
      appConfig = { ...appConfig, ...(await response.json()) };
      renderSubscriptionUI();
      if (appConfig.subscription?.active) {
        showToast("마음친구 Plus가 열렸어요");
        return;
      }
    } catch {
      // Keep polling briefly while the payment provider delivers its webhook.
    }
  }
  subscriptionState.textContent = "결제 확인 대기 중";
  billingNote.textContent = "결제 완료 후 반영까지 잠시 걸릴 수 있어요. 앱을 다시 열면 자동으로 확인해요.";
}

function oauthResultMessage(result, providerKey) {
  const providerName = oauthProviderLabels[providerKey] || "간편";
  if (result === "cancel") return `${providerName} 로그인을 취소했어요`;
  if (result === "conflict") return `이 ${providerName} 계정은 다른 마음친구 계정에 연결되어 있어요`;
  if (result === "unavailable") return `${providerName} 로그인이 잠시 원활하지 않아요`;
  return `${providerName} 로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요`;
}

function preferredLoginFocusTarget() {
  return socialLoginButtons.find((button) => !button.disabled) || accountEmail;
}

async function startSocialLogin(providerKey) {
  const provider = appConfig.oauthProviders?.[providerKey];
  const button = socialLoginButtons.find((candidate) => candidate.dataset.oauthProvider === providerKey);
  if (!provider?.ready || !button) {
    showToast(`${provider?.label || oauthProviderLabels[providerKey] || "간편"} 로그인을 준비 중이에요`);
    return;
  }

  lastOAuthCallbackKey = "";
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    const response = await apiFetch(`/api/auth/oauth/${providerKey}/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ native: isNativeApp }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.startUrl) throw new Error(payload.error || "로그인을 시작하지 못했어요.");

    if (isNativeApp) {
      const browser = window.Capacitor?.Plugins?.Browser;
      if (typeof browser?.open !== "function") throw new Error("안전한 로그인 브라우저를 열지 못했어요.");
      await browser.open({ url: payload.startUrl, toolbarColor: "#fff8ed" });
      return;
    }
    window.location.assign(payload.startUrl);
  } catch (error) {
    showToast(error.message || "간편로그인 연결을 확인해 주세요");
  } finally {
    button.removeAttribute("aria-busy");
    renderAccountUI();
  }
}

async function handleOAuthReturn() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get("auth");
  if (!result) return;
  const providerKey = url.searchParams.get("provider") || "";
  url.searchParams.delete("auth");
  url.searchParams.delete("provider");
  url.searchParams.delete("code");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  showView("mypage");
  if (result === "success") {
    await loadAppConfig();
    showToast(`${oauthProviderLabels[providerKey] || "간편"} 계정으로 연결했어요`);
    return;
  }
  showToast(oauthResultMessage(result, providerKey));
}

async function handleOAuthDeepLink(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    return false;
  }
  if (url.protocol !== "com.blanketheart.maumfriend:" || url.hostname !== "auth" || url.pathname !== "/callback") return false;

  const result = url.searchParams.get("auth") || "error";
  const providerKey = url.searchParams.get("provider") || "";
  const code = url.searchParams.get("code") || "";
  const callbackKey = `${result}:${providerKey}:${code}`;
  if (oauthCallbackPending || callbackKey === lastOAuthCallbackKey) return true;
  oauthCallbackPending = true;
  lastOAuthCallbackKey = callbackKey;
  await Promise.resolve(window.Capacitor?.Plugins?.Browser?.close?.()).catch(() => {});

  try {
    if (result !== "success" || !code) {
      showView("mypage");
      showToast(oauthResultMessage(result, providerKey));
      return true;
    }
    const response = await apiFetch("/api/auth/oauth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.account) throw new Error(payload.error || "앱 로그인을 완료하지 못했어요.");
    appConfig.account = payload.account;
    await loadAppConfig();
    showView("mypage");
    showToast(`${oauthProviderLabels[providerKey] || "간편"} 계정으로 연결했어요`);
    return true;
  } catch (error) {
    showView("mypage");
    showToast(error.message || "앱 로그인을 완료하지 못했어요");
    return true;
  } finally {
    oauthCallbackPending = false;
  }
}

async function logoutAccount() {
  if (!appConfig.account?.signedIn) return;
  logoutAccountButton.disabled = true;
  try {
    const response = await apiFetch("/api/auth/logout", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "로그아웃하지 못했어요.");
    appConfig.account = payload.account || { signedIn: false, emailMasked: null, providers: [], consentValid: false, consent: null };
    await loadAppConfig();
    showToast("로그아웃했어요. 이 기기의 마음 기록은 그대로 남아 있어요");
  } catch (error) {
    showToast(error.message || "로그아웃 연결을 확인해 주세요");
  } finally {
    logoutAccountButton.disabled = false;
    renderAccountUI();
  }
}

async function requestAccountCode() {
  const email = accountEmail.value.trim();
  const button = accountEmailForm.querySelector("button");
  button.disabled = true;
  button.textContent = "보내는 중";
  try {
    const response = await apiFetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "인증번호를 보내지 못했어요.");
    accountCodeForm.hidden = false;
    accountCodeHint.textContent = payload.developmentCode
      ? `개발 확인용 인증번호: ${payload.developmentCode}`
      : `${payload.emailMasked}로 보냈어요. ${payload.expiresMinutes}분 안에 입력해 주세요.`;
    if (payload.developmentCode) accountCode.value = payload.developmentCode;
    accountCode.focus();
    showToast("인증번호를 보냈어요");
  } catch (error) {
    showToast(error.message || "이메일 연결을 확인해 주세요");
  } finally {
    button.disabled = !appConfig.authEmailReady;
    button.textContent = "인증번호 받기";
  }
}

async function verifyAccountCode() {
  const button = accountCodeForm.querySelector("button");
  button.disabled = true;
  button.textContent = "확인 중";
  try {
    const response = await apiFetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: accountEmail.value.trim(), code: accountCode.value.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "인증번호를 확인하지 못했어요.");
    appConfig.account = payload.account;
    renderAccountUI();
    accountCodeForm.hidden = true;
    showToast(payload.restored ? "기존 마음친구 계정을 불러왔어요" : "이메일 계정을 연결했어요");
    await loadAppConfig();
  } catch (error) {
    showToast(error.message || "인증번호를 다시 확인해 주세요");
  } finally {
    button.disabled = false;
    button.textContent = "계정 연결";
  }
}

async function saveConsent() {
  const accepted = ageConsent.checked && termsConsent.checked && sensitiveConsent.checked && overseasConsent.checked;
  if (!accepted) {
    consentError.textContent = "필수 항목을 각각 확인해 주세요.";
    consentError.hidden = false;
    return;
  }
  const button = consentForm.querySelector('[type="submit"]');
  button.disabled = true;
  button.textContent = "동의 저장 중";
  try {
    const response = await apiFetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        termsAccepted: true,
        sensitiveAccepted: true,
        ageConfirmed: true,
        overseasTransferAccepted: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "동의 내용을 저장하지 못했어요.");
    appConfig.account = payload.account;
    renderAccountUI();
    closeDialog(consentDialog);
    showToast("동의 내용을 안전하게 저장했어요");
  } catch (error) {
    consentError.textContent = error.message || "서버 연결을 확인해 주세요.";
    consentError.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "동의하고 AI 대화 시작";
  }
}

async function exportAccountData() {
  let serverData = null;
  let serverNotice = null;
  try {
    const response = await apiFetch("/api/account/export", { cache: "no-store" });
    if (!response.ok) throw new Error("서버 데이터를 불러오지 못했어요.");
    serverData = await response.json();
  } catch (error) {
    serverNotice = error.message || "서버에 연결되지 않아 기기 데이터만 포함했어요.";
  }

  try {
    const exportedAt = new Date().toISOString();
    const exportData = {
      schemaVersion: 1,
      exportedAt,
      localDeviceData: JSON.parse(JSON.stringify(state)),
      serverAccountData: serverData,
      serverNotice,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maum-friend-data-${exportedAt.slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(serverNotice ? "기기 데이터를 파일로 준비했어요" : "기기와 서버 데이터를 함께 준비했어요");
  } catch (error) {
    showToast(error.message || "데이터 내보내기를 확인해 주세요");
  }
}

function handleAccountDeleteLaunch() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("account") !== "delete") return;
  url.searchParams.delete("account");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  renderAccountUI();
  showView("mypage");
  const focusTarget = appConfig.account?.signedIn ? deleteAccountButton : preferredLoginFocusTarget();
  window.setTimeout(() => focusTarget?.focus(), 80);
}

async function deleteServerAccount() {
  if (!window.confirm("서버에 저장된 계정, 동의, 사용량을 모두 삭제할까요? 이 기기의 마음 기록은 별도로 남아 있어요.")) return;
  try {
    const response = await apiFetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (!response.ok) throw new Error("서버 데이터를 삭제하지 못했어요.");
    nativeSessionToken = "";
    localStorage.removeItem(NATIVE_SESSION_KEY);
    appConfig.account = { signedIn: false, emailMasked: null, providers: [], consentValid: false, consent: null };
    renderAccountUI();
    showToast("서버의 계정과 사용량을 삭제했어요");
    await loadAppConfig();
  } catch (error) {
    showToast(error.message || "계정 삭제를 확인해 주세요");
  }
}

async function startSubscriptionCheckout() {
  if (appConfig.subscription?.active) {
    if (!appConfig.billingPortalReady) {
      showToast("이미 마음친구 Plus를 사용 중이에요");
      return;
    }
    subscribeButton.disabled = true;
    subscribeButton.textContent = "구독 관리 여는 중";
    try {
      const response = await apiFetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "구독 관리 화면을 열지 못했어요.");
      window.location.assign(payload.url);
    } catch (error) {
      showToast(error.message || "구독 관리 연결을 확인해 주세요");
      renderSubscriptionUI();
    }
    return;
  }
  if (!appConfig.subscriptionSalesOpen) {
    showToast("월 6,900원 구독은 준비 중이에요. 지금은 무료 대화를 이용해 주세요");
    return;
  }
  if (!appConfig.billingReady) {
    showToast("결제사 계약과 서버 키 연결이 먼저 필요해요");
    return;
  }
  subscribeButton.disabled = true;
  subscribeButton.textContent = "안전한 결제창 여는 중";
  try {
    const response = await apiFetch("/api/billing/checkout", { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.url) throw new Error(payload.error || "결제창을 열지 못했어요.");
    window.location.assign(payload.url);
  } catch (error) {
    showToast(error.message || "결제 연결을 확인해 주세요");
    renderSubscriptionUI();
  }
}

function setVoicePersona(persona, { persist = true } = {}) {
  const data = voicePersonaData[persona];
  if (!data) return;
  if (voicePeerConnection || voicePanel.dataset.callState === "connecting") {
    showToast("통화를 마친 뒤 역할과 목소리를 바꿀 수 있어요");
    return;
  }
  state.voicePersona = persona;
  voicePersonaButtons.forEach((button) => {
    const isActive = button.dataset.persona === persona;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
  personaName.textContent = data.name;
  personaDescription.textContent = data.description;
  voicePartnerName.textContent = data.partner;
  voiceStatus.textContent = hasAiSubscription()
    ? `${data.name} 목소리로 이야기할 준비가 됐어요.`
    : "통화 기능은 비용과 품질을 확인한 뒤 열 예정이에요.";
  if (persist) saveState();
}

function setVoiceState(callState, status) {
  if (!appConfig.voiceAvailable) {
    voicePanel.dataset.callState = "idle";
    voiceCallButton.setAttribute("aria-pressed", "false");
    voiceCallButton.disabled = true;
    voiceCallButton.querySelector("span").textContent = "추후 오픈";
    voicePersonaButtons.forEach((button) => { button.disabled = true; });
    voiceStatus.textContent = "통화 기능은 비용과 품질을 확인한 뒤 열 예정이에요.";
    voiceTimer.hidden = true;
    return;
  }
  const active = callState === "active";
  const connecting = callState === "connecting";
  voicePanel.dataset.callState = callState;
  voiceCallButton.setAttribute("aria-pressed", String(active));
  voiceCallButton.disabled = connecting || (!active && !appConfig.aiConfigured);
  voiceCallButton.querySelector("span").textContent = active ? "통화 종료" : connecting ? "연결 중" : "통화 시작";
  voicePersonaButtons.forEach((button) => { button.disabled = active || connecting; });
  voiceStatus.textContent = status;
  if (!active) voiceTimer.hidden = true;
}

function waitForIceGathering(peerConnection) {
  if (peerConnection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    };
    const handleStateChange = () => {
      if (peerConnection.iceGatheringState === "complete") finish();
    };
    const timeout = setTimeout(finish, 4000);
    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

function reportVoiceReservation({ keepalive = false } = {}) {
  if (!voiceReservationId) return;
  const reservationId = voiceReservationId;
  const seconds = Math.min(
    voiceMaxSeconds,
    Math.max(1, Math.ceil(voiceStartedAt ? (Date.now() - voiceStartedAt) / 1000 : 1)),
  );
  voiceReservationId = "";
  voiceMaxSeconds = Number(appConfig.limits?.maxCallMinutes || 10) * 60;
  apiFetch("/api/voice/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reservationId, seconds }),
    keepalive,
  }).then(async (response) => {
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.usage) {
      appConfig.usage = payload.usage;
      renderSubscriptionUI();
    }
  }).catch(() => {});
}

function stopVoiceCall(status = "통화를 마쳤어요. 필요할 때 다시 이야기해요.") {
  voiceSessionVersion += 1;
  voiceAbortController?.abort();
  voiceAbortController = null;
  reportVoiceReservation();
  clearInterval(voiceTimerInterval);
  voiceTimerInterval = null;
  voiceLocalStream?.getTracks().forEach((track) => track.stop());
  voiceLocalStream = null;
  if (voicePeerConnection) {
    voicePeerConnection.ontrack = null;
    voicePeerConnection.onconnectionstatechange = null;
    voicePeerConnection.close();
  }
  voicePeerConnection = null;
  remoteAudio.srcObject = null;
  voiceStartedAt = 0;
  setVoiceState("idle", status);
}

function startVoiceTimer() {
  voiceStartedAt = Date.now();
  voiceTimer.hidden = false;
  const update = () => {
    const seconds = Math.floor((Date.now() - voiceStartedAt) / 1000);
    if (seconds >= voiceMaxSeconds) {
      const allowedMinutes = Math.max(1, Math.ceil(voiceMaxSeconds / 60));
      stopVoiceCall(`이번 통화에 가능한 ${allowedMinutes}분을 모두 사용했어요. 잠시 쉬었다가 다시 이어가요.`);
      showToast(`이번 통화 가능 시간 ${allowedMinutes}분에 도달했어요`);
      return;
    }
    voiceTimer.textContent = formatSeconds(seconds);
    voiceTimer.dateTime = `PT${seconds}S`;
  };
  update();
  voiceTimerInterval = setInterval(update, 1000);
}

async function startVoiceCall() {
  if (!appConfig.voiceAvailable) {
    showToast("목소리 통화는 비용과 품질을 확인한 뒤 열 예정이에요");
    return;
  }
  if (!appConfig.subscription?.active) {
    openDialog(subscriptionDialog);
    showToast("AI 통화는 마음친구 Plus 구독 후 사용할 수 있어요");
    return;
  }
  if (!appConfig.aiConfigured) {
    showToast("서버에 AI 연결을 먼저 설정해 주세요");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
    showToast("이 브라우저에서는 음성 통화를 사용할 수 없어요");
    return;
  }

  const selectedPersona = voicePersonaData[state.voicePersona] || voicePersonaData.counselor_female;
  const sessionVersion = ++voiceSessionVersion;
  setVoiceState("connecting", `${selectedPersona.name} 목소리를 연결하고 있어요.`);

  try {
    voiceLocalStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (sessionVersion !== voiceSessionVersion) {
      voiceLocalStream.getTracks().forEach((track) => track.stop());
      voiceLocalStream = null;
      return;
    }

    const peerConnection = new RTCPeerConnection();
    voicePeerConnection = peerConnection;
    const remoteStream = new MediaStream();
    remoteAudio.srcObject = remoteStream;
    peerConnection.ontrack = (event) => {
      if (!remoteStream.getTracks().some((track) => track.id === event.track.id)) remoteStream.addTrack(event.track);
    };
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "failed") {
        stopVoiceCall("통화 연결이 끊겼어요. 잠시 후 다시 시도해 주세요.");
      }
    };
    voiceLocalStream.getTracks().forEach((track) => peerConnection.addTrack(track, voiceLocalStream));
    peerConnection.createDataChannel("oai-events");

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await waitForIceGathering(peerConnection);
    if (sessionVersion !== voiceSessionVersion) return;

    voiceAbortController = new AbortController();
    const response = await apiFetch("/api/realtime-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdp: peerConnection.localDescription.sdp, persona: state.voicePersona }),
      signal: voiceAbortController.signal,
    });
    voiceAbortController = null;
    if (sessionVersion !== voiceSessionVersion) return;

    if (!response.ok) {
      let message = "음성 통화를 연결하지 못했어요.";
      let errorCode = "VOICE_CONNECTION_FAILED";
      let errorUsage = null;
      try {
        const payload = await response.json();
        message = payload.error || message;
        errorCode = payload.code || errorCode;
        errorUsage = payload.usage || null;
      } catch {
        // Keep the friendly default error when the upstream returns plain text.
      }
      const connectionError = new Error(message);
      connectionError.code = errorCode;
      connectionError.usage = errorUsage;
      throw connectionError;
    }

    voiceReservationId = response.headers.get("X-Voice-Reservation") || "";
    voiceMaxSeconds = Math.max(60, Number(response.headers.get("X-Voice-Max-Seconds")) || Number(appConfig.limits?.maxCallMinutes || 10) * 60);
    const answerSdp = await response.text();
    await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
    await remoteAudio.play().catch(() => {});
    setVoiceState("active", `${selectedPersona.name}와 연결됐어요. 급하지 않게 말해도 괜찮아요.`);
    startVoiceTimer();
  } catch (error) {
    voiceAbortController = null;
    if (sessionVersion !== voiceSessionVersion) return;
    const permissionDenied = error?.name === "NotAllowedError";
    stopVoiceCall(permissionDenied
      ? "마이크 권한이 없어 통화를 시작하지 못했어요."
      : error?.message || "음성 통화를 연결하지 못했어요.");
    if (error?.usage) {
      appConfig.usage = error.usage;
      renderSubscriptionUI();
    }
    if (error?.code === "SUBSCRIPTION_REQUIRED" || String(error?.code).includes("LIMIT_REACHED")) openDialog(subscriptionDialog);
    showToast(permissionDenied ? "마이크 권한을 허용해야 통화할 수 있어요" : "통화 연결을 확인해 주세요");
  }
}

function autoGrowNote() {
  noteInput.style.height = "auto";
  noteInput.style.height = `${Math.min(noteInput.scrollHeight, 110)}px`;
}

function updateBreathIcon(isRunning) {
  const use = breathStart.querySelector("use");
  use?.setAttribute("href", isRunning ? "#icon-pause" : "#icon-play");
  breathStart.setAttribute("aria-label", isRunning ? "호흡 잠시 멈추기" : "호흡 시작");
}

function formatSeconds(seconds) {
  const rounded = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
}

function updatePrescriptionTimerUI(isRunning = Boolean(prescriptionTimerInterval)) {
  prescriptionTime.textContent = formatSeconds(prescriptionSecondsLeft);
  const use = prescriptionTimerButton.querySelector("use");
  const label = prescriptionTimerButton.querySelector("span");
  use?.setAttribute("href", isRunning ? "#icon-pause" : "#icon-play");
  label.textContent = isRunning
    ? "멈춤"
    : prescriptionSecondsLeft <= 0
      ? "다시"
      : prescriptionSecondsLeft < 300
        ? "계속"
        : "시작";
  prescriptionTimerButton.setAttribute("aria-label", isRunning ? "5분 처방 타이머 잠시 멈추기" : "5분 처방 타이머 시작");
}

function finishPrescriptionTimer() {
  clearInterval(prescriptionTimerInterval);
  prescriptionTimerInterval = null;
  prescriptionSecondsLeft = 0;
  ensureTodayCare();
  if (!state.care.completed.includes(currentCareKey())) {
    state.care.completed.push(currentCareKey());
    saveState();
    updateCareUI();
  }
  updatePrescriptionTimerUI(false);
  friendMessage.textContent = "5분을 온전히 나에게 내어줬어요. 충분히 해낸 작은 돌봄이에요.";
  showToast("5분 처방을 마쳤어요");
}

function startOrPausePrescriptionTimer() {
  if (prescriptionTimerInterval) {
    prescriptionSecondsLeft = Math.max(0, prescriptionStartRemaining - (Date.now() - prescriptionStartedAt) / 1000);
    clearInterval(prescriptionTimerInterval);
    prescriptionTimerInterval = null;
    updatePrescriptionTimerUI(false);
    return;
  }

  if (prescriptionSecondsLeft <= 0) prescriptionSecondsLeft = 300;
  prescriptionStartRemaining = prescriptionSecondsLeft;
  prescriptionStartedAt = Date.now();
  updatePrescriptionTimerUI(true);
  prescriptionTimerInterval = setInterval(() => {
    prescriptionSecondsLeft = Math.max(0, prescriptionStartRemaining - (Date.now() - prescriptionStartedAt) / 1000);
    if (prescriptionSecondsLeft <= 0) finishPrescriptionTimer();
    else updatePrescriptionTimerUI(true);
  }, 200);
}

function resetPrescriptionTimer() {
  clearInterval(prescriptionTimerInterval);
  prescriptionTimerInterval = null;
  prescriptionSecondsLeft = 300;
  prescriptionStartRemaining = 300;
  updatePrescriptionTimerUI(false);
}

function updateSafetyTimerButton(isRunning) {
  const use = safetyDelayButton.querySelector("use");
  const label = safetyDelayButton.querySelector("span");
  use?.setAttribute("href", isRunning ? "#icon-pause" : "#icon-play");
  label.textContent = isRunning
    ? "잠시 멈추기"
    : safetySecondsLeft < 600 && safetySecondsLeft > 0
      ? "계속 버티기"
      : safetySecondsLeft <= 0
        ? "다시 10분 버티기"
        : "10분만 미루기";
}

function updateSafetyTimerDisplay() {
  safetyCountdown.hidden = false;
  safetyTime.textContent = formatSeconds(safetySecondsLeft);
}

function finishSafetyTimer() {
  clearInterval(safetyTimerInterval);
  safetyTimerInterval = null;
  safetySecondsLeft = 0;
  updateSafetyTimerButton(false);
  updateSafetyTimerDisplay();
  safetyTimerCopy.textContent = "10분을 버텼어요. 아직 위험하다면 지금 109, 112 또는 119로 바로 연결해요.";
  showToast("10분을 버텼어요. 이제 사람과 바로 연결해요");
}

function startOrPauseSafetyTimer() {
  if (safetyTimerInterval) {
    safetySecondsLeft = Math.max(0, safetyStartRemaining - (Date.now() - safetyStartedAt) / 1000);
    clearInterval(safetyTimerInterval);
    safetyTimerInterval = null;
    updateSafetyTimerButton(false);
    updateSafetyTimerDisplay();
    safetyTimerCopy.textContent = "멈춰 있어도 괜찮아요. 혼자 있지 말고 사람과 연결을 이어가요.";
    return;
  }

  if (safetySecondsLeft <= 0) safetySecondsLeft = 600;
  safetyStartRemaining = safetySecondsLeft;
  safetyStartedAt = Date.now();
  safetyTimerCopy.textContent = "타이머가 가는 동안 109나 가까운 사람과 연결해요.";
  updateSafetyTimerButton(true);
  updateSafetyTimerDisplay();

  safetyTimerInterval = setInterval(() => {
    safetySecondsLeft = Math.max(0, safetyStartRemaining - (Date.now() - safetyStartedAt) / 1000);
    if (safetySecondsLeft <= 0) finishSafetyTimer();
    else updateSafetyTimerDisplay();
  }, 200);
}

function fallbackCopy(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy failed");
}

async function copyHelpMessage() {
  const message = "지금 혼자 있으면 위험할 것 같아. 판단하거나 해결하려 하지 말고, 전화하거나 와서 잠시 같이 있어줄 수 있어?";
  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        fallbackCopy(message);
      }
    } else {
      fallbackCopy(message);
    }
    showToast("도움을 요청하는 문장을 복사했어요");
  } catch {
    showToast("복사하지 못했어요. 가까운 사람에게 지금 위험하다고 바로 말해 주세요");
  }
}

function updateBreathDisplay() {
  const elapsed = totalBreathSeconds - breathSecondsLeft;
  const cycle = elapsed % 12;
  let phase = { key: "inhale", text: "4초 동안 들이쉬어요" };
  if (cycle >= 4 && cycle < 6) phase = { key: "hold", text: "잠시 머물러요" };
  if (cycle >= 6) phase = { key: "exhale", text: "6초 동안 내쉬어요" };

  breathTime.textContent = formatSeconds(breathSecondsLeft);
  breathPhase.textContent = breathInterval ? phase.text : breathSecondsLeft === totalBreathSeconds ? "준비되면 시작해요" : "잠시 쉬어가도 괜찮아요";
  breathStage.dataset.phase = breathInterval ? phase.key : "ready";
  const progress = totalBreathSeconds > 0 ? (elapsed / totalBreathSeconds) * 360 : 0;
  breathStage.style.setProperty("--progress", `${Math.max(0, progress)}deg`);
}

function pauseBreathing() {
  if (!breathInterval) return;
  breathSecondsLeft = Math.max(0, breathStartRemaining - (Date.now() - breathStartedAt) / 1000);
  clearInterval(breathInterval);
  breathInterval = null;
  updateBreathIcon(false);
  updateBreathDisplay();
}

function completeBreathing() {
  clearInterval(breathInterval);
  breathInterval = null;
  breathSecondsLeft = 0;
  breathTime.textContent = "00:00";
  breathPhase.textContent = "잘했어요. 지금 숨이 여기 있어요";
  breathStage.dataset.phase = "complete";
  breathStage.style.setProperty("--progress", "360deg");
  updateBreathIcon(false);
  state.breathingSessions += 1;
  saveState();
  friendMessage.textContent = `${selectedMinutes}분 동안 나를 돌본 것도 분명한 회복이에요. 정말 잘했어요.`;
  showToast("숨 고르기를 잘 마쳤어요");
}

function startOrPauseBreathing() {
  if (breathInterval) {
    pauseBreathing();
    return;
  }

  if (breathSecondsLeft <= 0) resetBreathing();
  breathStartRemaining = breathSecondsLeft;
  breathStartedAt = Date.now();
  updateBreathIcon(true);
  breathInterval = setInterval(() => {
    breathSecondsLeft = Math.max(0, breathStartRemaining - (Date.now() - breathStartedAt) / 1000);
    if (breathSecondsLeft <= 0) completeBreathing();
    else updateBreathDisplay();
  }, 150);
  updateBreathDisplay();
}

function resetBreathing() {
  clearInterval(breathInterval);
  breathInterval = null;
  totalBreathSeconds = selectedMinutes * 60;
  breathSecondsLeft = totalBreathSeconds;
  breathStartRemaining = totalBreathSeconds;
  updateBreathIcon(false);
  updateBreathDisplay();
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function usesDarkTheme() {
  return state.settings.themeMode === "dark"
    || (state.settings.themeMode === "system" && Boolean(systemThemeQuery?.matches));
}

async function syncPlatformTheme(darkMode = usesDarkTheme()) {
  if (!isNativeApp) return;
  const statusBar = window.Capacitor?.Plugins?.StatusBar;
  if (!statusBar) return;
  const backgroundColor = darkMode ? "#222b38" : "#fff8ed";
  await statusBar.setStyle({ style: "LIGHT" }).catch(() => {});
  await statusBar.setBackgroundColor({ color: backgroundColor }).catch(() => {});
}

function applySettings() {
  state.settings.themeMode = normalizeThemeMode(state.settings);
  state.settings.titleFont = normalizeTitleFont(state.settings);
  const darkMode = usesDarkTheme();
  const titleFont = TITLE_FONT_OPTIONS[state.settings.titleFont];
  motionToggle.checked = state.settings.motion;
  soundToggle.checked = state.settings.sound;
  if (titleFontSelect) titleFontSelect.value = state.settings.titleFont;
  themeModeButtons.forEach((button) => {
    const isActive = button.dataset.themeMode === state.settings.themeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
  document.body.classList.toggle("reduced-motion", !state.settings.motion);
  document.body.classList.toggle("dark-theme", darkMode);
  document.body.dataset.themeMode = state.settings.themeMode;
  document.body.dataset.titleFont = state.settings.titleFont;
  document.documentElement.style.setProperty("--font-title", titleFont.family);
  document.documentElement.style.setProperty("--font-title-weight", titleFont.weight);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  themeColorMeta?.setAttribute("content", darkMode ? "#222b38" : "#fff8ed");
  syncPlatformTheme(darkMode);
}

function setHelpPath(path, { focus = false } = {}) {
  const selectedButton = helpPathButtons.find((button) => button.dataset.helpPath === path);
  if (!selectedButton) return;
  helpPathButtons.forEach((button) => {
    const isActive = button === selectedButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
  helpPathPanels.forEach((panel) => {
    const isActive = panel.dataset.helpPanel === path;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
  if (focus) selectedButton.focus();
}

async function copySupportPhrase(key) {
  const message = supportPhrases[key];
  if (!message) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        fallbackCopy(message);
      }
    } else {
      fallbackCopy(message);
    }
    showToast("첫 연락 문장을 복사했어요");
  } catch {
    showToast("문장을 복사하지 못했어요. 화면의 문장을 그대로 읽어도 괜찮아요");
  }
}

function focusProviderSearch(providerType) {
  preferredProviderType = providerType;
  providerCard.scrollIntoView({ behavior: state.settings.motion ? "smooth" : "auto", block: "start" });
  window.setTimeout(() => supportLocationInput.focus(), state.settings.motion ? 260 : 0);
  showToast(providerType === "counseling" ? "지역을 적고 대화 상담 찾기를 눌러주세요" : "지역을 적고 마음건강 진료 찾기를 눌러주세요");
}

function openProviderSearch(providerType) {
  preferredProviderType = providerType;
  const location = supportLocationInput.value.trim();
  if (!location) {
    showToast("먼저 찾고 싶은 동·구·시를 적어주세요");
    supportLocationInput.focus();
    return;
  }
  const providerLabel = providerType === "counseling" ? "심리상담센터" : "정신건강의학과";
  const query = `${location} ${providerLabel}`;
  const searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  window.open(searchUrl, "_blank", "noopener,noreferrer");
}

function showView(view, { resetScroll = true } = {}) {
  if (!viewSections.some((section) => section.dataset.viewSection === view)) return;
  const previousView = activeView;

  if (view !== "chat" && (voicePeerConnection || voicePanel.dataset.callState === "connecting")) {
    stopVoiceCall("탭을 이동해 통화를 마쳤어요.");
    showToast("통화를 종료하고 다른 탭으로 이동했어요");
  }

  viewSections.forEach((section) => {
    section.classList.toggle("is-view-active", section.dataset.viewSection === view);
  });
  viewButtons.forEach((button) => {
    const isCurrent = button.dataset.view === view;
    button.classList.toggle("is-current", isCurrent);
    if (isCurrent) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  activeView = view;
  app.dataset.activeView = view;

  if (view === "chat" && previousView !== "chat") {
    renderPromptSuggestions();
  }

  if (resetScroll) {
    appScroll.scrollTo({ top: 0, behavior: state.settings.motion ? "smooth" : "auto" });
  }
}

function setChatMode(mode) {
  if (!chatModeButtons.some((button) => button.dataset.chatMode === mode)) return;
  if (mode !== "voice" && (voicePeerConnection || voicePanel.dataset.callState === "connecting")) {
    stopVoiceCall("글 대화로 돌아와 통화를 마쳤어요.");
  }
  chatModeButtons.forEach((button) => {
    const isActive = button.dataset.chatMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  chatPanes.forEach((pane) => pane.classList.toggle("is-chat-mode-active", pane.dataset.chatPane === mode));
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => setMood(button.dataset.mood, { record: true }));
});

moodWeight.addEventListener("input", () => {
  state.weight = normalizeWeight(moodWeight.value);
  weightValue.textContent = moodWeight.value;
  moodWeight.setAttribute("aria-valuetext", `마음 무게 ${moodWeight.value}, 10단계 중`);
  saveState();
});

moodWeight.addEventListener("change", () => {
  recordCurrentMood();
  showToast("마음 무게도 함께 남겼어요");
});

comfortButton.addEventListener("click", () => {
  const data = moodData[state.mood];
  comfortIndex = (comfortIndex + 1) % data.messages.length;
  friendMessage.textContent = data.messages[comfortIndex];
  careStep.textContent = data.steps[careStepIndex];
});

nextPrescription.addEventListener("click", showNextPrescription);
completeCare.addEventListener("click", () => toggleCareCompletion());
prescriptionChecklist.addEventListener("click", (event) => {
  const button = event.target.closest("[data-care-step-index]");
  if (!button) return;
  resetPrescriptionTimer();
  toggleCareCompletion(Number(button.dataset.careStepIndex));
});
prescriptionTimerButton.addEventListener("click", startOrPausePrescriptionTimer);
prescriptionTimerReset.addEventListener("click", () => {
  resetPrescriptionTimer();
  showToast("5분 타이머를 처음으로 돌렸어요");
});

noteInput.addEventListener("input", autoGrowNote);

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (chatPending) return;
  const text = noteInput.value.trim();
  if (!text) {
    showToast("한 글자만 적어도 괜찮아요");
    noteInput.focus();
    return;
  }

  const risk = isHighRisk(text);
  if (!risk && !appConfig.account?.consentValid) {
    openConsentReview();
    showToast("AI 대화 전에 마음 정보 처리 내용을 확인해 주세요");
    return;
  }
  if (!risk && appConfig.loginRequired && !appConfig.account?.signedIn) {
    renderAccountUI();
    showView("mypage");
    window.setTimeout(() => preferredLoginFocusTarget()?.focus(), 80);
    showToast("무료 사용량을 지키기 위해 계정 연결이 필요해요");
    return;
  }
  const freeRepliesRemaining = Math.max(0, Number(appConfig.usage?.text?.remaining || 0));
  if (!risk && !appConfig.subscription?.active && freeRepliesRemaining <= 0) {
    openDialog(subscriptionDialog);
    showToast("이번 달 무료 대화를 모두 사용했어요. 추가 대화에는 구독이 필요해요");
    return;
  }

  appendChat("user", text);
  recordCurrentMood();
  inlineSafety.hidden = !risk;
  noteInput.value = "";
  autoGrowNote();

  if (risk) {
    if (!safetyDialog.open) openDialog(safetyDialog);
    const reply = crisisReply();
    appendChat("friend", reply);
    friendMessage.textContent = reply;
    careStep.textContent = "지금 가까운 사람과 같은 공간에 있기";
    return;
  }

  const typingBubble = appendChat("friend", "···", { persist: false, typing: true });
  setChatPending(true);
  try {
    const payload = await requestAiReply();
    typingBubble.remove();
    appendChat("friend", payload.reply);
    friendMessage.textContent = payload.reply;
    careStep.textContent = moodData[state.mood].steps[0];
    if (payload.usage) {
      appConfig.usage = payload.usage;
      renderSubscriptionUI();
    }
    if (payload.risk) {
      inlineSafety.hidden = false;
      if (!safetyDialog.open) openDialog(safetyDialog);
    }
  } catch (error) {
    typingBubble.remove();
    if (error.usage) {
      appConfig.usage = error.usage;
      renderSubscriptionUI();
    }
    if (error.account) {
      appConfig.account = error.account;
      renderAccountUI();
    }
    if (error.code === "CONSENT_REQUIRED") openConsentReview();
    if (error.code === "ACCOUNT_REQUIRED") {
      renderAccountUI();
      showView("mypage");
      window.setTimeout(() => preferredLoginFocusTarget()?.focus(), 80);
    }
    if (error.code === "SUBSCRIPTION_REQUIRED" || String(error.code).includes("LIMIT_REACHED")) openDialog(subscriptionDialog);
    appendChat("friend", `지금은 AI 대화를 연결하지 못했어요. ${error.message}`, { persist: false });
  } finally {
    setChatPending(false);
    if (activeView === "chat") noteInput.focus();
  }
});

promptRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prompt]");
  if (!button) return;
  noteInput.value = button.dataset.prompt;
  autoGrowNote();
  noteInput.focus();
});

dailyNextButton.addEventListener("click", showNextDailyCompanion);
dailyWidgetButton.addEventListener("click", requestDailyWidget);

musicList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-track-index]");
  if (!button) return;
  playSoundscape(Number(button.dataset.trackIndex)).catch(() => {
    stopSoundscape();
    showToast("사운드를 시작하지 못했어요. 잠시 후 다시 눌러주세요");
  });
});

document.querySelectorAll("[data-minutes]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMinutes = Number(button.dataset.minutes);
    document.querySelectorAll("[data-minutes]").forEach((item) => item.classList.toggle("is-active", item === button));
    resetBreathing();
  });
});

breathStart.addEventListener("click", startOrPauseBreathing);
breathReset.addEventListener("click", resetBreathing);
daylightButtons.forEach((button, index) => {
  button.addEventListener("click", () => setDaylightMinutes(Number(button.dataset.daylightMinutes)));
  button.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % daylightButtons.length;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + daylightButtons.length) % daylightButtons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = daylightButtons.length - 1;
    else return;
    event.preventDefault();
    daylightButtons[nextIndex].focus();
    daylightButtons[nextIndex].click();
  });
});
daylightStartButton.addEventListener("click", startOrPauseDaylightTimer);
daylightDoneButton.addEventListener("click", completeDaylightSession);
routineButtons.forEach((button) => button.addEventListener("click", () => toggleRoutine(button.dataset.routine)));
providerSearchButtons.forEach((button) => button.addEventListener("click", () => openProviderSearch(button.dataset.providerSearch)));
helpPathButtons.forEach((button, index) => {
  button.addEventListener("click", () => setHelpPath(button.dataset.helpPath));
  button.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % helpPathButtons.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + helpPathButtons.length) % helpPathButtons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = helpPathButtons.length - 1;
    else return;
    event.preventDefault();
    setHelpPath(helpPathButtons[nextIndex].dataset.helpPath, { focus: true });
  });
});
supportPhraseButtons.forEach((button) => button.addEventListener("click", () => copySupportPhrase(button.dataset.copySupport)));
focusProviderButtons.forEach((button) => button.addEventListener("click", () => focusProviderSearch(button.dataset.focusProvider)));
supportLocationInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  openProviderSearch(preferredProviderType);
});
safetyDelayButton.addEventListener("click", startOrPauseSafetyTimer);
copyHelpButton.addEventListener("click", copyHelpMessage);

viewButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewJump)));
chatModeButtons.forEach((button) => button.addEventListener("click", () => setChatMode(button.dataset.chatMode)));
voicePersonaButtons.forEach((button) => button.addEventListener("click", () => setVoicePersona(button.dataset.persona)));

document.querySelector("#menuButton").addEventListener("click", () => {
  renderAccountUI();
  renderSubscriptionUI();
  showView("menu");
});
openSubscriptionButton.addEventListener("click", () => openDialog(subscriptionDialog));
mySubscriptionButton.addEventListener("click", () => openDialog(subscriptionDialog));
subscribeButton.addEventListener("click", startSubscriptionCheckout);
socialLoginButtons.forEach((button) => {
  button.addEventListener("click", () => startSocialLogin(button.dataset.oauthProvider));
});
logoutAccountButton.addEventListener("click", logoutAccount);
accountEmailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  requestAccountCode();
});
accountCodeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  verifyAccountCode();
});
consentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveConsent();
});
reviewConsentButton.addEventListener("click", openConsentReview);
exportDataButton.addEventListener("click", exportAccountData);
deleteAccountButton.addEventListener("click", deleteServerAccount);
installAppButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installAppButton.hidden = true;
});
voiceCallButton.addEventListener("click", () => {
  if (voicePeerConnection) stopVoiceCall();
  else startVoiceCall();
});
document.querySelectorAll("[data-open-safety]").forEach((button) => button.addEventListener("click", () => openDialog(safetyDialog)));
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => closeDialog(button.closest("dialog")));
});

[subscriptionDialog, consentDialog, safetyDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
});

motionToggle.addEventListener("change", () => {
  state.settings.motion = motionToggle.checked;
  applySettings();
  saveState();
});

soundToggle.addEventListener("change", () => {
  state.settings.sound = soundToggle.checked;
  if (!soundToggle.checked) stopSoundscape();
  saveState();
});

themeModeButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    state.settings.themeMode = button.dataset.themeMode;
    applySettings();
    saveState();
    const message = state.settings.themeMode === "system"
      ? "기기의 화면 설정을 따라갈게요"
      : state.settings.themeMode === "dark"
        ? "은은한 별밤으로 바꿨어요"
        : "포근한 낮빛으로 바꿨어요";
    showToast(message);
  });

  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const nextButton = themeModeButtons[(index + direction + themeModeButtons.length) % themeModeButtons.length];
    nextButton.focus();
    nextButton.click();
  });
});

titleFontSelect?.addEventListener("change", () => {
  state.settings.titleFont = normalizeTitleFont({ titleFont: titleFontSelect.value });
  applySettings();
  saveState();
  showToast(`${TITLE_FONT_OPTIONS[state.settings.titleFont].label}로 제목을 바꿨어요`);
});

const handleSystemThemeChange = () => {
  if (state.settings.themeMode === "system") applySettings();
};

if (typeof systemThemeQuery?.addEventListener === "function") {
  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
} else {
  systemThemeQuery?.addListener?.(handleSystemThemeChange);
}

document.querySelector("#clearHistoryButton").addEventListener("click", () => {
  if (!state.history.length) return;
  if (!window.confirm("이 기기에 저장된 마음 발자국을 모두 비울까요?")) return;
  state.history = [];
  saveState();
  renderHistory();
  updateSavedBadge();
  showToast("마음 발자국을 비웠어요");
});

document.querySelector("#clearAllButton").addEventListener("click", () => {
  if (!window.confirm("이 브라우저에 저장된 대화와 마음 기록을 모두 지울까요?")) return;
  stopSoundscape();
  if (voicePeerConnection) stopVoiceCall();
  state = defaultState();
  resetDaylightTimer();
  localStorage.removeItem(STORAGE_KEY);
  chatLog.replaceChildren();
  appendChat("friend", "여기서는 마음을 잘 정리해서 말하지 않아도 괜찮아요. 오늘 가장 크게 남아 있는 감정부터 들려줄래요?", { persist: false });
  inlineSafety.hidden = true;
  moodWeight.value = "5";
  weightValue.textContent = "5";
  applySettings();
  setMood("heavy");
  setVoicePersona("counselor_female", { persist: false });
  renderHistory();
  updateSavedBadge();
  showToast("이 기기의 마음 기록을 모두 비웠어요");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (!isNativeApp) installAppButton.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installAppButton.hidden = true;
  showToast("마음친구를 이 기기에 설치했어요");
});

async function initializePlatformShell() {
  if (false && "serviceWorker" in navigator && !isNativeApp && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  if (!isNativeApp) return;
  installAppButton.hidden = true;
  const appPlugin = window.Capacitor?.Plugins?.App;
  appPlugin?.addListener("appUrlOpen", ({ url }) => {
    handleOAuthDeepLink(url);
  });
  const launchUrl = await Promise.resolve(appPlugin?.getLaunchUrl?.()).catch(() => null);
  if (launchUrl?.url) await handleOAuthDeepLink(launchUrl.url);
  await syncPlatformTheme();
  appPlugin?.addListener("backButton", () => {
    const openedDialog = [safetyDialog, consentDialog, subscriptionDialog].find((dialog) => dialog.open);
    if (openedDialog) {
      closeDialog(openedDialog);
      return;
    }
    if (activeView === "mypage" || activeView === "settings") showView("menu");
    else if (activeView !== "home") showView("home");
    else window.Capacitor?.Plugins?.App?.exitApp();
  });
}

state.weight = normalizeWeight(state.weight);
moodWeight.value = String(state.weight);
weightValue.textContent = String(state.weight);
moodWeight.setAttribute("aria-valuetext", `마음 무게 ${state.weight}, 10단계 중`);
applySettings();
setMood(moodData[state.mood] ? state.mood : "heavy");
state.chat.slice(-8).forEach((entry) => appendChat(entry.role === "user" ? "user" : "friend", String(entry.text || ""), { persist: false }));
if (!state.chat.length) {
  appendChat("friend", "여기서는 마음을 잘 정리해서 말하지 않아도 괜찮아요. 오늘 가장 크게 남아 있는 감정부터 들려줄래요?", { persist: false });
}
renderHistory();
updateSavedBadge();
updateClock();
resetBreathing();
resetDaylightTimer();
renderPromptSuggestions();
loadDailyReading();
showView("home", { resetScroll: false });
setChatMode("text");
setVoicePersona(voicePersonaData[state.voicePersona] ? state.voicePersona : "counselor_female", { persist: false });
setHelpPath("guide");
loadAppConfig().then(async () => {
  await handleOAuthReturn();
  await handleBillingReturn();
  handleAccountDeleteLaunch();
});
initializePlatformShell();
window.addEventListener("beforeunload", () => {
  reportVoiceReservation({ keepalive: true });
  voiceLocalStream?.getTracks().forEach((track) => track.stop());
  voicePeerConnection?.close();
});
setInterval(updateClock, 30000);
