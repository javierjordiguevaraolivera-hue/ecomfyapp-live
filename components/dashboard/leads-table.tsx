"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatDateInTimezone,
  formatTimeInTimezone,
} from "@/lib/leads/date-filters";
import type {
  DashboardTimezone,
  LeadFilterKey,
  LeadFilterOptions,
  LeadFilters,
  LeadDashboardRow,
} from "@/lib/leads/types";
import { Check, Copy, Funnel, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type LeadsTableProps = {
  rows: LeadDashboardRow[];
  timezone: DashboardTimezone;
  filterOptions: LeadFilterOptions;
  activeFilters: LeadFilters;
};

const filterLabels: Record<LeadFilterKey, string> = {
  funnel_id: "Funnel",
  lead_status: "Status",
  sold_as: "Sold as",
  language: "Language",
  source: "Source",
  domain: "Domain",
  sub1: "Sub1",
};

function EmptyValue() {
  return <span className="text-muted-foreground">-</span>;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "sold"
      ? "border-transparent bg-emerald-600 px-2 py-0 text-[11px] text-white hover:bg-emerald-600"
      : "px-2 py-0 text-[11px]";

  return (
    <Badge className={className} variant={status === "sold" ? "default" : "secondary"}>
      {status}
    </Badge>
  );
}

function SoldAsIcon({ value }: { value: string | null }) {
  if (value === "lead") {
    return (
      <span className="inline-flex items-center gap-1" title="lead">
        <UserRound aria-hidden="true" className="h-[1em] w-[1em]" />
        <span>lead</span>
      </span>
    );
  }

  if (value === "call") {
    return (
      <span className="inline-flex items-center gap-1" title="call">
        <Phone aria-hidden="true" className="h-[1em] w-[1em] text-emerald-600" />
        <span>call</span>
      </span>
    );
  }

  return <EmptyValue />;
}

function LeadIdCell({ leadId }: { leadId: string }) {
  const firstSegment = leadId.split("-")[0] ?? leadId;

  return (
    <>
      <code className="hidden max-w-[270px] overflow-x-auto whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-[11px] sm:block">
        {leadId}
      </code>
      <code className="relative block max-w-[62px] overflow-hidden whitespace-nowrap rounded bg-muted px-1 py-0.5 text-[11px] sm:hidden">
        {firstSegment}
        <span className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-muted to-transparent" />
      </code>
    </>
  );
}

function FilterableHeader({
  label,
  filterKey,
  options,
  activeValue,
}: {
  label: string;
  filterKey: LeadFilterKey;
  options: string[];
  activeValue?: string;
}) {
  const searchParams = useSearchParams();

  const makeHref = (value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(filterKey, value);
    } else {
      params.delete(filterKey);
    }

    return `/dashboard?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Filter ${label}`}
            className="h-5 w-5"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Funnel
              className={activeValue ? "fill-current text-foreground" : ""}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 min-w-44">
          <DropdownMenuLabel className="text-xs">
            Filtrar {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={makeHref()}>Todos</Link>
          </DropdownMenuItem>
          {options.length === 0 ? (
            <DropdownMenuItem disabled>Sin opciones</DropdownMenuItem>
          ) : (
            options.map((option) => (
              <DropdownMenuItem asChild key={option}>
                <Link href={makeHref(option)}>
                  {activeValue === option ? <Check /> : null}
                  <span className="truncate">{option}</span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function LeadsTable({
  rows,
  timezone,
  filterOptions,
  activeFilters,
}: LeadsTableProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1200);
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
      <table className="w-full min-w-[1180px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] uppercase text-muted-foreground shadow-sm">
          <tr>
            <th className="px-3 py-2 font-medium">Lead ID</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">
              <FilterableHeader
                activeValue={activeFilters.funnel_id}
                filterKey="funnel_id"
                label={filterLabels.funnel_id}
                options={filterOptions.funnel_id}
              />
            </th>
            <th className="px-3 py-2 font-medium">
              <FilterableHeader
                activeValue={activeFilters.lead_status}
                filterKey="lead_status"
                label={filterLabels.lead_status}
                options={filterOptions.lead_status}
              />
            </th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">
              <FilterableHeader
                activeValue={activeFilters.sold_as}
                filterKey="sold_as"
                label={filterLabels.sold_as}
                options={filterOptions.sold_as}
              />
            </th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">
              <FilterableHeader
                activeValue={activeFilters.language}
                filterKey="language"
                label={filterLabels.language}
                options={filterOptions.language}
              />
            </th>
            <th className="px-3 py-2 font-medium">
              <FilterableHeader
                activeValue={activeFilters.source}
                filterKey="source"
                label={filterLabels.source}
                options={filterOptions.source}
              />
            </th>
            <th className="px-3 py-2 font-medium sm:hidden">
              <FilterableHeader
                activeValue={activeFilters.sold_as}
                filterKey="sold_as"
                label={filterLabels.sold_as}
                options={filterOptions.sold_as}
              />
            </th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">
              <FilterableHeader
                activeValue={activeFilters.domain}
                filterKey="domain"
                label={filterLabels.domain}
                options={filterOptions.domain}
              />
            </th>
            <th className="px-3 py-2 font-medium">
              <FilterableHeader
                activeValue={activeFilters.sub1}
                filterKey="sub1"
                label={filterLabels.sub1}
                options={filterOptions.sub1}
              />
            </th>
            <th className="px-3 py-2 font-medium">Printed numbers</th>
            <th className="px-3 py-2 font-medium sm:hidden">
              <FilterableHeader
                activeValue={activeFilters.language}
                filterKey="language"
                label={filterLabels.language}
                options={filterOptions.language}
              />
            </th>
            <th className="px-3 py-2 font-medium sm:hidden">
              <FilterableHeader
                activeValue={activeFilters.domain}
                filterKey="domain"
                label={filterLabels.domain}
                options={filterOptions.domain}
              />
            </th>
            <th className="px-3 py-2 font-medium sm:hidden">
              <FilterableHeader
                activeValue={activeFilters.funnel_id}
                filterKey="funnel_id"
                label={filterLabels.funnel_id}
                options={filterOptions.funnel_id}
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-12 text-center text-sm text-muted-foreground"
                colSpan={13}
              >
                No hay leads para este filtro.
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.lead_id} className="align-top">
              <td className="min-w-[104px] px-2 py-1.5 sm:min-w-[320px] sm:px-3">
                <div className="flex items-center gap-1 sm:gap-2">
                  <LeadIdCell leadId={row.lead_id} />
                  <Button
                    aria-label="Copy lead ID"
                    className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                    onClick={() => copyValue(row.lead_id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    {copiedValue === row.lead_id ? <Check /> : <Copy />}
                  </Button>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-1.5">
                <span className="hidden sm:inline">
                  {formatDateInTimezone(row.created_at, timezone)}
                </span>
                <span className="sm:hidden">
                  {formatTimeInTimezone(row.created_at, timezone)}
                </span>
              </td>
              <td className="hidden px-3 py-1.5 sm:table-cell">
                {row.funnel_id}
              </td>
              <td className="px-3 py-1.5">
                <StatusBadge status={row.lead_status} />
              </td>
              <td className="hidden px-3 py-1.5 sm:table-cell">
                <SoldAsIcon value={row.sold_as} />
              </td>
              <td className="hidden px-3 py-1.5 sm:table-cell">
                {row.language ?? <EmptyValue />}
              </td>
              <td className="px-3 py-1.5">{row.source ?? <EmptyValue />}</td>
              <td className="px-3 py-1.5 sm:hidden">
                <SoldAsIcon value={row.sold_as} />
              </td>
              <td className="hidden px-3 py-1.5 sm:table-cell">
                {row.domain ?? <EmptyValue />}
              </td>
              <td className="px-3 py-1.5">{row.sub1 ?? <EmptyValue />}</td>
              <td className="min-w-[220px] px-3 py-1.5">
                {row.printed_numbers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {row.printed_numbers.map((number) => (
                      <button
                        className="rounded-md border px-2 py-0.5 text-[11px] hover:bg-accent"
                        key={`${row.lead_id}-${number}`}
                        onClick={() => copyValue(number)}
                        type="button"
                      >
                        {copiedValue === number ? "Copied" : number}
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyValue />
                )}
              </td>
              <td className="px-3 py-1.5 sm:hidden">
                {row.language ?? <EmptyValue />}
              </td>
              <td className="px-3 py-1.5 sm:hidden">
                {row.domain ?? <EmptyValue />}
              </td>
              <td className="px-3 py-1.5 sm:hidden">{row.funnel_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
