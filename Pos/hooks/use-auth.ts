"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    role: session?.user?.role ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isSuperadmin: session?.user?.role === "SUPERADMIN",
    isEmployee: session?.user?.role === "EMPLOYEE",
  };
}
