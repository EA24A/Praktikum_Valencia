"use client";

import { clearSyncQueue } from "@/lib/offline-queue";

export const REGISTER_CACHE_VERSION_KEY = "casapos_register_cache_version";

export function getStoredRegisterCacheVersion(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(REGISTER_CACHE_VERSION_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function storeRegisterCacheVersion(version: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTER_CACHE_VERSION_KEY, String(version));
}

/** Clear offline queue and mark this terminal as synced with the server cache version. */
export function applyRegisterCacheClear(serverVersion: number) {
  clearSyncQueue();
  storeRegisterCacheVersion(serverVersion);
}

export function shouldClearRegisterCache(serverVersion: number): boolean {
  return serverVersion > getStoredRegisterCacheVersion();
}
