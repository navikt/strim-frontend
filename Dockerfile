# syntax=docker/dockerfile:1.7

FROM node:lts-alpine AS builder

WORKDIR /app

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    npm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN)
RUN npm config set @navikt:registry=https://npm.pkg.github.com


COPY package.json package-lock.json ./
RUN npm ci

ENV NEXT_TELEMETRY_DISABLED=1


COPY tsconfig.json tailwind.config.js postcss.config.js ./
COPY next.config.* ./ 

COPY src ./src
COPY public ./public

RUN npm run build

FROM gcr.io/distroless/nodejs22-debian12 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

EXPOSE 3000

CMD ["server.js"]
