import { z } from "zod";

export const doorSchema = z.strictObject({
  type: z.enum(["mcp", "openapi"]),
  url: z.url(),
});

export const receiptSchema = z.strictObject({
  kind: z.string().min(1),
  verify: z.url().optional(),
});

export const rateLimitSchema = z.strictObject({
  max: z.int().positive(),
  window: z.string().min(1),
});

export const capabilitySchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9]+)+$/, "id must be dotted lowercase, e.g. ropa.compile"),
  description: z.string().min(1),
  door: doorSchema,
  auth: z.enum(["none", "credential"]),
  mandateScope: z.string().min(1).optional(),
  riskTier: z.enum(["auto", "checkpoint"]),
  receipt: receiptSchema.optional(),
  rateLimit: rateLimitSchema.optional(),
});

export const issuerSchema = z.strictObject({
  name: z.string().min(1),
  url: z.url(),
  keys: z.url().optional(),
});

export const agentPolicySchema = z.strictObject({
  agentPolicyVersion: z.literal("0.1"),
  issuer: issuerSchema,
  // "default" is a JS reserved word but is intentional and spec-mandated (the policy's default posture).
  default: z.enum(["deny", "allow"]).default("deny"),
  contact: z.string().min(1),
  verify: z.url().optional(),
  capabilities: z.array(capabilitySchema),
});

export type AgentPolicy = z.infer<typeof agentPolicySchema>;
export type Capability = z.infer<typeof capabilitySchema>;
