import { describe, it, expect } from "vitest";
import { runValidate } from "./cli.js";

const policy = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com" },
  contact: "security@dekimu.com",
  capabilities: []
};

function mockFetch(map: Record<string, { status: number; body: string }>): typeof fetch {
  return (async (input: string | URL) => {
    const url = typeof input === "string" ? input : input.href;
    const hit = map[url];
    if (!hit) return { ok: false, status: 404 } as Response;
    return { ok: true, status: hit.status, text: async () => hit.body, json: async () => JSON.parse(hit.body) } as Response;
  }) as typeof fetch;
}

describe("runValidate", () => {
  it("exit code 0 for a valid live policy", async () => {
    const f = mockFetch({
      "https://dekimu.com/agents.txt": { status: 200, body: "Policy: https://dekimu.com/p.json" },
      "https://dekimu.com/p.json": { status: 200, body: JSON.stringify(policy) },
    });
    expect(await runValidate("https://dekimu.com", f)).toBe(0);
  });
  it("exit code 1 for a missing/invalid policy", async () => {
    expect(await runValidate("https://nope.example", mockFetch({}))).toBe(1);
  });
});
