import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { verifyGithub } from "./auth.ts";
const BATCH = "technical-motion-v2-20261011";
const guid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const sha = /^[a-f0-9]{64}$/;
const db = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const json = (value: unknown,status=200) => new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async req => {
  try {
    if (req.method !== "POST") return json({error:"POST required"},405);
    const batch = await db.from("technical_video_replacement_batches").select("source_sha,baseline,enabled,expires_at").eq("batch_id",BATCH).single();
    if (batch.error || !batch.data?.enabled || Date.parse(batch.data.expires_at) <= Date.now()) return json({error:"Batch inactive"},403);
    const token = req.headers.get("x-github-oidc");
    if (!token) return json({error:"Identity required"},401);
    let claims;
    try { claims=await verifyGithub(token,batch.data.source_sha); } catch { return json({error:"Identity rejected"},401); }
    const bodyText=await req.text();
    if(bodyText.length>4000)return json({error:"Oversized request"},400);
    const b=JSON.parse(bodyText);
    if(b.batchId!==BATCH)return json({error:"Wrong batch"},400);
    if(b.operation==="preflight")return json({ready:true,batchId:BATCH,cells:batch.data.baseline.length});
    const old=batch.data.baseline.find((r: Record<string,string>)=>r.lesson_id===b.lessonId&&r.locale===b.locale);
    if(!old||b.oldGuid!==old.video_guid||b.sourceHash!==old.source_sha256||!guid.test(b.newGuid)||b.newGuid===b.oldGuid||
       !sha.test(b.videoSha256)||!sha.test(b.audioSha256)||!sha.test(b.backupSha256)||!Number.isFinite(b.durationSeconds)||b.durationSeconds<10||
       b.newTts!==(b.locale==="ar-EG")||b.backupRunId!==String(claims.run_id)||!/^\d+$/.test(b.backupArtifactId??"")) return json({error:"Cell evidence rejected"},400);
    const playback=await fetch(`https://video.bunnycdn.com/library/670679/videos/${b.newGuid}/play`,{signal:AbortSignal.timeout(15000)});
    if(!playback.ok)return json({error:"Video unavailable"},409);
    const p=await playback.json();
    if(!p.isPlayable||p.video?.guid!==b.newGuid||p.video?.videoLibraryId!==670679||p.video?.status!==4||p.video?.width!==1920||p.video?.height!==1080||
      p.video?.title!==`${BATCH}:${b.lessonId}__${b.locale}`||Math.abs(p.video.length-b.durationSeconds)>2)return json({error:"Video not ready"},409);
    // Durable rollback evidence is written before the one-column CAS update.
    const saved=await db.from("technical_video_replacement_receipts").upsert({batch_id:BATCH,lesson_id:b.lessonId,locale:b.locale,
      old_guid:b.oldGuid,new_guid:b.newGuid,source_sha256:b.sourceHash,video_sha256:b.videoSha256,audio_sha256:b.audioSha256,
      backup_sha256:b.backupSha256,backup_artifact_id:b.backupArtifactId,run_id:String(claims.run_id),duration_seconds:b.durationSeconds,status:"ready"},{onConflict:"batch_id,lesson_id,locale",ignoreDuplicates:true});
    if(saved.error)return json({error:"Receipt unavailable"},503);
    const existing=await db.from("technical_video_replacement_receipts").select("new_guid,video_sha256,backup_sha256").eq("batch_id",BATCH).eq("lesson_id",b.lessonId).eq("locale",b.locale).single();
    if(existing.error||existing.data.new_guid!==b.newGuid||existing.data.video_sha256!==b.videoSha256||existing.data.backup_sha256!==b.backupSha256)return json({error:"Receipt conflict"},409);
    const changed=await db.from("technical_lesson_content").update({video_guid:b.newGuid}).eq("lesson_id",b.lessonId).eq("locale",b.locale).eq("video_guid",b.oldGuid).eq("source_sha256",b.sourceHash).select("video_guid");
    if(changed.error)return json({error:"Mapping update unavailable"},503);
    const readback=await db.from("technical_lesson_content").select("video_guid,source_sha256").eq("lesson_id",b.lessonId).eq("locale",b.locale).single();
    if(readback.error||readback.data?.video_guid!==b.newGuid||readback.data.source_sha256!==b.sourceHash)return json({error:"Mapping conflict; old video retained"},409);
    const finalized=await db.from("technical_video_replacement_receipts").update({status:"linked",linked_at:new Date().toISOString()}).eq("batch_id",BATCH).eq("lesson_id",b.lessonId).eq("locale",b.locale).eq("new_guid",b.newGuid);
    if(finalized.error)return json({error:"Final receipt unavailable; both videos retained"},503);
    return json({linked:true,batchId:BATCH,lessonId:b.lessonId,locale:b.locale,oldGuid:b.oldGuid,newGuid:b.newGuid,oldVideoRetained:true});
  }catch{return json({error:"Request rejected; published mapping protected"},400);}
});
