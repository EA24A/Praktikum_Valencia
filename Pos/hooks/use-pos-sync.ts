"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { QueuedMutation } from "@/lib/offline-queue";
import type { SplitItemAssignment } from "@/lib/split-bill";
import type { PosOrderType } from "@/types";
import {
  addOrderItemApi,
  addCustomOrderItemApi,
  applyDiscountApi,
  configureSplitApi,
  convertOrderTypeApi,
  createOrderApi,
  payOrderApi,
  updateItemQtyApi,
  updateItemPriceApi,
  setPayableTotalApi,
  voidOrderItemApi,
} from "@/lib/pos-client";

export function usePosSyncProcessor() {
  return useCallback(async (mutation: QueuedMutation) => {
    const { type, payload } = mutation;

    if (type === "CREATE_ORDER") {
      await createOrderApi(
        payload.type as PosOrderType,
        payload.tableId as string | null | undefined,
      );
      return;
    }

    if (type === "UPDATE_ORDER") {
      const orderId = payload.orderId as string;
      const action = payload.action as string;

      if (action === "add") {
        await addOrderItemApi(orderId, payload.productId as string);
      } else if (action === "addCustom") {
        await addCustomOrderItemApi(orderId, {
          name: payload.name as string,
          price: payload.price as number,
          taxRate: payload.taxRate as number,
          reason: payload.reason as string,
        });
      } else if (action === "update") {
        await updateItemQtyApi(orderId, payload.itemId as string, payload.quantity as number);
      } else if (action === "updatePrice") {
        await updateItemPriceApi(
          orderId,
          payload.itemId as string,
          payload.unitPrice as number,
        );
      } else if (action === "setTotal") {
        await setPayableTotalApi(
          orderId,
          payload.total as number,
          payload.splitIndex as number | null | undefined,
        );
      } else if (action === "void") {
        await voidOrderItemApi(orderId, payload.itemId as string, payload.voidReason as string);
      } else if (action === "discount") {
        await applyDiscountApi(orderId, payload.discountId as string);
      } else if (action === "split") {
        await configureSplitApi(orderId, {
          isSplitBill: payload.isSplitBill as boolean,
          splitCount: payload.splitCount as number | undefined,
          assignments: payload.assignments as SplitItemAssignment[] | undefined,
        });
      } else if (action === "convertType") {
        await convertOrderTypeApi(orderId, {
          type: payload.type as "DINE_IN" | "TAKEAWAY",
          tableId: payload.tableId as string | null | undefined,
        });
      }
      return;
    }

    if (type === "PAY_ORDER") {
      await payOrderApi(
        payload.orderId as string,
        payload.paymentMethod as "CASH" | "CARD",
        {
          cardReference: payload.cardReference as string | undefined,
          amountTendered: payload.amountTendered as number | undefined,
          splitIndex: payload.splitIndex as number | undefined,
        },
      );
      return;
    }

    throw new Error(`Unknown mutation type: ${type}`);
  }, []);
}

export function showPosError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  toast.error(message);
}
