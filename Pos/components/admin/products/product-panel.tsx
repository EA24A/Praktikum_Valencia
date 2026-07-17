"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { localizedCatalogName } from "@/lib/catalog/localized-name";
import { Euro, Pencil, Percent, Plus, Power, Search, Upload, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProductGroupTable } from "@/components/admin/products/product-group-table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatTaxRateLabel } from "@/components/admin/products/tax-rate-select";
import { ProductFormDialog } from "@/components/admin/products/product-form-dialog";
import { ProductImportDialog } from "@/components/admin/products/product-import-dialog";
import { BulkTaxRateDialog } from "@/components/admin/products/bulk-tax-rate-dialog";
import { BulkPriceDialog } from "@/components/admin/products/bulk-price-dialog";
import {
  bulkDeactivateProducts,
  deactivateProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/actions/products";
import type { PosCategory, PosProduct } from "@/types";

interface ProductPanelProps {
  categories: PosCategory[];
  products: PosProduct[];
  selectedCategoryId: string | null;
  onProductsChange: (products: PosProduct[]) => void;
}

export function ProductPanel({
  categories,
  products,
  selectedCategoryId,
  onProductsChange,
}: ProductPanelProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);
  const [removingProduct, setRemovingProduct] = useState<PosProduct | null>(null);
  const [reactivatingProduct, setReactivatingProduct] =
    useState<PosProduct | null>(null);
  const [removeWorking, setRemoveWorking] = useState(false);
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkTaxOpen, setBulkTaxOpen] = useState(false);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
        return false;
      }
      if (!showInactive && !product.isActive) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        product.nameEs.toLowerCase().includes(query) ||
        product.nameEn.toLowerCase().includes(query)
      );
    });
  }, [products, search, selectedCategoryId, showInactive]);

  const groupedProducts = useMemo(() => {
    const categoryMap = new Map(
      categories.map((category) => [category.id, category]),
    );

    const groups = new Map<string, PosProduct[]>();

    for (const product of filteredProducts) {
      const list = groups.get(product.categoryId) ?? [];
      list.push(product);
      groups.set(product.categoryId, list);
    }

    return [...groups.entries()]
      .map(([categoryId, items]) => ({
        category: categoryMap.get(categoryId),
        products: items.sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((group) => group.category)
      .sort(
        (a, b) =>
          (a.category?.sortOrder ?? 0) - (b.category?.sortOrder ?? 0),
      );
  }, [filteredProducts, categories]);

  const toggleSelection = useCallback((productId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(productId)
          ? current
          : [...current, productId]
        : current.filter((id) => id !== productId),
    );
  }, []);

  const toggleGroupSelection = useCallback(
    (groupProducts: PosProduct[], checked: boolean) => {
      const ids = groupProducts.map((product) => product.id);
      setSelectedIds((current) => {
        if (!checked) {
          return current.filter((id) => !ids.includes(id));
        }
        return [...new Set([...current, ...ids])];
      });
    },
    [],
  );

  const handleBulkUpdateSuccess = useCallback(
    (updated: PosProduct[]) => {
      const byId = new Map(updated.map((product) => [product.id, product]));
      onProductsChange(
        products.map((product) => byId.get(product.id) ?? product),
      );
      setSelectedIds([]);
    },
    [onProductsChange, products],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/products/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "casapos-products.xlsx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("exportError"),
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!removingProduct) {
      return;
    }

    setRemoveWorking(true);
    try {
      const result = await deactivateProduct(removingProduct.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onProductsChange(
        products.map((product) =>
          product.id === result.product.id ? result.product : product,
        ),
      );
      setSelectedIds((current) =>
        current.filter((id) => id !== removingProduct.id),
      );
      toast.success(t("productDeactivated"));
      setRemovingProduct(null);
    } finally {
      setRemoveWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!removingProduct) {
      return;
    }

    setRemoveWorking(true);
    try {
      const result = await deleteProduct(removingProduct.id);
      if (!result.success) {
        toast.error(
          result.code === "HAS_HISTORY"
            ? t("deleteBlockedHistory")
            : result.code === "HAS_COMBO_REF"
              ? t("deleteBlockedCombo")
              : result.error,
        );
        return;
      }

      onProductsChange(
        products.filter((product) => product.id !== removingProduct.id),
      );
      setSelectedIds((current) =>
        current.filter((id) => id !== removingProduct.id),
      );
      toast.success(t("deleteProductSuccess"));
      setRemovingProduct(null);
    } finally {
      setRemoveWorking(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivatingProduct) {
      return;
    }

    setRemoveWorking(true);
    try {
      const result = await updateProduct({
        id: reactivatingProduct.id,
        isActive: true,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onProductsChange(
        products.map((product) =>
          product.id === result.product.id ? result.product : product,
        ),
      );
      toast.success(t("reactivateProductSuccess"));
      setReactivatingProduct(null);
    } finally {
      setRemoveWorking(false);
    }
  };

  const handleBulkDeactivate = async () => {
    const result = await bulkDeactivateProducts(selectedIds);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onProductsChange(
      products.map((product) =>
        selectedIds.includes(product.id)
          ? { ...product, isActive: false }
          : product,
      ),
    );
    toast.success(t("bulkDeactivated", { count: result.count }));
    setSelectedIds([]);
    setBulkDeactivateOpen(false);
  };

  const getCategoryLabel = (category: PosCategory) =>
    localizedCatalogName(category, locale);

  const getProductLabel = useCallback(
    (product: PosProduct) => localizedCatalogName(product, locale),
    [locale],
  );

  const columns = useMemo<ColumnDef<PosProduct>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const rows = table.getRowModel().rows;
          const rowProducts = rows.map((row) => row.original);
          const selectedInGroup = rowProducts.filter((product) =>
            selectedIds.includes(product.id),
          ).length;
          const allInGroupSelected =
            rows.length > 0 && selectedInGroup === rows.length;
          const someInGroupSelected =
            selectedInGroup > 0 && selectedInGroup < rows.length;

          return (
            <Checkbox
              checked={allInGroupSelected}
              indeterminate={someInGroupSelected}
              onCheckedChange={(checked) =>
                toggleGroupSelection(rowProducts, checked === true)
              }
              aria-label={t("selectAll")}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={(checked) =>
              toggleSelection(row.original.id, checked === true)
            }
            aria-label={t("selectProduct")}
          />
        ),
      },
      {
        accessorKey: "name",
        header: t("productName"),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{getProductLabel(row.original)}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.nameEs} / {row.original.nameEn}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: t("price"),
        cell: ({ row }) => <CurrencyDisplay amount={row.original.price} />,
      },
      {
        accessorKey: "taxRate",
        header: t("taxRate"),
        cell: ({ row }) => formatTaxRateLabel(row.original.taxRate, t),
      },
      {
        accessorKey: "posOnly",
        header: t("posOnlyShort"),
        cell: ({ row }) =>
          row.original.posOnly ? (
            <Badge variant="outline">{t("posOnlyShort")}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: tCommon("status"),
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge>{tCommon("active")}</Badge>
          ) : (
            <Badge variant="secondary">{tCommon("inactive")}</Badge>
          ),
      },
      {
        id: "actions",
        header: tCommon("actions"),
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditingProduct(row.original);
                setFormOpen(true);
              }}
              aria-label={tCommon("edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {row.original.isActive ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setRemovingProduct(row.original)}
                aria-label={t("removeProduct")}
              >
                <Power className="h-4 w-4 text-destructive" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setReactivatingProduct(row.original)}
                aria-label={t("reactivateProduct")}
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [
      getProductLabel,
      selectedIds,
      t,
      tCommon,
      toggleGroupSelection,
      toggleSelection,
    ],
  );

  return (
    <>
      <Card>
        <CardHeader className="gap-4 space-y-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{t("productsList")}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting || products.length === 0}
              >
                <Download className="h-4 w-4" />
                {exporting ? t("exportWorking") : t("exportProducts")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                {t("importProducts")}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setFormOpen(true);
                }}
                disabled={categories.filter((c) => c.isActive).length === 0}
              >
                <Plus className="h-4 w-4" />
                {t("addProduct")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchProducts")}
                className="pl-8"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                  id="show-inactive"
                />
                <Label htmlFor="show-inactive">{t("showInactive")}</Label>
              </div>

              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkPriceOpen(true)}
                  >
                    <Euro className="h-4 w-4" />
                    {t("bulkPrice", { count: selectedIds.length })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkTaxOpen(true)}
                  >
                    <Percent className="h-4 w-4" />
                    {t("bulkTax", { count: selectedIds.length })}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeactivateOpen(true)}
                  >
                    {t("bulkDeactivate", { count: selectedIds.length })}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {groupedProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("noProducts")}
            </p>
          ) : (
            groupedProducts.map(({ category, products: groupItems }) => {
              if (!category) {
                return null;
              }

              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      {getCategoryLabel(category)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {groupItems.length} {t("productCount")}
                    </span>
                  </div>

                  <ProductGroupTable
                    products={groupItems}
                    columns={columns}
                    emptyMessage={t("noProductsInCategory")}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <BulkTaxRateDialog
        open={bulkTaxOpen}
        onOpenChange={setBulkTaxOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkUpdateSuccess}
      />

      <BulkPriceDialog
        open={bulkPriceOpen}
        onOpenChange={setBulkPriceOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkUpdateSuccess}
      />

      <ProductImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        allProducts={products}
        defaultCategoryId={selectedCategoryId ?? undefined}
        onSuccess={(product) => {
          if (editingProduct) {
            onProductsChange(
              products.map((item) =>
                item.id === product.id ? product : item,
              ),
            );
          } else {
            onProductsChange([...products, product]);
          }
        }}
      />

      <AlertDialog
        open={Boolean(removingProduct)}
        onOpenChange={(open) => !open && setRemovingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeProductTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeProductDescription", {
                name: removingProduct
                  ? getProductLabel(removingProduct)
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={removeWorking}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={removeWorking}
              onClick={() => void handleDeactivate()}
            >
              {removeWorking ? tCommon("loading") : t("deactivate")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeWorking}
              onClick={() => void handleDelete()}
            >
              {removeWorking ? tCommon("loading") : t("deleteProduct")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(reactivatingProduct)}
        onOpenChange={(open) => !open && setReactivatingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reactivateProductTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reactivateProductDescription", {
                name: reactivatingProduct
                  ? getProductLabel(reactivatingProduct)
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeWorking}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={removeWorking}
              onClick={() => void handleReactivate()}
            >
              {removeWorking ? tCommon("loading") : t("reactivateProduct")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeactivateOpen} onOpenChange={setBulkDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulkDeactivateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkDeactivateDescription", { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleBulkDeactivate()}
            >
              {t("deactivate")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
