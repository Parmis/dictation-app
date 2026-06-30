import { useAuth } from "./hooks/use-auth";
import { useAudioStream } from "./hooks/use-audio-stream";
import { PairingScreen } from "./components/pairing-screen";
import { DictationWindow } from "./components/dictation-window";
import "./App.css";

function App() {
  const { credentials, loading, error, pair, logout } = useAuth();
  const {
    recording,
    transcript,
    connected,
    error: streamError,
    start,
    stop,
    clearTranscript,
  } = useAudioStream(credentials);

  if (!credentials) {
    return <PairingScreen onPair={pair} loading={loading} error={error} />;
  }

  return (
    <DictationWindow
      recording={recording}
      transcript={transcript}
      connected={connected}
      error={streamError}
      onStart={() => start()}
      onStop={stop}
      onClear={clearTranscript}
      onLogout={logout}
    />
  );
}

export default App;
