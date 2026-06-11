import type { DomainLeadCount } from "@/lib/leads/types";

type TrafficDomainsCardProps = {
  domains: DomainLeadCount[];
};

export function TrafficDomainsCard({ domains }: TrafficDomainsCardProps) {
  return (
    <div className="w-full xl:w-[255px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold">Traffic Domains</h2>
        <span className="text-xs text-muted-foreground">
          {domains.length} {domains.length === 1 ? "dominio" : "dominios"}
        </span>
      </div>

      {domains.length > 0 ? (
        <div className="mt-2 max-h-[252px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ol className="space-y-1">
            {domains.map(({ domain, count }, index) => (
              <li
                className="flex h-7 items-center gap-2 rounded-md bg-muted/45 px-2 text-sm"
                key={domain}
              >
                <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate" title={domain}>
                  {domain}
                </span>
                <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs font-semibold tabular-nums shadow-sm">
                  {count}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Sin dominios en este periodo.
        </p>
      )}
    </div>
  );
}
