import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_IMAGE_SLOTS } from "@/lib/siteImages";
import SiteImagesManager from "@/components/admin/SiteImagesManager";

export const dynamic = "force-dynamic";

export default async function AdminImagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/admin");

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: SITE_IMAGE_SLOTS.map((s) => s.settingKey) } },
  });
  const bySettingKey = new Map(rows.map((r) => [r.key, r.value]));

  const initialImages: Record<string, string> = {};
  const initialSlots = SITE_IMAGE_SLOTS.map((slot) => {
    const value = bySettingKey.get(slot.settingKey);
    const isOverridden = !!(value && value.trim());
    initialImages[slot.key] = isOverridden ? (value as string) : slot.defaultUrl;
    return {
      key: slot.key,
      label: slot.label,
      description: slot.description,
      defaultUrl: slot.defaultUrl,
      recommended: slot.recommended,
      isOverridden,
    };
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <h1 className="font-display text-4xl text-[var(--espresso)] mb-2">
        Imágenes del sitio
      </h1>
      <p className="font-body text-sm text-[var(--olive)] mb-8 max-w-2xl">
        Sube cualquier imagen del sitio: logotipo, favicon, fotos del hero,
        nuestra historia, sobre nosotros y la imagen por defecto al compartir
        en redes sociales. Las imágenes se almacenan en Vercel Blob y se
        publican al instante. Pulsa <em>Restaurar</em> para volver a la
        imagen por defecto.
      </p>
      <SiteImagesManager
        initialImages={initialImages}
        initialSlots={initialSlots}
      />
    </div>
  );
}
