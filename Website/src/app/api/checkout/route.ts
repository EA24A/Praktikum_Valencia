import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateOrderNumber, getLastHourCutoff } from "@/lib/utils";

const cartItemSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  name: z.string(),
  variantId: z.string().optional(),
  variantName: z.string().optional(),
  selectedModifiers: z.array(z.object({
    modifierId: z.string(),
    name: z.string(),
    priceDelta: z.number(),
  })),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  isLastHour: z.boolean().optional(),
});

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
  cart: z.array(cartItemSchema).min(1),
  locale: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = data.locale ?? "es";

    // Validate last-hour items: check closing time and stock
    const closingSetting = await prisma.siteSetting.findUnique({
      where: { key: "closing_time" },
    });
    const closingTime = closingSetting?.value ?? "22:00";
    const cutoff = getLastHourCutoff(closingTime);

    const lastHourItems = data.cart.filter((c) => c.isLastHour);
    if (lastHourItems.length > 0) {
      if (new Date() > cutoff) {
        return NextResponse.json(
          { error: "Last-hour sale has ended" },
          { status: 400 }
        );
      }

      // Decrement stock (optimistic — Stripe webhook will create the order)
      for (const ci of lastHourItems) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const saleItem = await prisma.lastHourSaleItem.findFirst({
          where: {
            menuItemId: ci.menuItemId,
            stockRemaining: { gt: 0 },
            sale: { date: { gte: today }, isActive: true },
          },
        });
        if (!saleItem || saleItem.stockRemaining < ci.quantity) {
          return NextResponse.json({ error: `${ci.name} is sold out` }, { status: 400 });
        }
        await prisma.lastHourSaleItem.update({
          where: { id: saleItem.id },
          data: { stockRemaining: { decrement: ci.quantity } },
        });
      }
    }

    const orderNumber = generateOrderNumber();
    const subtotal = data.cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);

    // Create Stripe Checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      line_items: data.cart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: {
            name: item.name + (item.variantName ? ` (${item.variantName})` : ""),
            description: item.selectedModifiers.length > 0
              ? item.selectedModifiers.map((m) => m.name).join(", ")
              : undefined,
          },
        },
      })),
      metadata: {
        orderNumber,
        customerName: data.name,
        customerPhone: data.phone,
        notes: data.notes ?? "",
        locale,
        cartJson: JSON.stringify(data.cart).slice(0, 500), // Stripe metadata 500 char limit per key
      },
      success_url: `${appUrl}/${locale}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${appUrl}/${locale}/pedir`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
