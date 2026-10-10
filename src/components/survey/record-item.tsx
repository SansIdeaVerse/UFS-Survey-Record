"use client";

import * as React from "react";
import { Check, Copy, MapPin, MapPinOff, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/survey/clipboard";
import { deleteRecord } from "@/lib/survey/db";
import { formatLatLng, formatRelative, formatTimestamp } from "@/lib/survey/format";
import type { LocationStatus, SurveyRecord } from "@/lib/survey/types";

interface RecordItemProps {
  record: SurveyRecord;
  index: number;
  onDeleted?: (id: string) => void;
}

const STATUS_LABEL: Record<LocationStatus, string> = {
  ok: "Location captured",
  denied: "Location permission denied",
  unavailable: "Location unavailable",
  timeout: "Location timed out",
};

export function RecordItem({ record, index, onDeleted }: RecordItemProps) {
  const [copied, setCopied] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    // Copy the raw stored name — exactly, with no extra formatting.
    const ok = await copyText(record.name);
    if (ok) {
      setCopied(true);
      toast.success("Name copied", { description: record.name });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Couldn't copy. Please select the text manually.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRecord(record.id);
      onDeleted?.(record.id);
      toast.success("Record deleted", {
        description: `${record.name} removed from this device.`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete", {
        description: "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  }

  const hasLocation = record.location_status === "ok";

  return (
    <li
      className={cn(
        "group relative flex flex-col gap-3 border-b p-4 last:border-b-0 transition-colors hover:bg-accent/40",
        deleting && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums"
          aria-hidden
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-medium" title={record.name}>
              {record.name}
            </p>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Copy name"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied" : "Copy name"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">Households</dt>
              <dd className="tabular-nums">
                {record.households} {record.households === 1 ? "hh" : "hhs"}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              {hasLocation ? (
                <MapPin className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <MapPinOff className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              )}
              <dt className="sr-only">Location</dt>
              <dd
                className="truncate"
                title={hasLocation ? formatLatLng(record.latitude, record.longitude) : STATUS_LABEL[record.location_status]}
              >
                {hasLocation ? formatLatLng(record.latitude, record.longitude) : STATUS_LABEL[record.location_status]}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="sr-only">Captured</dt>
              <dd>
                <time dateTime={record.captured_at} title={formatTimestamp(record.captured_at)}>
                  {formatRelative(record.captured_at)}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        <AlertDialog>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deleting}
                    className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete record for ${record.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete record</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this record?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the entry for{" "}
                <span className="font-medium text-foreground">{record.name}</span>{" "}
                ({record.households} {record.households === 1 ? "household" : "households"})
                from this device. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
