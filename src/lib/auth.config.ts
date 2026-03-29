import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // Providers are added in auth.ts (not edge-compatible)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "CLIENT" | "COMPLIANCE" | "OPERATIONS" | "ADMIN" | "SUPER_ADMIN";
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = ["/login", "/register", "/verify-otp"].some((p) =>
        nextUrl.pathname.startsWith(p)
      );

      if (isPublic) return true;
      if (isLoggedIn) return true;
      return false; // Redirect to login
    },
  },
} satisfies NextAuthConfig;
