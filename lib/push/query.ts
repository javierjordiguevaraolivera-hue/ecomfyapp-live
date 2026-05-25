import { createLeadsClient } from "@/lib/leads/query";
import type {
  ReadyForSellPushLead,
  StoredPushSubscription,
} from "@/lib/push/web-push";

const PUSH_SCHEMA = "push_notificaciones_ecomfyapp";
const PUSH_CRON_STATE_KEY = "ready_for_sell_push_seeded";

function createPushClient() {
  return createLeadsClient().schema(PUSH_SCHEMA);
}

export async function upsertPushSubscription({
  subscription,
  userAgent,
}: {
  subscription: StoredPushSubscription;
  userAgent: string | null;
}) {
  const supabase = createPushClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      subscription,
      user_agent: userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePushSubscription(endpoint: string) {
  const supabase = createPushClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPushSubscriptions() {
  const supabase = createPushClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,subscription");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{
    endpoint: string;
    subscription: StoredPushSubscription;
  }>;
}

export async function getUnsentReadyForSellLeads() {
  const leadsSupabase = createLeadsClient();
  const pushSupabase = createPushClient();
  const { data: leads, error: leadsError } = await leadsSupabase
    .from("leads")
    .select("lead_id,created_at,source,domain,sub1")
    .eq("lead_status", "ready_for_sell")
    .order("created_at", { ascending: false })
    .limit(100);

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  const typedLeads = (leads ?? []) as ReadyForSellPushLead[];

  if (typedLeads.length === 0) {
    return [];
  }

  const leadIds = typedLeads.map((lead) => lead.lead_id);
  const { data: sentRows, error: sentError } = await pushSupabase
    .from("push_notification_deliveries")
    .select("lead_id")
    .in("lead_id", leadIds);

  if (sentError) {
    throw new Error(sentError.message);
  }

  const sentLeadIds = new Set(
    (sentRows ?? []).map((row: { lead_id: string }) => row.lead_id),
  );

  return typedLeads.filter((lead) => !sentLeadIds.has(lead.lead_id)).reverse();
}

export async function markReadyForSellLeadsSent(leadIds: string[]) {
  if (leadIds.length === 0) {
    return;
  }

  const supabase = createPushClient();
  const { error } = await supabase.from("push_notification_deliveries").upsert(
    leadIds.map((leadId) => ({
      lead_id: leadId,
      sent_at: new Date().toISOString(),
    })),
    { onConflict: "lead_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function hasSeededReadyForSellPush() {
  const supabase = createPushClient();
  const { data, error } = await supabase
    .from("push_cron_state")
    .select("value")
    .eq("key", PUSH_CRON_STATE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.value === "true";
}

export async function markReadyForSellPushSeeded() {
  const supabase = createPushClient();
  const { error } = await supabase.from("push_cron_state").upsert(
    {
      key: PUSH_CRON_STATE_KEY,
      value: "true",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
