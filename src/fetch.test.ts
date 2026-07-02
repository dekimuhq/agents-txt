import { describe, it, expect } from "vitest";
import { fetchAgentPolicy } from "./fetch.js";
import { mockFetch } from "./test-helpers.js";

const policy = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu", url: "https://dekimu.com" },
  contact: "security@dekimu.com",
  capabilities: []
};

describe("fetchAgentPolicy", () => {
  it("follows agents.txt → Policy: → validated policy", async () => {
    const f = mockFetch({
      "https://dekimu.com/agents.txt": { status: 200, body: "Policy: https://dekimu.com/p.json" },
      "https://dekimu.com/p.json": { status: 200, body: JSON.stringify(policy) },
    });
    const r = await fetchAgentPolicy("https://dekimu.com", f);
    expect(r?.issuer.name).toBe("Dekimu");
  });
  it("returns null when agents.txt is missing", async () => {
    const r = await fetchAgentPolicy("https://nope.example", mockFetch({}));
    expect(r).toBeNull();
  });
  it("returns null when the policy JSON is invalid (fail-closed)", async () => {
    const f = mockFetch({
      "https://x.com/agents.txt": { status: 200, body: "Policy: https://x.com/p.json" },
      "https://x.com/p.json": { status: 200, body: JSON.stringify({ agentPolicyVersion: "9.9" }) },
    });
    expect(await fetchAgentPolicy("https://x.com", f)).toBeNull();
  });
  it("throws on an invalid origin (caller bug, not swallowed)", async () => {
    const f = mockFetch({});
    await expect(fetchAgentPolicy("not-a-url", f)).rejects.toThrow();
  });
  it("falls back to /.well-known/agent-policy.json when agents.txt has no Policy: directive", async () => {
    const f = mockFetch({
      "https://dekimu.com/agents.txt": { status: 200, body: "Contact: a@x.com" },
      "https://dekimu.com/.well-known/agent-policy.json": { status: 200, body: JSON.stringify(policy) },
    });
    const r = await fetchAgentPolicy("https://dekimu.com", f);
    expect(r?.issuer.name).toBe("Dekimu");
  });
});
