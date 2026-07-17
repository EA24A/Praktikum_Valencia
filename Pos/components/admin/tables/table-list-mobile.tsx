"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EditorTable, TableShape } from "@/lib/tables-utils";

interface TableListMobileProps {
  tables: EditorTable[];
  selectedKey: string | null;
  editMode: boolean;
  onSelect: (clientKey: string) => void;
  onChange: (clientKey: string, patch: Partial<EditorTable>) => void;
  onDelete: (clientKey: string) => void;
}

export function TableListMobile({
  tables,
  selectedKey,
  editMode,
  onSelect,
  onChange,
  onDelete,
}: TableListMobileProps) {
  const t = useTranslations("tables");
  const tCommon = useTranslations("common");
  const selected = tables.find((table) => table.clientKey === selectedKey) ?? null;

  if (tables.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("noTables")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("listView")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tables.map((table) => (
            <button
              key={table.clientKey}
              type="button"
              onClick={() => onSelect(table.clientKey)}
              className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={selectedKey === table.clientKey}
            >
              <span className="flex items-center gap-2 font-medium">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: table.color }}
                />
                {table.number}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(table.x)}%, {Math.round(table.y)}%
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {editMode && selected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4" />
              {t("properties")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-table-number">{t("tableNumber")}</Label>
              <Input
                id="mobile-table-number"
                value={selected.number}
                onChange={(event) =>
                  onChange(selected.clientKey, { number: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-table-shape">{t("shape")}</Label>
              <Select
                value={selected.shape}
                onValueChange={(value) =>
                  onChange(selected.clientKey, { shape: value as TableShape })
                }
              >
                <SelectTrigger id="mobile-table-shape" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">{t("rectangle")}</SelectItem>
                  <SelectItem value="circle">{t("circle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-table-color">{t("color")}</Label>
              <Input
                id="mobile-table-color"
                type="color"
                value={selected.color}
                onChange={(event) =>
                  onChange(selected.clientKey, { color: event.target.value })
                }
                className="h-10 w-full cursor-pointer p-1"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4" />
                    {t("deleteTable")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteTable")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDelete", { number: selected.number })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(selected.clientKey)}>
                    {tCommon("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
