// Geolocation wrapper. Never blocks saving on failure.
// Maps GeolocationPositionError codes to friendly status strings.

import type { LocationFix, LocationStatus } from "./types";

const TWO_MINUTES = 2 * 60 * 1000;

interface GetLocationOptions {
  timeout?: number;
}

/**
 * Resolve a single GPS fix. Always resolves (never rejects) so callers can
 * keep saving even when location is denied or unavailable.
 */
export function getLocation({
  timeout = 10000,
}: GetLocationOptions = {}): Promise<LocationFix> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve({ status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          status: "ok" as LocationStatus,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: Math.round(pos.coords.accuracy),
          fetchedAt: Date.now(),
        });
      },
      (err) => {
        const status: LocationStatus =
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable";
        resolve({ status });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 30000 },
    );
  });
}

/**
 * Decide which fix to use when saving: prefer the latest, but fall back to a
 * previous fix that is less than 2 minutes old. Returns null if neither is usable.
 */
export function pickFix(
  latest: LocationFix | null,
  previous: LocationFix | null,
): LocationFix | null {
  if (latest && latest.status === "ok" && latest.latitude != null) {
    return latest;
  }
  if (
    previous &&
    previous.status === "ok" &&
    previous.latitude != null &&
    previous.fetchedAt &&
    Date.now() - previous.fetchedAt < TWO_MINUTES
  ) {
    return previous;
  }
  // Fall back to the failure status of the latest attempt, if any.
  if (latest) return latest;
  if (previous) return previous;
  return null;
}

/**
 * Returns a human-readable label for the current location status.
 */
export function describeFix(fix: LocationFix | null): {
  label: string;
  tone: "idle" | "working" | "ok" | "warn" | "error";
} {
  if (!fix) return { label: "Getting location…", tone: "working" };
  switch (fix.status) {
    case "ok":
      if (fix.accuracy_m != null) {
        return {
          label: `Location ready (±${fix.accuracy_m} m)`,
          tone: "ok",
        };
      }
      return { label: "Location ready", tone: "ok" };
    case "denied":
      return {
        label: "Location permission denied",
        tone: "error",
      };
    case "timeout":
      return { label: "Location timed out", tone: "warn" };
    case "unavailable":
      return { label: "Location unavailable", tone: "warn" };
    default:
      return { label: "Location unavailable", tone: "warn" };
  }
}
