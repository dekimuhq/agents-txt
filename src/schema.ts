import { z } from "zod";

export const doorSchema = z.object({
  type: z.enum(["mcp", "openapi"]),
  url: z.string().url(),
}).strict();

export const receiptSchema = z.object({
  kind: z.string().min(1),
  verify: z.string().url().optional(),
}).strict();

export const rateLimitSchema = z.object({
  max: z.number().int().positive(),
  window: z.string().min(1),
}).strict();

export const capabilitySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9]+)+$/, "id must be dotted lowercase, e.g. ropa.compile"),
  description: z.string().min(1),
  door: doorSchema,
  auth: z.enum(["none", "credential"]),
  mandateScope: z.string().min(1).optional(),
  riskTier: z.enum(["auto", "checkpoint"]),
  receipt: receiptSchema.optional(),
  rateLimit: rateLimitSchema.optional(),
}).strict();

export const issuerSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  keys: z.string().url().optional(),
}).strict();

export const agentPolicySchema = z.object({
  agentPolicyVersion: z.literal("0.1"),
  issuer: issuerSchema,
  // "default" is a JS reserved word but is intentional and spec-mandated (the policy's default posture).
  default: z.enum(["deny", "allow"]).default("deny"),
  contact: z.string().min(1),
  verify: z.string().url().optional(),
  capabilities: z.array(capabilitySchema),
}).strict();

export type AgentPolicy = z.infer<typeof agentPolicySchema>;
export type Capability = z.infer<typeof capabilitySchema>;
