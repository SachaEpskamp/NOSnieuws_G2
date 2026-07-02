# NOS Nieuws voor Even G2 (unofficial)

> **⚠️ Unofficial app — not affiliated with NOS.** This is a personal, unofficial reader for
> the public NOS RSS feeds. It is **not** made, endorsed, or supported by NOS (Nederlandse
> Omroep Stichting). All news content and the NOS name/branding belong to NOS. The app simply
> displays the publicly offered feeds from https://nos.nl/feeds and is intended for private,
> personal use.
>
> *Onofficiële app — niet gemaakt door, verbonden aan of ondersteund door de NOS.*

Browse and read Dutch NOS news on the Even Realities G2 smart glasses, via Even Hub.

- **Phone app**: pick which NOS RSS feeds to follow (checkboxes, persisted; the
  NOS Nieuws feeds are on by default), refresh manually, and preview the merged
  headline list. Feeds come from https://nos.nl/feeds.
- **Glasses app**: a headline list and a full-article reader (the NOS RSS
  `<description>` contains the complete article text). A selected headline that
  is too long to fit auto-scrolls (marquee) while the list is idle; articles
  render as one scrollable column with a blank line between paragraphs.

## Controls on the glasses

| Gesture | List view | Article view |
|---|---|---|
| slide | move the cursor through the headlines | scroll the text up / down |
| tap | open the selected article | back to the list |
| double tap | close the app | close the app |

If sliding feels inverted on your hardware, flip `INVERT_SCROLL` in
`src/config.ts` and rebuild.

## CORS note

`feeds.nos.nl` sends no `Access-Control-Allow-Origin` header, so a direct fetch
from the WebView is usually blocked. The app tries a direct fetch first and then
falls back through public CORS proxies (corsproxy.io → allorigins → codetabs);
the first strategy that works is remembered. All proxy origins are whitelisted in
`app.json`. If the proxies ever become unreliable, host a trivial proxy yourself
and add its origin to `STRATEGIES` in `src/model/newsModel.ts` + the whitelist.

## App icon

The Even Hub developer console asks for a **24×24, monochrome/grayscale icon** (color is
rejected; the accepted form is a white foreground on a dark background, legible, with both
foreground and background present — see the official App Submission & QA Guidelines and the
community tool [g2-icon-studio](https://github.com/naotake/g2-icon-studio)).

- **`icon/icon-24.png`** — the icon to submit: 24×24 pixel-art "NOS", white on black, true
  Gray colorspace, 21.5% ink coverage. Generated deterministically by
  `python3 icon/make_icon24.py` (stdlib only; also writes `icon-24-preview-x8.png` so you can
  judge legibility). Edit the letter rectangles in that script to change the design.
- **To include it:** the dev console's icon field only offers **"Create with a tool"**, which
  opens the built-in 24×24 pixel-grid editor — there is no PNG upload. Copy the design by hand:
  - `icon/icon-24-grid.png` — gridded reference (heavier lines every 4 cells) to draw from;
  - `icon/DRAW_INSTRUCTIONS.md` — exact per-row runs (e.g. "row 7: columns 1-2, 5-6, 10-13,
    18-22") plus an ASCII map. It's ~20 runs; with the editor's line/rect tools it takes a
    couple of minutes.
  - Alternatively open [g2-icon-studio](https://naotake.github.io/g2-icon-studio/) (fully
    client-side), drop `icon-24.png` in, and use its zoomed editor + previews as the drawing
    reference; it also runs the reject-avoidance checks (ink coverage, stray pixels, edge bleed).
- `icon/icon.svg` + `icon-1024/512/192.png` (the red NOS-style icons) are **decorative only**
  (GitHub, social preview) — they are color images and would be **rejected** by the Hub.

## Build & install

```bash
npm install
npm run typecheck          # tsc --noEmit
npm run pack               # → NOSNieuws.ehpk (single-file build + evenhub pack)
```

**Updating an installed build:** Even Hub identifies builds by the `version`
in `app.json` — uploading a new `.ehpk` with the *same* version is treated as
the already-installed app, and the glasses/phone keep the old copy (deleting
and re-adding the build doesn't help). **Bump `version` in `app.json` (and
`package.json`) before every `npm run pack` you intend to upload.** The
running version is shown in the phone UI header (`v1.1.0`), so you can confirm
an update actually landed. If the phone still shows a stale version right
after installing, uninstall the app in the phone app, force-close the Even
app, and install again.

Install as a **private build**:
1. Sign in at hub.evenrealities.com with your Even Realities phone-app account
   (restart the phone app once to unlock Developer Mode).
2. Dev portal → your project → Private builds → upload `NOSNieuws.ehpk`.
3. Phone app → Me → Apps → Private builds → Install.

For quick iteration without installing: `npm run qr` + `npm run dev`
(note: dev-QR mode does not enforce the network whitelist; always test the
installed build too).

## Testing in a plain browser

Open the built page in a normal browser (no Even bridge): storage falls back to
`localStorage`, and every screen that *would* be sent to the glasses is printed
to the console as `[GlassesView] (no bridge) would display: …`. A dev hook
`window.__nos` lets you drive the glasses UI from the console:

```js
__nos.display.onScroll('down')  // move cursor / next page
__nos.display.onTap()           // open article / back
__nos.refresh()                 // re-fetch feeds
```

The phone UI also has a "Debug-log tonen/verbergen" button that shows an
on-screen console overlay (useful on-device).
