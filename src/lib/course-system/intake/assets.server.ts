import { sha256 } from "@/lib/card-assistant/corpus";
export type PrivateCourseAsset = {
  id: string;
  sha256: string;
  storage?: { bucket: "academic-downloads" | "technical-downloads"; path: string };
};
export async function verifyPrivateCourseAssets(assets: PrivateCourseAsset[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const proofs: { id: string; sha256: string }[] = [];
  for (const asset of assets) {
    if (!asset.storage) continue;
    const object = await supabaseAdmin.storage
      .from(asset.storage.bucket)
      .download(asset.storage.path);
    if (
      object.error ||
      !object.data ||
      object.data.size > 10_485_760 ||
      (await sha256(new Uint8Array(await object.data.arrayBuffer()))) !== asset.sha256
    )
      throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    proofs.push({ id: asset.id, sha256: asset.sha256 });
  }
  return proofs;
}
