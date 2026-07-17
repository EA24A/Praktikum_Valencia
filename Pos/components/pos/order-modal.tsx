"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderPanel } from "@/components/pos/order-panel";
import { ProductMenu } from "@/components/pos/product-menu";
import type { CartItem } from "@/stores/pos-store";
import type { PosDiscount } from "@/lib/actions/discounts";
import type { PosCategory, PosOrderType, PosProduct, PosTable } from "@/types";
import type { CustomProductInput } from "@/components/pos/custom-product-dialog";
import type { SplitItemAssignment } from "@/lib/split-bill";

interface OrderModalProps {
  open: boolean;
  onCloseOrder: () => void;
  items: CartItem[];
  discounts: PosDiscount[];
  appliedDiscountId: string | null;
  orderType: PosOrderType;
  tableNumber?: string;
  selectedOrderId?: string | null;
  tables?: PosTable[];
  isSplitBill: boolean;
  splitCount: number;
  paidSplitIndices?: number[];
  discountTotal: number;
  categories: PosCategory[];
  loading?: boolean;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onUpdatePrice: (itemId: string, unitPrice: number) => void;
  onVoidItem: (itemId: string, itemName: string) => void;
  onApplyDiscount: (discountId: string) => void;
  onToggleSplit: (enabled: boolean) => void;
  onPaySplit: (
    splitIndex: number,
    splitCount: number,
    assignments: SplitItemAssignment[],
  ) => void;
  onConvertOrderType: (input: {
    type: "DINE_IN" | "TAKEAWAY";
    tableId?: string;
  }) => void;
  onAddProduct: (product: PosProduct) => void;
  onAddCustomProduct: (input: CustomProductInput) => void | Promise<void>;
  onPay: () => void;
  onConfirmOnline?: () => void;
  onCancelOrder: () => void;
}

export function OrderModal({
  open,
  onCloseOrder,
  onCancelOrder,
  onConfirmOnline,
  categories,
  onAddProduct,
  onAddCustomProduct,
  loading,
  ...orderPanelProps
}: OrderModalProps) {
  const tp = useTranslations("pos");
  const handleOpenChange = (next: boolean) => {
    if (!next && open) {
      onCloseOrder();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal="trap-focus" disablePointerDismissal>
      <DialogContent
        showCloseButton
        className="!flex h-[min(92dvh,900px)] max-h-[92dvh] w-[min(96vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          {orderPanelProps.orderType === "ONLINE"
            ? tp("orderModalTitleOnline")
            : orderPanelProps.tableNumber
              ? tp("orderModalTitleTable", { number: orderPanelProps.tableNumber })
              : tp("orderModalTitleTakeaway")}
        </DialogTitle>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <section className="flex h-full min-h-0 w-full flex-col overflow-hidden border-b md:w-1/2 md:flex-1 md:border-b-0 md:border-r">
            <OrderPanel
              {...orderPanelProps}
              hasOrder
              layout="modal"
              loading={loading}
              onSaveTicket={onCloseOrder}
              onCancelOrder={onCancelOrder}
              onConfirmOnline={onConfirmOnline}
              onPay={orderPanelProps.onPay}
            />
          </section>
          <section className="flex h-full min-h-0 w-full flex-col overflow-hidden md:w-1/2 md:flex-1">
            <ProductMenu
              categories={categories}
              onAddProduct={onAddProduct}
              onAddCustomProduct={onAddCustomProduct}
              disabled={loading}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
