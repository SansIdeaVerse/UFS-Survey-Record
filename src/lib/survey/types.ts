// Type definitions for the Survey Data Collector

export type LocationStatus = "ok" | "denied" | "unavailable" | "timeout";

export interface SurveyRecord {
  /** UUID v4 */
  id: string;
  name: string;
  households: number;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  location_status: LocationStatus;
  /** ISO 8601 timestamp (device time) */
  captured_at: string;
}

export interface LocationFix {
  status: LocationStatus;
  latitude?: number;
  longitude?: number;
  accuracy_m?: number;
  /** Epoch ms when this fix was obtained */
  fetchedAt?: number;
}

export interface RecordInput {
  name: string;
  households: number;
}
