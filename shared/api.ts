/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface DemoResponse {
  message: string;
}

export interface ImportProperty {
  id: string;
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  terrain: string;
  floor: string;
  fee: string;
  type: string;
  status: "sale" | "rent";
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  amenities: string[];
  images: string[];
}

export interface ImportStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string;
  totalImported: number;
  totalUpdated: number;
  totalErrors: number;
  currentProgress: number;
  currentPhase: "idle" | "data" | "images" | "cleanup";
  lastError: string | null;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  status?: ImportStatus;
  error?: string;
}
