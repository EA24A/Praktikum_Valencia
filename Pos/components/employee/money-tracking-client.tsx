"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Moon } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CashRegisterSummary } from "@/lib/actions/cash-register";

async function fetchCashRegister(): Promise<CashRegisterSummary> {
  const response = await fetch("/api/cash-register", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load cash register");
  }
  return response.json();
}

async function closeRegisterApi(floatToLeave: number, countedBalance: number) {
  const response = await fetch("/api/cash-register/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ floatToLeave, countedBalance }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error("Failed to close register") as Error & { code?: string };
    error.code = body.error;
    throw error;
  }
  return response.json() as Promise<{
    systemBalance: number;
    countedBalance: number;
    adjustment: number;
    floatLeft: number;
    amountRemoved: number;
  }>;
}

function parseMoneyInput(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function MoneyTrackingClient() {
  const t = useTranslations("moneyTracking");
  const tc = useTranslations("common");
  const [data, setData] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(false);
  const [floatInput, setFloatInput] = useState("");
  const [floatInputTouched, setFloatInputTouched] = useState(false);
  const [countedInput, setCountedInput] = useState("");
  const [countedInputTouched, setCountedInputTouched] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const summary = await fetchCashRegister();
      setData(summary);
      if (!floatInputTouched) {
        setFloatInput(summary.defaultClosingFloat.toFixed(2));
      }
      if (!countedInputTouched) {
        setCountedInput(summary.balance.toFixed(2));
      }
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [floatInputTouched, countedInputTouched]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const floatToLeave = parseMoneyInput(floatInput);
  const countedBalance = parseMoneyInput(countedInput);
  const amountToRemove = useMemo(() => {
    if (countedBalance == null || floatToLeave == null) return null;
    return Math.max(0, countedBalance - floatToLeave);
  }, [countedBalance, floatToLeave]);

  const balanceMismatch = useMemo(() => {
    if (!data || countedBalance == null) return null;
    return Math.round((countedBalance - data.balance) * 100) / 100;
  }, [data, countedBalance]);

  const canClose =
    data != null &&
    floatToLeave != null &&
    countedBalance != null &&
    floatToLeave >= 0 &&
    countedBalance >= 0 &&
    floatToLeave <= countedBalance &&
    !closing;

  const handleCloseDay = async () => {
    if (!canClose || floatToLeave == null || countedBalance == null) return;
    setClosing(true);
    try {
      const result = await closeRegisterApi(floatToLeave, countedBalance);
      if (Math.abs(result.adjustment) >= 0.01) {
        toast.success(
          t("closeDaySuccessAdjusted", {
            removed: result.amountRemoved.toFixed(2),
            float: result.floatLeft.toFixed(2),
            adjustment: Math.abs(result.adjustment).toFixed(2),
          }),
        );
      } else {
        toast.success(
          t("closeDaySuccess", {
            removed: result.amountRemoved.toFixed(2),
            float: result.floatLeft.toFixed(2),
          }),
        );
      }
      setFloatInputTouched(false);
      setCountedInputTouched(false);
      await refresh();
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === "INVALID_INPUT") {
        toast.error(t("closeDayInvalid"));
      } else {
        toast.error(t("closeDayError"));
      }
    } finally {
      setClosing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-destructive">
        {t("loadError")}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("registerBalance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight">
            <CurrencyDisplay amount={data.balance} />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t("balanceHint")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("openingFloat")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              <CurrencyDisplay amount={data.openingFloat} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("openingFloatHint")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("todayCashInRegister")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              <CurrencyDisplay amount={data.todayCashInRegister} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("todayCashInRegisterHint")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("todayCashSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              <CurrencyDisplay amount={data.todayCashSales} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("todayCashSalesHint")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            {t("closeDayTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("closeDayDescription")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="counted-balance">{t("countedBalance")}</Label>
              <Input
                id="counted-balance"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={countedInput}
                onChange={(e) => {
                  setCountedInputTouched(true);
                  setCountedInput(e.target.value);
                }}
                className="min-h-11 text-lg"
              />
              <p className="text-xs text-muted-foreground">{t("countedBalanceHint")}</p>
              {balanceMismatch != null && Math.abs(balanceMismatch) >= 0.01 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t("systemBalanceDiff", {
                    amount: data.balance.toFixed(2),
                    diff:
                      balanceMismatch > 0
                        ? `+${balanceMismatch.toFixed(2)}`
                        : balanceMismatch.toFixed(2),
                  })}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">{t("amountToRemove")}</p>
              <p className="text-xl font-semibold">
                {amountToRemove != null ? (
                  <CurrencyDisplay amount={amountToRemove} />
                ) : (
                  tc("empty")
                )}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closing-float">{t("floatToLeave")}</Label>
            <Input
              id="closing-float"
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={floatInput}
              onChange={(e) => {
                setFloatInputTouched(true);
                setFloatInput(e.target.value);
              }}
              className="min-h-11 max-w-xs text-lg"
            />
            <p className="text-xs text-muted-foreground">{t("floatToLeaveHint")}</p>
          </div>
          <Button
            type="button"
            className="min-h-11 w-full sm:w-auto"
            disabled={!canClose}
            onClick={handleCloseDay}
          >
            {closing ? t("closeDayWorking") : t("closeDayConfirm")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentCashPayments")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("time")}</TableHead>
                  <TableHead>{t("order")}</TableHead>
                  <TableHead className="text-right">{tc("total")}</TableHead>
                  <TableHead className="text-right">{t("received")}</TableHead>
                  <TableHead className="text-right">{t("change")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(payment.paidAt), "HH:mm")}
                    </TableCell>
                    <TableCell>
                      {payment.receiptNumber ??
                        (payment.type === "ONLINE"
                          ? t("onlineOrder")
                          : payment.type === "TAKEAWAY"
                            ? t("takeaway")
                            : payment.tableNumber
                              ? t("tableNumber", { number: payment.tableNumber })
                              : tc("empty"))}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={payment.total} />
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.amountTendered != null ? (
                        <CurrencyDisplay amount={payment.amountTendered} />
                      ) : (
                        tc("empty")
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.changeGiven != null ? (
                        <CurrencyDisplay amount={payment.changeGiven} />
                      ) : (
                        tc("empty")
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
