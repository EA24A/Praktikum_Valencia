import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderAdminEmail, sendOrderCustomerEmail } from "@/lib/emails";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    // Retrieve full session with line items
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    let cartItems: {
      menuItemId: string;
      name: string;
      variantName?: string;
      quantity: number;
      unitPrice: number;
      selectedModifiers: { name: string; priceDelta: number }[];
    }[] = [];

    try {
      cartItems = JSON.parse(meta.cartJson ?? "[]");
    } catch {
      cartItems = [];
    }

    const subtotal = (session.amount_total ?? 0) / 100;

    const order = await prisma.order.create({
      data: {
        orderNumber: meta.orderNumber ?? session.id,
        customerName: meta.customerName ?? "Unknown",
        customerEmail: session.customer_email ?? "",
        customerPhone: meta.customerPhone ?? "",
        orderType: "PICKUP",
        status: "PAID",
        subtotal,
        total: subtotal,
        notes: meta.notes,
        stripeSessionId: session.id,
        stripePaymentIntent: typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
        isLastHourOrder: cartItems.some((c) => (c as { isLastHour?: boolean }).isLastHour),
        items: {
          create: cartItems.map((item) => ({
            itemId: item.menuItemId,
            itemName: item.name,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            modifiers: item.selectedModifiers ?? [],
          })),
        },
        statusHistory: {
          create: { status: "PAID" },
        },
      },
    });

    // Send emails
    Promise.all([
      sendOrderAdminEmail(order),
      sendOrderCustomerEmail(order),
    ]).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
