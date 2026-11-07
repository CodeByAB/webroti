# Roadmap — Web-ROTI

Project status and next steps, kept in the repo so it is visible from any machine or session. Update it in the same PR as the work.

## Now / Next

**Now:** The rewrite (v2.0.0) is done on the branch `claude/webroti-modernize-rebuild-ze5g88`: every feature of the Java version is there, `npm run check` is green, and the whole flow has been verified in a browser against `wrangler pages dev` with a local D1 database. Nothing is deployed yet.

**Next:**

1. Review and merge the branch into `master`, then rename `master` to `main` (GitHub → _Settings → Branches_; old links redirect). Workflows, release-please and Dependabot target `main`. Delete the stale `develop`, `clojure`, `feature/Issue#10` and `gh-pages` branches if no longer needed.
2. Cloudflare setup per [docs/deploy.md](docs/deploy.md): D1 database, `database_id` in `wrangler.toml`, Pages project, API token and GitHub secrets.
3. Decide the domain (open question below).
4. GitHub repository settings per [docs/deploy.md § GitHub repository settings](docs/deploy.md#github-repository-settings): description, website, topics, default branch, merge and Actions settings, security features, stale branches and tag.
5. Merge the release-please PR that follows, to publish v2.0.0.

## Status

### Rewrite (2026-11) ✅

- [x] Java/Jersey, Maven, Heroku Procfile, Travis CI and jQuery/Bootstrap/RequireJS removed
- [x] API as Pages Functions: create meeting, get summary, vote
- [x] D1 schema (`migrations/0001_init.sql`), votes stored as integer tenths
- [x] Retention: meetings deleted 90 days after their last activity
- [x] Max 1000 votes per meeting, server-side validation, CSRF protection via `Content-Type: application/json`
- [x] New front end, no framework: start page (create meeting or enter code), meeting page (stats, QR code, copy link, live refresh), vote page (slider, confirmation, reset to 3.0)
- [x] Strict CSP (`'self'` only), security headers, dark mode
- [x] Google Analytics removed — no tracking, no cookies
- [x] Code standard: ESLint, Prettier, markdownlint, JSDoc types checked by `tsc`, EditorConfig, lefthook pre-commit and commit-msg hooks
- [x] Tests: domain logic and API handlers against real SQLite (19 tests)
- [x] Governance as in RIGStats: CLAUDE.md, STANDARDS.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, LICENSE (MIT), CODEOWNERS, issue and PR templates, `.claude/` hook and skills
- [x] CI: Verify, Deploy, CodeQL, weekly audit, release-please, Dependabot — all actions SHA-pinned

### Deployment

- [ ] D1 database created and migrated
- [ ] Pages project (Direct Upload) and GitHub secrets
- [ ] First deploy from `main` verified
- [ ] Custom domain
- [ ] Rate-limiting rule for `/api/*`
- [ ] Branch protection on `main`
- [ ] Repository description, website and topics set
- [ ] v2.0.0 released by release-please

## Open questions

- **Domain:** `webroti.com` was used before — is it still ours? Otherwise a subdomain. The old address `contact@webroti.com` was removed from the site for now.
- **Leaked Heroku key:** the old `.travis.yml` had a Heroku API key in plain text. The file is gone, but the key is in the git history. Confirm the key/account is revoked (probably long since).
- **Licence:** MIT, copyright Daniel Valfridsson, as RIGStats. The 2013 code had no licence; the rewrite shares no code with it. Confirm.
- **Language:** the UI is English, like the original. Swedish as an option?

## Decisions

- 2026-11-07: Cloudflare Pages + Functions + D1 rather than GitHub Pages, because the site needs an API and storage.
- 2026-11-07: Deploy from GitHub Actions (Direct Upload) rather than Cloudflare's Git integration, so migrations run in the same pipeline and pull requests never get previews writing to the production database.
- 2026-11-07: Governance, CI and documentation follow RIGStats; documentation in English. No CMS.
- 2026-11-07: Versioning starts at v2.0.0 for the rewrite (the release-please manifest starts at 1.0.0, so the breaking `feat!` commit produces 2.0.0). Tags are `v<version>`.
- 2026-11-07: Six-digit meeting codes (the original had five), since meetings now live for 90 days instead of until the next restart.

## Ideas (not started)

- Vote distribution as a bar chart on the meeting page.
- Let the meeting's creator close voting.
- Swedish translation.
