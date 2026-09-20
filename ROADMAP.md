# Roadmap

Remaining work, consolidated from the completed plans in [docs/plans/](docs/plans/).

## Core functionality

- [ ] **Real speech-to-text transcription** — the `/audio-stream` WebSocket currently returns a
      `"[transcription placeholder]"` string; wire up Azure OpenAI Whisper or an external ML
      endpoint (`AZURE_OPENAI_*` / `ML_BACKEND_URL` env vars already exist).
      Note the placeholder is sent with `isFinal: false` and `use-audio-stream` only appends
      final chunks, so today the transcript stays empty and the auto-save on stop never fires —
      the whole record → save path is untested end to end.

## Unfinished app wiring

Code that exists but is not reachable from `App.tsx`:

- [ ] `FloatingBubble` — compact always-on-top recording indicator, never rendered
- [ ] `TitleBar` — custom window chrome, never rendered
- [ ] `UpdateToast` + `use-update-checker` — update prompt, never rendered (pairs with the
      auto-updater item below)
- [ ] `use-settings` / `use-store` — Tauri store persistence; settings (audio device) are
      currently in-memory only and reset on launch
- [ ] `use-hotkey` listens on `window` keydown, so `F2` only works while the app window has
      focus — a true system-wide hotkey needs the Tauri global-shortcut plugin
- [ ] `app`'s `npm run lint` script calls `eslint`, which is not in its devDependencies

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
- [x] Recordings — list/detail screens, CRUD API, auto-save on stop (code in place but blocked
      on real transcription — see above) ([plan](docs/plans/recordings-plan.md))
- [x] AI processing — `POST /api/v1/recordings/:id/process` + "Process with AI" button (OpenAI)
