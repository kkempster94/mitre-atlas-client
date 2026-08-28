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
  url: string;
}

export type AtlasObject = Tactic | Technique | Mitigation | CaseStudy;
