import { rawAtlasData } from "./atlas-data.js";
import type { AtlasObject } from "./types.js";
import { buildAtlasUrl } from "./urls.js";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const property of Object.values(value)) {
    deepFreeze(property);
  }

  return Object.freeze(value);
}

function loadObjectsById(): Map<string, AtlasObject> {
  const byId = new Map<string, AtlasObject>();

  for (const groupKey of ["tactics", "techniques", "mitigations", "case-studies"] as const) {
    for (const [id, object] of Object.entries(rawAtlasData[groupKey])) {
      const url = buildAtlasUrl(object["object-type"], id);
      byId.set(id, deepFreeze({ ...object, url } as AtlasObject));
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
