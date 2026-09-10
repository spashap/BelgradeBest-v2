export const prerender = false;
import type { APIRoute } from "astro";
import { realDeps } from "../../../lib/growth/deps.ts";
import { handleContent } from "../../../lib/growth/handlers.ts";

// GET /api/growth/content?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50
// Bearer GROWTH_AGENT_TOKEN. Per-page GA4 + Search Console, classified by route.
export const GET: APIRoute = async ({ request }) => handleContent(request, await realDeps());
