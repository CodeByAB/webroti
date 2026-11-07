// @ts-check
/** POST /api/meetings/:id/votes — body `{ "value": 3.4 }`, responds 201 `{ "ok": true }`. */

import { addVote, isMeetingId, parseVote } from '../../../../lib/meetings.js';
import { domainErrorResponse, errorResponse, isJsonRequest, json, readJson } from '../../../../lib/http.js';

/** @type {PagesFunction<{ DB: D1Database }, 'id'>} */
export async function onRequestPost({ request, params, env }) {
  if (!isMeetingId(params.id)) return errorResponse(404, 'Meeting not found');
  if (!isJsonRequest(request)) return errorResponse(415, 'Content-Type must be application/json');
  try {
    const body = await readJson(request);
    const value = body && typeof body === 'object' && 'value' in body ? body.value : undefined;
    await addVote(env.DB, params.id, parseVote(value), Date.now());
    return json({ ok: true }, 201);
  } catch (err) {
    return domainErrorResponse(err);
  }
}
