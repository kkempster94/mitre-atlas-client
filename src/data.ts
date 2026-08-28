import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import type { AtlasObject, CaseStudy, Mitigation, Tactic, Technique } from "./types.js";
import { buildAtlasUrl } from "./urls.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "ATLAS.yaml");

interface RawAtlasDocument {
  "format-version": string;
  tactics: Record<string, Omit<Tactic, "url">>;
  techniques: Record<string, Omit<Technique, "url">>;
  mitigations: Record<string, Omit<Mitigation, "url">>;
  "case-studies": Record<string, Omit<CaseStudy, "url">>;
}

function loadObjectsById(): Map<string, AtlasObject> {
  const raw = readFileSync(DATA_PATH, "utf-8");
  const doc = parse(raw) as RawAtlasDocument;
  const byId = new Map<string, AtlasObject>();

  for (const groupKey of ["tactics", "techniques", "mitigations", "case-studies"] as const) {
    for (const [id, object] of Object.entries(doc[groupKey])) {
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
