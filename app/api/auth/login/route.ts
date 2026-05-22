import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  verifyPassword,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "Login is not configured yet." },
      { status: 500 },
    );
  }

  const emailMatches = await verifyPassword(email ?? "", adminEmail);
  const passwordMatches = await verifyPassword(password ?? "", adminPassword);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  const token = await createSessionToken(adminEmail);

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    maxAge: getSessionMaxAge(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
