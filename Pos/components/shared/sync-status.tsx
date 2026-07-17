"use client";

import { useTranslations } from "next-intl";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function SyncStatus() {
  const t = useTranslations("common");
  const { syncQueueLength, isSyncing } = useOnlineStatus();

  if (syncQueueLength === 0) {
    return null;
  }

  return (
    <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      {isSyncing
        ? t("loading")
        : t("syncPending", { count: syncQueueLength })}
    </div>
  );
}
