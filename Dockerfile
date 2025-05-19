# ─── build ───
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm i --frozen-lockfile && pnpm turbo run build

# ─── runtime ───
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "apps/api/dist/index.js"]
EXPOSE 3000 