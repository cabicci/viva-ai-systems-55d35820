// Synthetic browser fixtures only: no Auth, database or email requests.
export const useAuth = () => ({ user: { id: "synthetic-admin" }, loading: false });
export const listUsers = async () => ({
  users: [{ id: "synthetic-user", email: "registered@example.test" }],
  page: 1,
  hasMore: false,
  total: 1,
});
export const emailAccessCommand = async ({ data }: { data: { action: string; data: unknown } }) => {
  if (data.action === "list")
    return {
      catalogues: [{ id: "ai:pro_plus", title: "AI Pro Plus" }],
      grants: [],
    };
  (window as unknown as { accessSubmission: unknown }).accessSubmission = data;
  return { id: "synthetic-grant" };
};
