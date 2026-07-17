"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Props = {
  children: React.ReactNode;
  session: Session | null;
  logoUrl?: string;
};

export default function AdminShell({ children, session, logoUrl }: Props) {
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-[var(--cream)] flex">
        {session?.user && (
          <AdminSidebar user={session.user} logoUrl={logoUrl} />
        )}
        <main
          className={`flex-1 ${session?.user ? "pt-16 md:pt-0 md:ml-64" : ""} min-h-screen`}
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
