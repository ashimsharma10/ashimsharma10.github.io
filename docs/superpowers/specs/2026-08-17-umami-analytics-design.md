# Umami analytics alongside first-party visit counting

**Date:** 2026-08-17
**Status:** implemented

## Problem

Two things measure site traffic, and only one of them works.

The first-party path works: `components/VisitTracker.tsx` posts to the Worker's
`/track` on each route change, `handleTrack` writes a row to the `pageviews` D1
table, and `fetchVisits` aggregates it into `/ops/stats` for the Site visits
chart on the Observability tab. Built July 2026 in PR #85.

The other path never ran. The `tailwind-nextjs-starter-blog` template shipped a
Umami hook — `umamiWebsiteId: process.env.NEXT_UMAMI_ID` in
`data/siteMetadata.js`, `analytics.umami.is` allowed in the `next.config.js`
CSP, and pliny's `<Analytics>` rendered from `app/layout.tsx` — but
`NEXT_UMAMI_ID` was never set anywhere: not in `.env.example`, not in
`.env.local`, and not in the Pages build env. Umami has therefore collected
nothing — while the site still paid for the script tag on every page (see
"A bug this surfaced" below).

The counting the Worker does is deliberately coarse: pageviews and a
daily-rotating visitor hash, no cookies, no third party. It cannot answer where
a visitor came from, what they read next, or how long they stayed. That is what
Umami is for, and why both are worth having.

## Decision

Turn the Umami path on and link its dashboard from the Observability tab. Leave
the Worker counting exactly as it is.

Umami Cloud's **read API is Pro-only**, so pulling Umami's numbers into `/ops`
would cost money. A link out to the dashboard costs nothing and gives the full
breakdown, so `/ops` keeps rendering its own numbers and defers the detail.

## Changes

| File                          | Change                                                                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/siteMetadata.js`        | Spread the `umamiAnalytics` block in only when `NEXT_UMAMI_ID` is set, and add `src: process.env.NEXT_UMAMI_SRC` to it. Undefined `src` falls back to pliny's `analytics.umami.is` default, so the region host is configuration rather than a code edit. |
| `.env.example`                | Document `NEXT_UMAMI_ID`, `NEXT_UMAMI_SRC`, and `NEXT_PUBLIC_UMAMI_URL`, including why they are variables rather than secrets and why the ID stays unset locally.                                                                                        |
| `.github/workflows/pages.yml` | Pass all three to `npm run build` from `${{ vars.* }}`.                                                                                                                                                                                                  |
| `next.config.js`              | Allow `cloud.umami.is` in `script-src` next to the existing `analytics.umami.is`.                                                                                                                                                                        |
| `app/ops/page.tsx`            | Add a `UMAMI_URL` constant and a third entry in the Observability `tools` array, plus a line under the visits chart distinguishing the two sources.                                                                                                      |

## Configuration

Three GitHub Actions **variables** (Settings → Secrets and variables → Actions →
Variables), not secrets — the website ID and script host are embedded in the
built HTML and readable by anyone:

- `NEXT_UMAMI_ID` — the `data-website-id` from Umami's tracking snippet
- `NEXT_UMAMI_SRC` — the `src` from that same snippet, `https://cloud.umami.is/script.js` for this account's region
- `NEXT_PUBLIC_UMAMI_URL` — the dashboard URL the `/ops` card links to

`NEXT_UMAMI_ID` stays unset locally on purpose: no ID means no script, so
localhost traffic never lands in the dashboard.

### A bug this surfaced

pliny renders a script tag for whatever provider keys exist in `analytics`,
without checking that the provider is actually configured. Because the template
always included a `umamiAnalytics` block, every production build — including
every deploy to date — has loaded `https://analytics.umami.is/script.js` on
every page with no website ID attached: a third-party request that collected
nothing for anyone. Making the block conditional on the ID removes it. A clean
build with the variables unset now contains no reference to Umami at all.

## The card is gated

The Langfuse and Cloudflare cards fall back to their vendor's top-level console
when unconfigured, which is a useful place to land. Umami has no equivalent —
an unconfigured build would link to a login screen — so the card renders only
when `NEXT_PUBLIC_UMAMI_URL` is set. Setting the variable makes it appear; no
code change involved. The same condition gates the explanatory line under the
visits chart, so an unconfigured build never references a tool it does not link
to.

`/ops` is public and the dashboard link is therefore public, but Umami requires
login, so it is a login wall for everyone else. If that is ever unwanted, Umami
can mint a read-only share URL to use instead — same variable, no code change.

## Verification

Both directions were checked with clean production builds (`rm -rf .next out`
first — see the caching note below):

- **Variables set:** `out/index.html` carries a preload for
  `https://cloud.umami.is/script.js` and an RSC payload entry with that `src`
  plus the `data-website-id`, confirming that both the ID and the region
  override reached `next/script`. The `/ops` bundle contains the dashboard href.
- **Variables unset:** zero occurrences of `umami` in `out/index.html`, and no
  dashboard href in the `/ops` bundle.

Two things that made earlier checks misleading, worth knowing before re-running
them:

- **`.next/cache` survives env changes.** A rebuild after changing only an env
  var reused the previously prerendered payload and reported the old value. The
  Pages workflow keys its cache on file hashes, not env, so a build that changes
  only a repo variable can serve a stale page — clear the Actions cache if that
  ever happens. This PR changes `.js`/`.tsx` files, so its own deploy builds
  fresh.
- **Grepping for the card copy proves nothing.** The card lives behind a runtime
  ternary, so its strings stay in the bundle either way. The dashboard href is
  the honest signal: it is inlined only when the variable is set.

`/ops` is token-gated, so the card was verified in the built bundle rather than
through the rendered page.

Still to check after deploy: load the live site, confirm the Umami script loads
and its collect request returns 200, and confirm the hit lands in the dashboard.
