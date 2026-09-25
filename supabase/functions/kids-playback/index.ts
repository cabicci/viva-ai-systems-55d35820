import { handleKidsPlayback } from "./handler.ts";
Deno.serve((request) => handleKidsPlayback(request, (name) => Deno.env.get(name)));
