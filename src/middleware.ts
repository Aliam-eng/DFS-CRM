import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/register", "/verify-otp", "/forgot-password"];

const ROLE_ROUTES: Record<string, string[]> = {
  CLIENT: ["/client"],
  COMPLIANCE: ["/compliance"],
  OPERATIONS: ["/operations"],
  ADMIN: ["/admin"],
  SUPER_ADMIN: ["/super-admin", "/admin", "/compliance", "/operations"],
};

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  CLIENT: "/client/dashboard",
  COMPLIANCE: "/compliance/dashboard",
  OPERATIONS: "/operations/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/super-admin/dashboard",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session?.user) {
      const role = (session.user as { role?: string }).role || "CLIENT";
      const dashPath = ROLE_DASHBOARD_PATHS[role] || "/client/dashboard";
      return NextResponse.redirect(new URL(dashPath, req.url));
    }
    return NextResponse.next();
  }

  // Notifications page - accessible by all authenticated
  if (pathname.startsWith("/notifications")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Profile page - accessible by all authenticated
  if (pathname.startsWith("/profile")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const role = (session.user as { role?: string }).role || "CLIENT";
    const dashPath = ROLE_DASHBOARD_PATHS[role] || "/client/dashboard";
    return NextResponse.redirect(new URL(dashPath, req.url));
  }

  // Require auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access
  const userRole = (session.user as { role?: string }).role || "CLIENT";
  const allowedPrefixes = ROLE_ROUTES[userRole] || [];
  const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isAllowed) {
    const dashPath = ROLE_DASHBOARD_PATHS[userRole] || "/client/dashboard";
    return NextResponse.redirect(new URL(dashPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo\\.svg|logo-dark\\.svg).*)"],
};
