import { useState, useCallback } from "react";
import { pairShortcode, validateCredentials } from "../lib/api";
import type { Credentials } from "../types";

const STORAGE_KEY = "dictation-credentials";

function loadCredentials(): Credentials | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Credentials;
  } catch {
    return null;
  }
}

function saveCredentials(creds: Credentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [credentials, setCredentials] = useState<Credentials | null>(
    loadCredentials,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = useCallback(async (shortcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await pairShortcode(shortcode);
      const creds: Credentials = {
        token: result.organization_token,
        organization: result.organization,
        userId: result.user_id,
        email: result.email,
      };
      saveCredentials(creds);
      setCredentials(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    if (!credentials) return false;
    try {
      return await validateCredentials(credentials);
    } catch {
      return false;
    }
  }, [credentials]);

  const logout = useCallback(() => {
    clearCredentials();
    setCredentials(null);
  }, []);

  return { credentials, loading, error, pair, validate, logout };
}
