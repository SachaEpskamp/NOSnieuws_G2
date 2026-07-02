# Even Hub store listing — NOS Nieuws voor Even G2 (unofficial)

Assets for the public-release submission. Screenshots are real app output
(captured from the live app, rendered at the G2's native 576×288).

## Screenshots (576 × 288)

| File | Shows |
|---|---|
| `screenshot-1-list.png` | Headline list with cursor, live NOS headlines |
| `screenshot-2-article.png` | Article reader, start of an article |
| `screenshot-3-article-scroll.png` | Article reader, scrolled (progress footer) |

Icon: use `../icon/icon-512.png` (or `icon-1024.png`, whichever size the portal asks for).

## Description (paste verbatim; fits the 2000-char limit)

```
NOS Nieuws voor Even G2 (onofficieel)

Lees het laatste Nederlandse nieuws op je bril. Deze app toont de openbare RSS-feeds van NOS.nl rechtstreeks op de Even G2: koppen doorbladeren, een artikel openen en de volledige tekst lezen, zonder je telefoon te pakken.

Op de bril:
- Schuif over het touchpad om door de nieuwskoppen te bladeren. Te lange koppen scrollen vanzelf voorbij, zodat je ze helemaal kunt lezen.
- Tik om een artikel te openen en schuif om door de volledige tekst te scrollen. Tik nogmaals om terug te gaan naar de lijst.
- Dubbeltik om de app te sluiten.

Op de telefoon:
- Kies welke feeds je volgt: NOS Nieuws (algemeen, binnenland, buitenland, politiek, economie, koningshuis, tech, cultuur & media, opmerkelijk), NOS Sport (voetbal, Formule 1, schaatsen, tennis, wielrennen) en overig (NOS op 3, Jeugdjournaal, Nieuwsuur). Standaard staan de NOS Nieuws-feeds aan.
- Je selectie wordt bewaard en het nieuws ververst automatisch elke vijf minuten.

BELANGRIJK: dit is een ONOFFICIËLE app, gemaakt door een fan. Deze app is niet gemaakt door, verbonden aan of ondersteund door de NOS. Alle nieuwsinhoud en het NOS-merk zijn eigendom van de NOS. De app toont uitsluitend de feeds die de NOS zelf openbaar aanbiedt op nos.nl/feeds.

---

English: unofficial reader for the public RSS feeds of NOS (the Dutch public broadcaster) on the Even G2. Browse headlines and read full articles in Dutch. Not affiliated with, endorsed, or supported by NOS.
```

## Tags

Primary (use these if the portal limits the count):

```
nieuws, news, dutch, netherlands, nos, rss, reader, headlines
```

Extra candidates if more are allowed: `nederland`, `krant`, `journaal`, `feeds`, `articles`.

## Submission notes

- Public release goes through **manual review** (see the platform guide §13).
- The name and icon reference NOS branding; the disclaimer above is prominent on purpose.
  Be prepared for the reviewer (or NOS) to request a rename — a fallback name that avoids
  the trademark while staying findable: **"Nieuwslezer voor NOS-feeds (onofficieel)"**.
- Bump `version` in `app.json` before packing the build you submit.
