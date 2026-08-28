import type { AtlasObject } from "./types.js";

const ATLAS_BASE_URL = "https://atlas.mitre.org";

const PATH_SEGMENT_BY_OBJECT_TYPE: Record<AtlasObject["object-type"], string> = {
  tactic: "tactics",
  technique: "techniques",
  mitigation: "mitigations",
  "case-study": "studies",
};

export function buildAtlasUrl(objectType: AtlasObject["object-type"], id: string): string {
  return `${ATLAS_BASE_URL}/${PATH_SEGMENT_BY_OBJECT_TYPE[objectType]}/${id}`;
}
