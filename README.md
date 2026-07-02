# NOS Nieuws voor Even G2

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

## Build & install

```bash
npm install
npm run typecheck          # tsc --noEmit
npm run pack               # → NOSNieuws.ehpk (single-file build + evenhub pack)
```

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
