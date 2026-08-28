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

Returns the object's raw fields from ATLAS.yaml as-is, plus a derived `url` pointing to its atlas.mitre.org page. It does not resolve relationships (e.g. a technique's parent tactics, a mitigation's mitigated techniques, a case study's procedure) — those live in a separate `relationships` section of the upstream data and are out of scope for now.

## Development

```sh
npm install
npm run sync-data   # refresh data/ATLAS.yaml from upstream
npm run build
npm test
```
