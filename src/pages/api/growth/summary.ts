export const prerender = false;
import type { APIRoute } from "astro";
import { realDeps } from "../../../lib/growth/deps.ts";
import { handleSummary } from "../../../lib/growth/handlers.ts";

// GET /api/growth/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Bearer GROWTH_AGENT_TOKEN. Read-only aggregate traffic/SEO/Expo summary.
// Part of the sanctioned serverless surface (CLAUDE.md); public pages stay static.
export const GET: APIRoute = async ({ request }) => handleSummary(request, await realDeps());
