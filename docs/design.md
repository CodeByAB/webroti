# Design

Enkel, lugn och mobil först: sajten används oftast på en telefon som
skickas runt i ett mötesrum. Allt ligger i `public/css/main.css`.

## Tokens

Alla färger, avstånd och radier är CSS custom properties i `:root`.
Använd dem i stället för hårdkodade värden. Mörkt läge följer
`prefers-color-scheme` och byter bara tokenvärden.

| Token                            | Ljust                   | Mörkt     | Används till                        |
| -------------------------------- | ----------------------- | --------- | ----------------------------------- |
| `--color-primary`                | `#1f6f5c`               | `#4fb79a` | Knappar, länkar, reglage, fokusring |
| `--color-bg`                     | `#f3f5f4`               | `#121715` | Sidbakgrund, statistikrutor         |
| `--color-surface`                | `#ffffff`               | `#1b2220` | Kortet                              |
| `--color-text` / `--color-muted` |                         |           | Brödtext / sekundär text            |
| `--color-error`                  | `#b3261e`               | `#ff8a80` | Felmeddelanden                      |
| `--space-1…4`                    | 0.5 / 1 / 1.5 / 2.5 rem |           | Avstånd                             |
| `--tap-size`                     | 3rem                    |           | Minsta höjd på klickbara element    |

Typsnitt: systemtypsnittet (`system-ui`), siffror med
`tabular-nums`, mötes-koder i monospace. Inga webbtypsnitt.

## Komponenter

- `.card` — sidans enda behållare, max 40rem bred.
- `.button`, `.button--primary` (helbredd, fylld), `.button--small`.
- `.status`, `.status--success`, `.status--error` — meddelanden med
  `role="status"`/`role="alert"`.
- `.stats` / `.stats__item` — tre rutor på mötessidan, får inte radbrytas
  på 320 px bredd.
- `.vote-value` + `.slider` — det stora talet och det inbyggda reglaget
  (`accent-color`).
- `.qr` — QR-koden som SVG.
- `.visually-hidden` — text bara för skärmläsare.

Nya klasser följer formen `.block`, `.block__element`, `.block--modifier`.

## Tillgänglighet

- Allt går att använda med tangentbord; synlig fokusring (`:focus-visible`).
- Formulärfält har `label`, levande värden har `aria-live`.
- Kontrollera kontrast (WCAG AA) när färger ändras, i båda lägena.
