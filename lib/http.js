// @ts-check
/** Small HTTP helpers shared by the API's Pages Functions. */

import { ConflictError, NotFoundError, ValidationError } from './meetings.js';

/** Request bodies are tiny ({"value": 3.4}); anything bigger is refused. */
const MAX_BODY_BYTES = 1024;

/**
 * @param {unknown} data
 * @param {number} [status]
 * @param {Record<string, string>} [headers]
 * @returns {Response}
 */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

/**
 * Error responses always have the shape `{ "error": "message" }`.
 * @param {number} status
 * @param {string} message
 * @returns {Response}
 */
export function errorResponse(status, message) {
  return json({ error: message }, status);
}

/**
 * Requiring `Content-Type: application/json` on every write forces a CORS
 * preflight for cross-origin requests, which this API never answers. That
 * is the CSRF protection: a plain HTML form on another site can't post here.
 * @param {Request} request
 * @returns {boolean}
 */
export function isJsonRequest(request) {
  const type = request.headers.get('Content-Type') ?? '';
  return type.split(';')[0].trim().toLowerCase() === 'application/json';
}

/**
 * Read and parse a small JSON request body.
 * @param {Request} request
 * @returns {Promise<unknown>}
 * @throws {ValidationError}
 */
export async function readJson(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new ValidationError('Request body too large');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError('Request body must be valid JSON');
  }
}

/**
 * Map a domain error to an HTTP response. Unknown errors are rethrown so the
 * middleware logs them and answers 500 without leaking details.
 * @param {unknown} err
 * @returns {Response}
 */
export function domainErrorResponse(err) {
  if (err instanceof ValidationError) return errorResponse(400, err.message);
  if (err instanceof NotFoundError) return errorResponse(404, err.message);
  if (err instanceof ConflictError) return errorResponse(409, err.message);
  throw err;
}
