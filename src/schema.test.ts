import { describe, it, expect } from "vitest";
import { agentPolicySchema } from "./schema.js";

const valid = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com" },
  contact: "security@dekimu.com",
  capabilities: [{
    id: "ropa.compile",
    description: "Compile a GDPR Article 30 register.",
    door: { type: "mcp", url: "https://app.dekimu.com/api/mcp" },
    auth: "credential",
    mandateScope: "compass:ropa.compile",
    riskTier: "auto",
    receipt: { kind: "ropa.register.v1", verify: "https://verify.dekimu.com" }
  }]
};

describe("agentPolicySchema", () => {
  it("accepts a valid policy and defaults `default` to deny", () => {
    const r = agentPolicySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.default).toBe("deny");
  });
  it("rejects unknown top-level keys", () => {
    expect(agentPolicySchema.safeParse({ ...valid, bogus: 1 }).success).toBe(false);
  });
  it("rejects a wrong version", () => {
    expect(agentPolicySchema.safeParse({ ...valid, agentPolicyVersion: "9.9" }).success).toBe(false);
  });
  it("rejects a non-dotted capability id", () => {
    const bad = { ...valid, capabilities: [{ ...valid.capabilities[0], id: "ropa" }] };
    expect(agentPolicySchema.safeParse(bad).success).toBe(false);
  });
  it("rejects an unknown riskTier", () => {
    const bad = { ...valid, capabilities: [{ ...valid.capabilities[0], riskTier: "yolo" }] };
    expect(agentPolicySchema.safeParse(bad).success).toBe(false);
  });
  it("rejects unknown keys inside the nested issuer object (.strict() on sub-schema)", () => {
    const bad = { ...valid, issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com", bogus: 1 } };
    expect(agentPolicySchema.safeParse(bad).success).toBe(false);
  });
});
