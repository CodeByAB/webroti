# Architecture

Web-ROTI is three static pages, a JSON API of three endpoints, and two database tables. Everything runs on Cloudflare: Pages serves `public/`, Pages Functions run `functions/`, and D1 (SQLite) stores the data. There is no build step, no framework and no CMS.

GitHub Pages is not an option on its own: the site needs an API and storage.

## History

Created in 2013 at Diversify as a Java/Jersey service on Heroku with a jQuery/Bootstrap/RequireJS front end and meetings kept in memory (lost on every restart). Rewritten from scratch in 2026 (v2.0.0) with the same features. The old code is in the git history before the rewrite.

## Layout

```text
public/                    Served as-is by Cloudflare Pages
  index.html               Start: create a meeting, or enter a meeting code
  meeting.html             Results (?id=), vote link, QR code; refreshes every 5 s
  vote.html                Voting (?id=), slider 1.0–5.0
  404.html, favicon.svg, robots.txt
  _headers                 Security headers for static files (Cloudflare syntax)
  css/main.css             All styles; design tokens in :root (docs/design.md)
  js/api.js                The only place that calls the API
  js/start.js, meeting.js, vote.js   One module per page
  js/qr.js                 QR code → inline SVG via DOM APIs
  vendor/<pkg>-<version>/  Vendored third-party code (no CDN)
functions/api/             Pages Functions — the file path is the route
  _middleware.js           Error handling and security headers for /api/*
  meetings/index.js        POST /api/meetings
  meetings/[id]/index.js   GET  /api/meetings/:id
  meetings/[id]/votes.js   POST /api/meetings/:id/votes
lib/                       Imported by functions; not routed
  meetings.js              Domain rules and SQL
  http.js                  JSON responses, error mapping, body reading
migrations/                D1 schema, forward-only (NNNN_description.sql)
test/                      node:test; d1.js = D1 stand-in on node:sqlite
tools/                     Repo tooling (commit-msg check)
```

## Pages and URLs

| URL                  | File           | Notes                                                                                                                                           |
| -------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | `index.html`   | "Create new meeting" posts to the API, then goes to `/meeting?id=…`. The code form is a plain `GET /vote?id=…`, so it works without JavaScript. |
| `/meeting?id=482913` | `meeting.html` | Polls `GET /api/meetings/:id` every 5 s while the tab is visible; stops on 404.                                                                 |
| `/vote?id=482913`    | `vote.html`    | Posts the vote, shows "Thanks for voting!", resets to 3.0.                                                                                      |

Cloudflare Pages serves `meeting.html` at `/meeting`. The meeting code is a query parameter, not a path segment, so no rewrite rules are needed.

## API contract

| Method and path                | Body               | Response                                                                                                     |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `POST /api/meetings`           | `{}`               | `201 { "id": "482913" }`, `Location: /api/meetings/482913`                                                   |
| `GET /api/meetings/:id`        | –                  | `200 { "id", "votes", "average", "min", "max" }` — numbers with one decimal, `null` while there are no votes |
| `POST /api/meetings/:id/votes` | `{ "value": 3.4 }` | `201 { "ok": true }`                                                                                         |

Errors are always `{ "error": "message" }` with 400 (invalid input), 404 (unknown or expired meeting, or a malformed id), 409 (no free code found, or the vote cap reached), 415 (not `application/json`) or 500. Every API response has `Cache-Control: no-store`.

Changing the contract means updating this table, `public/js/api.js` and `test/api.test.js` in the same commit, and a `feat!:`/`fix!:` commit if it breaks clients.

## Data model

`migrations/0001_init.sql`:

- `meetings (id TEXT PRIMARY KEY, created_at, last_activity_at)` — epoch milliseconds; index on `last_activity_at`.
- `votes (id, meeting_id → meetings ON DELETE CASCADE, value_tenths CHECK 10–50, created_at)` — index on `meeting_id`.

The summary is one query (`COUNT`, `AVG`, `MIN`, `MAX` over a `LEFT JOIN`).

## Domain rules

These are deliberate. Don't change them by accident.

- **Meeting codes** are six digits, 100000–999999, from `crypto.getRandomValues` — easy to read out and type. On a collision a new code is drawn, up to 10 times (then 409). The original used five digits, but meetings are now kept for 90 days instead of until the next restart.
- **Votes are stored as integer tenths** (3.4 → 34) so the average is exact. The average is rounded to one decimal, as in the original.
- **Several votes from the same device are allowed.** Passing one phone around the room is the main use case. Don't add "one vote per person" without a decision.
- The slider resets to 3.0 after each vote, so the next person isn't anchored by the last vote.
- **Retention:** a meeting with no activity for 90 days counts as gone (404) and is deleted, votes included, the next time any meeting is created — Pages Functions have no cron. Voting refreshes activity; viewing refreshes it at most once a day, so polling doesn't write to the database.
- At most 1000 votes per meeting (409 after that).
- No accounts, no personal data, no cookies, no tracking.

## Security model

- **Static files** get their headers from `public/_headers`: a CSP that allows only `'self'` (no inline script or style), `frame-ancestors 'none'`, `nosniff`, HSTS, a strict referrer policy, and `X-Robots-Tag: noindex` on `*.pages.dev`.
- **API responses** get theirs from `functions/api/_middleware.js`, because `_headers` doesn't apply to Functions: `no-store`, `nosniff`, `no-referrer`, `default-src 'none'`.
- **CSRF:** every write requires `Content-Type: application/json`. Cross-origin, that forces a CORS preflight the API never answers, so another site can't post a form or `fetch` to it. The API sends no CORS headers.
- **Input:** ids must match `^[1-9]\d{5}$`, votes `^\d(\.\d)?$` within 1–5, bodies are capped at 1 KiB, and all SQL uses bound parameters.
- **Abuse:** codes are guessable by design (they are typed by hand), so anyone with a code can vote. The vote cap bounds the damage per meeting; a Cloudflare rate-limiting rule on `/api/*` is recommended on top (docs/deploy.md).
- **Errors:** unexpected exceptions are logged with `console.error` and answered with a generic 500.

## Deployment

`main` is deployed by `.github/workflows/deploy.yml`: `npm run check`, then `wrangler d1 migrations apply --remote`, then `wrangler pages deploy`. Pull requests are verified but not deployed, so no preview ever writes to the production database. Setup: [docs/deploy.md](deploy.md).
