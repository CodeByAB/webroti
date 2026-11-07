# Code Standards

## Overview

This document defines the coding, formatting and architectural standards for Web-ROTI. All contributors and AI assistants must follow these rules when writing, modifying or reviewing code. Web-ROTI is plain JavaScript, HTML and CSS with no build step: what is in the repository is what runs in the browser and on Cloudflare.

## Contents

- [Tools and commands](#tools-and-commands)
- [JavaScript](#javascript)
- [Server side (functions and lib)](#server-side-functions-and-lib)
- [SQL and migrations](#sql-and-migrations)
- [Browser side (public)](#browser-side-public)
- [Tests](#tests)
- [Markdown and language](#markdown-and-language)
- [AI-generated code](#ai-generated-code)

---

## Tools and commands

| Purpose                                    | Command             |
| ------------------------------------------ | ------------------- |
| Format (modifies files)                    | `npm run format`    |
| Lint: ESLint, Prettier check, markdownlint | `npm run lint`      |
| Type check (JSDoc, `tsc`)                  | `npm run typecheck` |
| Tests                                      | `npm test`          |
| Everything CI runs                         | `npm run check`     |

`npm ci` installs the git hooks (lefthook): `pre-commit` checks formatting and lint on the staged files, `commit-msg` checks the Conventional Commit subject. Hooks only check; they never rewrite files.

---

## JavaScript

### Formatting

- Prettier with `.prettierrc.json` (single quotes, 120 columns); `.editorconfig` (UTF-8, LF, 2 spaces). Never format by hand.

### Language level

- Modern JavaScript (ES2023), ES modules everywhere (`"type": "module"`). CommonJS only where a tool demands it, as `.cjs`.
- **No TypeScript syntax.** Types are JSDoc, checked by `tsc` with `strict`. Every file under `functions/`, `lib/` and `public/js/` starts with `// @ts-check`.
- `const` by default, `let` when reassigned, never `var`. `===` always.
- `async`/`await`, not `.then()` chains.

### Naming

| Kind                 | Convention                                      | Example                                |
| -------------------- | ----------------------------------------------- | -------------------------------------- |
| Functions, variables | `camelCase`                                     | `getMeetingSummary`, `voteUrl`         |
| Classes              | `PascalCase`                                    | `NotFoundError`                        |
| Constants            | `UPPER_SNAKE_CASE`                              | `MAX_VOTES_PER_MEETING`                |
| Files                | `kebab-case.js`, or Cloudflare routing names    | `check-commit-msg.js`, `[id]/votes.js` |
| CSS classes          | `.block`, `.block__element`, `.block--modifier` | `.stats__item`, `.button--primary`     |

### Comments

- Every file starts with a short comment saying what it is for.
- JSDoc on exported functions: parameter and return types, and what is thrown.
- Explain _why_, not _what_ — never restate the code in prose.

### Errors

- Throw the domain errors from `lib/meetings.js` (`ValidationError`, `NotFoundError`, `ConflictError`); `lib/http.js` maps them to 400/404/409.
- Anything else is a bug: let it reach `functions/api/_middleware.js`, which logs it with `console.error` and answers a generic 500. Never put internal details in a response.
- `console.log` is not allowed (ESLint); use `console.error`/`console.warn` for real problems only.

---

## Server side (functions and lib)

- **Domain logic and SQL live in `lib/`.** A file in `functions/` only checks the route parameter and headers, calls `lib/`, and returns `json(...)` or `domainErrorResponse(err)`. Keep functions free of business rules.
- Never put helper modules in `functions/`: every file there becomes a route.
- Validate all input on the server (`isMeetingId`, `parseVote`, `readJson`). Client-side validation is convenience only.
- Every write requires `Content-Type: application/json` (`isJsonRequest`) — that is the CSRF protection. Never add CORS headers to the API.
- Time is passed in (`now`), not read inside `lib/`, so tests can control it.
- JSON responses have stable shapes; errors are always `{ "error": "message" }`.

---

## SQL and migrations

- Always bound parameters (`?1`, `.bind(...)`). Never build SQL with string concatenation or template literals containing values.
- Keep SQL in `lib/`, next to the function that uses it.
- Migrations: `migrations/NNNN_description.sql`, forward-only. **Never edit an existing migration.** A new one must work with the code that is currently live, because it runs before the new code is deployed.
- Store values in the form that makes queries exact (votes as integer tenths).

---

## Browser side (public)

- One ES module per page (`start.js`, `meeting.js`, `vote.js`) plus shared modules (`api.js`, `qr.js`). Loaded with `<script type="module">` in `<head>`.
- **No inline scripts or styles** (CSP `'self'` only), no CDNs, no web fonts, no analytics, no cookies.
- Look elements up by `id`. Build DOM with `textContent`, `createElement`, `replaceChildren`. **Never assign data to `innerHTML`.**
- All server calls go through `public/js/api.js`.
- Styles only in `public/css/main.css`, using the design tokens (`--color-*`, `--space-*`); see [docs/design.md](docs/design.md).
- Accessibility: every control has a label, live values use `aria-live`/`role="status"`, focus is visible, colours meet WCAG AA in light and dark mode.
- Third-party code: vendored in `public/vendor/<package>-<version>/` with its licence header intact, listed in README.md, plus a `.d.ts` so `tsc` can check calls into it.

---

## Tests

- `node:test` and `node:assert/strict`, files in `test/*.test.js`.
- Logic in `lib/` and handlers in `functions/` are tested against `test/d1.js`, an in-memory D1 stand-in built on `node:sqlite` that loads the real migrations — so SQL is exercised, not mocked.
- New or changed behaviour in `lib/` or `functions/` comes with tests in the same commit. A bug fix comes with a test that failed before the fix.
- UI changes are verified in the running site (`/run-webroti`); there are no browser tests in CI.

---

## Markdown and language

- Code, comments, commit messages, UI text and documentation are in **English**.
- markdownlint with `.markdownlint.json`. One sentence per line is fine; long lines are allowed.

---

## AI-generated code

AI assistants such as Claude or GitHub Copilot may be used, but generated code must meet the same standards as human-written code:

- Keep solutions simple and concrete; no abstractions, layers or helpers for a single use.
- `npm run check` must pass — zero lint errors, zero type errors, all tests green.
- Follow the naming, formatting and structure rules above.
- Do not introduce new dependencies without explicit approval; prefer the platform and what is already here.
- Do not restructure modules, rename files, or change the architecture, API contract or security headers unless explicitly instructed.
- Say what was verified and how; label guesses as guesses (see CLAUDE.md § Evidence, not guesses).
- All AI-generated code is reviewed with the same scrutiny as human-written code. Credit substantial AI help with a `Co-Authored-By:` line.
