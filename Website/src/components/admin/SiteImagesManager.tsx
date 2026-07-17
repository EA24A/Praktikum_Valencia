"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, RotateCcw, Loader2, Image as ImageIcon } from "lucide-react";

type Slot = {
  key: string;
  label: string;
  description: string;
  defaultUrl: string;
  recommended: string;
  isOverridden: boolean;
};

type Props = {
  initialImages: Record<string, string>;
  initialSlots: Slot[];
};

export default function SiteImagesManager({ initialImages, initialSlots }: Props) {
  const [images, setImages] = useState(initialImages);
  const [slots, setSlots] = useState(initialSlots);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const updateLocal = (key: string, url: string, isOverridden: boolean) => {
    setImages((prev) => ({ ...prev, [key]: url }));
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, isOverridden } : s))
    );
  };

  const upload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al subir la imagen");
      return null;
    }
    return data.url as string;
  };

  const setUrl = async (key: string, url: string | null) => {
    setBusyKey(key);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      updateLocal(data.key, data.url, data.isOverridden);
      toast.success(url === null ? "Imagen restaurada" : "Imagen actualizada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyKey(null);
    }
  };

  const handlePick = async (key: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/avif,image/svg+xml";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setBusyKey(key);
      const url = await upload(file);
      setBusyKey(null);
      if (url) await setUrl(key, url);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {slots.map((slot) => {
        const url = images[slot.key];
        const busy = busyKey === slot.key;

        return (
          <div
            key={slot.key}
            className="card-warm rounded-xl p-5 flex flex-col md:flex-row gap-5"
          >
            {/* Preview */}
            <div className="w-full md:w-48 shrink-0">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                {url ? (
                  <Image
                    src={url}
                    alt={slot.label}
                    fill
                    sizes="192px"
                    className="object-contain p-3"
                    unoptimized={url.startsWith("/")}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--olive)]/40">
                    <ImageIcon size={36} />
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={28} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center">
                <span
                  className={
                    "inline-block px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider " +
                    (slot.isOverridden
                      ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                      : "bg-[var(--muted)] text-[var(--olive)]")
                  }
                >
                  {slot.isOverridden ? "PERSONALIZADA" : "POR DEFECTO"}
                </span>
              </div>
            </div>

            {/* Meta + actions */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-[var(--espresso)]">
                {slot.label}
              </h3>
              <p className="font-body text-sm text-[var(--olive)] mt-1">
                {slot.description}
              </p>
              <p className="font-body text-xs text-[var(--olive)]/70 mt-2">
                {slot.recommended}
              </p>
              <p className="font-body text-xs text-[var(--olive)]/60 mt-2 break-all">
                <span className="opacity-60">URL actual:</span>{" "}
                <code className="text-[var(--gold)]">{url}</code>
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handlePick(slot.key)}
                  disabled={busy}
                  className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Subir nueva imagen
                </button>
                {slot.isOverridden && (
                  <button
                    type="button"
                    onClick={() => setUrl(slot.key, null)}
                    disabled={busy}
                    className="btn-outline text-sm py-2 px-4 inline-flex items-center gap-2"
                    title="Volver a la imagen por defecto"
                  >
                    <RotateCcw size={14} />
                    Restaurar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
