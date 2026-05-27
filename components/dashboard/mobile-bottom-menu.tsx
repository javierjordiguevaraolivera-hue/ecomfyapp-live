"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Home, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";

const menuItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
  },
  {
    href: "/dashboard",
    icon: CreditCard,
    label: "Payments",
  },
  {
    href: "/dashboard",
    icon: UsersRound,
    label: "Leads",
  },
  {
    href: "/dashboard",
    icon: UserRound,
    label: "Account",
  },
];

export function MobileBottomMenu() {
  const [homeItem, paymentsItem, leadsItem, accountItem] = menuItems;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {[homeItem, paymentsItem].map((item) => (
          <Button
            asChild
            className="h-14 flex-col gap-1 px-1 text-[11px] font-medium"
            key={item.label}
            variant="ghost"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}

        <div className="flex h-14 items-center justify-center">
          <Button
            aria-label="Add"
            className="h-12 w-12 rounded-full shadow-lg"
            size="icon"
            type="button"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {[leadsItem, accountItem].map((item) => (
          <Button
            asChild
            className="h-14 flex-col gap-1 px-1 text-[11px] font-medium"
            key={item.label}
            variant="ghost"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
