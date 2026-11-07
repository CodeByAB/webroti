// Tests the Pages Functions handlers directly, with the in-memory D1.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { onRequest as middleware } from '../functions/api/_middleware.js';
import { onRequestPost as createMeeting } from '../functions/api/meetings/index.js';
import { onRequestGet as getMeeting } from '../functions/api/meetings/[id]/index.js';
import { onRequestPost as postVote } from '../functions/api/meetings/[id]/votes.js';
import { createTestDb } from './d1.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
const req = (path, init) => new Request(`https://webroti.test${path}`, init);

/** @param {any} env */
async function newMeeting(env) {
  const res = await createMeeting({ request: req('/api/meetings', { method: 'POST', headers: JSON_HEADERS }), env });
  assert.equal(res.status, 201);
  return (await res.json()).id;
}

/**
 * @param {any} env
 * @param {string} id
 * @param {unknown} body
 * @param {Record<string, string>} [headers]
 */
const vote = (env, id, body, headers = JSON_HEADERS) =>
  postVote({
    request: req(`/api/meetings/${id}/votes`, { method: 'POST', headers, body: JSON.stringify(body) }),
    params: { id },
    env,
  });

describe('API', () => {
  it('runs the create → vote → summary flow', async () => {
    const env = { DB: createTestDb() };
    const id = await newMeeting(env);

    assert.equal((await vote(env, id, { value: 4.5 })).status, 201);
    assert.equal((await vote(env, id, { value: 2 })).status, 201);

    const res = await getMeeting({ params: { id }, env });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { id, votes: 2, average: 3.3, min: 2, max: 4.5 });
  });

  it('rejects writes that are not JSON (CSRF protection)', async () => {
    const env = { DB: createTestDb() };
    const created = await createMeeting({ request: req('/api/meetings', { method: 'POST' }), env });
    assert.equal(created.status, 415);

    const id = await newMeeting(env);
    const res = await vote(env, id, { value: 3 }, { 'Content-Type': 'application/x-www-form-urlencoded' });
    assert.equal(res.status, 415);
  });

  it('validates votes', async () => {
    const env = { DB: createTestDb() };
    const id = await newMeeting(env);
    for (const body of [{ value: 7 }, { value: '3,5' }, {}, null, 'x'.repeat(2000)]) {
      const res = await vote(env, id, body);
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.ok((await res.json()).error);
    }
  });

  it('answers 404 for unknown or malformed meeting ids', async () => {
    const env = { DB: createTestDb() };
    for (const id of ['999999', 'abc', '1']) {
      assert.equal((await getMeeting({ params: { id }, env })).status, 404, id);
      assert.equal((await vote(env, id, { value: 3 })).status, 404, id);
    }
  });

  it('middleware adds no-store and turns crashes into a 500 without details', async () => {
    const ok = await middleware({ next: async () => new Response('{}') });
    assert.equal(ok.headers.get('Cache-Control'), 'no-store');

    const originalError = console.error;
    console.error = () => {};
    try {
      const crash = await middleware({
        next: async () => {
          throw new Error('secret detail');
        },
      });
      assert.equal(crash.status, 500);
      assert.deepEqual(await crash.json(), { error: 'Internal server error' });
    } finally {
      console.error = originalError;
    }
  });
});
