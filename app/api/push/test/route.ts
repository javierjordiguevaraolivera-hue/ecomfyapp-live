import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { sendTestPush, type StoredPushSubscription } from "@/lib/push/web-push";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function requireSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  return Boolean(session);
}

function isPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") {
    return false;
  }

  const subscription = value as StoredPushSubscription;

  return (
    typeof subscription.endpoint === "string" &&
    typeof subscription.keys?.auth === "string" &&
    typeof subscription.keys?.p256dh === "string"
  );
}

export async function POST(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    subscription?: unknown;
  };

  if (!isPushSubscription(body.subscription)) {
    return NextResponse.json(
      { error: "Invalid push subscription." },
      { status: 400 },
    );
  }

  await sendTestPush(body.subscription);

  return NextResponse.json({ ok: true });
}
