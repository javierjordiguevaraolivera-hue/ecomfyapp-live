import { createLeadsClient } from "@/lib/leads/query";

const PPC_STATUS_VARIABLE = "NEXT_PUBLIC_PAY_PER_CALL_STATUS";

export type PpcStatus = "ON" | "OFF";

function normalizePpcStatus(value: string | null | undefined): PpcStatus {
  return value === "ON" ? "ON" : "OFF";
}

export async function getPpcStatus() {
  const supabase = createLeadsClient();
  const { data, error } = await supabase
    .from("environment_variables")
    .select("variable_value")
    .eq("variable_name", PPC_STATUS_VARIABLE)
    .single();

  if (error) {
    throw new Error(`Could not read ${PPC_STATUS_VARIABLE}: ${error.message}`);
  }

  return normalizePpcStatus(data?.variable_value);
}

export async function updatePpcStatus(status: PpcStatus) {
  const supabase = createLeadsClient();
  const { data, error } = await supabase
    .from("environment_variables")
    .update({ variable_value: status })
    .eq("variable_name", PPC_STATUS_VARIABLE)
    .select("variable_value")
    .single();

  if (error) {
    throw new Error(`Could not update ${PPC_STATUS_VARIABLE}: ${error.message}`);
  }

  return normalizePpcStatus(data?.variable_value);
}
