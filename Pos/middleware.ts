import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login"];

function ensureLocaleCookie(req: NextRequest, response: NextResponse) {
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (
    !cookieLocale ||
    !routing.locales.includes(cookieLocale as (typeof routing.locales)[number])
  ) {
    response.cookies.set("NEXT_LOCALE", routing.defaultLocale, {
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (isPublic) {
    if (isLoggedIn) {
      const destination = role === "SUPERADMIN" ? "/admin" : "/employee/pos";
      return NextResponse.redirect(new URL(destination, nextUrl));
    }
    return ensureLocaleCookie(req, NextResponse.next());
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/employee/pos", nextUrl));
    }
  }

  if (pathname.startsWith("/employee")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/catalog/sync")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const superadminOnly =
      pathname.startsWith("/api/users") ||
      pathname.startsWith("/api/categories") && req.method !== "GET" ||
      pathname.startsWith("/api/products") && req.method !== "GET" ||
      pathname.startsWith("/api/tables") && req.method !== "GET" ||
      pathname.startsWith("/api/discounts") && req.method !== "GET" ||
      pathname.startsWith("/api/reports") ||
      pathname.startsWith("/api/settings") ||
      pathname.includes("/refund");

    if (superadminOnly && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      pathname.startsWith("/api/time-entries") &&
      !pathname.includes("clock-in") &&
      !pathname.includes("clock-out") &&
      !pathname.includes("status") &&
      !pathname.includes("roster") &&
      !pathname.includes("today") &&
      !pathname.includes("terminal") &&
      !pathname.includes("timesheet") &&
      role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    const destination = role === "SUPERADMIN" ? "/admin" : "/employee";
    return NextResponse.redirect(new URL(destination, nextUrl));
  }

  return ensureLocaleCookie(req, NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
