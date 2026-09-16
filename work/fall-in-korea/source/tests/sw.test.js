import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const workerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://morning-merge.test';
const ATLAS_URL = `${ORIGIN}/assets/items-atlas.png`;

function imageResponse(body) {
  const response = new Response(body, { headers: { 'Content-Type': 'image/png' } });
  // Node's constructed Response has type "default"; a same-origin fetch has type "basic".
  Object.defineProperty(response, 'type', { value: 'basic' });
  return response;
}

function workerHarness({ savedImage, fetchImage, cacheUnavailable = false }) {
  const handlers = new Map();
  const entries = new Map(savedImage ? [[ATLAS_URL, savedImage]] : []);
  const cache = {
    async match(request) { return entries.get(typeof request === 'string' ? request : request.url)?.clone(); },
    async put(request, response) { entries.set(typeof request === 'string' ? request : request.url, response); },
  };
  const fetches = [];
  vm.runInNewContext(workerSource, {
    URL,
    Response,
    importScripts(url) { assert.equal(url, '/fonts/offline.js'); },
    self: {
      FONT_FILES: ['/fonts/fonts.css'],
      location: { origin: ORIGIN },
      addEventListener(type, handler) { handlers.set(type, handler); },
    },
    caches: {
      async open() {
        if (cacheUnavailable) throw new Error('Cache storage is blocked');
        return cache;
      },
    },
    fetch(request) {
      fetches.push(request.url);
      return fetchImage(request);
    },
  });
  return {
    entries,
    fetches,
    requestImage() {
      const background = [];
      let response;
      handlers.get('fetch')({
        request: { url: ATLAS_URL, method: 'GET', mode: 'no-cors', destination: 'image' },
        waitUntil(task) { background.push(task); },
        respondWith(task) { response = task; },
      });
      assert.ok(response, 'The worker should handle the image request');
      return { response, background: () => Promise.all(background) };
    },
  };
}

test('cached sprites respond immediately while a pending network request refreshes in the background', async () => {
  let finishNetwork;
  let networkFinished = false;
  const network = new Promise((resolve) => { finishNetwork = resolve; });
  const harness = workerHarness({
    savedImage: imageResponse('cached atlas'),
    fetchImage: () => network.then((response) => { networkFinished = true; return response; }),
  });
  const event = harness.requestImage();
  const pending = Symbol('waiting for the network');
  try {
    // One event-loop turn is enough for an available cache response; no network is released yet.
    const response = await Promise.race([
      event.response,
      new Promise((resolve) => setImmediate(() => resolve(pending))),
    ]);
    assert.notEqual(response, pending, 'A cached image must not wait for network completion');
    assert.equal(await response.text(), 'cached atlas');
    assert.equal(networkFinished, false);
    assert.deepEqual(harness.fetches, [ATLAS_URL]);
  } finally {
    finishNetwork(imageResponse('updated atlas'));
    await event.background();
  }
  assert.equal(await harness.entries.get(ATLAS_URL).text(), 'updated atlas');
});

test('an image cache miss returns the network response and saves it for subsequent loads', async () => {
  const harness = workerHarness({ fetchImage: async () => imageResponse('new atlas') });
  const event = harness.requestImage();
  const response = await event.response;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'new atlas');
  await event.background();
  assert.equal(await harness.entries.get(ATLAS_URL).text(), 'new atlas');
});

test('unavailable cache storage does not prevent an image from loading over the network', async () => {
  const harness = workerHarness({
    cacheUnavailable: true,
    fetchImage: async () => imageResponse('online atlas'),
  });
  const event = harness.requestImage();
  const response = await event.response;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'online atlas');
  await event.background();
  assert.equal(harness.entries.size, 0);
});

test('a failed image refresh keeps the cached sprite available while offline', async () => {
  const harness = workerHarness({
    savedImage: imageResponse('offline atlas'),
    fetchImage: async () => { throw new TypeError('Network unavailable'); },
  });
  const event = harness.requestImage();
  const response = await event.response;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'offline atlas');
  await event.background();
  assert.equal(await harness.entries.get(ATLAS_URL).text(), 'offline atlas');
});
