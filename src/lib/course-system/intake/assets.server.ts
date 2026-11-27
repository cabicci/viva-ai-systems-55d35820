import { sha256 } from "@/lib/card-assistant/corpus";
export type PrivateCourseAsset = {
  id: string;
  sha256: string;
  storage?: { bucket: "academic-downloads" | "technical-downloads"; path: string };
};

const privateAssetLimit = 10_485_760;
const privateAssetTypes: Record<string, string> = {
  wav: "audio/wav",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function storeReviewedCourseAsset(asset: PrivateCourseAsset, file: Blob) {
  const destination = asset.storage;
  const mime = destination && privateAssetTypes[destination.path.split(".").pop() ?? ""];
  if (!destination || !mime || !file.size || file.size > privateAssetLimit)
    throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if ((await sha256(bytes)) !== asset.sha256) throw new Error("CURRICULUM_ASSET_CHANGED");
  if (
    mime === "audio/wav" &&
    (bytes.length < 44 ||
      String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
      String.fromCharCode(...bytes.slice(8, 12)) !== "WAVE")
  )
    throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.storage
    .from(destination.bucket)
    .upload(destination.path, bytes, {
      contentType: mime,
      upsert: false,
    });
  // A retry may find the same immutable object, including after a lost response.
  if (result.error) await verifyPrivateCourseAssets([asset]);
  return { sha256: asset.sha256 };
}
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
      object.data.size > privateAssetLimit ||
      (await sha256(new Uint8Array(await object.data.arrayBuffer()))) !== asset.sha256
    )
      throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    proofs.push({ id: asset.id, sha256: asset.sha256 });
  }
  return proofs;
}
