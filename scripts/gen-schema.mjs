// scripts/gen-schema.mjs
import { writeFileSync } from "node:fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { agentPolicySchema } from "../dist/schema.js";

const schema = zodToJsonSchema(agentPolicySchema, "AgentPolicy");
writeFileSync(new URL("../agent-policy.schema.json", import.meta.url), JSON.stringify(schema, null, 2) + "\n");
console.log("wrote agent-policy.schema.json");
