"use client";

import { useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  clampPercent,
  clampTablePosition,
  createDraftTable,
  snapToGrid,
  type EditorTable,
} from "@/lib/tables-utils";
import { TableNode } from "@/components/shared/table-node";
import { PALETTE_DRAG_ID, TablePalette } from "./table-palette";

interface TableMapCanvasProps {
  tables: EditorTable[];
  selectedKey: string | null;
  editMode: boolean;
  gridSnap: boolean;
  disabled?: boolean;
  canvasHint: string;
  onSelect: (clientKey: string | null) => void;
  onMove: (clientKey: string, x: number, y: number) => void;
  onResize: (clientKey: string, width: number, height: number) => void;
  onAddAt: (table: EditorTable) => void;
}

interface DraggableTableProps {
  table: EditorTable;
  selected: boolean;
  editMode: boolean;
  onSelect: (clientKey: string) => void;
  onResize: (clientKey: string, width: number, height: number) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  gridSnap: boolean;
}

function DraggableTable({
  table,
  selected,
  editMode,
  onSelect,
  onResize,
  canvasRef,
  gridSnap,
}: DraggableTableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: table.clientKey,
      disabled: !editMode,
      data: { type: "table" },
    });

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!editMode || !canvasRef.current) return;
      event.stopPropagation();
      event.preventDefault();

      resizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startW: table.width,
        startH: table.height,
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!resizeRef.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const deltaX =
          ((moveEvent.clientX - resizeRef.current.startX) / rect.width) * 100;
        const deltaY =
          ((moveEvent.clientY - resizeRef.current.startY) / rect.height) * 100;

        let width = clampPercent(
          resizeRef.current.startW + deltaX,
          1,
          100 - table.x,
        );
        let height = clampPercent(
          resizeRef.current.startH + deltaY,
          1,
          100 - table.y,
        );

        if (gridSnap) {
          width = snapToGrid(width);
          height = snapToGrid(height);
        }

        onResize(table.clientKey, width, height);
      };

      const handlePointerUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [
      canvasRef,
      editMode,
      gridSnap,
      onResize,
      table.clientKey,
      table.height,
      table.width,
      table.x,
      table.y,
    ],
  );

  const dragTransform = transform
    ? CSS.Translate.toString(transform)
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute touch-none",
        editMode && "cursor-grab active:cursor-grabbing",
      )}
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: `${table.width}%`,
        height: `${table.height}%`,
        transform: dragTransform,
        zIndex: isDragging ? 50 : selected ? 40 : 1,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(table.clientKey);
      }}
      {...(editMode ? { ...listeners, ...attributes } : {})}
    >
      <TableNode
        number={table.number}
        color={table.color}
        shape={table.shape}
        selected={selected}
        preview={!editMode}
        className={cn(
          !editMode && "cursor-default",
          editMode && "pointer-events-none",
        )}
      />
      {editMode && selected && (
        <div
          role="separator"
          aria-orientation="horizontal"
          onPointerDown={handleResizePointerDown}
          className="absolute -bottom-1.5 -right-1.5 z-10 h-3.5 w-3.5 cursor-se-resize rounded-sm border-2 border-primary bg-background shadow-sm"
        />
      )}
    </div>
  );
}

export function TableMapCanvas({
  tables,
  selectedKey,
  editMode,
  gridSnap,
  disabled,
  canvasHint,
  onSelect,
  onMove,
  onResize,
  onAddAt,
}: TableMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: "table-map-canvas",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const setCanvasRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      setDropRef(node);
    },
    [setDropRef],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const deltaXPercent = (delta.x / rect.width) * 100;
      const deltaYPercent = (delta.y / rect.height) * 100;

      if (active.id === PALETTE_DRAG_ID) {
        const draft = createDraftTable(
          tables.map((table) => table.number),
          { x: 10, y: 10 },
        );

        const canvasRect = canvas.getBoundingClientRect();
        const activatorEvent = event.activatorEvent as PointerEvent | undefined;
        let dropX = 10;
        let dropY = 10;

        if (activatorEvent) {
          dropX =
            ((activatorEvent.clientX + delta.x - canvasRect.left) /
              canvasRect.width) *
            100;
          dropY =
            ((activatorEvent.clientY + delta.y - canvasRect.top) /
              canvasRect.height) *
            100;
        }

        if (gridSnap) {
          dropX = snapToGrid(dropX);
          dropY = snapToGrid(dropY);
        }

        const position = clampTablePosition(
          dropX,
          dropY,
          draft.width,
          draft.height,
        );
        onAddAt({
          ...draft,
          ...position,
          clientKey: `draft-${crypto.randomUUID()}`,
        });
        return;
      }

      const table = tables.find((item) => item.clientKey === active.id);
      if (!table) return;

      let nextX = table.x + deltaXPercent;
      let nextY = table.y + deltaYPercent;

      if (gridSnap) {
        nextX = snapToGrid(nextX);
        nextY = snapToGrid(nextY);
      }

      const position = clampTablePosition(
        nextX,
        nextY,
        table.width,
        table.height,
      );
      onMove(table.clientKey, position.x, position.y);
    },
    [gridSnap, onAddAt, onMove, tables],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex min-w-0 flex-1">
        <TablePalette editMode={editMode} disabled={disabled} />
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            {canvasHint}
          </div>
          <div
            ref={setCanvasRef}
            className={cn(
              "relative min-h-[420px] flex-1 overflow-hidden rounded-xl border bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[5%_5%] bg-position-[0_0]",
              isOver && editMode && "ring-2 ring-primary/40",
            )}
            style={{ aspectRatio: "16 / 10" }}
            onClick={() => onSelect(null)}
          >
            {tables.map((table) => (
              <DraggableTable
                key={table.clientKey}
                table={table}
                selected={selectedKey === table.clientKey}
                editMode={editMode}
                onSelect={onSelect}
                onResize={onResize}
                canvasRef={canvasRef}
                gridSnap={gridSnap}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
