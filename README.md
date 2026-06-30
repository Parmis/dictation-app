# Dictation App

A desktop dictation app built with Tauri v2 (React + Rust) and a lightweight Node.js backend.

- App to convert speech to text.

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

## Testing Locally

### Try it in the browser (fastest, no Rust/Tauri needed)

1. Start Postgres + server: `./scripts/dev.sh` (prints a shortcode).
2. In another terminal: `cd app && npm run dev`, then open `http://localhost:1420`.
3. Pair with the printed shortcode, press Record, speak, press Stop.
4. The transcript auto-saves as a recording and you're taken to the Recordings list, where you can open, edit, and delete it.

Note: the WebSocket transcription is currently a placeholder — recording will capture a `"[transcription placeholder]"` string instead of real speech-to-text until Azure/Whisper is wired up.

### Test the API directly with curl

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Pair with a shortcode (from `npm run seed` or `npm run shortcode:create`)
curl -X POST http://localhost:3000/api/v1/shortcode/pair \
  -H "Content-Type: application/json" \
  -d '{"shortcode": "YOUR_SHORTCODE"}'
# => { "user_id": "...", "organization": "...", "organization_token": "...", "email": "..." }

# Save these as env vars for convenience
export TOKEN=<organization_token>
export ORG=<organization>
export USER_ID=<user_id>
AUTH=(-H "Authorization: Bearer $TOKEN" -H "x-organization: $ORG" -H "x-user-id: $USER_ID")

# 3. Create a recording
curl -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "title": ""}' \
  http://localhost:3000/api/v1/recordings

# 4. List recordings
curl "${AUTH[@]}" http://localhost:3000/api/v1/recordings

# 5. Get / update / delete a single recording
curl "${AUTH[@]}" http://localhost:3000/api/v1/recordings/<id>
curl -X PUT "${AUTH[@]}" -H "Content-Type: application/json" -d '{"title": "New title"}' http://localhost:3000/api/v1/recordings/<id>
curl -X DELETE "${AUTH[@]}" http://localhost:3000/api/v1/recordings/<id>
```

### Running tests

```bash
cd server && npm test
cd app && npm test
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

| Method   | Path                      | Description                |
| -------- | ------------------------- | --------------------------- |
| `POST`   | `/api/v1/shortcode/pair`  | Pair with a shortcode      |
| `GET`    | `/me`                     | Validate credentials       |
| `GET`    | `/health`                 | Health check                |
| `WSS`    | `/audio-stream`           | WebSocket audio streaming   |
| `GET`    | `/api/v1/recordings`      | List recordings             |
| `POST`   | `/api/v1/recordings`      | Create a recording          |
| `GET`    | `/api/v1/recordings/:id`  | Get a single recording      |
| `PUT`    | `/api/v1/recordings/:id`  | Update a recording          |
| `DELETE` | `/api/v1/recordings/:id`  | Delete a recording          |

All `/api/v1/recordings` routes require auth headers (see Testing Locally below).

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
