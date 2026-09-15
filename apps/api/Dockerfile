FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json eslint.config.mjs ./
COPY apps/api apps/api
COPY domains domains
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @monoplate/api build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=build --chown=node:node /workspace/apps/api/dist/server.cjs ./server.cjs
COPY --from=build --chown=node:node /workspace/apps/api/dist/migrate.mjs ./migrate.mjs
COPY --from=build --chown=node:node /workspace/packages/database/migrations ./migrations
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health/live || exit 1
CMD ["node", "server.cjs"]
