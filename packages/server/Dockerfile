# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ---- Dependencies (full monorepo, needed for workspace linking) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
RUN npm ci --workspace=packages/shared --workspace=packages/server --include-workspace-root

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY packages/server packages/server
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

# ---- Production dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
RUN npm ci --workspace=packages/shared --workspace=packages/server --include-workspace-root --omit=dev

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
RUN npm install -g pm2

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/server/dist packages/server/dist
COPY packages/server/package.json packages/server/package.json
COPY packages/server/ecosystem.config.js packages/server/ecosystem.config.js

WORKDIR /app/packages/server
RUN addgroup -S nexuschat && adduser -S nexuschat -G nexuschat && \
    mkdir -p logs && chown -R nexuschat:nexuschat /app
USER nexuschat

EXPOSE 5000
ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "ecosystem.config.js"]
