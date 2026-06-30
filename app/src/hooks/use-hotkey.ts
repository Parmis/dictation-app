import { useEffect, useCallback } from "react";

export function useHotkey(key: string, callback: () => void) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === key) {
        e.preventDefault();
        callback();
      }
    },
    [key, callback]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
