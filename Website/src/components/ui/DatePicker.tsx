"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ar, de, enUS, es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const locales = { es, en: enUS, ar, de };

type Props = {
  value?: string;
  onChange: (value: string) => void;
  minDate: Date;
  locale: string;
  placeholder: string;
  className?: string;
};

function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  locale,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? startOfMonth(new Date(`${value}T12:00:00`)) : startOfMonth(minDate)
  );

  const dateLocale = locales[locale as keyof typeof locales] ?? es;
  const selectedDate = value ? new Date(`${value}T12:00:00`) : undefined;
  const minDay = startOfDay(minDate);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: endOfWeek(start, { weekStartsOn: 1 }),
    }).map((day) => format(day, "EEE", { locale: dateLocale }));
  }, [dateLocale]);

  const handleSelect = (day: Date) => {
    if (isBefore(startOfDay(day), minDay)) return;
    onChange(toDateString(day));
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full bg-[var(--warm-white)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-left transition-colors",
            "focus:outline-none focus:border-[var(--terracotta)] hover:border-[var(--terracotta)]/60",
            value ? "text-[var(--espresso)]" : "text-[var(--olive)]/50",
            className
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span>
              {selectedDate
                ? format(selectedDate, "PPP", { locale: dateLocale })
                : placeholder}
            </span>
            <Calendar size={16} className="shrink-0 text-[var(--terracotta)]" />
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-[min(100vw-2rem,20rem)] rounded-xl border border-[var(--border)] bg-[var(--warm-white)] p-4 shadow-lg animate-fade-in"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((month) => subMonths(month, 1))}
              className="rounded-md p-1.5 text-[var(--olive)] hover:bg-[var(--muted)] hover:text-[var(--espresso)]"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="font-body text-sm font-medium text-[var(--espresso)]">
              {format(viewMonth, "LLLL yyyy", { locale: dateLocale })}
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className="rounded-md p-1.5 text-[var(--olive)] hover:bg-[var(--muted)] hover:text-[var(--espresso)]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="py-1 text-center font-body text-[10px] uppercase tracking-wide text-[var(--olive)]/70"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day) => {
              const disabled = isBefore(startOfDay(day), minDay);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const outsideMonth = !isSameMonth(day, viewMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-9 rounded-md font-body text-sm transition-colors",
                    outsideMonth && "text-[var(--olive)]/35",
                    !outsideMonth && !disabled && "text-[var(--espresso-light)] hover:bg-[var(--muted)]",
                    disabled && "cursor-not-allowed text-[var(--olive)]/25",
                    selected && "bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
