import { AdminLayout } from "@/components/layout/admin-layout";
import { requireSuperadmin } from "@/lib/auth-utils";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperadmin();
  return <AdminLayout>{children}</AdminLayout>;
}
