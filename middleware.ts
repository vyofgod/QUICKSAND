/**
 * Next.js Middleware
 * Runs before every request
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  console.log(
    `[middleware] ${pathname} - Auth: ${isAuthenticated ? "YES" : "NO"}`,
    req.auth?.user?.id
  );

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/error"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated
  if (!req.auth && pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/auth/signin", req.url);
    console.log(`[middleware] Redirecting to signin from ${pathname}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
};
