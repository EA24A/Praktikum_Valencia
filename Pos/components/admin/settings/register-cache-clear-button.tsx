"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { clearRegisterCache } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

export function RegisterCacheClearButton() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
    startTransition(async () => {
      try {
        await clearRegisterCache();
        toast.success(t("clearRegisterCacheSuccess"));
      } catch {
        toast.error(t("clearRegisterCacheError"));
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClear}
      disabled={isPending}
    >
      {isPending ? tCommon("loading") : t("clearRegisterCache")}
    </Button>
  );
}
