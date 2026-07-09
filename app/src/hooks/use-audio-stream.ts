import { useState, useCallback, useRef } from "react";
import { DictationWebSocket } from "../lib/websocket";
import { AudioCapture } from "../lib/audio";
import { createRecording } from "../lib/api";
import type { Credentials, Recording } from "../types";

export function useAudioStream(
  credentials: Credentials | null,
  onSaved?: (recording: Recording) => void,
) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<DictationWebSocket | null>(null);
  const audioRef = useRef<AudioCapture | null>(null);
  const transcriptRef = useRef("");
  const credentialsRef = useRef(credentials);
  credentialsRef.current = credentials;

  const start = useCallback(
    async (deviceId?: string) => {
      if (!credentials) return;
      setError(null);

      try {
        const ws = new DictationWebSocket(
          (msg) => {
            if (msg.type === "transcript" && msg.text) {
              setTranscript((prev) => {
                const next = msg.isFinal ? prev + msg.text + " " : prev;
                transcriptRef.current = next;
                return next;
              });
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

  const stop = useCallback(async () => {
    audioRef.current?.stop();
    audioRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setRecording(false);
    setConnected(false);

    const finalTranscript = transcriptRef.current.trim();
    const creds = credentialsRef.current;

    if (finalTranscript && creds) {
      try {
        const title = finalTranscript.split(/\s+/).slice(0, 6).join(" ");
        const saved = await createRecording(creds, finalTranscript, title);
        onSaved?.(saved);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save recording",
        );
        // Keep the transcript so the user can copy it (or clear it manually)
        return;
      }
    }

    transcriptRef.current = "";
    setTranscript("");
  }, [onSaved]);

  const clearTranscript = useCallback(() => {
    transcriptRef.current = "";
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
