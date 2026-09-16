import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_SIZE,
  ENERGY_INTERVAL_MS,
  ITEM_CHAINS,
  CHARACTERS,
  QUESTS,
  getQuestProgress,
  getUnlockedChains,
  applyAction,
  canFulfillOrder,
  createInitialState,
  getItemDefinition,
  getLevel,
  getOrderProgress,
  hydrateState,
  refreshEnergy,
} from '../src/game.js';

const NOW = 1_800_000_000_000;

function boardState(items, overrides = {}) {
  const state = createInitialState(NOW);
  const board = Array(BOARD_SIZE).fill(null);
  for (const [index, chain, level] of items) board[index] = { chain, level };
  return {
    ...state,
    board,
    discovered: [...new Set([...state.discovered, ...items.map(([, chain, level]) => `${chain}:${level}`)])],
    ...overrides,
  };
}

test('initial state offers merge pairs and an immediately fulfillable first order', () => {
  const state = createInitialState(NOW);
  assert.equal(state.board.length, 63);
  assert.equal(state.board.filter(Boolean).length, 45);
  assert.deepEqual(state.board[2], state.board[3]);
  assert.deepEqual(state.board.filter((item) => item?.generator).map((item) => item.chain), getUnlockedChains(state).map((chain) => chain.id));
  assert.equal(getItemDefinition(state.board[0]).name, '매듭 재료함');
  assert.equal(state.version, 4);
  assert.deepEqual(state.orders.map((order) => order.name), ['까치', '호랑이', '해태']);
  assert.deepEqual(state.orders.map((order) => order.avatar), [0, 1, 2]);
  assert.equal(canFulfillOrder(state, state.orders[0]), true);
  assert.deepEqual(getOrderProgress(state, state.orders[0]), { have: 2, total: 2 });
  assert.equal(getItemDefinition({ chain: 'maedeup', level: 2 }).name, '도래매듭');
  assert.equal(getItemDefinition({ chain: 'unknown', level: 0 }), null);
  assert.equal(getLevel({ xp: 199 }), 2);
});

test('merges matching items exactly once, records discoveries and leaves original state untouched', () => {
  const state = boardState([[0, 'maedeup', 4], [1, 'maedeup', 4]]);
  const snapshot = structuredClone(state);
  const result = applyAction(state, { type: 'move', from: 0, to: 1 }, NOW);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.board[1], { chain: 'maedeup', level: 5 });
  assert.equal(result.state.board[0], null);
  assert.equal(result.state.mergeCount, 1);
  assert.equal(result.state.energy, 100);
  assert.deepEqual(result.event, { type: 'merge', index: 1, item: { chain: 'maedeup', level: 5 }, newDiscovery: true });
  assert.ok(result.state.discovered.includes('maedeup:5'));
  assert.deepEqual(state, snapshot);
});

test('different chains and different levels swap without merging', () => {
  for (const destination of [['bojagi', 0], ['maedeup', 1]]) {
    const state = boardState([[0, 'maedeup', 0], [1, ...destination]]);
    const result = applyAction(state, { type: 'move', from: 0, to: 1 }, NOW);
    assert.equal(result.ok, true);
    assert.equal(result.event.type, 'swap');
    assert.deepEqual(result.state.board[0], state.board[1]);
    assert.deepEqual(result.state.board[1], state.board[0]);
    assert.equal(result.state.mergeCount, 0);
  }
});

test('moving to an empty cell preserves item count; identical max-level items stay intact', () => {
  const state = boardState([[0, 'maedeup', 5], [1, 'maedeup', 5]]);
  const blocked = applyAction(state, { type: 'move', from: 0, to: 1 }, NOW);
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.state, state);
  const moved = applyAction(state, { type: 'move', from: 0, to: 2 }, NOW);
  assert.equal(moved.event.type, 'move');
  assert.equal(moved.state.board[0], null);
  assert.equal(moved.state.board.filter(Boolean).length, 2);
  assert.deepEqual(moved.state.board[2], { chain: 'maedeup', level: 5 });
});

test('fulfillment consumes exact items, awards rewards and replaces one order', () => {
  const state = createInitialState(NOW);
  const order = state.orders[0];
  const result = applyAction(state, { type: 'fulfill', orderId: order.id }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.board.filter(Boolean).length, 43);
  assert.equal(result.state.board[1], null);
  assert.equal(result.state.board[5], null);
  assert.equal(result.state.coins, state.coins + order.coins);
  assert.equal(result.state.xp, order.xp);
  assert.equal(result.state.completedOrders, 1);
  assert.equal(result.state.orders.length, 3);
  assert.notEqual(result.state.orders[0].id, order.id);
  assert.deepEqual(result.state.orders.slice(1), state.orders.slice(1));
  assert.equal(result.event.type, 'fulfill');
  assert.equal(state.board.filter(Boolean).length, 45);
});

test('duplicate requirements cannot reuse items; fulfillment preserves surplus and unrelated items', () => {
  const state = boardState([[0, 'maedeup', 1], [1, 'maedeup', 1], [2, 'bojagi', 1]]);
  state.orders[0].requirements = [
    { chain: 'maedeup', level: 1, quantity: 1 },
    { chain: 'maedeup', level: 1, quantity: 2 },
  ];
  assert.deepEqual(getOrderProgress(state, state.orders[0]), { have: 2, total: 3 });
  assert.equal(canFulfillOrder(state, state.orders[0]), false);
  assert.equal(applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW).ok, false);
  state.board[3] = { chain: 'maedeup', level: 1 };
  state.board[4] = { chain: 'maedeup', level: 1 };
  const result = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.board.filter((item) => item?.chain === 'maedeup').length, 1);
  assert.deepEqual(result.state.board[2], { chain: 'bojagi', level: 1 });
});

test('invalid actions fail safely without changing game resources', () => {
  const state = createInitialState(NOW);
  const actions = [null, {}, { type: 'unknown' }, { type: 'move', from: -1, to: 0 },
    { type: 'move', from: 0, to: BOARD_SIZE }, { type: 'move', from: 0.5, to: 1 },
    { type: 'move', from: '0', to: 1 }, { type: 'move', from: 0, to: 0 },
    { type: 'move', from: 32, to: 0 }, { type: 'generate', chain: '__proto__' },
    { type: 'fulfill', orderId: 'missing' }, { type: 'sell', index: 32 }, { type: 'sell', index: NaN },
    { type: 'generate', index: 1 }, { type: 'generate', index: -1 }, { type: 'generate', index: 63 },
    { type: 'store', index: 32 }, { type: 'store', index: 63 }, { type: 'retrieve', inventoryIndex: 0 },
    { type: 'claimQuest', questId: 'unknown' }];
  for (const action of actions) {
    const result = applyAction(state, action, NOW);
    assert.equal(result.ok, false, JSON.stringify(action));
    assert.deepEqual(result.state, state, JSON.stringify(action));
  }
});

test('generation requires both energy and a free cell and spends exactly one energy', () => {
  const full = boardState(Array.from({ length: BOARD_SIZE }, (_, index) => [index, 'maedeup', 0]));
  const blocked = applyAction(full, { type: 'generate', chain: 'maedeup' }, NOW);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.state.energy, 100);
  const empty = boardState([], { energy: 0 });
  assert.equal(applyAction(empty, { type: 'generate', chain: 'maedeup' }, NOW).ok, false);
  const generated = applyAction(createInitialState(NOW), { type: 'generate', chain: 'bojagi' }, NOW);
  assert.equal(generated.ok, true);
  assert.equal(generated.state.energy, 99);
  assert.equal(generated.state.board.filter(Boolean).length, 46);
  assert.equal(generated.event.item.chain, 'bojagi');
  assert.ok([0, 1].includes(generated.event.item.level));
});

test('energy regenerates per elapsed minute and preserves fractional progress', () => {
  const state = { ...createInitialState(NOW), energy: 50 };
  assert.equal(refreshEnergy(state, NOW + 59_999), state);
  const refreshed = refreshEnergy(state, NOW + 2 * ENERGY_INTERVAL_MS + 30_000);
  assert.equal(refreshed.energy, 52);
  assert.equal(refreshed.lastEnergyAt, NOW + 2 * ENERGY_INTERVAL_MS);
  assert.equal(refreshEnergy(refreshed, NOW + 3 * ENERGY_INTERVAL_MS).energy, 53);
  assert.equal(state.energy, 50);
});

test('full energy discards idle-time credits and spending starts a fresh countdown', () => {
  const later = NOW + 20 * ENERGY_INTERVAL_MS;
  const generated = applyAction(createInitialState(NOW), { type: 'generate', chain: 'maedeup' }, later);
  assert.equal(generated.state.energy, 99);
  assert.equal(generated.state.lastEnergyAt, later);
  assert.equal(refreshEnergy(generated.state, later + 59_999).energy, 99);
  const full = refreshEnergy({ ...createInitialState(NOW), energy: 99 }, later);
  assert.equal(full.energy, 100);
  assert.equal(full.lastEnergyAt, later);
});

test('offline regeneration is applied before actions and energy remains capped', () => {
  const exhausted = { ...createInitialState(NOW), energy: 0 };
  const generated = applyAction(exhausted, { type: 'generate', chain: 'maedeup' }, NOW + ENERGY_INTERVAL_MS);
  assert.equal(generated.ok, true);
  assert.equal(generated.state.energy, 0);
  assert.equal(refreshEnergy(exhausted, NOW + 1_000 * ENERGY_INTERVAL_MS).energy, 100);
});

test('a backwards clock grants no energy and never makes the state timestamp invalid', () => {
  const state = { ...createInitialState(NOW), energy: 50, createdAt: NOW - 100_000 };
  const refreshed = refreshEnergy(state, NOW - 30_000);
  assert.equal(refreshed.energy, 50);
  assert.equal(refreshed.lastEnergyAt, NOW - 30_000);
  const beforeCreation = refreshEnergy(state, NOW - 200_000);
  assert.equal(beforeCreation.energy, 50);
  assert.equal(beforeCreation.lastEnergyAt, state.createdAt);
});

test('refill and selling charge or award only for valid actions', () => {
  const state = { ...createInitialState(NOW), energy: 80 };
  const result = applyAction(state, { type: 'refill' }, NOW);
  assert.equal(result.state.energy, 100);
  assert.equal(result.state.coins, 70);
  assert.equal(applyAction(result.state, { type: 'refill' }, NOW).ok, false);
  assert.equal(applyAction({ ...state, coins: 49 }, { type: 'refill' }, NOW).ok, false);
  const sold = applyAction(state, { type: 'sell', index: 10 }, NOW);
  assert.equal(sold.ok, true);
  assert.equal(sold.state.board[10], null);
  assert.equal(sold.state.coins, 124);
});

test('hydration clones valid saves, removes unknown fields and restores offline energy', () => {
  const state = { ...createInitialState(NOW), energy: 10, secret: 'discard me' };
  const restored = hydrateState(JSON.stringify(state), NOW + 120_000);
  assert.equal(restored.energy, 12);
  assert.equal(restored.secret, undefined);
  assert.notEqual(restored.board, state.board);
  assert.deepEqual(restored.orders, state.orders);
  const cloned = hydrateState(state, NOW);
  cloned.orders[0].requirements[0].quantity = 10;
  assert.equal(state.orders[0].requirements[0].quantity, 1);
});

test('malformed and corrupted saves fall back to a valid fresh state', () => {
  const invalidSaves = ['{bad json', null, [], {}, { ...createInitialState(NOW), version: 5 }];
  const changes = [
    (s) => { s.board.pop(); },
    (s) => { delete s.board[2]; },
    (s) => { s.board[0].level = 6; },
    (s) => { s.board[0].chain = 'constructor'; },
    (s) => { s.coins = 1e20; },
    (s) => { s.xp = -1; },
    (s) => { s.completedOrders = 1.5; },
    (s) => { s.energy = 101; },
    (s) => { s.maxEnergy = 999; },
    (s) => { s.lastEnergyAt = NOW + 1; },
    (s) => { s.createdAt = -1; },
    (s) => { s.orders[1].id = s.orders[0].id; },
    (s) => { s.orders[1].avatar = 15; },
    (s) => { delete s.orders[0]; },
    (s) => { delete s.orders[0].requirements[0]; },
    (s) => { s.orders[0].requirements[0].quantity = 0; },
    (s) => { s.orders[0].requirements[0].quantity = 64; },
    (s) => { s.orders[0].coins = Infinity; },
    (s) => { s.discovered = ['maedeup:99']; },
    (s) => { s.discovered = []; },
    (s) => { s.discovered = Array(6); s.board.fill(null); },
    (s) => { s.board[0].generator = 'yes'; },
    (s) => { s.gems = -1; },
    (s) => { s.generatorCount = -1; },
    (s) => { s.inventory = Array(9).fill({ chain: 'maedeup', level: 0 }); },
    (s) => { s.inventory = [{ chain: 'maedeup', level: 0, generator: true }]; },
    (s) => { s.inventory = Array(1); },
    (s) => { s.questClaims = ['garden', 'garden']; },
    (s) => { s.questClaims = ['unknown']; },
  ];
  for (const change of changes) {
    const state = createInitialState(NOW);
    change(state);
    invalidSaves.push(state);
  }
  for (const invalid of invalidSaves) assert.deepEqual(hydrateState(invalid, NOW), createInitialState(NOW));
});

test('bounded counters never overflow and saved states remain hydratable after rewards', () => {
  const state = { ...createInitialState(NOW), coins: 999_999_999, xp: 999_999_999, completedOrders: 999_999_999 };
  const result = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.coins, 1_000_000_000);
  assert.equal(result.state.xp, 1_000_000_000);
  assert.equal(result.state.completedOrders, 1_000_000_000);
  assert.deepEqual(hydrateState(result.state, NOW), result.state);
});

test('reset returns fresh independent state and all chain definitions have six levels', () => {
  const initial = createInitialState(NOW);
  const result = applyAction({ invalid: true }, { type: 'reset' }, NOW);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, initial);
  result.state.board[0].level = 2;
  assert.equal(initial.board[0].level, 0);
  assert.ok(ITEM_CHAINS.every((chain) => chain.items.length === 6));
});

test('on-board generators spend one energy, stay intact and can move or swap without merging', () => {
  const initial = createInitialState(NOW);
  for (const index of [0, 7, 14, 21, 28, 35, 42, 49, 56, 62]) {
    const generated = applyAction(initial, { type: 'generate', index }, NOW);
    assert.equal(generated.ok, true);
    assert.equal(generated.state.energy, 99);
    assert.equal(generated.state.generatorCount, 1);
    assert.equal(generated.event.item.chain, initial.board[index].chain);
    assert.equal(generated.event.sourceIndex, index);
    assert.deepEqual(generated.state.board[index], initial.board[index]);
    assert.equal(applyAction(initial, { type: 'sell', index }, NOW).ok, false);
    assert.equal(applyAction(initial, { type: 'store', index }, NOW).ok, false);
  }
  const state = boardState([[1, 'maedeup', 0]]);
  state.board[0] = { chain: 'maedeup', level: 0, generator: true };
  const swapped = applyAction(state, { type: 'move', from: 0, to: 1 }, NOW);
  assert.equal(swapped.event.type, 'swap');
  assert.deepEqual(swapped.state.board[1], state.board[0]);
  assert.equal(swapped.state.mergeCount, 0);
  const moved = applyAction(swapped.state, { type: 'move', from: 1, to: 62 }, NOW);
  assert.equal(moved.event.type, 'move');
  assert.equal(moved.state.board[62].generator, true);
  assert.equal(moved.state.board[1], null);
});

test('order progress and fulfillment never count or consume generators or stored items', () => {
  const state = boardState([]);
  state.board[0] = { chain: 'maedeup', level: 0, generator: true };
  state.inventory = [{ chain: 'maedeup', level: 0 }];
  state.discovered.push('maedeup:0');
  state.orders[0].requirements = [{ chain: 'maedeup', level: 0, quantity: 1 }];
  assert.deepEqual(getOrderProgress(state, state.orders[0]), { have: 0, total: 1 });
  assert.equal(applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW).ok, false);
  state.board[1] = { chain: 'maedeup', level: 0 };
  const result = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.board[0], state.board[0]);
  assert.equal(result.state.board[1], null);
  assert.deepEqual(result.state.inventory, state.inventory);
});

test('inventory stores and retrieves exact items without charging resources and enforces capacity', () => {
  const initial = createInitialState(NOW);
  const stored = applyAction(initial, { type: 'store', index: 1 }, NOW);
  assert.equal(stored.ok, true);
  assert.equal(stored.state.board[1], null);
  assert.deepEqual(stored.state.inventory, [initial.board[1]]);
  assert.equal(stored.state.coins, initial.coins);
  assert.equal(stored.state.energy, initial.energy);
  const retrieved = applyAction(stored.state, { type: 'retrieve', inventoryIndex: 0 }, NOW);
  assert.equal(retrieved.ok, true);
  assert.deepEqual(retrieved.state, initial);
  const fullInventory = { ...initial, inventory: Array.from({ length: 8 }, () => ({ chain: 'maedeup', level: 1 })) };
  const rejected = applyAction(fullInventory, { type: 'store', index: 1 }, NOW);
  assert.equal(rejected.ok, false);
  assert.deepEqual(rejected.state, fullInventory);
  const fullBoard = boardState(Array.from({ length: BOARD_SIZE }, (_, index) => [index, 'maedeup', 0]), { inventory: [{ chain: 'hanbok', level: 1 }] });
  assert.equal(applyAction(fullBoard, { type: 'retrieve', inventoryIndex: 0 }, NOW).ok, false);
  assert.deepEqual(hydrateState(stored.state, NOW), stored.state);
});

test('gem energy refills cost exactly five gems, cap energy and reject unavailable purchases', () => {
  const state = { ...createInitialState(NOW), energy: 20 };
  const charged = applyAction(state, { type: 'gemRefill' }, NOW);
  assert.equal(charged.state.energy, 70);
  assert.equal(charged.state.gems, 10);
  assert.equal(charged.state.coins, state.coins);
  const capped = applyAction(charged.state, { type: 'gemRefill' }, NOW);
  assert.equal(capped.state.energy, 100);
  assert.equal(capped.state.gems, 5);
  assert.equal(applyAction(capped.state, { type: 'gemRefill' }, NOW).ok, false);
  assert.equal(applyAction({ ...state, gems: 4 }, { type: 'gemRefill' }, NOW).ok, false);
});

test('each quest is claimable only after its target and its reward cannot be collected twice', () => {
  for (const quest of QUESTS) {
    let state = createInitialState(NOW);
    assert.equal(getQuestProgress(state, quest).ready, false);
    assert.equal(applyAction(state, { type: 'claimQuest', questId: quest.id }, NOW).ok, false);
    if (quest.id === 'merge') state = { ...state, mergeCount: 10 };
    if (quest.id === 'orders') state = { ...state, completedOrders: 5 };
    if (quest.id === 'garden') state = applyAction(state, { type: 'move', from: 6, to: 13 }, NOW).state;
    assert.equal(getQuestProgress(state, quest).ready, true);
    const result = applyAction(state, { type: 'claimQuest', questId: quest.id }, NOW);
    assert.equal(result.ok, true);
    assert.equal(result.state.coins, state.coins + (quest.reward.coins || 0));
    assert.equal(result.state.gems, state.gems + (quest.reward.gems || 0));
    assert.equal(getQuestProgress(result.state, quest).claimed, true);
    assert.equal(getQuestProgress(result.state, quest).ready, false);
    const duplicate = applyAction(result.state, { type: 'claimQuest', questId: quest.id }, NOW);
    assert.equal(duplicate.ok, false);
    assert.deepEqual(duplicate.state, result.state);
    assert.deepEqual(hydrateState(result.state, NOW), result.state);
  }
});

const LEGACY_MAP = { coffee: 'maedeup', bakery: 'bojagi', grill: 'celadon', plant: 'hanbok' };
const translateItem = (item) => item === null ? null : { ...item, chain: LEGACY_MAP[item.chain] };

function legacyState() {
  const board = Array(42).fill(null);
  for (const [index, chain, level] of [[0, 'coffee', 0], [1, 'coffee', 0], [10, 'coffee', 2], [11, 'bakery', 2], [13, 'coffee', 5], [36, 'bakery', 3], [41, 'bakery', 0]]) {
    board[index] = { chain, level };
  }
  return {
    version: 1, board, coins: 492, xp: 265, energy: 25, maxEnergy: 100,
    mergeCount: 29, completedOrders: 7,
    orders: [
      { id: 'saved-0', name: '민아', avatar: 0, dialogue: '커피와 크루아상 부탁해요!', requirements: [{ chain: 'coffee', level: 2, quantity: 1 }, { chain: 'bakery', level: 2, quantity: 1 }], coins: 40, xp: 35 },
      { id: 'saved-1', name: '준', avatar: 1, dialogue: '따뜻한 라테 한 잔 주세요.', requirements: [{ chain: 'coffee', level: 3, quantity: 1 }], coins: 35, xp: 28 },
      { id: 'saved-2', name: '현우', avatar: 5, dialogue: '케이크를 포장해 주세요.', requirements: [{ chain: 'bakery', level: 3, quantity: 2 }], coins: 85, xp: 53 },
    ],
    discovered: ['coffee', 'bakery'].flatMap((chain) => Array.from({ length: 6 }, (_, level) => `${chain}:${level}`)),
    lastEnergyAt: NOW, createdAt: NOW - 10_000,
  };
}

function assertMigratedOrders(actual, previous) {
  for (let index = 0; index < previous.length; index += 1) {
    const oldOrder = previous[index];
    const order = actual[index];
    for (const key of ['id', 'avatar', 'coins', 'xp']) assert.equal(order[key], oldOrder[key]);
    assert.deepEqual(order.requirements, oldOrder.requirements.map(translateItem));
    assert.equal(order.name, CHARACTERS[oldOrder.avatar].name);
    assert.ok(order.dialogue.includes(CHARACTERS[oldOrder.avatar].nickname));
    assert.ok(!/커피|크루아상|케이크|라테/.test(order.dialogue));
  }
}

test('real v1 cafe saves migrate every item by row and preserve resources, order rewards and discoveries', () => {
  const old = legacyState();
  const snapshot = structuredClone(old);
  const state = hydrateState(old, NOW + 120_000);
  assert.equal(state.version, 4);
  assert.equal(state.board.length, BOARD_SIZE);
  for (let index = 0; index < old.board.length; index += 1) {
    const nextIndex = Math.floor(index / 6) * 7 + index % 6;
    if (old.board[index]) assert.deepEqual(state.board[nextIndex], translateItem(old.board[index]));
    else assert.ok(state.board[nextIndex] === null || state.board[nextIndex].generator);
  }
  for (const key of ['coins', 'xp', 'mergeCount', 'completedOrders', 'createdAt']) assert.equal(state[key], old[key]);
  assert.equal(state.energy, 27);
  assert.equal(state.gems, 15);
  assert.deepEqual(state.inventory, []);
  assert.deepEqual(state.questClaims, []);
  assertMigratedOrders(state.orders, old.orders);
  assert.deepEqual(state.discovered, old.discovered.map((key) => { const [chain, level] = key.split(':'); return `${LEGACY_MAP[chain]}:${level}`; }));
  assert.deepEqual(state.board.filter((item) => item?.generator).map((item) => item.chain).sort(), ITEM_CHAINS.filter((chain) => !chain.unlockLevel).map((chain) => chain.id).sort());
  assert.equal(state.board.filter((item) => item && !item.generator).length, old.board.filter(Boolean).length);
  assert.deepEqual(hydrateState(JSON.stringify(state), NOW + 120_000), state);
  assert.deepEqual(old, snapshot);
});

test('migration accepts a completely full legacy board without losing items', () => {
  const old = legacyState();
  old.board = Array.from({ length: 42 }, (_, index) => ({ chain: index % 2 ? 'coffee' : 'bakery', level: index % 6 }));
  const state = hydrateState(old, NOW);
  for (let index = 0; index < 42; index += 1) {
    assert.deepEqual(state.board[Math.floor(index / 6) * 7 + index % 6], translateItem(old.board[index]));
  }
  assert.equal(state.board.filter((item) => item?.generator).length, 10);
  assert.deepEqual(hydrateState(state, NOW), state);
});

function legacyV2State() {
  const state = legacyState();
  const board = Array(63).fill(null);
  for (const [index, chain] of [[0, 'coffee'], [14, 'bakery'], [35, 'grill'], [56, 'plant']]) {
    board[index] = { chain, level: 0, generator: true };
  }
  for (const [index, chain, level] of [[1, 'coffee', 2], [5, 'bakery', 2], [6, 'plant', 4], [8, 'grill', 5], [9, 'coffee', 0]]) {
    board[index] = { chain, level };
  }
  return {
    ...state, version: 2, board, coins: 742, xp: 361, gems: 23, energy: 42,
    generatorCount: 123, questClaims: ['merge', 'garden'],
    inventory: [{ chain: 'coffee', level: 5 }, { chain: 'bakery', level: 3 }, { chain: 'grill', level: 4 }, { chain: 'plant', level: 2 }],
    orders: [
      { ...state.orders[0], requirements: [{ chain: 'coffee', level: 2, quantity: 1 }, { chain: 'coffee', level: 2, quantity: 2 }, { chain: 'plant', level: 4, quantity: 1 }], coins: 185, xp: 99 },
      { ...state.orders[1], requirements: [{ chain: 'grill', level: 5, quantity: 2 }], coins: 325, xp: 197 },
      state.orders[2],
    ],
    discovered: Object.keys(LEGACY_MAP).flatMap((chain) => Array.from({ length: 6 }, (_, level) => `${chain}:${level}`)),
  };
}

test('v2 cafe migration preserves item indices, generator flags, inventory, quantities, rewards and claimed quests', () => {
  const old = legacyV2State();
  const snapshot = structuredClone(old);
  const state = hydrateState(JSON.stringify(old), NOW);
  assert.equal(state.version, 4);
  for (let index = 0; index < old.board.length; index += 1) {
    if (old.board[index]) assert.deepEqual(state.board[index], translateItem(old.board[index]));
    else assert.ok(state.board[index] === null || state.board[index].generator);
  }
  for (const key of ['coins', 'xp', 'gems', 'energy', 'generatorCount', 'mergeCount', 'completedOrders', 'createdAt', 'lastEnergyAt']) assert.equal(state[key], old[key]);
  assert.deepEqual(state.inventory, old.inventory.map(translateItem));
  assert.deepEqual(state.questClaims, old.questClaims);
  assertMigratedOrders(state.orders, old.orders);
  assert.equal(state.board.filter((item) => item?.generator).length, 10);
  const garden = getQuestProgress(state, 'garden');
  assert.deepEqual(garden, { have: 4, total: 4, claimed: true, ready: false });
  const duplicate = applyAction(state, { type: 'claimQuest', questId: 'garden' }, NOW);
  assert.equal(duplicate.ok, false);
  assert.deepEqual(duplicate.state, state);
  assert.deepEqual(hydrateState(state, NOW), state);
  assert.deepEqual(old, snapshot);
});

test('a full v2 board never loses an item for a new generator and workshop-menu generation stays available', () => {
  const old = legacyV2State();
  old.board = old.board.map((item, index) => item || { chain: Object.keys(LEGACY_MAP)[index % 4], level: index % 6 });
  const state = hydrateState(old, NOW);
  assert.deepEqual(state.board, old.board.map(translateItem));
  assert.equal(state.board.filter((item) => item?.generator).length, 4);
  assert.equal(applyAction(state, { type: 'generate', chain: 'fan' }, NOW).ok, false);
  const stored = applyAction(state, { type: 'store', index: 1 }, NOW);
  assert.equal(stored.ok, true);
  const generated = applyAction(stored.state, { type: 'generate', chain: 'fan' }, NOW);
  assert.equal(generated.ok, true);
  assert.equal(generated.event.item.chain, 'fan');
  assert.equal(generated.state.energy, state.energy - 1);
  assert.deepEqual(generated.state.inventory.at(-1), state.board[1]);
});

test('every traditional workshop generates its own materials with exactly one energy', () => {
  const traditional = ITEM_CHAINS.filter((chain) => !chain.unlockLevel);
  assert.equal(traditional.length, 10);
  assert.equal(traditional.reduce((total, chain) => total + chain.items.length, 0), 60);
  for (const chain of traditional) {
    const initial = createInitialState(NOW);
    const generated = applyAction(initial, { type: 'generate', chain: chain.id }, NOW);
    assert.equal(generated.ok, true, chain.id);
    assert.equal(generated.event.item.chain, chain.id);
    assert.equal(generated.state.energy, 99);
    assert.ok(generated.state.discovered.includes(`${chain.id}:${generated.event.item.level}`));
    assert.deepEqual(hydrateState(generated.state, NOW), generated.state);
  }
});

test('replacement orders cycle through all 15 characters and all 10 craft chains', () => {
  let state = createInitialState(NOW);
  const avatars = new Set();
  const requestedChains = new Set();
  assert.equal(CHARACTERS.length, 15);
  assert.equal(CHARACTERS.filter((character) => character.group.startsWith('십이지신')).length, 12);
  for (let turn = 0; turn < 30; turn += 1) {
    const order = state.orders[0];
    const board = Array(BOARD_SIZE).fill(null);
    let index = 0;
    for (const { chain, level, quantity } of order.requirements) {
      for (let count = 0; count < quantity; count += 1) board[index++] = { chain, level };
    }
    state = { ...state, xp: 0, board, discovered: [...new Set([...state.discovered, ...board.filter(Boolean).map((item) => `${item.chain}:${item.level}`)])] };
    const result = applyAction(state, { type: 'fulfill', orderId: order.id }, NOW);
    assert.equal(result.ok, true, `turn ${turn}`);
    state = result.state;
    const replacement = state.orders[0];
    assert.equal(replacement.avatar, (turn + 3) % 15);
    assert.equal(replacement.name, CHARACTERS[replacement.avatar].name);
    assert.ok(replacement.requirements.every((item) => item.level >= 1 && item.level <= 3));
    avatars.add(replacement.avatar);
    replacement.requirements.forEach((item) => requestedChains.add(item.chain));
    assert.deepEqual(hydrateState(state, NOW), state);
  }
  assert.equal(avatars.size, 15);
  assert.deepEqual([...requestedChains].sort(), ITEM_CHAINS.filter((chain) => !chain.unlockLevel).map((chain) => chain.id).sort());
});
