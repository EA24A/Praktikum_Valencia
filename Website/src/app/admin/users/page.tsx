"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, ShieldCheck, Shield, UserCog } from "lucide-react";

type AdminUser = { id: string; name: string; email: string; role: "OWNER" | "MANAGER" | "STAFF"; isActive: boolean; createdAt: string };

const ROLES: AdminUser["role"][] = ["OWNER", "MANAGER", "STAFF"];
const ROLE_LABELS: Record<string, string> = { OWNER: "Propietario", MANAGER: "Manager", STAFF: "Personal" };
const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-[var(--gold)]/15 text-[var(--gold)]",
  MANAGER: "bg-blue-500/15 text-blue-400",
  STAFF: "bg-white/10 text-[var(--olive)]",
};

const inputClass = "w-full bg-[#0A0800] border border-[var(--border)] rounded-lg px-3 py-2 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--gold)] transition-colors";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as AdminUser["role"] });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name || !form.email || !form.password) { toast.error("Todos los campos son requeridos"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Usuario creado");
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      setShowNew(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Error");
    }
    setSaving(false);
  };

  const changeRole = async (id: string, role: AdminUser["role"]) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) { toast.success("Rol actualizado"); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Error"); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usuario eliminado"); load(); }
    else { const d = await res.json(); toast.error(d.error ?? "Error"); }
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-[var(--olive)]"><Loader2 size={18} className="animate-spin" /> Cargando...</div>;

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-[var(--espresso)]">Usuarios Admin</h1>
          <p className="font-body text-sm text-[var(--olive)] mt-1">Gestiona el acceso al panel de administración.</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {showNew && (
        <div className="card-warm rounded-xl p-5 mb-5">
          <h3 className="font-display text-lg text-[var(--espresso)] mb-4">Nuevo usuario</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Nombre</label>
              <input className={inputClass} placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Email</label>
              <input type="email" className={inputClass} placeholder="email@casafenicia.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Contraseña</label>
              <input type="password" className={inputClass} placeholder="Contraseña segura" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs text-[var(--olive)] mb-1 block">Rol</label>
              <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser["role"] })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
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

      {/* Role legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {ROLES.map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            {r === "OWNER" ? <ShieldCheck size={13} className="text-[var(--gold)]" /> : r === "MANAGER" ? <Shield size={13} className="text-blue-400" /> : <UserCog size={13} className="text-[var(--olive)]" />}
            <span className="font-body text-xs text-[var(--olive)]">{ROLE_LABELS[r]}: {r === "OWNER" ? "acceso total" : r === "MANAGER" ? "sin usuarios" : "solo pedidos/reservas"}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card-warm rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="w-9 h-9 rounded-full bg-[var(--gold)]/10 flex items-center justify-center font-display text-base font-bold text-[var(--gold)] shrink-0">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-semibold text-[var(--espresso)]">{u.name}</div>
              <div className="font-body text-xs text-[var(--olive)] truncate">{u.email}</div>
            </div>
            <span className={`font-body text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[u.role]}`}>
              {ROLE_LABELS[u.role]}
            </span>
            <select
              value={u.role}
              onChange={(e) => changeRole(u.id, e.target.value as AdminUser["role"])}
              className="bg-[#0A0800] border border-[var(--border)] rounded-lg px-2 py-1 font-body text-xs text-[var(--espresso)] focus:outline-none focus:border-[var(--gold)]"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button
              onClick={() => toggleActive(u.id, u.isActive)}
              className={`font-body text-xs px-2 py-1 rounded-lg border transition-colors ${u.isActive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10"}`}
            >
              {u.isActive ? "Activo" : "Inactivo"}
            </button>
            <button onClick={() => remove(u.id, u.name)} className="p-1.5 rounded-lg text-[var(--olive)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
