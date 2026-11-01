import {createFileRoute} from "@tanstack/react-router";
export const Route=createFileRoute("/api/public/assistant-indexing")({server:{handlers:{
  GET:async({request})=>(await import("@/lib/assistant-automation/public-endpoint.server")).handlePublicAutomaticIndexing(request),
  POST:async({request})=>(await import("@/lib/assistant-automation/public-endpoint.server")).handlePublicAutomaticIndexing(request),
}}});
