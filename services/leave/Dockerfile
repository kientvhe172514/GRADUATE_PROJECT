# Multi-stage build for leave Service (pnpm workspace)

# Stage 1: Builder - Install and build
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc* ./

# Copy all workspace packages
COPY services/shared-common ./services/shared-common
COPY services/leave ./services/leave

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared-common first
RUN pnpm --filter @graduate-project/shared-common build

# Build leave service
RUN pnpm --filter leave build

# Stage 2: Production - Run
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages
COPY services/shared-common/package.json ./services/shared-common/
COPY services/leave/package.json ./services/leave/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/services/shared-common/dist ./services/shared-common/dist
COPY --from=builder /app/services/leave/dist ./services/leave/dist

# Copy node_modules (CRITICAL FIX)
COPY --from=builder /app/node_modules ./node_modules

# Set working directory to service
WORKDIR /app/services/leave

# Create non-root user
USER node

EXPOSE 3004

CMD ["node", "dist/main"]
