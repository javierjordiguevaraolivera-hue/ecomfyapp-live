import {
  getSessionCookieName,
  verifySessionToken,
} from "@/lib/auth/session";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPwaPaths = new Set([
  "/manifest.webmanifest",
  "/sw.js",
  "/apple-touch-icon.png",
  "/favicon.png",
  "/favicon.ico",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/auth/login";
  const isAuthApiRoute =
    pathname === "/api/auth/login" || pathname === "/api/auth/logout";

  if (publicPwaPaths.has(pathname) || pathname.startsWith("/assets/")) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(
    request.cookies.get(getSessionCookieName())?.value,
  );

  if (session && pathname.startsWith("/auth") && request.method === "GET") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!session && !isLoginRoute && !isAuthApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public PWA files
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|manifest.webmanifest|sw.js|favicon.ico|favicon.png|apple-touch-icon.png|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
