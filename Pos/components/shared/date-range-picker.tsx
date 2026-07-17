"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { dateFnsLocaleForUi } from "@/lib/ui-locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/lib/actions/reports";

const PRESETS: DateRangePreset[] = [
  "today",
  "yesterday",
  "last7Days",
  "thisMonth",
  "custom",
];

interface DateRangePickerProps {
  from: string;
  to: string;
  preset: DateRangePreset;
}

export function DateRangePicker({ from, to, preset }: DateRangePickerProps) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateLocale = dateFnsLocaleForUi(locale);

  const [open, setOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DayPickerRange | undefined>({
    from: new Date(from),
    to: new Date(to),
  });

  const presetLabels: Record<DateRangePreset, string> = useMemo(
    () => ({
      today: t("today"),
      yesterday: t("yesterday"),
      last7Days: t("last7Days"),
      thisMonth: t("thisMonth"),
      custom: t("custom"),
    }),
    [t],
  );

  function navigate(nextPreset: DateRangePreset, range?: DayPickerRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", nextPreset);

    if (nextPreset === "custom" && range?.from && range?.to) {
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else {
      params.delete("from");
      params.delete("to");
    }

    router.push(`/admin/reports?${params.toString()}`);
  }

  const label =
    preset === "custom"
      ? `${format(new Date(from), "PP", { locale: dateLocale })} – ${format(new Date(to), "PP", { locale: dateLocale })}`
      : presetLabels[preset];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {t("dateRange")}:
      </span>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={preset === p ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (p === "custom") {
                setOpen(true);
              } else {
                navigate(p);
              }
            }}
          >
            {presetLabels[p]}
          </Button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start font-normal",
                preset !== "custom" && "hidden",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={(range) => setCustomRange(range)}
            locale={dateLocale}
            numberOfMonths={2}
          />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              size="sm"
              disabled={!customRange?.from || !customRange?.to}
              onClick={() => {
                if (customRange?.from && customRange?.to) {
                  navigate("custom", customRange);
                  setOpen(false);
                }
              }}
            >
              {t("apply")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {preset !== "custom" && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
