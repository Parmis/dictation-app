import type { Recording } from "../types";

interface RecordingsListProps {
  recordings: Recording[];
  loading: boolean;
  onSelect: (recording: Recording) => void;
  onNew: () => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function RecordingsList({
  recordings,
  loading,
  onSelect,
  onNew,
}: RecordingsListProps) {
  return (
    <div className="screen recordings-screen">
      <div className="header">
        <h2>Recordings</h2>
        <div className="header-actions">
          <button className="btn-record" onClick={onNew}>
            New Recording
          </button>
        </div>
      </div>

      {loading && recordings.length === 0 ? (
        <p className="placeholder">Loading...</p>
      ) : recordings.length === 0 ? (
        <p className="placeholder">
          No recordings yet. Press Record to get started.
        </p>
      ) : (
        <div className="recordings-list">
          {recordings.map((recording) => (
            <button
              key={recording.id}
              className="recording-card"
              onClick={() => onSelect(recording)}
            >
              <div className="recording-card-title">
                {recording.title || "Untitled"}
              </div>
              <div className="recording-card-meta">
                {formatTimestamp(recording.createdAt)}
              </div>
              <div className="recording-card-preview">
                {recording.text.slice(0, 100)}
                {recording.text.length > 100 ? "…" : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
