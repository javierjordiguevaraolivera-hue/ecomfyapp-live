import { LeadsTable } from "@/components/dashboard/leads-table";
import { LeadIdSearch } from "@/components/dashboard/lead-id-search";
import { PpcStatusCard } from "@/components/dashboard/ppc-status-card";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { getPpcStatus, type PpcStatus } from "@/lib/environment/variables";
import {
  normalizeDateFilter,
  normalizeSortDirection,
  normalizeTimezone,
} from "@/lib/leads/date-filters";
import {
  getLeadCountByDateFilter,
  getLeadDashboardRows,
  getLeadFilterOptions,
} from "@/lib/leads/query";
import type { DateFilter, LeadFilterKey, LeadFilters } from "@/lib/leads/types";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

type SearchParams = Record<string, string | string[] | undefined>;
const PAGE_SIZE = 100;

const filterKeys: LeadFilterKey[] = [
  "funnel_id",
  "lead_status",
  "sold_as",
  "language",
  "source",
  "domain",
  "sub1",
];

async function getSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(getSessionCookieName())?.value,
  );

  if (!session) {
    redirect("/auth/login");
  }

  return session;
}

function getSearchValue(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function makeDashboardHref(
  searchParams: SearchParams,
  nextValues: Record<string, string>,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    const cleanValue = Array.isArray(value) ? value[0] : value;

    if (cleanValue) {
      params.set(key, cleanValue);
    }
  });

  Object.entries(nextValues).forEach(([key, value]) => {
    params.set(key, value);
  });

  if (!("page" in nextValues)) {
    params.delete("page");
  }

  return `/dashboard?${params.toString()}`;
}

function getActiveFilters(searchParams: SearchParams) {
  return filterKeys.reduce((filters, key) => {
    const value = getSearchValue(searchParams, key);

    if (value) {
      filters[key] = value;
    }

    return filters;
  }, {} as LeadFilters);
}

function normalizePage(value?: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function FilterButton({
  active,
  href,
  className,
  children,
}: {
  active: boolean;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      asChild
      className={className}
      variant={active ? "default" : "outline"}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function TimezoneSwitcher({
  searchParams,
  timezone,
}: {
  searchParams: SearchParams;
  timezone: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-medium text-muted-foreground xl:inline">
        Timezone:
      </span>
      <FilterButton
        active={timezone === "America/New_York"}
        className={
          timezone === "America/New_York"
            ? "h-9 w-12 bg-muted text-foreground hover:bg-muted/80"
            : "h-9 w-12"
        }
        href={makeDashboardHref(searchParams, {
          timezone: "America/New_York",
        })}
      >
        <img
          alt="New York"
          className="h-5 w-5 rounded-full object-cover"
          src="/assets/flag-for-usa.png"
        />
      </FilterButton>
      <FilterButton
        active={timezone === "America/Lima"}
        className={
          timezone === "America/Lima"
            ? "h-9 w-12 bg-muted text-foreground hover:bg-muted/80"
            : "h-9 w-12"
        }
        href={makeDashboardHref(searchParams, {
          timezone: "America/Lima",
        })}
      >
        <img
          alt="Lima"
          className="h-5 w-5 rounded-full object-cover"
          src="/assets/flag-peru.png"
        />
      </FilterButton>
    </div>
  );
}

function SortIconButton({
  active,
  href,
  direction,
}: {
  active: boolean;
  href: string;
  direction: "desc" | "asc";
}) {
  const Icon = direction === "desc" ? ArrowDown : ArrowUp;

  return (
    <Button
      asChild
      className="h-9 w-9"
      size="icon"
      title={direction === "desc" ? "Nuevo primero" : "Viejo primero"}
      variant={active ? "default" : "outline"}
    >
      <Link href={href}>
        <Icon aria-hidden="true" />
        <span className="sr-only">
          {direction === "desc" ? "Nuevo primero" : "Viejo primero"}
        </span>
      </Link>
    </Button>
  );
}

function PaginationControls({
  currentPage,
  totalCount,
  searchParams,
}: {
  currentPage: number;
  totalCount: number;
  searchParams: SearchParams;
}) {
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <p className="text-sm text-muted-foreground">
        Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button asChild disabled={!hasPrevious} variant="outline">
          <Link
            aria-disabled={!hasPrevious}
            className={!hasPrevious ? "pointer-events-none opacity-50" : ""}
            href={makeDashboardHref(searchParams, {
              page: String(Math.max(currentPage - 1, 1)),
            })}
          >
            <ChevronLeft />
            Anterior
          </Link>
        </Button>
        <Button asChild disabled={!hasNext} variant="outline">
          <Link
            aria-disabled={!hasNext}
            className={!hasNext ? "pointer-events-none opacity-50" : ""}
            href={makeDashboardHref(searchParams, {
              page: String(Math.min(currentPage + 1, totalPages)),
            })}
          >
            Siguiente
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

async function DashboardContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<SearchParams>;
}) {
  await connection();
  const searchParams = await searchParamsPromise;
  const session = await getSession();
  const dateFilter = normalizeDateFilter(getSearchValue(searchParams, "date"));
  const timezone = normalizeTimezone(getSearchValue(searchParams, "timezone"));
  const sort = normalizeSortDirection(getSearchValue(searchParams, "sort"));
  const currentPage = normalizePage(getSearchValue(searchParams, "page"));
  const activeFilters = getActiveFilters(searchParams);
  const leadIdSearch = getSearchValue(searchParams, "lead_id")?.trim();
  let result:
    | Awaited<ReturnType<typeof getLeadDashboardRows>>
    | { rows: []; totalCount: 0 };
  let filterOptions: Awaited<ReturnType<typeof getLeadFilterOptions>> = {
    funnel_id: [],
    lead_status: [],
    sold_as: [],
    language: [],
    source: [],
    domain: [],
    sub1: [],
  };
  let todayCount = 0;
  let yesterdayCount = 0;
  let ppcStatus: PpcStatus = "OFF";
  let dataError: string | null = null;

  try {
    const [rowsResult, optionsResult, todayTotal, yesterdayTotal, ppcValue] =
      await Promise.all([
        getLeadDashboardRows({
          dateFilter,
          timezone,
          sort,
          filters: activeFilters,
          leadIdSearch,
          page: currentPage,
          pageSize: PAGE_SIZE,
        }),
        getLeadFilterOptions({
          dateFilter,
          timezone,
        }),
        getLeadCountByDateFilter({
          dateFilter: "today",
          timezone,
        }),
        getLeadCountByDateFilter({
          dateFilter: "yesterday",
          timezone,
        }),
        getPpcStatus(),
      ]);

    result = rowsResult;
    filterOptions = optionsResult;
    todayCount = todayTotal;
    yesterdayCount = yesterdayTotal;
    ppcStatus = ppcValue;
  } catch (error) {
    result = { rows: [], totalCount: 0 };
    dataError =
      error instanceof Error ? error.message : "No se pudo cargar la data.";
  }

  const dateFilters: Array<{ value: DateFilter; label: string }> = [
    { value: "today", label: "Hoy" },
    { value: "yesterday", label: "Ayer" },
    { value: "7d", label: "Ultimos 7 dias" },
    { value: "all", label: "Todo" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <img
            alt="Ecomfy Lead"
            className="h-8 w-auto sm:h-9"
            src="/assets/Ecomfy-Lead-Logo.png"
          />
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex">
              <TimezoneSwitcher
                searchParams={searchParams}
                timezone={timezone}
              />
            </div>
            <span className="hidden text-sm text-muted-foreground xl:inline">
              {session.email}
            </span>
            <RefreshButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3 sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Leads</CardTitle>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="text-foreground">Leads hoy: {todayCount}</span>
              <span className="text-foreground">
                Leads ayer: {yesterdayCount}
              </span>
            </div>
          </div>
          <div className="justify-self-end">
            <PpcStatusCard initialStatus={ppcStatus} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <LeadIdSearch />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {dateFilters.map((filter) => (
                  <FilterButton
                    active={dateFilter === filter.value}
                    className={
                      filter.value === "7d" || filter.value === "all"
                        ? "hidden xl:inline-flex"
                        : undefined
                    }
                    href={makeDashboardHref(searchParams, {
                      date: filter.value,
                    })}
                    key={filter.value}
                  >
                    {filter.label}
                  </FilterButton>
                ))}
                <SortIconButton
                  active={sort === "desc"}
                  direction="desc"
                  href={makeDashboardHref(searchParams, { sort: "desc" })}
                />
                <SortIconButton
                  active={sort === "asc"}
                  direction="asc"
                  href={makeDashboardHref(searchParams, { sort: "asc" })}
                />
              </div>
            </div>
            <div className="ml-auto xl:hidden">
              <TimezoneSwitcher
                searchParams={searchParams}
                timezone={timezone}
              />
            </div>
          </div>
        </div>

        {dataError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {dataError}
          </div>
        ) : (
          <LeadsTable
            activeFilters={activeFilters}
            filterOptions={filterOptions}
            rows={result.rows}
            timezone={timezone}
          />
        )}
        {!dataError ? (
          <PaginationControls
            currentPage={currentPage}
            searchParams={searchParams}
            totalCount={result.totalCount}
          />
        ) : null}
      </section>
    </>
  );
}

function DashboardFallback() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <img
            alt="Ecomfy Lead"
            className="h-8 w-auto sm:h-9"
            src="/assets/Ecomfy-Lead-Logo.png"
          />
        </div>
      </header>
      <section className="w-full px-4 py-6 sm:px-6">
        <Card className="rounded-lg">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Cargando dashboard...
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}
