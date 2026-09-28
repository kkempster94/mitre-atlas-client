import { describe, expect, it } from "vitest";
import { getById, getByIdAsync } from "../dist/index.js";
import type { CaseStudy, DeepReadonly, Mitigation, Tactic, Technique } from "../dist/index.js";
import { atlasObjectIds } from "../dist/data/manifest.js";

// Techniques that upstream legitimately maps to no tactic. Currently none.
const TECHNIQUES_WITHOUT_TACTICS: string[] = [];

type Any = DeepReadonly<Tactic | Technique | Mitigation | CaseStudy>;

const all = [...atlasObjectIds].map((id) => getById(id) as Any);
const techniques = all.filter((o): o is DeepReadonly<Technique> => o["object-type"] === "technique");
const tactics = all.filter((o): o is DeepReadonly<Tactic> => o["object-type"] === "tactic");
const mitigations = all.filter((o): o is DeepReadonly<Mitigation> => o["object-type"] === "mitigation");
const caseStudies = all.filter((o): o is DeepReadonly<CaseStudy> => o["object-type"] === "case-study");

function relationshipIds(object: Any): string[] {
  switch (object["object-type"]) {
    case "tactic":
    case "mitigation":
    case "case-study":
      return [...object.techniques];
    case "technique":
      return [
        ...object.tactics,
        ...(object.parent ? [object.parent] : []),
        ...object.subtechniques,
        ...object.mitigations,
        ...object.caseStudies,
      ];
  }
}

describe("relationship fields", () => {
  it("resolves every relationship ID via getById to the expected object type", () => {
    for (const technique of techniques) {
      for (const id of technique.tactics) expect(getById(id)?.["object-type"], id).toBe("tactic");
      for (const id of technique.subtechniques) expect(getById(id)?.["object-type"], id).toBe("technique");
      for (const id of technique.mitigations) expect(getById(id)?.["object-type"], id).toBe("mitigation");
      for (const id of technique.caseStudies) expect(getById(id)?.["object-type"], id).toBe("case-study");
      if (technique.parent) expect(getById(technique.parent)?.["object-type"]).toBe("technique");
    }
    for (const object of [...tactics, ...mitigations, ...caseStudies]) {
      for (const id of object.techniques) expect(getById(id)?.["object-type"], id).toBe("technique");
    }
    expect(all.flatMap(relationshipIds).length).toBeGreaterThan(0);
  });

  it("has no duplicate IDs within any relationship array", () => {
    for (const object of all) {
      for (const field of ["tactics", "techniques", "subtechniques", "mitigations", "caseStudies"] as const) {
        const ids = (object as unknown as Record<string, string[] | undefined>)[field] ?? [];
        expect(new Set(ids).size, `${object.id}.${field}`).toBe(ids.length);
      }
    }
  });

  it("agrees between technique.tactics and tactic.techniques", () => {
    for (const technique of techniques) {
      for (const id of technique.tactics) {
        expect((getById(id) as DeepReadonly<Tactic>).techniques, `${technique.id} -> ${id}`).toContain(technique.id);
      }
    }
    for (const tactic of tactics) {
      for (const id of tactic.techniques) {
        expect((getById(id) as DeepReadonly<Technique>).tactics, `${tactic.id} -> ${id}`).toContain(tactic.id);
      }
    }
  });

  it("agrees between technique.mitigations and mitigation.techniques", () => {
    for (const technique of techniques) {
      for (const id of technique.mitigations) {
        expect((getById(id) as DeepReadonly<Mitigation>).techniques, `${technique.id} -> ${id}`).toContain(technique.id);
      }
    }
    for (const mitigation of mitigations) {
      for (const id of mitigation.techniques) {
        expect((getById(id) as DeepReadonly<Technique>).mitigations, `${mitigation.id} -> ${id}`).toContain(mitigation.id);
      }
    }
  });

  it("agrees between technique.caseStudies and caseStudy.techniques", () => {
    for (const technique of techniques) {
      for (const id of technique.caseStudies) {
        expect((getById(id) as DeepReadonly<CaseStudy>).techniques, `${technique.id} -> ${id}`).toContain(technique.id);
      }
    }
    for (const caseStudy of caseStudies) {
      for (const id of caseStudy.techniques) {
        expect((getById(id) as DeepReadonly<Technique>).caseStudies, `${caseStudy.id} -> ${id}`).toContain(caseStudy.id);
      }
    }
  });

  it("lists case study techniques in procedure (step-id) order", () => {
    const caseStudy = getById("AML.CS0000") as DeepReadonly<CaseStudy>;
    expect(caseStudy.techniques).toEqual([
      "AML.T0000.001",
      "AML.T0002.000",
      "AML.T0005",
      "AML.T0043.003",
      "AML.T0042",
      "AML.T0015",
    ]);
  });

  it("agrees between sub-technique parent and parent subtechniques", () => {
    for (const technique of techniques) {
      if (technique.parent) {
        expect((getById(technique.parent) as DeepReadonly<Technique>).subtechniques, technique.id).toContain(technique.id);
        expect(technique.id.startsWith(`${technique.parent}.`), technique.id).toBe(true);
      } else {
        expect(technique.id.split(".")).toHaveLength(2);
      }
      for (const id of technique.subtechniques) {
        expect((getById(id) as DeepReadonly<Technique>).parent, `${technique.id} -> ${id}`).toBe(technique.id);
      }
    }
    expect(techniques.filter((t) => t.parent).length).toBeGreaterThan(0);
  });

  it("gives every technique at least one tactic, except the listed exceptions", () => {
    const without = techniques.filter((t) => t.tactics.length === 0).map((t) => t.id);
    expect(without).toEqual(TECHNIQUES_WITHOUT_TACTICS);
  });

  it("keeps upstream tactic order for techniques with several tactics", () => {
    expect((getById("AML.T0015") as DeepReadonly<Technique>).tactics).toEqual([
      "AML.TA0004",
      "AML.TA0007",
      "AML.TA0011",
    ]);
  });

  it("gives every object every array field its type requires", () => {
    for (const technique of techniques) {
      for (const field of ["tactics", "subtechniques", "mitigations", "caseStudies"] as const) {
        expect(Array.isArray(technique[field]), `${technique.id}.${field}`).toBe(true);
      }
    }
    for (const object of [...tactics, ...mitigations, ...caseStudies]) {
      expect(Array.isArray(object.techniques), `${object.id}.techniques`).toBe(true);
    }
  });

  it("returns the same relationship fields from getById and getByIdAsync", async () => {
    for (const id of ["AML.T0015", "AML.T0000.000", "AML.TA0002", "AML.M0000", "AML.CS0000"]) {
      expect(await getByIdAsync(id)).toEqual(getById(id));
    }
  });

  it("returns frozen relationship arrays that cannot be mutated", async () => {
    for (const technique of [getById("AML.T0015"), await getByIdAsync("AML.T0015")] as DeepReadonly<Technique>[]) {
      expect(Object.isFrozen(technique.tactics)).toBe(true);
      expect(Object.isFrozen(technique.mitigations)).toBe(true);
      expect(() => (technique.tactics as string[]).push("AML.TA9999")).toThrow(TypeError);
      expect(() => ((technique as unknown as { tactics: string[] }).tactics = [])).toThrow(TypeError);
    }
    const tactic = getById("AML.TA0002") as DeepReadonly<Tactic>;
    expect(() => (tactic.techniques as string[]).push("AML.T9999")).toThrow(TypeError);
    expect(getById("AML.T0015")).toBe(getById("AML.T0015"));
    expect((getById("AML.T0015") as DeepReadonly<Technique>).tactics).toHaveLength(3);
  });
});
