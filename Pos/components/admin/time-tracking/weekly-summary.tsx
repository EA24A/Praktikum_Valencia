"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WeeklySummaryItem } from "@/lib/actions/time-entries";

interface WeeklySummaryProps {
  summary: WeeklySummaryItem[];
}

export function WeeklySummary({ summary }: WeeklySummaryProps) {
  const t = useTranslations("timeTracking");

  if (summary.length === 0) {
    return null;
  }

  const totalHours = summary.reduce((sum, item) => sum + item.totalHours, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("weeklySummary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employee")}</TableHead>
              <TableHead className="text-right">{t("entries")}</TableHead>
              <TableHead className="text-right">{t("openEntries")}</TableHead>
              <TableHead className="text-right">{t("totalHours")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((item) => (
              <TableRow key={item.userId}>
                <TableCell className="font-medium">{item.userName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.entriesCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.openEntries}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t("durationHours", { hours: item.totalHours.toFixed(1) })}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">{t("grandTotal")}</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right font-semibold tabular-nums">
                {t("durationHours", { hours: totalHours.toFixed(1) })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
