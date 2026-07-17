"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface TablePropertiesPanelProps {
  table: EditorTable | null;
  editMode: boolean;
  onChange: (clientKey: string, patch: Partial<EditorTable>) => void;
  onDelete: (clientKey: string) => void;
}

export function TablePropertiesPanel({
  table,
  editMode,
  onChange,
  onDelete,
}: TablePropertiesPanelProps) {
  const t = useTranslations("tables");
  const tCommon = useTranslations("common");

  if (!editMode) {
    return (
      <aside className="hidden w-64 shrink-0 border-l bg-background p-4 lg:block">
        <p className="text-sm text-muted-foreground">{t("previewHint")}</p>
      </aside>
    );
  }

  if (!table) {
    return (
      <aside className="hidden w-64 shrink-0 border-l bg-background p-4 lg:block">
        <p className="text-sm text-muted-foreground">{t("selectTableHint")}</p>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-l bg-background p-4 lg:block">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">{t("properties")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          <div className="space-y-2">
            <Label htmlFor="table-number">{t("tableNumber")}</Label>
            <Input
              id="table-number"
              value={table.number}
              onChange={(event) =>
                onChange(table.clientKey, { number: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-shape">{t("shape")}</Label>
            <Select
              value={table.shape}
              onValueChange={(value) =>
                onChange(table.clientKey, { shape: value as TableShape })
              }
            >
              <SelectTrigger id="table-shape" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">{t("rectangle")}</SelectItem>
                <SelectItem value="circle">{t("circle")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-color">{t("color")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="table-color"
                type="color"
                value={table.color}
                onChange={(event) =>
                  onChange(table.clientKey, { color: event.target.value })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={table.color}
                onChange={(event) =>
                  onChange(table.clientKey, { color: event.target.value })
                }
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="table-width">{t("width")}</Label>
              <Input
                id="table-width"
                type="number"
                min={1}
                max={100}
                step={1}
                value={Math.round(table.width)}
                onChange={(event) =>
                  onChange(table.clientKey, {
                    width: Number.parseFloat(event.target.value) || table.width,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-height">{t("height")}</Label>
              <Input
                id="table-height"
                type="number"
                min={1}
                max={100}
                step={1}
                value={Math.round(table.height)}
                onChange={(event) =>
                  onChange(table.clientKey, {
                    height: Number.parseFloat(event.target.value) || table.height,
                  })
                }
              />
            </div>
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
                  {t("confirmDelete", { number: table.number })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(table.clientKey)}>
                  {tCommon("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </aside>
  );
}
