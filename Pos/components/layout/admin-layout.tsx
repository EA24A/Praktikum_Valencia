"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  Percent,
  Users,
  Clock,
  BarChart3,
  ShoppingBag,
  Settings,
  Menu,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { UserMenu } from "@/components/shared/user-menu";
import { useUiStore } from "@/stores/ui-store";

const navItems = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/products", labelKey: "products", icon: Package },
  { href: "/admin/menu-cards", labelKey: "menuCards", icon: BookOpen },
  { href: "/admin/tables", labelKey: "tables", icon: Grid3X3 },
  { href: "/admin/discounts", labelKey: "discounts", icon: Percent },
  { href: "/admin/employees", labelKey: "employees", icon: Users },
  { href: "/admin/time-tracking", labelKey: "timeTracking", icon: Clock },
  { href: "/admin/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/admin/orders", labelKey: "orders", icon: ShoppingBag },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("admin");

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ href, labelKey, icon: Icon }) => {
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "no-print hidden border-r bg-background transition-all lg:block",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          {t("appName")}
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="no-print w-64 p-0">
                <div className="flex h-14 items-center border-b px-4 font-semibold">
                  {t("appName")}
                </div>
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
