"use client";

import { useRouter, usePathname } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";

type PrintVariant = { id: string; name: string; priceDelta: number };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  hasVariants: boolean;
  variants: PrintVariant[];
};
type MenuCategory = { id: string; name: string; items: MenuItem[] };

type Info = {
  subtitle: string;
  address: string;
  phone: string;
  hours: string;
  priceNote: string;
  menuTitle: string;
};

type Props = {
  categories: MenuCategory[];
  locale: string;
  info: Info;
};

const LOCALES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
];
const CAT_ORNAMENTS = ["✦", "◈", "✧", "◆", "❋", "◉", "✦", "◈"];
const GOLD = "#A8832A";
const GOLD_LIGHT = "#C9A84C";
const TEXT = "#1a1005";
const MUTED = "#7a6030";

export default function MenuPrintPreview({ categories, locale, info }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";

  return (
    /* Outer wrapper — on print becomes invisible scaffolding */
    <div className="menu-print-root" dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Toolbar (screen only) ── */}
      <div className="no-print menu-print-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/admin/menu-prices")}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "Lora, serif", fontSize: "0.78rem",
              color: "var(--olive)", background: "none", border: "none",
              cursor: "pointer", transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={13} /> Volver
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => router.push(`${pathname}?locale=${code}`)}
                title={label}
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "0.78rem", fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "3px 11px", borderRadius: "4px",
                  border: code === locale
                    ? "1.5px solid var(--gold)"
                    : "1.5px solid rgba(201,168,76,0.25)",
                  background: code === locale
                    ? "rgba(201,168,76,0.15)" : "transparent",
                  color: code === locale ? "var(--gold)" : "var(--olive)",
                  cursor: "pointer", transition: "all 0.18s",
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 20px", fontSize: "0.85rem" }}
        >
          <Printer size={14} />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* ── Gray backdrop (screen only) — sits behind the paper ── */}
      <div className="no-print menu-print-backdrop" />

      {/* ── A4 Paper — always in DOM, scroll inside backdrop on screen, paginated on print ── */}
      <div className="menu-print-paper-wrap">
        <div className="menu-print-paper">

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "7mm" }}>
            <GoldRule />

            <h1 style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "28pt", fontWeight: 700,
              letterSpacing: "-0.01em", lineHeight: 1,
              color: TEXT, margin: 0,
            }}>
              Casa Fenicia
            </h1>
            <p style={{
              fontFamily: "Lora, Georgia, serif",
              fontSize: "7.5pt", letterSpacing: "0.16em",
              textTransform: "uppercase", color: MUTED,
              marginTop: "2mm", marginBottom: 0,
            }}>
              {info.subtitle}
            </p>
            <div style={{
              fontFamily: "Lora, Georgia, serif", fontSize: "7pt", color: MUTED,
              marginTop: "2.5mm",
              display: "flex", flexWrap: "wrap",
              justifyContent: "center", alignItems: "center", gap: "0 5mm",
            }}>
              <span>{info.address}</span>
              <span style={{ color: GOLD_LIGHT }}>◆</span>
              <span>{info.phone}</span>
              <span style={{ color: GOLD_LIGHT }}>◆</span>
              <span>{info.hours}</span>
            </div>
            <p style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "11pt", fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: GOLD, marginTop: "3.5mm", marginBottom: "3mm",
            }}>
              {info.menuTitle}
            </p>
            <GoldRule />
          </div>

          {/* Menu body — 2 columns */}
          <div style={{
            columnCount: 2, columnGap: "8mm",
            columnRuleStyle: "solid", columnRuleWidth: "1px",
            columnRuleColor: "rgba(168,131,42,0.18)",
          }}>
            {categories.map((cat, catIdx) => (
              <div key={cat.id} style={{ breakInside: "avoid", marginBottom: "5.5mm" }}>
                {/* Category header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "2mm",
                  marginBottom: "2.5mm", breakAfter: "avoid",
                }}>
                  <span style={{ color: GOLD, fontSize: "8pt", flexShrink: 0 }}>
                    {CAT_ORNAMENTS[catIdx % CAT_ORNAMENTS.length]}
                  </span>
                  <span style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "10.5pt", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: GOLD, whiteSpace: "nowrap",
                  }}>
                    {cat.name}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(168,131,42,0.22)" }} />
                </div>

                {/* Items */}
                {cat.items.map((item, idx) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "baseline", gap: "1.5mm",
                    padding: "1.2mm 0",
                    borderBottom: idx < cat.items.length - 1
                      ? "0.5px solid rgba(168,131,42,0.1)" : "none",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontFamily: "Cormorant Garamond, Georgia, serif",
                        fontSize: "9.5pt", fontWeight: 600,
                        color: TEXT, display: "block", lineHeight: 1.3,
                      }}>
                        {item.name}
                      </span>
                      {item.description && (
                        <span style={{
                          fontFamily: "Lora, Georgia, serif",
                          fontSize: "6.5pt", color: MUTED,
                          display: "block", lineHeight: 1.3,
                          marginTop: "0.3mm", fontStyle: "italic",
                        }}>
                          {item.description}
                        </span>
                      )}
                      {item.variants.length > 1 && (
                        <span style={{
                          fontFamily: "Lora, Georgia, serif",
                          fontSize: "6pt", color: MUTED,
                          display: "block", marginTop: "0.5mm",
                        }}>
                          {item.variants.map((v) =>
                            `${v.name} ${(item.basePrice + v.priceDelta).toFixed(2).replace(".", ",")} €`
                          ).join(" · ")}
                        </span>
                      )}
                    </div>
                    <div style={{
                      flexShrink: 0, width: "8mm",
                      borderBottom: "1px dotted rgba(168,131,42,0.3)",
                      height: 0, alignSelf: "center", marginBottom: "2px",
                    }} />
                    <span style={{
                      fontFamily: "Cormorant Garamond, Georgia, serif",
                      fontSize: "9.5pt", fontWeight: 700,
                      color: GOLD, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {item.hasVariants && !item.variants.find(v => v.priceDelta === 0) && (
                        <span style={{
                          fontFamily: "Lora, serif", fontSize: "5.5pt",
                          fontWeight: 400, color: MUTED,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          marginInlineEnd: "1mm",
                        }}>
                          desde{" "}
                        </span>
                      )}
                      {item.basePrice.toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: "6mm", textAlign: "center" }}>
            <GoldRule />
            <p style={{
              fontFamily: "Lora, Georgia, serif", fontSize: "6.5pt",
              color: MUTED, letterSpacing: "0.06em", margin: "2mm 0 0",
            }}>
              {info.priceNote}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function GoldRule() {
  return (
    <div style={{
      height: "1px",
      background: `linear-gradient(to right, transparent, ${GOLD} 25%, ${GOLD} 75%, transparent)`,
      margin: "3mm 0",
    }} />
  );
}
