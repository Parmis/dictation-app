# Dictation App — Standalone Plan

> **Status: ✅ Completed (2026).** This is the original scaffolding plan, kept as a historical
> reference. The code is the source of truth; some details below have drifted:
>
> - `POST /api/v1/dictation/finalize` (item 8) was never built — it was superseded by the
>   recordings API (`POST /api/v1/recordings`, see [recordings-plan.md](recordings-plan.md)).
> - PostgreSQL is exposed on host port **5433** (not 5432) in `docker-compose.yml`.
> - `scripts/dev.sh` has outgrown the sketch in item 14 (waits for `pg_isready`, creates
>   `.env` automatically, does not launch the Tauri app itself).
> - Real speech-to-text transcription over the WebSocket is still a placeholder.
>
> For current setup see the [README](../../README.md); for remaining work see the [roadmap](../../ROADMAP.md).

## Phase Status

- [x] Phase 1 — Project scaffolding (Tauri app + server)
- [x] Phase 2 — Backend endpoints (pair, /me, health, audio WS; finalize superseded by recordings API)
- [x] Phase 3 — Database schema & migrations, seed script
- [x] Phase 4 — Local development environment (docker-compose, .env, dev.sh)
- [x] Phase 5 — Frontend configuration (config.ts, tauri.conf.json)
- [x] Phase 6 — Admin tooling (shortcode CLI + API)
- [x] Phase 7 — Testing (app + server Vitest suites)
- [ ] Deferred (post-localhost) items — tracked in [ROADMAP.md](../../ROADMAP.md)

A fully independent dictation desktop app with its own backend, database, and auth. Built with Tauri v2 (React frontend + Rust shell) and a lightweight Node.js backend. This plan focuses on getting everything running on localhost first.

---

## Repository Structure

```
dictation-app/
├── app/                    # Tauri + React desktop app
│   ├── src/                # React frontend
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks
│   │   ├── lib/            # API client, WebSocket, audio, config
│   │   ├── locales/        # i18n (en.json)
│   │   └── types.ts
│   ├── src-tauri/          # Rust backend (window mgmt, hotkeys, platform)
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── main.rs
│   │   │   └── platform/   # macOS, Windows, fallback
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── tests/              # Vitest unit tests
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── tsconfig.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Express server entry
│   │   ├── routes/
│   │   │   ├── auth.ts     # POST /api/v1/shortcode/pair, GET /me
│   │   │   ├── health.ts   # GET /health
│   │   │   └── audio.ts    # WSS /audio-stream
│   │   ├── db/
│   │   │   ├── pool.ts     # pg Pool
│   │   │   ├── shortcode.ts
│   │   │   └── tokens.ts
│   │   ├── middleware/
│   │   │   └── auth.ts     # Token validation middleware
│   │   └── config.ts       # Env vars
│   ├── migrations/         # node-pg-migrate SQL files
│   ├── scripts/
│   │   └── seed.ts         # Dev seed data
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml      # PostgreSQL for local dev
├── .env.example
├── scripts/
│   └── dev.sh              # One-command local startup
└── README.md
```

---

## Phase 1: Project Scaffolding

1. **Initialize repository** with the structure above
2. **Set up `app/`** — Tauri v2 + React + Vite + TypeScript
   - Components: pairing screen, dictation window, floating bubble, settings, action bar, title bar, connection status, transcript display, voice bars, update toast, icons
   - Hooks: `use-auth`, `use-audio-stream`, `use-audio-devices`, `use-hotkey`, `use-settings`, `use-store`, `use-update-checker`
   - Lib: `api.ts` (HTTP client), `websocket.ts` (WS client), `audio.ts` (mic capture), `config.ts` (env-aware URLs)
   - Tauri: window management, system tray, global hotkeys, platform-specific clipboard/accessibility (macOS, Windows)
3. **Set up `server/`** — Express + TypeScript + tsx

---

## Phase 2: Backend (Node.js/Express)

Implement 5 endpoints the app needs:

### 4. `POST /api/v1/shortcode/pair`

- Takes `{ shortcode }` body
- Looks up shortcode in DB (must be unused + not expired)
- Returns `{ user_id, organization, organization_token, email }`
- Marks shortcode as used (one-time)
- Rate limit: 10 attempts/minute per IP

### 5. `GET /me`

- Reads `Authorization: Bearer <token>`, `x-organization`, `x-user-id` headers
- Validates token against `organization_tokens` table
- Returns 200 with user info / 401

### 6. `GET /health`

- Returns `{ status: "ok" }`

### 7. `WSS /audio-stream`

- Auth handshake: client sends credentials as first message
- Receives binary PCM audio chunks from client
- Sends audio to transcription service (configurable — Azure OpenAI Whisper or external ML endpoint)
- Returns transcript JSON back to client
- Graceful error handling when transcription service is down

### 8. `POST /api/v1/dictation/finalize`

- Called when dictation session ends
- Receives final transcript and session metadata
- Stores/processes the completed dictation

### Backend dependencies

`express`, `ws`, `pg`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `typescript`, `tsx`, `vitest`

---

## Phase 3: Database Schema & Migrations

### 9. PostgreSQL schema (4 tables)

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE organization_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token_hash TEXT NOT NULL,  -- SHA-256 hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE shortcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,  -- 10-char random code
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  token_id UUID NOT NULL REFERENCES organization_tokens(id),
  used_at TIMESTAMPTZ,        -- NULL = unused, timestamp = when paired
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_shortcodes_code ON shortcodes(code);
```

Tooling: `node-pg-migrate`

### 10. Seed script (`server/scripts/seed.ts`)

- Creates default org, user, token, and a test shortcode
- Prints shortcode to console for immediate use in development

---

## Phase 4: Local Development Environment

### 11. `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: dictation
      POSTGRES_USER: dictation
      POSTGRES_PASSWORD: dictation
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 12. `.env.example`

```env
# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=dictation
PGUSER=dictation
PGPASSWORD=dictation

# Server
PORT=3000

# Transcription (Option A: Azure OpenAI)
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=whisper

# Transcription (Option B: External ML endpoint)
ML_BACKEND_URL=

# Admin
ADMIN_API_KEY=dev-admin-key
```

### 13. Server scripts (in `server/package.json`)

- `dev` — `tsx watch src/index.ts`
- `build` — `tsc`
- `migrate:up` — `node-pg-migrate up`
- `migrate:create` — `node-pg-migrate create`
- `seed` — `tsx scripts/seed.ts`
- `test` — `vitest`

### 14. Root dev startup script (`scripts/dev.sh`)

```sh
#!/bin/bash
set -e

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }

# Start PostgreSQL
docker compose up -d db
sleep 2

# Install deps + migrate + seed
cd server && npm install && npm run migrate:up && npm run seed && cd ..
cd app && npm install && cd ..

# Start server (background) + Tauri dev
cd server && npm run dev &
cd app && npm run tauri dev
```

---

## Phase 5: Frontend Configuration

### 15. `app/src/lib/config.ts`

- `VITE_BACKEND_URL` env var — defaults to `http://localhost:3000` in dev
- All API/WebSocket URLs derived from this single base URL
- WebSocket URL: auto-derive `ws://` from `http://` base

### 16. `app/src-tauri/tauri.conf.json`

- CSP allows `localhost:3000` for dev
- Bundle identifier: own identifier (not tied to any other product)
- Window config: main window + floating bubble

---

## Phase 6: Admin Tooling (Shortcode Generation)

### 17. Admin CLI for generating shortcodes

```sh
# Create a shortcode for a user
cd server && npm run shortcode:create -- --email user@example.com

# Or via API (protected by ADMIN_API_KEY)
curl -X POST http://localhost:3000/api/admin/shortcodes \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

- Creates user + org if they don't exist
- Returns the shortcode to enter in the desktop app

---

## Phase 7: Testing

### 18. App tests (Vitest)

- Unit tests for hooks: `use-auth`, `use-audio-stream`, etc.
- Unit tests for lib: `websocket`, `audio`, `api`, `config`
- All tests mock Tauri APIs — no native runtime needed

### 19. Server tests (Vitest)

- Shortcode pairing (valid, expired, already-used, invalid)
- Token validation (valid, invalid, revoked)
- Health check
- WebSocket auth handshake
- Rate limiting on pair endpoint

### 20. Manual verification checklist

1. `scripts/dev.sh` → app opens
2. Enter seeded shortcode → pairing succeeds
3. Click record → mic captures audio → transcript appears
4. Hotkey toggle works
5. Settings persist across restarts

---

## Decisions

- **Fully standalone** — own backend, database, auth. No external service dependencies except transcription
- **Node.js backend** — the 5 endpoints are simple HTTP/WebSocket; no heavy framework needed
- **PostgreSQL** — 4-table schema, simple and proven
- **No Redis** — no sessions needed; WebSocket state is in-memory
- **Tauri v2** — desktop shell with React webview
- **Plain CSS** — no component library
- **Localhost first** — deployment, CI/CD, code signing, auto-updater deferred until the app works end-to-end locally

---

## Deferred (Post-Localhost)

These will be added once the app is fully functional on localhost:

- CI/CD pipelines (test + release workflows)
- Production deployment (server Dockerfile, hosting)
- Code signing & notarization (macOS, Windows)
- Auto-updater (Ed25519 keypair, update endpoint)
- CSP updates for production domain
- Linux builds
- Structured logging
- Self-signup / user management UI
