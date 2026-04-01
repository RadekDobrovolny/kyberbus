# Kyberbus

Nuxt 4 aplikace podle `docs/prd.md`.

## Stack

- Nuxt 4 (fullstack, server routes)
- TypeScript
- Tailwind CSS
- SQLite + Drizzle ORM
- Session auth přes cookie
- Upload a processing obrázků (Sharp + HEIC konverze)
- Docker Compose + Caddy

## Lokální vývoj

1. Nainstaluj závislosti:
   - `npm install`
2. Vytvoř `.env` podle `.env.example`.
3. Spusť dev server:
   - `npm run dev`
4. Otevři:
   - `http://localhost:3000`

### Důležité env proměnné

- `SQLITE_PATH` (default `./data/kyberbus.sqlite`)
- `UPLOADS_DIR` (default `./uploads`)
- `SESSION_COOKIE_SECURE` (`auto`, `true`, `false`)
- `NUXT_PUBLIC_UMAMI_WEBSITE_ID` (volitelné; když je vyplněné, vloží se Umami script)

## Seed demo dat

- Spuštění:
  - `npm run seed`
- Vytvoří:
  - 5 uživatelů (`user1` až `user5`)
  - každý má 1x Instax a 1x Lepík
- Heslo pro všechny seed účty:
  - `test1234`

## Docker nasazení

1. Build + start:
   - `docker compose up -d --build`
2. Aplikace poběží přes Caddy na:
   - `http://localhost:3004`
3. Volitelně Adminer:
   - `http://localhost:8080`

Persistovaná data:
- SQLite: volume `sqlite_data`
- Uploady: volume `uploads_data`

### Adminer (SQLite)

- `System`: `SQLite 3`
- `Database`: `/db/kyberbus.sqlite`

## Implementované funkce

- Otevřená registrace, přihlášení/odhlášení, session cookie.
- Feed od nejnovějších + stránkování (`Načíst další`), realtime refresh (SSE + polling fallback).
- Typy příspěvků:
  - `INSTAX` (foto + krátký text)
  - `LEPIK` (text)
  - `DISPECINK` (oznámení, `INFO`/`IMPORTANT`)
  - `KDO` (otázka + hlášení účasti)
  - `MESTO` (admin-only stylizovaný typ)
- Reakce na příspěvky (`❤️`, `😄`, `🚀`).
- Prokliky v textu (klikatelné URL) u Lepíků i Oznámení.
- Profil uživatele:
  - editace údajů a profilové fotky
  - volitelná změna hesla při editaci
- Admin sekce (`/busadmin`):
  - přehled uživatelů
  - změna role
  - smazání účtu
  - zobrazení poslední aktivity uživatele
- Ochrana prvního účtu:
  - jiný admin mu nemůže změnit heslo
  - jiný admin ho nemůže smazat
- Umami analytics:
  - script se vloží pouze pokud je vyplněné `NUXT_PUBLIC_UMAMI_WEBSITE_ID`

## Poznámka k autentizaci

Přihlášení je přes `login` + `heslo`.  
Session cookie se chová podle `SESSION_COOKIE_SECURE`:
- `auto`: rozhodnutí podle protokolu/proxy
- `true`: jen HTTPS
- `false`: i HTTP
