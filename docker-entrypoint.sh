#!/bin/sh
set -e

# Run Prisma migrations (waits for DB via compose healthcheck)
npx prisma migrate deploy

# Start the app
exec node ./dist/server.js
