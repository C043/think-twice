FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
EXPOSE 3000

CMD ["npm", "run", "dev"]
