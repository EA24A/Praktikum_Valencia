"use client";

import { useCallback, useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
}

export function useClockInStatus() {
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/time-entries/status");
      if (response.ok) {
        const data = (await response.json()) as { entry: TimeEntry | null };
        setEntry(data.entry);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!entry || entry.clockOut) {
      setDuration(0);
      return;
    }

    const tick = () => {
      setDuration(differenceInSeconds(new Date(), new Date(entry.clockIn)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [entry]);

  return {
    isClockedIn: !!entry && !entry.clockOut,
    currentEntry: entry,
    duration,
    isLoading,
    refresh: fetchStatus,
  };
}
