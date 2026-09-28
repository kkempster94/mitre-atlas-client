import { describe, expect, it } from "vitest";
import { getById, getSummaryIndex } from "../dist/index.js";
import type { DeepReadonly, Technique } from "../dist/index.js";
import { atlasObjectIds } from "../dist/data/manifest.js";

describe("getSummaryIndex", () => {
  it("has an entry for every ID in the manifest, and nothing else", async () => {
    const index = await getSummaryIndex();
    expect(Object.keys(index).sort()).toEqual([...atlasObjectIds].sort());
  });

  it("matches the full object for type, name, and tactics", async () => {
    const index = await getSummaryIndex();
    for (const id of atlasObjectIds) {
      const object = getById(id)!;
      expect(index[id]!.type, id).toBe(object["object-type"]);
      expect(index[id]!.name, id).toBe(object.name);
      if (object["object-type"] === "technique") {
        expect(index[id]!.tactics, id).toEqual((object as DeepReadonly<Technique>).tactics);
      } else {
        expect(index[id]!.tactics, id).toBeUndefined();
      }
    }
  });

  it("returns a frozen index that cannot be mutated", async () => {
    const index = await getSummaryIndex();
    expect(Object.isFrozen(index)).toBe(true);
    expect(Object.isFrozen(index["AML.T0015"])).toBe(true);
    expect(Object.isFrozen(index["AML.T0015"]!.tactics)).toBe(true);
    expect(() => {
      (index["AML.T0015"] as { name: string }).name = "tampered";
    }).toThrow(TypeError);
    expect(() => {
      (index["AML.T0015"]!.tactics as string[]).push("AML.TA9999");
    }).toThrow(TypeError);
  });

  it("returns the same instance across calls", async () => {
    expect(await getSummaryIndex()).toBe(await getSummaryIndex());
  });
});
