// Open-data endpoint: the Expo 2027 participant tracker dataset as JSON.
// Same master as the /expo-2027/tracker page (single source); linked from the
// page + its Dataset JSON-LD so journalists/devs can consume the raw numbers.
// Static (prerendered) — this is a public data file, not an API.

import data from "../../data/expo-participants.json";

export function GET() {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
