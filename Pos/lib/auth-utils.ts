import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    if (session.user.role === "SUPERADMIN") {
      redirect("/admin");
    }
    redirect("/employee");
  }
  return session;
}

export async function requireSuperadmin() {
  return requireRole(["SUPERADMIN"]);
}

export async function requireEmployee() {
  return requireRole(["EMPLOYEE", "SUPERADMIN"]);
}

export async function requireApiSuperadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return null;
  }
  return session;
}
