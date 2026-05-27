"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LeadIdSearch({ pathname = "/dashboard" }: { pathname?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("lead_id") ?? "");

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const cleanValue = value.trim();

    if (cleanValue) {
      params.set("lead_id", cleanValue);
    } else {
      params.delete("lead_id");
    }

    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead_id");
    params.delete("page");
    setValue("");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <form className="flex w-full max-w-xl gap-2" onSubmit={submitSearch}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="h-9 pl-8 pr-8"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar por lead ID"
          value={value}
        />
        {value ? (
          <button
            aria-label="Clear lead ID search"
            className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={clearSearch}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
}
