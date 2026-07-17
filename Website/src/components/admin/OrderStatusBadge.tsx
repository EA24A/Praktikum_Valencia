const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "#d97706", bg: "#fef3c7" },
  PAID: { label: "Pagado", color: "#2563eb", bg: "#dbeafe" },
  PREPARING: { label: "Preparando", color: "#7c3aed", bg: "#ede9fe" },
  READY: { label: "Listo", color: "#059669", bg: "#d1fae5" },
  COMPLETED: { label: "Completado", color: "#6b7280", bg: "#f3f4f6" },
  CANCELLED: { label: "Cancelado", color: "#dc2626", bg: "#fee2e2" },
  REFUNDED: { label: "Reembolsado", color: "#db2777", bg: "#fce7f3" },
};

const reservationStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "#d97706", bg: "#fef3c7" },
  CONFIRMED: { label: "Confirmada", color: "#059669", bg: "#d1fae5" },
  SEATED: { label: "Sentados", color: "#2563eb", bg: "#dbeafe" },
  COMPLETED: { label: "Completada", color: "#6b7280", bg: "#f3f4f6" },
  CANCELLED: { label: "Cancelada", color: "#dc2626", bg: "#fee2e2" },
  NO_SHOW: { label: "No asistió", color: "#9ca3af", bg: "#f9fafb" },
};

export default function OrderStatusBadge({
  status,
  type = "order",
}: {
  status: string;
  type?: "order" | "reservation";
}) {
  const config = type === "reservation"
    ? reservationStatusConfig[status]
    : statusConfig[status];

  if (!config) return <span className="font-body text-xs text-[var(--olive)]">{status}</span>;

  return (
    <span
      className="font-body text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}
