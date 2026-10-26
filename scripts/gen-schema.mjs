// scripts/gen-schema.mjs
import { writeFileSync } from "node:fs";
import { z } from "zod";
import { agentPolicySchema } from "../dist/schema.js";

const { $schema, ...body } = z.toJSONSchema(agentPolicySchema, {
  target: "draft-7",
  // The published schema describes the document a site WRITES: `default` has a
  // zod default, so it stays optional (output mode would mark it required).
  io: "input",
  override: ({ jsonSchema: s }) => {
    // zod 4's z.int() is bounded to the safe-integer range and says so in the
    // schema. SPEC §RateLimit defines `max` as a positive integer with no upper
    // bound, so the normative artifact does not grow one (values above 2^53-1
    // are outside I-JSON, RFC 7493 §2.2, and cannot round-trip through JSON.parse).
    if (s.type === "integer" && s.maximum === Number.MAX_SAFE_INTEGER) delete s.maximum;
    if (s.type === "integer" && s.minimum === Number.MIN_SAFE_INTEGER) delete s.minimum;
    // Keep `default` after the type keywords, as the 0.1 artifact has it.
    if ("default" in s) { const d = s.default; delete s.default; s.default = d; }
  },
});
const schema = { $ref: "#/definitions/AgentPolicy", definitions: { AgentPolicy: body }, $schema };
writeFileSync(new URL("../agent-policy.schema.json", import.meta.url), JSON.stringify(schema, null, 2) + "\n");
console.log("wrote agent-policy.schema.json");
