import { supabase } from "@/integrations/supabase/client";
export async function learningCommand<T>(action: string, data: object = {}): Promise<T> {
  const result = await supabase.rpc(
    "learning_command" as never,
    { p_action: action, p_data: data } as never,
  );
  if (result.error) throw new Error(result.error.message);
  if (action === "records" && !Array.isArray(result.data))
    throw new Error("LEARNING_RESPONSE_INVALID");
  return result.data as T;
}
export async function learningReports<T>(action: string, data: object = {}): Promise<T> {
  const result = await supabase.rpc(
    "learning_reports" as never,
    { p_action: action, p_data: data } as never,
  );
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
