const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const config = {
  backendUrl,
  wsUrl: backendUrl.replace(/^http/, "ws"),
  apiUrl: `${backendUrl}/api/v1`,
};
