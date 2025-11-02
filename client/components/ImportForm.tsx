import { useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  title: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  type: string;
  status: string;
  address: string;
  images: string[];
}

interface ImportFormProps {
  onXMLParsed: (properties: Property[]) => void;
}

export default function ImportForm({ onXMLParsed }: ImportFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [xmlUrl, setXmlUrl] = useState("");
  const [error, setError] = useState("");

  const parseXML = (xmlString: string): Property[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Invalid XML format");
      }

      const properties: Property[] = [];
      const listings = xmlDoc.getElementsByTagName("listing");

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];

        const getRawText = (tagName: string): string => {
          const elements = listing.getElementsByTagName(tagName);
          return elements.length > 0 ? (elements[0].textContent || "").trim() : "";
        };

        const getNestedText = (parentTag: string, childTag: string): string => {
          const parents = listing.getElementsByTagName(parentTag);
          if (parents.length === 0) return "";
          const children = parents[0].getElementsByTagName(childTag);
          return children.length > 0 ? (children[0].textContent || "").trim() : "";
        };

        const images: string[] = [];
        const picturesParent = listing.getElementsByTagName("pictures");
        if (picturesParent.length > 0) {
          const urls = picturesParent[0].getElementsByTagName("url");
          for (let j = 0; j < urls.length; j++) {
            const url = (urls[j].textContent || "").trim();
            if (url) images.push(url);
          }
        }

        const referenceId = getRawText("reference_id");
        if (!referenceId) continue;

        const priceElement = listing.getElementsByTagName("price");
        const operation = priceElement.length > 0 
          ? priceElement[0].getAttribute("operation") || "sale"
          : "sale";

        properties.push({
          id: referenceId,
          title: getRawText("title"),
          price: getRawText("price"),
          bedrooms: getRawText("bedrooms"),
          bathrooms: getRawText("bathrooms"),
          area: getRawText("floorArea"),
          type: getRawText("propertyType"),
          status: operation === "sale" ? "Venta" : "Arriendo",
          address: getRawText("address"),
          images: images,
        });
      }

      return properties;
    } catch (err) {
      throw new Error(`Failed to parse XML: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");

    try {
      const text = await file.text();
      const properties = parseXML(text);

      if (properties.length === 0) {
        throw new Error("No properties found in the XML file");
      }

      onXMLParsed(properties);
      toast({
        title: "Success",
        description: `Parsed ${properties.length} properties from XML`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to parse XML";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xmlUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(xmlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch XML: HTTP ${response.status}`);
      }

      const text = await response.text();
      const properties = parseXML(text);

      if (properties.length === 0) {
        throw new Error("No properties found in the XML feed");
      }

      onXMLParsed(properties);
      setXmlUrl("");
      toast({
        title: "Success",
        description: `Parsed ${properties.length} properties from XML feed`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to import XML";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Properties</CardTitle>
        <CardDescription>
          Upload an XML file or provide a feed URL to import real estate properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Option 1: Upload XML File</h3>
          <label className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-8 cursor-pointer transition-colors hover:border-emerald-300 hover:bg-emerald-50">
            <div className="rounded-full bg-emerald-100 p-3">
              <Upload className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                Click to upload XML
              </p>
              <p className="text-xs text-slate-600">or drag and drop</p>
            </div>
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-600">Or</span>
          </div>
        </div>

        {/* URL Import */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Option 2: Import from URL</h3>
          <form onSubmit={handleUrlImport} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              placeholder="https://example.com/feed.xml"
              value={xmlUrl}
              onChange={(e) => setXmlUrl(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <Button
              type="submit"
              disabled={isLoading || !xmlUrl.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? "Loading..." : "Import"}
            </Button>
          </form>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Tip:</span> Your XML should contain listing elements with reference_id,
            title, price, bedrooms, bathrooms, and image URLs. The importer handles batch processing
            to ensure all data and images are imported correctly without timeouts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
