# Deployment

Web-ROTI runs on Cloudflare Pages with Pages Functions and a D1 database. GitHub Actions deploys every push to `main` (`.github/workflows/deploy.yml`): it runs `npm run check`, applies new D1 migrations, then uploads the site. Pull requests are verified but never deployed.

## One-time setup

Done once by whoever owns the Cloudflare account. Steps 1–4 run locally after `npm ci`.

1. **Log in:** `npx wrangler login`
2. **Create the database:** `npx wrangler d1 create webroti`. Copy the printed `database_id` into `wrangler.toml` (replacing the zeros) and commit it on a branch (`build(deploy): set production database id`). The id is not a secret.
3. **Create the tables:** `npx wrangler d1 migrations apply webroti --remote`
4. **Create the Pages project** (Direct Upload — not connected to Git, GitHub Actions uploads to it): `npx wrangler pages project create webroti --production-branch=main`
5. **API token:** Cloudflare Dashboard → _My Profile → API Tokens → Create Token → Custom token_ with **Account › Cloudflare Pages › Edit** and **Account › D1 › Edit**, limited to this account.
6. **GitHub secrets:** repository → _Settings → Secrets and variables → Actions_: `CLOUDFLARE_API_TOKEN` (the token) and `CLOUDFLARE_ACCOUNT_ID` (shown in the dashboard sidebar).
7. **GitHub environment:** _Settings → Environments → production_ is created by the first deploy; optionally restrict it to the `main` branch.
8. **Custom domain:** Pages project → _Custom domains_ → add the domain. Update `url:` in `deploy.yml`.
9. **Recommended:** a _Rate limiting rule_ under the domain's _Security → WAF_ for `/api/*` (e.g. 60 requests per minute per IP).
10. **Branch protection** on `main`: require the **Verify** check; squash merges only.

Merge the branch from step 2 — the first deploy runs.

## GitHub repository settings

Repository metadata and settings aren't stored in git, so they are listed here. Keep them in sync with the README.

**About** (gear icon on the repository page):

- **Description:** `Measure the return on time invested (ROTI) in your meetings — anonymous 1–5 votes, average and min–max. Cloudflare Pages + D1, no framework.`
- **Website:** the production URL (`https://webroti.pages.dev` until a custom domain is set)
- **Topics:** `roti`, `meetings`, `meeting-feedback`, `retrospective`, `voting`, `cloudflare-pages`, `cloudflare-d1`, `cloudflare-workers`, `javascript`, `vanilla-js`
- Keep _Releases_ ticked (release-please publishes them); _Packages_ can be unticked.

**Settings → General:**

- **Default branch:** `main` (rename `master`; GitHub redirects old links). Workflows, release-please and Dependabot target `main`.
- **Features:** Wiki off (documentation lives in the repo), Issues on, Discussions off.
- **Pull Requests:** allow squash merging only, default message _Pull request title_; _Automatically delete head branches_ on.

**Settings → Actions → General:** _Workflow permissions_ read-only by default, and tick _Allow GitHub Actions to create and approve pull requests_ — release-please needs it to open the release PR.

**Settings → Advanced Security:** private vulnerability reporting on (SECURITY.md links to it), Dependabot alerts and security updates on, secret scanning and push protection on. Leave CodeQL _default setup_ off — `codeql.yml` is the advanced setup.

**Branches / tags:** delete stale branches that predate the rewrite (`develop`, `clojure`, `feature/Issue#10`, `gh-pages`) and the old tag `DeployToHerokuNowWorks`. Releases from v2.0.0 on are tagged `v<version>` by release-please.

## New migrations

Add a new file in `migrations/`; never edit an existing one. `deploy.yml` applies it **before** uploading the new code, so it must work with the code that is live (add a column with a default, don't rename or drop in the same release). To try it locally: `npm run db:migrate:local`.

## Operations

- **Logs:** Pages project → _Functions_ → _Real-time logs_, or `npx wrangler pages deployment tail --project-name=webroti`.
- **Query the database:** `npx wrangler d1 execute webroti --remote --command "SELECT COUNT(*) FROM meetings"`
- **Roll back code:** Pages project → _Deployments_ → an earlier deployment → _Rollback_. This doesn't undo migrations.
- **Back up / restore:** D1 Time Travel restores the database to any minute in the last 30 days: `npx wrangler d1 time-travel restore webroti --timestamp=<ISO time>`.
- Expired meetings (90 days without activity) are deleted automatically.
