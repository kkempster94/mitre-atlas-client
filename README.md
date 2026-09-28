# mitre-atlas-client

Look up [MITRE ATLAS](https://atlas.mitre.org) tactics, techniques, mitigations, and case studies by ID, with a link back to the corresponding atlas.mitre.org page.

Data is vendored from [`mitre-atlas/atlas-data`](https://github.com/mitre-atlas/atlas-data) (v6 format) and can be refreshed with `npm run sync-data`.

## Usage

```ts
import { getById } from "mitre-atlas-client";

const technique = getById("AML.T0000");
// {
//   "object-type": "technique",
//   id: "AML.T0000",
//   name: "Search Open Technical Databases",
//   description: "...",
//   url: "https://atlas.mitre.org/techniques/AML.T0000",
//   ...
// }

getById("AML.TA0002");   // tactic
getById("AML.T0000.000"); // sub-technique
getById("AML.M0000");    // mitigation
getById("AML.CS0000");   // case study
getById("bogus-id");     // undefined
```

Returns the object's raw fields from ATLAS.yaml, plus a derived `url` pointing to its atlas.mitre.org page and the resolved relationship fields described below.

### Relationships

Upstream keeps relationships in a separate `relationships` section of ATLAS.yaml. This package resolves them at build time into ID arrays on each object, precomputed in both directions. Fields are always IDs, never embedded objects; look them up with `getById` / `getByIdAsync`. Arrays are empty when there is nothing to list.

| Object       | Field           | Contains                                                            |
| ------------ | --------------- | ------------------------------------------------------------------- |
| Technique    | `tactics`       | Tactics the technique achieves (never empty), in upstream order     |
| Technique    | `parent`        | Parent technique ID. Only present on sub-techniques                 |
| Technique    | `subtechniques` | Sub-technique IDs                                                   |
| Technique    | `mitigations`   | Mitigations that mitigate the technique                             |
| Technique    | `caseStudies`   | Case studies that employ the technique                              |
| Tactic       | `techniques`    | Techniques and sub-techniques that achieve the tactic               |
| Mitigation   | `techniques`    | Techniques the mitigation mitigates                                 |
| Case study   | `techniques`    | Techniques employed, in procedure order, each listed once           |

A technique can belong to several tactics. `tactics` keeps the order upstream defines, but which tactic to show when you only have room for one (for example the first) is your decision. Sub-technique links are direct: a technique's `caseStudies` and `mitigations` do not include those of its sub-techniques.

```ts
import { getByIdAsync, getByIdsAsync } from "mitre-atlas-client";

const technique = await getByIdAsync("AML.T0015");
const tactics = await getByIdsAsync(technique?.tactics ?? []);
tactics.map((tactic) => tactic?.name);
// ["Initial Access", "Defense Evasion", "Impact"]
```

### Summary index

`getSummaryIndex` returns `{ type, name, tactics? }` for every object, keyed by ID (`tactics` is only set on techniques). It loads as a single small chunk, so you can render a chart or fill filter dropdowns without loading one chunk per ID.

```ts
import { getSummaryIndex } from "mitre-atlas-client";

const index = await getSummaryIndex();
index["AML.T0015"]; // { type: "technique", name: "Evade AI Model", tactics: ["AML.TA0004", ...] }

const byTactic = Object.entries(index).filter(([, s]) => s.tactics?.includes("AML.TA0004"));
```

Like the other lookups, the returned index is deeply frozen.

Returned objects are deeply frozen and typed as `DeepReadonly` — mutating any field (including nested arrays like `references`) throws a `TypeError` instead of silently corrupting the shared cache. Copy the object first (e.g. with a spread) if you need a mutable version.

### Lazy loading

`getById` requires the full ATLAS dataset to be loaded in memory. For browser bundles that only need a handful of objects, `getByIdAsync` and `getByIdsAsync` fetch just the requested object(s) via a dynamic `import()`, one module per ID. `getSummaryIndex` is loaded the same way, as its own chunk. Each per-ID `import()` uses a literal path, so bundlers that support code-splitting on dynamic import (webpack, Vite/Rollup) will split each object into its own chunk, so only what's requested is downloaded at runtime. This works when the package is installed under `node_modules`, not just when linked. Like `getById`, the returned objects are deeply frozen.

```ts
import { getByIdAsync, getByIdsAsync } from "mitre-atlas-client";

const technique = await getByIdAsync("AML.T0000");
const [tactic, mitigation] = await getByIdsAsync(["AML.TA0002", "AML.M0000"]);

await getByIdAsync("bogus-id"); // undefined
```

## Development

```sh
npm install
npm run sync-data   # refresh data/ATLAS.yaml from upstream
npm run build
npm test
```
