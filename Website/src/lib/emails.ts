import { sendEmail, getAdminEmail, getReservationAdminEmail, isEmailConfigured } from "./resend";
import {
  BRAND,
  emailButton,
  emailDetailsBox,
  emailHighlight,
  emailMuted,
  emailParagraph,
  emailSignoff,
  renderEmail,
  safe,
} from "./emailTemplate";
import type { Order, Reservation } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://casafenicia.com";

// ─── Order emails ────────────────────────────────────────────────────────────

export async function sendOrderAdminEmail(order: Order) {
  await sendEmail({
    to: await getAdminEmail(),
    subject: `Nuevo pedido #${order.orderNumber} – Casa Fenicia`,
    html: renderEmail({
      title: "Nuevo pedido recibido",
      preheader: `Pedido #${order.orderNumber} de ${order.customerName}`,
      body: [
        emailDetailsBox([
          { label: "Pedido", value: `#${order.orderNumber}` },
          { label: "Cliente", value: order.customerName },
          { label: "Email", value: order.customerEmail },
          { label: "Teléfono", value: order.customerPhone },
          { label: "Total", value: `€${Number(order.total).toFixed(2)}` },
          { label: "Estado", value: order.status },
          ...(order.notes ? [{ label: "Notas", value: order.notes }] : []),
        ]),
        order.isLastHourOrder
          ? emailHighlight("Pedido de última hora")
          : "",
        emailButton("Ver en panel admin", `${APP_URL}/admin/orders`),
      ].join(""),
    }),
  });
}

export async function sendOrderCustomerEmail(order: Order) {
  await sendEmail({
    to: order.customerEmail,
    subject: `Pedido confirmado #${order.orderNumber} – Casa Fenicia`,
    html: renderEmail({
      title: "Tu pedido está confirmado",
      preheader: `Hemos recibido tu pedido #${order.orderNumber}`,
      body: [
        emailParagraph(`Hola <strong style="color:${BRAND.sand};">${safe(order.customerName)}</strong>,`),
        emailParagraph("Hemos recibido tu pedido y ya estamos preparándolo."),
        emailDetailsBox([
          { label: "Número de pedido", value: `#${order.orderNumber}` },
          { label: "Total pagado", value: `€${Number(order.total).toFixed(2)}` },
          { label: "Recogida en", value: "C/ de la Corretgeria, 4, Ciutat Vella, Valencia" },
        ]),
        order.isLastHourOrder
          ? emailHighlight("Tu pedido incluye artículos de la oferta de última hora. Recuerda recogerlo antes de las 21:50h.")
          : "",
        emailParagraph("Te avisaremos cuando tu pedido esté listo para recoger."),
        emailSignoff(),
      ].join(""),
    }),
  });
}

export async function sendOrderStatusEmail(order: Order, previousStatus: string) {
  const statusMessages: Record<string, { es: string; en: string }> = {
    PREPARING: { es: "Tu pedido está en preparación", en: "Your order is being prepared" },
    READY: { es: "Tu pedido está listo para recoger", en: "Your order is ready for pickup" },
    COMPLETED: { es: "Pedido completado. Gracias", en: "Order completed. Thank you" },
    CANCELLED: { es: "Tu pedido ha sido cancelado", en: "Your order has been cancelled" },
    REFUNDED: { es: "Tu pedido ha sido reembolsado", en: "Your order has been refunded" },
  };

  const message = statusMessages[order.status];
  if (!message) return;

  await sendEmail({
    to: order.customerEmail,
    subject: `${message.es} – Casa Fenicia #${order.orderNumber}`,
    html: renderEmail({
      title: message.es,
      preheader: `Actualización del pedido #${order.orderNumber}`,
      body: [
        emailParagraph(`Hola <strong style="color:${BRAND.sand};">${safe(order.customerName)}</strong>,`),
        emailParagraph(`${message.es}.`),
        emailDetailsBox([
          { label: "Pedido", value: `#${order.orderNumber}` },
        ]),
        order.status === "READY"
          ? emailHighlight("Puedes venir a recogerlo ahora en C/ de la Corretgeria, 4")
          : "",
        emailSignoff(),
      ].join(""),
    }),
  });
}

// ─── Reservation emails ──────────────────────────────────────────────────────

function reservationDateParts(reservation: Reservation) {
  const dateStr = new Date(reservation.date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(reservation.date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { dateStr, timeStr };
}

export async function sendReservationConfirmationEmails(reservation: Reservation) {
  if (!(await isEmailConfigured())) {
    const message = "RESEND_API_KEY is not set";
    console.error("[reservation emails]", message);
    return { ok: false as const, errors: [message] };
  }

  const results = await Promise.allSettled([
    sendReservationAdminEmail(reservation),
    sendReservationCustomerEmail(reservation),
  ]);

  const errors = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [];
    const target = index === 0 ? "admin" : "customer";
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return [`${target}: ${message}`];
  });

  if (errors.length > 0) {
    console.error("[reservation emails]", errors);
  }

  return { ok: errors.length === 0, errors };
}

export async function sendReservationAdminEmail(reservation: Reservation) {
  const { dateStr, timeStr } = reservationDateParts(reservation);

  await sendEmail({
    to: await getReservationAdminEmail(),
    subject: `Nueva reserva #${reservation.reservationNumber} – Casa Fenicia`,
    html: renderEmail({
      title: "Nueva reserva recibida",
      preheader: `Reserva #${reservation.reservationNumber} de ${reservation.customerName}`,
      body: [
        emailDetailsBox([
          { label: "Referencia", value: `#${reservation.reservationNumber}` },
          { label: "Cliente", value: reservation.customerName },
          { label: "Email", value: reservation.customerEmail },
          { label: "Teléfono", value: reservation.customerPhone },
          { label: "Fecha", value: dateStr },
          { label: "Hora", value: timeStr },
          { label: "Personas", value: String(reservation.partySize) },
          ...(reservation.notes ? [{ label: "Notas", value: reservation.notes }] : []),
        ]),
        emailButton("Ver en panel admin", `${APP_URL}/admin/reservations`),
      ].join(""),
    }),
  });
}

export async function sendReservationCustomerEmail(reservation: Reservation) {
  const { dateStr, timeStr } = reservationDateParts(reservation);

  await sendEmail({
    to: reservation.customerEmail,
    subject: `Reserva recibida #${reservation.reservationNumber} – Casa Fenicia`,
    html: renderEmail({
      title: "Reserva recibida",
      preheader: `Hemos recibido tu solicitud de reserva #${reservation.reservationNumber}`,
      body: [
        emailParagraph(`Hola <strong style="color:${BRAND.sand};">${safe(reservation.customerName)}</strong>,`),
        emailParagraph("Hemos recibido tu solicitud de reserva y la confirmaremos en breve."),
        emailDetailsBox([
          { label: "Referencia", value: `#${reservation.reservationNumber}` },
          { label: "Fecha", value: dateStr },
          { label: "Hora", value: timeStr },
          { label: "Personas", value: String(reservation.partySize) },
          { label: "Lugar", value: "C/ de la Corretgeria, 4, Ciutat Vella, Valencia" },
        ]),
        emailMuted("Si necesitas modificar o cancelar, llámanos al +34 600 345 055."),
        emailSignoff(),
      ].join(""),
    }),
  });
}

export async function sendReservationStatusEmail(reservation: Reservation) {
  const statusMessages: Record<string, string> = {
    CONFIRMED: "Tu reserva está confirmada. Te esperamos.",
    CANCELLED: "Tu reserva ha sido cancelada.",
    NO_SHOW: "Marcamos tu reserva como no asistida.",
  };

  const message = statusMessages[reservation.status];
  if (!message) return;

  const { dateStr, timeStr } = reservationDateParts(reservation);

  await sendEmail({
    to: reservation.customerEmail,
    subject: `${message} – Casa Fenicia #${reservation.reservationNumber}`,
    html: renderEmail({
      title: message,
      preheader: `Actualización de la reserva #${reservation.reservationNumber}`,
      body: [
        emailParagraph(`Hola <strong style="color:${BRAND.sand};">${safe(reservation.customerName)}</strong>,`),
        emailParagraph(message),
        emailDetailsBox([
          { label: "Reserva", value: `#${reservation.reservationNumber}` },
          { label: "Fecha", value: dateStr },
          { label: "Hora", value: timeStr },
          { label: "Personas", value: String(reservation.partySize) },
        ]),
        reservation.status === "CONFIRMED"
          ? emailHighlight("C/ de la Corretgeria, 4, Ciutat Vella, Valencia")
          : "",
        emailSignoff(),
      ].join(""),
    }),
  });
}
