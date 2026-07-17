import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config shared by the Node auth handler and middleware.
 * Keep providers out of this file — they live in auth.ts (Prisma/bcrypt).
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/admin/login") return true;
      if (pathname.startsWith("/admin")) return !!auth;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
