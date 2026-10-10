"use client";

import * as React from "react";

/**
 * Tracks the browser's online / offline status.
 * Returns true when online. SSR-safe (defaults to true until mounted).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Set the real value once on mount.
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
