# ============================================================
# Stage 1: Install ALL dependencies (including devDependencies)
# ============================================================
FROM node:24-slim AS deps

WORKDIR /app

# better-sqlite3 requires native compilation tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

# ============================================================
# Stage 2: Build the application
# ============================================================
FROM deps AS build

WORKDIR /app

# Copy source + config files needed for build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Build NestJS (compiles to /app/dist)
RUN npm run build

# ============================================================
# Stage 3: Production image (lean)
# ============================================================
FROM node:24-slim AS production

WORKDIR /app

# Runtime native-module support for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install prod-only deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Re-generate Prisma client in the prod node_modules
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Create directories for runtime data
RUN mkdir -p /app/data /app/public

# Default env vars (override at runtime via .env / docker-compose)
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Run Prisma migrations then start the server
CMD ["sh", "-c", "npx prisma db push && node dist/main"]
