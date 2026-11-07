# Contributing to Web-ROTI

Thanks for helping. This guide covers setting up the project, making a change and getting it merged.

## Contents

- [Start in five minutes](#start-in-five-minutes)
- [Code of Conduct](#code-of-conduct)
- [Development workflow](#development-workflow)
- [Commit convention](#commit-convention)
- [Code standards](#code-standards)
- [Testing your change](#testing-your-change)
- [Documentation requirements](#documentation-requirements)
- [Opening a pull request](#opening-a-pull-request)
- [Continuous integration](#continuous-integration)

## Start in five minutes

You need Node.js 22.13 or later (`.nvmrc`). Nothing else: no Cloudflare account, no database server.

```bash
git clone https://github.com/CodeByAB/webroti.git
cd webroti
npm ci          # installs the dev tools and the git hooks
npm run dev     # http://localhost:8788 — Pages, Functions and a local D1 database
```

Small fixes can go straight to a pull request; for anything bigger, open an issue first.

**AI tools** are welcome. If one wrote a substantial part of a change, say so with a `Co-Authored-By:` line in the commit. `CLAUDE.md` and `.claude/` configure AI coding tools; the rules for AI-generated code are in [STANDARDS.md](STANDARDS.md#ai-generated-code).

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive, assume good faith, and keep discussion focused on the work.

## Development workflow

1. Open an issue describing the bug or the user-visible change.
2. Branch from `main`: `git switch -c <type>/<short-name>` (e.g. `fix/slider-reset`). Don't branch off another unmerged branch — PRs are squash-merged.
3. Implement, with tests for logic changes.
4. Run `npm run check` and try the change in the running site.
5. Commit with a Conventional Commit subject and `Closes #N`, push, open a PR.

## Commit convention

[release-please](https://github.com/googleapis/release-please) builds `CHANGELOG.md` and the version from commit subjects on `main`, so they must follow [Conventional Commits](https://www.conventionalcommits.org/). The `commit-msg` hook checks it.

```text
<type>(<scope>): <subject>

<optional body>

Closes #N
```

| Type                                                        | Use for                    | In changelog |
| ----------------------------------------------------------- | -------------------------- | ------------ |
| `feat`                                                      | A new user-visible feature | yes          |
| `fix`                                                       | A bug fix                  | yes          |
| `perf`                                                      | A performance improvement  | yes          |
| `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style` | Everything else            | no           |

Scopes: `api`, `db`, `meeting`, `vote`, `start`, `ui`, `deploy`, `deps`, `docs`. Subject: imperative, lower-case start, no trailing period. A breaking change to the API or page URLs: `feat!:` or a `BREAKING CHANGE:` footer.

Since PRs are squash-merged, the **PR title** becomes the commit on `main` — give it the same shape.

## Code standards

See [STANDARDS.md](STANDARDS.md). In short: plain modern JavaScript with JSDoc types, Prettier formatting, no inline scripts or styles, all SQL with bound parameters, no new dependencies without approval.

## Testing your change

| You changed                         | Check                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/`, `functions/`, `migrations/` | `npm test` — tests run real SQL against the migrations                                                                                                  |
| Anything that renders               | `npm run dev`, then: create a meeting, vote a few times, check the results. Phone width and desktop, light and dark mode, and an empty browser console. |
| Docs only                           | `npm run lint`                                                                                                                                          |

## Documentation requirements

Documentation is part of the change, in the same PR. A change isn't done until the docs describe the new state.

| Document               | Update when                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `ROADMAP.md`           | A step starts, finishes or is blocked; a decision is made or opened                    |
| `docs/architecture.md` | Endpoints, response shapes, tables, domain rules, security model or file layout change |
| `docs/design.md`       | Tokens, components or page layout change                                               |
| `docs/deploy.md`       | Setup, secrets, deploy or operations change                                            |
| `STANDARDS.md`         | A coding rule is added or changed                                                      |
| `CLAUDE.md`            | A rule AI tools must follow in every session changes (keep it short)                   |
| `README.md`            | What the project is, how to start, or third-party code changes                         |

Before finishing, search the docs for what you changed (paths, names, versions) and fix every stale mention.

## Opening a pull request

Use the template. The PR is ready when **Verify** is green; CodeQL is informational. The maintainer reviews and squash-merges.

## Continuous integration

| Workflow             | When                      | What                                                           |
| -------------------- | ------------------------- | -------------------------------------------------------------- |
| `verify.yml`         | Push to `main`, every PR  | `npm run check` — required to merge                            |
| `deploy.yml`         | Push to `main`            | Check, D1 migrations, deploy to Cloudflare Pages               |
| `codeql.yml`         | Push/PR to `main`, weekly | CodeQL for JavaScript and the workflows                        |
| `audit.yml`          | Weekly                    | `npm audit`                                                    |
| `release-please.yml` | Push to `main`            | Release PR with version bump and `CHANGELOG.md`; tags on merge |

Dependabot opens weekly grouped PRs for npm and GitHub Actions (no major versions). All actions are pinned to a commit SHA.
