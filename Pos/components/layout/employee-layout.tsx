"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, ChefHat, Clock, LayoutGrid, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { UserMenu } from "@/components/shared/user-menu";
import { OfflineBanner } from "@/components/shared/offline-banner";

const mobileNav = [
  {
    id: "pos",
    labelKey: "pos",
    icon: LayoutGrid,
    href: "/employee/pos",
  },
  {
    id: "orders",
    labelKey: "orders",
    icon: ChefHat,
    href: "/employee/orders",
  },
  {
    id: "time",
    labelKey: "timeTracking",
    icon: Clock,
    href: "/employee/time",
  },
  {
    id: "money",
    labelKey: "moneyTracking",
    icon: Wallet,
    href: "/employee/money",
  },
  {
    id: "luggage",
    labelKey: "luggageStorage",
    icon: Briefcase,
    href: "/employee/luggage",
  },
] as const;

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const te = useTranslations("employee");
  const isPosRoute = pathname.startsWith("/employee/pos");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineBanner />
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{t("appName")}</span>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/employee/pos"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                isPosRoute ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {te("pos")}
            </Link>
            <Link
              href="/employee/orders"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                pathname.startsWith("/employee/orders")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {te("orders")}
            </Link>
            <Link
              href="/employee/time"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                pathname.startsWith("/employee/time")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {te("timeTracking")}
            </Link>
            <Link
              href="/employee/money"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                pathname.startsWith("/employee/money")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {te("moneyTracking")}
            </Link>
            <Link
              href="/employee/luggage"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                pathname.startsWith("/employee/luggage")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {te("luggageStorage")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </header>
      <main
        className={cn(
          "flex-1 pb-20",
          isPosRoute ? "md:min-h-0 md:overflow-hidden md:pb-0" : "overflow-auto md:pb-4",
        )}
      >
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const { id, labelKey, icon: Icon, href } = item;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{te(labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
