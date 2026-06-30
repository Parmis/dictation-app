import { useState, useEffect } from "react";

export function useAudioDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>();

  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first to get labeled devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === "audioinput"));
      } catch {
        // Permission denied or no mic
      }
    }

    loadDevices();

    // Re-enumerate when devices change
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dictation-audio-device");
    if (saved) setSelectedDevice(saved);
  }, []);

  const selectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId || undefined);
    if (deviceId) {
      localStorage.setItem("dictation-audio-device", deviceId);
    } else {
      localStorage.removeItem("dictation-audio-device");
    }
  };

  return { devices, selectedDevice, selectDevice };
}
