# Roadmap

Remaining work, consolidated from the completed plans in [docs/plans/](docs/plans/).

## Core functionality

- [ ] **Real speech-to-text transcription** — the `/audio-stream` WebSocket currently returns a
      `"[transcription placeholder]"` string; wire up Azure OpenAI Whisper or an external ML
      endpoint (`AZURE_OPENAI_*` / `ML_BACKEND_URL` env vars already exist)

## Recordings

- [ ] Search / filter recordings
- [ ] Export recordings
- [ ] Tags or categories
- [ ] Sync across devices
- [ ] Revert / history for AI-processed text (processing currently overwrites the text in place)

## Production readiness

- [ ] CI/CD pipelines (test + release workflows)
- [ ] Production deployment (server Dockerfile, hosting)
- [ ] Code signing & notarization (macOS, Windows)
- [ ] Auto-updater (Ed25519 keypair, update endpoint)
- [ ] CSP updates for production domain
- [ ] Linux builds
- [ ] Structured logging
- [ ] Self-signup / user management UI

## Done

- [x] Standalone app scaffolding — Tauri app, Express server, PostgreSQL, auth, local dev environment
      ([plan](docs/plans/standalone-app-plan.md))
- [x] Recordings — auto-save on stop, list/detail screens, CRUD API
      ([plan](docs/plans/recordings-plan.md))
- [x] AI processing — `POST /api/v1/recordings/:id/process` + "Process with AI" button (OpenAI)
