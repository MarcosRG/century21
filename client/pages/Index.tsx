import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportForm from "@/components/ImportForm";
import PreviewList from "@/components/PreviewList";
import ProgressTracker from "@/components/ProgressTracker";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [importStatus, setImportStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [previewedProperties, setPreviewedProperties] = useState<any[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastImportTime, setLastImportTime] = useState<Date | null>(null);

  const handleXMLParsed = (properties: any[]) => {
    setPreviewedProperties(properties);
    setActiveTab("preview");
    toast({
      title: "XML Parsed Successfully",
      description: `Found ${properties.length} properties to import`,
    });
  };

  const handleImportStart = async () => {
    setImportStatus("processing");
    setActiveTab("progress");
    setProgress(0);
    setImportedCount(0);
    setErrorCount(0);

    try {
      // Simulate import process - in real app, this would call the backend
      const total = previewedProperties.length;
      
      for (let i = 0; i < total; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newProgress = Math.round(((i + 1) / total) * 100);
        setProgress(newProgress);
        setImportedCount(i + 1);
      }

      setImportStatus("complete");
      setLastImportTime(new Date());
      toast({
        title: "Import Complete",
        description: `Successfully imported ${importedCount} properties`,
      });
    } catch (error) {
      setImportStatus("error");
      setErrorCount(previewedProperties.length - importedCount);
      toast({
        title: "Import Failed",
        description: "There was an error during the import process",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Property Importer</h1>
              <p className="mt-1 text-sm text-slate-600">
                Import real estate properties from XML feeds efficiently
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">{importedCount}</p>
                <p className="text-xs text-slate-600">Imported</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              disabled={previewedProperties.length === 0}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              disabled={importStatus === "idle"}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <ImportForm onXMLParsed={handleXMLParsed} />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Properties to Import
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Review {previewedProperties.length} properties before importing
                  </p>
                </div>
                <Button
                  onClick={handleImportStart}
                  disabled={importStatus !== "idle" || previewedProperties.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Start Import
                </Button>
              </div>
              <PreviewList properties={previewedProperties} />
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <ProgressTracker
              status={importStatus}
              progress={progress}
              importedCount={importedCount}
              errorCount={errorCount}
              totalCount={previewedProperties.length}
            />
          </TabsContent>
        </Tabs>

        {/* Stats Cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Imported</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{importedCount}</div>
              <p className="text-xs text-slate-600">Properties successfully imported</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorCount}</div>
              <p className="text-xs text-slate-600">Failed imports to review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress}%</div>
              <p className="text-xs text-slate-600">Current import progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Import</CardTitle>
              <Zap className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastImportTime ? lastImportTime.toLocaleDateString() : "—"}
              </div>
              <p className="text-xs text-slate-600">When the last import completed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
