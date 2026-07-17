import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
