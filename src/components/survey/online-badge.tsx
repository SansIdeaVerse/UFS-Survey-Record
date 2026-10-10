"use client";

import * as React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * Online / offline indicator. For reassurance only — does not block actions.
 */
export function OnlineBadge({ className }: { className?: string }) {
  const online = useOnlineStatus();
  return (
    <Badge
      variant={online ? "secondary" : "outline"}
      className={cn("gap-1.5 font-normal", !online && "text-amber-600 dark:text-amber-400", className)}
      aria-live="polite"
    >
      {online ? (
        <Wifi className="size-3" aria-hidden />
      ) : (
        <WifiOff className="size-3" aria-hidden />
      )}
      <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
      <span className="sm:hidden">{online ? "Online" : "Offline"}</span>
    </Badge>
  );
}
