/**
 * Shared test helpers — imported only by *.test.ts files.
 * Not compiled into dist (excluded via tsconfig exclude).
 */

export function mockFetch(map: Record<string, { status: number; body: string }>): typeof fetch {
  return (async (input: string | URL) => {
    const url = typeof input === "string" ? input : input.href;
    const hit = map[url];
    if (!hit) return { ok: false, status: 404 } as Response;
    return {
      ok: hit.status >= 200 && hit.status < 300,
      status: hit.status,
      text: async () => hit.body,
      json: async () => JSON.parse(hit.body),
    } as Response;
  }) as typeof fetch;
}
