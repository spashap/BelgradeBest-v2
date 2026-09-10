export const prerender = false;
import type { APIRoute } from "astro";
import { realDeps } from "../../../lib/growth/deps.ts";
import { handleChanges } from "../../../lib/growth/handlers.ts";

// GET /api/growth/changes?since=ISO-8601
// Bearer GROWTH_AGENT_TOKEN. The growth change log (growth/growth_changes.jsonl),
// oldest → newest, entries at or after `since`.
export const GET: APIRoute = async ({ request }) => handleChanges(request, await realDeps());
