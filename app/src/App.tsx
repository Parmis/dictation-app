import { useState, useCallback } from "react";
import { useAuth } from "./hooks/use-auth";
import { useAudioStream } from "./hooks/use-audio-stream";
import { useAudioDevices } from "./hooks/use-audio-devices";
import { useHotkey } from "./hooks/use-hotkey";
import { useRecordings } from "./hooks/use-recordings";
import { PairingScreen } from "./components/pairing-screen";
import { DictationWindow } from "./components/dictation-window";
import { SettingsScreen } from "./components/settings-screen";
import { RecordingsList } from "./components/recordings-list";
import { RecordingDetail } from "./components/recording-detail";
import type { AppScreen, Recording } from "./types";
import "./App.css";

function App() {
  const [screen, setScreen] = useState<AppScreen>("dictation");
  const [selectedRecording, setSelectedRecording] =
    useState<Recording | null>(null);
  const { credentials, loading, error, pair, logout } = useAuth();
  const { devices, selectedDevice, selectDevice } = useAudioDevices();
  const {
    recordings,
    loading: recordingsLoading,
    fetchAll,
    update,
    remove,
  } = useRecordings(credentials);

  const openRecordings = useCallback(() => {
    setScreen("recordings");
    fetchAll();
  }, [fetchAll]);

  const {
    recording,
    transcript,
    connected,
    error: streamError,
    start,
    stop,
    clearTranscript,
  } = useAudioStream(credentials, openRecordings);

  const toggleRecording = useCallback(() => {
    if (recording) {
      stop();
    } else {
      start(selectedDevice);
    }
  }, [recording, stop, start, selectedDevice]);

  useHotkey("F2", toggleRecording);

  if (!credentials) {
    return <PairingScreen onPair={pair} loading={loading} error={error} />;
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        audioDevices={devices}
        selectedDevice={selectedDevice}
        onSelectDevice={selectDevice}
        onBack={() => setScreen("dictation")}
      />
    );
  }

  if (screen === "recordings") {
    return (
      <RecordingsList
        recordings={recordings}
        loading={recordingsLoading}
        onSelect={(rec) => {
          setSelectedRecording(rec);
          setScreen("recording-detail");
        }}
        onNew={() => setScreen("dictation")}
      />
    );
  }

  if (screen === "recording-detail" && selectedRecording) {
    return (
      <RecordingDetail
        recording={selectedRecording}
        onSave={async (id, patch) => {
          const updated = await update(id, patch);
          if (updated) setSelectedRecording(updated);
        }}
        onDelete={async (id) => {
          await remove(id);
          setSelectedRecording(null);
          setScreen("recordings");
        }}
        onBack={() => setScreen("recordings")}
      />
    );
  }

  return (
    <DictationWindow
      recording={recording}
      transcript={transcript}
      connected={connected}
      error={streamError}
      onStart={() => start(selectedDevice)}
      onStop={stop}
      onClear={clearTranscript}
      onLogout={logout}
      onSettings={() => setScreen("settings")}
      onRecordings={openRecordings}
    />
  );
}

export default App;
