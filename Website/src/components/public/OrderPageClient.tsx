"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { ShoppingBag, Plus, Minus, Trash2, Loader2, ExternalLink, Flame, Utensils, ShoppingCart } from "lucide-react";
import { formatPrice, isLastHourSaleActive } from "@/lib/utils";
import { formatPriceWithTax, priceWithTax } from "@/lib/menuPricing";
import { tx } from "@/lib/tx";
import { pickName, pickDescription } from "@/lib/pickLocalized";
import type {
  MenuCategory, MenuItem, ItemVariant, ModifierGroup, Modifier,
  LastHourSale, LastHourSaleItem
} from "@prisma/client";

type FullItem = MenuItem & {
  variants: ItemVariant[];
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type FullCategory = MenuCategory & { items: FullItem[] };
type SaleWithItems = LastHourSale & {
  items: (LastHourSaleItem & { menuItem: MenuItem })[];
};

type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  selectedModifiers: { modifierId: string; name: string; priceDelta: number }[];
  quantity: number;
  unitPrice: number;
  isLastHour?: boolean;
};

const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
});
type CheckoutData = z.infer<typeof checkoutSchema>;

type Props = {
  categories: FullCategory[];
  lastHourSale: SaleWithItems | null;
  closingTime: string;
  glovoUrl: string;
  locale: string;
};

export default function OrderPageClient({
  categories, lastHourSale, closingTime, glovoUrl, locale
}: Props) {
  const isEs = locale === "es";
  const [mode, setMode] = useState<"select" | "menu" | "checkout">("select");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const lastHourActive = isLastHourSaleActive(closingTime);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
  });

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const addToCart = (item: FullItem, variantId?: string, modifierIds?: string[]) => {
    const variant = item.variants.find((v) => v.id === variantId);
    const variantDelta = variant ? Number(variant.priceDelta) : 0;

    const selectedModifiers = (modifierIds ?? []).flatMap((mid) => {
      for (const g of item.modifierGroups) {
        const mod = g.modifiers.find((m) => m.id === mid);
        if (mod) return [{
          modifierId: mod.id,
          name: pickName(mod, locale),
          priceDelta: Number(mod.priceDelta),
        }];
      }
      return [];
    });

    const modifierTotal = selectedModifiers.reduce((s, m) => s + m.priceDelta, 0);
    const preTax = Number(item.basePrice) + variantDelta + modifierTotal;
    const unitPrice = priceWithTax(preTax, item.taxRate ?? 10);

    const cartId = `${item.id}-${variantId ?? "base"}-${modifierIds?.join(",") ?? ""}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) {
        return prev.map((c) => c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        id: cartId,
        menuItemId: item.id,
        name: pickName(item, locale),
        variantId,
        variantName: variant ? pickName(variant, locale) : undefined,
        selectedModifiers,
        quantity: 1,
        unitPrice,
      }];
    });

    toast.success(tx(locale, "Añadido al pedido", "Added to order", "أُضيف إلى الطلب", "Zur Bestellung hinzugefügt"), { duration: 1500 });
  };

  const addLastHourItem = (saleItem: SaleWithItems["items"][number]) => {
    const cartId = `lh-${saleItem.menuItemId}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) {
        if (existing.quantity >= saleItem.stockRemaining) {
          toast.error(tx(locale, "Stock agotado", "Stock exhausted", "نفدت الكمية", "Ausverkauft"));
          return prev;
        }
        return prev.map((c) => c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        id: cartId,
        menuItemId: saleItem.menuItemId,
        name: pickName(saleItem.menuItem, locale),
        selectedModifiers: [],
        quantity: 1,
        unitPrice: Number(saleItem.salePrice),
        isLastHour: true,
      }];
    });
    toast.success(tx(locale, "Oferta añadida", "Deal added", "أُضيف العرض", "Angebot hinzugefügt"), { duration: 1500 });
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.id === cartId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const onCheckout = async (data: CheckoutData) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, cart, locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      window.location.href = json.url;
    } catch (e) {
      toast.error(tx(locale, "Error al procesar el pago", "Payment processing failed", "تعذّر إتمام الدفع", "Zahlung fehlgeschlagen"));
      setIsCheckingOut(false);
    }
  };

  const allLabel = tx(locale, "Todo", "All", "الكل", "Alle");
  const lastHourLabel = tx(locale, "⚡ Última Hora", "⚡ Last Call", "⚡ اللحظة الأخيرة", "⚡ Letzte Chance");
  type Tab = { id: string; nameEs: string; nameEn: string; nameAr?: string | null };
  const allCategories: Tab[] = [
    { id: "all", nameEs: allLabel, nameEn: allLabel, nameAr: allLabel },
    ...categories,
    ...(lastHourActive && lastHourSale
      ? [{ id: "lastHour", nameEs: lastHourLabel, nameEn: lastHourLabel, nameAr: lastHourLabel }]
      : []),
  ];

  const filteredCategories = activeCategory === "all"
    ? categories
    : activeCategory === "lastHour"
    ? []
    : categories.filter((c) => c.id === activeCategory);

  const showLastHour = (activeCategory === "all" || activeCategory === "lastHour") && lastHourActive && lastHourSale;

  const inputClass = "w-full bg-[var(--warm-white)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors placeholder:text-[var(--olive)]/50";

  // ── STEP 1: Choose mode ──────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => setMode("menu")}
          className="card-warm rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all border-2 border-transparent hover:border-[var(--gold)]/40 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 flex items-center justify-center mb-5 group-hover:bg-[var(--gold)]/20 transition-colors">
            <ShoppingBag size={28} className="text-[var(--gold)]" />
          </div>
          <h2 className="font-display text-2xl text-[var(--espresso)] mb-2">
            {tx(locale, "Recoger en local", "Pickup", "الاستلام من المطعم", "Abholung vor Ort")}
          </h2>
          <p className="font-body text-sm text-[var(--olive)] leading-relaxed">
            {tx(
              locale,
              "Prepara tu pedido y recógelo en C/ de la Corretgeria, 4. Pago online obligatorio.",
              "We prepare your order and you collect it at C/ de la Corretgeria, 4. Online payment required.",
              "نحضّر طلبك وتستلمه من C/ de la Corretgeria, 4. الدفع الإلكتروني إلزامي.",
              "Wir bereiten Ihre Bestellung zu – Abholung in der C/ de la Corretgeria, 4. Online-Zahlung erforderlich."
            )}
          </p>
          <div className="mt-5 inline-flex items-center gap-1 text-sm font-body text-[var(--gold)]">
            {tx(locale, "Ver carta", "View menu", "عرض القائمة", "Speisekarte ansehen")} →
          </div>
        </button>

        <a
          href={glovoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="card-warm rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all border-2 border-transparent hover:border-[#F9BF3B]/40 group"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden mb-5 shrink-0">
            <Image src="/glovo.png" alt="Glovo" width={64} height={64} className="w-full h-full object-contain" />
          </div>
          <h2 className="font-display text-2xl text-[var(--espresso)] mb-2">
            {tx(locale, "A domicilio", "Delivery", "التوصيل", "Lieferung")}
          </h2>
          <p className="font-body text-sm text-[var(--olive)] leading-relaxed">
            {tx(
              locale,
              "Los pedidos a domicilio se gestionan a través de Glovo. Serás redirigido a nuestra página.",
              "Home deliveries are managed through Glovo. You'll be redirected to our page.",
              "تُدار طلبات التوصيل عبر منصة Glovo. ستتم إعادة توجيهك إلى صفحتنا.",
              "Lieferungen werden über Glovo abgewickelt. Sie werden zu unserer Seite weitergeleitet."
            )}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-body text-[#E8A020]">
            {tx(locale, "Ir a Glovo", "Go to Glovo", "اذهب إلى Glovo", "Zu Glovo")}
            <ExternalLink size={14} />
          </div>
        </a>
      </div>
    );
  }

  // ── STEP 2: Browse menu + cart ───────────────────────────────────
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <>
    {/* Mobile floating cart button */}
    {cart.length > 0 && (
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => {
            document.getElementById("mobile-cart")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-3 bg-[var(--terracotta)] text-white px-6 py-3.5 rounded-full shadow-2xl font-body text-sm font-semibold active:scale-95 transition-transform"
        >
          <ShoppingBag size={18} />
          {tx(locale, "Ver pedido", "View order", "عرض الطلب", "Bestellung ansehen")} · {formatPrice(subtotal)}
          <span className="w-5 h-5 rounded-full bg-white text-[var(--terracotta)] text-xs flex items-center justify-center font-bold">{totalQty}</span>
        </button>
      </div>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Menu */}
      <div className="lg:col-span-2">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full font-body text-sm transition-all ${
                activeCategory === cat.id
                  ? "bg-[var(--terracotta)] text-white"
                  : "bg-[var(--warm-white)] border border-[var(--border)] text-[var(--olive)] hover:border-[var(--terracotta)]"
              }`}
            >
              {pickName(cat, locale)}
            </button>
          ))}
        </div>

        {/* Last Hour items */}
        {showLastHour && lastHourSale && (
          <div className="mb-8 bg-gradient-to-r from-[var(--terracotta-dark)] to-[var(--terracotta)] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={18} className="animate-pulse" />
              <h3 className="font-display text-xl">
                {tx(locale, "Ofertas de última hora", "Last-hour deals", "عروض اللحظة الأخيرة", "Last-Minute-Angebote")}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lastHourSale.items.map((saleItem) => (
                <div key={saleItem.id} className="bg-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-body text-sm font-medium">
                      {pickName(saleItem.menuItem, locale)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-display text-base font-bold">{formatPrice(saleItem.salePrice)}</span>
                      <span className="text-xs text-white/60 line-through">{formatPriceWithTax(saleItem.menuItem.basePrice, saleItem.menuItem.taxRate ?? 10)}</span>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {saleItem.stockRemaining} {tx(locale, "disponibles", "available", "متاحة", "verfügbar")}
                    </div>
                  </div>
                  <button
                    onClick={() => addLastHourItem(saleItem)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular items */}
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="mb-8">
            <h3 className="font-display text-2xl text-[var(--espresso)] mb-4 flex items-center gap-3">
              {pickName(cat, locale)}
              <span className="flex-1 h-px bg-[var(--border)]" />
            </h3>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <OrderMenuItem key={item.id} item={item} locale={locale} onAdd={addToCart} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart sidebar */}
      <div className="lg:col-span-1 pb-24 lg:pb-0" id="mobile-cart">
        <div className="sticky top-24 card-warm rounded-2xl p-5">
          <h3 className="font-display text-xl text-[var(--espresso)] mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[var(--terracotta)]" />
            {tx(locale, "Tu pedido", "Your order", "طلبك", "Ihre Bestellung")}
            {cart.length > 0 && (
              <span className="ml-auto bg-[var(--terracotta)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </h3>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={32} className="text-[var(--gold)]/30 mx-auto mb-2" />
              <p className="font-body text-sm text-[var(--olive)]">
                {tx(locale, "Añade platos para empezar", "Add dishes to get started", "أضف أطباقاً للبدء", "Fügen Sie Gerichte hinzu, um zu beginnen")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm text-[var(--espresso)] truncate">
                        {item.name}
                        {item.isLastHour && (
                          <Flame size={11} className="ml-1 text-[var(--gold)] inline" />
                        )}
                      </div>
                      {item.variantName && (
                        <div className="font-body text-xs text-[var(--olive)]">{item.variantName}</div>
                      )}
                      <div className="font-body text-sm text-[var(--terracotta)]">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={11} className="text-red-500" /> : <Minus size={11} />}
                      </button>
                      <span className="font-body text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-[var(--muted)] hover:bg-[var(--border)] flex items-center justify-center transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4 mb-4">
                <div className="flex justify-between font-display text-lg text-[var(--espresso)]">
                  <span>Total</span>
                  <span className="text-[var(--terracotta)]">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {mode === "menu" && (
                <button
                  onClick={() => setMode("checkout")}
                  className="btn-primary w-full justify-center"
                >
                  {tx(locale, "Continuar al pago", "Continue to payment", "متابعة إلى الدفع", "Weiter zur Zahlung")}
                </button>
              )}
            </>
          )}

          {mode === "checkout" && cart.length > 0 && (
            <form onSubmit={handleSubmit(onCheckout)} className="mt-4 space-y-3">
              <h4 className="font-display text-lg text-[var(--espresso)]">
                {tx(locale, "Tus datos", "Your details", "بياناتك", "Ihre Angaben")}
              </h4>
              <input type="text" className={inputClass} placeholder={tx(locale, "Nombre completo", "Full name", "الاسم الكامل", "Vollständiger Name")} {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{tx(locale, "Nombre requerido", "Name required", "الاسم مطلوب", "Name erforderlich")}</p>}
              <input type="email" className={inputClass} placeholder="email@ejemplo.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{tx(locale, "Email requerido", "Email required", "البريد الإلكتروني مطلوب", "E-Mail erforderlich")}</p>}
              <input type="tel" className={inputClass} placeholder="+34 600 000 000" {...register("phone")} />
              {errors.phone && <p className="text-xs text-red-500">{tx(locale, "Teléfono requerido", "Phone required", "رقم الهاتف مطلوب", "Telefonnummer erforderlich")}</p>}
              <textarea rows={2} className={inputClass} placeholder={tx(locale, "Notas (opcional)", "Notes (optional)", "ملاحظات (اختياري)", "Anmerkungen (optional)")} {...register("notes")} />
              <button type="submit" disabled={isCheckingOut} className="btn-primary w-full justify-center">
                {isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : null}
                {tx(locale, "Pagar con tarjeta", "Pay by card", "ادفع بالبطاقة", "Mit Karte bezahlen")}
              </button>
              <button type="button" onClick={() => setMode("menu")} className="w-full text-center font-body text-sm text-[var(--olive)] hover:text-[var(--terracotta)] transition-colors py-1">
                ← {tx(locale, "Modificar pedido", "Edit order", "تعديل الطلب", "Bestellung bearbeiten")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function OrderMenuItem({
  item, locale, onAdd
}: {
  item: FullItem;
  locale: string;
  onAdd: (item: FullItem, variantId?: string, modifierIds?: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const itemName = pickName(item, locale);
  const itemDescription = pickDescription(item, locale);
  const [selectedVariant, setSelectedVariant] = useState<string>(
    item.variants.find((v) => v.isDefault)?.id ?? item.variants[0]?.id ?? ""
  );
  const [selectedMods, setSelectedMods] = useState<string[]>([]);

  const hasOptions = item.variants.length > 0 || item.modifierGroups.length > 0;

  const toggleMod = (modId: string, maxSelections: number, groupId: string) => {
    const groupMods = item.modifierGroups
      .find((g) => g.id === groupId)
      ?.modifiers.map((m) => m.id) ?? [];

    setSelectedMods((prev) => {
      if (prev.includes(modId)) return prev.filter((id) => id !== modId);
      const groupSelected = prev.filter((id) => groupMods.includes(id));
      if (groupSelected.length >= maxSelections) {
        return [...prev.filter((id) => !groupMods.includes(id)), modId];
      }
      return [...prev, modId];
    });
  };

  return (
    <div className="card-warm rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#1A1500] flex items-center justify-center p-1">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={itemName} fill className="object-contain" />
          ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Utensils size={24} className="text-[var(--gold)]/25" /></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-display text-lg text-[var(--espresso)] leading-tight">
                {itemName}
              </h4>
              {itemDescription && (
                <p className="font-body text-xs text-[var(--olive)] mt-0.5 line-clamp-1">
                  {itemDescription}
                </p>
              )}
            </div>
            <span className="font-display text-base text-[var(--terracotta)] font-semibold whitespace-nowrap">
              {formatPriceWithTax(item.basePrice, item.taxRate ?? 10)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {hasOptions ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-body text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] transition-colors"
              >
                {expanded
                  ? tx(locale, "Cerrar opciones", "Close options", "إغلاق الخيارات", "Optionen schließen")
                  : tx(locale, "Personalizar", "Customize", "تخصيص", "Anpassen")}
              </button>
            ) : null}
            <button
              onClick={() => {
                if (!hasOptions || !expanded) {
                  onAdd(item, selectedVariant || undefined, selectedMods);
                } else {
                  onAdd(item, selectedVariant || undefined, selectedMods);
                  setExpanded(false);
                }
              }}
              className="ml-auto flex items-center gap-1.5 bg-[var(--terracotta)] hover:bg-[var(--terracotta-dark)] text-white rounded-lg px-3 py-1.5 text-sm font-body transition-colors"
            >
              <Plus size={14} />
              {tx(locale, "Añadir", "Add", "أضف", "Hinzufügen")}
            </button>
          </div>
        </div>
      </div>

      {/* Options panel */}
      {expanded && hasOptions && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
          {item.variants.length > 0 && (
            <div>
              <div className="font-body text-xs text-[var(--olive)] mb-2 uppercase tracking-wide">
                {tx(locale, "Selecciona una opción", "Select an option", "اختر خياراً", "Option wählen")}
                <span className="ml-1 text-[var(--terracotta)]">*</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-body transition-all ${
                      selectedVariant === v.id
                        ? "bg-[var(--terracotta)] text-white"
                        : "bg-[var(--muted)] text-[var(--espresso-light)] hover:border-[var(--terracotta)]"
                    }`}
                  >
                    {pickName(v, locale)}
                    {Number(v.priceDelta) !== 0 && (
                      <span className="ml-1 opacity-80">
                        {Number(v.priceDelta) > 0
                          ? `+${formatPriceWithTax(v.priceDelta, item.taxRate ?? 10)}`
                          : formatPriceWithTax(v.priceDelta, item.taxRate ?? 10)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.modifierGroups.map((group) => (
            <div key={group.id}>
              <div className="font-body text-xs text-[var(--olive)] mb-2 uppercase tracking-wide">
                {pickName(group, locale)}
                <span className="ml-1 opacity-60">
                  {group.required
                    ? tx(locale, "(obligatorio)", "(required)", "(مطلوب)", "(Pflicht)")
                    : tx(locale, "(opcional)", "(optional)", "(اختياري)", "(optional)")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.modifiers.map((mod) => {
                  const isSelected = selectedMods.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleMod(mod.id, group.maxSelections, group.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-body border transition-all ${
                        isSelected
                          ? "bg-[var(--terracotta)]/10 border-[var(--terracotta)] text-[var(--terracotta)]"
                          : "border-[var(--border)] text-[var(--espresso-light)] hover:border-[var(--terracotta)]"
                      }`}
                    >
                      {pickName(mod, locale)}
                      {Number(mod.priceDelta) > 0 && (
                        <span className="ml-1 opacity-70">+{formatPriceWithTax(mod.priceDelta, item.taxRate ?? 10)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
