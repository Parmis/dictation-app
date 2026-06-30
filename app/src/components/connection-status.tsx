interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
      <span className="status-dot" />
      <span className="status-text">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
