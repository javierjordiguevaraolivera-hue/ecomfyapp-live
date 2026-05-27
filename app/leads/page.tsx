import { DashboardShell } from "@/app/dashboard/page";

type SearchParams = Record<string, string | string[] | undefined>;

export default function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <DashboardShell routeView="leads" searchParams={searchParams} />;
}
