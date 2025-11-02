import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressTrackerProps {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  importedCount: number;
  errorCount: number;
  totalCount: number;
}

export default function ProgressTracker({
  status,
  progress,
  importedCount,
  errorCount,
  totalCount,
}: ProgressTrackerProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      case "complete":
        return <CheckCircle2 className="h-6 w-6 text-emerald-600" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "processing":
        return "Importing properties...";
      case "complete":
        return "Import completed successfully";
      case "error":
        return "Import encountered errors";
      default:
        return "Ready to start";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "processing":
        return "text-blue-600";
      case "complete":
        return "text-emerald-600";
      case "error":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const successRate =
    totalCount > 0 ? Math.round((importedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className={getStatusColor()}>
                  {getStatusText()}
                </CardTitle>
                <CardDescription>
                  {status === "processing"
                    ? "Please wait while properties are being imported"
                    : "Review the details below"}
                </CardDescription>
              </div>
            </div>
            {status !== "idle" && (
              <Badge
                variant={
                  status === "complete"
                    ? "default"
                    : status === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {progress}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium text-slate-900 mb-2">
              <span>Overall Progress</span>
              <span>
                {importedCount} of {totalCount}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Imported Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Successfully Imported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {importedCount}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {successRate}% success rate
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Errors Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{errorCount}</div>
            <p className="mt-1 text-xs text-slate-600">
              {errorCount > 0 ? "Needs attention" : "No errors"}
            </p>
            {errorCount > 0 && (
              <div className="mt-3 rounded-lg bg-red-50 p-2">
                <p className="text-xs text-red-700">
                  Failed to import {errorCount} propert
                  {errorCount === 1 ? "y" : "ies"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remaining Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {Math.max(0, totalCount - importedCount - errorCount)}
            </div>
            <p className="mt-1 text-xs text-slate-600">Properties queued</p>
            {status === "processing" && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs text-blue-600 font-medium">
                  Processing...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import Process Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Phase 1: Data Import
                </p>
                <p className="text-xs text-slate-600">
                  Property details (title, price, bedrooms, bathrooms, location,
                  etc.) are imported in batches
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Phase 2: Image Processing
                </p>
                <p className="text-xs text-slate-600">
                  Images are downloaded and attached to properties one at a time
                  to prevent timeouts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Phase 3: Metadata & Taxonomy
                </p>
                <p className="text-xs text-slate-600">
                  All custom fields, amenities, and property types are properly
                  set and indexed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
