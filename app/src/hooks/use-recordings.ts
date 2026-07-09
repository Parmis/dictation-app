import { useState, useCallback } from "react";
import * as api from "../lib/api";
import type { Credentials, Recording } from "../types";

export function useRecordings(credentials: Credentials | null) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!credentials) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.listRecordings(credentials);
      setRecordings(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recordings",
      );
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  const update = useCallback(
    async (id: string, patch: Partial<Pick<Recording, "title" | "text">>) => {
      if (!credentials) return null;
      const updated = await api.updateRecording(credentials, id, patch);
      setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [credentials],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!credentials) return;
      await api.deleteRecording(credentials, id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    },
    [credentials],
  );

  return { recordings, loading, error, fetchAll, update, remove };
}
