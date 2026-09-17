// Open-data endpoint: the Expo 2027 contract award ledger as JSON.
// Same master as the /expo-2027/contracts page (single source); linked from the
// page + its Dataset JSON-LD so journalists/devs can consume the raw record.
// Static (prerendered) — this is a public data file, not an API.

import data from "../../data/expo-contracts.json";

export function GET() {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
