# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is loaded in every session, so it holds only what applies every time — the map of the code is in [docs/architecture.md](docs/architecture.md), the coding rules in [STANDARDS.md](STANDARDS.md).

**Read [ROADMAP.md](ROADMAP.md) first in every session.** It is the project status, kept in the repo so it travels across machines and sessions.

## Skills (invoke with /name)

| Skill              | When to use                                                   |
| ------------------ | ------------------------------------------------------------- |
| `/commit-workflow` | Opening an issue, branching, committing, PR, roadmap sync     |
| `/run-webroti`     | Starting the site locally and verifying a change in a browser |

## Commands

```bash
npm ci                     # install the pinned dev tooling (also installs git hooks)
npm run dev                # local D1 migrations + wrangler pages dev on http://localhost:8788
npm run check              # lint + typecheck + tests — what CI runs
npm run lint               # ESLint, Prettier --check, markdownlint
npm run typecheck          # tsc over the JSDoc types (server and browser separately)
npm test                   # node --test, incl. real SQL against migrations/
npm run format             # Prettier --write
```

Single test file: `node --test test/meetings.test.js`. Requires Node.js ≥ 22.13 (`.nvmrc`), because the tests use the built-in `node:sqlite`.

## After making code changes

**Always run the relevant checks before declaring a task complete.**

| Changed                                    | Run                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Any `.js`, `.json`, `.html`, `.css`, `.md` | `npm run lint` (a hook formats edited files with Prettier)                      |
| `lib/`, `functions/`, `migrations/`        | `npm test` and `npm run typecheck`                                              |
| Anything under `public/` that renders      | `/run-webroti`: click through in the browser, 390 px and desktop, empty console |
| Unsure                                     | `npm run check`                                                                 |

- Zero ESLint warnings or errors. Never add an `eslint-disable` without a comment saying why.
- If formatting changed files, include them in the same commit.

## Commit message format

Mandatory — `release-please` parses commit subjects to generate `CHANGELOG.md` and the version, and the `commit-msg` hook rejects other shapes.

```text
<type>(<scope>): <subject>

<optional body>

Closes #N
```

- **type:** `feat`, `fix`, `perf`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style`. Only `feat`/`fix`/`perf` surface in the changelog.
- **scope:** `api`, `db`, `meeting`, `vote`, `start`, `ui`, `deploy`, `deps`, `docs`. Optional but expected.
- **subject:** imperative, lower-case start, no trailing period.
- Breaking change to the API or page URLs: `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer.
- `Closes #N` when there is an issue.

For the full issue → implement → test → commit → roadmap workflow, run `/commit-workflow`.

## Design philosophy

Prefer the simplest solution that solves the problem. The platform is enough for most things: the browser (ES modules, `<output>`, `<dialog>`, `fetch`, CSS custom properties) and the Workers runtime (`fetch`, `crypto`, D1). Before adding code, ask whether there is a direct approach that avoids it. A plan being written down is not a reason to follow it if a cleaner alternative is obvious.

There is **no CMS** and no build step: the few pages are hand-written HTML in `public/`. Don't add a framework, bundler, CMS or CSS toolkit.

## Evidence, not guesses

The owner wants to know how sure you are — every time.

- **Label every cause, diagnosis and "fixed" claim** as **verifierat** (verified — say what was observed: a test, a request and its response, a screenshot, a value read back from D1) or **hypotes** (hypothesis — say what would confirm or rule it out). Never present a hypothesis as the cause.
- **"Fixed" means** the failure was reproduced, one thing was changed, and the failure was gone in the same scenario. Until then say "should fix — not yet verified" and name the check that would show it.
- **When an earlier explanation turns out wrong,** say so plainly and retract it where it was stated.

## Rules that apply every session

1. **No new dependencies** — npm packages, vendored files, Cloudflare services or bindings — without explicit approval from the owner. Propose instead.
2. **Never edit a migration that exists.** It may already have run in production. Add `migrations/NNNN_description.sql`, backwards compatible with the code that is live (`deploy.yml` migrates before it uploads).
3. **Don't change the API contract, the domain rules or the security headers** ([docs/architecture.md](docs/architecture.md)) unless explicitly asked — and then say so in the commit body and your reply.
4. **Strict CSP:** no inline `<script>`, no `style=""`, no external CDN, font or analytics. JavaScript goes in `public/js/`, third-party code in `public/vendor/<package>-<version>/`.
5. **Never touch production:** no `--remote` D1 commands, no `wrangler pages deploy`, no edits to `database_id` or Cloudflare settings unless asked. Production changes only through `main` and `deploy.yml`.
6. Work on a branch, never on `main`. PRs are squash-merged by the owner.
7. Documentation is part of the change, in the same PR (see CONTRIBUTING.md § Documentation requirements). Don't mark anything in ROADMAP.md as done that hasn't been verified.

## Architecture in one paragraph

Static pages in `public/` (start, meeting results, vote) call a small JSON API in `functions/api/` (Cloudflare Pages Functions), which keeps meetings and votes in Cloudflare D1 (SQLite). Domain logic and SQL live in `lib/`; a function only validates the route and headers, calls `lib/`, and maps errors. Details — endpoints, tables, domain rules, security model — in [docs/architecture.md](docs/architecture.md).
