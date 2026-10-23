import json,os,time,urllib.request
from pathlib import Path
out=Path("output");out.mkdir(exist_ok=True)
assert os.environ["GITHUB_RUN_ATTEMPT"]=="1"
assert os.environ["BUNNY_STREAM_LIBRARY_ID"].strip()=="670679"
guid="a88296ce-f6f3-4513-bc4b-f1a0594230a2"
for i in range(8):
 req=urllib.request.Request("https://video.bunnycdn.com/library/670679/videos/"+guid,headers={"AccessKey":os.environ["BUNNY_STREAM_API_KEY"],"Accept":"application/json"},method="GET")
 with urllib.request.urlopen(req,timeout=30)as response: obj=json.load(response)
 assert obj["guid"]==guid and str(obj["videoLibraryId"])=="670679"
 row={k:obj.get(k)for k in ["guid","videoLibraryId","status","length","availableResolutions","originalHash","encodeProgress","storageSize"]}
 row.update(atUTC=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),stage="READ_ONLY_CONTINUATION_NO_CREATE_PUT",attempt=i+1)
 if row["status"]==4:
  assert abs(row["length"]-719.4666666666667)<=2
  row["state"]="BUNNY_READY_STATUS4_DURATION_VERIFIED_PLAYBACK_PENDING"
 with (out/("readiness-%02d.json"%(i+1))).open("x")as f:json.dump(row,f,indent=2)
 if row["status"]in[4,5,6]:break
 if i<7:time.sleep(30)
