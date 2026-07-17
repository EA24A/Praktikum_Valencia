"use client";

import { cn } from "@/lib/utils";
import type { TableShape } from "@/lib/tables-utils";

export interface TableNodeProps {
  number: string;
  color: string;
  shape: TableShape;
  selected?: boolean;
  occupied?: boolean;
  occupiedLabel?: string;
  itemCount?: number;
  preview?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function TableNode({
  number,
  color,
  shape,
  selected = false,
  occupied = false,
  occupiedLabel,
  itemCount = 0,
  preview = false,
  className,
  style,
  onClick,
}: TableNodeProps) {
  return (
    <div className="relative h-full w-full">
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          "flex h-full w-full flex-col items-center justify-center border-2 text-white shadow-md transition-all",
          shape === "circle" ? "rounded-full" : "rounded-xl",
          selected && "ring-4 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
          occupied && !selected && "ring-2 ring-amber-400/80 ring-offset-1 ring-offset-background",
          preview ? "cursor-default" : onClick ? "cursor-pointer hover:brightness-110 active:scale-[0.98]" : "cursor-grab active:cursor-grabbing",
          className,
        )}
        style={{
          backgroundColor: color,
          borderColor: occupied ? "#fbbf24" : "color-mix(in oklch, var(--foreground) 15%, transparent)",
          ...style,
        }}
      >
        <span className="text-sm font-bold drop-shadow-sm md:text-base">{number}</span>
        {occupied && occupiedLabel && (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-90">
            {occupiedLabel}
          </span>
        )}
      </div>
      {occupied && itemCount > 0 && (
        <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow">
          {itemCount}
        </span>
      )}
    </div>
  );
}
