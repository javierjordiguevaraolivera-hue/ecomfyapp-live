import {
  getPpcStatus,
  updatePpcStatus,
  type PpcStatus,
} from "@/lib/environment/variables";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  if (!session) {
    return false;
  }

  return true;
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getPpcStatus();

  return NextResponse.json({ status });
}

export async function PATCH(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = (await request.json()) as { status?: PpcStatus };

  if (status !== "ON" && status !== "OFF") {
    return NextResponse.json(
      { error: "Status must be ON or OFF." },
      { status: 400 },
    );
  }

  const updatedStatus = await updatePpcStatus(status);

  return NextResponse.json({ status: updatedStatus });
}
