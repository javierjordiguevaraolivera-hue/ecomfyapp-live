"use client";

import { Button } from "@/components/ui/button";
import { Globe2, Languages, Plus, X } from "lucide-react";
import { useState } from "react";

type TimeRange = {
  end: string;
  id: string;
  start: string;
};

type DaySchedule = {
  day: string;
  ranges: TimeRange[];
};

const initialSchedule: DaySchedule[] = [
  {
    day: "Lunes",
    ranges: [
      { end: "12:00", id: "mon-1", start: "09:00" },
      { end: "18:00", id: "mon-2", start: "14:00" },
    ],
  },
  {
    day: "Martes",
    ranges: [{ end: "17:00", id: "tue-1", start: "10:00" }],
  },
  {
    day: "Miércoles",
    ranges: [{ end: "16:00", id: "wed-1", start: "09:30" }],
  },
  {
    day: "Jueves",
    ranges: [{ end: "18:00", id: "thu-1", start: "11:00" }],
  },
  {
    day: "Viernes",
    ranges: [{ end: "15:00", id: "fri-1", start: "09:00" }],
  },
  {
    day: "Sábado",
    ranges: [],
  },
  {
    day: "Domingo",
    ranges: [],
  },
];

export function AccountOverview({ email }: { email: string }) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const displayName = email.split("@")[0] || "Account";
  const initials = displayName
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const updateRange = (
    day: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ) => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((daySchedule) =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              ranges: daySchedule.ranges.map((range) =>
                range.id === rangeId ? { ...range, [field]: value } : range,
              ),
            }
          : daySchedule,
      ),
    );
  };

  const addRange = (day: string) => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((daySchedule) =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              ranges: [
                ...daySchedule.ranges,
                {
                  end: "17:00",
                  id: `${day}-${Date.now()}`,
                  start: "09:00",
                },
              ],
            }
          : daySchedule,
      ),
    );
  };

  const removeRange = (day: string, rangeId: string) => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((daySchedule) =>
        daySchedule.day === day
          ? {
              ...daySchedule,
              ranges: daySchedule.ranges.filter(
                (range) => range.id !== rangeId,
              ),
            }
          : daySchedule,
      ),
    );
  };

  return (
    <div className="grid gap-3 md:max-w-2xl">
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-base font-semibold text-foreground">
            {initials || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <h2 className="text-sm font-semibold">Preferencias</h2>
        <div className="mt-3 grid divide-y">
          <label className="flex items-center gap-3 py-2 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Languages className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 font-medium">Idioma</span>
            <select
              className="h-9 w-32 rounded-md border bg-background px-2 text-sm"
              defaultValue="es"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex items-center gap-3 py-2 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Globe2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 font-medium">Timezone</span>
            <select
              className="h-9 w-36 rounded-md border bg-background px-2 text-sm"
              defaultValue="America/New_York"
            >
              <option value="America/New_York">New York</option>
              <option value="America/Lima">Lima</option>
              <option value="America/Bogota">Bogota</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Horario activo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecciona uno o varios bloques por día.
            </p>
          </div>
        </div>
        <div className="mt-3 grid divide-y">
          {schedule.map((daySchedule) => (
            <div
              className="grid gap-2 py-3 md:grid-cols-[110px_1fr_auto] md:items-start"
              key={daySchedule.day}
            >
              <p className="text-sm font-medium">{daySchedule.day}</p>
              <div className="grid gap-2">
                {daySchedule.ranges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Inactivo</p>
                ) : null}
                {daySchedule.ranges.map((range) => (
                  <div
                    className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
                    key={range.id}
                  >
                    <input
                      className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
                      onChange={(event) =>
                        updateRange(
                          daySchedule.day,
                          range.id,
                          "start",
                          event.target.value,
                        )
                      }
                      type="time"
                      value={range.start}
                    />
                    <span className="text-sm text-muted-foreground">-</span>
                    <input
                      className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
                      onChange={(event) =>
                        updateRange(
                          daySchedule.day,
                          range.id,
                          "end",
                          event.target.value,
                        )
                      }
                      type="time"
                      value={range.end}
                    />
                    <Button
                      aria-label={`Quitar horario de ${daySchedule.day}`}
                      className="h-9 w-9"
                      onClick={() => removeRange(daySchedule.day, range.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                className="h-9 justify-self-start md:justify-self-end"
                onClick={() => addRange(daySchedule.day)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
