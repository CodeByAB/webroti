# Roadmap — Web-ROTI

Status och nästa steg. Uppdateras i repot (inte i lokalt minne) så att den
syns oavsett maskin eller session.

## Nu / Next

**Nu:** Omskrivningen är klar på branchen `claude/webroti-modernize-rebuild-ze5g88`:
all funktionalitet från Java-versionen finns, `npm run check` är grönt
och hela flödet är testat lokalt i webbläsare (`wrangler pages dev`).
Inget är driftsatt ännu.

**Next:**

1. Daniel granskar branchen och mergar till `main`.
2. Driftsätt enligt README § Driftsättning (D1-databas, Pages-projekt,
   `database_id` i `wrangler.toml`).
3. Bestäm domän (se öppna frågor).

## Status

### Omskrivning (2026-11)

- [x] Java/Jersey, Maven, Heroku-Procfile, Travis och jQuery/Bootstrap/
      RequireJS borttagna
- [x] API som Pages Functions: skapa möte, hämta resultat, rösta
- [x] D1-schema (`migrations/0001_init.sql`), röster i tiondelar
- [x] Gallring av möten efter 90 dagar utan aktivitet
- [x] Max 1000 röster per möte, validering på servern, CSRF-skydd via
      `Content-Type: application/json`
- [x] Ny frontend utan ramverk: startsida (skapa möte / ange kod),
      mötessida (statistik, QR-kod, kopiera länk, automatisk uppdatering),
      röstsida (reglage, bekräftelse, återställning till 3.0)
- [x] Strikt CSP (`'self'` only), säkerhetshuvuden, mörkt läge
- [x] Google Analytics borttagen (ingen spårning, inga cookies)
- [x] Kodstandard: ESLint, Prettier, JSDoc-typer med `tsc`, EditorConfig
- [x] Tester: domänlogik och API-handlers mot riktig SQLite (19 tester)
- [x] GitHub Actions (`check.yml`) och Dependabot
- [x] CLAUDE.md (AI-regler och kodstandard), AGENTS.md, README, SECURITY,
      docs/design.md

### Driftsättning

- [ ] D1-databas skapad och migrerad i Cloudflare
- [ ] Pages-projekt kopplat till repot
- [ ] Egen domän
- [ ] Rate limiting-regel för `/api/*`

## Öppna frågor och beslut

- **Domän:** `webroti.com` användes förr — äger vi den fortfarande? Annars
  t.ex. en subdomän. Den gamla kontaktadressen `contact@webroti.com` togs
  bort från sajten tills vidare.
- **Läckt Heroku-nyckel:** gamla `.travis.yml` innehöll en Heroku-API-
  nyckel i klartext. Filen är borttagen men nyckeln finns i git-historiken.
  Kontrollera att Heroku-kontot/nyckeln är avstängd (troligen sedan länge).
- **Förhandsmiljöns databas:** previews delar D1-databas med produktion.
  Alternativ: en separat `webroti-preview`-databas via `[env.preview]` i
  `wrangler.toml`.
- **Migreringar i CI:** köra `wrangler d1 migrations apply --remote` från
  GitHub Actions (kräver Cloudflare-API-token som secret) i stället för
  manuellt.
- **Språk:** UI:t är på engelska som originalet. Svenska som tillval?
- **Licens:** repot saknar licensfil.
- Beslut 2026-11-07: Cloudflare Pages + D1 i stället för GitHub Pages,
  eftersom sajten behöver API och lagring. Samma plattform som SUHF och
  Gubbängens klädbyte.
- Beslut 2026-11-07: mötes-koder är sex siffror (originalet: fem) eftersom
  möten nu sparas i 90 dagar i stället för tills servern startade om.

## Idéer (inte påbörjade)

- Fördelning av röster som stapeldiagram på mötessidan.
- Möjlighet för skaparen att stänga röstningen.
- Svensk översättning.
