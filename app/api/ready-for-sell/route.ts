import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { getRecentReadyForSellLeads } from "@/lib/leads/query";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  return Boolean(session);
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await getRecentReadyForSellLeads();

  return NextResponse.json({
    leads,
    checkedAt: new Date().toISOString(),
  });
}
