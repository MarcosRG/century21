import { ImportProperty } from "@shared/api";

interface WordPressPost {
  id: number;
  title: string;
  content: string;
  status: string;
  meta: Record<string, any>;
  [key: string]: any;
}

export class WordPressSync {
  private baseUrl: string;
  private username: string;
  private password: string;
  private authHeader: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.username = username;
    this.password = password;
    this.authHeader = Buffer.from(`${username}:${password}`).toString("base64");
  }

  private async request(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, any>
  ) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;

    const options: any = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.authHeader}`,
      },
      timeout: 30000,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WordPress API Error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  async getPropertyByExternalId(externalId: string): Promise<WordPressPost | null> {
    try {
      const posts = await this.request(
        `/posts?type=real-estate&meta_key=property_identity&meta_value=${externalId}`
      );
      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error(`Error getting property ${externalId}:`, error);
      return null;
    }
  }

  async createOrUpdateProperty(
    property: ImportProperty
  ): Promise<{ id: number; created: boolean; error?: string }> {
    try {
      const existing = await this.getPropertyByExternalId(property.id);

      const postData = {
        title: property.title,
        content: property.description,
        type: "real-estate",
        status: "publish",
        meta: {
          property_identity: property.id,
          property_price_value: property.price,
          property_bedrooms: property.bedrooms,
          property_bathrooms: property.bathrooms,
          nivel_de_piso: property.floor,
          property_additional_detail: `Cuota: ${property.fee}`,
          property_land: property.terrain,
          property_size: property.area,
          property_location: property.latitude && property.longitude 
            ? `${property.latitude}, ${property.longitude}` 
            : "",
          property_address: property.address,
          property_postal_code: property.postalCode,
          property_other_agent_name: property.agentName,
          property_other_agent_email: property.agentEmail,
          property_other_agent_phone: property.agentPhone,
        },
      };

      let postId: number;
      if (existing) {
        await this.request(`/posts/${existing.id}`, "POST", postData);
        postId = existing.id;
      } else {
        const created = await this.request(`/posts`, "POST", postData);
        postId = created.id;
      }

      // Set property type taxonomy
      const typeMap: Record<string, string> = {
        apartment: "Apartamento",
        house: "Casa",
        commercial: "Local Comercial",
        land: "Lote",
      };
      const mappedType = typeMap[property.type.toLowerCase()] || property.type;

      await this.setTaxonomy(postId, "property-type", [mappedType]);

      // Set property status (sale/rent)
      const statusLabel = property.status === "sale" ? "Venta" : "Arriendo";
      await this.setTaxonomy(postId, "property-status", [statusLabel]);

      // Set label
      await this.setTaxonomy(postId, "property-label", ["Usado"]);

      // Set amenities
      if (property.amenities.length > 0) {
        await this.setTaxonomy(postId, "amenity", property.amenities);
      }

      return { id: postId, created: !existing };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        id: 0,
        created: false,
        error: message,
      };
    }
  }

  private async setTaxonomy(
    postId: number,
    taxonomy: string,
    terms: string[]
  ): Promise<void> {
    try {
      // Get or create term IDs
      const termIds: number[] = [];

      for (const termName of terms) {
        let termId = await this.getTermId(taxonomy, termName);

        if (!termId) {
          const newTerm = await this.request(`/${taxonomy}`, "POST", {
            name: termName,
          });
          termId = newTerm.id;
        }

        termIds.push(termId);
      }

      // Set post terms
      await this.request(`/posts/${postId}`, "POST", {
        [taxonomy]: termIds,
      });
    } catch (error) {
      console.error(`Error setting taxonomy ${taxonomy}:`, error);
    }
  }

  private async getTermId(
    taxonomy: string,
    termName: string
  ): Promise<number | null> {
    try {
      const terms = await this.request(`/${taxonomy}?search=${termName}`);
      if (terms.length > 0) {
        return terms[0].id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async downloadAndAttachImages(
    postId: number,
    imageUrls: string[]
  ): Promise<number[]> {
    const attachmentIds: number[] = [];

    for (const imageUrl of imageUrls) {
      try {
        const attachment = await this.createMediaFromUrl(postId, imageUrl);
        if (attachment) {
          attachmentIds.push(attachment.id);
        }
      } catch (error) {
        console.error(`Error downloading image ${imageUrl}:`, error);
      }
    }

    if (attachmentIds.length > 0) {
      // Set first image as featured
      await this.request(`/posts/${postId}`, "POST", {
        featured_media: attachmentIds[0],
      });

      // Save gallery
      await this.request(`/posts/${postId}`, "POST", {
        meta: {
          tf_gallery_images: attachmentIds,
          gallery_images: JSON.stringify(attachmentIds),
        },
      });
    }

    return attachmentIds;
  }

  private async createMediaFromUrl(
    postId: number,
    imageUrl: string
  ): Promise<{ id: number } | null> {
    try {
      const response = await fetch(imageUrl, {
        timeout: 45000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: HTTP ${response.status}`);
      }

      const buffer = await response.buffer();
      const fileName = imageUrl.split("/").pop() || "image.jpg";

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([buffer], { type: "image/jpeg" }),
        fileName
      );

      const uploadUrl = `${this.baseUrl}/wp-json/wp/v2/media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.authHeader}`,
        },
        body: formData as any,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload media: HTTP ${uploadResponse.status}`);
      }

      const media = await uploadResponse.json();
      return { id: (media as any).id };
    } catch (error) {
      console.error(`Error creating media from URL ${imageUrl}:`, error);
      return null;
    }
  }

  async archiveOldProperties(currentIds: string[]): Promise<number> {
    try {
      const allProperties = await this.request(
        `/posts?type=real-estate&per_page=100&status=publish`
      );

      let archivedCount = 0;
      for (const prop of allProperties) {
        const externalId = prop.meta?.property_identity;
        if (externalId && !currentIds.includes(externalId)) {
          await this.request(`/posts/${prop.id}`, "POST", {
            status: "draft",
          });
          archivedCount++;
        }
      }

      return archivedCount;
    } catch (error) {
      console.error("Error archiving old properties:", error);
      return 0;
    }
  }
}
