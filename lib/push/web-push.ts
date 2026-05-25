import webPush, { type PushSubscription } from "web-push";

export type StoredPushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type ReadyForSellPushLead = {
  lead_id: string;
  created_at: string;
  source: string | null;
  domain: string | null;
  sub1: string | null;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Web Push VAPID keys are not configured.");
  }

  return { publicKey, privateKey, subject };
}

export function configureWebPush() {
  const { publicKey, privateKey, subject } = getVapidConfig();

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export function getPublicVapidKey() {
  return getVapidConfig().publicKey;
}

export async function sendReadyForSellPush(
  subscription: StoredPushSubscription,
  lead: ReadyForSellPushLead,
) {
  configureWebPush();

  const label = [lead.source, lead.domain, lead.sub1].filter(Boolean).join(" | ");
  const payload = JSON.stringify({
    title: "Lead listo para vender",
    body: label || lead.lead_id,
    icon: "/assets/ecomfy-lead-icon-192.png",
    tag: `ready-for-sell-${lead.lead_id}`,
    url: `/dashboard?lead_id=${encodeURIComponent(lead.lead_id)}`,
  });

  await webPush.sendNotification(subscription as PushSubscription, payload);
}
