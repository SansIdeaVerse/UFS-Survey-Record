"use client";

import * as React from "react";
import { Minus, Plus, Save, Info, MapPinOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocationBadge } from "./location-badge";
import {
  addRecord,
  requestPersistentStorage,
} from "@/lib/survey/db";
import { getLocation, pickFix } from "@/lib/survey/location";
import {
  validateEntry,
  NAME_MAX,
  HOUSEHOLD_MIN,
  HOUSEHOLD_MAX,
} from "@/lib/survey/validation";
import type { LocationFix, SurveyRecord } from "@/lib/survey/types";

interface EntryFormProps {
  /** Called after a record is saved so the parent can refresh the list. */
  onSaved?: (record: SurveyRecord) => void;
}

export function EntryForm({ onSaved }: EntryFormProps) {
  const [name, setName] = React.useState("");
  const [households, setHouseholds] = React.useState<string>("1");
  const [touched, setTouched] = React.useState<{ name: boolean; households: boolean }>({
    name: false,
    households: false,
  });
  const [fix, setFix] = React.useState<LocationFix | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deniedHelp, setDeniedHelp] = React.useState(false);

  // Warm up the GPS and request persistent storage on first mount.
  React.useEffect(() => {
    let cancelled = false;
    setLocating(true);
    getLocation().then((f) => {
      if (cancelled) return;
      setFix(f);
      setLocating(false);
      if (f.status === "denied") setDeniedHelp(true);
    });
    void requestPersistentStorage();
    return () => {
      cancelled = true;
    };
  }, []);

  const parsedHouseholds = parseHouseholds(households);
  const result = validateEntry({
    name,
    households: parsedHouseholds,
  });

  const nameError = touched.name ? result.errors.find((e) => e.field === "name")?.message : undefined;
  const householdsError = touched.households
    ? result.errors.find((e) => e.field === "households")?.message
    : undefined;

  function handleDecrement() {
    setTouched((t) => ({ ...t, households: true }));
    setHouseholds((cur) => {
      const n = parseHouseholds(cur);
      if (n == null || Number.isNaN(n)) return String(HOUSEHOLD_MIN);
      return String(Math.max(HOUSEHOLD_MIN, n - 1));
    });
  }

  function handleIncrement() {
    setTouched((t) => ({ ...t, households: true }));
    setHouseholds((cur) => {
      const n = parseHouseholds(cur);
      if (n == null || Number.isNaN(n)) return String(HOUSEHOLD_MIN + 1);
      return String(Math.min(HOUSEHOLD_MAX, n + 1));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, households: true });
    if (!result.valid || saving) return;

    setSaving(true);
    try {
      // Fetch a fresh fix before saving.
      setLocating(true);
      const fresh = await getLocation();
      setLocating(false);
      setFix(fresh);
      const chosen = pickFix(fresh, fix);

      const now = new Date();
      const record: SurveyRecord = {
        id: crypto.randomUUID(),
        name: name.trim(),
        households: parsedHouseholds ?? HOUSEHOLD_MIN,
        latitude: chosen?.latitude ?? null,
        longitude: chosen?.longitude ?? null,
        accuracy_m: chosen?.accuracy_m ?? null,
        location_status: chosen?.status ?? "unavailable",
        captured_at: now.toISOString(),
      };

      await addRecord(record);
      onSaved?.(record);

      // Reset the form for the next entry.
      setName("");
      setHouseholds("1");
      setTouched({ name: false, households: false });

      toast.success("Saved", {
        description: `${record.name} • ${record.households} household${record.households === 1 ? "" : "s"}`,
      });

      if (record.location_status === "denied") setDeniedHelp(true);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Couldn't save", {
        description:
          msg.includes("quota") || msg.toLowerCase().includes("storage")
            ? "Device storage is full. Please export and clear old data."
            : "Please try again. Your entry is still in the form.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">New entry</CardTitle>
            <CardDescription>
              Add a household survey visit. Location is captured automatically.
            </CardDescription>
          </div>
          <LocationBadge fix={fix} loading={locating} />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">
              Respondent name
              <span className="text-destructive" aria-hidden> *</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              maxLength={NAME_MAX}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. Asha Devi"
              enterKeyHint="next"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
              className="h-11 text-base"
            />
            <div className="flex items-center justify-between text-xs">
              {nameError ? (
                <p id="name-error" className="text-destructive">
                  {nameError}
                </p>
              ) : (
                <p className="text-muted-foreground">Trimmed automatically. 1–{NAME_MAX} characters.</p>
              )}
              <span className="text-muted-foreground tabular-nums">{name.trim().length}/{NAME_MAX}</span>
            </div>
          </div>

          {/* Households stepper */}
          <div className="space-y-2">
            <Label htmlFor="households" className="text-sm">
              Number of households
            </Label>
            <div className="flex items-stretch gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0"
                onClick={handleDecrement}
                disabled={parseHouseholds(households) !== null && parseHouseholds(households) !== undefined && (parseHouseholds(households) ?? 0) <= HOUSEHOLD_MIN}
                aria-label="Decrease household count"
              >
                <Minus className="size-4" aria-hidden />
              </Button>
              <Input
                id="households"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={households}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setHouseholds(v);
                  setTouched((t) => ({ ...t, households: true }));
                }}
                onBlur={() => {
                  const n = parseHouseholds(households);
                  if (n == null || Number.isNaN(n) || n < HOUSEHOLD_MIN) {
                    // do not silently reset; show error if invalid
                  }
                  setTouched((t) => ({ ...t, households: true }));
                }}
                aria-invalid={!!householdsError}
                aria-describedby={householdsError ? "households-error" : undefined}
                className="h-11 min-w-0 flex-1 text-center text-base font-medium tabular-nums"
                placeholder="1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0"
                onClick={handleIncrement}
                disabled={(parseHouseholds(households) ?? 0) >= HOUSEHOLD_MAX}
                aria-label="Increase household count"
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
            {householdsError ? (
              <p id="households-error" className="text-xs text-destructive">
                {householdsError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Default is 1 for single-person households. Range {HOUSEHOLD_MIN}–{HOUSEHOLD_MAX}.
              </p>
            )}
          </div>

          {/* Permission help banner */}
          {deniedHelp && fix?.status === "denied" && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <MapPinOff className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="space-y-1">
                <p className="font-medium">Location permission is blocked.</p>
                <p className="text-xs">
                  Records are still saved with an empty location. To capture GPS,
                  allow location for this site in your browser settings, then
                  reload this page.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-1 -mt-1 size-7 shrink-0 text-amber-700 dark:text-amber-300"
                aria-label="Dismiss location help"
                onClick={() => setDeniedHelp(false)}
              >
                <Info className="size-4" aria-hidden />
              </Button>
            </div>
          )}

          {/* Save */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              <Save className="mr-1 inline size-3" aria-hidden />
              Save is {result.valid ? "ready" : "disabled until the form is valid"}.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={!result.valid || saving}
              className="h-11 w-full sm:w-auto"
              aria-keyshortcuts="Enter"
            >
              {saving ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  Save entry
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Parse the household input. Returns null when empty, NaN when not parseable. */
function parseHouseholds(s: string): number | null {
  if (s.trim() === "") return null;
  // Only digits reach this point because we strip non-digits on change.
  const n = Number(s);
  if (Number.isNaN(n)) return Number.NaN;
  // Treat as integer; floor to be safe.
  return Math.floor(n);
}
