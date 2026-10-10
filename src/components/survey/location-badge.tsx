"use client";

import * as React from "react";
import { MapPin, Loader2, AlertTriangle, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationFix } from "@/lib/survey/types";
import { describeFix } from "@/lib/survey/location";

interface LocationBadgeProps {
  fix: LocationFix | null;
  /** True while a fresh fix is being requested. */
  loading?: boolean;
  className?: string;
}

const TONES: Record<
  "idle" | "working" | "ok" | "warn" | "error",
  string
> = {
  idle: "text-muted-foreground bg-muted/60 border-border",
  working: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
  ok: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  warn: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
  error: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
};

export function LocationBadge({ fix, loading, className }: LocationBadgeProps) {
  const { label, tone } = describeFix(fix);
  const effectiveTone = loading && (!fix || fix.status !== "ok") ? "working" : tone;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        TONES[effectiveTone],
        className,
      )}
    >
      {effectiveTone === "working" ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : effectiveTone === "ok" ? (
        <MapPin className="size-3.5" aria-hidden />
      ) : effectiveTone === "error" ? (
        <MapPinOff className="size-3.5" aria-hidden />
      ) : (
        <AlertTriangle className="size-3.5" aria-hidden />
      )}
      <span>{label}</span>
    </div>
  );
}
