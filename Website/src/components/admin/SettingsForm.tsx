"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

type Props = {
  settings: Record<string, string>;
};

const FIELD_CONFIG: { key: string; label: string; type?: string; hint?: string }[] = [
  { key: "glovo_url", label: "URL de Glovo", hint: "Enlace directo a tu perfil en Glovo" },
  { key: "closing_time", label: "Hora de cierre", type: "time", hint: "Usada para calcular ventana de última hora" },
  { key: "opening_time", label: "Hora de apertura", type: "time" },
  { key: "phone", label: "Teléfono" },
  { key: "address", label: "Dirección" },
  { key: "instagram_url", label: "URL de Instagram" },
  { key: "tiktok_url", label: "URL de TikTok" },
  { key: "facebook_url", label: "URL de Facebook" },
  { key: "google_maps_url", label: "URL de Google Maps" },
];

export default function SettingsForm({ settings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success("Ajustes guardados");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[var(--cream)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors";

  return (
    <div className="space-y-5">
      {FIELD_CONFIG.map(({ key, label, type, hint }) => (
        <div key={key} className="card-warm rounded-xl p-5">
          <label className="block font-display text-lg text-[var(--espresso)] mb-1">{label}</label>
          {hint && <p className="font-body text-xs text-[var(--olive)] mb-2">{hint}</p>}
          <input
            type={type ?? "text"}
            value={values[key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            className={inputClass}
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Guardar ajustes
      </button>
    </div>
  );
}
