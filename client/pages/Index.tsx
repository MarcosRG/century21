import { useState } from "react";
import { CheckCircle, AlertCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SchedulerStatus from "@/components/SchedulerStatus";

export default function Index() {
  const [showManualImport] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Property Importer
                </h1>
                <p className="text-sm text-slate-600">
                  Automated real estate property synchronization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Scheduler Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Import Schedule
              </h2>
              <p className="mt-1 text-slate-600">
                Monitor and manage automatic property imports from Century 21
                XML feed
              </p>
            </div>
            <SchedulerStatus />
          </div>

          {/* Info Sections */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Data Source */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Data Source</h3>
                  <p className="text-sm text-slate-600">
                    Synchronizes with Century 21 Colombia XML feed daily
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    proppit100.xml
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Process Flow */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    Two-Phase Process
                  </h3>
                  <p className="text-sm text-slate-600">
                    Phase 1: Properties & metadata
                    <br />
                    Phase 2: Images & galleries
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    WordPress Sync
                  </h3>
                  <p className="text-sm text-slate-600">
                    Automatically creates, updates, and archives posts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentation */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-slate-900">
                How It Works
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">
                    🔄 Automatic Daily Sync
                  </h4>
                  <p>
                    The system automatically downloads the XML feed from Century
                    21 every day at midnight (00:00) and synchronizes all
                    properties with your WordPress database.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">
                    📊 Smart Batch Processing
                  </h4>
                  <p>
                    Properties are processed in batches of 20 for metadata and
                    images one-at-a-time to prevent server timeouts and ensure
                    data integrity.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">
                    ✨ Complete Data Sync
                  </h4>
                  <p>
                    Imports all property details including title, description,
                    price, dimensions, location, amenities, and images with
                    proper taxonomies and custom fields.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">
                    🗑️ Automatic Cleanup
                  </h4>
                  <p>
                    Properties that are no longer in the XML feed are
                    automatically moved to draft status to keep your database
                    clean and in sync.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-slate-900">
                Implementation Details
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-slate-900">Feed URL</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      21online.century21colombia.com/xml/proppit100.xml
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Sync Frequency</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      Daily at 00:00 (midnight)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Data Batch Size
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      20 properties per batch
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Image Processing
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      1 property at a time (sequential)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
