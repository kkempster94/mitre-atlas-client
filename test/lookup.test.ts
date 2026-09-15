import { describe, expect, it } from "vitest";
import { getByIdAsync, getByIdsAsync, getById } from "../dist/index.js";

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

  it("returns a frozen object that cannot be mutated", () => {
    const technique = getById("AML.T0000");
    expect(technique).toBeDefined();
    expect(Object.isFrozen(technique)).toBe(true);

    expect(() => {
      (technique as { name: string }).name = "tampered";
    }).toThrow(TypeError);
    expect(getById("AML.T0000")?.name).toBe("Search Open Technical Databases");
  });

  it("returns an object whose nested references array cannot be mutated", () => {
    const technique = getById("AML.T0000");
    expect(technique).toBeDefined();
    expect(Object.isFrozen(technique!.references)).toBe(true);

    expect(() => {
      (technique!.references as { url: string }[]).push({ url: "https://example.com" });
    }).toThrow(TypeError);
    expect(getById("AML.T0000")?.references).toHaveLength(technique!.references.length);
  });

  it("returns the same cached instance across calls", () => {
    expect(getById("AML.T0000")).toBe(getById("AML.T0000"));
  });
});

describe("getByIdAsync", () => {
  it("looks up a technique via dynamic import", async () => {
    const technique = await getByIdAsync("AML.T0000");
    expect(technique?.["object-type"]).toBe("technique");
    expect(technique?.name).toBe("Search Open Technical Databases");
    expect(technique?.url).toBe("https://atlas.mitre.org/techniques/AML.T0000");
  });

  it("returns undefined for an unknown ID without attempting a dynamic import", async () => {
    expect(await getByIdAsync("AML.T9999")).toBeUndefined();
  });

  it("rejects a path-traversal-shaped ID instead of importing an arbitrary module", async () => {
    expect(await getByIdAsync("../../package.json")).toBeUndefined();
  });
});

describe("getByIdsAsync", () => {
  it("looks up multiple objects, preserving order and undefined entries", async () => {
    const [tactic, unknown, mitigation] = await getByIdsAsync(["AML.TA0002", "AML.T9999", "AML.M0000"]);
    expect(tactic?.name).toBe("Reconnaissance");
    expect(unknown).toBeUndefined();
    expect(mitigation?.["object-type"]).toBe("mitigation");
  });
});
