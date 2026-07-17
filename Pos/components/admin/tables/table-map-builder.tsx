"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createDraftTable,
  type EditorTable,
  type TableLayoutItem,
} from "@/lib/tables-utils";
import { saveTableLayout, type TableActionRecord } from "@/lib/actions/tables";
import { TableMapCanvas } from "./table-map-canvas";
import { TablePropertiesPanel } from "./table-properties-panel";
import { TableListMobile } from "./table-list-mobile";

function toEditorTable(table: TableActionRecord): EditorTable {
  return {
    id: table.id,
    clientKey: table.id,
    number: table.number,
    x: table.x,
    y: table.y,
    width: table.width,
    height: table.height,
    color: table.color,
    shape: table.shape as EditorTable["shape"],
    isActive: table.isActive,
  };
}

function toLayoutItem(table: EditorTable): TableLayoutItem {
  return {
    id: table.id,
    number: table.number,
    x: table.x,
    y: table.y,
    width: table.width,
    height: table.height,
    color: table.color,
    shape: table.shape,
    isActive: table.isActive,
  };
}

interface TableMapBuilderProps {
  initialTables: TableActionRecord[];
}

export function TableMapBuilder({ initialTables }: TableMapBuilderProps) {
  const t = useTranslations("tables");
  const tCommon = useTranslations("common");
  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();

  const [tables, setTables] = useState<EditorTable[]>(() =>
    initialTables.filter((table) => table.isActive).map(toEditorTable),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const selectedTable = useMemo(
    () => tables.find((table) => table.clientKey === selectedKey) ?? null,
    [selectedKey, tables],
  );

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleChange = useCallback(
    (clientKey: string, patch: Partial<EditorTable>) => {
      setTables((current) =>
        current.map((table) =>
          table.clientKey === clientKey ? { ...table, ...patch } : table,
        ),
      );
      markDirty();
    },
    [markDirty],
  );

  const handleMove = useCallback(
    (clientKey: string, x: number, y: number) => {
      handleChange(clientKey, { x, y });
    },
    [handleChange],
  );

  const handleResize = useCallback(
    (clientKey: string, width: number, height: number) => {
      handleChange(clientKey, { width, height });
    },
    [handleChange],
  );

  const handleAddAt = useCallback(
    (table: EditorTable) => {
      setTables((current) => [...current, table]);
      setSelectedKey(table.clientKey);
      markDirty();
    },
    [markDirty],
  );

  const handleAddTable = useCallback(() => {
    const draft = createDraftTable(
      tables.map((table) => table.number),
      { x: 10, y: 10 },
    );
    const table: EditorTable = {
      ...draft,
      clientKey: `draft-${crypto.randomUUID()}`,
    };
    handleAddAt(table);
  }, [handleAddAt, tables]);

  const handleDelete = useCallback(
    (clientKey: string) => {
      setTables((current) => {
        const target = current.find((table) => table.clientKey === clientKey);
        if (target?.id) {
          setDeletedIds((ids) =>
            ids.includes(target.id!) ? ids : [...ids, target.id!],
          );
        }
        return current.filter((table) => table.clientKey !== clientKey);
      });
      setSelectedKey((current) => (current === clientKey ? null : current));
      markDirty();
    },
    [markDirty],
  );

  const handleSave = useCallback(() => {
    if (tables.length === 0 && deletedIds.length === 0) {
      toast.error(t("noTables"));
      return;
    }

    startTransition(async () => {
      const result = await saveTableLayout({
        tables: tables.map(toLayoutItem),
        deletedIds,
      });

      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }

      setTables(result.data.filter((table) => table.isActive).map(toEditorTable));
      setDeletedIds([]);
      setIsDirty(false);
      toast.success(t("layoutSaved"));
    });
  }, [deletedIds, tables, t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          {isDirty && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              {t("unsavedChanges")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="h-4 w-4" />
            {t("editMode")}
          </Button>
          <Button
            variant={!editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(false)}
          >
            <Eye className="h-4 w-4" />
            {t("previewMode")}
          </Button>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <Switch
              id="grid-snap"
              checked={gridSnap}
              onCheckedChange={setGridSnap}
              disabled={!editMode}
            />
            <Label htmlFor="grid-snap" className="text-sm font-normal">
              {t("gridSnap")}
            </Label>
          </div>

          {editMode && (
            <Button variant="outline" size="sm" onClick={handleAddTable}>
              <Plus className="h-4 w-4" />
              {t("addTable")}
            </Button>
          )}

          <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
            <Save className="h-4 w-4" />
            {isPending ? tCommon("loading") : t("saveLayout")}
          </Button>
        </div>
      </div>

      {isMobile ? (
        <>
          <TableListMobile
            tables={tables}
            selectedKey={selectedKey}
            editMode={editMode}
            onSelect={setSelectedKey}
            onChange={handleChange}
            onDelete={handleDelete}
          />
          {editMode && (
            <Button className="w-full" variant="outline" onClick={handleAddTable}>
              <Plus className="h-4 w-4" />
              {t("addTable")}
            </Button>
          )}
        </>
      ) : (
        <div className="flex min-h-[480px] overflow-hidden rounded-xl border bg-background">
          <TableMapCanvas
            tables={tables}
            selectedKey={selectedKey}
            editMode={editMode}
            gridSnap={gridSnap}
            disabled={isPending}
            canvasHint={editMode ? t("canvasHint") : t("previewHint")}
            onSelect={setSelectedKey}
            onMove={handleMove}
            onResize={handleResize}
            onAddAt={handleAddAt}
          />
          <TablePropertiesPanel
            table={selectedTable}
            editMode={editMode}
            onChange={handleChange}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
