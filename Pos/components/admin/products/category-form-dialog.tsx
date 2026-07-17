"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { PosCategory } from "@/types";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: PosCategory | null;
  onSuccess: (category: PosCategory) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const isEditing = Boolean(category);
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNameEs(category?.nameEs ?? "");
      setNameEn(category?.nameEn ?? "");
      setNameDe(category?.nameDe ?? "");
    }
  }, [open, category]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = isEditing && category
      ? await updateCategory({ id: category.id, nameEs, nameEn, nameDe })
      : await createCategory({ nameEs, nameEn, nameDe });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? t("categoryUpdated") : t("categoryCreated"));
    onSuccess(result.category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("editCategory") : t("addCategory")}
            </DialogTitle>
            <DialogDescription>{t("categoryFormDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name-es">{t("nameEs")}</Label>
              <Input
                id="category-name-es"
                value={nameEs}
                onChange={(event) => setNameEs(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-name-en">{t("nameEn")}</Label>
              <Input
                id="category-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-name-de">{t("nameDe")}</Label>
              <Input
                id="category-name-de"
                value={nameDe}
                onChange={(event) => setNameDe(event.target.value)}
                placeholder={t("nameDePlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("nameDeHint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
