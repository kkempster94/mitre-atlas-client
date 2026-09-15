import { rawAtlasData } from "./atlas-data.js";
import type { AtlasObject, DeepReadonly } from "./types.js";
import { buildAtlasUrl } from "./urls.js";

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as DeepReadonly<T>;
  }

  for (const property of Object.values(value)) {
    deepFreeze(property);
  }

  return Object.freeze(value) as DeepReadonly<T>;
}

function loadObjectsById(): Map<string, DeepReadonly<AtlasObject>> {
  const byId = new Map<string, DeepReadonly<AtlasObject>>();

  for (const groupKey of ["tactics", "techniques", "mitigations", "case-studies"] as const) {
    for (const [id, object] of Object.entries(rawAtlasData[groupKey])) {
      const url = buildAtlasUrl(object["object-type"], id);
      byId.set(id, deepFreeze({ ...object, url } as AtlasObject));
    }
  }

  return byId;
}

let cachedObjectsById: Map<string, DeepReadonly<AtlasObject>> | undefined;

export function getObjectsById(): ReadonlyMap<string, DeepReadonly<AtlasObject>> {
  if (!cachedObjectsById) {
    cachedObjectsById = loadObjectsById();
  }
  return cachedObjectsById;
}
