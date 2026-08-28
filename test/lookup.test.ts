import { describe, expect, it } from "vitest";
import { getById } from "../src/index.js";

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
