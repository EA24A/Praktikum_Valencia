import { listCategories } from "@/lib/actions/categories";
import { listProducts } from "@/lib/actions/products";
import { ProductsManagement } from "@/components/admin/products/products-management";

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([
    listCategories({ includeInactive: true, includeProducts: false }),
    listProducts({ includeInactive: true }),
  ]);

  return (
    <ProductsManagement
      initialCategories={categories}
      initialProducts={products}
    />
  );
}
