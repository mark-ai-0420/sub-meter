import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real TypeScript modules with disposable browser/Redis boundaries.
// No credentials, live Redis writes, or additional test dependencies are needed.
function evaluate(path, imports, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    }, console: { warn() {}, error() {}, info() {} }, ...globals,
  }, { filename: path });
  return exports;
}
const sample = evaluate('src/utils/sampleData.ts', {}).initialAppData;
const copy = (value) => JSON.parse(JSON.stringify(value));
const account = (cycles = 1, time = 0) => ({
  ...copy(sample), landlordInfo: { ...sample.landlordInfo, propertyName: 'Synthetic Test Property' },
  billingCycles: Array.from({ length: cycles }, (_, i) => ({ ...copy(sample.billingCycles[0]), id: `test-${i}` })),
  ...(time ? { cloudUpdatedAt: time } : {}),
});
const response = (data, ok = true) => ({ ok, json: async () => data });

function client(local = null, fetcher = async () => response({ exists: false }), idb = null) {
  const store = new Map(local ? [['meralco_submeter_app_data_v1', JSON.stringify(local)]] : []);
  const timers = new Map();
  let timerId = 0;
  const saved = [];
  const events = new Map();
  const storage = evaluate('src/services/storage.ts', {
    '../utils/sampleData': { initialAppData: copy(sample) },
    './calculator': { calculateBillingCycle() {} },
    './db': {
      saveAppDataToIndexedDB: async (data) => { saved.push(copy(data)); },
      loadAppDataFromIndexedDB: async () => copy(idb),
      clearAllIndexedDB: async () => {}, saveBillPhoto: async () => {},
    },
  }, {
    fetch: fetcher, AbortSignal,
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    window: { addEventListener: (name, fn) => events.set(name, fn), dispatchEvent() {} },
    CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
  });
  return {
    storage, saved, events, timers,
    local: () => JSON.parse(store.get('meralco_submeter_app_data_v1') || 'null'),
    flush: async () => {
      for (const fn of timers.values()) fn();
      timers.clear();
      for (let i = 0; i < 20; i++) await Promise.resolve();
    },
  };
}

test('cloud hydrates sample data and notifies listeners', async () => {
  const cloud = account(2, 100);
  const c = client(sample, async () => response({ exists: true, data: cloud }));
  let notified;
  c.storage.onStorageSync((data) => { notified = data; });
  await c.storage.syncAppDataWithCloud();
  assert.deepEqual(c.local(), cloud);
  assert.deepEqual(copy(notified), cloud);
  assert.deepEqual(c.saved.at(-1), cloud);
});

test('legacy local with more cycles populates empty or older cloud', async () => {
  for (const remote of [null, account(1)]) {
    let posted;
    const local = account(3);
    const c = client(local, async (_, options) => {
      if (options.method === 'POST') { posted = JSON.parse(options.body); return response({ success: true }); }
      return response(remote ? { exists: true, data: remote } : { exists: false });
    });
    await c.storage.syncAppDataWithCloud();
    assert.deepEqual(posted, local);
  }
});

test('newer equal-count cloud edits restore, while newer local deletions push', async () => {
  const remote = account(2, 200);
  const c = client(account(2, 100), async () => response({ exists: true, data: remote }));
  await c.storage.syncAppDataWithCloud();
  assert.deepEqual(c.local(), remote);
  let posted;
  const newer = account(0, 300);
  const d = client(newer, async (_, options) => {
    if (options.method === 'POST') { posted = JSON.parse(options.body); return response({ success: true }); }
    return response({ exists: true, data: remote });
  });
  await d.storage.syncAppDataWithCloud();
  assert.deepEqual(posted, newer);
});

test('an edit during GET is preserved and only the final save is debounced', async () => {
  let resolveGet;
  const posts = [];
  const c = client(account(), async (_, options) => {
    if (options.method === 'POST') { posts.push(JSON.parse(options.body)); return response({ success: true }); }
    return new Promise((resolve) => { resolveGet = resolve; });
  });
  const sync = c.storage.syncAppDataWithCloud();
  await Promise.resolve();
  c.storage.saveAppData(account(2));
  c.storage.saveAppData(account(3));
  resolveGet(response({ exists: true, data: account(4, 999) }));
  await sync;
  assert.equal(c.local().billingCycles.length, 3);
  await c.flush();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].billingCycles.length, 3);
});

test('offline failure preserves local storage and reconnect retries', async () => {
  let online = false;
  let posted;
  const c = client(account(), async (_, options) => {
    if (!online) throw new Error('Offline');
    if (options.method === 'POST') { posted = JSON.parse(options.body); return response({ success: true }); }
    return response({ exists: false });
  });
  c.storage.saveAppData(account(2));
  assert.equal(c.local().billingCycles.length, 2);
  await c.flush();
  assert.equal(c.storage.getCloudSyncStatus(), 'offline');
  online = true;
  c.events.get('online')();
  await c.storage.syncAppDataWithCloud();
  assert.equal(posted.billingCycles.length, 2);
  assert.equal(c.storage.getCloudSyncStatus(), 'synced');
});

test('sample recalculation does not upload sample data over cloud', async () => {
  const cloud = account(2);
  const c = client(sample, async (_, options) => {
    assert.notEqual(options.method, 'POST');
    return response({ exists: true, data: cloud });
  });
  const sync = c.storage.syncAppDataWithCloud();
  const recalculated = copy(sample);
  recalculated.billingCycles[0].calculationSummary = { synthetic: true };
  c.storage.saveAppData(recalculated);
  await sync;
  await c.flush();
  assert.deepEqual(c.local(), cloud);
});

test('invalid responses never replace local data or get treated as an empty cloud', async () => {
  const local = account();
  let requests = 0;
  const c = client(local, async () => { requests++; return response({ exists: true, data: { units: [] } }); });
  await c.storage.syncAppDataWithCloud();
  assert.equal(requests, 1);
  assert.deepEqual(c.local(), local);
  assert.equal(c.storage.getCloudSyncStatus(), 'offline');
});

test('server supports GET/POST/OPTIONS and rejects invalid data, methods and missing config', async () => {
  let redisValue = null;
  const keys = [];
  const backups = [];
  const server = evaluate('server/cloud-storage.ts', {
    '@upstash/redis': { Redis: class {
      async get(key) { keys.push(key); return redisValue; }
      async set(key, value) { keys.push(key); redisValue = value; }
    } },
  });
  const env = { UPSTASH_REDIS_REST_URL: 'https://synthetic.invalid', UPSTASH_REDIS_REST_TOKEN: 'synthetic' };
  const request = server.handleStorageRequest;
  assert.equal((await request('OPTIONS', null, {})).status, 204);
  assert.equal((await request('DELETE', null, env)).status, 405);
  assert.equal((await request('POST', { units: 'bad' }, env)).status, 400);
  assert.equal((await request('GET', null, {})).status, 503);
  assert.equal((await request('GET', null, env)).body.exists, false);
  assert.equal((await request('POST', account(), env, async (data) => { backups.push(data); })).status, 200);
  assert.equal((await request('GET', null, env)).body.exists, true);
  assert.equal(backups.length, 1);
  assert.ok(keys.every((key) => key === 'submeter:app_data'));
  redisValue = { corrupted: true };
  assert.equal((await request('GET', null, env)).status, 502);
});
