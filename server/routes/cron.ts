import { RequestHandler } from "express";
import { XMLImporter } from "../services/xmlImporter";
import { WordPressSync } from "../services/wordpressSync";
import { ImportResponse } from "@shared/api";

export const handleCronImport: RequestHandler = async (_req, res) => {
  try {
    // Verify the request is from Vercel
    const authHeader = _req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "Invalid cron secret",
      } as ImportResponse);
    }

    console.log("[CRON] Import triggered at", new Date().toISOString());

    const feedUrl =
      process.env.XML_FEED_URL ||
      "https://21online.century21colombia.com/xml/proppit/proppit100.xml";
    const wpUrl = process.env.WORDPRESS_URL || "https://century21laheredad.com";
    const wpUser = process.env.WORDPRESS_USER || "marcosg";
    const wpPassword = process.env.WORDPRESS_PASSWORD || "";

    const xmlImporter = new XMLImporter(feedUrl);
    const wpSync = new WordPressSync(wpUrl, wpUser, wpPassword);

    console.log("[CRON] Phase 1: Fetching and parsing XML...");
    const properties = await xmlImporter.fetchAndParseXML();
    console.log(`[CRON] Found ${properties.length} properties`);

    const batchSize = 20;
    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Phase 1: Import data in batches
    console.log("[CRON] Phase 2: Importing property data in batches...");
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);

      for (const property of batch) {
        try {
          const result = await wpSync.createOrUpdateProperty(property);
          if (result.error) {
            errors++;
            console.error(
              `[CRON] Error for property ${property.id}: ${result.error}`,
            );
          } else if (result.created) {
            imported++;
          } else {
            updated++;
          }
        } catch (error) {
          errors++;
          console.error(`[CRON] Exception for property ${property.id}:`, error);
        }
      }
    }

    // Phase 2: Download images (one property at a time)
    console.log("[CRON] Phase 3: Downloading images...");
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      if (property.images.length > 0) {
        try {
          const existing = await wpSync.getPropertyByExternalId(property.id);
          if (existing) {
            await wpSync.downloadAndAttachImages(existing.id, property.images);
          }
        } catch (error) {
          console.error(
            `[CRON] Error downloading images for ${property.id}:`,
            error,
          );
        }
      }
    }

    // Phase 3: Archive old properties
    console.log("[CRON] Phase 4: Archiving old properties...");
    const currentIds = properties.map((p) => p.id);
    const archived = await wpSync.archiveOldProperties(currentIds);
    console.log(`[CRON] Archived ${archived} old properties`);

    console.log("[CRON] Import completed successfully");
    console.log(
      `[CRON] Summary - Imported: ${imported}, Updated: ${updated}, Errors: ${errors}, Archived: ${archived}`,
    );

    res.status(200).json({
      success: true,
      message: "Import completed successfully",
      status: {
        isRunning: false,
        lastRun: new Date().toISOString(),
        nextRun: getNextMidnight(),
        totalImported: imported,
        totalUpdated: updated,
        totalErrors: errors,
        currentProgress: 100,
        currentPhase: "idle",
        lastError: null,
      },
    } as ImportResponse);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Import failed:", error);

    res.status(500).json({
      success: false,
      message: "Import failed",
      error: errorMsg,
    } as ImportResponse);
  }
};

function getNextMidnight(): string {
  const nextMidnight = new Date();
  nextMidnight.setHours(0, 0, 0, 0);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  return nextMidnight.toISOString();
}
