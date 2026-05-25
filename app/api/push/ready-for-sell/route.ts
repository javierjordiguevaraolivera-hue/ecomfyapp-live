import {
  deletePushSubscription,
  getPushSubscriptions,
  getUnsentReadyForSellLeads,
  hasSeededReadyForSellPush,
  markReadyForSellLeadsSent,
  markReadyForSellPushSeeded,
} from "@/lib/push/query";
import { sendReadyForSellPush } from "@/lib/push/web-push";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await getUnsentReadyForSellLeads();

  if (!(await hasSeededReadyForSellPush())) {
    await markReadyForSellLeadsSent(leads.map((lead) => lead.lead_id));
    await markReadyForSellPushSeeded();

    return NextResponse.json({
      ok: true,
      seeded: true,
      sent: 0,
      skipped: leads.length,
    });
  }

  if (leads.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const subscriptions = await getPushSubscriptions();
  let sent = 0;

  for (const lead of leads) {
    for (const { endpoint, subscription } of subscriptions) {
      try {
        await sendReadyForSellPush(subscription, lead);
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(endpoint);
        }
      }
    }
  }

  await markReadyForSellLeadsSent(leads.map((lead) => lead.lead_id));

  return NextResponse.json({
    ok: true,
    leads: leads.length,
    subscriptions: subscriptions.length,
    sent,
  });
}
