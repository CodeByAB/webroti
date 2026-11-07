// @ts-check
/**
 * Domain logic for meetings and votes. Pure functions plus queries against a
 * D1-compatible database (`prepare().bind().first()/run()`), so the same code
 * runs in Cloudflare Pages Functions and in the Node tests (test/d1.js).
 */

/** Lowest and highest vote on the ROTI scale. */
export const VOTE_MIN = 1;
export const VOTE_MAX = 5;

/** Upper bound per meeting, so a script can't fill the database. */
export const MAX_VOTES_PER_MEETING = 1000;

/** Meetings with no activity for this long are deleted. */
export const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/** Reading a meeting refreshes its activity at most this often. */
const TOUCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** How many random codes to try before giving up on creating a meeting. */
const MAX_ID_ATTEMPTS = 10;

export const MEETING_ID_PATTERN = /^[1-9]\d{5}$/;

/**
 * @typedef {object} D1Result
 * @property {{ changes: number }} meta
 *
 * @typedef {object} D1PreparedStatement
 * @property {(...values: unknown[]) => D1PreparedStatement} bind
 * @property {<T = Record<string, unknown>>() => Promise<T | null>} first
 * @property {() => Promise<D1Result>} run
 *
 * @typedef {object} D1Database
 * @property {(sql: string) => D1PreparedStatement} prepare
 *
 * @typedef {object} MeetingSummary
 * @property {string} id
 * @property {number} votes            Number of votes.
 * @property {number | null} average   Rounded to one decimal, null without votes.
 * @property {number | null} min
 * @property {number | null} max
 */

export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class ConflictError extends Error {}

/**
 * Generate a six-digit meeting code (100000–999999) from a CSPRNG.
 * @param {() => number} [randomUint32] source of random 32-bit integers
 * @returns {string}
 */
export function generateMeetingId(randomUint32 = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  return String(100000 + (randomUint32() % 900000));
}

/**
 * @param {unknown} id
 * @returns {id is string}
 */
export function isMeetingId(id) {
  return typeof id === 'string' && MEETING_ID_PATTERN.test(id);
}

/**
 * Validate a vote and convert it to tenths (3.4 → 34).
 * Accepts a number or a numeric string with at most one decimal.
 * @param {unknown} value
 * @returns {number}
 * @throws {ValidationError}
 */
export function parseVote(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d(\.\d)?$/.test(text.trim())) {
    throw new ValidationError(`Vote must be a number between ${VOTE_MIN} and ${VOTE_MAX} with at most one decimal`);
  }
  const tenths = Math.round(Number(text) * 10);
  if (tenths < VOTE_MIN * 10 || tenths > VOTE_MAX * 10) {
    throw new ValidationError(`Vote must be between ${VOTE_MIN} and ${VOTE_MAX}`);
  }
  return tenths;
}

/**
 * @param {number | null} tenths
 * @returns {number | null}
 */
function fromTenths(tenths) {
  return tenths === null ? null : Math.round(tenths) / 10;
}

/**
 * Create a meeting with a fresh, unused code. Also deletes expired meetings,
 * since Pages Functions have no cron and creation is rare enough to carry it.
 * @param {D1Database} db
 * @param {number} now epoch ms
 * @param {() => string} [nextId]
 * @returns {Promise<string>} the new meeting id
 */
export async function createMeeting(db, now, nextId = generateMeetingId) {
  await deleteExpiredMeetings(db, now);
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = nextId();
    const result = await db
      .prepare(
        'INSERT INTO meetings (id, created_at, last_activity_at) VALUES (?1, ?2, ?2) ON CONFLICT (id) DO NOTHING',
      )
      .bind(id, now)
      .run();
    if (result.meta.changes === 1) return id;
  }
  throw new ConflictError('Could not find a free meeting code, try again');
}

/**
 * @param {D1Database} db
 * @param {number} now epoch ms
 * @returns {Promise<void>}
 */
export async function deleteExpiredMeetings(db, now) {
  await db
    .prepare('DELETE FROM meetings WHERE last_activity_at < ?1')
    .bind(now - RETENTION_MS)
    .run();
}

/**
 * @param {D1Database} db
 * @param {string} id
 * @param {number} now epoch ms
 * @returns {Promise<MeetingSummary>}
 * @throws {NotFoundError}
 */
export async function getMeetingSummary(db, id, now) {
  /** @type {{ id: string, votes: number, avg: number | null, min: number | null, max: number | null } | null} */
  const row = await db
    .prepare(
      `SELECT m.id AS id, COUNT(v.id) AS votes, AVG(v.value_tenths) AS avg,
              MIN(v.value_tenths) AS min, MAX(v.value_tenths) AS max
         FROM meetings m LEFT JOIN votes v ON v.meeting_id = m.id
        WHERE m.id = ?1 AND m.last_activity_at >= ?2
        GROUP BY m.id`,
    )
    .bind(id, now - RETENTION_MS)
    .first();
  if (!row) throw new NotFoundError(`Meeting ${id} not found`);

  // Viewing results keeps a meeting alive, but polling shouldn't write on every request.
  await db
    .prepare('UPDATE meetings SET last_activity_at = ?2 WHERE id = ?1 AND last_activity_at < ?3')
    .bind(id, now, now - TOUCH_INTERVAL_MS)
    .run();

  return {
    id: row.id,
    votes: row.votes,
    average: fromTenths(row.avg),
    min: fromTenths(row.min),
    max: fromTenths(row.max),
  };
}

/**
 * Add a vote. Several votes from the same device are allowed on purpose: the
 * original use case is passing one phone around the room.
 * @param {D1Database} db
 * @param {string} id
 * @param {number} tenths from parseVote()
 * @param {number} now epoch ms
 * @returns {Promise<void>}
 * @throws {NotFoundError | ConflictError}
 */
export async function addVote(db, id, tenths, now) {
  const result = await db
    .prepare(
      `INSERT INTO votes (meeting_id, value_tenths, created_at)
       SELECT id, ?2, ?3 FROM meetings
        WHERE id = ?1 AND last_activity_at >= ?4
          AND (SELECT COUNT(*) FROM votes WHERE meeting_id = ?1) < ?5`,
    )
    .bind(id, tenths, now, now - RETENTION_MS, MAX_VOTES_PER_MEETING)
    .run();

  if (result.meta.changes !== 1) {
    const exists = await db
      .prepare('SELECT 1 AS found FROM meetings WHERE id = ?1 AND last_activity_at >= ?2')
      .bind(id, now - RETENTION_MS)
      .first();
    if (!exists) throw new NotFoundError(`Meeting ${id} not found`);
    throw new ConflictError(`Meeting ${id} already has the maximum of ${MAX_VOTES_PER_MEETING} votes`);
  }

  await db.prepare('UPDATE meetings SET last_activity_at = ?2 WHERE id = ?1').bind(id, now).run();
}
