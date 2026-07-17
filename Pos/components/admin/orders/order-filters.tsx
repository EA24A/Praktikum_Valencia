"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderListFilters } from "@/lib/actions/orders";

export interface FilterOption {
  id: string;
  label: string;
}

interface OrderFiltersProps {
  filters: OrderListFilters;
  tables: FilterOption[];
  employees: FilterOption[];
  onChange: (filters: OrderListFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function OrderFilters({
  filters,
  tables,
  employees,
  onChange,
  onApply,
  onReset,
  isLoading,
}: OrderFiltersProps) {
  const t = useTranslations("orders");

  return (
    <div className="grid gap-4 rounded-xl border bg-background p-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="dateFrom">{t("dateFrom")}</Label>
        <Input
          id="dateFrom"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) =>
            onChange({ ...filters, dateFrom: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateTo">{t("dateTo")}</Label>
        <Input
          id="dateTo"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) =>
            onChange({ ...filters, dateTo: event.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>{t("table")}</Label>
        <Select
          value={filters.tableId ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              tableId: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                {table.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("employee")}</Label>
        <Select
          value={filters.employeeId ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              employeeId: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("paymentMethod")}</Label>
        <Select
          value={filters.paymentMethod ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              paymentMethod:
                !value || value === "all"
                  ? undefined
                  : (value as OrderListFilters["paymentMethod"]),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="CASH">{t("paymentMethods.cash")}</SelectItem>
            <SelectItem value="CARD">{t("paymentMethods.card")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
        <Button onClick={onApply} disabled={isLoading}>
          {t("applyFilters")}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={isLoading}>
          {t("resetFilters")}
        </Button>
      </div>
    </div>
  );
}
