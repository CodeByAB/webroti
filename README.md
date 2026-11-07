# Web-ROTI

Mät hur mycket dina möten är värda. Web-ROTI (Return On Time Invested)
låter alla i ett möte betygsätta det anonymt från 1 till 5 och visar
antal röster, medelvärde och min–max.

1. Skapa ett möte på startsidan.
2. Låt alla rösta — skicka runt en telefon, dela länken eller visa QR-koden.
3. Följ resultatet på mötessidan (uppdateras automatiskt).

Byggd på **Cloudflare Pages** (statiska filer i `public/`), **Pages
Functions** (API:t i `functions/api/`) och **Cloudflare D1** (SQLite).
Inget ramverk och inget byggsteg. Utvecklarregler, arkitektur och
kodstandard finns i [`CLAUDE.md`](CLAUDE.md), status i
[`ROADMAP.md`](ROADMAP.md).

## Lokal utveckling

Kräver [Node.js](https://nodejs.org/) 22.13 eller senare.

```bash
npm ci          # installerar wrangler, eslint, prettier, typescript
npm run dev     # http://localhost:8788 med lokal D1-databas
npm run check   # lint + typkontroll + tester, kör före varje commit
```

Den lokala databasen ligger i `.wrangler/` och påverkar inte produktion.

## Driftsättning (Cloudflare Pages)

Görs en gång av den som äger Cloudflare-kontot.

1. **Logga in:** `npx wrangler login`
2. **Skapa databasen:** `npx wrangler d1 create webroti`. Kopiera
   `database_id` som skrivs ut till `wrangler.toml` (ersätt nollorna) och
   committa.
3. **Skapa tabellerna:** `npm run db:migrate:remote`
4. **Skapa Pages-projektet:** Cloudflare Dashboard → _Workers & Pages_ →
   _Create_ → _Pages_ → _Connect to Git_ → välj `CodeByAB/webroti`.
   - Production branch: `main`
   - Framework preset: _None_
   - Build command: _(tomt)_
   - Build output directory: `public`

   D1-kopplingen (`DB`) läses från `wrangler.toml`; den ska inte läggas in
   i dashboarden.

5. **Egen domän:** projektet → _Custom domains_ → lägg till domänen.
6. **Rekommenderat:** en _Rate limiting rule_ under domänens _Security →
   WAF_ för `/api/*` (t.ex. 60 anrop/minut per IP) mot skräpröster.

Därefter driftsätts varje push till `main` automatiskt, och varje annan
branch får en förhandsadress `<branch>.webroti.pages.dev`.

**Obs:** förhandsadresserna använder samma D1-databas som produktion
(se ROADMAP).

### Nya databasmigreringar

Migreringar körs **inte** automatiskt vid deploy. När en branch med en ny
fil i `migrations/` ska till `main`: kör `npm run db:migrate:remote`
först (migreringar ska vara bakåtkompatibla med koden som redan är ute),
merga sedan.

## Drift

- Möten utan aktivitet i 90 dagar raderas automatiskt.
- Loggar: Cloudflare Dashboard → projektet → _Functions_ → _Real-time logs_.
- Titta i databasen: `npx wrangler d1 execute webroti --remote --command "SELECT COUNT(*) FROM meetings"`.

## Tredjepartskod

| Fil                                                                  | Version                                                                     | Licens                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------- |
| `public/vendor/qrcode-generator-2.0.4/qrcode.js` (från `qrcode.mjs`) | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4 | MIT, © Kazuhiko Arase |

Uppgradera genom att lägga den nya versionen i en ny mapp
`public/vendor/qrcode-generator-<version>/`, ändra importen i
`public/js/qr.js` och ta bort den gamla mappen.

## Historik

Web-ROTI skapades 2013 på Diversify av Kristoffer Richardsson, Björn
Ekengren, Daniel Valfridsson, Uzi Landsmann, Keijo Kurkinen, Anders
Möllmark och Christer Sandberg, som en Java/Jersey-tjänst på Heroku. Den
koden finns kvar i git-historiken (före omskrivningen 2026).
