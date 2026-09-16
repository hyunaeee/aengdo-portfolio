import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressStore, SAVE_KEY} from '../src/progress-store.js';

function browser(entries = {}) {
  const data = new Map(Object.entries(entries));
  return {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data};
}
test('native progress takes priority over stale web storage', async () => {
  const store = await createProgressStore({storage: browser({[SAVE_KEY]: 'old'}), preferences: {get: async () => ({value: 'current'})}});
  assert.equal(store.raw, 'current');
});
test('first native launch migrates old progress without deleting it', async () => {
  const storage = browser({'dodam-workshop-save-v3': 'legacy'});
  const writes = [];
  const store = await createProgressStore({storage, preferences: {get: async () => ({value: null}), set: async data => writes.push(data)}});
  assert.equal(store.raw, 'legacy');
  await store.save('migrated');
  assert.equal(storage.getItem('dodam-workshop-save-v3'), 'legacy');
  assert.deepEqual(writes, [{key: SAVE_KEY, value: 'migrated'}]);
});
test('native read failure stops startup instead of replacing the save', async () => {
  let writes = 0;
  await assert.rejects(createProgressStore({storage: browser(), preferences: {get: async () => {throw Error('unavailable');}, set: async () => writes++}}));
  assert.equal(writes, 0);
});
test('rapid actions are written in order and flush awaits the latest action', async () => {
  const writes = [];
  let release;
  const first = new Promise(resolve => {release = resolve;});
  const store = await createProgressStore({preferences: {get: async () => ({value: null}), set: async ({value}) => {if(value === 'one') await first; writes.push(value);}}});
  const one = store.save('one');
  const two = store.save('two');
  await Promise.resolve();
  assert.deepEqual(writes, []);
  release();
  await store.flush();
  await Promise.all([one, two]);
  assert.deepEqual(writes, ['one', 'two']);
});
test('a failed native write is reported and later saves still work', async () => {
  const writes = [];
  const store = await createProgressStore({preferences: {get: async () => ({value: null}), set: async ({value}) => {if(value === 'bad') throw Error('full'); writes.push(value);}}});
  await assert.rejects(store.save('bad'));
  await store.save('good');
  assert.deepEqual(writes, ['good']);
});
test('native saves work when browser storage is blocked', async () => {
  let saved;
  const store = await createProgressStore({storage: {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}}, preferences: {get: async () => ({value: null}), set: async ({value}) => {saved = value;}}});
  await store.save('journey');
  assert.equal(saved, 'journey');
});
