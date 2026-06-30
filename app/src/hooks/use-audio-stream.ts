import { useState, useCallback, useRef } from "react";
import { DictationWebSocket } from "../lib/websocket";
import { AudioCapture } from "../lib/audio";
import type { Credentials } from "../types";

export function useAudioStream(credentials: Credentials | null) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<DictationWebSocket | null>(null);
  const audioRef = useRef<AudioCapture | null>(null);

  const start = useCallback(
    async (deviceId?: string) => {
      if (!credentials) return;
      setError(null);

      try {
        const ws = new DictationWebSocket(
          (msg) => {
            if (msg.type === "transcript" && msg.text) {
              setTranscript((prev) =>
                msg.isFinal ? prev + msg.text + " " : prev,
              );
            }
          },
          () => {
            setConnected(false);
            setRecording(false);
          },
        );

        await ws.connect(credentials);
        setConnected(true);
        wsRef.current = ws;

        const audio = new AudioCapture();
        await audio.start(deviceId, (data) => ws.sendAudio(data));
        audioRef.current = audio;
        setRecording(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start");
        stop();
      }
    },
    [credentials],
  );

  const stop = useCallback(() => {
    audioRef.current?.stop();
    audioRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setRecording(false);
    setConnected(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    recording,
    transcript,
    connected,
    error,
    start,
    stop,
    clearTranscript,
  };
}
