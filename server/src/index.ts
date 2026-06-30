import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import { setupWebSocket } from "./routes/audio.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);

// POST /api/v1/dictation/finalize — placeholder
app.post("/api/v1/dictation/finalize", (_req, res) => {
  // TODO: Store final transcript + session metadata
  res.json({ status: "ok" });
});

const server = createServer(app);
setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
