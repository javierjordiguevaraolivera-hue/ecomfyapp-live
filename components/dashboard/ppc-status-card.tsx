"use client";

import { useEffect, useState } from "react";

type PpcStatusCardProps = {
  initialEnglishStatus: "ON" | "OFF";
  initialSpanishStatus: "ON" | "OFF";
};

type PpcStatusToggleProps = {
  initialStatus: "ON" | "OFF";
  label: string;
  language: "spanish" | "english";
};

function PpcStatusToggle({
  initialStatus,
  label,
  language,
}: PpcStatusToggleProps) {
  const [isOn, setIsOn] = useState(initialStatus === "ON");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsOn(initialStatus === "ON");
  }, [initialStatus]);

  const toggleStatus = async () => {
    const nextIsOn = !isOn;
    const previousIsOn = isOn;

    setIsOn(nextIsOn);
    setIsSaving(true);

    try {
      const response = await fetch("/api/ppc-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          status: nextIsOn ? "ON" : "OFF",
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update PPC status.");
      }

      const data = (await response.json()) as { status: "ON" | "OFF" };
      setIsOn(data.status === "ON");
    } catch {
      setIsOn(previousIsOn);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-14 text-sm">{label}</span>
      <button
        aria-label={`Cambiar PPC ${label}`}
        aria-pressed={isOn}
        disabled={isSaving}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
          isOn ? "bg-emerald-600" : "bg-muted-foreground/30"
        } disabled:opacity-60`}
        onClick={toggleStatus}
        type="button"
      >
        <span
          className={`inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isOn ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function PpcStatusCard({
  initialEnglishStatus,
  initialSpanishStatus,
}: PpcStatusCardProps) {
  return (
    <div className="xl:min-w-[220px]">
      <h2 className="font-bold">PPC Status</h2>
      <div className="mt-2 space-y-2">
        <PpcStatusToggle
          initialStatus={initialSpanishStatus}
          label="Español"
          language="spanish"
        />
        <PpcStatusToggle
          initialStatus={initialEnglishStatus}
          label="Inglés"
          language="english"
        />
      </div>
    </div>
  );
}
