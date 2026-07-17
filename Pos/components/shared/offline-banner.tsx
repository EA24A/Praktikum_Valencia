"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { SyncStatus } from "@/components/shared/sync-status";

export function OfflineBanner() {
  const t = useTranslations("common");
  const { isOnline, syncQueueLength } = useOnlineStatus();

  if (isOnline && syncQueueLength === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {!isOnline && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>{t("offline")}</AlertDescription>
        </Alert>
      )}
      <SyncStatus />
    </div>
  );
}
