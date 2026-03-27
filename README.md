# Kyberbus MVP

Nuxt 3 aplikace podle `docs/prd.md`:
- fullstack (`Nuxt 3` + server routes),
- `TypeScript`,
- `Tailwind CSS`,
- `SQLite` + `Drizzle ORM`,
- session-based auth (cookie, 1 týden),
- upload fotek do Docker volume + image processing přes `Sharp`,
- validace přes `Zod`,
- nasazení přes `Docker Compose` + `Caddy`.

## Lokální vývoj

1. Nainstaluj závislosti:
   - `npm install`
2. Spusť dev server:
   - `npm run dev`
3. Otevři:
   - `http://localhost:3000`

`SQLITE_PATH` a `UPLOADS_DIR` lze změnit v `.env` (viz `.env.example`).

### Seed demo dat

- Spuštění:
  - `npm run seed`
- Vytvoří:
  - 5 uživatelů (`user1` až `user5`),
  - každý má 1x `Instax` a 1x `Lepík` příspěvek.
- Heslo pro všechny seed účty:
  - `test1234`

## Docker nasazení

1. Build a spuštění:
   - `docker compose up -d --build`
2. Aplikace poběží přes Caddy na:
   - `http://localhost`
3. Volitelně Adminer na:
   - `http://localhost:8080`

Persistovaná data:
- SQLite soubor: volume `sqlite_data`,
- uploadované fotky: volume `uploads_data`.

### Adminer (SQLite)

- V Admineru zvol:
  - `System`: `SQLite 3`
  - `Database`: `/db/kyberbus.sqlite`
- Adminer kontejner má přimountovaný stejný `sqlite_data` volume jako aplikace, takže můžeš data upravovat přímo.

## Co je implementováno z PRD

- Otevřená registrace bez pozvánky/kódu.
- Přístup k obsahu jen po přihlášení.
- Registrace a profil s limity 250 znaků (`krátké jméno`, `bio`, `kontakt`).
- Feed od nejnovějších, dávky 30 položek.
- Typy příspěvků `Instax` (foto + text max 50) a `Lepík` (text max 200).
- Uploady převáděné na `webp`, max šířka 1000 px.
- EXIF/GPS metadata zachována (`Sharp.withMetadata()`).
- Proklik na profil autora.
- Úprava/smazání vlastních příspěvků.
- Editace vlastního profilu včetně profilové fotky.

## Poznámka k přihlášení

PRD neobsahovalo konkrétní přihlašovací identifikátor/heslo. Implementace proto používá:
- `přihlašovací jméno` (`login`) + `heslo` pro autentizaci,
- profilová pole dle PRD (`krátké jméno`, `bio`, `kontakt`, `profilová fotka`).
