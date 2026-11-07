# CLAUDE.md

Regler och kontext för AI-assistenter (Claude Code m.fl.) och för människor
som kodar i repot. `AGENTS.md` pekar hit, så det här är den enda
instruktionsfilen — håll den sann.

## Projektet

**Web-ROTI** (Return On Time Invested) mäter hur mycket ett möte var värt:
någon skapar ett möte, alla deltagare röstar anonymt 1.0–5.0 (via länk,
QR-kod eller genom att skicka runt en telefon) och mötessidan visar antal
röster, medelvärde och min–max. Skapades 2013 på Diversify i Java/Jersey
med jQuery och lagring i minnet; skrevs om från grunden 2026.

Stacken är medvetet liten, samma mönster som SUHF och Gubbängens
klädbyte:

- **Cloudflare Pages** serverar `public/` (vanlig HTML/CSS/JS, inget
  byggsteg, inget ramverk).
- **Pages Functions** i `functions/api/` är API:t.
- **Cloudflare D1** (SQLite) lagrar möten och röster. Schemat ligger i
  `migrations/`.

GitHub Pages räcker inte: sajten behöver ett API och en databas.

**Läs `ROADMAP.md` först i varje session.** Uppdatera den när ett steg
blir klart, startar eller blockeras.

## Kommandon

```bash
npm ci                 # installera utvecklingsverktygen (låsta versioner)
npm run dev            # lokal D1-migrering + wrangler pages dev på http://localhost:8788
npm run check          # allt nedan, kör före varje commit
npm run lint           # ESLint + Prettier --check
npm run typecheck      # tsc på JSDoc-typerna (server och webbläsare var för sig)
npm test               # node --test, inkl. riktig SQL mot migreringarna
npm run format         # Prettier --write
npm run db:migrate:remote   # applicera nya migreringar i produktion (se README)
```

Kräver Node.js ≥ 22.13 (testerna använder inbyggda `node:sqlite`).
Lokal databas ligger i `.wrangler/` (gitignorerad); radera mappen för att
börja om.

## Arkitektur

```
public/                    Statiska filer, serveras som de är
  index.html               Startsida: skapa möte, eller ange mötes-kod
  meeting.html             Resultat (?id=), röstlänk, QR-kod, uppdateras var 5:e s
  vote.html                Röstning (?id=), reglage 1.0–5.0
  404.html, favicon.svg, robots.txt
  _headers                 Säkerhetshuvuden för statiska filer (Cloudflare-syntax)
  css/main.css             All CSS, design-tokens i :root (se docs/design.md)
  js/*.js                  ES-moduler, en per sida + api.js och qr.js
  vendor/<paket>-<ver>/    Vendrade tredjepartsfiler (ingen CDN)
functions/api/             Pages Functions = API:t (filnamn = route)
  _middleware.js           Felhantering + säkerhetshuvuden för alla /api/*
  meetings/index.js        POST /api/meetings
  meetings/[id]/index.js   GET  /api/meetings/:id
  meetings/[id]/votes.js   POST /api/meetings/:id/votes
lib/                       Logik som functions importerar (ingen routing här)
  meetings.js              Domänlogik och SQL
  http.js                  JSON-svar, felmappning, body-läsning
migrations/                D1-migreringar, NNNN_beskrivning.sql
test/                      node:test; d1.js är en D1-attrapp över node:sqlite
```

### API-kontrakt

| Metod och väg                  | Body               | Svar                                                                                      |
| ------------------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| `POST /api/meetings`           | `{}`               | `201 { "id": "482913" }`                                                                  |
| `GET /api/meetings/:id`        | –                  | `200 { "id", "votes", "average", "min", "max" }` (tal med en decimal, `null` utan röster) |
| `POST /api/meetings/:id/votes` | `{ "value": 3.4 }` | `201 { "ok": true }`                                                                      |

Fel är alltid `{ "error": "meddelande" }` med 400 (ogiltig indata), 404
(okänt/utgånget möte), 409 (kodkrock/max antal röster), 415 (inte
`application/json`) eller 500. Ändras kontraktet: uppdatera tabellen,
`public/js/api.js` och `test/api.test.js` i samma commit.

### Domänregler (avsiktliga, ändra inte av misstag)

- **Mötes-koder** är sex siffror 100000–999999 från `crypto.getRandomValues`,
  lätta att skriva av. Krock → ny kod (max 10 försök).
- **Röster** lagras som heltal i tiondelar (3.4 → 34) så medelvärdet blir
  exakt. Medel avrundas till en decimal (originalet gjorde också så).
- **Flera röster från samma enhet är tillåtet** — att skicka runt en
  telefon är huvudfallet. Lägg inte till "en röst per person" utan beslut.
- Reglaget återställs till 3.0 efter varje röst så nästa person inte
  påverkas av förra rösten.
- **Gallring:** möten utan aktivitet i 90 dagar räknas som borta och
  raderas (med röster, `ON DELETE CASCADE`) när nästa möte skapas. Pages
  Functions har ingen cron. Läsning förnyar aktiviteten högst en gång per
  dygn, så pollning inte skriver till databasen.
- Max 1000 röster per möte.
- Inga inloggningar, inga personuppgifter, inga cookies, ingen analys.

## Kodstandard

- **Vanlig modern JavaScript (ES2023, ES-moduler)** överallt, inget
  byggsteg. Typer skrivs som JSDoc och kontrolleras med `tsc`
  (`// @ts-check` överst i varje fil under `functions/`, `lib/`,
  `public/js/`). Ingen TypeScript-syntax i `.js`-filer.
- **Prettier** äger formatering (`.prettierrc.json`: enkla citattecken,
  120 tecken). **ESLint** (`eslint.config.js`) fångar buggar. Stäng inte av
  regler inline utan en kommentar om varför.
- `.editorconfig`: UTF-8, LF, 2 blanksteg.
- Namn: `camelCase` för funktioner/variabler, `UPPER_SNAKE` för konstanter,
  filnamn i `kebab-case` eller Cloudflares routing-format (`[id]`).
  Kod, kommentarer, commit-meddelanden och UI-text på **engelska**;
  dokumentationen (`*.md`) på **svenska**.
- Kommentarer förklarar _varför_, inte _vad_. Varje fil börjar med en kort
  kommentar om vad den är till för.
- Domänlogik i `lib/`, inte i `functions/`. En function ska bara: validera
  route/headers, anropa `lib/`, mappa fel med `domainErrorResponse`.
- All SQL med bundna parametrar (`?1`, `.bind()`), aldrig
  strängkonkatenering.
- Frontend: hämta element med `id`, bygg DOM med `textContent` /
  `createElement`. **Aldrig `innerHTML`** med data.
- Små, fokuserade commits med beskrivande meddelande i imperativ
  ("Add vote cap per meeting").

### Tester

- Ny eller ändrad logik i `lib/` eller `functions/` kräver tester i
  `test/`. Testerna kör migreringarna mot en riktig SQLite, så SQL-fel
  fångas lokalt.
- Ändrar du UI: kör `npm run dev` och klicka igenom skapa möte → rösta →
  resultat i mobil- (390 px) och desktopbredd, ljust och mörkt läge, och
  kontrollera att webbläsarkonsolen är tom (CSP-fel syns där).

## Säkerhetsregler

- **CSP** (`public/_headers`) tillåter bara `'self'`: **inga inline-skript,
  inga inline-styles (`style=""`), inga externa CDN:er, typsnitt eller
  analysverktyg.** Tredjepartskod vendras i `public/vendor/<paket>-<version>/`
  med licenshuvudet kvar och noteras i README.
- `public/_headers` gäller inte Functions; API-huvuden sätts i
  `functions/api/_middleware.js`.
- Alla skrivande anrop kräver `Content-Type: application/json`. Det tvingar
  fram en CORS-preflight som API:t aldrig besvarar = CSRF-skydd. Lägg
  aldrig till `Access-Control-Allow-Origin` på API:t.
- Validera all indata på servern (`parseVote`, `isMeetingId`); klientens
  validering är bara bekvämlighet.
- Interna fel loggas med `console.error` och svarar `500` utan detaljer.
- **Inga hemligheter i repot.** Gamla `.travis.yml` innehöll en Heroku-
  API-nyckel i klartext; den finns kvar i git-historiken (se ROADMAP).

## Regler för AI-assistenter

1. Läs `ROADMAP.md` och den här filen innan du ändrar något.
2. Kör `npm run check` innan varje commit; committa inte rött.
3. **Inga nya beroenden** (npm-paket, vendrade filer, Cloudflare-tjänster)
   utan att Daniel har bett om det eller godkänt det. Föreslå hellre.
   Webbläsaren och Workers-runtimen räcker långt.
4. **Ändra aldrig en migrering som redan finns** — den kan vara körd i
   produktion. Skapa en ny `migrations/NNNN_….sql` och uppdatera
   arkitekturavsnittet.
5. Ändra inte domänreglerna ovan, API-kontraktet eller säkerhets-
   huvudena utan att det är uttryckligen efterfrågat; nämn det i så fall
   tydligt i commit och svar.
6. Rör inte `wrangler.toml`s `database_id`, Cloudflare-inställningar eller
   produktionsdatabasen (`--remote`) utan uttrycklig begäran.
7. Arbeta på en egen branch, aldrig direkt på `main` (dokumentations-
   ändringar undantagna). Pusha sällan — varje push bygger en preview.
8. Dokumentationen är en del av ändringen (se nedan). Hitta inte på status
   i ROADMAP; skriv bara det som är verifierat.
9. Rapportera ärligt: säg vad som testats, hur, och vad som inte testats.

## Dokumentation (krav)

En ändring är inte klar förrän dokumenten beskriver det nya läget, i
samma commit. Inaktuell dokumentation räknas som en bugg.

| Dokument         | Läsare                  | Uppdatera när                                                      |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| `ROADMAP.md`     | Alla, varje session     | Ett steg startar/blir klart/blockeras, ett beslut tas eller öppnas |
| `CLAUDE.md`      | Kodsessioner            | Arkitektur, API, kommandon, regler eller konventioner ändras       |
| `docs/design.md` | Kodsessioner            | Tokens, komponenter eller sidor ändras                             |
| `README.md`      | Den som driftar         | Uppsättning, driftsättning eller drift ändras                      |
| `SECURITY.md`    | Den som rapporterar fel | Hur säkerhetsfel tas emot ändras                                   |

Innan du är klar: sök i dokumenten efter det du ändrat (sökvägar, namn,
versioner, URL:er) och rätta varje inaktuell rad.
