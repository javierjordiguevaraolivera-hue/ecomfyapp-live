import { createLeadsClient } from "@/lib/leads/query";

const PPC_STATUS_VARIABLE = "NEXT_PUBLIC_PAY_PER_CALL_STATUS";
const PPC_STATUS_TABLES = {
  spanish: "environment_variables",
  english: "environment_variables_english",
} as const;

export type PpcStatus = "ON" | "OFF";
export type PpcStatusLanguage = keyof typeof PPC_STATUS_TABLES;

function normalizePpcStatus(value: string | null | undefined): PpcStatus {
  return value === "ON" ? "ON" : "OFF";
}

export async function getPpcStatus(language: PpcStatusLanguage = "spanish") {
  const supabase = createLeadsClient();
  const { data, error } = await supabase
    .from(PPC_STATUS_TABLES[language])
    .select("variable_value")
    .eq("variable_name", PPC_STATUS_VARIABLE)
    .single();

  if (error) {
    throw new Error(`Could not read ${PPC_STATUS_VARIABLE}: ${error.message}`);
  }

  return normalizePpcStatus(data?.variable_value);
}

export async function updatePpcStatus(
  status: PpcStatus,
  language: PpcStatusLanguage = "spanish",
) {
  const supabase = createLeadsClient();
  const { data, error } = await supabase
    .from(PPC_STATUS_TABLES[language])
    .update({ variable_value: status })
    .eq("variable_name", PPC_STATUS_VARIABLE)
    .select("variable_value")
    .single();

  if (error) {
    throw new Error(`Could not update ${PPC_STATUS_VARIABLE}: ${error.message}`);
  }

  return normalizePpcStatus(data?.variable_value);
}
