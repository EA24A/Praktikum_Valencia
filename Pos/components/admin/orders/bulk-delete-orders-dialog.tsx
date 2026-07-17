"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { bulkDeleteOrders } from "@/lib/actions/orders";

interface BulkDeleteOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkDeleteOrdersDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkDeleteOrdersDialogProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await bulkDeleteOrders(selectedIds);
      if (!result.success) {
        const errorKey = result.error.toLowerCase() as
          | "forbidden"
          | "invalid_status"
          | "invalid_amount";
        toast.error(result.message ?? t(`errors.${errorKey}`));
        return;
      }

      toast.success(t("bulkDeleteSuccess", { count: result.deleted }));
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(t("bulkDeleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("bulkDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("bulkDeleteDescription", { count: selectedIds.length })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("bulkDeleteWorking") : t("bulkDeleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
