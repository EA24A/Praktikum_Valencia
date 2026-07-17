"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import type { SeoSetting } from "@prisma/client";

type Props = {
  pages: { key: string; label: string }[];
  initialSettings: SeoSetting[];
};

type SeoData = {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
};

export default function SeoManager({ pages, initialSettings }: Props) {
  const [activePage, setActivePage] = useState(pages[0].key);
  const [activeLocale, setActiveLocale] = useState<"es" | "en">("es");
  const [loading, setLoading] = useState(false);

  const getKey = (page: string, locale: string) => `${page}-${locale}`;

  const initialData = Object.fromEntries(
    pages.flatMap((page) =>
      (["es", "en"] as const).map((locale) => {
        const s = initialSettings.find(
          (s) => s.pageKey === page.key && s.locale === locale
        );
        return [
          getKey(page.key, locale),
          {
            title: s?.title ?? "",
            description: s?.description ?? "",
            keywords: s?.keywords ?? "",
            ogImageUrl: s?.ogImageUrl ?? "",
          } satisfies SeoData,
        ];
      })
    )
  );

  const [data, setData] = useState<Record<string, SeoData>>(initialData);

  const currentKey = getKey(activePage, activeLocale);
  const current = data[currentKey] ?? { title: "", description: "", keywords: "", ogImageUrl: "" };

  const update = (field: keyof SeoData, value: string) => {
    setData((d) => ({ ...d, [currentKey]: { ...current, [field]: value } }));
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: activePage,
          locale: activeLocale,
          ...current,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("SEO guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors";
  const labelClass = "block font-body text-sm text-[var(--espresso-light)] mb-1.5";

  const titleLength = current.title.length;
  const descLength = current.description.length;

  return (
    <div className="space-y-6">
      {/* Page selector */}
      <div className="flex gap-2 flex-wrap">
        {pages.map((page) => (
          <button
            key={page.key}
            onClick={() => setActivePage(page.key)}
            className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
              activePage === page.key
                ? "bg-[var(--terracotta)] text-white"
                : "bg-[var(--warm-white)] border border-[var(--border)] text-[var(--olive)] hover:border-[var(--terracotta)]"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Locale toggle */}
      <div className="flex gap-2">
        {(["es", "en"] as const).map((locale) => (
          <button
            key={locale}
            onClick={() => setActiveLocale(locale)}
            className={`px-5 py-2 rounded-lg font-body text-sm font-medium transition-all ${
              activeLocale === locale
                ? "bg-[#0D0D0D] text-white"
                : "border border-[var(--border)] text-[var(--olive)]"
            }`}
          >
            {locale === "es" ? "ES · Español" : "EN · English"}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="card-warm rounded-xl p-6 space-y-4">
        <div>
          <label className={labelClass}>
            Título <span className={titleLength > 60 ? "text-red-500" : "text-[var(--olive)]"}>({titleLength}/60)</span>
          </label>
          <input
            type="text"
            value={current.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
            placeholder="Casa Fenicia – Bistró Libanés Valencia"
          />
        </div>

        <div>
          <label className={labelClass}>
            Descripción <span className={descLength > 160 ? "text-red-500" : "text-[var(--olive)]"}>({descLength}/160)</span>
          </label>
          <textarea
            rows={3}
            value={current.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
            placeholder="Auténtica cocina libanesa en el corazón de Ciutat Vella..."
          />
        </div>

        <div>
          <label className={labelClass}>Keywords (separadas por comas)</label>
          <input
            type="text"
            value={current.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            className={inputClass}
            placeholder="restaurante libanés Valencia, comida libanesa, hummus..."
          />
        </div>

        <div>
          <label className={labelClass}>URL imagen Open Graph</label>
          <input
            type="url"
            value={current.ogImageUrl}
            onChange={(e) => update("ogImageUrl", e.target.value)}
            className={inputClass}
            placeholder="https://www.casafenicia.com/og-home.jpg"
          />
        </div>

        <button onClick={save} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar SEO
        </button>
      </div>
    </div>
  );
}
