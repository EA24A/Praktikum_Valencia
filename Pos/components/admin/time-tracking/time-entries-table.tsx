"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TimeEntryListItem } from "@/lib/actions/time-entries";
import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";

interface TimeEntriesTableProps {
  entries: TimeEntryListItem[];
  onEdit: (entry: TimeEntryListItem) => void;
}

export function TimeEntriesTable({ entries, onEdit }: TimeEntriesTableProps) {
  const t = useTranslations("timeTracking");
  const tc = useTranslations("common");

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("noEntries")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("employee")}</TableHead>
            <TableHead>{t("clockIn")}</TableHead>
            <TableHead>{t("clockOut")}</TableHead>
            <TableHead className="text-right">{t("duration")}</TableHead>
            <TableHead>{t("note")}</TableHead>
            <TableHead className="text-right">{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {entry.userName}
                  {entry.isOpen && (
                    <Badge variant="secondary">{t("openEntry")}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{format(parseISO(entry.clockIn), "PPp")}</TableCell>
              <TableCell>
                {entry.clockOut
                  ? format(parseISO(entry.clockOut), "PPp")
                  : tc("empty")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {t("durationHours", { hours: entry.durationHours.toFixed(2) })}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {entry.note ?? tc("empty")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(entry)}
                  aria-label={tc("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
