export interface Reference {
  id?: string;
  title?: string;
  url: string;
}

export interface AttackReference {
  id: string;
  url: string;
}

export interface Tactic {
  "object-type": "tactic";
  id: string;
  uuid: string;
  name: string;
  description: string;
  references: Reference[];
  "created-date": string;
  "modified-date": string;
  "attack-reference"?: AttackReference;
  /** IDs of the techniques (and sub-techniques) that achieve this tactic. */
  techniques: string[];
  url: string;
}

export interface Technique {
  "object-type": "technique";
  id: string;
  uuid: string;
  name: string;
  description: string;
  references: Reference[];
  "created-date": string;
  "modified-date": string;
  platforms?: string[];
  maturity?: string;
  "attack-reference"?: AttackReference;
  /** IDs of the tactics this technique achieves, in upstream order. Never empty. */
  tactics: string[];
  /** ID of the parent technique. Only present on sub-techniques. */
  parent?: string;
  /** IDs of this technique's sub-techniques. */
  subtechniques: string[];
  /** IDs of the mitigations that mitigate this technique. */
  mitigations: string[];
  /** IDs of the case studies that employ this technique. */
  caseStudies: string[];
  url: string;
}

export interface Mitigation {
  "object-type": "mitigation";
  id: string;
  uuid: string;
  name: string;
  description: string;
  references: Reference[];
  "created-date": string;
  "modified-date": string;
  "lifecycle-phases"?: string[];
  categories?: string[];
  "attack-reference"?: AttackReference;
  /** IDs of the techniques this mitigation mitigates. */
  techniques: string[];
  url: string;
}

export interface CaseStudy {
  "object-type": "case-study";
  id: string;
  uuid: string;
  name: string;
  description: string;
  references: Reference[];
  "created-date": string;
  "modified-date": string;
  type?: string;
  actor?: string;
  target?: string;
  date?: string;
  "date-granularity"?: string;
  reporter?: string;
  /** IDs of the techniques employed in this case study, in procedure order. */
  techniques: string[];
  url: string;
}

export type AtlasObject = Tactic | Technique | Mitigation | CaseStudy;

export type ObjectType = AtlasObject["object-type"];

export interface AtlasSummary {
  type: ObjectType;
  name: string;
  /** Tactic IDs, in the same order as {@link Technique.tactics}. Only present on techniques. */
  tactics?: string[];
}

/**
 * Recursively marks every property (including nested arrays/objects) as
 * `readonly`, mirroring the runtime immutability `deepFreeze` applies to
 * cached objects.
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export interface RawAtlasDocument {
  tactics: Record<string, Omit<Tactic, "url">>;
  techniques: Record<string, Omit<Technique, "url">>;
  mitigations: Record<string, Omit<Mitigation, "url">>;
  "case-studies": Record<string, Omit<CaseStudy, "url">>;
}
