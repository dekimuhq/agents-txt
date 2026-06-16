# Agent Action Policy (agents.txt) — v0.1

**Status:** v0.1 (normative)
**License:** MIT
**Repository:** https://github.com/dekimuhq/agents-txt

---

## Abstract

`robots.txt` governs crawling. `llms.txt` governs reading. Neither covers the agent-first world's new verb: **acting**. `agents.txt` is the action-policy layer — a machine-readable advertisement of what actions an autonomous agent may attempt on a surface, under what conditions, and what verifiable proof results.

`agents.txt` (the discovery stub) points to `/.well-known/agent-policy.json` (the machine-readable policy). Together they let any agent — proprietary, open-source, or third-party — discover the rules before it acts.

---

## Discovery

A conforming surface publishes two files at its origin:

| Path | Audience | Content |
|---|---|---|
| `/agents.txt` | Human glance + discovery | `robots.txt`-style stub: posture prose, `Policy:` pointer, `Contact:`, optional `Verify:`. |
| `/.well-known/agent-policy.json` | Machine | Schema-validated, versioned capability descriptor. |

### `/agents.txt` directives

The file is line-oriented. Lines beginning with `#` are comments and MUST be ignored. Lines beginning with `>` are prose and MUST be ignored. Blank lines MUST be ignored. All other lines are `Key: value` directives.

Recognised directives (case-insensitive key):

| Directive | Required | Description |
|---|---|---|
| `Policy:` | Yes | URL of the `/.well-known/agent-policy.json` document. |
| `Contact:` | Yes | Email address or URL for agent-related queries. |
| `Verify:` | No | Base URL of the receipt verifier for this surface. |

Unknown directives MUST be ignored by a conforming parser.

### Worked example — `/agents.txt`

```
# Dekimu — Agent Action Policy
> Autonomous agents may interact with this surface under the policy below.
> Unlisted actions are denied by default. Authorized actions require a
> scoped agent credential and emit an independently verifiable receipt.

Policy: https://dekimu.com/.well-known/agent-policy.json
Contact: security@dekimu.com
Verify: https://verify.dekimu.com
```

---

## Policy document

`/.well-known/agent-policy.json` is a JSON object conforming to the schema below. A conforming parser MUST reject documents with unknown top-level keys (strict parse).

### Top-level fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agentPolicyVersion` | `"0.1"` | Yes | — | Version literal. Parsers MUST reject unknown major versions. |
| `issuer` | `Issuer` | Yes | — | Identity of the surface operator. |
| `default` | `"deny" \| "allow"` | No | `"deny"` | Posture for any action not listed in `capabilities`. |
| `contact` | `string` | Yes | — | Email address or URL for agent-related queries. |
| `verify` | `string` (URL) | No | — | Base URL of the receipt verifier. |
| `capabilities` | `Capability[]` | Yes | — | List of permitted actions. Empty array is valid (surface exposes nothing). |

### `Issuer` object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Human-readable name of the operator. |
| `url` | `string` (URL) | Yes | Canonical URL of the operator. |
| `keys` | `string` (URL) | No | Forward pointer to a public key set (reserved for v1+; unused in v0). |

### `Capability` object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Stable, dotted identifier (`<domain>.<verb>`, e.g. `ropa.compile`). Must match `/^[a-z0-9]+(\.[a-z0-9]+)+$/`. |
| `description` | `string` | Yes | Human-readable description of the action. |
| `door` | `Door` | Yes | Where the machine invokes the capability. |
| `auth` | `"none" \| "credential"` | Yes | `"credential"` = a scoped agent credential is required; `"none"` = unauthenticated. |
| `mandateScope` | `string` | No | The scope token the credential must carry (e.g. `compass:ropa.compile`). |
| `riskTier` | `"auto" \| "checkpoint"` | Yes | `"auto"` = agent may proceed autonomously; `"checkpoint"` = a human approval is required and is itself a receipt. |
| `receipt` | `Receipt` | No | The proof emitted when the action completes. |
| `rateLimit` | `RateLimit` | No | Advisory ceiling. |

### `Door` object

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"mcp" \| "openapi"` | Yes | Protocol through which the agent invokes the action. |
| `url` | `string` (URL) | Yes | Endpoint URL. |

### `Receipt` object

| Field | Type | Required | Description |
|---|---|---|---|
| `kind` | `string` | Yes | Receipt family identifier conforming to the deployed verifier registry (e.g. `ropa.register.v1`). Never roll a custom shape. |
| `verify` | `string` (URL) | No | Override verifier base URL for this capability. |

### `RateLimit` object

| Field | Type | Required | Description |
|---|---|---|---|
| `max` | `integer` (positive) | Yes | Maximum number of calls. |
| `window` | `string` | Yes | Time window (e.g. `"1d"`, `"1h"`). Format is advisory; the enforcing engine defines parsing. |

### Worked example — `/.well-known/agent-policy.json`

```json
{
  "agentPolicyVersion": "0.1",
  "issuer": {
    "name": "Dekimu Labs SL",
    "url": "https://dekimu.com",
    "keys": "https://id.dekimu.com/.well-known/agent-keys.json"
  },
  "default": "deny",
  "contact": "security@dekimu.com",
  "verify": "https://verify.dekimu.com",
  "capabilities": [
    {
      "id": "ropa.compile",
      "description": "Compile a GDPR Article 30 Record of Processing Activities.",
      "door": { "type": "mcp", "url": "https://app.dekimu.com/api/mcp" },
      "auth": "credential",
      "mandateScope": "compass:ropa.compile",
      "riskTier": "auto",
      "receipt": { "kind": "ropa.register.v1", "verify": "https://verify.dekimu.com" }
    },
    {
      "id": "erasure.execute",
      "description": "Execute a verifiable subject erasure (GDPR Art. 17).",
      "door": { "type": "mcp", "url": "https://app.dekimu.com/api/mcp" },
      "auth": "credential",
      "mandateScope": "compass:erasure.execute",
      "riskTier": "checkpoint",
      "receipt": { "kind": "forget.destruction.v1", "verify": "https://verify.dekimu.com" },
      "rateLimit": { "max": 50, "window": "1d" }
    }
  ]
}
```

---

## Conformance

### Parse rules

1. **Strict:** unknown top-level keys in the policy document MUST cause the parser to reject the document.
2. **Strict:** unknown keys inside a `Capability`, `Door`, `Receipt`, or `RateLimit` object MUST cause the parser to reject the document.
3. **Fail-closed:** a malformed or missing policy MUST be treated as `default: deny` with an empty capability list. The consumer MUST NOT attempt an action when the policy cannot be validated.
4. **Version gating:** parsers MUST reject documents where `agentPolicyVersion` is not a recognised literal. Currently only `"0.1"` is defined.
5. **Default deny:** when `default` is absent, the effective value is `"deny"`.
6. **Empty capabilities:** `capabilities: []` is valid. A surface may publish a policy with no permitted actions.

### Relationship to `robots.txt` and `llms.txt`

| File | Governs |
|---|---|
| `robots.txt` | Crawling / indexing |
| `llms.txt` | Reading / summarisation |
| `agents.txt` | Acting — what an agent may do, under what conditions, with what proof |

`agents.txt` does not supersede `robots.txt` or `llms.txt`. A conforming agent SHOULD respect all three.

---

## Non-goals (v0)

- **No credential verification.** `agents.txt` declares that a credential + scope is required. Checking and issuing credentials is the responsibility of a separate authentication layer (e.g. an Agent Passport). v0 is zero-crypto.
- **No enforcement runtime.** The policy is a declaration. Enforcement is the responsibility of the surface's gate layer.
- **No selective-disclosure or cryptographic proofs.** Those are reserved for future versions.
- **No `/.well-known/agents.txt` mirror.** The root `/agents.txt` is the only stub location in v0.

---

## JSON Schema

A generated JSON Schema for `agent-policy.json` is included in the package as `agent-policy.schema.json`. It is derived automatically from the Zod schema in `src/schema.ts` — that file is the single source of truth. Do not edit the JSON Schema manually.
