import { handleKidsCatalogue } from "./handler.ts";
Deno.serve((request) => handleKidsCatalogue(request, (name) => Deno.env.get(name)));
