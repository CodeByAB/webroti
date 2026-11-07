// @ts-check
/**
 * GET /api/meetings/:id — vote summary for a meeting:
 * `{ "id": "482913", "votes": 7, "average": 3.9, "min": 2.5, "max": 5 }`
 * (`average`, `min`, `max` are null while there are no votes).
 */

import { getMeetingSummary, isMeetingId } from '../../../../lib/meetings.js';
import { domainErrorResponse, errorResponse, json } from '../../../../lib/http.js';

/** @type {PagesFunction<{ DB: D1Database }, 'id'>} */
export async function onRequestGet({ params, env }) {
  if (!isMeetingId(params.id)) return errorResponse(404, 'Meeting not found');
  try {
    return json(await getMeetingSummary(env.DB, params.id, Date.now()));
  } catch (err) {
    return domainErrorResponse(err);
  }
}
