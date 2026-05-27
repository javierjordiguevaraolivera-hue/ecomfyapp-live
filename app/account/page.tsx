import { DashboardShell } from "@/app/dashboard/page";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AccountPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <DashboardShell routeView="account" searchParams={searchParams} />;
}
