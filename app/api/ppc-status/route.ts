import {
  getPpcStatus,
  updatePpcStatus,
  type PpcStatusLanguage,
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

function normalizeLanguage(value?: string): PpcStatusLanguage {
  return value === "english" ? "english" : "spanish";
}

export async function GET(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const language = normalizeLanguage(url.searchParams.get("language") ?? "");
  const status = await getPpcStatus(language);

  return NextResponse.json({ status });
}

export async function PATCH(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, language } = (await request.json()) as {
    status?: PpcStatus;
    language?: string;
  };

  if (status !== "ON" && status !== "OFF") {
    return NextResponse.json(
      { error: "Status must be ON or OFF." },
      { status: 400 },
    );
  }

  const updatedStatus = await updatePpcStatus(
    status,
    normalizeLanguage(language),
  );

  return NextResponse.json({ status: updatedStatus });
}
