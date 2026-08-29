import { rawAtlasData } from "./atlas-data.js";
import type { AtlasObject, CaseStudy, Mitigation, Tactic, Technique } from "./types.js";
import { buildAtlasUrl } from "./urls.js";

interface AtlasCollections {
  byId: Map<string, AtlasObject>;
  all: AtlasObject[];
  tactics: Tactic[];
  techniques: Technique[];
  mitigations: Mitigation[];
  caseStudies: CaseStudy[];
}

function loadCollections(): AtlasCollections {
  const byId = new Map<string, AtlasObject>();
  const all: AtlasObject[] = [];
  const tactics: Tactic[] = [];
  const techniques: Technique[] = [];
  const mitigations: Mitigation[] = [];
  const caseStudies: CaseStudy[] = [];

  for (const groupKey of ["tactics", "techniques", "mitigations", "case-studies"] as const) {
    for (const [id, object] of Object.entries(rawAtlasData[groupKey])) {
      const withUrl = { ...object, url: buildAtlasUrl(object["object-type"], id) } as AtlasObject;
      byId.set(id, withUrl);
      all.push(withUrl);

      switch (withUrl["object-type"]) {
        case "tactic":
          tactics.push(withUrl);
          break;
        case "technique":
          techniques.push(withUrl);
          break;
        case "mitigation":
          mitigations.push(withUrl);
          break;
        case "case-study":
          caseStudies.push(withUrl);
          break;
      }
    }
  }

  return { byId, all, tactics, techniques, mitigations, caseStudies };
}

let cachedCollections: AtlasCollections | undefined;

function getCollections(): AtlasCollections {
  if (!cachedCollections) {
    cachedCollections = loadCollections();
  }
  return cachedCollections;
}

/** All ATLAS objects (tactics, techniques, mitigations, case studies) keyed by ID. */
export function getObjectsById(): Map<string, AtlasObject> {
  return getCollections().byId;
}

/** All ATLAS objects (tactics, techniques, mitigations, case studies) in one list. */
export function getAllObjects(): AtlasObject[] {
  return getCollections().all;
}

export function getTactics(): Tactic[] {
  return getCollections().tactics;
}

export function getTechniques(): Technique[] {
  return getCollections().techniques;
}

export function getMitigations(): Mitigation[] {
  return getCollections().mitigations;
}

export function getCaseStudies(): CaseStudy[] {
  return getCollections().caseStudies;
}
