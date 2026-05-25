import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { getReadyForSellLeadsSince } from "@/lib/leads/query";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  return Boolean(session);
}

function normalizeSince(value: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function GET(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = normalizeSince(url.searchParams.get("since"));

  if (!since) {
    return NextResponse.json(
      { error: "Invalid since timestamp." },
      { status: 400 },
    );
  }

  const leads = await getReadyForSellLeadsSince(since);

  return NextResponse.json({
    leads,
    checkedAt: new Date().toISOString(),
  });
}
