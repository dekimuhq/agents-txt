import { parseAgentsTxt, parseAgentPolicy } from "./parse.js";
import type { AgentPolicy } from "./schema.js";

export async function fetchAgentPolicy(
  origin: string,
  fetchImpl: typeof fetch = fetch
): Promise<AgentPolicy | null> {
  try {
    const base = new URL(origin);
    const txtRes = await fetchImpl(new URL("/agents.txt", base).href);
    if (!txtRes.ok) return null;
    const stub = parseAgentsTxt(await txtRes.text());
    const policyUrl = stub.policy ?? new URL("/.well-known/agent-policy.json", base).href;
    const polRes = await fetchImpl(policyUrl);
    if (!polRes.ok) return null;
    const parsed = parseAgentPolicy(await polRes.json());
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
