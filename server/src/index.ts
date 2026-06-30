import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import recordingsRouter from "./routes/recordings.js";
import { setupWebSocket } from "./routes/audio.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);
app.use(adminRouter);
app.use(recordingsRouter);

const server = createServer(app);
setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
