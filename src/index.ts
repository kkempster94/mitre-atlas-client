import { getObjectsById } from "./data.js";

export type {
  AtlasObject,
  AttackReference,
  CaseStudy,
  Mitigation,
  Reference,
  Tactic,
  Technique,
} from "./types.js";

export {
  getAllObjects,
  getCaseStudies,
  getMitigations,
  getObjectsById,
  getTactics,
  getTechniques,
} from "./data.js";

export { buildAtlasUrl } from "./urls.js";

/**
 * Look up a MITRE ATLAS object (tactic, technique, mitigation, or case study)
 * by its ID, e.g. "AML.T0000", "AML.T0000.000", "AML.TA0002", "AML.M0000",
 * "AML.CS0000".
 */
export function getById(id: string) {
  return getObjectsById().get(id);
}
