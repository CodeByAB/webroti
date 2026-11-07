// @ts-check
/** POST /api/meetings — create a meeting. Responds 201 `{ "id": "482913" }`. */

import { createMeeting } from '../../../lib/meetings.js';
import { domainErrorResponse, errorResponse, isJsonRequest, json } from '../../../lib/http.js';

/** @type {PagesFunction<{ DB: D1Database }>} */
export async function onRequestPost({ request, env }) {
  if (!isJsonRequest(request)) return errorResponse(415, 'Content-Type must be application/json');
  try {
    const id = await createMeeting(env.DB, Date.now());
    return json({ id }, 201, { Location: `/api/meetings/${id}` });
  } catch (err) {
    return domainErrorResponse(err);
  }
}
