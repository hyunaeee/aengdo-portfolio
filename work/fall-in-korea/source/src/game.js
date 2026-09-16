import { ITEM_CHAINS as TRADITIONAL_CHAINS, CHARACTERS } from './content.js';
import { ERAS, MODERN_CHAINS, BUILDINGS, OFFERS, PASS_TIERS } from './travel-content.js';
export { CHARACTERS } from './content.js';
export { ERAS, MODERN_CHAINS, BUILDINGS, OFFERS, PASS_TIERS } from './travel-content.js';
export const ITEM_CHAINS = [...TRADITIONAL_CHAINS, ...MODERN_CHAINS];

export const ROWS = 9;
export const COLS = 7;
export const BOARD_SIZE = ROWS * COLS;
export const ENERGY_INTERVAL_MS = 60_000;
export const INVENTORY_CAPACITY = 8;

export const QUESTS = [
  { id: 'merge', title: '합성의 달인', description: '아이템 10번 합성하기', target: 10, reward: { coins: 100 } },
  { id: 'orders', title: '단골손님', description: '손님 주문 5개 완료하기', target: 5, reward: { coins: 150 } },
  { id: 'garden', title: '고운 한복', description: '한복 아이템 4종 발견하기', target: 4, reward: { gems: 8 } },
];
const GENERATOR_NAMES = {
  maedeup: '매듭 재료함', bojagi: '조각보 바느질함', celadon: '청자 물레', hanbok: '한복 반짇고리', fan: '부채 공구함',
  najeon: '자개 공예함', tteok: '떡 시루', hangwa: '한과 조리함', tea: '차 바구니', lantern: '한지 공구함',
  photo: '사진 여행 가방', music: '음악 보관함', tech: '디지털 공구함', streetfood: '간식 포장마차',
};
const GENERATOR_PLACEMENTS = TRADITIONAL_CHAINS.map((chain, index) => [index === 9 ? 62 : index * COLS, chain.id]);
const LEGACY_CHAIN_MAP = new Map([['coffee', 'maedeup'], ['bakery', 'bojagi'], ['grill', 'celadon'], ['plant', 'hanbok']]);
const MAX_COUNTER = 1_000_000_000;
const CHAIN_BY_ID = new Map(ITEM_CHAINS.map((chain) => [chain.id, chain]));
const DISCOVERY_KEYS = new Set(
  ITEM_CHAINS.flatMap((chain) => chain.items.map((_, level) => `${chain.id}:${level}`)),
);
const TRADITIONAL_DISCOVERY_KEYS = new Set(TRADITIONAL_CHAINS.flatMap((chain) => chain.items.map((_, level) => `${chain.id}:${level}`)));
const LEGACY_DISCOVERY_KEYS = new Map([1, 2].map((version) => [version, new Set(
  [...LEGACY_CHAIN_MAP.keys()].slice(0, version === 1 ? 2 : 4)
    .flatMap((chain) => Array.from({ length: 6 }, (_, level) => `${chain}:${level}`)),
)]));

function validInteger(value, min = 0, max = MAX_COUNTER) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

function safeNow(value) {
  return validInteger(value, 0, Number.MAX_SAFE_INTEGER) ? value : Date.now();
}

function utcDay(now) {
  return new Date(Math.min(safeNow(now), 253_402_300_799_999)).toISOString().slice(0, 10);
}

function utcWeek(day) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

function validDateStamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function emptyMemory() {
  return { cards: [], flipped: [], matched: [], moves: 0, completed: false, rewarded: false };
}

function emptyYut() {
  return { position: 0, lastRoll: 0, rolls: 0, completed: false };
}

function emptyPass(week) {
  return { week, orders: 0, premium: false, freeClaims: [], premiumClaims: [] };
}

function createTravel(now) {
  const day = utcDay(now);
  return {
    day,
    built: ['gate'],
    dailyClaimed: false,
    albumClaims: [],
    offers: Object.fromEntries(OFFERS.map((offer) => [offer.id, null])),
    memory: emptyMemory(),
    yut: emptyYut(),
    pass: emptyPass(utcWeek(day)),
  };
}

function validUniqueList(value, predicate, maximum) {
  return Array.isArray(value) && value.length <= maximum &&
    Array.from(value).every(predicate) && new Set(value).size === value.length;
}

function validTravel(travel, state) {
  if (!travel || !validDateStamp(travel.day) || typeof travel.dailyClaimed !== 'boolean') return false;
  if (!validUniqueList(travel.built, (id) => BUILDINGS.some((building) => building.id === id), BUILDINGS.length) || !travel.built.includes('gate')) return false;
  if (!validUniqueList(travel.albumClaims, (chain) => CHAIN_BY_ID.has(chain) &&
    CHAIN_BY_ID.get(chain).items.every((_, level) => state.discovered.includes(`${chain}:${level}`)), ITEM_CHAINS.length)) return false;
  if (!travel.offers || typeof travel.offers !== 'object' || OFFERS.some((offer) =>
    travel.offers[offer.id] !== null && (!validDateStamp(travel.offers[offer.id]) || travel.offers[offer.id] > travel.day))) return false;
  const memory = travel.memory;
  if (!memory || !Array.isArray(memory.cards) || ![0, 8].includes(memory.cards.length) ||
    !Array.from(memory.cards).every((card) => validInteger(card, 0, 3)) ||
    !validUniqueList(memory.flipped, (index) => validInteger(index, 0, memory.cards.length - 1), 2) ||
    !validUniqueList(memory.matched, (index) => validInteger(index, 0, memory.cards.length - 1), 8) ||
    !validInteger(memory.moves) || typeof memory.completed !== 'boolean' || typeof memory.rewarded !== 'boolean' ||
    memory.matched.length % 2 !== 0 || memory.matched.length / 2 > memory.moves ||
    memory.flipped.some((index) => memory.matched.includes(index))) return false;
  if (memory.cards.length === 0) {
    if (memory.moves || memory.completed || memory.rewarded) return false;
  } else {
    if ([0, 1, 2, 3].some((card) => memory.cards.filter((value) => value === card).length !== 2)) return false;
    if ([0, 1, 2, 3].some((card) => ![0, 2].includes(memory.matched.filter((index) => memory.cards[index] === card).length))) return false;
    if (memory.flipped.length === 2 && memory.cards[memory.flipped[0]] === memory.cards[memory.flipped[1]]) return false;
  }
  if (memory.completed !== (memory.matched.length === 8) || (memory.completed && !memory.rewarded)) return false;
  const yut = travel.yut;
  if (!yut || !validInteger(yut.position, 0, 12) || !validInteger(yut.lastRoll, 0, 5) ||
    !validInteger(yut.rolls) || typeof yut.completed !== 'boolean' || yut.completed !== (yut.position === 12) ||
    (yut.rolls === 0 ? yut.position !== 0 || yut.lastRoll !== 0 : yut.lastRoll < 1) || yut.position > yut.rolls * 5) return false;
  const pass = travel.pass;
  if (!pass || !validDateStamp(pass.week) || pass.week !== utcWeek(travel.day) ||
    !validInteger(pass.orders) || typeof pass.premium !== 'boolean') return false;
  const validTier = (tier) => validInteger(tier, 0, PASS_TIERS.length - 1) && pass.orders >= PASS_TIERS[tier].target;
  return validUniqueList(pass.freeClaims, validTier, PASS_TIERS.length) &&
    validUniqueList(pass.premiumClaims, validTier, PASS_TIERS.length) && (pass.premium || pass.premiumClaims.length === 0);
}

function cloneTravel(travel) {
  return {
    day: travel.day,
    built: [...travel.built],
    dailyClaimed: travel.dailyClaimed,
    albumClaims: [...travel.albumClaims],
    offers: Object.fromEntries(OFFERS.map((offer) => [offer.id, travel.offers[offer.id]])),
    memory: { cards: [...travel.memory.cards], flipped: [...travel.memory.flipped], matched: [...travel.memory.matched], moves: travel.memory.moves, completed: travel.memory.completed, rewarded: travel.memory.rewarded },
    yut: { position: travel.yut.position, lastRoll: travel.yut.lastRoll, rolls: travel.yut.rolls, completed: travel.yut.completed },
    pass: { week: travel.pass.week, orders: travel.pass.orders, premium: travel.pass.premium, freeClaims: [...travel.pass.freeClaims], premiumClaims: [...travel.pass.premiumClaims] },
  };
}

export function refreshTravel(state, now = Date.now()) {
  if (!state?.travel) return state;
  const day = utcDay(Math.max(safeNow(now), state.createdAt));
  if (day <= state.travel.day) return state;
  const week = utcWeek(day);
  return { ...state, travel: { ...state.travel, day, dailyClaimed: false, memory: emptyMemory(), yut: emptyYut(), pass: week === state.travel.pass.week ? state.travel.pass : emptyPass(week) } };
}

export function getTravelState(state, now = Date.now()) {
  return refreshTravel(state, now).travel;
}

export function getDailyStatus(state, now = Date.now()) {
  const travel = getTravelState(state, now);
  return { day: travel.day, claimed: travel.dailyClaimed, ready: !travel.dailyClaimed };
}

export function getPassProgress(state, tier, premium = false, now = Date.now()) {
  const pass = getTravelState(state, now).pass;
  if (!validInteger(tier, 0, PASS_TIERS.length - 1)) return { have: 0, total: 0, claimed: false, ready: false, locked: true };
  const total = PASS_TIERS[tier].target;
  const claimed = (premium ? pass.premiumClaims : pass.freeClaims).includes(tier);
  const locked = premium && !pass.premium;
  return { have: Math.min(pass.orders, total), total, claimed, ready: !locked && !claimed && pass.orders >= total, locked };
}

export function getAlbumProgress(state, chain) {
  const definition = CHAIN_BY_ID.get(typeof chain === 'string' ? chain : chain?.id);
  if (!definition) return { have: 0, total: 0, claimed: false, ready: false };
  const have = definition.items.filter((_, level) => state.discovered.includes(`${definition.id}:${level}`)).length;
  const claimed = Boolean(state.travel?.albumClaims.includes(definition.id));
  return { have, total: definition.items.length, claimed, ready: !claimed && have === definition.items.length };
}

function validItem(item, version = 4) {
  const chain = CHAIN_BY_ID.get(version < 3 ? LEGACY_CHAIN_MAP.get(item?.chain) : item?.chain);
  return Boolean(
    item &&
      typeof item === 'object' &&
      chain &&
      (version !== 1 || ['coffee', 'bakery'].includes(item.chain)) &&
      (version !== 3 || !chain.unlockLevel) &&
      validInteger(item.level, 0, chain.items.length - 1) &&
      (version !== 1 || !item.generator) &&
      (item.generator === undefined || item.generator === false || (item.generator === true && item.level === 0)),
  );
}

function validOrder(order, boardSize = BOARD_SIZE, version = 4) {
  return Boolean(
    order &&
      typeof order === 'object' &&
      typeof order.id === 'string' &&
      order.id.length > 0 &&
      order.id.length <= 100 &&
      validInteger(order.avatar, 0, version < 3 ? 5 : CHARACTERS.length - 1) &&
      ['name', 'dialogue'].every(
        (key) => typeof order[key] === 'string' && order[key].length > 0 && order[key].length <= 200,
      ) &&
      validInteger(order.coins, 1, 10_000) &&
      validInteger(order.xp, 1, 10_000) &&
      Array.isArray(order.requirements) &&
      order.requirements.length >= 1 &&
      order.requirements.length <= boardSize &&
      Array.from(order.requirements).every(
        (requirement) => validItem(requirement, version) && !requirement.generator && validInteger(requirement.quantity, 1, boardSize),
      ) &&
      order.requirements.reduce((total, requirement) => total + requirement.quantity, 0) <= boardSize,
  );
}

function validState(state, version = 4) {
  const firstVersion = version === 1;
  const boardSize = firstVersion ? 42 : BOARD_SIZE;
  const discoveryKeys = version < 3 ? LEGACY_DISCOVERY_KEYS.get(version) : version === 3 ? TRADITIONAL_DISCOVERY_KEYS : DISCOVERY_KEYS;
  const knownRegularItem = (item) => validItem(item, version) && !item.generator;
  return Boolean(
    state &&
      typeof state === 'object' &&
      [1, 2, 3, 4].includes(version) &&
      state.version === version &&
      Array.isArray(state.board) &&
      state.board.length === boardSize &&
      Array.from(state.board).every((item) => item === null || validItem(item, version)) &&
      ['coins', 'xp', 'completedOrders', 'mergeCount'].every((key) => validInteger(state[key])) &&
      (firstVersion || (
        validInteger(state.gems) && validInteger(state.generatorCount) &&
        Array.isArray(state.inventory) && state.inventory.length <= INVENTORY_CAPACITY &&
        Array.from(state.inventory).every(knownRegularItem) &&
        Array.isArray(state.questClaims) && state.questClaims.length <= QUESTS.length &&
        Array.from(state.questClaims).every((id) => QUESTS.some((quest) => quest.id === id)) &&
        new Set(state.questClaims).size === state.questClaims.length
      )) &&
      state.maxEnergy === 100 &&
      validInteger(state.energy, 0, state.maxEnergy) &&
      Array.isArray(state.orders) &&
      state.orders.length === 3 &&
      Array.from(state.orders).every((order) => validOrder(order, boardSize, version)) &&
      new Set(state.orders.map((order) => order.id)).size === state.orders.length &&
      Array.isArray(state.discovered) &&
      state.discovered.length <= discoveryKeys.size &&
      Array.from(state.discovered).every((key) => discoveryKeys.has(key)) &&
      new Set(state.discovered).size === state.discovered.length &&
      [...state.board, ...(firstVersion ? [] : state.inventory)].every((item) => item === null || item.generator || state.discovered.includes(`${item.chain}:${item.level}`)) &&
      validInteger(state.lastEnergyAt, 0, Number.MAX_SAFE_INTEGER) &&
      validInteger(state.createdAt, 0, Number.MAX_SAFE_INTEGER) &&
      state.createdAt <= state.lastEnergyAt &&
      (version < 4 || validTravel(state.travel, state)),
  );
}

function cloneItem(item) {
  return item === null ? null : { chain: item.chain, level: item.level, ...(item.generator ? { generator: true } : {}) };
}

function addBounded(value, amount) {
  return Math.min(MAX_COUNTER, value + amount);
}

function discover(state, item) {
  const key = `${item.chain}:${item.level}`;
  const newDiscovery = !state.discovered.includes(key);
  return {
    discovered: newDiscovery ? [...state.discovered, key] : state.discovered,
    newDiscovery,
  };
}

function characterOrderDetails(avatar, requirements) {
  const character = CHARACTERS[avatar];
  const requested = requirements.slice(0, 2)
    .map((item) => `${getItemDefinition(item).name} ${item.quantity}개`).join(', ');
  return { avatar, name: character.name, dialogue: `${character.nickname}의 선물로 ${requested}${requirements.length > 2 ? ' 등' : ''} 부탁해요!` };
}

function initialOrders() {
  const orders = [
    { requirements: [{ chain: 'maedeup', level: 2, quantity: 1 }, { chain: 'bojagi', level: 2, quantity: 1 }], coins: 40, xp: 35 },
    { requirements: [{ chain: 'hanbok', level: 3, quantity: 1 }], coins: 55, xp: 32 },
    { requirements: [{ chain: 'celadon', level: 3, quantity: 1 }], coins: 55, xp: 32 },
  ];
  return orders.map((order, avatar) => ({ ...order, id: `order-${avatar + 1}`, ...characterOrderDetails(avatar, order.requirements) }));
}

export function createInitialState(now = Date.now()) {
  const timestamp = safeNow(now);
  const board = Array(BOARD_SIZE).fill(null);
  const placements = [
    [1, 'maedeup', 2], [2, 'maedeup', 1], [3, 'maedeup', 1], [4, 'maedeup', 3], [5, 'bojagi', 2], [6, 'hanbok', 2],
    [8, 'bojagi', 1], [9, 'bojagi', 1], [10, 'maedeup', 2], [11, 'celadon', 2], [12, 'celadon', 1], [13, 'hanbok', 2],
    [15, 'celadon', 3], [16, 'celadon', 0], [17, 'fan', 1], [18, 'fan', 1], [19, 'hanbok', 0], [20, 'hanbok', 1],
    [22, 'fan', 2], [23, 'najeon', 1], [24, 'najeon', 1], [25, 'najeon', 2], [26, 'tteok', 1], [27, 'tteok', 1],
    [29, 'tteok', 3], [30, 'hangwa', 1], [31, 'hangwa', 1], [34, 'hangwa', 2],
    [36, 'tea', 1], [37, 'tea', 1], [38, 'tea', 2], [41, 'lantern', 1],
    [43, 'lantern', 1], [44, 'lantern', 3], [57, 'bojagi', 0],
  ];
  for (const [index, chain, level] of placements) board[index] = { chain, level };
  for (const [index, chain] of GENERATOR_PLACEMENTS) board[index] = { chain, level: 0, generator: true };
  return {
    version: 4,
    board,
    coins: 120,
    energy: 100,
    maxEnergy: 100,
    xp: 0,
    completedOrders: 0,
    mergeCount: 0,
    generatorCount: 0,
    gems: 15,
    inventory: [],
    questClaims: [],
    orders: initialOrders(),
    travel: createTravel(timestamp),
    discovered: [...new Set(placements.map(([, chain, level]) => `${chain}:${level}`))],
    lastEnergyAt: timestamp,
    createdAt: timestamp,
  };
}

export function getItemDefinition(item) {
  if (!validItem(item)) return null;
  const chain = CHAIN_BY_ID.get(item.chain);
  return {
    ...(item.generator ? { name: GENERATOR_NAMES[item.chain], generator: true } : chain.items[item.level]),
    chain: chain.id, chainName: chain.name, level: item.level,
  };
}

export function getQuestProgress(state, quest) {
  const definition = QUESTS.find((entry) => entry.id === (typeof quest === 'string' ? quest : quest?.id));
  if (!definition) return { have: 0, total: 0, claimed: false, ready: false };
  const counts = {
    merge: state?.mergeCount || 0,
    orders: state?.completedOrders || 0,
    garden: new Set((state?.discovered || []).filter((key) => key.startsWith('hanbok:'))).size,
  };
  const have = Math.min(definition.target, counts[definition.id]);
  const claimed = Boolean(state?.questClaims?.includes(definition.id));
  return { have, total: definition.target, claimed, ready: !claimed && have >= definition.target };
}

export function getLevel(state) {
  return 1 + Math.floor((validInteger(state?.xp) ? state.xp : 0) / 100);
}

export function getEra(state) {
  const level = getLevel(state);
  return [...ERAS].reverse().find((era) => level >= era.level) || ERAS[0];
}

export function getUnlockedChains(state) {
  const level = getLevel(state);
  return ITEM_CHAINS.filter((chain) => level >= (chain.unlockLevel || 1));
}

function aggregateRequirements(order) {
  const requirements = new Map();
  for (const requirement of order.requirements) {
    const key = `${requirement.chain}:${requirement.level}`;
    requirements.set(key, (requirements.get(key) || 0) + requirement.quantity);
  }
  return requirements;
}

export function getOrderProgress(state, order) {
  if (!Array.isArray(state?.board) || !validOrder(order)) return { have: 0, total: 0 };
  const requirements = aggregateRequirements(order);
  const available = new Map();
  for (const item of state.board) {
    if (!validItem(item) || item.generator) continue;
    const key = `${item.chain}:${item.level}`;
    available.set(key, (available.get(key) || 0) + 1);
  }
  let have = 0;
  let total = 0;
  for (const [key, quantity] of requirements) {
    total += quantity;
    have += Math.min(quantity, available.get(key) || 0);
  }
  return { have, total };
}

export function canFulfillOrder(state, order) {
  const { have, total } = getOrderProgress(state, order);
  return total > 0 && have === total;
}

export function refreshEnergy(state, now = Date.now()) {
  const timestamp = Math.max(safeNow(now), state.createdAt);
  if (state.lastEnergyAt > timestamp || state.energy >= state.maxEnergy) {
    return state.lastEnergyAt === timestamp ? state : { ...state, lastEnergyAt: timestamp };
  }
  const ticks = Math.floor((timestamp - state.lastEnergyAt) / ENERGY_INTERVAL_MS);
  if (ticks < 1) return state;
  const energy = Math.min(state.maxEnergy, state.energy + ticks);
  return {
    ...state,
    energy,
    lastEnergyAt: energy === state.maxEnergy ? timestamp : state.lastEnergyAt + ticks * ENERGY_INTERVAL_MS,
  };
}

export function hydrateState(raw, now = Date.now()) {
  const timestamp = safeNow(now);
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const version = parsed?.version;
    const legacy = version < 3;
    if (!validState(parsed, version) || parsed.lastEnergyAt > timestamp) return createInitialState(timestamp);
    const convertItem = (item) => item === null ? null : cloneItem({ ...item, chain: legacy ? LEGACY_CHAIN_MAP.get(item.chain) : item.chain });
    let board = parsed.board.map(convertItem);
    const discovered = parsed.discovered.map((key) => {
      if (!legacy) return key;
      const [chain, level] = key.split(':');
      return `${LEGACY_CHAIN_MAP.get(chain)}:${level}`;
    });
    if (version === 1) {
      board = Array(BOARD_SIZE).fill(null);
      parsed.board.forEach((item, index) => {
        board[Math.floor(index / 6) * COLS + index % 6] = convertItem(item);
      });
    }
    if (legacy) {
      // Existing items and generators keep their places. Any workshop without room
      // for a new generator remains accessible through the workshop menu.
      const installed = new Set(board.filter((item) => item?.generator).map((item) => item.chain));
      for (const [preferredIndex, chain] of GENERATOR_PLACEMENTS) {
        if (installed.has(chain)) continue;
        const index = board[preferredIndex] === null ? preferredIndex : board.indexOf(null);
        if (index === -1) break;
        board[index] = { chain, level: 0, generator: true };
      }
    }
    // Rebuild only the persisted schema; caller-owned objects and extra fields never enter live state.
    const state = {
      version: 4,
      board,
      coins: parsed.coins,
      energy: parsed.energy,
      maxEnergy: 100,
      xp: parsed.xp,
      completedOrders: parsed.completedOrders,
      mergeCount: parsed.mergeCount,
      generatorCount: version === 1 ? 0 : parsed.generatorCount,
      gems: version === 1 ? 15 : parsed.gems,
      inventory: version === 1 ? [] : parsed.inventory.map(convertItem),
      questClaims: version === 1 ? [] : [...parsed.questClaims],
      travel: version < 4 ? createTravel(timestamp) : cloneTravel(parsed.travel),
      orders: parsed.orders.map((order) => {
        const requirements = order.requirements.map(({ chain, level, quantity }) => ({ chain: legacy ? LEGACY_CHAIN_MAP.get(chain) : chain, level, quantity }));
        return {
          id: order.id,
          ...(legacy ? characterOrderDetails(order.avatar, requirements) : { name: order.name, avatar: order.avatar, dialogue: order.dialogue }),
          requirements,
          coins: order.coins,
          xp: order.xp,
        };
      }),
      discovered,
      lastEnergyAt: parsed.lastEnergyAt,
      createdAt: parsed.createdAt,
    };
    return refreshTravel(refreshEnergy(state, timestamp), timestamp);
  } catch {
    return createInitialState(timestamp);
  }
}

function replacementOrder(state) {
  const turn = state.completedOrders + 3;
  const avatar = turn % CHARACTERS.length;
  const character = CHARACTERS[avatar];
  const unlockedChains = getUnlockedChains(state);
  const chain = unlockedChains[turn % unlockedChains.length].id;
  const level = 1 + Math.floor(state.completedOrders / TRADITIONAL_CHAINS.length) % 3;
  const requirements = [{ chain, level, quantity: turn % 4 === 0 ? 2 : 1 }];
  if (turn % 3 === 2 && character.favorite !== chain) {
    requirements.push({ chain: character.favorite, level: Math.max(1, level - 1), quantity: 1 });
  }
  const effort = requirements.reduce((total, item) => total + 2 ** item.level * item.quantity, 0);
  let number = state.completedOrders + 4;
  while (state.orders.some((order) => order.id === `order-${number}`)) number += 1;
  return { ...characterOrderDetails(avatar, requirements), requirements, id: `order-${number}`, coins: effort * 5 + 5, xp: effort * 3 + 5 };
}

export function applyAction(originalState, action, now = Date.now()) {
  const timestamp = safeNow(now);
  if (action?.type === 'reset') return { state: createInitialState(timestamp), ok: true, message: '새로운 공방을 열었어요.', event: { type: 'reset' } };
  if (!validState(originalState)) return { state: createInitialState(timestamp), ok: false, message: '게임 데이터를 다시 준비했어요.' };
  const state = refreshTravel(refreshEnergy(originalState, timestamp), timestamp);
  const failure = (message) => ({ state, ok: false, message });
  if (!action || typeof action !== 'object') return failure('할 일을 선택해 주세요.');

  if (action.type === 'build') {
    const building = BUILDINGS.find((entry) => entry.id === action.buildingId);
    if (!building) return failure('건물을 찾을 수 없어요.');
    if (state.travel.built.includes(building.id)) return failure('이미 완성한 건물이에요.');
    if (getLevel(state) < building.level) return failure(`레벨 ${building.level}에 열리는 구역이에요.`);
    if (state.coins < building.cost) return failure(`엽전 ${building.cost}개가 필요해요.`);
    return {
      state: { ...state, coins: state.coins - building.cost, gems: addBounded(state.gems, 2), xp: addBounded(state.xp, 10), travel: { ...state.travel, built: [...state.travel.built, building.id] } },
      ok: true, message: `${building.name} 완성! 보석 2개와 경험치 10을 받았어요.`,
      event: { type: 'build', buildingId: building.id, coins: -building.cost, gems: 2, xp: 10 },
    };
  }

  if (action.type === 'claimDaily') {
    if (state.travel.dailyClaimed) return failure('오늘의 출석 선물은 이미 받았어요.');
    const energy = Math.min(10, state.maxEnergy - state.energy);
    return {
      state: { ...state, coins: addBounded(state.coins, 50), gems: addBounded(state.gems, 2), energy: state.energy + energy, lastEnergyAt: state.energy + energy === state.maxEnergy ? Math.max(timestamp, state.createdAt) : state.lastEnergyAt, travel: { ...state.travel, dailyClaimed: true } },
      ok: true, message: '오늘의 출석 선물! 엽전 50개와 보석 2개를 받았어요.',
      event: { type: 'claimDaily', coins: 50, gems: 2, energy },
    };
  }

  if (action.type === 'memoryStart') {
    const cards = [0, 0, 1, 1, 2, 2, 3, 3];
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[other]] = [cards[other], cards[index]];
    }
    const memory = { ...emptyMemory(), cards, rewarded: state.travel.memory.rewarded };
    return { state: { ...state, travel: { ...state.travel, memory } }, ok: true, message: '같은 마을 친구 두 장을 찾아보세요!', event: { type: 'memoryStart' } };
  }

  if (action.type === 'memoryFlip') {
    const memory = state.travel.memory;
    if (memory.cards.length !== 8) return failure('기억놀이를 먼저 시작해 주세요.');
    if (!validInteger(action.index, 0, 7)) return failure('뒤집을 카드를 선택해 주세요.');
    if (memory.completed) return failure('모든 짝을 찾았어요. 새 놀이를 시작해 주세요.');
    if (memory.flipped.length === 2) return failure('두 카드를 다시 덮은 뒤 골라주세요.');
    if (memory.flipped.includes(action.index) || memory.matched.includes(action.index)) return failure('다른 카드를 선택해 주세요.');
    const flipped = [...memory.flipped, action.index];
    const isPair = flipped.length === 2 && memory.cards[flipped[0]] === memory.cards[flipped[1]];
    const matched = isPair ? [...memory.matched, ...flipped] : memory.matched;
    const completed = matched.length === 8;
    const rewarded = completed && !memory.rewarded;
    const nextMemory = { ...memory, flipped: isPair ? [] : flipped, matched, moves: flipped.length === 2 ? addBounded(memory.moves, 1) : memory.moves, completed, rewarded: memory.rewarded || rewarded };
    return {
      state: { ...state, coins: addBounded(state.coins, rewarded ? 60 : 0), xp: addBounded(state.xp, rewarded ? 25 : 0), travel: { ...state.travel, memory: nextMemory } },
      ok: true, message: completed ? (rewarded ? '모든 짝을 찾았어요! 엽전 60개와 경험치 25를 받았어요.' : '모든 짝을 찾았어요! 오늘의 보상은 이미 받았어요.') : isPair ? '같은 친구를 찾았어요!' : '다음 카드를 골라주세요.',
      event: { type: 'memoryFlip', index: action.index, matched: isPair, completed, rewarded, coins: rewarded ? 60 : 0, xp: rewarded ? 25 : 0 },
    };
  }

  if (action.type === 'memoryHide') {
    if (state.travel.memory.flipped.length !== 2) return failure('덮을 카드가 없어요.');
    return { state: { ...state, travel: { ...state.travel, memory: { ...state.travel.memory, flipped: [] } } }, ok: true, message: '다시 같은 친구를 찾아보세요.', event: { type: 'memoryHide' } };
  }

  if (action.type === 'rollYut') {
    const yut = state.travel.yut;
    if (yut.completed) return failure('오늘의 윷놀이를 완주했어요. 내일 다시 만나요!');
    const lastRoll = 1 + Math.floor(Math.random() * 5);
    const position = Math.min(12, yut.position + lastRoll);
    const completed = position === 12;
    const name = ['도', '개', '걸', '윷', '모'][lastRoll - 1];
    return {
      state: { ...state, coins: addBounded(state.coins, completed ? 80 : 0), xp: addBounded(state.xp, completed ? 35 : 0), travel: { ...state.travel, yut: { position, lastRoll, rolls: addBounded(yut.rolls, 1), completed } } },
      ok: true, message: completed ? '윷놀이 완주! 엽전 80개와 경험치 35를 받았어요.' : `${name}! ${lastRoll}칸 앞으로 가요.`,
      event: { type: 'rollYut', roll: lastRoll, name, position, completed, coins: completed ? 80 : 0, xp: completed ? 35 : 0 },
    };
  }

  if (action.type === 'claimAlbum') {
    const chain = CHAIN_BY_ID.get(action.chain);
    if (!chain) return failure('완성한 도감을 선택해 주세요.');
    const progress = getAlbumProgress(state, chain.id);
    if (progress.claimed) return failure('이 도감의 완성 선물은 이미 받았어요.');
    if (!progress.ready) return failure('한 계열의 아이템 6종을 모두 발견해 주세요.');
    return { state: { ...state, gems: addBounded(state.gems, 3), travel: { ...state.travel, albumClaims: [...state.travel.albumClaims, chain.id] } }, ok: true, message: `${chain.name} 도감 완성! 보석 3개를 받았어요.`, event: { type: 'claimAlbum', chain: chain.id, gems: 3 } };
  }

  if (action.type === 'buyPass') {
    if (state.travel.pass.premium) return failure('이번 주 여행 패스를 이미 열었어요.');
    if (state.gems < 20) return failure('여행 패스에는 게임 보석 20개가 필요해요.');
    return { state: { ...state, gems: state.gems - 20, travel: { ...state.travel, pass: { ...state.travel.pass, premium: true } } }, ok: true, message: '이번 주 여행 패스를 열었어요!', event: { type: 'buyPass', gems: -20 } };
  }

  if (action.type === 'claimPass') {
    if (!validInteger(action.tier, 0, PASS_TIERS.length - 1) || (action.premium !== undefined && typeof action.premium !== 'boolean')) return failure('받을 패스 보상을 선택해 주세요.');
    const premium = action.premium === true;
    const progress = getPassProgress(state, action.tier, premium, timestamp);
    if (progress.locked) return failure('게임 보석으로 여행 패스를 먼저 열어주세요.');
    if (progress.claimed) return failure('이미 받은 패스 보상이에요.');
    if (!progress.ready) return failure('이번 주 주문을 더 완료해 주세요.');
    const tier = PASS_TIERS[action.tier];
    const coins = premium ? 0 : tier.coins;
    const gems = premium ? tier.premiumGems : tier.gems;
    const claims = premium ? 'premiumClaims' : 'freeClaims';
    return {
      state: { ...state, coins: addBounded(state.coins, coins), gems: addBounded(state.gems, gems), travel: { ...state.travel, pass: { ...state.travel.pass, [claims]: [...state.travel.pass[claims], action.tier] } } },
      ok: true, message: '여행 패스 보상을 받았어요!', event: { type: 'claimPass', tier: action.tier, premium, coins, gems },
    };
  }

  if (action.type === 'buyOffer') {
    const offer = OFFERS.find((entry) => entry.id === action.offerId);
    if (!offer) return failure('꾸러미를 선택해 주세요.');
    if (action.quantity !== undefined && action.quantity !== 1) return failure('꾸러미는 한 번에 하나씩 구매해 주세요.');
    const purchased = state.travel.offers[offer.id];
    if (offer.limit === 'once' ? purchased !== null : purchased === state.travel.day) return failure('이미 구매한 꾸러미예요.');
    if (state.gems < offer.cost) return failure(`게임 보석 ${offer.cost}개가 필요해요.`);
    if (state.energy + offer.energy > state.maxEnergy) return failure(`에너지가 ${state.maxEnergy - offer.energy} 이하일 때 구매할 수 있어요.`);
    if (state.coins + offer.coins > MAX_COUNTER) return failure('엽전을 먼저 사용한 뒤 구매해 주세요.');
    const energy = state.energy + offer.energy;
    return {
      state: { ...state, gems: state.gems - offer.cost, coins: state.coins + offer.coins, energy, lastEnergyAt: energy === state.maxEnergy ? Math.max(timestamp, state.createdAt) : state.lastEnergyAt, travel: { ...state.travel, offers: { ...state.travel.offers, [offer.id]: state.travel.day } } },
      ok: true, message: `${offer.name}을 받았어요!`, event: { type: 'buyOffer', offerId: offer.id, gems: -offer.cost, coins: offer.coins, energy: offer.energy },
    };
  }

  if (action.type === 'buyItem') {
    const chain = CHAIN_BY_ID.get(action.chain);
    if (!chain || !validInteger(action.level, 0, 4)) return failure('구매할 아이템을 선택해 주세요.');
    if (action.quantity !== undefined && action.quantity !== 1) return failure('아이템은 한 번에 하나씩 구매해 주세요.');
    if (getLevel(state) < (chain.unlockLevel || 1)) return failure(`레벨 ${chain.unlockLevel}에 열리는 아이템이에요.`);
    const index = state.board.indexOf(null);
    if (index === -1) return failure('보드에 빈칸을 먼저 만들어 주세요.');
    const cost = 2 ** action.level;
    if (state.gems < cost) return failure(`게임 보석 ${cost}개가 필요해요.`);
    const item = { chain: chain.id, level: action.level };
    const board = [...state.board];
    board[index] = item;
    const { discovered, newDiscovery } = discover(state, item);
    return { state: { ...state, board, discovered, gems: state.gems - cost }, ok: true, message: `${getItemDefinition(item).name}을 받았어요!`, event: { type: 'buyItem', index, item, newDiscovery, gems: -cost } };
  }

  if (action.type === 'move') {
    const { from, to } = action;
    if (!validInteger(from, 0, BOARD_SIZE - 1) || !validInteger(to, 0, BOARD_SIZE - 1)) return failure('올바른 칸을 선택해 주세요.');
    if (from === to) return failure('다른 칸으로 옮겨 주세요.');
    const source = state.board[from];
    const target = state.board[to];
    if (!source) return failure('옮길 아이템이 없어요.');
    const board = [...state.board];
    if (target && !source.generator && !target.generator && source.chain === target.chain && source.level === target.level) {
      if (source.level === CHAIN_BY_ID.get(source.chain).items.length - 1) return failure('이미 가장 높은 단계의 아이템이에요.');
      const item = { chain: source.chain, level: source.level + 1 };
      board[from] = null;
      board[to] = item;
      const { discovered, newDiscovery } = discover(state, item);
      return {
        state: { ...state, board, discovered, mergeCount: addBounded(state.mergeCount, 1) },
        ok: true,
        message: `${getItemDefinition(item).name} 완성!`,
        event: { type: 'merge', index: to, item, newDiscovery },
      };
    }
    board[to] = source;
    board[from] = target;
    return { state: { ...state, board }, ok: true, message: target ? '아이템의 자리를 바꿨어요.' : '아이템을 옮겼어요.', event: { type: target ? 'swap' : 'move', index: to, item: source } };
  }

  if (action.type === 'generate') {
    const fromGenerator = action.index !== undefined;
    if (fromGenerator && (!validInteger(action.index, 0, BOARD_SIZE - 1) || !state.board[action.index]?.generator)) {
      return failure('번개 표시가 있는 생산기를 선택해 주세요.');
    }
    const chain = fromGenerator ? state.board[action.index].chain : action.chain;
    if (!CHAIN_BY_ID.has(chain)) return failure('만들 재료를 선택해 주세요.');
    if (getLevel(state) < (CHAIN_BY_ID.get(chain).unlockLevel || 1)) return failure(`레벨 ${CHAIN_BY_ID.get(chain).unlockLevel}에 열리는 공방이에요.`);
    const index = state.board.indexOf(null);
    if (index === -1) return failure('보드가 가득 찼어요. 합성하거나 주문을 완료해 주세요.');
    if (state.energy < 1) return failure('에너지가 부족해요. 잠시 기다리거나 충전해 주세요.');
    const item = { chain, level: Math.random() < 0.1 ? 1 : 0 };
    const board = [...state.board];
    board[index] = item;
    const { discovered, newDiscovery } = discover(state, item);
    return { state: { ...state, board, discovered, energy: state.energy - 1, generatorCount: addBounded(state.generatorCount, 1) }, ok: true, message: `${getItemDefinition(item).name} 준비 완료!`, event: { type: 'generate', index, item, newDiscovery, ...(fromGenerator ? { sourceIndex: action.index } : {}) } };
  }

  if (action.type === 'fulfill') {
    const order = state.orders.find((entry) => entry.id === action.orderId);
    if (!order) return failure('주문을 찾을 수 없어요.');
    if (!canFulfillOrder(state, order)) return failure('주문에 필요한 아이템을 더 만들어 주세요.');
    const remaining = aggregateRequirements(order);
    const board = state.board.map((item) => {
      if (!item) return null;
      if (item.generator) return item;
      const key = `${item.chain}:${item.level}`;
      const quantity = remaining.get(key) || 0;
      if (quantity < 1) return item;
      remaining.set(key, quantity - 1);
      return null;
    });
    const nextXp = addBounded(state.xp, order.xp);
    const nextOrder = replacementOrder({ ...state, xp: nextXp });
    return {
      state: {
        ...state,
        board,
        coins: addBounded(state.coins, order.coins),
        xp: nextXp,
        completedOrders: addBounded(state.completedOrders, 1),
        orders: state.orders.map((entry) => entry.id === order.id ? nextOrder : entry),
        travel: { ...state.travel, pass: { ...state.travel.pass, orders: addBounded(state.travel.pass.orders, 1) } },
      },
      ok: true,
      message: `${order.name}님의 주문 완료! +${order.coins} 코인`,
      event: { type: 'fulfill', coins: order.coins, xp: order.xp },
    };
  }

  if (action.type === 'sell') {
    if (!validInteger(action.index, 0, BOARD_SIZE - 1)) return failure('판매할 아이템을 선택해 주세요.');
    const item = state.board[action.index];
    if (!item) return failure('이 칸에는 아이템이 없어요.');
    if (item.generator) return failure('생산기는 판매할 수 없어요.');
    const coins = 2 ** item.level;
    const board = [...state.board];
    board[action.index] = null;
    return { state: { ...state, board, coins: addBounded(state.coins, coins) }, ok: true, message: `${getItemDefinition(item).name} 판매! +${coins} 코인`, event: { type: 'sell', index: action.index, item, coins } };
  }

  if (action.type === 'store') {
    if (!validInteger(action.index, 0, BOARD_SIZE - 1)) return failure('보관할 아이템을 선택해 주세요.');
    const item = state.board[action.index];
    if (!item) return failure('이 칸에는 아이템이 없어요.');
    if (item.generator) return failure('생산기는 보관할 수 없어요.');
    if (state.inventory.length >= INVENTORY_CAPACITY) return failure('보관함이 가득 찼어요. 아이템을 먼저 꺼내 주세요.');
    const board = [...state.board];
    board[action.index] = null;
    return { state: { ...state, board, inventory: [...state.inventory, cloneItem(item)] }, ok: true, message: `${getItemDefinition(item).name} 보관 완료!`, event: { type: 'store', index: action.index, item } };
  }

  if (action.type === 'retrieve') {
    if (!validInteger(action.inventoryIndex, 0, state.inventory.length - 1)) return failure('꺼낼 아이템을 선택해 주세요.');
    const index = state.board.indexOf(null);
    if (index === -1) return failure('보드가 가득 찼어요. 빈칸을 먼저 만들어 주세요.');
    const item = state.inventory[action.inventoryIndex];
    const board = [...state.board];
    board[index] = cloneItem(item);
    const inventory = state.inventory.filter((_, itemIndex) => itemIndex !== action.inventoryIndex);
    return { state: { ...state, board, inventory }, ok: true, message: `${getItemDefinition(item).name} 꺼내기 완료!`, event: { type: 'retrieve', index, item } };
  }

  if (action.type === 'claimQuest') {
    const quest = QUESTS.find((entry) => entry.id === action.questId);
    if (!quest) return failure('미션을 찾을 수 없어요.');
    const progress = getQuestProgress(state, quest);
    if (progress.claimed) return failure('이미 받은 보상이에요.');
    if (!progress.ready) return failure('미션을 완료하면 보상을 받을 수 있어요.');
    return {
      state: { ...state, coins: addBounded(state.coins, quest.reward.coins || 0), gems: addBounded(state.gems, quest.reward.gems || 0), questClaims: [...state.questClaims, quest.id] },
      ok: true,
      message: `${quest.title} 완료! ${quest.reward.coins ? `+${quest.reward.coins} 코인` : `+${quest.reward.gems} 보석`}`,
      event: { type: 'claimQuest', questId: quest.id, ...quest.reward },
    };
  }

  if (action.type === 'gemRefill') {
    if (state.energy >= state.maxEnergy) return failure('에너지가 이미 가득 찼어요.');
    if (state.gems < 5) return failure('충전하려면 보석 5개가 필요해요.');
    const energy = Math.min(state.maxEnergy, state.energy + 50);
    return { state: { ...state, gems: state.gems - 5, energy, lastEnergyAt: energy === state.maxEnergy ? Math.max(timestamp, state.createdAt) : state.lastEnergyAt }, ok: true, message: `에너지 ${energy - state.energy} 충전 완료!`, event: { type: 'gemRefill', gems: -5, energy: energy - state.energy } };
  }

  if (action.type === 'refill') {
    if (state.energy >= state.maxEnergy) return failure('에너지가 이미 가득 찼어요.');
    if (state.coins < 50) return failure('충전하려면 50 코인이 필요해요.');
    const energy = Math.min(state.maxEnergy, state.energy + 30);
    return { state: { ...state, coins: state.coins - 50, energy, lastEnergyAt: energy === state.maxEnergy ? Math.max(timestamp, state.createdAt) : state.lastEnergyAt }, ok: true, message: `에너지 ${energy - state.energy} 충전 완료!`, event: { type: 'refill', coins: -50 } };
  }

  return failure('할 일을 선택해 주세요.');
}
