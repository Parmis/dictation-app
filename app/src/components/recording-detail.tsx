import { useState, useEffect } from "react";
import type { Recording } from "../types";

interface RecordingDetailProps {
  recording: Recording;
  onSave: (
    id: string,
    patch: { title?: string; text?: string },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onProcess: (id: string) => Promise<void>;
  onBack: () => void;
}

export function RecordingDetail({
  recording,
  onSave,
  onDelete,
  onProcess,
  onBack,
}: RecordingDetailProps) {
  const [title, setTitle] = useState(recording.title);
  const [text, setText] = useState(recording.text);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(recording.title);
    setText(recording.text);
    setConfirmingDelete(false);
  }, [recording]);

  const dirty = title !== recording.title || text !== recording.text;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(recording.id, { title, text });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      await onProcess(recording.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete(recording.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="screen recording-detail-screen">
      <div className="header">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h2>Recording</h2>
      </div>

      <input
        className="settings-input recording-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <textarea
        className="recording-text-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <div className="controls">
        <button
          className="btn-record"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className="btn-secondary"
          onClick={handleProcess}
          disabled={processing || saving || dirty}
          title={dirty ? "Save your changes first" : undefined}
        >
          {processing ? "Processing..." : "Process with AI"}
        </button>
        <button
          className={`btn-secondary${confirmingDelete ? " btn-danger" : ""}`}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting
            ? "Deleting..."
            : confirmingDelete
              ? "Confirm Delete"
              : "Delete"}
        </button>
      </div>
    </div>
  );
}
