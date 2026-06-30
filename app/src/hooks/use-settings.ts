import { useState, useEffect } from "react";

interface Settings {
  hotkey: string;
  audioDevice: string;
  language: string;
}

const DEFAULTS: Settings = {
  hotkey: "F2",
  audioDevice: "",
  language: "en",
};

const STORAGE_KEY = "dictation-settings";

function loadSettings(): Settings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}
