import { XMLImporter } from "./xmlImporter";
import { WordPressSync } from "./wordpressSync";
import { ImportStatus } from "@shared/api";

export class ImportScheduler {
  private xmlImporter: XMLImporter;
  private wpSync: WordPressSync;
  private status: ImportStatus;
  private cronJob: NodeJS.Timeout | null = null;
  private lastFullRun: Date | null = null;
  private isRunning = false;

  constructor(
    feedUrl: string,
    wordPressUrl: string,
    wordPressUser: string,
    wordPressPassword: string,
  ) {
    this.xmlImporter = new XMLImporter(feedUrl);
    this.wpSync = new WordPressSync(
      wordPressUrl,
      wordPressUser,
      wordPressPassword,
    );
    this.status = {
      isRunning: false,
      lastRun: null,
      nextRun: this.getNextMidnight(),
      totalImported: 0,
      totalUpdated: 0,
      totalErrors: 0,
      currentProgress: 0,
      currentPhase: "idle",
      lastError: null,
    };
  }

  getStatus(): ImportStatus {
    return { ...this.status };
  }

  async runImportNow(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Import is already running");
    }

    this.isRunning = true;
    this.status.isRunning = true;
    this.status.currentPhase = "data";
    this.status.currentProgress = 0;

    try {
      console.log("[IMPORT] Starting import process...");

      // Phase 1: Fetch and parse XML
      this.status.currentPhase = "data";
      console.log("[IMPORT] Phase 1: Fetching and parsing XML...");
      const properties = await this.xmlImporter.fetchAndParseXML();
      console.log(`[IMPORT] Found ${properties.length} properties`);

      const batchSize = 20;
      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Phase 2: Import data in batches
      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        const progress = Math.round(
          ((i + batch.length) / properties.length) * 50,
        ); // 50% for data phase

        console.log(
          `[IMPORT] Processing batch ${Math.floor(i / batchSize) + 1}...`,
        );

        for (const property of batch) {
          try {
            const result = await this.wpSync.createOrUpdateProperty(property);
            if (result.error) {
              errors++;
              console.error(
                `[IMPORT] Error for property ${property.id}: ${result.error}`,
              );
            } else if (result.created) {
              imported++;
            } else {
              updated++;
            }
          } catch (error) {
            errors++;
            console.error(
              `[IMPORT] Exception for property ${property.id}:`,
              error,
            );
          }
        }

        this.status.currentProgress = progress;
        this.status.totalImported = imported;
        this.status.totalUpdated = updated;
        this.status.totalErrors = errors;
      }

      // Phase 3: Download images (one property at a time)
      this.status.currentPhase = "images";
      console.log("[IMPORT] Phase 2: Downloading images...");

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (property.images.length > 0) {
          try {
            const existing = await this.wpSync.getPropertyByExternalId(
              property.id,
            );
            if (existing) {
              await this.wpSync.downloadAndAttachImages(
                existing.id,
                property.images,
              );
              const progress =
                50 + Math.round(((i + 1) / properties.length) * 40); // 40% for images
              this.status.currentProgress = progress;
            }
          } catch (error) {
            console.error(
              `[IMPORT] Error downloading images for ${property.id}:`,
              error,
            );
          }
        }
      }

      // Phase 4: Archive old properties
      this.status.currentPhase = "cleanup";
      console.log("[IMPORT] Phase 3: Archiving old properties...");
      const currentIds = properties.map((p) => p.id);
      const archived = await this.wpSync.archiveOldProperties(currentIds);
      console.log(`[IMPORT] Archived ${archived} old properties`);

      this.status.currentProgress = 100;
      this.status.lastRun = new Date().toISOString();
      this.status.nextRun = this.getNextMidnight();
      this.status.lastError = null;
      this.lastFullRun = new Date();

      console.log("[IMPORT] Import completed successfully");
      console.log(
        `[IMPORT] Summary - Imported: ${imported}, Updated: ${updated}, Errors: ${errors}, Archived: ${archived}`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.status.lastError = errorMsg;
      console.error("[IMPORT] Import failed:", error);
    } finally {
      this.isRunning = false;
      this.status.isRunning = false;
      this.status.currentPhase = "idle";
    }
  }

  startScheduler(): void {
    if (this.cronJob) {
      console.log("[SCHEDULER] Scheduler already running");
      return;
    }

    console.log("[SCHEDULER] Starting scheduler for daily imports at midnight");
    this.scheduleNextRun();
  }

  stopScheduler(): void {
    if (this.cronJob) {
      clearTimeout(this.cronJob);
      this.cronJob = null;
      console.log("[SCHEDULER] Scheduler stopped");
    }
  }

  private scheduleNextRun(): void {
    if (this.cronJob) {
      clearTimeout(this.cronJob);
    }

    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(0, 0, 0, 0);
    nextMidnight.setDate(nextMidnight.getDate() + 1);

    const delay = nextMidnight.getTime() - now.getTime();

    console.log(
      `[SCHEDULER] Next import scheduled for ${nextMidnight.toISOString()}`,
    );

    this.cronJob = setTimeout(() => {
      console.log("[SCHEDULER] Running scheduled import...");
      this.runImportNow().then(() => {
        this.scheduleNextRun();
      });
    }, delay);
  }

  private getNextMidnight(): string {
    const nextMidnight = new Date();
    nextMidnight.setHours(0, 0, 0, 0);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    return nextMidnight.toISOString();
  }
}
