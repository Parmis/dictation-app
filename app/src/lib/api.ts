import { config } from "./config";
import type { Credentials, Recording } from "../types";

async function apiFetch(
  path: string,
  credentials: Credentials,
  init: RequestInit = {},
) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.token}`,
      "x-organization": credentials.organization,
      "x-user-id": credentials.userId,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function listRecordings(
  credentials: Credentials,
): Promise<Recording[]> {
  return apiFetch("/recordings", credentials);
}

export async function createRecording(
  credentials: Credentials,
  text: string,
  title: string,
): Promise<Recording> {
  return apiFetch("/recordings", credentials, {
    method: "POST",
    body: JSON.stringify({ text, title }),
  });
}

export async function updateRecording(
  credentials: Credentials,
  id: string,
  patch: Partial<Pick<Recording, "title" | "text">>,
): Promise<Recording> {
  return apiFetch(`/recordings/${id}`, credentials, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function processRecording(
  credentials: Credentials,
  id: string,
): Promise<Recording> {
  return apiFetch(`/recordings/${id}/process`, credentials, {
    method: "POST",
  });
}

export async function deleteRecording(
  credentials: Credentials,
  id: string,
): Promise<void> {
  await apiFetch(`/recordings/${id}`, credentials, { method: "DELETE" });
}

export async function pairShortcode(shortcode: string) {
  const res = await fetch(`${config.apiUrl}/shortcode/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shortcode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Pairing failed" }));
    throw new Error(err.error || "Pairing failed");
  }

  return res.json() as Promise<{
    user_id: string;
    organization: string;
    organization_token: string;
    email: string;
  }>;
}

export async function validateCredentials(credentials: {
  token: string;
  organization: string;
  userId: string;
}): Promise<boolean> {
  const res = await fetch(`${config.backendUrl}/me`, {
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      "x-organization": credentials.organization,
      "x-user-id": credentials.userId,
    },
  });
  return res.ok;
}
