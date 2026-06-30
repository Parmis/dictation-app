import { useState, useEffect } from "react";

interface UpdateInfo {
  available: boolean;
  version: string;
}

export function useUpdateChecker() {
  const [update] = useState<UpdateInfo>({
    available: false,
    version: "",
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // TODO: Check for updates via Tauri updater API
    // For localhost dev, this is a no-op
  }, []);

  const dismiss = () => setDismissed(true);

  return {
    updateAvailable: update.available && !dismissed,
    updateVersion: update.version,
    dismiss,
    applyUpdate: () => {
      // TODO: Trigger Tauri update
    },
  };
}
