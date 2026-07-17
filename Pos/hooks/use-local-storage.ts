"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageQueue<T>(key: string, initialValue: T[]) {
  const [queue, setQueue] = useState<T[]>(initialValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setQueue(JSON.parse(stored) as T[]);
      }
    } catch {
      setQueue(initialValue);
    }
  }, [key, initialValue]);

  const persist = useCallback(
    (next: T[]) => {
      setQueue(next);
      localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  const push = useCallback(
    (item: T) => {
      persist([...queue, item]);
    },
    [queue, persist],
  );

  const remove = useCallback(
    (predicate: (item: T) => boolean) => {
      persist(queue.filter((item) => !predicate(item)));
    },
    [queue, persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { queue, push, remove, clear, setQueue: persist };
}
