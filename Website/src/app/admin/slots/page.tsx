"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Eye, EyeOff } from "lucide-react";

type Slot = { id: string; dayOfWeek: number; startTime: string; endTime: string; maxCovers: number; isActive: boolean };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const inputClass = "w-full bg-[#0A0800] border border-[var(--border)] rounded-lg px-3 py-2 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--gold)] transition-colors";

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: "1", startTime: "09:00", endTime: "22:00", maxCovers: "20" });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/slots");
    setSlots(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dayOfWeek: Number(form.dayOfWeek), maxCovers: Number(form.maxCovers) }),
    });
    if (res.ok) {
      toast.success("Franja horaria creada");
      setForm({ dayOfWeek: "1", startTime: "09:00", endTime: "22:00", maxCovers: "20" });
      setShowNew(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Error");
    }
    setSaving(false);
  };

  const toggle = async (id: string, current: boolean) => {
    await fetch(`/api/admin/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta franja horaria?")) return;
    const res = await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminada"); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Error"); }
  };

  // Group by day
  const byDay = DAYS.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter((s) => s.dayOfWeek === idx),
  }));

  if (loading) return <div className="p-8 flex items-center gap-2 text-[var(--olive)]"><Loader2 size={18} className="animate-spin" /> Cargando...</div>;

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-[var(--espresso)]">Horarios</h1>
          <p className="font-body text-sm text-[var(--olive)] mt-1">Franjas horarias disponibles para reservas.</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
          <Plus size={15} /> Añadir franja
        </button>
      </div>

      {showNew && (
        <div className="card-warm rounded-xl p-5 mb-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Nueva franja horaria</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Día</label>
              <select className={inputClass} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Apertura</label>
              <input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Cierre</label>
              <input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Max. comensales</label>
              <input type="number" min={1} className={inputClass} value={form.maxCovers} onChange={(e) => setForm({ ...form, maxCovers: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
            <button onClick={create} disabled={saving} className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Crear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {byDay.map(({ day, idx, slots: daySlots }) => (
          <div key={idx} className="card-warm rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
              <span className="font-display text-base text-[var(--espresso)]">{day}</span>
              <span className="font-body text-xs text-[var(--olive)]">({daySlots.length} franjas)</span>
            </div>
            {daySlots.length === 0 ? (
              <div className="px-5 py-3 font-body text-sm text-[var(--olive)]/50">Sin franjas horarias</div>
            ) : (
              <div className="divide-y divide-[var(--border)]/40">
                {daySlots.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1">
                      <span className="font-body text-sm font-semibold text-[var(--espresso)]">{s.startTime} – {s.endTime}</span>
                      <span className="font-body text-xs text-[var(--olive)] ml-3">máx. {s.maxCovers} comensales</span>
                    </div>
                    <span className={`font-body text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {s.isActive ? "Activa" : "Inactiva"}
                    </span>
                    <button onClick={() => toggle(s.id, s.isActive)} className="p-1.5 rounded-lg text-[var(--olive)] hover:text-[var(--gold)] hover:bg-white/5 transition-colors" title={s.isActive ? "Desactivar" : "Activar"}>
                      {s.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-[var(--olive)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
