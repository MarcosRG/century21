import { RequestHandler } from "express";
import { ImportScheduler } from "../services/importScheduler";
import { ImportResponse, ImportStatus } from "@shared/api";

let scheduler: ImportScheduler | null = null;

export function initializeImporter() {
  const feedUrl = process.env.XML_FEED_URL || "https://21online.century21colombia.com/xml/proppit/proppit100.xml";
  const wpUrl = process.env.WORDPRESS_URL || "https://century21laheredad.com";
  const wpUser = process.env.WORDPRESS_USER || "marcosg";
  const wpPassword = process.env.WORDPRESS_PASSWORD || "";

  scheduler = new ImportScheduler(feedUrl, wpUrl, wpUser, wpPassword);
  scheduler.startScheduler();
  console.log("[IMPORTER] Initialized and scheduler started");

  return scheduler;
}

export function getScheduler(): ImportScheduler {
  if (!scheduler) {
    throw new Error("Scheduler not initialized");
  }
  return scheduler;
}

export const handleGetStatus: RequestHandler = (_req, res) => {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();
    res.json({
      success: true,
      message: "Import status retrieved",
      status,
    } as ImportResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to get import status",
      error: message,
    } as ImportResponse);
  }
};

export const handleRunImport: RequestHandler = async (_req, res) => {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    if (status.isRunning) {
      return res.status(400).json({
        success: false,
        message: "Import is already running",
        error: "An import process is already in progress",
      } as ImportResponse);
    }

    // Start import in background
    scheduler.runImportNow().catch((error) => {
      console.error("[IMPORTER] Background import error:", error);
    });

    res.json({
      success: true,
      message: "Import started successfully",
      status: scheduler.getStatus(),
    } as ImportResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to start import",
      error: message,
    } as ImportResponse);
  }
};

export const handleGetSchedule: RequestHandler = (_req, res) => {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    res.json({
      success: true,
      message: "Schedule information retrieved",
      status: {
        nextRun: status.nextRun,
        lastRun: status.lastRun,
        isRunning: status.isRunning,
        currentProgress: status.currentProgress,
        currentPhase: status.currentPhase,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to get schedule",
      error: message,
    } as ImportResponse);
  }
};
