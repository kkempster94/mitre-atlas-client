import { describe, expect, it } from "vitest";
import {
  buildAtlasUrl,
  getAllObjects,
  getById,
  getCaseStudies,
  getMitigations,
  getObjectsById,
  getTactics,
  getTechniques,
} from "../src/index.js";

describe("getById", () => {
  it("looks up a tactic", () => {
    const tactic = getById("AML.TA0002");
    expect(tactic?.["object-type"]).toBe("tactic");
    expect(tactic?.name).toBe("Reconnaissance");
    expect(tactic?.url).toBe("https://atlas.mitre.org/tactics/AML.TA0002");
  });

  it("looks up a technique", () => {
    const technique = getById("AML.T0000");
    expect(technique?.["object-type"]).toBe("technique");
    expect(technique?.name).toBe("Search Open Technical Databases");
    expect(technique?.url).toBe("https://atlas.mitre.org/techniques/AML.T0000");
  });

  it("looks up a sub-technique", () => {
    const subTechnique = getById("AML.T0000.000");
    expect(subTechnique?.["object-type"]).toBe("technique");
    expect(subTechnique?.name).toBe("Journals and Conference Proceedings");
  });

  it("looks up a mitigation", () => {
    const mitigation = getById("AML.M0000");
    expect(mitigation?.["object-type"]).toBe("mitigation");
    expect(mitigation?.url).toBe("https://atlas.mitre.org/mitigations/AML.M0000");
  });

  it("looks up a case study, using the /studies/ URL segment", () => {
    const caseStudy = getById("AML.CS0000");
    expect(caseStudy?.["object-type"]).toBe("case-study");
    expect(caseStudy?.url).toBe("https://atlas.mitre.org/studies/AML.CS0000");
  });

  it("returns undefined for an unknown ID", () => {
    expect(getById("AML.T9999")).toBeUndefined();
  });
});

describe("collection accessors", () => {
  it("getAllObjects returns every object, matching the sum of the per-type collections", () => {
    const all = getAllObjects();
    expect(all.length).toBe(
      getTactics().length + getTechniques().length + getMitigations().length + getCaseStudies().length,
    );
    expect(all.length).toBe(getObjectsById().size);
  });

  it("getTactics returns only tactics", () => {
    const tactics = getTactics();
    expect(tactics.length).toBeGreaterThan(0);
    expect(tactics.every((tactic) => tactic["object-type"] === "tactic")).toBe(true);
    expect(tactics.some((tactic) => tactic.id === "AML.TA0002")).toBe(true);
  });

  it("getTechniques returns only techniques, including sub-techniques", () => {
    const techniques = getTechniques();
    expect(techniques.every((technique) => technique["object-type"] === "technique")).toBe(true);
    expect(techniques.some((technique) => technique.id === "AML.T0000")).toBe(true);
    expect(techniques.some((technique) => technique.id === "AML.T0000.000")).toBe(true);
  });

  it("getMitigations returns only mitigations", () => {
    const mitigations = getMitigations();
    expect(mitigations.length).toBeGreaterThan(0);
    expect(mitigations.every((mitigation) => mitigation["object-type"] === "mitigation")).toBe(true);
  });

  it("getCaseStudies returns only case studies", () => {
    const caseStudies = getCaseStudies();
    expect(caseStudies.length).toBeGreaterThan(0);
    expect(caseStudies.every((caseStudy) => caseStudy["object-type"] === "case-study")).toBe(true);
  });

  it("getObjectsById is keyed consistently with getById", () => {
    const byId = getObjectsById();
    expect(byId.get("AML.T0000")).toEqual(getById("AML.T0000"));
  });
});

describe("buildAtlasUrl", () => {
  it("builds URLs for each object type", () => {
    expect(buildAtlasUrl("tactic", "AML.TA0002")).toBe("https://atlas.mitre.org/tactics/AML.TA0002");
    expect(buildAtlasUrl("technique", "AML.T0000")).toBe("https://atlas.mitre.org/techniques/AML.T0000");
    expect(buildAtlasUrl("mitigation", "AML.M0000")).toBe("https://atlas.mitre.org/mitigations/AML.M0000");
    expect(buildAtlasUrl("case-study", "AML.CS0000")).toBe("https://atlas.mitre.org/studies/AML.CS0000");
  });
});
