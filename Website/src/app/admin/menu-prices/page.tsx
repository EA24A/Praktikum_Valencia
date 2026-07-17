import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuPriceEditor from "@/components/admin/MenuPriceEditor";

export default async function AdminMenuPricesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const categories = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          nameEn: true,
          nameEs: true,
          nameAr: true,
          basePrice: true,
          taxRate: true,
          isAvailable: true,
        },
      },
    },
  });

  const serialized = categories.map((cat) => ({
    id: cat.id,
    nameEn: cat.nameEn,
    nameEs: cat.nameEs,
    items: cat.items.map((item) => ({
      id: item.id,
      nameEn: item.nameEn,
      nameEs: item.nameEs,
      nameAr: item.nameAr ?? null,
      basePrice: Number(item.basePrice),
      taxRate: Number(item.taxRate ?? 10),
      isAvailable: item.isAvailable,
    })),
  }));

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <h1 className="font-display text-3xl text-[var(--espresso)] mb-1">
        Precios de la Carta
      </h1>
      <p className="font-body text-sm text-[var(--olive)] mb-5">
        Atajo rápido para editar precios. El menú QR usa exactamente los mismos datos que la Carta del sitio web — cualquier cambio aquí o en{" "}
        <a href="/admin/menu" className="underline text-[var(--gold)] hover:text-[var(--gold-light)]">
          Carta
        </a>{" "}
        se refleja automáticamente en los 3 idiomas del menú QR.
      </p>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-lg px-4 py-3 mb-8"
        style={{
          background: "rgba(201,168,76,0.07)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <span className="text-[var(--gold)] mt-0.5 text-base leading-none shrink-0">◆</span>
        <p className="font-body text-xs text-[var(--olive)] leading-relaxed">
          Para añadir o eliminar platos, crear categorías o gestionar variantes, usa el editor completo en{" "}
          <a href="/admin/menu" className="text-[var(--gold)] underline hover:text-[var(--gold-light)]">
            Carta
          </a>
          . Este panel solo edita precios.
        </p>
      </div>

      <MenuPriceEditor initialCategories={serialized} />
    </div>
  );
}
