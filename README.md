# Dictation App

A desktop dictation app built with Tauri v2 (React + Rust) and a lightweight Node.js backend.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Rust](https://rustup.rs/) (for Tauri)

macOS additional: Xcode Command Line Tools (`xcode-select --install`)

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo-url> dictation-app
cd dictation-app

# 2. Copy environment config
cp .env.example .env

# 3. Start everything (PostgreSQL + server + install deps + migrate + seed)
./scripts/dev.sh

# 4. In a separate terminal, start the Tauri desktop app
cd app && npm run tauri dev
```

The dev script will print a **shortcode** — enter it in the app's pairing screen to authenticate.

## Manual Setup (Step by Step)

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

### 2. Set up the server

```bash
cd server
npm install
npm run migrate:up
npm run seed       # prints a shortcode to use
npm run dev        # starts on http://localhost:3000
```

### 3. Start the app

```bash
cd app
npm install
npm run tauri dev  # opens the desktop app
```

## Project Structure

```
dictation-app/
├── app/                 # Tauri + React desktop app
│   ├── src/             # React frontend (components, hooks, lib)
│   └── src-tauri/       # Rust backend (window mgmt, platform)
├── server/              # Node.js/Express backend
│   ├── src/             # Server code (routes, db, middleware)
│   ├── migrations/      # PostgreSQL migrations
│   └── scripts/         # Seed & admin scripts
├── docker-compose.yml   # PostgreSQL for local dev
├── .env.example         # Environment variables template
└── scripts/dev.sh       # One-command dev startup
```

## API Endpoints

| Method | Path                         | Description                |
| ------ | ---------------------------- | -------------------------- |
| `POST` | `/api/v1/shortcode/pair`     | Pair with a shortcode      |
| `GET`  | `/me`                        | Validate credentials       |
| `GET`  | `/health`                    | Health check               |
| `WSS`  | `/audio-stream`              | WebSocket audio streaming  |
| `POST` | `/api/v1/dictation/finalize` | Finalize dictation session |

## Creating Shortcodes

```bash
# Via CLI
cd server && npm run shortcode:create -- --email user@example.com

# Via API
curl -X POST http://localhost:3000/api/admin/shortcodes \
  -H "Authorization: Bearer dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## Environment Variables

See [.env.example](.env.example) for all available configuration. Key variables:

| Variable         | Default         | Description                          |
| ---------------- | --------------- | ------------------------------------ |
| `PORT`           | `3000`          | Server port                          |
| `PGHOST`         | `localhost`     | PostgreSQL host                      |
| `PGDATABASE`     | `dictation`     | Database name                        |
| `ML_BACKEND_URL` | —               | External transcription service URL   |
| `ADMIN_API_KEY`  | `dev-admin-key` | Admin API key for shortcode creation |

## Development

```bash
# Server
cd server
npm run dev          # Start with hot reload
npm test             # Run tests
npm run migrate:up   # Apply migrations

# App
cd app
npm run dev          # Vite dev server only (no Tauri)
npm run tauri dev    # Full Tauri desktop app
npm test             # Run tests
npm run type-check   # TypeScript check
```
