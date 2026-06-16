import { describe, it, expect } from "vitest";
import { buildAgentPolicy, renderAgentsTxt } from "./generate.js";
import { parseAgentPolicy } from "./parse.js";
import type { Capability } from "./schema.js";

describe("buildAgentPolicy", () => {
  it("builds a valid policy and defaults to deny", () => {
    const p = buildAgentPolicy({
      issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com" },
      contact: "security@dekimu.com",
    });
    expect(p.default).toBe("deny");
    expect(parseAgentPolicy(p).ok).toBe(true);
  });
  it("throws if asked to build an invalid policy", () => {
    expect(() => buildAgentPolicy({
      // @ts-expect-error invalid issuer on purpose
      issuer: { name: "", url: "not-a-url" },
      contact: "x",
    })).toThrow();
  });
  it("round-trips a North Star Capability with no field loss", () => {
    // Shape from the North Star capability-core registry (spec §3)
    const ns = {
      id: "ropa.compile",
      mandateScope: "compass:ropa.compile",
      receiptKind: "ropa.register.v1",
      riskTier: "auto" as const,
      description: "Compile a GDPR Article 30 register.",
    };
    const cap: Capability = {
      id: ns.id,
      description: ns.description,
      door: { type: "mcp", url: "https://app.dekimu.com/api/mcp" },
      auth: "credential",
      mandateScope: ns.mandateScope,
      riskTier: ns.riskTier,
      receipt: { kind: ns.receiptKind, verify: "https://verify.dekimu.com" },
    };
    const p = buildAgentPolicy({
      issuer: { name: "Dekimu Labs SL", url: "https://dekimu.com" },
      contact: "security@dekimu.com",
      capabilities: [cap],
    });
    expect(p.capabilities[0].mandateScope).toBe(ns.mandateScope);
    expect(p.capabilities[0].receipt?.kind).toBe(ns.receiptKind);
  });
});

describe("renderAgentsTxt", () => {
  it("emits a Policy pointer and contact, ending in a newline", () => {
    const txt = renderAgentsTxt({
      title: "Dekimu",
      policyUrl: "https://dekimu.com/.well-known/agent-policy.json",
      contact: "security@dekimu.com",
      verify: "https://verify.dekimu.com",
    });
    expect(txt).toContain("Policy: https://dekimu.com/.well-known/agent-policy.json");
    expect(txt).toContain("Verify: https://verify.dekimu.com");
    expect(txt.endsWith("\n")).toBe(true);
  });
});
