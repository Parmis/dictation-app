interface TitleBarProps {
  title?: string;
  onLogout: () => void;
}

export function TitleBar({ title = "Dictation", onLogout }: TitleBarProps) {
  return (
    <div className="title-bar" data-tauri-drag-region>
      <h2>{title}</h2>
      <div className="title-bar-actions">
        <button className="btn-icon" onClick={onLogout} title="Logout">
          ⏻
        </button>
      </div>
    </div>
  );
}
