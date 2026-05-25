import { createClient } from "@supabase/supabase-js";
import { getDateRange } from "./date-filters";
import type {
  DashboardTimezone,
  DateFilter,
  LeadFilterKey,
  LeadFilterOptions,
  LeadFilters,
  LeadDashboardRow,
  SortDirection,
} from "./types";

type LeadRecord = Omit<LeadDashboardRow, "printed_numbers">;

type RingbaCallEvent = {
  lead_id: string | null;
  printed_number: string | null;
};

export type LeadQueryOptions = {
  dateFilter: DateFilter;
  timezone: DashboardTimezone;
  sort: SortDirection;
  filters?: LeadFilters;
  leadIdSearch?: string;
  page?: number;
  pageSize?: number;
};

const filterKeys: LeadFilterKey[] = [
  "funnel_id",
  "lead_status",
  "sold_as",
  "language",
  "source",
  "domain",
  "sub1",
];

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createLeadsClient() {
  const url = process.env.LEADS_SUPABASE_URL;
  const serviceRoleKey = process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase leads credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getLeadDashboardRows({
  dateFilter,
  timezone,
  sort,
  filters = {},
  leadIdSearch,
  page = 1,
  pageSize = 100,
}: LeadQueryOptions) {
  const supabase = createLeadsClient();
  const range = getDateRange(dateFilter, timezone);
  const from = Math.max(page - 1, 0) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("leads")
    .select(
      "lead_id,created_at,funnel_id,lead_status,sold_as,language,source,domain,sub1",
      { count: "exact" },
    )
    .order("created_at", { ascending: sort === "asc" })
    .range(from, to);

  if (range) {
    query = query.gte("created_at", range.from).lt("created_at", range.to);
  }

  filterKeys.forEach((key) => {
    const value = filters[key];

    if (value) {
      query = query.eq(key, value);
    }
  });

  if (leadIdSearch) {
    if (!uuidRegex.test(leadIdSearch)) {
      return { rows: [], totalCount: 0 };
    }

    query = query.eq("lead_id", leadIdSearch);
  }

  const { data: leads, error: leadsError, count } = await query;

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  const typedLeads = (leads ?? []) as LeadRecord[];
  const leadIds = typedLeads.map((lead) => lead.lead_id);

  if (leadIds.length === 0) {
    return { rows: [], totalCount: count ?? 0 };
  }

  const { data: events, error: eventsError } = await supabase
    .from("ringba_call_events")
    .select("lead_id,printed_number,created_at")
    .in("lead_id", leadIds)
    .not("printed_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const numbersByLeadId = new Map<string, string[]>();

  ((events ?? []) as RingbaCallEvent[]).forEach((event) => {
    if (!event.lead_id || !event.printed_number) {
      return;
    }

    const current = numbersByLeadId.get(event.lead_id) ?? [];

    if (!current.includes(event.printed_number)) {
      current.push(event.printed_number);
    }

    numbersByLeadId.set(event.lead_id, current);
  });

  return {
    rows: typedLeads.map((lead) => ({
      ...lead,
      printed_numbers: numbersByLeadId.get(lead.lead_id) ?? [],
    })),
    totalCount: count ?? typedLeads.length,
  };
}

export async function getLeadFilterOptions({
  dateFilter,
  timezone,
}: Pick<LeadQueryOptions, "dateFilter" | "timezone">) {
  const supabase = createLeadsClient();
  const range = getDateRange(dateFilter, timezone);
  let query = supabase
    .from("leads")
    .select("funnel_id,lead_status,sold_as,language,source,domain,sub1")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (range) {
    query = query.gte("created_at", range.from).lt("created_at", range.to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const options = filterKeys.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as LeadFilterOptions);

  (data ?? []).forEach((row) => {
    filterKeys.forEach((key) => {
      const value = row[key];

      if (typeof value === "string" && value && !options[key].includes(value)) {
        options[key].push(value);
      }
    });
  });

  filterKeys.forEach((key) => {
    options[key].sort((left, right) => left.localeCompare(right));
  });

  return options;
}

export async function getLeadCountByDateFilter({
  dateFilter,
  timezone,
}: Pick<LeadQueryOptions, "dateFilter" | "timezone">) {
  const supabase = createLeadsClient();
  const range = getDateRange(dateFilter, timezone);
  let query = supabase
    .from("leads")
    .select("lead_id", { count: "exact", head: true });

  if (range) {
    query = query.gte("created_at", range.from).lt("created_at", range.to);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getRecentReadyForSellLeads() {
  const supabase = createLeadsClient();
  const { data, error } = await supabase
    .from("leads")
    .select("lead_id,created_at,source,domain,sub1")
    .eq("lead_status", "ready_for_sell")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<
    Pick<LeadDashboardRow, "lead_id" | "created_at" | "source" | "domain" | "sub1">
  >;
}
