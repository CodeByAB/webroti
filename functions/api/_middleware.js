// @ts-check
/**
 * Runs before every /api/* function. `public/_headers` does not apply to
 * Functions responses, so API security headers are set here.
 */

import { errorResponse } from '../../lib/http.js';

const API_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

/** @type {PagesFunction} */
export async function onRequest({ next }) {
  let response;
  try {
    response = await next();
  } catch (err) {
    console.error('Unhandled API error', err);
    response = errorResponse(500, 'Internal server error');
  }
  response = new Response(response.body, response);
  for (const [name, value] of Object.entries(API_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}
