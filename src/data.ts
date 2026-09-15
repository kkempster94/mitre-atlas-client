import { rawAtlasData } from "./atlas-data.js";
import { atlasObjectIds } from "./data/manifest.js";
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

/**
 * Looks up a single ATLAS object by ID, loading only that object's module
 * on demand instead of the full in-memory dataset. Bundlers that support
 * dynamic `import()` (webpack, Vite/Rollup) can split each object into its
 * own chunk, so a browser build only downloads what's actually requested.
 *
 * Returned objects are frozen, matching {@link getObjectsById}.
 */
export async function getByIdAsync(id: string): Promise<DeepReadonly<AtlasObject> | undefined> {
  if (!atlasObjectIds.has(id)) {
    return undefined;
  }
  const module = (await import(`./data/${id}.js`)) as { default: AtlasObject };
  return deepFreeze(module.default);
}

/** Bulk variant of {@link getByIdAsync} for a known, curated set of IDs. */
export async function getByIdsAsync(ids: string[]): Promise<(DeepReadonly<AtlasObject> | undefined)[]> {
  return Promise.all(ids.map((id) => getByIdAsync(id)));
}
