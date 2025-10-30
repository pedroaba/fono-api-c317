# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache openssl \
    && npm install -g pnpm \
    && pnpm install --frozen-lockfile

# Copy Prisma schema and generate client early for better layer caching
COPY prisma ./prisma
RUN pnpm exec prisma generate

# Copy the rest of the source and build
COPY . .
RUN pnpm run build

# Prisma needs access to node_modules
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=1

EXPOSE 3000

# Entrypoint script will run migrations and start the app
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
