import { config } from "./config";

type MessageHandler = (data: {
  type: string;
  text?: string;
  isFinal?: boolean;
  status?: string;
}) => void;

export class DictationWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: MessageHandler;
  private onClose: () => void;

  constructor(onMessage: MessageHandler, onClose: () => void) {
    this.onMessage = onMessage;
    this.onClose = onClose;
  }

  connect(credentials: {
    token: string;
    organization: string;
    userId: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${config.wsUrl}/audio-stream`);

      this.ws.onopen = () => {
        this.ws!.send(
          JSON.stringify({
            type: "auth",
            token: credentials.token,
            organization: credentials.organization,
            userId: credentials.userId,
          }),
        );
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "auth" && data.status === "ok") {
          resolve();
        }
        this.onMessage(data);
      };

      this.ws.onclose = () => {
        this.onClose();
      };

      this.ws.onerror = () => {
        reject(new Error("WebSocket connection failed"));
      };
    });
  }

  sendAudio(data: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}
