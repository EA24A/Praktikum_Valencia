"use client";

import { useState } from "react";
import type {
  ComboProductOption,
  PosDiscount,
} from "@/lib/actions/discounts";
import { DiscountForm } from "./discount-form";
import { DiscountList } from "./discount-list";

interface DiscountsManagerProps {
  initialDiscounts: PosDiscount[];
  products: ComboProductOption[];
}

export function DiscountsManager({
  initialDiscounts,
  products,
}: DiscountsManagerProps) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [editingDiscount, setEditingDiscount] = useState<PosDiscount | null>(
    null,
  );

  function upsertDiscount(discount: PosDiscount) {
    setDiscounts((current) => {
      const index = current.findIndex((item) => item.id === discount.id);
      if (index === -1) {
        return [discount, ...current];
      }
      const next = [...current];
      next[index] = discount;
      return next;
    });
  }

  function handleFormSuccess(discount: PosDiscount) {
    upsertDiscount(discount);
    setEditingDiscount(null);
  }

  function handleEdit(discount: PosDiscount) {
    setEditingDiscount(discount);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <DiscountForm
        key={editingDiscount?.id ?? "new"}
        products={products}
        editingDiscount={editingDiscount}
        onSuccess={handleFormSuccess}
        onCancelEdit={() => setEditingDiscount(null)}
      />
      <DiscountList
        discounts={discounts}
        onEdit={handleEdit}
        onToggle={upsertDiscount}
      />
    </div>
  );
}
