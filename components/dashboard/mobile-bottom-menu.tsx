"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, Home, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/payments",
    icon: CreditCard,
    label: "Payments",
  },
  {
    href: "/leads",
    icon: UsersRound,
    label: "Leads",
  },
  {
    href: "/account",
    icon: UserRound,
    label: "Account",
  },
];

export function MobileBottomMenu() {
  const [dashboardItem, paymentsItem, leadsItem, accountItem] = menuItems;
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {[dashboardItem, paymentsItem].map((item) => (
          <Button
            asChild
            className={cn(
              "h-14 flex-col gap-1 px-1 text-[11px] font-medium",
              pathname === item.href && "text-foreground",
            )}
            key={item.label}
            variant={pathname === item.href ? "secondary" : "ghost"}
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
            className={cn(
              "h-14 flex-col gap-1 px-1 text-[11px] font-medium",
              pathname === item.href && "text-foreground",
            )}
            key={item.label}
            variant={pathname === item.href ? "secondary" : "ghost"}
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

export function DesktopSideMenu() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Desktop navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-24 border-r bg-background md:flex"
    >
      <nav className="flex w-full flex-col items-center gap-2 px-2 py-4">
        <div className="mb-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-muted">
          <img
            alt="Ecomfy"
            className="h-full w-full object-cover"
            src="/assets/ecomfy_lead_icon.jpg"
          />
        </div>
        {menuItems.slice(0, 2).map((item) => (
          <Button
            asChild
            className={cn(
              "h-16 w-full flex-col gap-1 px-1 text-[11px] font-medium",
              pathname === item.href && "text-foreground",
            )}
            key={item.label}
            variant={pathname === item.href ? "secondary" : "ghost"}
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}

        <Button
          aria-label="Add"
          className="my-2 h-12 w-12 rounded-full shadow-lg"
          size="icon"
          type="button"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {menuItems.slice(2).map((item) => (
          <Button
            asChild
            className={cn(
              "h-16 w-full flex-col gap-1 px-1 text-[11px] font-medium",
              pathname === item.href && "text-foreground",
            )}
            key={item.label}
            variant={pathname === item.href ? "secondary" : "ghost"}
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
