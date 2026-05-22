import {
  getSessionCookieName,
  verifySessionToken,
} from "@/lib/auth/session";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/auth/login";
  const isAuthApiRoute =
    pathname === "/api/auth/login" || pathname === "/api/auth/logout";
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
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
