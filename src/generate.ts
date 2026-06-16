import { parseAgentPolicy } from "./parse.js";
import type { AgentPolicy, Capability } from "./schema.js";

export function buildAgentPolicy(opts: {
  issuer: AgentPolicy["issuer"];
  contact: string;
  verify?: string;
  default?: "deny" | "allow";
  capabilities?: Capability[];
}): AgentPolicy {
  const candidate = {
    agentPolicyVersion: "0.1" as const,
    issuer: opts.issuer,
    default: opts.default ?? "deny",
    contact: opts.contact,
    capabilities: opts.capabilities ?? [],
    ...(opts.verify ? { verify: opts.verify } : {}),
  };
  const r = parseAgentPolicy(candidate);
  if (!r.ok) throw new Error(`buildAgentPolicy produced invalid policy: ${r.error}`);
  return r.value;
}

export function renderAgentsTxt(opts: {
  title: string;
  policyUrl: string;
  contact: string;
  verify?: string;
}): string {
  const lines = [
    `# ${opts.title} — Agent Action Policy`,
    `> Autonomous agents may interact with this surface under the policy below.`,
    `> Unlisted actions are denied by default. Authorized actions require a`,
    `> scoped agent credential and emit an independently verifiable receipt.`,
    ``,
    `Policy: ${opts.policyUrl}`,
    `Contact: ${opts.contact}`,
  ];
  if (opts.verify) lines.push(`Verify: ${opts.verify}`);
  return lines.join("\n") + "\n";
}
