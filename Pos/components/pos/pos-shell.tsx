"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useOrderMutationQueue } from "@/hooks/use-order-mutation-queue";
import { usePosSyncProcessor, showPosError } from "@/hooks/use-pos-sync";
import { hydrateOrderFromDetail } from "@/hooks/use-pos-hydrate";
import { enqueueMutation } from "@/lib/offline-queue";
import {
  applyRegisterCacheClear,
  shouldClearRegisterCache,
  storeRegisterCacheVersion,
} from "@/lib/pos-register-cache";
import {
  addOrderItemApi,
  addCustomOrderItemApi,
  applyDiscountApi,
  cancelOrderApi,
  configureSplitApi,
  convertOrderTypeApi,
  createOrderApi,
  emailReceiptApi,
  fetchOrderDetail,
  fetchPosBootstrap,
  orderDetailToCartItems,
  payOrderApi,
  setPayableTotalApi,
  updateItemQtyApi,
  updateItemPriceApi,
  updateLastCardReferenceApi,
  voidOrderItemApi,
} from "@/lib/pos-client";
import { calculateLineItemTax, calculateOrderTotals } from "@/lib/calculations";
import { usePosStore } from "@/stores/pos-store";
import { TableMapPanel } from "@/components/pos/table-map-panel";
import { OrderModal } from "@/components/pos/order-modal";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { VoidItemDialog } from "@/components/pos/void-item-dialog";
import { ReceiptPrint } from "@/components/pos/receipt-print";
import type { CustomProductInput } from "@/components/pos/custom-product-dialog";
import type { PosOrderDetail } from "@/lib/actions/pos-orders";
import { suggestNextCardReference } from "@/lib/card-reference";
import type { SplitItemAssignment } from "@/lib/split-bill";
import { calculateSplitBillSummaries } from "@/lib/split-bill";
import type { PosDiscount } from "@/lib/actions/discounts";
import type { PosProduct, PosTable, PosTakeawayOrder } from "@/types";
import type { CartItem } from "@/stores/pos-store";

function resolveServerItemId(itemId: string, items: CartItem[]): string {
  if (!itemId.startsWith("temp-")) return itemId;

  const tempItem = items.find((entry) => entry.id === itemId);
  if (!tempItem) return itemId;

  const realItem = items.find(
    (entry) =>
      entry.productId === tempItem.productId &&
      !entry.id.startsWith("temp-") &&
      !entry.isVoided &&
      Boolean(entry.isCustom) === Boolean(tempItem.isCustom),
  );

  return realItem?.id ?? itemId;
}

export function PosShell() {
  const t = useTranslations("employee");
  const tp = useTranslations("pos");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { isOnline, syncQueue, refreshQueueLength } = useOnlineStatus();
  const processMutation = usePosSyncProcessor();

  const {
    selectedTableId,
    selectedOrderId,
    orderType,
    items,
    categories,
    tables,
    discountTotal,
    isSplitBill,
    splitCount,
    paidSplitIndices,
    setSelectedTable,
    setSelectedOrder,
    setOrderType,
    setCategories,
    setTables,
    setItems,
    setDiscountTotal,
    setSplitBill,
    clearOrder,
  } = usePosStore();

  const [discounts, setDiscounts] = useState<PosDiscount[]>([]);
  const [takeawayOrders, setTakeawayOrders] = useState<PosTakeawayOrder[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<PosTakeawayOrder[]>([]);
  const [mapSize, setMapSize] = useState({ width: 100, height: 100 });
  const [loading, setLoading] = useState(false);
  const { enqueue: enqueueOrderSync, isPending: orderSyncPending } =
    useOrderMutationQueue();
  const [bootLoading, setBootLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingPaymentSplitIndex, setPendingPaymentSplitIndex] = useState<number | null>(
    null,
  );
  const [voidTarget, setVoidTarget] = useState<{ id: string; name: string } | null>(null);
  const [receiptData, setReceiptData] = useState<{
    order: PosOrderDetail;
    settings: Parameters<typeof ReceiptPrint>[0]["settings"];
    splitIndex?: number | null;
  } | null>(null);
  const [appliedDiscountId, setAppliedDiscountId] = useState<string | null>(null);
  const [receiptEmailEnabled, setReceiptEmailEnabled] = useState(false);
  const [suggestedCardReference, setSuggestedCardReference] = useState<string | null>(
    null,
  );

  const refreshBootstrap = useCallback(async () => {
    const data = await fetchPosBootstrap();
    const serverVersion = data.registerCacheVersion ?? 0;

    if (shouldClearRegisterCache(serverVersion)) {
      applyRegisterCacheClear(serverVersion);
      clearOrder();
      setAppliedDiscountId(null);
      setSelectedOrder(null);
      setSelectedTable(null);
      toast.info(tp("registerCacheCleared"));
    } else {
      storeRegisterCacheVersion(serverVersion);
    }

    setTables(data.tables);
    setTakeawayOrders(data.takeawayOrders);
    setOnlineOrders(data.onlineOrders ?? []);
    setCategories(data.categories);
    setDiscounts(data.discounts.filter((d: PosDiscount) => d.isActive));
    setMapSize({ width: data.mapWidth, height: data.mapHeight });
    setReceiptEmailEnabled(data.receiptEmailEnabled ?? false);
    setSuggestedCardReference(data.suggestedCardReference ?? null);
    return data;
  }, [clearOrder, setSelectedOrder, setSelectedTable, setTables, setCategories, tp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshBootstrap();
      } catch {
        toast.error(tp("loadError"));
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBootstrap, tp]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isOnline) return;
      refreshBootstrap().catch(() => undefined);
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [isOnline, refreshBootstrap]);

  useEffect(() => {
    if (!isOnline) return;
    syncQueue(processMutation).then((result) => {
      if (result.synced > 0) {
        toast.success(tc("syncSuccess", { count: result.synced }));
        refreshBootstrap();
      }
      refreshQueueLength();
    });
  }, [isOnline, syncQueue, processMutation, refreshBootstrap, refreshQueueLength, tc]);

  const loadOrder = useCallback(
    async (orderId: string) => {
      const order = await fetchOrderDetail(orderId);
      hydrateOrderFromDetail(order);
      setAppliedDiscountId(order.discounts[0]?.id ?? null);
    },
    [],
  );

  const handleSelectTable = async (tableId: string) => {
    if (selectedOrderId) {
      await refreshBootstrap();
    }
    setLoading(true);
    try {
      setSelectedTable(tableId);
      setOrderType("DINE_IN");

      const table = tables.find((t) => t.id === tableId) as PosTable & {
        openOrderId?: string;
      };

      if (table?.openOrderId) {
        await loadOrder(table.openOrderId);
        await refreshBootstrap();
      } else if (isOnline) {
        const result = await createOrderApi("DINE_IN", tableId);
        hydrateOrderFromDetail(result.order);
        setAppliedDiscountId(null);
        await refreshBootstrap();
      } else {
        enqueueMutation("CREATE_ORDER", { type: "DINE_IN", tableId });
        setSelectedOrder(null);
        setItems([]);
        setDiscountTotal(0);
        toast.info(tc("offline"));
      }
    } catch (error) {
      showPosError(error, tp("orderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTakeaway = async (orderId: string) => {
    if (selectedOrderId && selectedOrderId !== orderId) {
      await refreshBootstrap();
    }
    setLoading(true);
    try {
      setSelectedTable(null);
      setOrderType("TAKEAWAY");
      await loadOrder(orderId);
      setAppliedDiscountId(null);
      await refreshBootstrap();
    } catch (error) {
      showPosError(error, tp("orderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleTakeaway = async () => {
    setLoading(true);
    try {
      setSelectedTable(null);
      setOrderType("TAKEAWAY");

      if (isOnline) {
        const result = await createOrderApi("TAKEAWAY");
        hydrateOrderFromDetail(result.order);
        setAppliedDiscountId(null);
        await refreshBootstrap();
      } else {
        enqueueMutation("CREATE_ORDER", { type: "TAKEAWAY" });
        setSelectedOrder(null);
        setItems([]);
        setDiscountTotal(0);
        toast.info(tc("offline"));
      }
    } catch (error) {
      showPosError(error, tp("orderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOnline = async (orderId: string) => {
    if (selectedOrderId && selectedOrderId !== orderId) {
      await refreshBootstrap();
    }
    setLoading(true);
    try {
      setSelectedTable(null);
      setOrderType("ONLINE");
      await loadOrder(orderId);
      setAppliedDiscountId(null);
      await refreshBootstrap();
    } catch (error) {
      showPosError(error, tp("orderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleOnline = async () => {
    setLoading(true);
    try {
      setSelectedTable(null);
      setOrderType("ONLINE");

      if (isOnline) {
        const result = await createOrderApi("ONLINE");
        hydrateOrderFromDetail(result.order);
        setAppliedDiscountId(null);
        await refreshBootstrap();
      } else {
        enqueueMutation("CREATE_ORDER", { type: "ONLINE" });
        setSelectedOrder(null);
        setItems([]);
        setDiscountTotal(0);
        toast.info(tc("offline"));
      }
    } catch (error) {
      showPosError(error, tp("orderError"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOnline = async () => {
    if (!selectedOrderId) return;

    if (!isOnline) {
      toast.error(tp("onlineConfirmOffline"));
      return;
    }

    setLoading(true);
    try {
      const result = await payOrderApi(selectedOrderId, "CARD");
      setReceiptData({
        order: result.order,
        settings: result.settings,
        splitIndex: result.splitIndex,
      });
      toast.success(tp("onlineOrderConfirmed"));
      clearOrder();
      setAppliedDiscountId(null);
      await refreshBootstrap();
    } catch (error) {
      showPosError(error, tp("payError"));
    } finally {
      setLoading(false);
    }
  };

  const syncOrderFromServer = async (orderId: string) => {
    const { order } = await fetchOrderDetail(orderId).then((o) => ({ order: o }));
    setItems(orderDetailToCartItems(order));
    setDiscountTotal(order.discountTotal);
    setSplitBill(order.isSplitBill, order.splitCount ?? 2);
    setAppliedDiscountId(order.discounts[0]?.id ?? null);
    await refreshBootstrap();
  };

  const handleAddProduct = async (product: PosProduct) => {
    if (!selectedOrderId && !isOnline) {
      toast.error(tp("noOrder"));
      return;
    }

    const orderId = selectedOrderId;

    if (!orderId) {
      toast.error(tp("noOrder"));
      return;
    }

    const lineTax = calculateLineItemTax({
      unitPrice: product.price,
      quantity: 1,
      taxRate: product.taxRate,
    });

    usePosStore.getState().addOrIncrementProduct({
      id: `temp-${crypto.randomUUID()}`,
      productId: product.id,
      nameEs: product.nameEs,
      nameEn: product.nameEn,
      nameDe: product.nameDe,
      quantity: 1,
      unitPrice: product.price,
      taxRate: product.taxRate,
      ...lineTax,
    });

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "add",
        orderId,
        productId: product.id,
      });
      refreshQueueLength();
      return;
    }

    void enqueueOrderSync(async () => {
      try {
        const { order } = await addOrderItemApi(orderId, product.id);
        hydrateOrderFromDetail(order);
        setAppliedDiscountId(order.discounts[0]?.id ?? null);
        await refreshBootstrap();
      } catch (error) {
        await syncOrderFromServer(orderId);
        showPosError(error, tp("addItemError"));
      }
    });
  };

  const handleAddCustomProduct = async (input: CustomProductInput) => {
    if (!selectedOrderId) {
      toast.error(tp("noOrder"));
      return;
    }

    const orderId = selectedOrderId;
    const lineTax = calculateLineItemTax({
      unitPrice: input.price,
      quantity: 1,
      taxRate: input.taxRate,
    });

    const optimisticId = `temp-${crypto.randomUUID()}`;
    usePosStore.getState().addItem({
      id: optimisticId,
      productId: "custom",
      nameEs: input.name,
      nameEn: input.name,
      nameDe: input.name,
      quantity: 1,
      unitPrice: input.price,
      taxRate: input.taxRate,
      ...lineTax,
      customReason: input.reason,
      isCustom: true,
    });

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "addCustom",
        orderId,
        name: input.name,
        price: input.price,
        taxRate: input.taxRate,
        reason: input.reason,
      });
      refreshQueueLength();
      toast.success(tp("customProductAdded"));
      return;
    }

    setLoading(true);
    try {
      await enqueueOrderSync(async () => {
        const { order } = await addCustomOrderItemApi(orderId, input);
        hydrateOrderFromDetail(order);
        setAppliedDiscountId(order.discounts[0]?.id ?? null);
        await refreshBootstrap();
      });
      toast.success(tp("customProductAdded"));
    } catch (error) {
      await syncOrderFromServer(orderId);
      showPosError(error, tp("customProductError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!selectedOrderId) return;
    setLoading(true);
    try {
      await refreshBootstrap();
      clearOrder();
      toast.success(tp("ticketSaved"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;

    if (!isOnline) {
      toast.error(tp("cancelOffline"));
      return;
    }

    setLoading(true);
    try {
      await cancelOrderApi(selectedOrderId);
      await refreshBootstrap();
      clearOrder();
      toast.success(tp("tableClosed"));
    } catch (error) {
      showPosError(error, tp("cancelError"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId: string, quantity: number) => {
    if (!selectedOrderId) return;

    usePosStore.getState().updateItemQuantity(itemId, quantity);

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "update",
        orderId: selectedOrderId,
        itemId,
        quantity,
      });
      refreshQueueLength();
      return;
    }

    try {
      await enqueueOrderSync(async () => {
        const currentItems = usePosStore.getState().items;
        const resolvedItemId = resolveServerItemId(itemId, currentItems);

        if (resolvedItemId.startsWith("temp-")) {
          throw new Error("ITEM_NOT_SYNCED");
        }

        if (resolvedItemId !== itemId) {
          usePosStore.getState().updateItemQuantity(resolvedItemId, quantity);
        }

        const { order } = await updateItemQtyApi(
          selectedOrderId,
          resolvedItemId,
          quantity,
        );
        hydrateOrderFromDetail(order);
        await refreshBootstrap();
      });
    } catch (error) {
      await syncOrderFromServer(selectedOrderId);
      showPosError(error, tp("updateError"));
    }
  };

  const handleUpdatePrice = async (itemId: string, unitPrice: number) => {
    if (!selectedOrderId) return;

    usePosStore.getState().updateItemUnitPrice(itemId, unitPrice);

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "updatePrice",
        orderId: selectedOrderId,
        itemId,
        unitPrice,
      });
      refreshQueueLength();
      return;
    }

    try {
      await enqueueOrderSync(async () => {
        const currentItems = usePosStore.getState().items;
        const resolvedItemId = resolveServerItemId(itemId, currentItems);

        if (resolvedItemId.startsWith("temp-")) {
          throw new Error("ITEM_NOT_SYNCED");
        }

        const { order } = await updateItemPriceApi(
          selectedOrderId,
          resolvedItemId,
          unitPrice,
        );
        hydrateOrderFromDetail(order);
        await refreshBootstrap();
      });
    } catch (error) {
      await syncOrderFromServer(selectedOrderId);
      showPosError(error, tp("updatePriceError"));
    }
  };

  const handleAdjustTotal = async (targetTotal: number, splitIndex?: number | null) => {
    if (!selectedOrderId) return;

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "setTotal",
        orderId: selectedOrderId,
        total: targetTotal,
        splitIndex,
      });
      refreshQueueLength();
      toast.info(tc("offline"));
      return;
    }

    setLoading(true);
    try {
      const { order } = await setPayableTotalApi(
        selectedOrderId,
        targetTotal,
        splitIndex,
      );
      hydrateOrderFromDetail(order);
      await refreshBootstrap();
    } catch (error) {
      await syncOrderFromServer(selectedOrderId);
      const code = (error as Error & { code?: string }).code;
      if (code === "SPLIT_ALREADY_PAID") {
        toast.error(tp("splitAlreadyPaid"));
      } else if (code === "SPLIT_NO_ITEMS") {
        toast.error(tp("splitNoItems"));
      } else {
        showPosError(error, tp("changeTotalError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoidConfirm = async (reason: string) => {
    if (!voidTarget || !selectedOrderId) return;

    if (!isOnline) {
      usePosStore.getState().voidItem(voidTarget.id);
      enqueueMutation("UPDATE_ORDER", {
        action: "void",
        orderId: selectedOrderId,
        itemId: voidTarget.id,
        voidReason: reason,
      });
      setVoidTarget(null);
      refreshQueueLength();
      return;
    }

    setLoading(true);
    try {
      const { order } = await voidOrderItemApi(selectedOrderId, voidTarget.id, reason);
      hydrateOrderFromDetail(order);
      setVoidTarget(null);
    } catch (error) {
      showPosError(error, tp("voidError"));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async (discountId: string) => {
    if (!selectedOrderId) return;

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "discount",
        orderId: selectedOrderId,
        discountId,
      });
      setAppliedDiscountId(discountId);
      refreshQueueLength();
      toast.info(tc("offline"));
      return;
    }

    setLoading(true);
    try {
      const { order } = await applyDiscountApi(selectedOrderId, discountId);
      hydrateOrderFromDetail(order);
      setAppliedDiscountId(discountId);
      toast.success(tp("discountApplied"));
    } catch (error) {
      showPosError(error, tp("discountError"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSplit = async (enabled: boolean) => {
    if (!selectedOrderId) return;
    setSplitBill(enabled, splitCount);

    if (!enabled) {
      setPaymentOpen(false);
      setPendingPaymentSplitIndex(null);
    }

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "split",
        orderId: selectedOrderId,
        isSplitBill: enabled,
        splitCount,
      });
      refreshQueueLength();
      return;
    }

    setLoading(true);
    try {
      const { order } = await configureSplitApi(selectedOrderId, {
        isSplitBill: enabled,
        splitCount,
      });
      hydrateOrderFromDetail(order);
      if (!enabled) {
        toast.success(tp("splitCancelled"));
      }
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "SPLIT_PAYMENTS_IN_PROGRESS") {
        toast.error(tp("splitPaymentsInProgress"));
      } else {
        showPosError(error, tp("splitError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConvertOrderType = async (input: {
    type: "DINE_IN" | "TAKEAWAY";
    tableId?: string;
  }) => {
    if (!selectedOrderId) return;

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "convertType",
        orderId: selectedOrderId,
        type: input.type,
        tableId: input.tableId ?? null,
      });
      setOrderType(input.type);
      setSelectedTable(input.type === "DINE_IN" ? (input.tableId ?? null) : null);
      refreshQueueLength();
      toast.info(tc("offline"));
      return;
    }

    setLoading(true);
    try {
      const { order } = await convertOrderTypeApi(selectedOrderId, {
        type: input.type,
        tableId: input.tableId ?? null,
      });
      hydrateOrderFromDetail(order);
      await refreshBootstrap();
      toast.success(
        input.type === "TAKEAWAY" ? tp("convertToTakeawaySuccess") : tp("convertToTableSuccess"),
      );
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "TABLE_OCCUPIED") {
        toast.error(tp("convertTableOccupied"));
      } else if (code === "SPLIT_PAYMENTS_IN_PROGRESS") {
        toast.error(tp("splitPaymentsInProgress"));
      } else {
        showPosError(error, tp("convertOrderError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSplitConfig = async (
    count: number,
    assignments: SplitItemAssignment[],
  ) => {
    if (!selectedOrderId) return false;

    setSplitBill(true, count);

    if (!isOnline) {
      enqueueMutation("UPDATE_ORDER", {
        action: "split",
        orderId: selectedOrderId,
        isSplitBill: true,
        splitCount: count,
        assignments,
      });
      refreshQueueLength();
      return true;
    }

    setLoading(true);
    try {
      const { order } = await configureSplitApi(selectedOrderId, {
        isSplitBill: true,
        splitCount: count,
        assignments,
      });
      hydrateOrderFromDetail(order);
      return true;
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "SPLIT_PAYMENTS_IN_PROGRESS") {
        toast.error(tp("splitPaymentsInProgress"));
      } else {
        showPosError(error, tp("splitError"));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePaySplit = async (
    splitIndex: number,
    count: number,
    assignments: SplitItemAssignment[],
  ) => {
    const saved = await saveSplitConfig(count, assignments);
    if (!saved) return;
    setPendingPaymentSplitIndex(splitIndex);
    setPaymentOpen(true);
  };

  const handlePaymentOpenChange = (open: boolean) => {
    setPaymentOpen(open);
    if (!open) {
      setPendingPaymentSplitIndex(null);
    }
  };

  const openNextSplitPayment = (order: PosOrderDetail) => {
    const paidIndices = order.paidSplitIndices ?? [];
    const count = order.splitCount ?? 2;
    const summaries = calculateSplitBillSummaries(
      orderDetailToCartItems(order),
      count,
      order.discountTotal,
    );
    const next = summaries.find(
      (summary) => !paidIndices.includes(summary.splitIndex),
    );
    if (!next) return;
    window.setTimeout(() => {
      setPendingPaymentSplitIndex(next.splitIndex);
      setPaymentOpen(true);
    }, 400);
  };

  const handleManualCardReferenceChange = useCallback(
    async (reference: string) => {
      const trimmed = reference.trim();
      const next = suggestNextCardReference(trimmed);
      setSuggestedCardReference(next);

      if (!isOnline) return;

      try {
        const data = await updateLastCardReferenceApi(trimmed);
        setSuggestedCardReference(data.suggestedCardReference ?? next);
      } catch {
        // Keep local suggestion even if sync fails
      }
    },
    [isOnline],
  );

  const handlePay = async (
    method: "CASH" | "CARD",
    options?: {
      cardReference?: string;
      customerEmail?: string;
      amountTendered?: number;
      splitIndex?: number;
    },
  ) => {
    if (!selectedOrderId) return;

    const cardReference = options?.cardReference;
    const customerEmail = options?.customerEmail;

    if (!isOnline) {
      enqueueMutation("PAY_ORDER", {
        orderId: selectedOrderId,
        paymentMethod: method,
        cardReference: options?.cardReference,
        amountTendered: options?.amountTendered,
        splitIndex: options?.splitIndex,
      });
      setPaymentOpen(false);
      if (method === "CARD" && options?.cardReference?.trim()) {
        setSuggestedCardReference(
          suggestNextCardReference(options.cardReference.trim()),
        );
      }
      if (!isSplitBill) {
        clearOrder();
      }
      toast.info(tc("offline"));
      refreshQueueLength();
      return;
    }

    const paidOrderId = selectedOrderId;
    setLoading(true);
    try {
      const result = await payOrderApi(paidOrderId, method, {
        cardReference: options?.cardReference,
        amountTendered: options?.amountTendered,
        splitIndex: options?.splitIndex,
      });
      setReceiptData({
        order: result.order,
        settings: result.settings,
        splitIndex: result.splitIndex,
      });

      if (result.orderFullyPaid) {
        toast.success(tp("orderPaid"));
        setPaymentOpen(false);
        setPendingPaymentSplitIndex(null);
        clearOrder();
        setAppliedDiscountId(null);
        await refreshBootstrap();
      } else {
        hydrateOrderFromDetail(result.order);
        setPaymentOpen(false);
        setPendingPaymentSplitIndex(null);
        toast.success(
          tp("splitPaid", { number: (result.splitIndex ?? 0) + 1 }),
        );
        openNextSplitPayment(result.order);
      }

      if (method === "CARD") {
        const nextSuggested =
          result.suggestedCardReference ??
          (cardReference?.trim()
            ? suggestNextCardReference(cardReference.trim())
            : null);
        if (nextSuggested) {
          setSuggestedCardReference(nextSuggested);
        }
      }

      window.setTimeout(() => {
        document.body.classList.add("receipt-print-mode");
        window.print();
        window.setTimeout(() => {
          document.body.classList.remove("receipt-print-mode");
          setReceiptData(null);
        }, 800);
      }, 200);

      if (customerEmail && result.settings.receiptEmailEnabled && result.orderFullyPaid) {
        try {
          await emailReceiptApi(paidOrderId, customerEmail, locale);
          toast.success(t("receiptEmailSent"));
        } catch (error) {
          const code = (error as Error & { code?: string }).code;
          if (code === "RESEND_NOT_CONFIGURED") {
            toast.error(t("receiptEmailNotConfigured"));
          } else {
            toast.error(t("receiptEmailFailed"));
          }
        }
      }

      if (result.settings.kitchenPrintingEnabled) {
        toast.info(t("printKitchen"));
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "INSUFFICIENT_TENDER") {
        toast.error(t("insufficientCash"));
      } else if (err.code === "SPLIT_INDEX_REQUIRED") {
        toast.error(tp("splitPaySelectRequired"));
      } else if (err.code === "SPLIT_ALREADY_PAID") {
        toast.error(tp("splitAlreadyPaid"));
      } else if (err.code === "SPLIT_NO_ITEMS") {
        toast.error(tp("splitNoItems"));
      } else {
        showPosError(error, tp("payError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedTable = tables.find((tbl) => tbl.id === selectedTableId);
  const takeawayActive = orderType === "TAKEAWAY" && !selectedTableId;
  const onlineActive = orderType === "ONLINE" && !selectedTableId;
  const orderBusy = loading || orderSyncPending;
  const orderModalOpen = !!selectedOrderId;

  const orderTotal = useMemo(
    () => calculateOrderTotals(items, discountTotal).total,
    [items, discountTotal],
  );

  if (bootLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  return (
    <>
      {receiptData && (
        <ReceiptPrint
          order={receiptData.order}
          settings={receiptData.settings}
          splitIndex={receiptData.splitIndex}
        />
      )}

      <VoidItemDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        itemName={voidTarget?.name ?? ""}
        onConfirm={handleVoidConfirm}
        loading={loading}
      />

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={handlePaymentOpenChange}
        total={orderTotal}
        isSplitBill={isSplitBill}
        splitCount={splitCount}
        paidSplitIndices={paidSplitIndices}
        initialSplitIndex={pendingPaymentSplitIndex}
        items={items}
        discountTotal={discountTotal}
        receiptEmailEnabled={receiptEmailEnabled}
        suggestedCardReference={suggestedCardReference}
        onManualCardReferenceChange={handleManualCardReferenceChange}
        onAdjustTotal={handleAdjustTotal}
        onPay={handlePay}
        loading={loading}
      />

      <OrderModal
        open={orderModalOpen}
        onCloseOrder={handleCloseOrder}
        onCancelOrder={handleCancelOrder}
        items={items}
        discounts={discounts}
        appliedDiscountId={appliedDiscountId}
        orderType={orderType}
        tableNumber={selectedTable?.number}
        selectedOrderId={selectedOrderId}
        tables={tables}
        isSplitBill={isSplitBill}
        splitCount={splitCount}
        paidSplitIndices={paidSplitIndices}
        discountTotal={discountTotal}
        categories={categories}
        loading={orderBusy}
        onUpdateQty={handleUpdateQty}
        onUpdatePrice={handleUpdatePrice}
        onVoidItem={(id, name) => setVoidTarget({ id, name })}
        onApplyDiscount={handleApplyDiscount}
        onToggleSplit={handleToggleSplit}
        onPaySplit={handlePaySplit}
        onConvertOrderType={handleConvertOrderType}
        onAddProduct={handleAddProduct}
        onAddCustomProduct={handleAddCustomProduct}
        onPay={() => setPaymentOpen(true)}
        onConfirmOnline={handleConfirmOnline}
      />

      <div className="h-[calc(100vh-3.5rem)] overflow-hidden max-md:h-[calc(100vh-7rem)]">
        <TableMapPanel
          tables={tables}
          takeawayOrders={takeawayOrders}
          onlineOrders={onlineOrders}
          mapWidth={mapSize.width}
          mapHeight={mapSize.height}
          selectedTableId={selectedTableId}
          selectedOrderId={selectedOrderId}
          onSelectTable={handleSelectTable}
          onSelectTakeaway={handleSelectTakeaway}
          onSelectOnline={handleSelectOnline}
          onTakeaway={handleTakeaway}
          onOnline={handleOnline}
          takeawayActive={takeawayActive}
          onlineActive={onlineActive}
          loading={loading}
        />
      </div>
    </>
  );
}
