import { DashboardShell } from "@/app/dashboard/page";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <DashboardShell routeView="payments" searchParams={searchParams} />;
}
