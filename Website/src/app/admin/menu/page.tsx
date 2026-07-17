import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuManager from "@/components/admin/MenuManager";
import ExportMenuButton from "@/components/admin/ExportMenuButton";
import MenuBulkPanel from "@/components/admin/MenuBulkPanel";

export default async function AdminMenuPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const categories = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        orderBy: { displayOrder: "asc" },
        include: {
          variants: true,
          modifierGroups: { include: { modifiers: true } },
        },
      },
    },
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-[var(--espresso)] mb-2">Gestión de Carta</h1>
          <p className="font-body text-sm text-[var(--olive)]">
            Añade y edita categorías, platos, variantes y modificadores. Exporta la carta en XLSX para importarla en otras plataformas.
          </p>
        </div>
        <ExportMenuButton />
      </div>
      <MenuBulkPanel categories={categories} />
      <div className="mt-8">
        <MenuManager initialCategories={categories} />
      </div>
    </div>
  );
}
