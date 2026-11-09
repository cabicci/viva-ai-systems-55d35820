import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { captureWarn } from "@/lib/error-capture";

const ADMIN_QK = ["user-is-admin"] as const;

export function useAdminRole(userId: string | null) {
  const {
    data: adminData,
    error: adminQueryError,
    isSuccess: adminLoaded,
  } = useQuery({
    queryKey: [...ADMIN_QK, userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) {
        captureWarn("entitlements:has_role", error);
        return false;
      }
      return !!data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  return { isAdmin: !adminQueryError && !!adminData, isLoaded: adminLoaded };
}
