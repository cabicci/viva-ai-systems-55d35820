import { handleKidsLessonHelp } from "./handler.ts";
Deno.serve((request) => handleKidsLessonHelp(request, (name) => Deno.env.get(name)));
