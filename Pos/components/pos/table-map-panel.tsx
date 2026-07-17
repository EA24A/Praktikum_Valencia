"use client";

import { useTranslations } from "next-intl";
import { Globe, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { TableNode } from "@/components/shared/table-node";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PosTable, PosTakeawayOrder } from "@/types";
import type { TableShape } from "@/lib/tables-utils";

const FREE_COLOR = "#22c55e";
const OPEN_COLOR = "#f59e0b";
const SELECTED_OPEN_COLOR = "#ea580c";

interface TableMapPanelProps {
  tables: PosTable[];
  takeawayOrders: PosTakeawayOrder[];
  onlineOrders: PosTakeawayOrder[];
  mapWidth: number;
  mapHeight: number;
  selectedTableId: string | null;
  selectedOrderId: string | null;
  onSelectTable: (tableId: string) => void;
  onSelectTakeaway: (orderId: string) => void;
  onSelectOnline: (orderId: string) => void;
  onTakeaway: () => void;
  onOnline: () => void;
  takeawayActive?: boolean;
  onlineActive?: boolean;
  loading?: boolean;
}

export function TableMapPanel({
  tables,
  takeawayOrders,
  onlineOrders,
  mapWidth,
  mapHeight,
  selectedTableId,
  selectedOrderId,
  onSelectTable,
  onSelectTakeaway,
  onSelectOnline,
  onTakeaway,
  onOnline,
  takeawayActive,
  onlineActive,
  loading,
}: TableMapPanelProps) {
  const t = useTranslations("employee");
  const tp = useTranslations("pos");

  const openTables = tables.filter((table) => table.hasOpenOrder);
  const openTicketCount = openTables.length + takeawayOrders.length + onlineOrders.length;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 md:p-4">
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      <div className="grid w-full max-w-md shrink-0 grid-cols-2 gap-2 self-center">
        <Button
          type="button"
          variant={takeawayActive ? "default" : "outline"}
          className="min-h-12 gap-2 text-base md:min-h-14"
          onClick={onTakeaway}
        >
          <ShoppingBag className="h-5 w-5" />
          {t("takeaway")}
        </Button>
        <Button
          type="button"
          variant={onlineActive ? "default" : "outline"}
          className="min-h-12 gap-2 text-base md:min-h-14"
          onClick={onOnline}
        >
          <Globe className="h-5 w-5" />
          {t("onlineOrder")}
        </Button>
      </div>

      {openTicketCount > 0 && (
        <div className="rounded-xl border bg-amber-50/80 p-2 dark:bg-amber-950/30">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            {tp("openTickets")} ({openTicketCount})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {openTables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable(table.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-background px-2.5 py-1.5 text-left text-xs shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900/50",
                  selectedTableId === table.id && "ring-2 ring-primary",
                )}
              >
                <UtensilsCrossed className="h-3 w-3 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                <span className="font-bold">{tp("tableTicket", { label: table.number })}</span>
                {(table.itemCount ?? 0) > 0 ? (
                  <span className="ml-1 text-muted-foreground">
                    · {table.itemCount} · <CurrencyDisplay amount={table.orderTotal ?? 0} />
                  </span>
                ) : (
                  <span className="ml-1 text-muted-foreground">· {tp("emptyTicket")}</span>
                )}
              </button>
            ))}
            {takeawayOrders.map((order, index) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectTakeaway(order.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-sky-400 bg-background px-2.5 py-1.5 text-left text-xs shadow-sm transition-colors hover:bg-sky-50 dark:border-sky-600 dark:hover:bg-sky-950/50",
                  selectedOrderId === order.id && !selectedTableId && takeawayActive && "ring-2 ring-primary",
                )}
              >
                <ShoppingBag className="h-3 w-3 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
                <span className="font-bold">{tp("takeawayTicket", { number: index + 1 })}</span>
                {order.itemCount > 0 ? (
                  <span className="ml-1 text-muted-foreground">
                    · {order.itemCount} · <CurrencyDisplay amount={order.total} />
                  </span>
                ) : (
                  <span className="ml-1 text-muted-foreground">· {tp("emptyTicket")}</span>
                )}
              </button>
            ))}
            {onlineOrders.map((order, index) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOnline(order.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-violet-400 bg-background px-2.5 py-1.5 text-left text-xs shadow-sm transition-colors hover:bg-violet-50 dark:border-violet-600 dark:hover:bg-violet-950/50",
                  selectedOrderId === order.id && !selectedTableId && onlineActive && "ring-2 ring-primary",
                )}
              >
                <Globe className="h-3 w-3 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden />
                <span className="font-bold">{tp("onlineTicket", { number: index + 1 })}</span>
                {order.itemCount > 0 ? (
                  <span className="ml-1 text-muted-foreground">
                    · {order.itemCount} · <CurrencyDisplay amount={order.total} />
                  </span>
                ) : (
                  <span className="ml-1 text-muted-foreground">· {tp("emptyTicket")}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-muted bg-gradient-to-br from-muted/40 to-muted/10">
        <div className="relative h-full w-full min-h-[280px]">
          {tables.map((table) => {
            const isOpen = !!table.hasOpenOrder;
            const isSelected = selectedTableId === table.id;
            const color = isOpen
              ? isSelected
                ? SELECTED_OPEN_COLOR
                : OPEN_COLOR
              : FREE_COLOR;

            return (
              <div
                key={table.id}
                className="absolute p-0.5"
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  width: `${table.width}%`,
                  height: `${table.height}%`,
                }}
              >
                <TableNode
                  number={table.number}
                  color={color}
                  shape={table.shape as TableShape}
                  selected={isSelected}
                  occupied={isOpen}
                  occupiedLabel={isOpen ? tp("reservedTable") : undefined}
                  itemCount={table.itemCount ?? 0}
                  onClick={() => onSelectTable(table.id)}
                  className="min-h-12 min-w-12"
                />
                {isOpen && (table.orderTotal ?? 0) > 0 && (
                  <div className="pointer-events-none absolute -bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-background text-[10px] shadow">
                      <CurrencyDisplay amount={table.orderTotal!} />
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: FREE_COLOR }} />
          {tp("freeTable")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: OPEN_COLOR }} />
          {tp("reservedTable")}
        </span>
      </div>
    </div>
  );
}
