"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { OrderDetail } from "@/lib/actions/orders";

interface EditableCardReferenceProps {
  orderId: string;
  value: string | null;
  splitIndex?: number;
  onSaved: (
    cardReference: string | null,
    meta?: {
      splitPayments?: OrderDetail["splitPayments"];
      splitPaymentSlots?: OrderDetail["splitPaymentSlots"];
    },
  ) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function EditableCardReference({
  orderId,
  value,
  splitIndex,
  onSaved,
  compact = false,
  disabled = false,
}: EditableCardReferenceProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
    }
  }, [value, editing]);

  async function saveReference() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardReference: draft.trim() || null,
          ...(splitIndex != null ? { splitIndex } : {}),
        }),
      });
      if (!res.ok) {
        toast.error(t("cardReferenceUpdateError"));
        return;
      }
      const data = (await res.json()) as {
        cardReference: string | null;
        splitPayments?: OrderDetail["splitPayments"];
        splitPaymentSlots?: OrderDetail["splitPaymentSlots"];
      };
      onSaved(data.cardReference, {
        splitPayments: data.splitPayments,
        splitPaymentSlots: data.splitPaymentSlots,
      });
      setEditing(false);
      toast.success(t("cardReferenceUpdateSuccess"));
    } catch {
      toast.error(t("cardReferenceUpdateError"));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDraft(value ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1", compact ? "min-w-[10rem]" : "max-w-sm")}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("cardReferencePlaceholder")}
          disabled={saving}
          className={cn(compact ? "h-8 text-sm" : "h-9")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void saveReference();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          autoFocus
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={saving}
          onClick={() => void saveReference()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={saving}
          onClick={cancelEdit}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", compact && "min-w-0")}>
      <span className={cn("truncate", compact ? "max-w-[8rem] text-sm" : "font-medium")}>
        {value?.trim() ? value : tc("empty")}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        disabled={disabled || saving}
        onClick={() => setEditing(true)}
        title={t("editCardReference")}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
