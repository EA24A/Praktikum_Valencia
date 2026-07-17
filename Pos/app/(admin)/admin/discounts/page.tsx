import { getTranslations } from "next-intl/server";
import {
  listComboProductOptions,
  listDiscounts,
} from "@/lib/actions/discounts";
import { DiscountsManager } from "@/components/admin/discounts/discounts-manager";

export default async function AdminDiscountsPage() {
  const t = await getTranslations("discounts");
  const [discounts, products] = await Promise.all([
    listDiscounts(),
    listComboProductOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>
      <DiscountsManager initialDiscounts={discounts} products={products} />
    </div>
  );
}
