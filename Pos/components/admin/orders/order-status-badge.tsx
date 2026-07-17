"use client";

import { useTranslations } from "next-intl";
import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const t = useTranslations("orders.statuses");

  const labelKey = {
    OPEN: "open",
    PAID: "paid",
    CANCELLED: "cancelled",
  }[status] as "open" | "paid" | "cancelled";

  return (
    <Badge variant={statusVariant[status]} className={cn(className)}>
      {t(labelKey)}
    </Badge>
  );
}
