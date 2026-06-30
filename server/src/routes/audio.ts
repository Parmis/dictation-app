import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { validateToken } from "../db/tokens.js";

interface AuthMessage {
  type: "auth";
  token: string;
  organization: string;
  userId: string;
}

interface TranscriptMessage {
  type: "transcript";
  text: string;
  isFinal: boolean;
}

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/audio-stream" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let authenticated = false;

    // Set auth timeout — client must authenticate within 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, "Authentication timeout");
      }
    }, 5000);

    ws.on("message", async (data: Buffer | string) => {
      // First message must be auth
      if (!authenticated) {
        try {
          const msg: AuthMessage = JSON.parse(data.toString());
          if (
            msg.type !== "auth" ||
            !msg.token ||
            !msg.organization ||
            !msg.userId
          ) {
            ws.close(4002, "Invalid auth message");
            return;
          }

          const valid = await validateToken(
            msg.token,
            msg.organization,
            msg.userId,
          );
          if (!valid) {
            ws.close(4003, "Authentication failed");
            return;
          }

          authenticated = true;
          clearTimeout(authTimeout);
          ws.send(JSON.stringify({ type: "auth", status: "ok" }));
        } catch {
          ws.close(4002, "Invalid auth message");
        }
        return;
      }

      // Authenticated — handle binary audio data
      if (Buffer.isBuffer(data)) {
        // TODO: Forward audio to transcription service
        // For now, echo back a placeholder transcript
        const response: TranscriptMessage = {
          type: "transcript",
          text: "[transcription placeholder]",
          isFinal: false,
        };
        ws.send(JSON.stringify(response));
      }
    });

    ws.on("close", () => {
      clearTimeout(authTimeout);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      clearTimeout(authTimeout);
    });
  });
}
