// @ts-check
/** Browser client for the Web-ROTI API (functions/api/). */

/**
 * @typedef {object} MeetingSummary
 * @property {string} id
 * @property {number} votes
 * @property {number | null} average
 * @property {number | null} min
 * @property {number | null} max
 */

export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<any>}
 */
async function request(path, init = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...init,
      headers:
        init.body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

/** @returns {Promise<string>} the new meeting id */
export async function createMeeting() {
  const data = await request('/api/meetings', { method: 'POST', body: '{}' });
  return data.id;
}

/**
 * @param {string} id
 * @returns {Promise<MeetingSummary>}
 */
export function getMeeting(id) {
  return request(`/api/meetings/${encodeURIComponent(id)}`);
}

/**
 * @param {string} id
 * @param {number} value 1.0–5.0, one decimal
 * @returns {Promise<void>}
 */
export async function vote(id, value) {
  await request(`/api/meetings/${encodeURIComponent(id)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

/**
 * Meeting id from the page's `?id=` query parameter, or null if missing/invalid.
 * @returns {string | null}
 */
export function meetingIdFromUrl() {
  const id = new URLSearchParams(window.location.search).get('id')?.trim() ?? '';
  return /^[1-9]\d{5}$/.test(id) ? id : null;
}

/**
 * @param {number | null} value
 * @returns {string}
 */
export function formatRoti(value) {
  return value === null ? '–' : value.toFixed(1);
}
