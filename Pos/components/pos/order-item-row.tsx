"use client";

import { useEffect, useRef, useState } from "react";
import { Euro, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EditItemPriceDialog } from "@/components/pos/edit-item-price-dialog";
import type { CartItem } from "@/stores/pos-store";

interface OrderItemRowProps {
  item: CartItem;
  name: string;
  loading?: boolean;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onUpdatePrice: (itemId: string, unitPrice: number) => void;
  onVoidItem: (itemId: string, name: string) => void;
}

export function OrderItemRow({
  item,
  name,
  loading,
  onUpdateQty,
  onUpdatePrice,
  onVoidItem,
}: OrderItemRowProps) {
  const [qtyInput, setQtyInput] = useState(String(item.quantity));
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const qtyEditingRef = useRef(false);

  useEffect(() => {
    if (!qtyEditingRef.current) {
      setQtyInput(String(item.quantity));
    }
  }, [item.quantity]);

  const commitQty = () => {
    const parsed = parseInt(qtyInput, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setQtyInput(String(item.quantity));
      return;
    }
    if (parsed !== item.quantity) {
      onUpdateQty(item.id, parsed);
    }
  };

  if (item.isVoided) {
    return (
      <li className="rounded-xl border border-dashed bg-muted/40 p-3 opacity-60">
        <div className="flex justify-between gap-2 line-through">
          <span className="font-medium">{name}</span>
          <CurrencyDisplay amount={item.total} />
        </div>
      </li>
    );
  }

  return (
    <>
      <li className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <CurrencyDisplay amount={item.unitPrice} /> × {item.quantity}
            </p>
            {item.isCustom && item.customReason ? (
              <p className="mt-1 text-xs text-muted-foreground italic">
                {item.customReason}
              </p>
            ) : null}
          </div>
          <CurrencyDisplay amount={item.total} className="text-lg font-bold tabular-nums" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
            disabled={loading || item.quantity <= 1}
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Input
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            value={qtyInput}
            disabled={loading}
            className="h-11 w-16 shrink-0 rounded-lg text-center text-lg font-bold tabular-nums"
            onChange={(e) => setQtyInput(e.target.value)}
            onFocus={() => {
              qtyEditingRef.current = true;
            }}
            onBlur={() => {
              qtyEditingRef.current = false;
              commitQty();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
            disabled={loading}
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
            disabled={loading}
            onClick={() => setPriceDialogOpen(true)}
          >
            <Euro className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-11 w-11 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
            disabled={loading}
            onClick={() => onVoidItem(item.id, name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </li>

      <EditItemPriceDialog
        open={priceDialogOpen}
        itemName={name}
        currentPrice={item.unitPrice}
        loading={loading}
        onOpenChange={setPriceDialogOpen}
        onConfirm={(unitPrice) => onUpdatePrice(item.id, unitPrice)}
      />
    </>
  );
}
