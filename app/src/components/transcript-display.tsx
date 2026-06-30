interface TranscriptDisplayProps {
  text: string;
  recording: boolean;
}

export function TranscriptDisplay({ text, recording }: TranscriptDisplayProps) {
  return (
    <div className="transcript-area">
      {text || (
        <span className="placeholder">
          {recording ? "Listening..." : "Press Record to start dictation"}
        </span>
      )}
    </div>
  );
}
