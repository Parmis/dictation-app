# Dictation App

A desktop dictation app built with Tauri v2 (React + Rust) and a lightweight Node.js backend.

> **Current status:** the end-to-end flow (pairing, recording, saving, editing, AI processing)
> works, but real speech-to-text is not wired up yet — the WebSocket transcription returns a
> `"[transcription placeholder]"` string until Azure/Whisper is integrated.
> See [ROADMAP.md](ROADMAP.md) for planned work and [docs/plans/](docs/plans/) for completed plans.

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

# 2. Start everything (PostgreSQL + server + install deps + migrate + seed)
#    Creates .env from .env.example automatically if missing
./scripts/dev.sh

# 3. In a separate terminal, start the Tauri desktop app
cd app && npm run tauri dev
```

The dev script will print a **shortcode** — enter it in the app's pairing screen to authenticate.

Ctrl-C stops the server; PostgreSQL keeps running in Docker (`docker compose stop db` to stop it).
To reset the database completely: `docker compose down -v`.

## Manual Setup (Step by Step)

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

### 2. Set up the server

```bash
cp .env.example .env
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
4. The transcript auto-saves as a recording and you're taken to the Recordings list, where you can open, edit, delete, and process it with AI.

### Test the API directly with curl

The `AUTH=(...)` array syntax below requires bash or zsh.

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

# 6. Process a recording with AI (requires OPENAI_API_KEY in .env)
curl -X POST "${AUTH[@]}" http://localhost:3000/api/v1/recordings/<id>/process
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
│   ├── src/             # Server code (routes, db, middleware, services)
│   ├── migrations/      # PostgreSQL migrations
│   └── scripts/         # Seed & admin scripts
├── docs/plans/          # Completed planning documents (historical)
├── docker-compose.yml   # PostgreSQL for local dev
├── .env.example         # Environment variables template
├── ROADMAP.md           # Planned / remaining work
└── scripts/dev.sh       # One-command dev startup
```

## API Endpoints

| Method   | Path                              | Auth        | Description                          |
| -------- | --------------------------------- | ----------- | ------------------------------------ |
| `POST`   | `/api/v1/shortcode/pair`          | —           | Pair with a shortcode                |
| `GET`    | `/me`                             | Headers     | Validate credentials                 |
| `GET`    | `/health`                         | —           | Health check                         |
| `WSS`    | `/audio-stream`                   | Handshake   | WebSocket audio streaming (transcription is a placeholder) |
| `GET`    | `/api/v1/recordings`              | Headers     | List recordings                      |
| `POST`   | `/api/v1/recordings`              | Headers     | Create a recording                   |
| `GET`    | `/api/v1/recordings/:id`          | Headers     | Get a single recording               |
| `PUT`    | `/api/v1/recordings/:id`          | Headers     | Update a recording                   |
| `POST`   | `/api/v1/recordings/:id/process`  | Headers     | Format the text with AI (OpenAI)     |
| `DELETE` | `/api/v1/recordings/:id`          | Headers     | Delete a recording                   |

"Headers" auth means `Authorization: Bearer <token>`, `x-organization`, and `x-user-id` (see
"Test the API directly with curl" above). The WebSocket authenticates via a credentials
handshake in the first message.

## AI Processing

`POST /api/v1/recordings/:id/process` sends the recording's text to the OpenAI Chat API to
correct grammar, add punctuation, and format paragraphs, then saves the result in place. In the
app it's the **Process with AI** button on the recording detail screen (save your edits first —
the button is disabled while there are unsaved changes).

Set `OPENAI_API_KEY` in `.env` to enable it; without a key the endpoint returns `503`. The model
defaults to `gpt-4o-mini` and can be changed with `OPENAI_MODEL`.

## Creating Shortcodes

```bash
# Via CLI
cd server && npm run shortcode:create -- --email user@example.com

# Via API (Bearer value is ADMIN_API_KEY, default: dev-admin-key)
curl -X POST http://localhost:3000/api/admin/shortcodes \
  -H "Authorization: Bearer dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## Environment Variables

See [.env.example](.env.example) for the full template.

| Variable            | Default         | Description                              |
| ------------------- | --------------- | ---------------------------------------- |
| `PORT`              | `3000`          | Server port                              |
| `PGHOST`            | `localhost`     | PostgreSQL host                          |
| `PGPORT`            | `5433`          | PostgreSQL port (docker-compose maps 5433 → 5432) |
| `PGDATABASE`        | `dictation`     | Database name                            |
| `PGUSER`            | `dictation`     | Database user                            |
| `PGPASSWORD`        | `dictation`     | Database password                        |
| `OPENAI_API_KEY`    | —               | Enables AI processing of recordings      |
| `OPENAI_MODEL`      | `gpt-4o-mini`   | OpenAI model for AI processing           |
| `AZURE_OPENAI_*`    | —               | Azure Whisper transcription (not wired up yet) |
| `ML_BACKEND_URL`    | —               | External transcription service URL       |
| `ADMIN_API_KEY`     | `dev-admin-key` | Admin API key for shortcode creation     |

App-side: `VITE_BACKEND_URL` (defaults to `http://localhost:3000`) sets the backend base URL;
the WebSocket URL is derived from it.

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

## Troubleshooting

- **Port 3000 already in use** — another process is on the server port; stop it or set `PORT` in `.env`.
- **Port 5433 already in use** — something else is bound to the Postgres host port; change the mapping in `docker-compose.yml` and `PGPORT` in `.env`.
- **`docker compose` fails / cannot connect to Docker** — make sure Docker Desktop is running.
- **Migrations fail with a connection error** — Postgres may not be ready yet; `./scripts/dev.sh` waits for it, but when running manually retry after `docker compose up -d db` finishes its healthcheck.
- **Pairing fails with an invalid/expired shortcode** — shortcodes are one-time use; generate a new one with `cd server && npm run seed` or `npm run shortcode:create`.
- **"AI processing is not configured"** — set `OPENAI_API_KEY` in `.env` and restart the server.
- **Start fresh** — `docker compose down -v` deletes the database volume; rerun `./scripts/dev.sh`.
