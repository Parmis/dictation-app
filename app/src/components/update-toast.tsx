interface UpdateToastProps {
  version: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateToast({ version, onUpdate, onDismiss }: UpdateToastProps) {
  return (
    <div className="update-toast">
      <p>Version {version} is available</p>
      <div className="update-actions">
        <button className="btn-record" onClick={onUpdate}>
          Update
        </button>
        <button className="btn-secondary" onClick={onDismiss}>
          Later
        </button>
      </div>
    </div>
  );
}
