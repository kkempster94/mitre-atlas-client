import { rawAtlasData } from "./atlas-data.js";
import type { AtlasObject } from "./types.js";
import { buildAtlasUrl } from "./urls.js";

function loadObjectsById(): Map<string, AtlasObject> {
  const byId = new Map<string, AtlasObject>();

  for (const groupKey of ["tactics", "techniques", "mitigations", "case-studies"] as const) {
    for (const [id, object] of Object.entries(rawAtlasData[groupKey])) {
      byId.set(id, { ...object, url: buildAtlasUrl(object["object-type"], id) } as AtlasObject);
    }
  }

  return byId;
}

let cachedObjectsById: Map<string, AtlasObject> | undefined;

export function getObjectsById(): Map<string, AtlasObject> {
  if (!cachedObjectsById) {
    cachedObjectsById = loadObjectsById();
  }
  return cachedObjectsById;
}
