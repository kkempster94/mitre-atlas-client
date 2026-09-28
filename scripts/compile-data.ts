import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { AtlasObject } from "../src/types.js";
import { buildAtlasUrl } from "../src/urls.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = join(__dirname, "..", "data", "ATLAS.yaml");
const DEST_PATH = join(__dirname, "..", "src", "atlas-data.ts");
const OBJECTS_DIR = join(__dirname, "..", "src", "data");

const GROUP_KEYS = ["tactics", "techniques", "mitigations", "case-studies"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

// Generated module names that an ATLAS ID must not shadow.
const RESERVED_MODULE_NAMES = ["manifest", "loaders", "summary-index"];

interface RelationshipEdge {
  source: string;
  target: string;
  "relationship-type": string;
  "step-id"?: string;
}

// Which group each upstream relationship type connects, as [source, target].
const RELATIONSHIP_ENDPOINTS: Record<string, [GroupKey, GroupKey]> = {
  achieves: ["techniques", "tactics"],
  specializes: ["techniques", "techniques"],
  mitigates: ["mitigations", "techniques"],
  employs: ["case-studies", "techniques"],
};

type MutableObjects = Record<string, Record<string, unknown>>;

function pushUnique(object: Record<string, unknown>, field: string, id: string): void {
  const list = object[field] as string[];
  if (!list.includes(id)) {
    list.push(id);
  }
}

/**
 * Resolves the upstream `relationships` section into ID-array fields on each
 * object, in both directions. Upstream keys edges by source ID, and the order
 * of a technique's `achieves` edges is preserved as its `tactics` order, and a
 * case study's `employs` edges are sorted by `step-id` to give procedure order. The
 * matrix's `sequences` edges (tactic column order) are not object relationships
 * and are skipped. Anything unexpected throws so upstream changes surface here.
 */
function resolveRelationships(doc: Record<string, unknown>, data: Record<GroupKey, MutableObjects>): void {
  const groupOf = new Map<string, GroupKey>();
  for (const groupKey of GROUP_KEYS) {
    for (const id of Object.keys(data[groupKey])) {
      groupOf.set(id, groupKey);
    }
  }

  for (const tactic of Object.values(data.tactics)) {
    tactic.techniques = [];
  }
  for (const technique of Object.values(data.techniques)) {
    Object.assign(technique, { tactics: [], subtechniques: [], mitigations: [], caseStudies: [] });
  }
  for (const group of [data.mitigations, data["case-studies"]]) {
    for (const object of Object.values(group)) {
      object.techniques = [];
    }
  }

  const relationships = (doc.relationships ?? {}) as Record<string, Record<string, RelationshipEdge[]>>;
  for (const [sourceKey, byType] of Object.entries(relationships)) {
    if (sourceKey === (doc.matrix as { id: string }).id) {
      continue;
    }
    for (const [type, edges] of Object.entries(byType)) {
      const endpoints = RELATIONSHIP_ENDPOINTS[type];
      if (!endpoints) {
        throw new Error(`Unknown relationship type "${type}" on ${sourceKey}`);
      }
      // Case study steps are listed in upstream order, which is not step order.
      const ordered =
        type === "employs"
          ? [...edges].sort((a, b) => (a["step-id"] ?? "").localeCompare(b["step-id"] ?? "", undefined, { numeric: true }))
          : edges;
      for (const { source, target, "relationship-type": edgeType } of ordered) {
        if (source !== sourceKey || edgeType !== type) {
          throw new Error(`Relationship ${sourceKey}/${type} has inconsistent edge ${source} -> ${target} (${edgeType})`);
        }
        if (groupOf.get(source) !== endpoints[0] || groupOf.get(target) !== endpoints[1]) {
          throw new Error(`Relationship "${type}" ${source} -> ${target} does not connect ${endpoints.join(" to ")}`);
        }
        const sourceObject = data[endpoints[0]][source]!;
        const targetObject = data[endpoints[1]][target]!;
        switch (type) {
          case "achieves":
            pushUnique(sourceObject, "tactics", target);
            pushUnique(targetObject, "techniques", source);
            break;
          case "specializes":
            if (sourceObject.parent !== undefined) {
              throw new Error(`Technique ${source} specializes more than one parent`);
            }
            sourceObject.parent = target;
            pushUnique(targetObject, "subtechniques", source);
            break;
          case "mitigates":
            pushUnique(sourceObject, "techniques", target);
            pushUnique(targetObject, "mitigations", source);
            break;
          case "employs":
            // A case study can employ one technique in several steps.
            pushUnique(sourceObject, "techniques", target);
            pushUnique(targetObject, "caseStudies", source);
            break;
        }
      }
    }
  }
}

function writeSummaryIndex(data: Record<GroupKey, MutableObjects>): void {
  const index: Record<string, { type: string; name: string; tactics?: string[] }> = {};
  for (const groupKey of GROUP_KEYS) {
    for (const [id, object] of Object.entries(data[groupKey])) {
      index[id] = {
        type: object["object-type"] as string,
        name: object.name as string,
        ...(groupKey === "techniques" && { tactics: object.tactics as string[] }),
      };
    }
  }

  const contents = `// Generated by \`npm run compile-data\` from data/ATLAS.yaml. Do not edit by hand.
import type { AtlasSummary } from "../types.js";

const summaryIndex: Record<string, AtlasSummary> = ${JSON.stringify(index)};

export default summaryIndex;
`;
  writeFileSync(join(OBJECTS_DIR, "summary-index.ts"), contents, "utf-8");
}

// Literal import() paths, unlike a `./data/${id}.js` template, can be code-split by every bundler,
// including for packages installed under node_modules (where Vite skips variable-path imports).
function writeLoaders(ids: string[]): void {
  const entries = ids.map((id) => `  ${JSON.stringify(id)}: () => import(${JSON.stringify(`./${id}.js`)}),`);
  const contents = `// Generated by \`npm run compile-data\` from data/ATLAS.yaml. Do not edit by hand.
import type { AtlasObject } from "../types.js";

export const loaders: Readonly<Record<string, () => Promise<{ default: AtlasObject }>>> = {
${entries.join("\n")}
};
`;
  writeFileSync(join(OBJECTS_DIR, "loaders.ts"), contents, "utf-8");
}

function writePerObjectModules(data: Record<GroupKey, MutableObjects>): void {
  if (existsSync(OBJECTS_DIR)) {
    rmSync(OBJECTS_DIR, { recursive: true });
  }
  mkdirSync(OBJECTS_DIR, { recursive: true });

  const ids: string[] = [];
  for (const groupKey of GROUP_KEYS) {
    const group = data[groupKey] as unknown as Record<string, Omit<AtlasObject, "url">>;
    for (const [id, object] of Object.entries(group)) {
      if (RESERVED_MODULE_NAMES.includes(id)) {
        throw new Error(`ATLAS ID "${id}" collides with a generated module`);
      }
      const withUrl: AtlasObject = { ...object, url: buildAtlasUrl(object["object-type"], id) } as AtlasObject;
      const contents = `// Generated by \`npm run compile-data\` from data/ATLAS.yaml. Do not edit by hand.
import type { AtlasObject } from "../types.js";

const object: AtlasObject = ${JSON.stringify(withUrl, null, 2)};

export default object;
`;
      writeFileSync(join(OBJECTS_DIR, `${id}.ts`), contents, "utf-8");
      ids.push(id);
    }
  }
  ids.sort();

  const manifestContents = `// Generated by \`npm run compile-data\` from data/ATLAS.yaml. Do not edit by hand.
export const atlasObjectIds: ReadonlySet<string> = new Set(${JSON.stringify(ids, null, 2)});
`;
  writeFileSync(join(OBJECTS_DIR, "manifest.ts"), manifestContents, "utf-8");
  writeLoaders(ids);
  writeSummaryIndex(data);
  console.log(`Wrote ${ids.length} per-object modules to ${OBJECTS_DIR}`);
}

export function compileAtlasData(): void {
  const raw = readFileSync(SOURCE_PATH, "utf-8");
  const doc = parse(raw) as Record<string, unknown>;

  const data = {} as Record<GroupKey, MutableObjects>;
  for (const key of GROUP_KEYS) {
    data[key] = (doc[key] ?? {}) as MutableObjects;
  }
  resolveRelationships(doc, data);

  const contents = `// Generated by \`npm run compile-data\` from data/ATLAS.yaml. Do not edit by hand.
import type { RawAtlasDocument } from "./types.js";

export const rawAtlasData: RawAtlasDocument = ${JSON.stringify(data, null, 2)};
`;

  writeFileSync(DEST_PATH, contents, "utf-8");
  console.log(`Wrote ${DEST_PATH}`);

  writePerObjectModules(data);
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  compileAtlasData();
}
