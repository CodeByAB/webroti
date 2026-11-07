# Design

Calm, simple and mobile first: the site is mostly used on a phone passed around a meeting room. Everything is in `public/css/main.css`.

## Tokens

Colours, spacing and radii are CSS custom properties in `:root`. Use them instead of literal values. Dark mode follows `prefers-color-scheme` and only changes token values.

| Token                            | Light                   | Dark                  | Used for                            |
| -------------------------------- | ----------------------- | --------------------- | ----------------------------------- |
| `--color-primary`                | `#1f6f5c`               | `#4fb79a`             | Buttons, links, slider, focus ring  |
| `--color-bg`                     | `#f3f5f4`               | `#121715`             | Page background, stat boxes         |
| `--color-surface`                | `#ffffff`               | `#1b2220`             | The card                            |
| `--color-text` / `--color-muted` | `#1d2422` / `#5b6662`   | `#e6ecea` / `#a3b0ab` | Body / secondary text               |
| `--color-error`                  | `#b3261e`               | `#ff8a80`             | Error messages                      |
| `--space-1…4`                    | 0.5 / 1 / 1.5 / 2.5 rem |                       | Spacing                             |
| `--tap-size`                     | 3rem                    |                       | Minimum height of anything tappable |

Type: the system font stack (`system-ui`), `tabular-nums` for figures, monospace for meeting codes. No web fonts.

## Components

- `.card` — the single container on every page, at most 40rem wide.
- `.button`, `.button--primary` (full width, filled), `.button--small`.
- `.status`, `.status--success`, `.status--error` — messages, with `role="status"` or `role="alert"`.
- `.join`, `.join__row` — the meeting-code form on the start page.
- `.stats`, `.stats__item` — the three boxes on the meeting page; must not wrap at 320 px.
- `.vote-value` + `.slider` — the big number and the native range input (`accent-color`).
- `.qr` — the QR code as SVG; `.share` — link and copy button.
- `.visually-hidden` — text for screen readers only.

New classes follow `.block`, `.block__element`, `.block--modifier`.

## Checking a UI change

Look at the changed pages at 390 px and 1280 px, in light and dark mode, and keep the browser console empty (CSP violations show there). `/run-webroti` describes how. Check contrast (WCAG AA) whenever a colour changes.
