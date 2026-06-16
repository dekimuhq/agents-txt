import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchAgentPolicy } from "./fetch.js";
import { parseAgentPolicy } from "./parse.js";

export async function runValidate(target: string, fetchImpl: typeof fetch = fetch): Promise<0 | 1> {
  let policy = null;
  if (/^https?:\/\//.test(target)) {
    policy = await fetchAgentPolicy(target, fetchImpl);
    if (!policy) { console.error(`INVALID: could not fetch/validate policy at ${target}`); return 1; }
  } else {
    try {
      const r = parseAgentPolicy(JSON.parse(await readFile(target, "utf8")));
      if (!r.ok) { console.error(`INVALID: ${r.error}`); return 1; }
      policy = r.value;
    } catch (e) { console.error(`INVALID: ${(e as Error).message}`); return 1; }
  }
  console.log(`OK: ${policy.issuer.name} — ${policy.capabilities.length} capability(ies), default=${policy.default}`);
  return 0;
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, target] = process.argv;
  if (cmd !== "validate" || !target) {
    console.error("usage: agents-txt validate <url|file>");
    process.exit(2);
  }
  runValidate(target).then((code) => process.exit(code));
}
