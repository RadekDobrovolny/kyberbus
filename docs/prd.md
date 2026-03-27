# PRD: Podpůrný „underground“ web pro expediční kurz

## 1. Kontext
Web slouží pro cca 50 účastníků týdenního expedičního kurzu (5 intenzivních dnů, přesuny mezi městy) jako živý prostor pro sdílení a tvorbu obsahu v průběhu akce.

Produkt nemá fungovat jako statické úložiště dokumentů. Cílem je aktivní komunita, rychlé publikování z mobilu a průběžné „tmelení“ skupiny.

## 2. Cíl produktu
Vytvořit mobile-first, interaktivní a neoficiálně působící web, kde účastníci:
- snadno publikují krátký obsah v terénu,
- vidí průběžný komunitní feed,
- poznávají autory příspěvků přes profilové karty.

## 3. Scope MVP
MVP zahrnuje:
- otevřenou registraci pro každého návštěvníka (bez pozvánky/kódu),
- povinné přihlášení pro přístup k obsahu,
- homepage s feedem všech příspěvků jako vizuální „provázek s kolíčky“,
- 2 typy příspěvků: `Instax` a `Lepík`,
- klikací identitu autora u každého objektu a veřejný profil v rámci aplikace,
- možnost upravit/smazat vlastní příspěvek,
- možnost upravit vlastní profil včetně profilové fotky.

MVP nezahrnuje (zatím):
- detail příspěvku na samostatné URL,
- pokročilé moderování, gamifikaci, notifikace, chat,
- rozšířené typy objektů (doplní se později),
- externí analytiku a měření metrik v aplikaci.

## 4. Cíloví uživatelé
- Studenti (většina účastníků).
- Odborní pracovníci.
- Členové odborných komunit.

Všichni mají stejná základní práva pro tvorbu a čtení obsahu.

## 5. Informační architektura (MVP)
- `Landing (nepřihlášený)`: pouze informace „jen pro účastníky zájezdu“ + CTA na registraci/přihlášení.
- `Registrace`.
- `Přihlášení`.
- `Homepage feed` (hlavní obrazovka po přihlášení).
- `Detail profilu uživatele`.
- `Editace profilu`.
- `Vytvoření příspěvku` (`Instax` / `Lepík`).
- `Úprava/smazání vlastního příspěvku` (v kontextu feedu).

## 6. Funkční požadavky

### FR-01 Přístup do aplikace
- Registrace je otevřená komukoli, kdo přijde na web.
- Nepřihlášený uživatel nevidí feed ani příspěvky.
- Nepřihlášený uživatel vidí pouze omezenou obrazovku s textem typu: „Jen pro účastníky zájezdu“.
- Z této obrazovky je dostupná registrace a přihlášení.

### FR-02 Registrace (povinná)
- Pro vstup do aplikace musí uživatel dokončit registraci.
- Registrace probíhá bez ověření kontaktu (bez e-mail/SMS verifikace).
- Povinná pole registrace:
- krátké jméno,
- profilová fotka,
- krátké bio,
- kontakt (ve volné textové formě).
- Limity délky textových polí profilu:
- krátké jméno: max 250 znaků,
- bio: max 250 znaků,
- kontakt: max 250 znaků.
- Pole „vtipnosti“ není součástí MVP.
- Kontakt je veřejně viditelný v rámci aplikace pro přihlášené uživatele.
- Po úspěšné registraci je uživatel přihlášen a přesměrován na homepage.
- Session má platnost 1 týden.

### FR-03 Homepage feed jako „provázek“
- Feed zobrazuje všechny příspěvky všech uživatelů v jednom společném toku.
- Vizuální metafora: provázek, na který se „kolíčky“ připínají objekty.
- Objekty musí být jasně odlišitelné podle typu a barvy kolíčku.
- Řazení je pouze chronologické: od nejnovějšího po nejstarší.
- První načtení feedu obsahuje 30 příspěvků.
- Dočítání feedu probíhá po dávkách 30 příspěvků.
- Příspěvek nemá samostatnou detailovou URL.

### FR-04 Typ objektu: Instax
- Objekt představuje „polaroid“:
- rámeček,
- fotka,
- krátký text do 50 znaků,
- datum.
- Uživatel může vložit fotku:
- nahráním z telefonu,
- pořízením přes kameru telefonu (pokud zařízení/browser podporuje).
- Při uploadu proběhne automatické zpracování:
- výstupní formát `webp`,
- změna velikosti na maximální šířku 1000 px.
- EXIF/GPS metadata zůstávají zachována.

### FR-05 Typ objektu: Lepík
- Objekt představuje digitální post-it.
- Obsahuje textový obsah (krátká textová poznámka) do 200 znaků.
- Vizuálně má působit jako lepící lístek.

### FR-06 Autor a profil
- Každý objekt zobrazuje ikonku autora.
- Klik na ikonku otevře profil autora.
- Profil autora zobrazuje minimálně:
- krátké jméno,
- profilovou fotku,
- bio,
- kontakt.
- Uživatel může svůj profil po registraci upravit, včetně výměny profilové fotky.

### FR-07 Správa vlastního obsahu
- Uživatel může své vlastní příspěvky upravit.
- Uživatel může své vlastní příspěvky smazat.

### FR-08 Moderace a správa
- Moderace obsahu v aplikaci není v MVP implementována.
- Nežádoucí účty budou řešeny manuálně (zásah přímo v DB).

## 7. Uživatelské scénáře (MVP)
- Jako návštěvník bez účtu chci vidět, že web je určený pro účastníky, a rychle se registrovat.
- Jako přihlášený účastník chci na homepage vidět všechny příspěvky komunity v jednom feedu.
- Jako účastník chci přidat `Instax` z mobilu během přesunu (foto + krátký popis).
- Jako účastník chci přidat `Lepík` jako rychlou myšlenku.
- Jako účastník chci kliknout na autora příspěvku a zjistit, kdo to je.
- Jako účastník chci upravit nebo smazat svůj vlastní příspěvek.
- Jako účastník chci upravit svůj profil a profilovou fotku.

## 8. UX a vizuální principy
- Mobile-first návrh (primární používání na telefonu).
- Rychlé vytvoření příspěvku do několika kliknutí.
- Výrazný „underground / neoficiální“ styl, ale stále čitelný a funkční.
- Důraz na interakci a spolu-tvorbu, ne na dlouhé statické stránky.

## 9. Nefunkční požadavky
- Responzivita: plná funkčnost na moderních mobilních prohlížečích.
- Výkon: homepage feed se musí použít komfortně při cílovém zatížení cca 50 uživatelů a až 200 příspěvků za den.
- Spolehlivost uploadu fotek z mobilu při běžném připojení.
- Základní bezpečnost: autentizace, autorizace přístupu k obsahu pouze po přihlášení.
- Provozní jednoduchost: bez externí analytiky, bez in-app moderace.

## 10. Technický stack
- Frontend + backend v jednom: `Nuxt 3`.
- Jazyk: `TypeScript`.
- Styly: `Tailwind CSS`.
- Databáze: `SQLite`.
- ORM: `Drizzle ORM`.
- Autentizace: session-based auth přes `Nuxt server routes`.
- Upload fotek: ukládání souborů na disk do Docker volume.
- Image processing: `Sharp`.
- Validace formulářů: `Zod`.
- Nasazení: `Docker Compose`.
- Reverse proxy: `Caddy`.

### Persistovaná data
- `SQLite` soubor v Docker volume.
- Uploadnuté fotky v samostatném Docker volume.

## 11. Metriky úspěchu (MVP)
Produktové metriky jsou definované, ale v MVP se neimplementuje jejich automatizované měření.
- Aktivace: podíl registrovaných účastníků z celkového počtu.
- Tvorba: počet příspěvků na uživatele za den.
- Zapojení: podíl účastníků, kteří publikují alespoň 1 objekt denně.
- Profilové interakce: počet otevření profilů autorů.

## 12. Akceptační kritéria MVP
- Nepřihlášený uživatel nikdy neuvidí feed ani detaily příspěvků.
- Nový uživatel se zaregistruje bez pozvánky/kódu a bez verifikace kontaktu přes definovaná pole a vstoupí do aplikace.
- Pole `krátké jméno`, `bio` a `kontakt` mají limit max 250 znaků.
- Přihlášený uživatel vytvoří `Instax` z mobilní fotogalerie i přes kameru (kde je podporována).
- Uploadnutá fotka pro `Instax` je uložená jako `webp` se šířkou max 1000 px.
- Přihlášený uživatel vytvoří `Lepík` s limitem 200 znaků.
- Oba typy objektů se zobrazí v homepage feedu na „provázku“.
- Feed je řazený od nejnovějších příspěvků a dočítá se po 30 položkách.
- Přihlášený uživatel může upravit nebo smazat svůj vlastní příspěvek.
- Přihlášený uživatel může upravit svůj profil včetně profilové fotky.
- Session přihlášení má platnost 1 týden.
- U obou typů objektů funguje proklik přes ikonku autora na profil.

## 13. Otevřené body k doplnění
- Přesná podoba textu a brandingu landing obrazovky „jen pro účastníky“.
- Přesné vizuální parametry „provázku“ a „kolíčků“ (barvy, styl, typografie).
- Návrat pole „vtipnosti“ v budoucí verzi (otázky, typ odpovědí, zobrazení).
