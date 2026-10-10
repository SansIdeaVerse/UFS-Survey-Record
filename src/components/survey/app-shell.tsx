"use client";

import * as React from "react";
import { ClipboardList, FilePlus2, ShieldCheck } from "lucide-react";
import { OnlineBadge } from "./online-badge";
import { ThemeToggle } from "./theme-toggle";
import { EntryForm } from "./entry-form";
import { RecordList } from "./record-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listRecords } from "@/lib/survey/db";
import type { SurveyRecord } from "@/lib/survey/types";

type Tab = "entry" | "records";

/**
 * The whole survey app: header with online badge and theme toggle, plus a
 * desktop top-nav and a mobile bottom tab bar for switching between the
 * entry form and the records list.
 */
export function AppShell() {
  const [tab, setTab] = React.useState<Tab>("entry");
  const [records, setRecords] = React.useState<SurveyRecord[]>([]);
  const [refreshSignal, setRefreshSignal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Load records from IndexedDB on mount and whenever refreshSignal changes.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listRecords();
        if (!cancelled) setRecords(rows);
      } catch (err) {
        console.error("Failed to load records", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  function refresh() {
    setRefreshSignal((n) => n + 1);
  }

  function handleSaved(record: SurveyRecord) {
    setRecords((prev) => [record, ...prev]);
    // Still refresh from DB to ensure consistency (sorting, etc.).
    refresh();
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "entry", label: "New entry", icon: <FilePlus2 className="size-4" aria-hidden /> },
    { id: "records", label: "Records", icon: <ClipboardList className="size-4" aria-hidden />, count: records.length },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header (desktop top nav) */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" aria-hidden />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold">Survey Data Collector</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Offline-first field surveys
              </p>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav aria-label="Sections" className="mx-auto hidden md:flex">
            {tabs.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant={tab === t.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTab(t.id)}
                className="gap-1.5"
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.icon}
                {t.label}
                {typeof t.count === "number" && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                      tab === t.id
                        ? "bg-background text-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <OnlineBadge />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-28 pt-6 md:pb-8">
        {/* Two-column on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* On mobile, only show the active tab's content */}
          <section
            className={cn(
              "lg:block",
              tab === "entry" ? "block" : "hidden",
            )}
            aria-label="New entry"
          >
            <EntryForm onSaved={(rec) => {
              handleSaved(rec);
              setTab("records");
            }} />
          </section>

          <section
            className={cn(
              "lg:block",
              tab === "records" ? "block" : "hidden",
            )}
            aria-label="Records"
          >
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Loading records…
              </div>
            ) : (
              <RecordList
                records={records}
                refreshSignal={refreshSignal}
                onRefresh={refresh}
              />
            )}
          </section>
        </div>

        {/* Privacy note */}
        <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
          All records stay on this device — nothing is uploaded. Clearing your
          browser data or private browsing will erase them. Export to CSV regularly.
        </p>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  {t.icon}
                  {typeof t.count === "number" && t.count > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
                      aria-label={`${t.count} records`}
                    >
                      {t.count}
                    </span>
                  )}
                </span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
