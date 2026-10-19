import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runValidate } from "./cli.js";
import { mockFetch } from "./test-helpers.js";

const policy = {
  agentPolicyVersion: "0.1",
  issuer: { name: "Dekimu", url: "https://dekimu.com" },
  contact: "security@dekimu.com",
  capabilities: []
};

describe("runValidate", () => {
  it("exit code 0 for a valid live policy", async () => {
    const f = mockFetch({
      "https://dekimu.com/agents.txt": { status: 200, body: "Policy: https://dekimu.com/p.json" },
      "https://dekimu.com/p.json": { status: 200, body: JSON.stringify(policy) },
    });
    expect(await runValidate("https://dekimu.com", f)).toBe(0);
  });
  it("exit code 1 for a missing/invalid policy", async () => {
    expect(await runValidate("https://nope.example", mockFetch({}))).toBe(1);
  });
});

/**
 * Regression for 0.1.1: `npx agents-txt validate <url>` exited 0 with no output
 * for every URL. The entry guard compared argv[1] (the node_modules/.bin symlink)
 * to import.meta.url (the real file) and never matched. Only an install of the
 * packed tarball reproduces it — `node dist/cli.js` and vitest never go through
 * the symlink — so this packs, installs into an empty project, and runs the bin
 * the way a user does.
 */
describe("packed bin via npx (node_modules/.bin symlink)", () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const tmp = mkdtempSync(join(tmpdir(), "agents-txt-bin-"));
  const proj = join(tmp, "proj");
  const env = { ...process.env, npm_config_userconfig: "/dev/null" }; // no auth/registry overrides from the host

  beforeAll(() => {
    execFileSync("npm", ["run", "build"], { cwd: repoRoot, stdio: "pipe" });
    const packed = execFileSync("npm", ["pack", "--pack-destination", tmp], { cwd: repoRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const tarball = join(tmp, packed.trim().split("\n").at(-1)!);
    mkdirSync(proj);
    writeFileSync(join(proj, "package.json"), JSON.stringify({ name: "p", private: true }));
    execFileSync("npm", ["i", "--no-audit", "--no-fund", tarball], { cwd: proj, env, stdio: "pipe" });
  }, 120_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  const run = (url: string) => spawnSync("npx", ["--no", "agents-txt", "validate", url], { cwd: proj, env, encoding: "utf8" });

  it("prints OK and exits 0 for a live valid policy", () => {
    const r = run("https://dekimu.com");
    expect(r.stdout).toMatch(/^OK: /);
    expect(r.status).toBe(0);
  }, 60_000);

  it("prints INVALID and exits 1 for an unreachable host", () => {
    const r = run("https://example.invalid");
    expect(r.stderr).toMatch(/^INVALID: /);
    expect(r.stdout).toBe("");
    expect(r.status).toBe(1);
  }, 60_000);
});
