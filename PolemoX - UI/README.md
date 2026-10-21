# PolemoX UI

Angular front-end for [PolemoX](../PoleMox/README.md) — a mock-money trading-battle platform.
Standalone components + signals, zoneless change detection, Tailwind CSS v4 for the dark
"trading-terminal" design system, `@stomp/stompjs` for the live leaderboard feed, and
`lightweight-charts` for the price chart in the trading terminal.

## Running

```bash
npm install
npm start          # http://localhost:4200 — expects the backend on http://localhost:8081
```

`src/environments/environment.ts` points at the backend's default local port; `environment.production.ts`
(swapped in automatically by `npm run build`, via `angular.json`'s `fileReplacements`) uses relative
`/api/v1` and `/ws` paths instead, for whatever origin actually serves the deployed build.

## Structure

- `core/` — everything cross-cutting: HTTP services (`auth`, `user`, `session`, `trading`, `price`),
  the live-data `realtime.service.ts` (one shared STOMP client, ref-counted, auto-resubscribing on
  reconnect), the JWT auth interceptor (attaches the bearer token, refreshes once on a 401 and
  retries), and the `authGuard`/`guestGuard` route guards.
- `shared/ui/` — small reusable pieces with real logic behind them: `level-badge` (XP progress
  ring), `countdown-bar` (the session-clock ticker rule used everywhere a battle's time matters),
  `status-badge`, `yield-value`. Everything else (buttons, cards, inputs) is plain Tailwind utility
  classes in the templates — not worth a wrapper component at this size.
- `layout/shell/` — the authenticated app chrome (sidebar + topbar) that every route under `/`
  renders inside; `/login` and `/register` are siblings outside it.
- `features/` — one folder per screen: `auth`, `dashboard`, `sessions` (create / detail, which
  itself adapts its layout to the session's PENDING/ACTIVE/COMPLETED/CANCELLED status, plus the
  `trading-terminal` sub-component used only while ACTIVE), `profile`.

## Design system

Tokens live in `src/styles.css` as a Tailwind v4 `@theme` block (so `bg-ink`, `text-brass`,
`bg-gain`, etc. are plain generated utilities, not arbitrary-value CSS-var lookups). Three
typefaces, each with one job: **Source Serif 4** for the handful of places that need real
presence (the auth screens, session results), **IBM Plex Sans** for all other UI text, **IBM Plex
Mono** — via the global `.num` class — for every number in the app: prices, quantities, yields,
XP, timestamps. No light theme; this is a deliberately dark, single-theme design.
