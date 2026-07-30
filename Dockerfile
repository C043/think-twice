FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Both files, and `ci` rather than `install`: with only package.json the lockfile
# is ignored and the server resolves its own versions, so what gets deployed is
# not what the tests ran against.
COPY package.json package-lock.json ./
RUN npm ci

# Development: source arrives through a bind mount, so nothing is copied and
# nothing is built here.
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build, baked into the image rather than run on every container
# start. `next build` inlines NEXT_PUBLIC_* into the client bundle, so those
# values have to exist at build time — hence the build args.
#
# Only values the browser receives anyway are passed this way. Build args end up
# readable in the image history, so VAPID_PRIVATE_KEY must never become one; it
# stays a runtime environment variable.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN npm run build

FROM base AS runner
WORKDIR /app
# node_modules keeps the dev dependencies: drizzle-kit runs the migrations at
# container start, which is the one step that cannot happen at image build time
# because it needs a reachable database.
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=builder /app/.next ./.next
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD ["npm", "run", "start"]
