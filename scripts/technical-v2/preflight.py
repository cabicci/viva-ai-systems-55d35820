import os,json,urllib.request,pathlib
out=pathlib.Path("technical-v2-preflight");out.mkdir(exist_ok=True)
names=["GEMINI_API_KEY","GEMINI_API_KEY_1","GEMINI_API_KEY_2","GEMINI_API_KEY_3","BUNNY_STREAM_API_KEY","BUNNY_STREAM_LIBRARY_ID","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]
receipt={"configured":{n:bool(os.getenv(n)) for n in names},"changes":0}
lib=os.getenv("BUNNY_STREAM_LIBRARY_ID")
key=os.getenv("BUNNY_STREAM_API_KEY")
if lib and key:
 try:
  req=urllib.request.Request(f"https://video.bunnycdn.com/library/{lib}/videos/231483c4-394c-4e5f-874f-5b8468c1b8dc",headers={"AccessKey":key})
  with urllib.request.urlopen(req,timeout=30) as r: v=json.load(r)
  receipt["bunny"]={k:v.get(k) for k in ["videoLibraryId","guid","status","length","availableResolutions","collectionId"]}
  with urllib.request.urlopen(f"https://video.bunnycdn.com/library/{lib}/videos/4735cf42-cd3f-49ce-a9bb-9a16556e07e4/play",timeout=30) as r:p=json.load(r)
  receipt["play"]={k:p.get(k) for k in ["isPlayable","isPlaylistPlayable","originalUrl","fallbackUrl","videoPlaylistUrl","enableDRM"]}
 except Exception as e:receipt["bunnyError"]=type(e).__name__
url=os.getenv("SUPABASE_URL"); sk=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if url and sk:
 try:
  req=urllib.request.Request(url.rstrip("/")+"/rest/v1/technical_lesson_content?select=lesson_id,locale,video_guid,source_sha256&lesson_id=eq.M01-L01",headers={"apikey":sk,"Authorization":"Bearer "+sk})
  with urllib.request.urlopen(req,timeout=30) as r: rows=json.load(r)
  receipt["database"]={"host":url.split("/")[2],"technicalRowsReturned":len(rows)}
 except Exception as e: receipt["databaseError"]=type(e).__name__
(out/"receipt.json").write_text(json.dumps(receipt,indent=2))
print(json.dumps({"configured":receipt["configured"],"bunnyStatus":receipt.get("bunny",{}).get("status"),"playable":receipt.get("play",{}).get("isPlayable"),"database":receipt.get("database"),"errors":[receipt.get("bunnyError"),receipt.get("databaseError")]}))
