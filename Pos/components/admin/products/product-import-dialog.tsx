"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ImportPreview {
  rowCount: number;
  categories: string[];
  errors: { row: number; message: string }[];
}

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImportDialog({
  open,
  onOpenChange,
}: ProductImportDialogProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setUpdateExisting(true);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleFileChange = async (selected: File | null) => {
    setFile(selected);
    setPreview(null);

    if (!selected) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      formData.append("mode", "preview");

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "preview failed");
      }
      setPreview(data as ImportPreview);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("importPreviewError"),
      );
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("updateExisting", String(updateExisting));

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "import failed");
      }

      toast.success(
        t("importSuccess", {
          created: data.created,
          updated: data.updated,
          categories: data.categoriesCreated,
        }),
      );

      if (data.errors?.length > 0) {
        toast.warning(t("importPartialErrors", { count: data.errors.length }));
      }

      handleClose(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("importError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />
            <div className="flex flex-col items-center gap-3 text-center">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("importFileLabel")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("importFileHint")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {file ? t("importChangeFile") : t("importChooseFile")}
              </Button>
              {file && (
                <p className="text-xs text-muted-foreground">{file.name}</p>
              )}
            </div>
          </div>

          {preview && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                {t("importPreviewCount", { count: preview.rowCount })}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t("importPreviewCategories", {
                  count: preview.categories.length,
                })}
              </p>
              {preview.categories.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {preview.categories.slice(0, 8).join(" · ")}
                  {preview.categories.length > 8 ? " …" : ""}
                </p>
              )}
              {preview.errors.length > 0 && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  {t("importPreviewWarnings", { count: preview.errors.length })}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="update-existing">{t("importUpdateExisting")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("importUpdateExistingHint")}
              </p>
            </div>
            <Switch
              id="update-existing"
              checked={updateExisting}
              onCheckedChange={setUpdateExisting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || !preview || preview.rowCount === 0 || loading}
          >
            {loading ? t("importWorking") : t("importConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
