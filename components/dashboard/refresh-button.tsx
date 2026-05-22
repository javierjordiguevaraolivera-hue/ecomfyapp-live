"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const AUTO_REFRESH_MS = 2 * 60 * 1000;

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearRefreshTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  };

  const scheduleAutoRefresh = () => {
    clearRefreshTimeout();
    timeoutRef.current = window.setTimeout(() => {
      refresh();
    }, AUTO_REFRESH_MS);
  };

  const refresh = () => {
    setIsRefreshing(true);
    router.refresh();
    window.setTimeout(() => setIsRefreshing(false), 700);
    scheduleAutoRefresh();
  };

  useEffect(() => {
    scheduleAutoRefresh();

    return clearRefreshTimeout;
  }, []);

  return (
    <Button
      aria-label="Refresh data"
      onClick={refresh}
      size="icon"
      type="button"
      variant="outline"
    >
      <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
    </Button>
  );
}
