import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const settings = await prisma.siteSetting.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const defaults = {
    glovo_url: "https://glovo.go.link/open?link_type=store&store_id=570810&adjust_t=s321jkn",
    closing_time: "22:00",
    opening_time: "09:00",
    phone: "+34 600 345 055",
    address: "C/ de la Corretgeria, 4, Ciutat Vella, 46001 València",
    instagram_url: "",
    facebook_url: "",
    google_maps_url: "https://maps.app.goo.gl/kxm6t86WrZ4u4xC19",
  };

  const current = { ...defaults, ...settingsMap };

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-2">Ajustes del sitio</h1>
      <p className="font-body text-sm text-[var(--olive)] mb-8">
        Configura los datos globales del sitio web.
      </p>
      <SettingsForm settings={current} />
    </div>
  );
}
