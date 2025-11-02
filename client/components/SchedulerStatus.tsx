"use client";

import { useEffect, useState } from "react";
import { Clock, PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportStatus } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

export default function SchedulerStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [nextRunTime, setNextRunTime] = useState("");

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status?.nextRun) {
      updateNextRunTime();
      const interval = setInterval(updateNextRunTime, 1000);
      return () => clearInterval(interval);
    }
  }, [status?.nextRun]);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/import/status");
      const data = await response.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch import status:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateNextRunTime = () => {
    if (!status?.nextRun) return;

    const nextRun = new Date(status.nextRun);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();

    if (diffMs <= 0) {
      setNextRunTime("Processing...");
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    setNextRunTime(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handleRunNow = async () => {
    if (isRunning || status?.isRunning) {
      toast({
        title: "Import in Progress",
        description: "An import is already running",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch("/api/import/run", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Import Started",
          description: "The import process has been started",
        });
        await fetchStatus();
      } else {
        throw new Error(data.error || "Failed to start import");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start import",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (loading || !status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-600">Loading scheduler status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.isRunning ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : status.lastError ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              )}
              <div>
                <CardTitle>
                  {status.isRunning ? "Import in Progress" : "Scheduler Status"}
                </CardTitle>
                <CardDescription>
                  {status.isRunning
                    ? `${status.currentPhase}: ${status.currentProgress}%`
                    : "Automated daily imports"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                status.isRunning
                  ? "secondary"
                  : status.lastError
                    ? "destructive"
                    : "default"
              }
            >
              {status.isRunning
                ? "Running"
                : status.lastError
                  ? "Error"
                  : "Ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium">{status.currentProgress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{ width: `${status.currentProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Current phase:{" "}
                <span className="font-medium">{status.currentPhase}</span>
              </p>
            </div>
          )}

          {status.lastError && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Last Error:</span>{" "}
                {status.lastError}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Last Run</p>
              <p className="mt-1 font-medium text-slate-900">
                {status.lastRun
                  ? new Date(status.lastRun).toLocaleDateString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Next Run</p>
              <p className="mt-1 font-medium text-emerald-600">{nextRunTime}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Status</p>
              <p className="mt-1 font-medium text-slate-900">
                {status.isRunning ? "Processing..." : "Scheduled"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleRunNow}
            disabled={isRunning || status.isRunning}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Import Now
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Imported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {status.totalImported}
            </div>
            <p className="mt-1 text-xs text-slate-600">New properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {status.totalUpdated}
            </div>
            <p className="mt-1 text-xs text-slate-600">Existing properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${status.totalErrors > 0 ? "text-red-600" : "text-slate-400"}`}
            >
              {status.totalErrors}
            </div>
            <p className="mt-1 text-xs text-slate-600">Failed imports</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Automatic Import Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Daily Automatic Sync</p>
              <p className="text-slate-600">
                Runs every day at midnight (00:00)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Batch Processing</p>
              <p className="text-slate-600">
                Data in batches of 20, images one at a time
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">WordPress Sync</p>
              <p className="text-slate-600">
                Creates, updates, and archives properties automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
