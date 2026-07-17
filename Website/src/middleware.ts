import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { routing } from "./i18n/routing";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const withPathname = (response: NextResponse) => {
    response.headers.set("x-pathname", pathname);
    return response;
  };

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return withPathname(
        NextResponse.next({ request: { headers: requestHeaders } })
      );
    }

    if (!request.auth) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return withPathname(
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
