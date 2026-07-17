"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface VoidItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export function VoidItemDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading,
}: VoidItemDialogProps) {
  const t = useTranslations("employee");
  const tc = useTranslations("common");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("voidItem")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{itemName}</p>
        <div className="space-y-2">
          <Label htmlFor="void-reason">{t("voidReason")}</Label>
          <Textarea
            id="void-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="min-h-11"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            disabled={!reason.trim() || loading}
            onClick={handleConfirm}
          >
            {t("voidItem")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
