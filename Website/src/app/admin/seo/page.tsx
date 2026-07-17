import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SeoManager from "@/components/admin/SeoManager";

const PAGES = [
  { key: "home", label: "Inicio" },
  { key: "menu", label: "Carta" },
  { key: "order", label: "Pedidos" },
  { key: "reserve", label: "Reservas" },
  { key: "about", label: "Nosotros" },
  { key: "contact", label: "Contacto" },
];

export default async function AdminSeoPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const seoSettings = await prisma.seoSetting.findMany();

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-2">SEO</h1>
      <p className="font-body text-sm text-[var(--olive)] mb-8">
        Configura los títulos, descripciones y keywords para cada página en español e inglés.
      </p>
      <SeoManager pages={PAGES} initialSettings={seoSettings} />
    </div>
  );
}
