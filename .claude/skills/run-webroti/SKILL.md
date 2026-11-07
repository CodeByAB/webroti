---
name: run-webroti
description: Start Web-ROTI locally (Pages + Functions + local D1) and drive it in a browser to verify a change. Use before committing any UI, API or database change.
---

## Start

```bash
npm ci                      # first time / after package.json changes
npm run dev                 # applies local migrations, serves http://localhost:8788
```

Run it in the background. Wait for `Ready on http://localhost:8788`. The local database lives in `.wrangler/`; delete that directory to start from an empty database.

## Smoke test the API

```bash
curl -s -X POST -H 'Content-Type: application/json' localhost:8788/api/meetings          # → {"id":"482913"}
curl -s -X POST -H 'Content-Type: application/json' -d '{"value":4.2}' localhost:8788/api/meetings/<id>/votes
curl -s localhost:8788/api/meetings/<id>
```

## Drive the UI (Playwright is preinstalled in cloud sessions)

Golden path: `/` → **Create new meeting** → `/meeting?id=…` shows the code, `0` votes and a QR code → **Vote** → move the slider → **Vote** shows "Thanks for voting!" and resets to 3.0 → **Back to the meeting results** shows the new count, average and min–max.

Check, for any UI change:

- 390 px (e.g. `devices['iPhone 13']`) and 1280 px wide, light and dark (`colorScheme: 'dark'`).
- The browser console is empty — a CSP violation from an inline script or style shows up there.
- Error states: `/meeting?id=111111` (unknown meeting), `/vote` (no code).

Look at the screenshots yourself before reporting; say what you checked.

## Stop

Kill the `wrangler pages dev` process (and `workerd`) when done.
