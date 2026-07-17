import { headers } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";
import { auth } from "@/lib/auth";
import { getSiteImages } from "@/lib/siteImages";

export const metadata = {
  title: "Admin – Casa Fenicia",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const session = await auth();
  const siteImages = session?.user ? await getSiteImages() : null;

  return (
    <AdminShell session={session} logoUrl={siteImages?.logo}>
      {children}
    </AdminShell>
  );
}
