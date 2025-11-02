import { DOMParser } from "@xmldom/xmldom";
import { ImportProperty } from "@shared/api";

export class XMLImporter {
  private feedUrl: string;

  constructor(feedUrl: string) {
    this.feedUrl = feedUrl;
  }

  async fetchAndParseXML(): Promise<ImportProperty[]> {
    try {
      const response = await fetch(this.feedUrl, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch XML: HTTP ${response.status}`);
      }

      const xmlText = await response.text();
      if (!xmlText) {
        throw new Error("XML response is empty");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText);

      if (!xmlDoc) {
        throw new Error("Failed to parse XML");
      }

      const listings = xmlDoc.getElementsByTagName("listing");
      const properties: ImportProperty[] = [];

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

        const getAttribute = (tagName: string, attrName: string): string => {
          const elements = listing.getElementsByTagName(tagName);
          if (elements.length === 0) return "";
          return elements[0].getAttribute(attrName) || "";
        };

        const referenceId = getRawText("reference_id");
        if (!referenceId) continue;

        const images: string[] = [];
        const picturesParent = listing.getElementsByTagName("pictures");
        if (picturesParent.length > 0) {
          const urls = picturesParent[0].getElementsByTagName("url");
          for (let j = 0; j < urls.length; j++) {
            const url = (urls[j].textContent || "").trim();
            if (url) images.push(url);
          }
        }

        const amenities: string[] = [];
        const amenitiesParent = listing.getElementsByTagName("amenities");
        if (amenitiesParent.length > 0) {
          const amenityNodes = amenitiesParent[0].getElementsByTagName("amenity");
          for (let j = 0; j < amenityNodes.length; j++) {
            const amenity = (amenityNodes[j].textContent || "").trim();
            if (amenity) amenities.push(amenity);
          }
        }

        const operation = getAttribute("price", "operation");

        properties.push({
          id: referenceId,
          title: getRawText("title"),
          description: getRawText("description"),
          price: getRawText("price"),
          bedrooms: getRawText("bedrooms"),
          bathrooms: getRawText("bathrooms"),
          area: getRawText("floorArea"),
          terrain: getRawText("plotArea"),
          floor: getRawText("floor"),
          fee: getRawText("communityFeesPrice"),
          type: getRawText("propertyType"),
          status: operation === "sale" ? "sale" : "rent",
          address: getRawText("address"),
          postalCode: getRawText("postalCode"),
          latitude: getRawText("latitude"),
          longitude: getRawText("longitude"),
          agentName: getNestedText("contact", "name"),
          agentEmail: getNestedText("contact", "email"),
          agentPhone: getNestedText("contact", "phone"),
          amenities: amenities,
          images: images,
        });
      }

      return properties;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`XML Import Error: ${message}`);
    }
  }
}
