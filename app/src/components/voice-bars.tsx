interface VoiceBarsProps {
  active: boolean;
}

export function VoiceBars({ active }: VoiceBarsProps) {
  return (
    <div className={`voice-bars ${active ? "active" : ""}`}>
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
    </div>
  );
}
