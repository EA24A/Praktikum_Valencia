import { EmployeeLayout } from "@/components/layout/employee-layout";
import { requireEmployee } from "@/lib/auth-utils";

export default async function EmployeeGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireEmployee();
  return <EmployeeLayout>{children}</EmployeeLayout>;
}
