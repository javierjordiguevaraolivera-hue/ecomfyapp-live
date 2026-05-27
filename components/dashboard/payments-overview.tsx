"use client";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const billingRows = [
  {
    amount: -18.5,
    createdAt: "May 27, 11:18 AM",
    movementId: "pay_7983a1321086",
    type: "Buying Lead",
  },
  {
    amount: 150,
    createdAt: "May 27, 10:42 AM",
    movementId: "topup_202605271042",
    type: "Recarga",
  },
  {
    amount: -32,
    createdAt: "May 27, 10:31 AM",
    movementId: "call_2f91b7ac2031",
    type: "Buying Call",
  },
  {
    amount: -18.5,
    createdAt: "May 27, 10:25 AM",
    movementId: "pay_7ca4caab8b19",
    type: "Buying Lead",
  },
  {
    amount: 18.5,
    createdAt: "May 27, 09:58 AM",
    movementId: "refund_7ca4caab8b19",
    type: "Reembolso",
  },
  {
    amount: 12,
    createdAt: "May 26, 05:40 PM",
    movementId: "credit_202605261740",
    type: "Promotional Credit",
  },
  {
    amount: -22,
    createdAt: "May 26, 04:12 PM",
    movementId: "pay_6031568b1486",
    type: "Buying Lead",
  },
  {
    amount: 300,
    createdAt: "May 26, 09:30 AM",
    movementId: "topup_202605260930",
    type: "Recarga",
  },
];

function BillingMovementId({ movementId }: { movementId: string }) {
  const visibleSegment = movementId.slice(0, 12);

  return (
    <>
      <code className="hidden max-w-[250px] overflow-x-auto whitespace-nowrap rounded bg-background/80 px-1.5 py-0.5 text-[11px] xl:block">
        {movementId}
      </code>
      <code className="relative block max-w-[72px] overflow-hidden whitespace-nowrap rounded bg-background/80 px-1 py-0.5 text-[11px] xl:hidden">
        {visibleSegment}
        <span className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-background/80 to-transparent" />
      </code>
    </>
  );
}

export function PaymentsOverview() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const balance = 248.75;

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1200);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Saldo actual
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-3xl font-semibold">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <Button className="h-9" type="button">
              Recargar
            </Button>
          </div>
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <CardTitle className="text-xl">Billing history</CardTitle>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] uppercase text-muted-foreground shadow-sm">
              <tr>
                <th className="px-2 py-2 font-medium">Fecha</th>
                <th className="px-2 py-2 text-right font-medium">Monto</th>
                <th className="px-2 py-2 font-medium">Movimiento</th>
                <th className="px-2 py-2 font-medium">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {billingRows.map((row) => {
                const isRecharge = row.amount > 0;

                return (
                  <tr
                    className={
                      isRecharge
                        ? "bg-emerald-50/70 align-top"
                        : "bg-red-50/70 align-top"
                    }
                    key={`${row.type}-${row.createdAt}-${row.amount}`}
                  >
                    <td className="whitespace-nowrap px-2 py-2">
                      {row.createdAt}
                    </td>
                    <td
                      className={
                        isRecharge
                          ? "whitespace-nowrap px-2 py-2 text-right font-semibold text-emerald-700"
                          : "whitespace-nowrap px-2 py-2 text-right font-semibold text-red-700"
                      }
                    >
                      {isRecharge ? "+" : "-"}$
                      {Math.abs(row.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-medium">
                      {row.type}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 xl:gap-2">
                        <BillingMovementId movementId={row.movementId} />
                        <Button
                          aria-label="Copy billing movement ID"
                          className="h-5 w-5 shrink-0 xl:h-6 xl:w-6"
                          onClick={() => copyValue(row.movementId)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {copiedValue === row.movementId ? <Check /> : <Copy />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
