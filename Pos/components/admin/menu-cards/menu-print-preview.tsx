"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Printer, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { distributeCategories } from "@/lib/menu-cards/distribute-categories";
import { printMenuPaper } from "@/lib/menu-cards/print-menu-frame";
import "./menu-print.css";

export type MenuPrintOrientation = "portrait" | "landscape";

export type MenuPrintCategory = {
  id: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
  }>;
};

export type MenuPrintCombo = {
  id: string;
  label: string;
  price: number;
  note?: string;
};

export type MenuPrintInfo = {
  businessName: string;
  subtitle: string;
  footerTagline: string;
  priceNote: string;
};

type MenuPrintPreviewProps = {
  categories: MenuPrintCategory[];
  combos?: MenuPrintCombo[];
  info: MenuPrintInfo;
  logoUrl?: string;
};

const CAT_ORNAMENTS = ["◆", "◈", "✦", "◉", "❋", "◆", "◈", "✦"];

function formatMenuPrice(amount: number, compact = false) {
  const value = amount.toFixed(2).replace(".", ",");
  return compact ? `${value}€` : `${value} €`;
}

function columnCountForOrientation(orientation: MenuPrintOrientation) {
  return orientation === "landscape" ? 4 : 2;
}

export function MenuPrintPreview({
  categories,
  combos = [],
  info,
  logoUrl = "/logo.png",
}: MenuPrintPreviewProps) {
  const t = useTranslations("menuCards");
  const [orientation, setOrientation] = useState<MenuPrintOrientation>("landscape");
  const columnCount = columnCountForOrientation(orientation);
  const columnGroups = useMemo(
    () =>
      distributeCategories(categories, columnCount, {
        reserveLastColumn: combos.length > 0 && columnCount >= 4 ? 14 : 0,
      }),
    [categories, columnCount, combos.length],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const paper = paperRef.current;
    if (!paper) return;
    printMenuPaper(paper, orientation);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "menu-print-root",
        orientation === "landscape"
          ? "menu-print-orientation-landscape"
          : "menu-print-orientation-portrait",
      )}
    >
      <div className="no-print menu-print-toolbar">
        <Link
          href="/admin/products"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "menu-print-toolbar-btn gap-1.5",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className="menu-print-orientation-group flex items-center gap-1 rounded-lg border border-[rgba(201,168,76,0.35)] p-1"
            role="group"
            aria-label={t("orientationLabel")}
          >
            <button
              type="button"
              className={cn(
                "menu-print-orientation-btn",
                orientation === "portrait" && "menu-print-orientation-btn-active",
              )}
              onClick={() => setOrientation("portrait")}
            >
              <RectangleVertical className="h-4 w-4 shrink-0" />
              {t("orientationPortrait")}
            </button>
            <button
              type="button"
              className={cn(
                "menu-print-orientation-btn",
                orientation === "landscape" && "menu-print-orientation-btn-active",
              )}
              onClick={() => setOrientation("landscape")}
            >
              <RectangleHorizontal className="h-4 w-4 shrink-0" />
              {t("orientationLandscape")}
            </button>
          </div>
          <Button type="button" className="menu-print-print-btn gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            {t("printBtn")}
          </Button>
        </div>
      </div>

      <div className="no-print menu-print-backdrop" />

      <div className="menu-print-paper-wrap">
        <div ref={paperRef} className="menu-print-paper">
          <header className="menu-print-header-row">
            <div className="menu-print-logo-cell">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={info.businessName || "Logo"}
                  width={96}
                  height={96}
                  unoptimized
                  className="menu-print-logo"
                />
              ) : null}
            </div>

            <div className="menu-print-title-cell">
              {info.businessName ? (
                <h1 className="menu-print-business-name">{info.businessName}</h1>
              ) : null}
              {info.subtitle ? (
                <p className="menu-print-business-subtitle">{info.subtitle}</p>
              ) : null}
            </div>

            <div className="menu-print-combo-cell">
              {combos.length > 0 ? (
                <div className="menu-print-combo-box">
                  <p className="menu-print-combo-title">{t("comboTitle")}</p>
                  <ul className="menu-print-combo-list">
                    {combos.map((combo) => (
                      <li key={combo.id} className="menu-print-combo-item">
                        <span className="menu-print-combo-label">{combo.label}</span>
                        <span className="menu-print-combo-price">
                          {formatMenuPrice(combo.price, true)}
                        </span>
                        {combo.note ? (
                          <p className="menu-print-combo-note">{combo.note}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </header>

          <div className="menu-print-header-rule" />

          {categories.length === 0 ? (
            <p className="menu-print-empty">{t("empty")}</p>
          ) : (
            <div
              className="menu-print-columns-grid"
              style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
            >
              {columnGroups.map((columnCategories, columnIndex) => (
                <div
                  key={`col-${columnIndex}`}
                  className={cn(
                    "menu-print-column",
                    columnIndex < columnCount - 1 && "menu-print-column-divider",
                  )}
                >
                  {columnCategories.map((cat, catIdx) => (
                    <section key={cat.id} className="menu-print-category">
                      <div className="menu-print-category-head">
                        <span className="menu-print-category-icon">
                          {CAT_ORNAMENTS[(columnIndex + catIdx) % CAT_ORNAMENTS.length]}
                        </span>
                        <span className="menu-print-category-name">{cat.name}</span>
                      </div>
                      <ul className="menu-print-item-list">
                        {cat.items.map((item) => (
                          <li key={item.id} className="menu-print-item-row">
                            <span className="menu-print-item-name">{item.name}</span>
                            <span className="menu-print-item-price">
                              {formatMenuPrice(item.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          )}

          <footer className="menu-print-footer">
            <div className="menu-print-header-rule" />
            {info.footerTagline ? (
              <p className="menu-print-footer-tagline">{info.footerTagline}</p>
            ) : null}
            {info.priceNote ? (
              <p className="menu-print-footer-note">{info.priceNote}</p>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
