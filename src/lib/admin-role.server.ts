type AdminRoleContext = {
  userId: string;
  supabase: {
    rpc(
      name: "has_role",
      args: { _user_id: string; _role: "admin" },
    ): PromiseLike<{ data: unknown; error: unknown }>;
  };
};

/** Check the verified caller on every request before privileged work. */
export async function assertAdminRole(context: AdminRoleContext): Promise<void> {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (data !== true) throw new Error("Forbidden: admin role required");
}
