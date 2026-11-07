# Web-ROTI

**Measure the return on time invested in your meetings.** Everyone in the meeting rates it anonymously from 1 to 5; Web-ROTI shows the number of votes, the average and the min–max.

1. Create a meeting.
2. Let everyone vote — pass a phone around, share the link, or show the QR code.
3. Watch the result on the meeting page; it updates by itself.

ROTI can be measured on a whiteboard, but voters who see each other's votes are biased. In Web-ROTI every vote is given blind.

## How it's built

Plain HTML, CSS and JavaScript on **Cloudflare Pages**, a small JSON API as **Pages Functions**, and **Cloudflare D1** (SQLite) for storage. No framework, no build step, no CMS, no cookies, no tracking. See [docs/architecture.md](docs/architecture.md).

## Development

Requires [Node.js](https://nodejs.org/) 22.13 or later.

```bash
npm ci          # dev tooling + git hooks
npm run dev     # http://localhost:8788 with a local D1 database
npm run check   # lint + typecheck + tests
```

- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow, commit convention, pull requests
- [STANDARDS.md](STANDARDS.md) — code standards, including rules for AI-generated code
- [CLAUDE.md](CLAUDE.md) — guidance for AI coding tools
- [ROADMAP.md](ROADMAP.md) — status and next steps
- [docs/deploy.md](docs/deploy.md) — Cloudflare setup and operations

## Third-party code

| File                                                                                                                            | Source                                                                      | Licence               |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------- |
| `public/vendor/qrcode-generator-2.0.4/qrcode.js` (the package's `dist/qrcode.mjs`) and `qrcode.d.ts` (adapted to the ES module) | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4 | MIT, © Kazuhiko Arase |

To upgrade, add the new version in a new folder `public/vendor/qrcode-generator-<version>/`, change the import in `public/js/qr.js`, and remove the old folder.

## History

Web-ROTI was created in 2013 at Diversify by Kristoffer Richardsson, Björn Ekengren, Daniel Valfridsson, Uzi Landsmann, Keijo Kurkinen, Anders Möllmark and Christer Sandberg, as a Java service on Heroku. It was rewritten from scratch in 2026; the original code is in the git history.

## Licence

[MIT](LICENSE)
