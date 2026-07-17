import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderDetailClient from "@/components/admin/OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return <OrderDetailClient order={order} userRole={session.user.role ?? "STAFF"} />;
}
