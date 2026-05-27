import { LeadsTable } from "@/components/dashboard/leads-table";
import { LeadIdSearch } from "@/components/dashboard/lead-id-search";
import {
  DesktopSideMenu,
  MobileBottomMenu,
} from "@/components/dashboard/mobile-bottom-menu";
import { PpcStatusCard } from "@/components/dashboard/ppc-status-card";
import { ReadyForSellNotifier } from "@/components/dashboard/ready-for-sell-notifier";
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
type MobileDashboardView = "dashboard" | "payments" | "leads" | "account";
const routePaths: Record<MobileDashboardView, string> = {
  account: "/account",
  dashboard: "/dashboard",
  leads: "/leads",
  payments: "/payments",
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

const closeOptions = [
  {
    label: "NLG",
    logoSrc: "/NLG-logo.png",
  },
  {
    label: "Americo",
    logoSrc: "/americo-logo.png",
  },
  {
    label: "Mutual",
    logoSrc: "/mutual-of-omaha logo.png",
  },
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

function getSearchValues(searchParams: SearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function makeDashboardHref(
  searchParams: SearchParams,
  nextValues: Record<string, string>,
  pathname = "/dashboard",
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view") {
      return;
    }

    const cleanValues = Array.isArray(value) ? value : [value];

    cleanValues.forEach((cleanValue) => {
      if (cleanValue) {
        params.append(key, cleanValue);
      }
    });
  });

  Object.entries(nextValues).forEach(([key, value]) => {
    params.delete(key);
    params.set(key, value);
  });

  if (!("page" in nextValues)) {
    params.delete("page");
  }

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getActiveFilters(searchParams: SearchParams) {
  return filterKeys.reduce((filters, key) => {
    if (key === "domain") {
      const values = getSearchValues(searchParams, key);

      if (values.length > 0) {
        filters[key] = values;
      }

      return filters;
    }

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
  pathname,
  searchParams,
  timezone,
}: {
  pathname: string;
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
        }, pathname)}
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
        }, pathname)}
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
  pathname,
  totalCount,
  searchParams,
}: {
  currentPage: number;
  pathname: string;
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
            }, pathname)}
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
            }, pathname)}
          >
            Siguiente
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MobileDashboardOverview() {
  return (
    <div className="grid gap-3 md:hidden">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-base font-semibold">Registrar un cierre</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {closeOptions.map((option, index) => (
            <button
              className="flex h-16 min-w-0 items-center justify-center rounded-lg border bg-background px-2 py-3 text-xs font-medium hover:bg-accent"
              key={option.label}
              type="button"
            >
              <span className="flex h-10 w-full items-center justify-center text-sm font-semibold">
                {option.logoSrc ? (
                  <img
                    alt={option.label}
                    className="max-h-full max-w-full object-contain"
                    src={option.logoSrc}
                  />
                ) : (
                  index + 1
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="hidden">
        <p className="text-sm font-semibold">PPC Status</p>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Español</span>
            <span className="font-medium">OFF</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Inglés</span>
            <span className="font-medium">OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopDashboardActions() {
  return (
    <section className="hidden rounded-lg border bg-card p-4 md:block">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Registrar un cierre</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona la compania para iniciar el registro.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {closeOptions.map((option) => (
          <button
            className="flex h-20 min-w-0 items-center justify-center rounded-lg border bg-background px-5 py-4 hover:bg-accent"
            key={option.label}
            type="button"
          >
            <img
              alt={option.label}
              className="max-h-12 max-w-full object-contain"
              src={option.logoSrc}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

async function DashboardContent({
  routeView,
  searchParamsPromise,
}: {
  routeView: MobileDashboardView;
  searchParamsPromise: Promise<SearchParams>;
}) {
  await connection();
  const searchParams = await searchParamsPromise;
  const session = await getSession();
  const dateFilter = normalizeDateFilter(getSearchValue(searchParams, "date"));
  const timezone = normalizeTimezone(getSearchValue(searchParams, "timezone"));
  const sort = normalizeSortDirection(getSearchValue(searchParams, "sort"));
  const currentPage = normalizePage(getSearchValue(searchParams, "page"));
  const mobileView = routeView;
  const currentPath = routePaths[routeView];
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
  let ppcEnglishStatus: PpcStatus = "OFF";
  let ppcSpanishStatus: PpcStatus = "OFF";
  let dataError: string | null = null;

  try {
    const [
      rowsResult,
      optionsResult,
      todayTotal,
      yesterdayTotal,
      ppcSpanishValue,
      ppcEnglishValue,
    ] = await Promise.all([
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
        getPpcStatus("spanish"),
        getPpcStatus("english"),
      ]);

    result = rowsResult;
    filterOptions = optionsResult;
    todayCount = todayTotal;
    yesterdayCount = yesterdayTotal;
    ppcSpanishStatus = ppcSpanishValue;
    ppcEnglishStatus = ppcEnglishValue;
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
      <DesktopSideMenu />
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
                pathname={currentPath}
                searchParams={searchParams}
                timezone={timezone}
              />
            </div>
            <span className="hidden text-sm text-muted-foreground xl:inline">
              {session.email}
            </span>
            <ReadyForSellNotifier />
            <RefreshButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-24 pt-3 sm:gap-4 sm:px-6 sm:py-4">
        {mobileView === "dashboard" ? <DesktopDashboardActions /> : null}

        {mobileView === "dashboard" ? (
          <MobileDashboardOverview />
        ) : null}

        <div
          className={
            mobileView === "leads"
              ? "flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
              : "hidden min-h-0 flex-1 flex-col gap-3 sm:gap-4"
            }
        >
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
              <PpcStatusCard
                initialEnglishStatus={ppcEnglishStatus}
                initialSpanishStatus={ppcSpanishStatus}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <LeadIdSearch pathname={currentPath} />

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
                      }, currentPath)}
                      key={filter.value}
                    >
                      {filter.label}
                    </FilterButton>
                  ))}
                  <SortIconButton
                    active={sort === "desc"}
                    direction="desc"
                    href={makeDashboardHref(
                      searchParams,
                      { sort: "desc" },
                      currentPath,
                    )}
                  />
                  <SortIconButton
                    active={sort === "asc"}
                    direction="asc"
                    href={makeDashboardHref(
                      searchParams,
                      { sort: "asc" },
                      currentPath,
                    )}
                  />
                </div>
              </div>
              <div className="ml-auto xl:hidden">
                <TimezoneSwitcher
                  pathname={currentPath}
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
              pathname={currentPath}
              rows={result.rows}
              totalCount={result.totalCount}
              timezone={timezone}
            />
          )}
          {!dataError ? (
            <PaginationControls
              currentPage={currentPage}
              pathname={currentPath}
              searchParams={searchParams}
              totalCount={result.totalCount}
            />
          ) : null}
        </div>
      </section>
      <MobileBottomMenu />
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

export function DashboardShell({
  routeView,
  searchParams,
}: {
  routeView: MobileDashboardView;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background md:pl-24">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent
          routeView={routeView}
          searchParamsPromise={searchParams}
        />
      </Suspense>
    </main>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <DashboardShell routeView="dashboard" searchParams={searchParams} />;
}
