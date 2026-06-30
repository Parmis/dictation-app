import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createRecording,
  listRecordings,
  getRecording,
  updateRecording,
  deleteRecording,
} from "../db/recordings.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const router = Router();

router.use("/api/v1/recordings", authMiddleware);

router.get("/api/v1/recordings", async (req, res) => {
  try {
    const userId = req.userId!;
    const recordings = await listRecordings(userId);
    res.json(recordings);
  } catch (err) {
    console.error("List recordings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/v1/recordings", async (req, res) => {
  try {
    const userId = req.userId!;
    const { text, title } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const resolvedTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : text.trim().split(/\s+/).slice(0, 6).join(" ");

    const recording = await createRecording(userId, resolvedTitle, text);
    res.status(201).json(recording);
  } catch (err) {
    console.error("Create recording error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/v1/recordings/:id", async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    const userId = req.userId!;
    const recording = await getRecording(userId, req.params.id);

    if (!recording) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.json(recording);
  } catch (err) {
    console.error("Get recording error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/v1/recordings/:id", async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    const { title, text } = req.body;

    if (title === undefined && text === undefined) {
      res.status(400).json({ error: "title or text is required" });
      return;
    }
    if (title !== undefined && typeof title !== "string") {
      res.status(400).json({ error: "title must be a string" });
      return;
    }
    if (text !== undefined && typeof text !== "string") {
      res.status(400).json({ error: "text must be a string" });
      return;
    }

    const userId = req.userId!;
    const recording = await updateRecording(userId, req.params.id, {
      title,
      text,
    });

    if (!recording) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.json(recording);
  } catch (err) {
    console.error("Update recording error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api/v1/recordings/:id", async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    const userId = req.userId!;
    const deleted = await deleteRecording(userId, req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete recording error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
