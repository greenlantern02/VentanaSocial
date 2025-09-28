FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files first (for caching)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy rest of the front folder
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Run Next.js
CMD ["pnpm", "dev", "--port", "3000"]
