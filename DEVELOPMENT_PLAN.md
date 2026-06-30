# Dictation App — Development Plan

## Current State

The skeleton is already in place:
- **Auth**: shortcode pairing, token-based, persisted via Tauri store
- **Recording UI**: start/stop button, live transcript display in React state
- **WebSocket**: audio streams to server; transcription is currently a placeholder
- **Server**: Express + PostgreSQL, 5 endpoints (auth, health, audio WS, finalize)

What's missing is everything after the transcript lands: saving recordings, listing them, and editing/deleting them.

---

## What We're Building

1. User presses **Record** → speaks → presses **Stop**
2. Session transcript is **saved automatically** as a recording (JSON in DB)
3. User sees a **recordings list** with all past sessions
4. Each recording can be **viewed**, **edited** (text), and **deleted**
5. (Future) A button sends the text to OpenAI for correction/formatting

---

## Phase 1 — Data Model

### 1a. TypeScript type (`app/src/types.ts`)

Add `Recording`:

```ts
export interface Recording {
  id: string;
  title: string;          // auto-generated from first ~6 words, editable
  text: string;
  createdAt: string;      // ISO timestamp
  updatedAt: string;
}
```

### 1b. Database migration (`server/migrations/`)

```sql
CREATE TABLE recordings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  text        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recordings_user_id ON recordings(user_id);
```

---

## Phase 2 — Backend API (`server/src/routes/recordings.ts`)

Five new endpoints, all protected by the existing auth middleware:

| Method   | Path                         | Action                            |
|----------|------------------------------|-----------------------------------|
| `GET`    | `/api/v1/recordings`         | List all recordings for the user  |
| `POST`   | `/api/v1/recordings`         | Create a recording (on stop)      |
| `GET`    | `/api/v1/recordings/:id`     | Get single recording              |
| `PUT`    | `/api/v1/recordings/:id`     | Update title or text              |
| `DELETE` | `/api/v1/recordings/:id`     | Delete a recording                |

### Request / Response shapes

**POST /api/v1/recordings**
```json
// request
{ "text": "...", "title": "First six words..." }

// response
{ "id": "uuid", "title": "...", "text": "...", "createdAt": "...", "updatedAt": "..." }
```

**GET /api/v1/recordings**
```json
[{ "id": "...", "title": "...", "text": "...", "createdAt": "...", "updatedAt": "..." }]
```
Ordered by `created_at DESC`.

### DB helper (`server/src/db/recordings.ts`)

```ts
createRecording(userId, title, text): Promise<Recording>
listRecordings(userId): Promise<Recording[]>
getRecording(userId, id): Promise<Recording | null>
updateRecording(userId, id, patch): Promise<Recording | null>
deleteRecording(userId, id): Promise<boolean>
```

---

## Phase 3 — Frontend: Save on Stop

Modify `use-audio-stream.ts` so that when `stop()` is called and there's a non-empty transcript, it POSTs to `/api/v1/recordings` automatically.

```ts
const stop = useCallback(async () => {
  audioRef.current?.stop();
  wsRef.current?.close();
  setRecording(false);
  setConnected(false);

  if (transcript.trim()) {
    const title = transcript.trim().split(/\s+/).slice(0, 6).join(' ');
    await api.post('/api/v1/recordings', { text: transcript, title });
    // trigger recordings list refresh
    onSaved?.();
  }
  setTranscript('');
}, [transcript]);
```

---

## Phase 4 — Frontend: Recordings List & Detail

### New components

**`RecordingsList`** (`app/src/components/recordings-list.tsx`)
- Shows all recordings as cards: title, timestamp, first ~100 chars of text
- "New Recording" button → switches back to dictation screen
- Click a card → opens `RecordingDetail`

**`RecordingDetail`** (`app/src/components/recording-detail.tsx`)
- Shows full text in an editable `<textarea>`
- Title is editable inline
- "Save" button → PUT to update
- "Delete" button (with confirmation) → DELETE, go back to list
- (Future) "Process with AI" button

### New hook (`app/src/hooks/use-recordings.ts`)

```ts
export function useRecordings(credentials: Credentials | null) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => { ... };
  const create = async (text: string, title: string) => { ... };
  const update = async (id: string, patch: Partial<Recording>) => { ... };
  const remove = async (id: string) => { ... };

  return { recordings, loading, fetchAll, create, update, remove };
}
```

### App screens

Add `"recordings"` and `"recording-detail"` to `AppScreen` type and wire them in `App.tsx`:

```
pairing → dictation ↔ recordings ↔ recording-detail
                    ↕
                 settings
```

**Navigation flow:**
- After stopping a recording → auto-navigate to `"recordings"` (list refreshes)
- From `"recordings"` → click card → `"recording-detail"`
- From `"recording-detail"` → back → `"recordings"`
- From `"recordings"` → "New Recording" → `"dictation"`

---

## Phase 5 — Future: OpenAI Integration

When ready to add AI formatting:

**Backend**: `POST /api/v1/recordings/:id/process`
- Reads the recording text
- Calls OpenAI Chat API with a prompt (correct grammar, add punctuation, format paragraphs)
- Updates the recording's text in place
- Returns the updated recording

**Frontend**: "Process with AI" button in `RecordingDetail`
- Disabled while processing, shows spinner
- On success, textarea updates with the formatted text (user can still edit or revert)

**Env var to add**: `OPENAI_API_KEY`

---

## Implementation Order

1. DB migration → `recordings` table
2. `server/src/db/recordings.ts` + `server/src/routes/recordings.ts`
3. Wire routes into `server/src/index.ts`
4. `app/src/hooks/use-recordings.ts`
5. Auto-save in `use-audio-stream.ts` on stop
6. `RecordingsList` component
7. `RecordingDetail` component
8. Update `App.tsx` — new screens + navigation
9. Update `types.ts` — `Recording` type + new `AppScreen` values

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `server/migrations/<timestamp>_create_recordings.sql` | **Create** |
| `server/src/db/recordings.ts` | **Create** |
| `server/src/routes/recordings.ts` | **Create** |
| `server/src/index.ts` | **Modify** — mount recordings router |
| `app/src/types.ts` | **Modify** — add `Recording`, update `AppScreen` |
| `app/src/hooks/use-recordings.ts` | **Create** |
| `app/src/hooks/use-audio-stream.ts` | **Modify** — auto-save on stop |
| `app/src/components/recordings-list.tsx` | **Create** |
| `app/src/components/recording-detail.tsx` | **Create** |
| `app/src/App.tsx` | **Modify** — new screens + navigation |

---

## Out of Scope (for now)

- Transcription (WebSocket audio → text) — server already has the placeholder, can integrate Azure/Whisper independently
- Search/filter recordings
- Export recordings
- Tags or categories
- Sync across devices
