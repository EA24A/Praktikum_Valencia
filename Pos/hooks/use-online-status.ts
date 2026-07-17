"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSyncQueue,
  processSyncQueue,
  type QueuedMutation,
} from "@/lib/offline-queue";

async function pingServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshQueueLength = useCallback(() => {
    setSyncQueueLength(getSyncQueue().filter((m) => m.status !== "failed").length);
  }, []);

  const syncQueue = useCallback(
    async (processor?: (mutation: QueuedMutation) => Promise<void>) => {
      if (!processor) return { synced: 0, failed: 0 };
      setIsSyncing(true);
      try {
        const result = await processSyncQueue(processor);
        refreshQueueLength();
        return result;
      } finally {
        setIsSyncing(false);
      }
    },
    [refreshQueueLength],
  );

  useEffect(() => {
    refreshQueueLength();

    const handleOnline = async () => {
      const reachable = await pingServer();
      setIsOnline(reachable);
    };

    const handleOffline = () => setIsOnline(false);

    const checkStatus = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      setIsOnline(await pingServer());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    checkStatus();

    const interval = setInterval(checkStatus, 30000);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [refreshQueueLength]);

  return {
    isOnline,
    syncQueueLength,
    isSyncing,
    syncQueue,
    refreshQueueLength,
  };
}
