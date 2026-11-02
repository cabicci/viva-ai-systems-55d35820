import {assertIndexerBackend,assertPublicIndexerTarget} from "./public-indexer-target";
import {handleAutomaticIndexing} from "./endpoint.server";
declare const __ASSISTANT_INDEXER_BUILD__: string;
declare const __ASSISTANT_INDEXER_DEPLOYMENT__: string;
export async function handlePublicAutomaticIndexing(request: Request) {
  try {assertIndexerBackend(process.env.SUPABASE_URL);assertPublicIndexerTarget(request);}
  catch{return new Response(JSON.stringify({code:"AUTOMATION_PUBLIC_TARGET_UNAVAILABLE"}),{status:503,headers:{"content-type":"application/json","cache-control":"no-store"}});}
  return handleAutomaticIndexing(request,{
    tick:async requestId=>{
      // Identity and request validation precede this fence; no worker import may precede it.
      if (!/^[a-f0-9]{64}$/.test(__ASSISTANT_INDEXER_BUILD__) ||
        !/^[a-f0-9]{64}$/.test(__ASSISTANT_INDEXER_DEPLOYMENT__) ||
        request.headers.get("x-masaarat-indexer-build") !== __ASSISTANT_INDEXER_BUILD__ ||
        request.headers.get("x-masaarat-indexer-deployment") !== __ASSISTANT_INDEXER_DEPLOYMENT__)
        throw new Error("AUTOMATION_PUBLICATION_CHANGED");
      return (await import("./worker.server")).automaticTick(requestId);
    },
    status:async()=>{
      // Existing verifier authorizes before this callback can import the privileged client.
      const {automationRpc}=await import("./store.server");
      const status=await automationRpc<Record<string,unknown>>("assistant_auto_status",{});
      return {...status,indexerBuild:__ASSISTANT_INDEXER_BUILD__,deploymentFingerprint:__ASSISTANT_INDEXER_DEPLOYMENT__};
    },
  });
}
