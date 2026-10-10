"use client";

import * as React from "react";
import { Download, Inbox, Trash2, ListChecks } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecordItem } from "./record-item";
import { clearAll, listRecords } from "@/lib/survey/db";
import { downloadCsv } from "@/lib/survey/csv";
import type { SurveyRecord } from "@/lib/survey/types";

interface RecordListProps {
  records: SurveyRecord[];
  refreshSignal: number;
  onRefresh: () => void;
}

export function RecordList({ records, refreshSignal, onRefresh }: RecordListProps) {
  const [exporting, setExporting] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  const hasRecords = records.length > 0;

  async function handleExport() {
    if (!hasRecords) {
      toast.message("Nothing to export", {
        description: "Save at least one record first.",
      });
      return;
    }
    setExporting(true);
    try {
      // Pull a fresh copy straight from the database to be safe.
      const rows = await listRecords();
      const ok = downloadCsv(rows);
      if (ok) {
        toast.success("Exported", {
          description: `${rows.length} record${rows.length === 1 ? "" : "s"} saved as CSV.`,
        });
      } else {
        toast.error("Download blocked", {
          description: "Your browser blocked the download. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't export", {
        description: "Please try again.",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    try {
      await clearAll();
      onRefresh();
      toast.success("All records cleared", {
        description: "This device no longer holds any survey data.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't clear data", {
        description: "Please try again.",
      });
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <CardHeader className="gap-2 border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="size-4 text-primary" aria-hidden />
              Records
            </CardTitle>
            <CardDescription>
              {records.length} {records.length === 1 ? "entry" : "entries"} stored on this device
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!hasRecords || exporting}
              className="h-9"
            >
              <Download className="size-4" aria-hidden />
              Export CSV
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasRecords || clearing}
                  className="h-9 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all records?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every record stored on this device.
                    Consider exporting to CSV first — this cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Clear everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {hasRecords ? (
          <ScrollArea className="h-[calc(100vh-22rem)] min-h-64 max-h-[44rem]">
            <ol className="divide-y-0">
              {records.map((r, i) => (
                <RecordItem
                  key={r.id}
                  record={r}
                  index={i}
                  onDeleted={() => onRefresh()}
                />
              ))}
            </ol>
          </ScrollArea>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No records yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Add your first survey visit from the New entry tab. Records stay on
          this device even when you go offline.
        </p>
      </div>
    </div>
  );
}
