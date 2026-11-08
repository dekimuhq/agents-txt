import { describe, it, expect } from "vitest";
import { parseAgentPolicy, parseAgentsTxt } from "./parse.js";

const valid = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu", url: "https://dekimu.com" },
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

  it("accepts whitespace (incl. a stray CR) between the colon and the value", () => {
    expect(parseAgentsTxt("Policy:\t \r https://a.example/p.json").policy).toBe(
      "https://a.example/p.json",
    );
    expect(parseAgentsTxt("Contact:x").contact).toBe("x");
    expect(parseAgentsTxt("Verify:   ").verify).toBeUndefined();
  });

  it("rejects a value containing an inner line terminator, as before", () => {
    expect(parseAgentsTxt("Policy: a\rb").policy).toBeUndefined();
  });

  it("stays linear on a pathological whitespace run (ReDoS regression)", () => {
    // The old /^([A-Za-z]+):\s*(.+)$/ took ~7s on this input.
    const evil = "Policy:" + " ".repeat(100_000) + "x\ry";
    const t = performance.now();
    expect(parseAgentsTxt(evil).policy).toBeUndefined();
    expect(performance.now() - t).toBeLessThan(250);
  });
});
