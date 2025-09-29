# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Define ARGs to receive values from docker-compose build args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_URL

# 2. Set the ARGs as ENVs so Next.js build (pnpm next build) can read them
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IMAGE_URL=$NEXT_PUBLIC_IMAGE_URL

# Install pnpm
RUN npm install -g pnpm

# Copy package files (for dependency install)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js app
RUN pnpm next build


# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only the necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules 

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IMAGE_URL=$NEXT_PUBLIC_IMAGE_URL

# Expose Next.js port
EXPOSE 3000

# Run production server
CMD ["pnpm", "start"]