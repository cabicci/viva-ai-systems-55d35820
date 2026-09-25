import { handleKidsLessonContent } from "./handler.ts";
Deno.serve((request) => handleKidsLessonContent(request, (name) => Deno.env.get(name)));
