"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale, useTranslations } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { GripVertical, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deactivateCategory, reorderCategories } from "@/lib/actions/categories";
import { CategoryFormDialog } from "@/components/admin/products/category-form-dialog";
import type { PosCategory } from "@/types";

interface CategoryPanelProps {
  categories: PosCategory[];
  selectedCategoryId: string | null;
  onCategoriesChange: (categories: PosCategory[]) => void;
  onSelectCategory: (categoryId: string | null) => void;
}

function SortableCategoryItem({
  category,
  locale,
  isSelected,
  onSelect,
  onEdit,
  onDeactivate,
}: {
  category: PosCategory;
  locale: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !category.isActive });

  const displayName = localizedCatalogName(category, locale);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-background p-2",
        isDragging && "z-10 opacity-80 shadow-md",
        isSelected && "border-primary ring-1 ring-primary/30",
        !category.isActive && "opacity-60",
      )}
    >
      {category.isActive && (
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={t("dragToReorder")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-sm font-medium">{displayName}</div>
        <div className="text-xs text-muted-foreground">
          {category.products.length} {t("productCount")}
        </div>
      </button>

      {!category.isActive && (
        <Badge variant="secondary">{tCommon("inactive")}</Badge>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        aria-label={tCommon("edit")}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      {category.isActive && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDeactivate}
          aria-label={t("deactivate")}
        >
          <Power className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function CategoryPanel({
  categories,
  selectedCategoryId,
  onCategoriesChange,
  onSelectCategory,
}: CategoryPanelProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PosCategory | null>(
    null,
  );
  const [deactivatingCategory, setDeactivatingCategory] =
    useState<PosCategory | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const activeCategoryIds = sortedCategories
    .filter((category) => category.isActive)
    .map((category) => category.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeItems = sortedCategories.filter((category) => category.isActive);
    const oldIndex = activeItems.findIndex((category) => category.id === active.id);
    const newIndex = activeItems.findIndex((category) => category.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedActive = arrayMove(activeItems, oldIndex, newIndex);
    const inactive = sortedCategories.filter((category) => !category.isActive);
    const nextCategories = [...reorderedActive, ...inactive].map(
      (category, index) => ({ ...category, sortOrder: index }),
    );

    onCategoriesChange(nextCategories);

    const result = await reorderCategories(reorderedActive.map((c) => c.id));
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(t("categoriesReordered"));
  };

  const handleDeactivate = async () => {
    if (!deactivatingCategory) {
      return;
    }

    const result = await deactivateCategory(deactivatingCategory.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onCategoriesChange(
      categories.map((category) =>
        category.id === deactivatingCategory.id
          ? { ...result.category, products: category.products }
          : category,
      ),
    );

    if (selectedCategoryId === deactivatingCategory.id) {
      onSelectCategory(null);
    }

    toast.success(t("categoryDeactivated"));
    setDeactivatingCategory(null);
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="text-base">{t("categories")}</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("addCategory")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={selectedCategoryId === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onSelectCategory(null)}
          >
            {t("allCategories")}
          </Button>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeCategoryIds}
              strategy={verticalListSortingStrategy}
            >
              {sortedCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  locale={locale}
                  isSelected={selectedCategoryId === category.id}
                  onSelect={() => onSelectCategory(category.id)}
                  onEdit={() => {
                    setEditingCategory(category);
                    setFormOpen(true);
                  }}
                  onDeactivate={() => setDeactivatingCategory(category)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {sortedCategories.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("noCategories")}
            </p>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSuccess={(category) => {
          if (editingCategory) {
            onCategoriesChange(
              categories.map((item) =>
                item.id === category.id
                  ? { ...category, products: item.products }
                  : item,
              ),
            );
          } else {
            onCategoriesChange([...categories, { ...category, products: [] }]);
          }
        }}
      />

      <AlertDialog
        open={Boolean(deactivatingCategory)}
        onOpenChange={(open) => !open && setDeactivatingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deactivateCategoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deactivateCategoryDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeactivate}
            >
              {t("deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
