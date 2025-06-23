#!/bin/sh
set -e

# Install Node.js dependencies
npm install
# Generate Prisma client
npx prisma generate
# Run database migrations
npx prisma migrate deploy
# Seed the database with initial data
npm run seed
# Start the development server
npm run dev