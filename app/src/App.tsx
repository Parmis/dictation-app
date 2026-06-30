import { useState, useCallback } from "react";
import { useAuth } from "./hooks/use-auth";
import { useAudioStream } from "./hooks/use-audio-stream";
import { useAudioDevices } from "./hooks/use-audio-devices";
import { useHotkey } from "./hooks/use-hotkey";
import { PairingScreen } from "./components/pairing-screen";
import { DictationWindow } from "./components/dictation-window";
import { SettingsScreen } from "./components/settings-screen";
import type { AppScreen } from "./types";
import "./App.css";

function App() {
  const [screen, setScreen] = useState<AppScreen>("dictation");
  const { credentials, loading, error, pair, logout } = useAuth();
  const { devices, selectedDevice, selectDevice } = useAudioDevices();
  const {
    recording,
    transcript,
    connected,
    error: streamError,
    start,
    stop,
    clearTranscript,
  } = useAudioStream(credentials);

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
    />
  );
}

export default App;
