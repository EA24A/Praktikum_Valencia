import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role as Role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname.startsWith("/login")) {
        return true;
      }

      if (pathname.startsWith("/admin")) {
        return isLoggedIn && role === "SUPERADMIN";
      }

      if (pathname.startsWith("/employee")) {
        return isLoggedIn;
      }

      if (pathname.startsWith("/api/health") || pathname.startsWith("/api/auth")) {
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
