import { describe, expect, it } from "vitest";
import { rawAtlasData } from "../src/atlas-data.js";
import { buildAtlasUrl } from "../src/urls.js";

const GROUP_KEYS = ["tactics", "techniques", "mitigations", "case-studies"] as const;

const REQUIRED_STRING_FIELDS = ["id", "name", "description"] as const;

function allObjects() {
  return GROUP_KEYS.flatMap((groupKey) =>
    Object.entries(rawAtlasData[groupKey]).map(([id, object]) => ({ groupKey, id, object })),
  );
}

describe("ATLAS.yaml dataset integrity", () => {
  const objects = allObjects();

  it("contains a substantial number of objects", () => {
    expect(objects.length).toBeGreaterThanOrEqual(299);
  });

  it.each(objects.map(({ id, object }) => [id, object] as const))(
    "%s has non-empty required fields",
    (_id, object) => {
      for (const field of REQUIRED_STRING_FIELDS) {
        const value = (object as Record<string, unknown>)[field];
        expect(typeof value).toBe("string");
        expect((value as string).trim().length).toBeGreaterThan(0);
      }
      expect(typeof object["object-type"]).toBe("string");
      expect(object["object-type"].length).toBeGreaterThan(0);
    },
  );

  it.each(objects.map(({ id, object }) => [id, object] as const))(
    "%s's map key matches its own id field",
    (id, object) => {
      expect(object.id).toBe(id);
    },
  );

  it.each(objects.map(({ id, object }) => [id, object] as const))(
    "%s produces a valid ATLAS.mitre.org URL",
    (id, object) => {
      const url = buildAtlasUrl(object["object-type"], id);
      expect(url).toMatch(/^https:\/\/atlas\.mitre\.org\/(tactics|techniques|mitigations|studies)\/.+$/);
      expect(url).toContain(id);
    },
  );
});
