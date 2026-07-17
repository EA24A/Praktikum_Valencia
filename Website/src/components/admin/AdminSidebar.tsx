"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Calendar,
  Table2, Clock, Flame, Search, Settings, Users, LogOut, ChevronRight, Menu, X,
  Image as ImageIcon, Tag, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
};

const navItems: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Pedidos" },
  { href: "/admin/reservations", icon: Calendar, label: "Reservas" },
  { href: "/admin/menu", icon: UtensilsCrossed, label: "Carta" },
  { href: "/admin/menu-prices", icon: Tag, label: "Precios QR", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/menu-print", icon: FileText, label: "Imprimir Carta", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/tables", icon: Table2, label: "Mesas", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/slots", icon: Clock, label: "Horarios", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/last-hour", icon: Flame, label: "Última Hora", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/seo", icon: Search, label: "SEO", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/images", icon: ImageIcon, label: "Imágenes", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/settings", icon: Settings, label: "Ajustes", roles: ["OWNER", "MANAGER"] },
  { href: "/admin/users", icon: Users, label: "Usuarios", roles: ["OWNER"] },
];

type Props = {
  user: { name?: string | null; email?: string | null; role?: string };
  logoUrl?: string;
};

export default function AdminSidebar({ user, logoUrl }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user.role ?? "STAFF";
  const logoSrc = logoUrl ?? "/logo.png";

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const closeMobileMenu = () => setMobileOpen(false);

  const navLinks = (
    <nav className="flex-1 p-4 space-y-1">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileMenu}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-all",
              isActive
                ? "bg-[var(--terracotta)] text-white"
                : "text-[var(--sand)]/70 hover:bg-white/5 hover:text-[var(--sand)]"
            )}
          >
            <item.icon size={16} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight size={14} className="opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div
        className="no-print md:hidden fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-[#050505] z-40"
        style={{ borderBottom: "1px solid #1E1800" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[var(--gold)]/30 shrink-0 bg-black">
            <Image src={logoSrc} alt="Casa Fenicia" width={64} height={64} className="w-full h-full object-contain" unoptimized={logoSrc.startsWith("/")} />
          </div>
          <div className="font-display text-base text-white">Admin</div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[var(--sand)] hover:bg-white/5"
          aria-label={mobileOpen ? "Cerrar navegación" : "Abrir navegación"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="no-print md:hidden fixed inset-0 bg-black/55 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "no-print fixed top-16 bottom-0 left-0 w-64 bg-[#050505] z-50 overflow-y-auto flex flex-col transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderRight: "1px solid #1E1800" }}
      >
        {navLinks}

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--terracotta)]/30 flex items-center justify-center text-[var(--terracotta-light)] text-sm font-display font-bold">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="font-body text-sm text-white truncate">{user.name}</div>
              <div className="font-body text-xs text-[var(--sand)]/50">{role}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg font-body text-xs text-[var(--sand)]/50 hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <aside className="no-print hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#050505] flex-col z-40 overflow-y-auto" style={{ borderRight: "1px solid #1E1800" }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-[var(--gold)]/30 shrink-0 bg-black">
              <Image src={logoSrc} alt="Casa Fenicia" width={80} height={80} className="w-full h-full object-contain" unoptimized={logoSrc.startsWith("/")} />
            </div>
            <div>
              <div className="font-display text-base text-white">Casa Fenicia</div>
              <div className="font-body text-xs text-[var(--sand)]/50">Admin</div>
            </div>
          </div>
        </div>

        {navLinks}

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--terracotta)]/30 flex items-center justify-center text-[var(--terracotta-light)] text-sm font-display font-bold">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="font-body text-sm text-white truncate">{user.name}</div>
              <div className="font-body text-xs text-[var(--sand)]/50">{role}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg font-body text-xs text-[var(--sand)]/50 hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
