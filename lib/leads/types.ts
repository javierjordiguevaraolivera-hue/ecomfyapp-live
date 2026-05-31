export type DashboardTimezone = "America/New_York" | "America/Lima";

export type DateFilter = "today" | "yesterday" | "7d" | "all";

export type SortDirection = "desc" | "asc";

export type LeadDashboardRow = {
  lead_id: string;
  created_at: string;
  funnel_id: string;
  lead_status: string;
  sold_as: string | null;
  language: string | null;
  source: string | null;
  domain: string | null;
  sub1: string | null;
  adaccount_name: string | null;
  printed_numbers: string[];
};

export type LeadFilterKey =
  | "funnel_id"
  | "lead_status"
  | "sold_as"
  | "language"
  | "source"
  | "domain"
  | "sub1";

export type LeadFilters = Partial<Record<LeadFilterKey, string | string[]>>;

export type LeadFilterOptions = Record<LeadFilterKey, string[]>;
