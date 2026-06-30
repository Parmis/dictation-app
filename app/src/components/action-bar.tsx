interface ActionBarProps {
  recording: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

export function ActionBar({
  recording,
  transcript,
  onStart,
  onStop,
  onClear,
}: ActionBarProps) {
  return (
    <div className="action-bar">
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
  );
}
