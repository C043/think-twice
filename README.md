## Introduction
This project is a WIP.
Think Twice is a self hosted software and its objective is to solve compulsive shopping.
The user adds the object he desires and sets a timer on it.
If by the end of that timer the user still wants that object, it means that he really wants it or needs it.

The waiting presets are one, two and three months; the day field next to them
takes any other number for the rare case where a shorter wait is genuinely what
you want.

When the timer runs out a worker sends a notification, over web push and
optionally Telegram, asking whether the object is still wanted. The job runs
once a minute from `instrumentation.ts`, inside the app process — there is no
second container to deploy.

## Stack

Next.js (App Router) · React · Tailwind v4 · Drizzle ORM · Postgres · node-cron
Tests run on `node:test` against [pglite](https://pglite.dev), so they need no
database of their own.

## Running it

Copy `.env.example` to `.env` and fill it in first. Compose reads the same file
to interpolate `${VARS}` in the yml, so it holds both application and
infrastructure values.

Development — app on <http://localhost:3001>, pgAdmin on <http://localhost:8080>:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The container runs `drizzle-kit push` and then `next dev`, with the working tree
bind-mounted for hot reload.

Production — app on <http://127.0.0.1:3000>:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

This one runs `drizzle-kit migrate` (not `push`), so the tracked migrations in
`drizzle/` are the source of truth. Migrations are the only thing that happens at
container start: `next build` is baked into the image, so a restart takes seconds
instead of the length of a rebuild.

Both published ports bind to loopback in production. Nothing but the host needs
to reach them, and the app has no authentication of its own — see Deploying.

Postgres only, to run the app on the host instead:

```bash
docker compose up -d postgres
npx drizzle-kit push
npm run dev            # http://localhost:3000
```

That path needs `DATABASE_URL` pointing at `localhost`, since the `postgres`
hostname only resolves inside the Compose network. If the machine already runs
something on 5432 the bind fails, so set `DB_PORT` in `.env` and use the same
number in `DATABASE_URL`. Only host-side tools like `drizzle-kit` and `psql`
ever use that published port; the containers reach the database over the Compose
network.

## Tests

```bash
npm test               # every *.test.ts under tests/ and src/
npx tsc --noEmit
npm run lint
```

## Icons

Every PWA icon, the apple-touch icon and `favicon.ico` are generated from the
vector master `think_twice.svg`. After changing it:

```bash
npm run icons
```

The master is a landscape wordmark on a transparent canvas, which is a poor
square icon on its own: launchers crop maskable icons to circles and squircles
and would clip the outer bars. The script sits the mark on a full-bleed indigo
plate and re-centres it per target, so nothing hand-edited belongs in
`public/icons/`.

## Opening it from a phone

Two separate things get in the way, and they fail in different ways.

**Cross-origin dev resources.** Reaching the dev server on a LAN or Tailscale
address serves the HTML but leaves `/_next/*` blocked, so the page never
hydrates: every button is inert, no countdown, progress bar stuck at zero. Add
the host to `ALLOWED_DEV_ORIGINS` in `.env`:

```
ALLOWED_DEV_ORIGINS=192.168.1.50,*.ts.net
```

**Secure context.** Service workers and the Push API do not exist on plain HTTP
anywhere except `localhost`. Over `http://` the install and notification buttons
hide themselves, by design, because the capability really is missing. Install
prompts and push therefore need HTTPS even for local testing — for example
through `tailscale serve`, which provides a real certificate:

```bash
sudo tailscale serve --bg --https=443 http://localhost:3001
```

That requires HTTPS certificates enabled for the tailnet, which is a separate
setting from MagicDNS, and exposes the app to your own devices only.

## Deploying

Behind `tailscale serve`, which terminates TLS with a real certificate and keeps
the app reachable by your own devices only. HTTPS is not optional: service
workers and the Push API do not exist without it, so install prompts and
notifications are dead over plain HTTP.

On the server, fill `.env` — no `ALLOWED_DEV_ORIGINS`, no `PGADMIN_*`, no
`NEXT_PUBLIC_APP_URL` (production derives it from `PROD_APP_URL`) — then:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
sudo tailscale serve --bg --https=443 http://127.0.0.1:3000
tailscale serve status
```

If 3000 is taken on that machine, set `APP_PORT` in `.env` and point `serve` at
the same number — the port inside the container is always 3000.

`serve` needs HTTPS certificates enabled for the tailnet, which is a setting
separate from MagicDNS. The first request over HTTPS is slow while the
certificate is issued.

**Never `tailscale funnel`.** That publishes to the internet, and anyone who
finds the URL can read, add and delete objects. `serve` is tailnet-only, which is
the only reason the missing authentication is acceptable.

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY`: the first is
inlined into the client bundle, the second signs on the server, and if they
diverge subscriptions are created and then rejected. Both that key and
`PROD_APP_URL` are build args, so changing either needs `up --build` rather than
a restart. The private key is never a build arg — build args stay readable in the
image history.

Backups. The `postgres_data` volume survives `docker compose down`, but not
`down -v`:

```bash
docker exec think_twice_db pg_dump -U postgres think_twice_db > tt-$(date +%F).sql
```

## Notes for the next person

**Timestamps are `timestamptz` everywhere, deliberately.** A bare `timestamp`
stores a wall clock with no offset. `created_at` comes from the database clock
and `review_at` from the application, and the waiting period is measured between
them — so with bare timestamps the two land on different scales whenever the
database session and the Node process disagree on a timezone, which is invisible
in the all-UTC containers and wrong the moment the app runs on a host in local
time. `tests/timestamps.test.ts` pins this down by forcing a non-UTC zone.

When drizzle-kit generates a timestamp type change it emits a bare
`SET DATA TYPE`, which reinterprets stored values in whatever the session
timezone happens to be. Migration `0004` adds the explicit
`USING ... AT TIME ZONE 'UTC'` by hand; keep doing that.

**The root layout is `force-dynamic`.** A database query is not something Next
treats as a reason to render dynamically, so without it the object list and the
settings get prerendered at build time and keep serving whatever the database
held then. The flag sits on the layout, once, because every page below it reads
live rows.

**Keeping iOS from zooming takes four separate things.** Each covers a case the
others do not, so removing any one of them brings the zoom back:

- `maximumScale: 1` and `userScalable: false` in the viewport export. Honoured
  by standalone iOS, ignored by iOS Safari proper.
- A 16px floor on every control (`input`, `select`, `textarea` in `globals.css`,
  and `fieldInput` in `ui/styles.ts`). Below that iOS zooms the viewport in when
  a control takes focus and never zooms back out. The rules are deliberately
  unlayered so they outrank any Tailwind `text-*` utility.
- `touch-action` in `globals.css`: `manipulation` on tappable elements drops
  double-tap-to-zoom, `pan-x pan-y` on `html` drops pinch on the engines that
  implement it through touch events.
- `ZoomGuard`, which preventDefaults Safari's non-standard `gesture*` events and
  multi-touch `touchmove`. Its listeners must stay non-passive: touch listeners
  are passive by default and a passive listener's preventDefault is ignored.

**Safe-area insets are on the header and both mains.** They read as zero with
`statusBarStyle: "default"`, which is the point — they are what keeps the layout
clear of the notch in landscape and what would save it if the status bar style
ever went translucent. `themeColor` has to match the `--background` tokens
exactly, or iOS tints the status bar strip a shade off the header.

**Settings live in two places on purpose.** Theme is in `localStorage`, because
reading it from the server would flash the wrong one on every load. Locale and
currency are in the database, because prices and dates are formatted during SSR
too and a browser-only value would hydrate against different markup.

**Formatting takes locale and currency as arguments.** Never an ambient default:
an implicit locale resolves differently in Node and in the browser.
