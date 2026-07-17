"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PosTable } from "@/types";

interface ConvertOrderTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "to-table" | "to-takeaway";
  tables: PosTable[];
  currentOrderId?: string | null;
  loading?: boolean;
  onConfirm: (tableId?: string) => void;
}

export function ConvertOrderTypeDialog({
  open,
  onOpenChange,
  mode,
  tables,
  currentOrderId,
  loading,
  onConfirm,
}: ConvertOrderTypeDialogProps) {
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const [tableId, setTableId] = useState<string>("");

  const availableTables = useMemo(
    () =>
      tables.filter(
        (table) =>
          !table.hasOpenOrder || table.openOrderId === currentOrderId,
      ),
    [tables, currentOrderId],
  );

  useEffect(() => {
    if (!open) {
      setTableId("");
      return;
    }
    if (mode === "to-table" && availableTables.length > 0) {
      setTableId(availableTables[0]!.id);
    }
  }, [open, mode, availableTables]);

  const handleConfirm = () => {
    if (mode === "to-table") {
      if (!tableId) return;
      onConfirm(tableId);
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "to-table" ? tp("convertToTableTitle") : tp("convertToTakeawayTitle")}
          </DialogTitle>
        </DialogHeader>

        {mode === "to-table" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {tp("convertToTableDescription")}
            </p>
            {availableTables.length === 0 ? (
              <p className="text-sm text-destructive">{tp("convertNoFreeTables")}</p>
            ) : (
              <div className="space-y-2">
                <Label>{tp("convertSelectTable")}</Label>
                <Select
                  value={tableId}
                  onValueChange={(value) => {
                    if (value != null) setTableId(value);
                  }}
                >
                  <SelectTrigger className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {tp("tableLabel")} {table.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {tp("convertToTakeawayDescription")}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            disabled={
              loading ||
              (mode === "to-table" && (availableTables.length === 0 || !tableId))
            }
            onClick={handleConfirm}
          >
            {mode === "to-table" ? tp("convertToTableConfirm") : tp("convertToTakeawayConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
