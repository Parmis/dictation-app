interface DictationWindowProps {
  recording: boolean;
  transcript: string;
  connected: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onLogout: () => void;
  onSettings: () => void;
  onRecordings: () => void;
}

export function DictationWindow({
  recording,
  transcript,
  connected,
  error,
  onStart,
  onStop,
  onClear,
  onLogout,
  onSettings,
  onRecordings,
}: DictationWindowProps) {
  return (
    <div className="screen dictation-screen">
      <div className="header">
        <h2>Dictation</h2>
        <div className="header-actions">
          <span
            className={`status ${connected ? "connected" : "disconnected"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
          <button className="btn-secondary" onClick={onRecordings}>
            Recordings
          </button>
          <button className="btn-icon" onClick={onSettings} title="Settings">
            ⚙
          </button>
          <button className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="transcript-area">
        {transcript || (
          <span className="placeholder">
            {recording ? "Listening..." : "Press Record to start dictation"}
          </span>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="controls">
        {recording ? (
          <button className="btn-record recording" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="btn-record" onClick={onStart}>
            Record
          </button>
        )}
        <button
          className="btn-secondary"
          onClick={onClear}
          disabled={!transcript}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
