import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "dictation-store-";

export function useStore<T>(key: string, defaultValue: T) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  const remove = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(defaultValue);
  }, [storageKey, defaultValue]);

  return [value, setValue, remove] as const;
}
