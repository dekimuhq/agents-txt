import { describe, it, expect } from "vitest";
import { parseAgentPolicy, parseAgentsTxt } from "./parse.js";

const valid = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com" },
  contact: "security@dekimu.com",
  capabilities: []
};

describe("parseAgentPolicy", () => {
  it("returns ok:true with the parsed value", () => {
    const r = parseAgentPolicy(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.default).toBe("deny");
  });
  it("returns ok:false with a readable error on invalid input", () => {
    const r = parseAgentPolicy({ ...valid, agentPolicyVersion: "2.0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("agentPolicyVersion");
  });
});

describe("parseAgentsTxt", () => {
  it("extracts the Policy/Contact/Verify directives, ignoring comments", () => {
    const txt = [
      "# Dekimu — Agent Action Policy",
      "> prose line",
      "",
      "Policy: https://dekimu.com/.well-known/agent-policy.json",
      "Contact: security@dekimu.com",
      "Verify: https://verify.dekimu.com",
    ].join("\n");
    const r = parseAgentsTxt(txt);
    expect(r.policy).toBe("https://dekimu.com/.well-known/agent-policy.json");
    expect(r.contact).toBe("security@dekimu.com");
    expect(r.verify).toBe("https://verify.dekimu.com");
  });
});
