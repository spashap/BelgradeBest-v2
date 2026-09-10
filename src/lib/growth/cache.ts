// Opportunistic TTL cache for aggregate upstream results.
//
// Zero dependencies: a module-level Map that lives as long as the serverless
// instance does. On Vercel (Fluid Compute) warm instances are reused across
// requests, so repeated Growth API calls within the TTL usually skip GA4/GSC;
// a cold start or a different instance simply misses. It is a quota/latency
// optimisation, NOT a guarantee — never rely on it for correctness, and never
// put credentials in it (only aggregate report data is stored).
//
// Failures are not cached: a rejected promise is dropped so the next call
// retries upstream.

type Entry = { expires: number; value: unknown };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export const TTL = {
  // GA4 numbers for a closed period barely move; 30 min is plenty.
  GA4_MS: 30 * 60 * 1000,
  // Search Console lags ~2 days and updates once a day.
  GSC_MS: 6 * 60 * 60 * 1000,
};

export type CacheHit<T> = { value: T; cached: boolean };

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>, now = Date.now): Promise<CacheHit<T>> {
  const t = now();
  const hit = store.get(key);
  if (hit && hit.expires > t) return { value: hit.value as T, cached: true };
  const pending = inflight.get(key);
  if (pending) return { value: (await pending) as T, cached: true };
  const p = fn()
    .then((value) => {
      store.set(key, { expires: now() + ttlMs, value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return { value: await p, cached: false };
}

export function clearCache(): void {
  store.clear();
  inflight.clear();
}

export function cacheSize(): number {
  return store.size;
}
