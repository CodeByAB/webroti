---
name: commit-workflow
description: Full sequence for shipping any bug fix or feature in Web-ROTI — from opening a GitHub issue through roadmap sync. Run when starting work on a feature/bug or when ready to commit.
---

This is the sequence for every bug fix and feature. Do not skip steps or reorder them.

## 1. Open a GitHub issue before starting work

- **Bug:** the incorrect behaviour, steps to reproduce, expected behaviour.
- **Feature:** the user-visible change and why it is needed.

## 2. Branch from `main`, then implement

```bash
git switch main && git pull && git switch -c <type>/<short-name>   # e.g. fix/slider-reset, feat/vote-histogram
```

Never commit to `main` directly. Don't branch off another unmerged branch — PRs are squash-merged.

## 3. Test in the running site — required before any commit

Use `/run-webroti`. Verify the golden path (create meeting → vote → results) **and** the edge cases the change touches. Passing tests verify code, not behaviour.

## 4. Run checks, then commit with `Closes #N`

```bash
npm run check
```

```text
<type>(<scope>): <subject>

<optional body>

Closes #N
```

- **type:** `feat`, `fix`, `perf`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style`. Only `feat`/`fix`/`perf` reach the changelog.
- **scope:** `api`, `db`, `meeting`, `vote`, `start`, `ui`, `deploy`, `deps`, `docs`.
- **subject:** imperative, lower-case start, no trailing period. The `commit-msg` hook enforces the shape.
- Breaking API or URL change: `feat!:` or a `BREAKING CHANGE:` footer.

## 5. Push and open a pull request

```bash
git push -u origin HEAD
```

Open the PR with the template (title = commit subject, body ends with `Closes #N`). It is ready when **Verify** is green; CodeQL is not a merge gate. The owner merges — tell them it's ready.

## 6. Documentation and roadmap — same PR

| What changed                                         | Update                        |
| ---------------------------------------------------- | ----------------------------- |
| Endpoint, response shape, domain rule, module, table | `docs/architecture.md`        |
| Feature done, started, blocked, or a decision        | `ROADMAP.md`                  |
| Tokens, components, page layout                      | `docs/design.md`              |
| Setup, deploy, secrets                               | `docs/deploy.md`, `README.md` |
| A rule Claude must follow in _every_ session         | `CLAUDE.md` (keep it short)   |
| A coding rule                                        | `STANDARDS.md`                |
