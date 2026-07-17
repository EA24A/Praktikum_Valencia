"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderDetail, OrderListFilters, OrderSummary } from "@/lib/actions/orders";
import { BulkDeleteOrdersDialog } from "./bulk-delete-orders-dialog";
import { OrderDetailModal } from "./order-detail-modal";
import { OrderFilters, type FilterOption } from "./order-filters";
import { OrdersTable } from "./orders-table";
import { RefundDialog } from "./refund-dialog";

interface OrdersManagerProps {
  tables: FilterOption[];
  employees: FilterOption[];
}

function buildQuery(filters: OrderListFilters) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.tableId) params.set("tableId", filters.tableId);
  if (filters.employeeId) params.set("employeeId", filters.employeeId);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  return params.toString();
}

export function OrdersManager({ tables, employees }: OrdersManagerProps) {
  const t = useTranslations("orders");
  const [filters, setFilters] = useState<OrderListFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<OrderListFilters>({});
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const fetchOrders = useCallback(async (nextFilters: OrderListFilters) => {
    setIsLoading(true);
    try {
      const query = buildQuery(nextFilters);
      const response = await fetch(query ? `/api/orders?${query}` : "/api/orders");
      if (!response.ok) {
        setOrders([]);
        return;
      }
      const data = (await response.json()) as { orders: OrderSummary[] };
      setOrders(data.orders);
      setSelectedIds((current) =>
        current.filter((id) => data.orders.some((order) => order.id === id)),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        setOrderDetail(null);
        return;
      }
      const data = (await response.json()) as { order: OrderDetail };
      setOrderDetail(data.order);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders(appliedFilters);
  }, [appliedFilters, fetchOrders]);

  const handleViewOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
    await fetchOrderDetail(orderId);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters({});
    setAppliedFilters({});
  };

  const refreshAfterRefund = async () => {
    await fetchOrders(appliedFilters);
    if (selectedOrderId) {
      await fetchOrderDetail(selectedOrderId);
    }
  };

  const handleBulkDeleteSuccess = async () => {
    setSelectedIds([]);
    if (selectedOrderId && selectedIds.includes(selectedOrderId)) {
      setDetailOpen(false);
      setSelectedOrderId(null);
      setOrderDetail(null);
    }
    await fetchOrders(appliedFilters);
  };

  const handleCardReferenceUpdated = (
    orderId: string,
    update: {
      cardReference?: string | null;
      splitIndex?: number;
      splitPayments?: OrderDetail["splitPayments"];
      splitPaymentSlots?: OrderDetail["splitPaymentSlots"];
    },
  ) => {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        const nextSlots =
          update.splitPaymentSlots ??
          (update.splitIndex != null && update.cardReference !== undefined
            ? order.splitPaymentSlots.map((slot) =>
                slot.splitIndex === update.splitIndex
                  ? {
                      ...slot,
                      cardReference: update.cardReference ?? null,
                      paymentMethod: slot.paymentMethod ?? "CARD",
                    }
                  : slot,
              )
            : order.splitPaymentSlots);
        return {
          ...order,
          cardReference:
            update.cardReference !== undefined
              ? update.cardReference
              : order.cardReference,
          splitPayments: update.splitPayments ?? order.splitPayments,
          splitPaymentSlots: nextSlots,
        };
      }),
    );
    setOrderDetail((current) => {
      if (current?.id !== orderId) return current;
      const nextSlots =
        update.splitPaymentSlots ??
        (update.splitIndex != null && update.cardReference !== undefined
          ? current.splitPaymentSlots.map((slot) =>
              slot.splitIndex === update.splitIndex
                ? {
                    ...slot,
                    cardReference: update.cardReference ?? null,
                    paymentMethod: slot.paymentMethod ?? "CARD",
                  }
                : slot,
            )
          : current.splitPaymentSlots);
      return {
        ...current,
        cardReference:
          update.cardReference !== undefined
            ? update.cardReference
            : current.cardReference,
        splitPayments: update.splitPayments ?? current.splitPayments,
        splitPaymentSlots: nextSlots,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <OrderFilters
        filters={filters}
        tables={tables}
        employees={employees}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("selectedCount", { count: selectedIds.length })}
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("bulkDelete", { count: selectedIds.length })}
          </Button>
        </div>
      )}

      <OrdersTable
        orders={orders}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onViewOrder={handleViewOrder}
        onCardReferenceUpdated={handleCardReferenceUpdated}
        isLoading={isLoading}
      />

      <BulkDeleteOrdersDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkDeleteSuccess}
      />

      <OrderDetailModal
        order={orderDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isLoading={isDetailLoading}
        onIssueRefund={() => setRefundOpen(true)}
        onCardReferenceUpdated={handleCardReferenceUpdated}
      />

      <RefundDialog
        order={orderDetail}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSuccess={refreshAfterRefund}
      />
    </div>
  );
}
