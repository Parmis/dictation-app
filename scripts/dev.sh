#!/bin/bash
set -e

cd "$(dirname "$0")/.."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required. Install from https://docker.com"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required. Install from https://nodejs.org"; exit 1; }

echo "==> Starting PostgreSQL..."
docker compose up -d db
echo "==> Waiting for PostgreSQL to be ready..."
until docker compose exec db pg_isready -U dictation -q 2>/dev/null; do
  sleep 1
done

# Copy .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example"
fi

echo "==> Installing server dependencies..."
cd server && npm install

echo "==> Running migrations..."
npm run migrate:up

echo "==> Seeding database..."
npm run seed

echo "==> Starting server (background)..."
npm run dev &
SERVER_PID=$!
cd ..

echo "==> Installing app dependencies..."
cd app && npm install

echo ""
echo "=== Ready ==="
echo "Server: http://localhost:3000"
echo "App dev server will start on http://localhost:1420"
echo ""
echo "To start the Tauri app, run: cd app && npm run tauri dev"
echo "To stop the server: kill $SERVER_PID"
echo ""

# Keep the script running
wait $SERVER_PID
