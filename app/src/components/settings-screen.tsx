import { useState } from "react";

interface SettingsScreenProps {
  audioDevices: MediaDeviceInfo[];
  selectedDevice: string | undefined;
  onSelectDevice: (deviceId: string) => void;
  onBack: () => void;
}

export function SettingsScreen({
  audioDevices,
  selectedDevice,
  onSelectDevice,
  onBack,
}: SettingsScreenProps) {
  const [hotkey, setHotkey] = useState("F2");

  return (
    <div className="screen settings-screen">
      <div className="settings-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h2>Settings</h2>
      </div>

      <div className="settings-section">
        <label>Microphone</label>
        <select
          value={selectedDevice || ""}
          onChange={(e) => onSelectDevice(e.target.value)}
        >
          <option value="">System default</option>
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <label>Hotkey</label>
        <input
          type="text"
          value={hotkey}
          onChange={(e) => setHotkey(e.target.value)}
          placeholder="e.g. F2, Ctrl+Shift+D"
          className="settings-input"
        />
        <p className="settings-hint">Press this key to toggle recording</p>
      </div>
    </div>
  );
}
