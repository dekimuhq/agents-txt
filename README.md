# agents-txt

**Agent Action Policy** — the `robots.txt` for agent actions.

Parse, validate, fetch, and generate `agents.txt` + `agent-policy.json`: the two-file format that lets a surface tell autonomous agents what actions they may attempt, under what conditions, and what verifiable proof results.

Normative format: [SPEC.md](./SPEC.md)

---

## Install

```sh
npm i agents-txt
```

Node ≥ 20. Zero runtime dependencies beyond `zod`.

---

## Usage

### `parseAgentPolicy` — validate a policy object

```ts
import { parseAgentPolicy } from "agents-txt";

const result = parseAgentPolicy(json);
if (result.ok) {
  console.log(result.value.default); // "deny"
} else {
  console.error(result.error); // human-readable validation message
}
```

Strict and fail-closed: unknown keys are rejected; a bad parse returns `{ ok: false, error }`.

---

### `fetchAgentPolicy` — discover and fetch a surface's policy

```ts
import { fetchAgentPolicy } from "agents-txt";

const policy = await fetchAgentPolicy("https://example.com");
// Fetches /agents.txt → resolves Policy: URL → validates the JSON
// Returns null on any failure (fail-closed)
if (policy) {
  console.log(policy.capabilities);
}
```

Pass a custom `fetch` implementation as the second argument for testing or environments without a global `fetch`.

---

### `buildAgentPolicy` — generate a typed policy object

```ts
import { buildAgentPolicy } from "agents-txt";

const policy = buildAgentPolicy({
  issuer: { name: "Acme Corp", url: "https://acme.example" },
  contact: "security@acme.example",
  capabilities: [
    {
      id: "invoice.read",
      description: "Read an invoice by ID.",
      door: { type: "mcp", url: "https://api.acme.example/mcp" },
      auth: "credential",
      riskTier: "auto",
    },
  ],
});
// Throws if the resulting object fails schema validation
```

---

### `renderAgentsTxt` — generate the `/agents.txt` stub

```ts
import { renderAgentsTxt } from "agents-txt";

const txt = renderAgentsTxt({
  title: "Acme Corp",
  policyUrl: "https://acme.example/.well-known/agent-policy.json",
  contact: "security@acme.example",
  verify: "https://verify.acme.example",
});
// Returns the agents.txt file content as a string
```

Write the result to `public/agents.txt` in your project.

---

## CLI

```sh
# Validate a live URL (follows agents.txt → policy JSON)
npx agents-txt validate https://example.com

# Validate a local policy file
npx agents-txt validate path/to/agent-policy.json
```

Exits `0` on success, `1` on invalid or missing policy, `2` on bad usage. CI-usable.

---

## Honesty box

> **v0 declares policy; it does not verify credentials.**
>
> `agents.txt` tells an agent what actions are permitted and what credential scope is required. It does not issue credentials, verify them, or enforce the policy at runtime. Credential verification is a separate authentication layer. Enforcement is the responsibility of the surface's gate.
>
> `auth: "credential"` in a capability means "a credential is required" — not "we checked one." v0 is zero-crypto by design.

---

## Format

See [SPEC.md](./SPEC.md) for the full normative format, field definitions, conformance rules, and worked examples.

---

## Enforcing engine

The policy you publish with `agents-txt` describes what agents may do. For the layer that actually issues scoped agent credentials, enforces `riskTier`, and emits independently verifiable receipts, see [Dekimu Hub](https://dekimu.com).
