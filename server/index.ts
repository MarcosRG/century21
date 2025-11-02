import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  initializeImporter,
  handleGetStatus,
  handleRunImport,
  handleGetSchedule,
} from "./routes/importer";
import { handleCronImport } from "./routes/cron";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize importer with scheduler (for non-Vercel deployments)
  const isVercel = process.env.VERCEL === "1";
  if (!isVercel) {
    try {
      initializeImporter();
    } catch (error) {
      console.error("Failed to initialize importer:", error);
    }
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Importer API routes
  app.get("/api/import/status", handleGetStatus);
  app.post("/api/import/run", handleRunImport);
  app.get("/api/import/schedule", handleGetSchedule);

  // Vercel Cron endpoint
  app.post("/api/cron/import", handleCronImport);

  return app;
}
