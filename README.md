## Introduction
This project is a WIP.
Think Twice is a self hosted software and its objective is to solve compulsive shopping.
The user adds the object he desires and sets a timer on it.
If by the end of that timer the user still wants that object, it means that he really wants it or needs it.

When the timer runs out a worker sends a notification, over web push and
optionally Telegram, asking whether the object is still wanted.

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

Production — app on <http://localhost:3000>:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

This one runs `drizzle-kit migrate` (not `push`), so the tracked migrations in
`drizzle/` are the source of truth.

Postgres only, to run the app on the host instead:

```bash
docker compose up -d postgres
npx drizzle-kit push
npm run dev            # http://localhost:3000
```

That path needs `DATABASE_URL` pointing at `localhost`, since the `postgres`
hostname only resolves inside the Compose network.

## Tests

```bash
npm test               # every *.test.ts under tests/ and src/
npx tsc --noEmit
npm run lint
```

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

**Pages are `force-dynamic`.** A database query is not something Next treats as
a reason to render dynamically, so without it the object list and the settings
get prerendered at build time and keep serving whatever the database held then.

**Settings live in two places on purpose.** Theme is in `localStorage`, because
reading it from the server would flash the wrong one on every load. Locale and
currency are in the database, because prices and dates are formatted during SSR
too and a browser-only value would hydrate against different markup.

**Formatting takes locale and currency as arguments.** Never an ambient default:
an implicit locale resolves differently in Node and in the browser.
