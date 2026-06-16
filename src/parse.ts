import { agentPolicySchema, type AgentPolicy } from "./schema.js";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseAgentPolicy(input: unknown): ParseResult<AgentPolicy> {
  const r = agentPolicySchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data };
  const error = r.error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return { ok: false, error };
}

export interface AgentsTxt {
  policy?: string;
  contact?: string;
  verify?: string;
}

export function parseAgentsTxt(text: string): AgentsTxt {
  const out: AgentsTxt = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith(">")) continue;
    const m = line.match(/^([A-Za-z]+):\s*(.+)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "policy") out.policy = val;
    else if (key === "contact") out.contact = val;
    else if (key === "verify") out.verify = val;
  }
  return out;
}
