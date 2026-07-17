"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Serializes POS order mutations so API responses cannot overwrite newer cart state.
 */
export function useOrderMutationQueue() {
  const queueRef = useRef(Promise.resolve());
  const [pendingCount, setPendingCount] = useState(0);

  const enqueue = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    setPendingCount((count) => count + 1);

    const run = queueRef.current.catch(() => undefined).then(fn);
    queueRef.current = run.then(
      () => undefined,
      () => undefined,
    );

    return run.finally(() => {
      setPendingCount((count) => Math.max(0, count - 1));
    });
  }, []);

  return { enqueue, isPending: pendingCount > 0, pendingCount };
}
