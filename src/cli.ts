#!/usr/bin/env node
import { realpathSync } from "node:fs";
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

/**
 * True only when this file is the process entry point. Compared by realpath:
 * under `npx`/`node_modules/.bin` argv[1] is the `.bin/agents-txt` symlink while
 * import.meta.url is the resolved file — a plain string compare was false there,
 * so 0.1.1 exited 0 with no output for every URL (direct `node dist/cli.js` worked).
 */
function isEntryPoint(): boolean {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  const [, , cmd, target] = process.argv;
  if (cmd !== "validate" || !target) {
    console.error("usage: agents-txt validate <url|file>");
    process.exit(2);
  }
  runValidate(target).then((code) => process.exit(code));
}
