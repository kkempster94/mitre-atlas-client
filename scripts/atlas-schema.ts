import { z } from "zod";

// Mirrors the `Omit<X, "url">` shapes in `src/types.ts`. Validated at data-compile
// time (see compile-data.ts) so a breaking change in upstream ATLAS.yaml is caught
// as a build failure instead of silently producing malformed data at runtime.
//
// Each object schema uses `.passthrough()` so additive changes upstream (new
// optional fields we don't know about yet) don't break the build - only a
// missing/mistyped field we actually declare in `src/types.ts` does.

const referenceSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    url: z.string(),
  })
  .passthrough();

const attackReferenceSchema = z
  .object({
    id: z.string(),
    url: z.string(),
  })
  .passthrough();

const baseObjectSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  references: z.array(referenceSchema),
  "created-date": z.string(),
  "modified-date": z.string(),
  "attack-reference": attackReferenceSchema.optional(),
});

const tacticSchema = baseObjectSchema
  .extend({
    "object-type": z.literal("tactic"),
  })
  .passthrough();

const techniqueSchema = baseObjectSchema
  .extend({
    "object-type": z.literal("technique"),
    platforms: z.array(z.string()).optional(),
    maturity: z.string().optional(),
  })
  .passthrough();

const mitigationSchema = baseObjectSchema
  .extend({
    "object-type": z.literal("mitigation"),
    "lifecycle-phases": z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  })
  .passthrough();

const caseStudySchema = baseObjectSchema
  .extend({
    "object-type": z.literal("case-study"),
    type: z.string().optional(),
    actor: z.string().optional(),
    target: z.string().optional(),
    date: z.string().optional(),
    "date-granularity": z.string().optional(),
    reporter: z.string().optional(),
  })
  .passthrough();

export const rawAtlasDocumentSchema = z.object({
  tactics: z.record(z.string(), tacticSchema),
  techniques: z.record(z.string(), techniqueSchema),
  mitigations: z.record(z.string(), mitigationSchema),
  "case-studies": z.record(z.string(), caseStudySchema),
});
