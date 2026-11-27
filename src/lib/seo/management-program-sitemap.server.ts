import { curriculumCatalogue } from "@/lib/course-system/intake/client";
import { managementSitemap } from "./management-program";

export async function serveManagementSitemap(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  try {
    const xml = managementSitemap(await curriculumCatalogue("academic", "ar-EG"));
    return new Response(request.method === "HEAD" ? null : xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "300" },
    });
  }
}
