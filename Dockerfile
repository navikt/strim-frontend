# syntax=docker/dockerfile:1.7

FROM node:lts-alpine AS builder

WORKDIR /app

# Auth for GitHub Packages (keep as you have)
RUN --mount=type=secret,id=NODE_AUTH_TOKEN sh -c \
  'npm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN)'
RUN npm config set @navikt:registry=https://npm.pkg.github.com

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm ci

ENV NEXT_TELEMETRY_DISABLED=1

# Copy config files (support either .ts/.js/.mjs for next.config)
# Wildcards are fine in Docker COPY.
COPY tsconfig.json tailwind.config.js postcss.config.js ./
COPY next.config.* ./ 

# IMPORTANT: copy the whole src tree (not just src/app) and public
COPY src ./src
COPY public ./public

# If you have other root files needed at build time (next-env.d.ts, .env*),
# add them too (or rely on COPY . . with a proper .dockerignore).
# COPY next-env.d.ts ./

RUN npm run build

# ---- Runtime ----
FROM gcr.io/distroless/nodejs22-debian12 AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Next "standalone" output lives in /app/.next/standalone
# Copy the server and the static assets
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

EXPOSE 3000

# The standalone output includes server.js at the root of /app (copied above)
CMD ["server.js"]
