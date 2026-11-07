# Security Policy

## Supported versions

Only what is deployed from `main` receives fixes.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use one of these private channels:

- **GitHub private vulnerability reporting** — [Report a vulnerability](https://github.com/CodeByAB/webroti/security/advisories/new) (preferred)
- **Email** — <daniel@valfridsson.net>

Include what you can: the type of issue, steps to reproduce, and the potential impact.

## Response timeline

|                 | Target                                      |
| --------------- | ------------------------------------------- |
| Acknowledgement | Within 7 days                               |
| Fix deployed    | Within 14 days of a confirmed vulnerability |

## Scope

Web-ROTI stores no personal data: only meeting codes, vote values and timestamps, deleted 90 days after a meeting's last activity. It sets no cookies and has no accounts. Most relevant:

- Cross-site scripting, or anything that gets past the Content Security Policy
- Cross-site request forgery against the API
- SQL injection or reading/changing another meeting's data beyond what its code allows
- Supply-chain issues in `public/vendor/` or the deploy workflow

Out of scope: meeting codes being guessable (they are short by design, so they can be typed) and volume abuse that Cloudflare rate limiting handles.
