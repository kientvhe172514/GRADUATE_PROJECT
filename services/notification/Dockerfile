# Multi-stage build for notification Service (pnpm workspace)

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
COPY services/notification ./services/notification

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared-common first
RUN pnpm --filter @graduate-project/shared-common build

# Build notification service
RUN pnpm --filter notification build

# Stage 2: Production - Run
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for workspace
COPY services/shared-common/package.json ./services/shared-common/
COPY services/notification/package.json ./services/notification/

# Install ALL dependencies (including shared-common's dependencies)
# Note: We need full dependencies because compiled code references them at runtime
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/services/shared-common/dist ./services/shared-common/dist
COPY --from=builder /app/services/notification/dist ./services/notification/dist

# Set working directory to service
WORKDIR /app/services/notification

# Create non-root user
USER node

EXPOSE 3005

CMD ["node", "dist/main"]
