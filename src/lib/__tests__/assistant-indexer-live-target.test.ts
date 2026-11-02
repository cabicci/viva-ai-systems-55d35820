// @vitest-environment node
import {describe,it,expect} from "vitest";
import {assertIndexerBackend,assertPublicIndexerTarget,INDEXER_BACKEND_ORIGIN,INDEXER_PUBLIC_ENDPOINT} from "../assistant-automation/public-indexer-target";
describe("original-only indexing transport",()=>{
  it("binds the existing original public backend and live public route",()=>{
    expect(assertIndexerBackend("https://abyqqeboyrkkwhjpwmtd.supabase.co")).toBe(INDEXER_BACKEND_ORIGIN);
    expect(()=>assertPublicIndexerTarget(new Request(INDEXER_PUBLIC_ENDPOINT))).not.toThrow();
    expect(INDEXER_PUBLIC_ENDPOINT).toBe("https://masaarat.ai/api/public/assistant-indexing");
  });
  it.each([undefined,"https://rifujqqlqtfmopaukghn.supabase.co","https://other.supabase.co",
    "http://abyqqeboyrkkwhjpwmtd.supabase.co","https://user:example@abyqqeboyrkkwhjpwmtd.supabase.co",
    "https://abyqqeboyrkkwhjpwmtd.supabase.co/rest/v1","https://abyqqeboyrkkwhjpwmtd.supabase.co?x=1"])("refuses a different or decorated backend before privileged client construction: %s",url=>{
    expect(()=>assertIndexerBackend(url)).toThrow();
  });
  it.each(["https://project--0d675f0a-ecc5-4c62-9217-54973c927902.lovable.app/api/public/assistant-indexing",
    "https://masaarat.ai/api/internal/assistant-indexing","https://masaarat.ai/api/public/assistant-indexing?redirect=1",
    "https://attacker.invalid/api/public/assistant-indexing"])("refuses staging, old internal route and alternate request targets: %s",url=>{
    expect(()=>assertPublicIndexerTarget(new Request(url))).toThrow();
  });
});
