import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ConflictError,
  MAX_VOTES_PER_MEETING,
  NotFoundError,
  RETENTION_MS,
  ValidationError,
  addVote,
  createMeeting,
  generateMeetingId,
  getMeetingSummary,
  isMeetingId,
  parseVote,
} from '../lib/meetings.js';
import { createTestDb } from './d1.js';

const NOW = Date.UTC(2026, 10, 7, 12);
const DAY = 24 * 60 * 60 * 1000;

describe('generateMeetingId', () => {
  it('always produces a six-digit code', () => {
    for (const n of [0, 1, 899999, 900000, 2 ** 32 - 1]) {
      const id = generateMeetingId(() => n);
      assert.ok(isMeetingId(id), `${n} -> ${id}`);
    }
  });
});

describe('isMeetingId', () => {
  it('accepts six digits not starting with 0', () => {
    assert.equal(isMeetingId('482913'), true);
    for (const bad of ['012345', '12345', '1234567', '12a456', '', null, 123456]) {
      assert.equal(isMeetingId(bad), false, String(bad));
    }
  });
});

describe('parseVote', () => {
  it('converts valid votes to tenths', () => {
    assert.equal(parseVote(1), 10);
    assert.equal(parseVote(3.4), 34);
    assert.equal(parseVote('4.7'), 47);
    assert.equal(parseVote(5), 50);
  });

  it('rejects out-of-range and malformed votes', () => {
    for (const bad of [0.9, 5.1, 6, -1, 3.45, '3,4', '', 'abc', null, undefined, {}, NaN, Infinity]) {
      assert.throws(() => parseVote(bad), ValidationError, String(bad));
    }
  });
});

describe('meetings', () => {
  it('creates a meeting with no votes', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    assert.ok(isMeetingId(id));
    assert.deepEqual(await getMeetingSummary(db, id, NOW), { id, votes: 0, average: null, min: null, max: null });
  });

  it('retries when a generated code is taken', async () => {
    const db = createTestDb();
    const ids = ['111111', '111111', '222222'];
    assert.equal(await createMeeting(db, NOW, () => ids.shift() ?? ''), '111111');
    assert.equal(await createMeeting(db, NOW, () => ids.shift() ?? ''), '222222');
  });

  it('gives up after repeated collisions', async () => {
    const db = createTestDb();
    await createMeeting(db, NOW, () => '111111');
    await assert.rejects(
      createMeeting(db, NOW, () => '111111'),
      ConflictError,
    );
  });

  it('summarises votes with one decimal', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    for (const v of [5, 3.4, 2]) await addVote(db, id, parseVote(v), NOW);
    // (50 + 34 + 20) / 3 = 34.67 tenths -> 3.5
    assert.deepEqual(await getMeetingSummary(db, id, NOW), { id, votes: 3, average: 3.5, min: 2, max: 5 });
  });

  it('allows several votes from the same client (passing a phone around)', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    await addVote(db, id, 30, NOW);
    await addVote(db, id, 30, NOW);
    assert.equal((await getMeetingSummary(db, id, NOW)).votes, 2);
  });

  it('reports unknown meetings as not found', async () => {
    const db = createTestDb();
    await assert.rejects(getMeetingSummary(db, '999999', NOW), NotFoundError);
    await assert.rejects(addVote(db, '999999', 30, NOW), NotFoundError);
  });

  it('caps the number of votes per meeting', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    const insert = db.sqlite.prepare('INSERT INTO votes (meeting_id, value_tenths, created_at) VALUES (?, 30, ?)');
    for (let i = 0; i < MAX_VOTES_PER_MEETING; i++) insert.run(id, NOW);
    await assert.rejects(addVote(db, id, 30, NOW), ConflictError);
  });

  it('expires meetings after the retention period without activity', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    const later = NOW + RETENTION_MS + 1;
    await assert.rejects(getMeetingSummary(db, id, later), NotFoundError);
    await assert.rejects(addVote(db, id, 30, later), NotFoundError);

    // Creating another meeting purges it, votes included.
    await addVote(db, id, 30, NOW);
    await createMeeting(db, later + RETENTION_MS + 1);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM votes').get()?.n, 0);
  });

  it('keeps a meeting alive while it is voted on or viewed', async () => {
    const db = createTestDb();
    const id = await createMeeting(db, NOW);
    await addVote(db, id, 30, NOW + 60 * DAY);
    await getMeetingSummary(db, id, NOW + 140 * DAY);
    assert.equal((await getMeetingSummary(db, id, NOW + 220 * DAY)).votes, 1);
  });
});
