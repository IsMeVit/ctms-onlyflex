FROM node:22-slim AS base

# 1. Install dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    gcc \
    g++ \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy lockfiles AND the prisma schema first
COPY package.json package-lock.json ./
COPY prisma ./prisma/ 

# Install dependencies and generate Prisma Client immediately
# This ensures the client is baked into the 'deps' layer
RUN npm ci && npx prisma generate

# 2. Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/app/generated ./app/generated

# Copy env file for build (prisma.config.ts needs DATABASE_URL)
COPY .env.production .env.local

COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder if it exists
COPY --from=builder /app/public ./public

# Set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Leverage standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma schema, config, and migrations for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Copy generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

# Install prisma CLI for migrate deploy at runtime
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm install --no-save prisma
RUN chown -R nextjs:nodejs node_modules

# Copy entrypoint last
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
