"use client";

const QUEUE_KEY = "casapos_sync_queue";

export type QueuedMutationType =
  | "CREATE_ORDER"
  | "UPDATE_ORDER"
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "PAY_ORDER";

export type QueuedMutationStatus = "pending" | "syncing" | "failed";

export interface QueuedMutation {
  id: string;
  type: QueuedMutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: QueuedMutationStatus;
  error?: string;
}

function readQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getSyncQueue(): QueuedMutation[] {
  return readQueue();
}

export function enqueueMutation(
  type: QueuedMutationType,
  payload: Record<string, unknown>,
): QueuedMutation {
  const mutation: QueuedMutation = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: "pending",
  };
  const queue = readQueue();
  queue.push(mutation);
  writeQueue(queue);
  return mutation;
}

export function updateMutation(id: string, updates: Partial<QueuedMutation>) {
  const queue = readQueue().map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  );
  writeQueue(queue);
}

export function removeMutation(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearFailedMutations() {
  writeQueue(readQueue().filter((item) => item.status !== "failed"));
}

export function clearSyncQueue() {
  writeQueue([]);
}

export async function processSyncQueue(
  processor: (mutation: QueuedMutation) => Promise<void>,
): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  const queue = readQueue();

  for (const mutation of queue) {
    if (mutation.status === "failed" && mutation.retryCount >= 3) {
      failed++;
      continue;
    }

    updateMutation(mutation.id, { status: "syncing" });

    try {
      await processor(mutation);
      removeMutation(mutation.id);
      synced++;
    } catch (error) {
      const retryCount = mutation.retryCount + 1;
      updateMutation(mutation.id, {
        status: retryCount >= 3 ? "failed" : "pending",
        retryCount,
        error: error instanceof Error ? error.message : "Sync failed",
      });
      failed++;
    }
  }

  return { synced, failed };
}
