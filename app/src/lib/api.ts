import { config } from "./config";

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
