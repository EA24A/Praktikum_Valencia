"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TableNode } from "@/components/shared/table-node";

const PALETTE_DRAG_ID = "palette-new-table";

interface TablePaletteProps {
  editMode: boolean;
  disabled?: boolean;
}

export function TablePalette({ editMode, disabled }: TablePaletteProps) {
  const t = useTranslations("tables");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: PALETTE_DRAG_ID,
    disabled: !editMode || disabled,
    data: { type: "palette" },
  });

  if (!editMode) {
    return null;
  }

  return (
    <aside className="hidden w-52 shrink-0 flex-col gap-3 border-r bg-background p-4 md:flex">
      <div>
        <h2 className="text-sm font-semibold">{t("palette")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("paletteHint")}</p>
      </div>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "flex cursor-grab flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-4 active:cursor-grabbing",
          isDragging && "opacity-50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <TableNode
          number="T?"
          color="#3b82f6"
          shape="rectangle"
          preview
          className="h-14 w-14"
        />
        <span className="text-xs font-medium text-muted-foreground">
          {t("addTable")}
        </span>
      </div>
    </aside>
  );
}

export { PALETTE_DRAG_ID };
