import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_CHAINS, ERAS, MODERN_CHAINS, BUILDINGS, OFFERS, PASS_TIERS, BOARD_SIZE,
  createInitialState, hydrateState, applyAction, getLevel, getEra, getUnlockedChains,
  getTravelState, refreshTravel, getDailyStatus, getPassProgress, getAlbumProgress,
} from '../src/game.js';

const NOW = Date.parse('2026-09-12T12:00:00.000Z');
const MONDAY = Date.parse('2026-09-14T00:00:00.000Z');
const DAY = 86_400_000;

function initial(overrides = {}, now = NOW) {
  return { ...createInitialState(now), ...overrides };
}

function withPass(state, pass) {
  return { ...state, travel: { ...state.travel, pass: { ...state.travel.pass, ...pass } } };
}

function readyOrder(state) {
  const board = Array(BOARD_SIZE).fill(null);
  let index = 0;
  for (const { chain, level, quantity } of state.orders[0].requirements) {
    for (let count = 0; count < quantity; count += 1) board[index++] = { chain, level };
  }
  return { ...state, board, discovered: [...new Set([...state.discovered, ...board.filter(Boolean).map((item) => `${item.chain}:${item.level}`)])] };
}

function solveMemory(state, now = NOW) {
  let current = state;
  for (let card = 0; card < 4; card += 1) {
    const pair = current.travel.memory.cards.map((value, index) => value === card ? index : -1).filter((index) => index >= 0);
    for (const index of pair) {
      if (current.travel.memory.matched.includes(index)) continue;
      const result = applyAction(current, { type: 'memoryFlip', index }, now);
      assert.equal(result.ok, true);
      current = hydrateState(result.state, now);
      assert.deepEqual(current, result.state, 'Every intermediate memory state must survive reload');
    }
  }
  return current;
}

test('v4 exposes 84 items and unlocks eras and modern workshops at exact level thresholds', () => {
  assert.equal(ITEM_CHAINS.length, 14);
  assert.equal(ITEM_CHAINS.reduce((sum, chain) => sum + chain.items.length, 0), 84);
  for (const [xp, era, count] of [[0, 0, 10], [299, 0, 10], [300, 1, 11], [599, 1, 11], [600, 2, 12], [899, 2, 12], [900, 3, 14]]) {
    const state = initial({ xp });
    assert.equal(getEra(state), ERAS[era]);
    assert.equal(getUnlockedChains(state).length, count);
    assert.equal(state.version, 4);
  }
  assert.deepEqual(initial().travel.built, ['gate']);
});

test('modern generators and exact-item purchases reject locked chains without spending resources', () => {
  for (const chain of MODERN_CHAINS) {
    const locked = initial({ xp: (chain.unlockLevel - 1) * 100 - 1, gems: 100 });
    for (const action of [{ type: 'generate', chain: chain.id }, { type: 'buyItem', chain: chain.id, level: 0 }]) {
      const result = applyAction(locked, action, NOW);
      assert.equal(result.ok, false, chain.id);
      assert.deepEqual(result.state, locked);
    }
    const unlocked = { ...locked, xp: locked.xp + 1 };
    const result = applyAction(unlocked, { type: 'generate', chain: chain.id }, NOW);
    assert.equal(result.ok, true);
    assert.equal(result.event.item.chain, chain.id);
    assert.equal(result.state.energy, 99);
    assert.deepEqual(hydrateState(result.state, NOW), result.state);
  }
});

test('replacement orders use only available eras and reach all 14 chains at level ten', () => {
  for (const xp of [0, 300, 600, 900]) {
    let state = initial({ xp });
    const seen = new Set();
    const available = new Set(getUnlockedChains(state).map((chain) => chain.id));
    for (let turn = 0; turn < 30; turn += 1) {
      state = readyOrder({ ...state, xp });
      const result = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW);
      assert.equal(result.ok, true);
      state = result.state;
      for (const requirement of state.orders[0].requirements) {
        assert.ok(available.has(requirement.chain), `${requirement.chain} should not appear at XP ${xp}`);
        seen.add(requirement.chain);
      }
    }
    assert.deepEqual([...seen].sort(), [...available].sort());
  }
});

test('v3 saves keep all existing progress while travel and the current weekly pass start fresh', () => {
  const { travel, ...original } = initial({ coins: 975, gems: 47, xp: 655, completedOrders: 18, mergeCount: 33, generatorCount: 109 });
  const old = { ...original, version: 3, inventory: [{ chain: 'hanbok', level: 2 }], questClaims: ['merge', 'orders'] };
  const snapshot = structuredClone(old);
  const migrated = hydrateState(JSON.stringify(old), NOW);
  for (const key of ['board', 'coins', 'gems', 'xp', 'completedOrders', 'mergeCount', 'generatorCount', 'inventory', 'questClaims', 'orders', 'discovered']) assert.deepEqual(migrated[key], old[key]);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.travel.pass.orders, 0);
  assert.equal(migrated.travel.pass.week, '2026-09-07');
  assert.deepEqual(migrated.travel.built, ['gate']);
  assert.deepEqual(hydrateState(migrated, NOW), migrated);
  assert.deepEqual(old, snapshot);
});

test('building construction respects levels and coins, charges once and awards its one-time reward', () => {
  const building = BUILDINGS.find((entry) => entry.id === 'teahouse');
  const locked = initial({ coins: 500 });
  assert.equal(applyAction(locked, { type: 'build', buildingId: building.id }, NOW).ok, false);
  const poor = initial({ xp: 100, coins: building.cost - 1 });
  assert.equal(applyAction(poor, { type: 'build', buildingId: building.id }, NOW).ok, false);
  const state = initial({ xp: 100, coins: 500 });
  const snapshot = structuredClone(state);
  const result = applyAction(state, { type: 'build', buildingId: building.id }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.coins, state.coins - building.cost);
  assert.equal(result.state.gems, state.gems + 2);
  assert.equal(result.state.xp, state.xp + 10);
  assert.deepEqual(result.state.travel.built, ['gate', building.id]);
  assert.equal(applyAction(result.state, { type: 'build', buildingId: building.id }, NOW).ok, false);
  assert.equal(applyAction(state, { type: 'build', buildingId: 'gate' }, NOW).ok, false);
  assert.equal(applyAction(state, { type: 'build', buildingId: 'missing' }, NOW).ok, false);
  assert.deepEqual(hydrateState(result.state, NOW), result.state);
  assert.deepEqual(state, snapshot);
});

test('daily rewards persist through reload, use UTC midnight and do not reset on clock rollback', () => {
  const beforeMidnight = Date.parse('2026-09-12T23:59:59.000Z');
  const state = initial({ energy: 95 }, beforeMidnight);
  const result = applyAction(state, { type: 'claimDaily' }, beforeMidnight);
  assert.equal(result.state.coins, state.coins + 50);
  assert.equal(result.state.gems, state.gems + 2);
  assert.equal(result.state.energy, 100);
  assert.equal(result.event.energy, 5);
  const restored = hydrateState(result.state, beforeMidnight);
  assert.equal(getDailyStatus(restored, beforeMidnight).claimed, true);
  assert.equal(applyAction(restored, { type: 'claimDaily' }, beforeMidnight).ok, false);
  assert.equal(applyAction(restored, { type: 'claimDaily' }, beforeMidnight - DAY).ok, false);
  const nextDay = beforeMidnight + 1000;
  assert.equal(getDailyStatus(restored, nextDay).ready, true);
  const claimedAgain = applyAction(restored, { type: 'claimDaily' }, nextDay);
  assert.equal(claimedAgain.ok, true);
  assert.equal(claimedAgain.state.coins, restored.coins + 50);
  assert.equal(claimedAgain.state.travel.day, '2026-09-13');
});

test('memory cards persist while a mismatch blocks more flips until the pair is hidden', () => {
  let state = applyAction(initial(), { type: 'memoryStart' }, NOW).state;
  const cards = state.travel.memory.cards;
  assert.equal(cards.length, 8);
  for (let card = 0; card < 4; card += 1) assert.equal(cards.filter((entry) => entry === card).length, 2);
  const first = 0;
  const other = cards.findIndex((card) => card !== cards[first]);
  state = applyAction(state, { type: 'memoryFlip', index: first }, NOW).state;
  state = hydrateState(state, NOW);
  assert.deepEqual(state.travel.memory.flipped, [first]);
  assert.equal(applyAction(state, { type: 'memoryFlip', index: first }, NOW).ok, false);
  state = applyAction(state, { type: 'memoryFlip', index: other }, NOW).state;
  assert.deepEqual(state.travel.memory.flipped, [first, other]);
  assert.equal(state.travel.memory.moves, 1);
  assert.equal(applyAction(state, { type: 'memoryFlip', index: 7 }, NOW).ok, false);
  assert.deepEqual(hydrateState(state, NOW), state);
  const hidden = applyAction(state, { type: 'memoryHide' }, NOW);
  assert.equal(hidden.ok, true);
  assert.deepEqual(hidden.state.travel.memory.flipped, []);
  assert.equal(applyAction(hidden.state, { type: 'memoryHide' }, NOW).ok, false);
});

test('completing memory pays only once per UTC day even after replay and reload', () => {
  const original = initial();
  const started = applyAction(original, { type: 'memoryStart' }, NOW).state;
  const completed = solveMemory(started);
  assert.equal(completed.travel.memory.completed, true);
  assert.equal(completed.travel.memory.rewarded, true);
  assert.equal(completed.coins, original.coins + 60);
  assert.equal(completed.xp, original.xp + 25);
  const replay = applyAction(hydrateState(completed, NOW), { type: 'memoryStart' }, NOW).state;
  assert.equal(replay.travel.memory.rewarded, true);
  const replayDone = solveMemory(replay);
  assert.equal(replayDone.coins, completed.coins);
  assert.equal(replayDone.xp, completed.xp);
  const tomorrow = applyAction(replayDone, { type: 'memoryStart' }, NOW + DAY).state;
  assert.equal(tomorrow.travel.memory.rewarded, false);
  const tomorrowDone = solveMemory(tomorrow, NOW + DAY);
  assert.equal(tomorrowDone.coins, completed.coins + 60);
  assert.equal(tomorrowDone.xp, completed.xp + 25);
});

test('yut rolls keep position through reload, cap the finish at 12 and award once daily', (t) => {
  t.mock.method(Math, 'random', () => 0.999);
  let state = initial();
  const original = structuredClone(state);
  for (const position of [5, 10, 12]) {
    const result = applyAction(state, { type: 'rollYut' }, NOW);
    assert.equal(result.ok, true);
    assert.equal(result.event.name, '모');
    assert.equal(result.state.travel.yut.position, position);
    state = hydrateState(result.state, NOW);
    assert.deepEqual(state, result.state);
  }
  assert.equal(state.coins, original.coins + 80);
  assert.equal(state.xp, original.xp + 35);
  assert.equal(state.travel.yut.completed, true);
  const duplicate = applyAction(state, { type: 'rollYut' }, NOW);
  assert.equal(duplicate.ok, false);
  assert.deepEqual(duplicate.state, state);
  const nextDay = applyAction(state, { type: 'rollYut' }, NOW + DAY);
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.state.travel.yut.position, 5);
  assert.equal(nextDay.state.coins, state.coins);
});

test('album completion requires all six discoveries and rewards each chain only once', () => {
  let state = initial();
  assert.equal(applyAction(state, { type: 'claimAlbum', chain: 'maedeup' }, NOW).ok, false);
  state = { ...state, discovered: [...new Set([...state.discovered, ...Array.from({ length: 6 }, (_, level) => `maedeup:${level}`)])] };
  assert.deepEqual(getAlbumProgress(state, 'maedeup'), { have: 6, total: 6, claimed: false, ready: true });
  const result = applyAction(state, { type: 'claimAlbum', chain: 'maedeup' }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.state.gems, state.gems + 3);
  assert.equal(getAlbumProgress(result.state, 'maedeup').claimed, true);
  assert.equal(applyAction(hydrateState(result.state, NOW + DAY), { type: 'claimAlbum', chain: 'maedeup' }, NOW + DAY).ok, false);
});

test('pass order count changes on fulfillment only and resets at Monday UTC', () => {
  let state = initial();
  assert.equal(state.travel.pass.week, '2026-09-07');
  state = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW).state;
  assert.equal(state.travel.pass.orders, 1);
  const invalid = applyAction(state, { type: 'fulfill', orderId: 'missing' }, NOW);
  assert.equal(invalid.state.travel.pass.orders, 1);
  assert.equal(getTravelState(state, MONDAY - 1).pass.orders, 1);
  const newWeek = refreshTravel(state, MONDAY);
  assert.equal(newWeek.travel.pass.week, '2026-09-14');
  assert.equal(newWeek.travel.pass.orders, 0);
  assert.equal(newWeek.completedOrders, state.completedOrders);
  assert.equal(state.travel.pass.orders, 1, 'Read-only progress helpers must not mutate stored counters');
  const next = applyAction(readyOrder(newWeek), { type: 'fulfill', orderId: newWeek.orders[0].id }, MONDAY);
  assert.equal(next.state.travel.pass.orders, 1);
});

test('free and premium pass tracks enforce targets, spend 20 gems and award separate claims once', () => {
  let state = initial({ gems: 100 });
  assert.equal(applyAction(state, { type: 'claimPass', tier: 0 }, NOW).ok, false);
  state = withPass(state, { orders: 10 });
  assert.equal(getPassProgress(state, 0, true, NOW).locked, true);
  assert.equal(applyAction(state, { type: 'claimPass', tier: 0, premium: true }, NOW).ok, false);
  const purchased = applyAction(state, { type: 'buyPass' }, NOW);
  assert.equal(purchased.state.gems, 80);
  assert.equal(purchased.state.travel.pass.premium, true);
  assert.equal(applyAction(purchased.state, { type: 'buyPass' }, NOW).ok, false);
  state = purchased.state;
  for (let tier = 0; tier < PASS_TIERS.length; tier += 1) {
    for (const premium of [false, true]) {
      const previous = state;
      const result = applyAction(state, { type: 'claimPass', tier, premium }, NOW);
      assert.equal(result.ok, true);
      assert.equal(result.state.coins, previous.coins + (premium ? 0 : PASS_TIERS[tier].coins));
      assert.equal(result.state.gems, previous.gems + (premium ? PASS_TIERS[tier].premiumGems : PASS_TIERS[tier].gems));
      state = hydrateState(result.state, NOW);
      assert.equal(applyAction(state, { type: 'claimPass', tier, premium }, NOW).ok, false);
    }
  }
  const renewed = hydrateState(state, MONDAY);
  assert.equal(renewed.travel.pass.premium, false);
  assert.deepEqual(renewed.travel.pass.freeClaims, []);
  assert.deepEqual(renewed.travel.pass.premiumClaims, []);
  assert.equal(renewed.travel.pass.orders, 0);
  assert.equal(applyAction(initial({ gems: 19 }), { type: 'buyPass' }, NOW).ok, false);
});

test('offers reject energy overflow before charging and enforce once-only or UTC daily limits', () => {
  for (const offer of OFFERS) {
    const state = initial({ gems: 100, energy: 100 - offer.energy });
    const overflow = { ...state, energy: state.energy + 1 };
    const rejected = applyAction(overflow, { type: 'buyOffer', offerId: offer.id }, NOW);
    assert.equal(rejected.ok, false);
    assert.deepEqual(rejected.state, overflow);
    const result = applyAction(state, { type: 'buyOffer', offerId: offer.id }, NOW);
    assert.equal(result.ok, true);
    assert.equal(result.state.gems, state.gems - offer.cost);
    assert.equal(result.state.coins, state.coins + offer.coins);
    assert.equal(result.state.energy, 100);
    assert.equal(result.state.travel.offers[offer.id], '2026-09-12');
    const spentEnergy = { ...hydrateState(result.state, NOW), energy: state.energy };
    assert.equal(applyAction(spentEnergy, { type: 'buyOffer', offerId: offer.id }, NOW).ok, false);
    const nextDay = { ...hydrateState(result.state, NOW + DAY), energy: state.energy };
    assert.equal(applyAction(nextDay, { type: 'buyOffer', offerId: offer.id }, NOW + DAY).ok, offer.limit === 'daily');
  }
});

test('item purchases give one exact unlocked item, charge its level price and record discovery', () => {
  for (const level of [0, 1, 2, 3, 4]) {
    const state = initial({ gems: 100, xp: 900 });
    const index = state.board.indexOf(null);
    const result = applyAction(state, { type: 'buyItem', chain: 'tech', level }, NOW);
    assert.equal(result.ok, true);
    assert.deepEqual(result.state.board[index], { chain: 'tech', level });
    assert.equal(result.state.board.filter(Boolean).length, state.board.filter(Boolean).length + 1);
    assert.equal(result.state.gems, 100 - 2 ** level);
    assert.equal(result.state.energy, state.energy);
    assert.ok(result.state.discovered.includes(`tech:${level}`));
    assert.deepEqual(hydrateState(result.state, NOW), result.state);
  }
});

test('invalid purchase quantities, tiers, levels, empty wallets and full boards never charge', () => {
  const state = initial({ gems: 100, xp: 900, energy: 0 });
  const actions = [
    { type: 'buyItem', chain: 'tech', level: 5 }, { type: 'buyItem', chain: 'tech', level: -1 },
    { type: 'buyItem', chain: 'tech', level: 1.5 }, { type: 'buyItem', chain: 'tech', level: '1' },
    { type: 'buyItem', chain: 'missing', level: 0 }, { type: 'buyItem', chain: 'tech', level: 1, quantity: 2 },
    { type: 'buyItem', chain: 'tech', level: 1, quantity: 0 }, { type: 'buyItem', chain: 'tech', level: 1, quantity: '1' },
    { type: 'buyOffer', offerId: 'welcome', quantity: 2 }, { type: 'buyOffer', offerId: 'missing' },
    { type: 'claimPass', tier: -1 }, { type: 'claimPass', tier: 4 }, { type: 'claimPass', tier: 0, premium: 'true' },
    { type: 'memoryFlip', index: 0 }, { type: 'claimAlbum', chain: 'missing' },
  ];
  for (const action of actions) {
    const result = applyAction(state, action, NOW);
    assert.equal(result.ok, false, JSON.stringify(action));
    assert.deepEqual(result.state, state, JSON.stringify(action));
  }
  const poor = { ...state, gems: 0 };
  assert.equal(applyAction(poor, { type: 'buyItem', chain: 'tech', level: 0 }, NOW).ok, false);
  assert.equal(applyAction(poor, { type: 'buyOffer', offerId: 'welcome' }, NOW).ok, false);
  const full = { ...state, board: Array.from({ length: BOARD_SIZE }, () => ({ chain: 'maedeup', level: 1 })) };
  assert.equal(applyAction(full, { type: 'buyItem', chain: 'tech', level: 1 }, NOW).ok, false);
});

test('invalid persisted travel state cannot inject duplicate claims, invalid decks or forged schemas', () => {
  const mutations = [
    (s) => { delete s.travel; }, (s) => { s.travel.day = '2026-02-31'; },
    (s) => { s.travel.dailyClaimed = 'true'; }, (s) => { s.travel.built.push('gate'); },
    (s) => { s.travel.built.push('missing'); }, (s) => { s.travel.built = []; },
    (s) => { s.travel.albumClaims = ['maedeup']; }, (s) => { s.travel.offers.welcome = 'tomorrow'; },
    (s) => { s.travel.offers.energy = '2026-09-13'; }, (s) => { delete s.travel.offers.souvenir; },
    (s) => { s.travel.memory.cards = [0, 0, 0, 0, 0, 0, 0, 0]; },
    (s) => { s.travel.memory.flipped = [1]; }, (s) => { s.travel.memory.completed = true; },
    (s) => { s.travel.memory.rewarded = true; }, (s) => { s.travel.yut.position = 13; },
    (s) => { s.travel.yut.completed = true; }, (s) => { s.travel.pass.week = '2026-09-12'; },
    (s) => { s.travel.pass.orders = -1; }, (s) => { s.travel.pass.freeClaims = [0]; },
    (s) => { s.travel.pass.orders = 10; s.travel.pass.freeClaims = [0, 0]; },
    (s) => { s.travel.pass.orders = 10; s.travel.pass.premiumClaims = [0]; },
    (s) => { s.travel.pass.orders = 10; s.travel.pass.freeClaims = [4]; },
  ];
  for (const mutate of mutations) {
    const state = initial();
    mutate(state);
    assert.deepEqual(hydrateState(state, NOW), initial());
  }
});

test('travel hydration clones nested arrays and strips fields outside the persisted schema', () => {
  const state = applyAction(initial(), { type: 'memoryStart' }, NOW).state;
  state.travel.injected = true;
  state.travel.memory.injected = true;
  state.travel.pass.injected = true;
  state.travel.offers.injected = '2026-09-12';
  const restored = hydrateState(state, NOW);
  assert.equal(restored.travel.injected, undefined);
  assert.equal(restored.travel.memory.injected, undefined);
  assert.equal(restored.travel.pass.injected, undefined);
  assert.equal(restored.travel.offers.injected, undefined);
  restored.travel.built.push('teahouse');
  restored.travel.memory.cards[0] = 99;
  assert.deepEqual(state.travel.built, ['gate']);
  assert.notEqual(state.travel.memory.cards[0], 99);
});

test('crossing an era boundary with an order reward unlocks the next era immediately', () => {
  const state = initial({ xp: 280 });
  assert.equal(getLevel(state), 3);
  const result = applyAction(state, { type: 'fulfill', orderId: state.orders[0].id }, NOW);
  assert.equal(result.ok, true);
  assert.equal(getLevel(result.state), 4);
  assert.equal(getEra(result.state).id, 'port');
  assert.ok(getUnlockedChains(result.state).some((chain) => chain.id === 'photo'));
});
