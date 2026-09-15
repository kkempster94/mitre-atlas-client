import { describe, expect, it } from "vitest";
import { buildAtlasUrl } from "../src/urls.js";

describe("buildAtlasUrl", () => {
  it("builds a tactic URL", () => {
    expect(buildAtlasUrl("tactic", "AML.TA0002")).toBe("https://atlas.mitre.org/tactics/AML.TA0002");
  });

  it("builds a technique URL", () => {
    expect(buildAtlasUrl("technique", "AML.T0000")).toBe("https://atlas.mitre.org/techniques/AML.T0000");
  });

  it("builds a mitigation URL", () => {
    expect(buildAtlasUrl("mitigation", "AML.M0000")).toBe("https://atlas.mitre.org/mitigations/AML.M0000");
  });

  it("builds a case-study URL using the /studies/ path segment", () => {
    expect(buildAtlasUrl("case-study", "AML.CS0000")).toBe("https://atlas.mitre.org/studies/AML.CS0000");
  });

  it("does not URL-encode or otherwise sanitize the id", () => {
    expect(buildAtlasUrl("technique", "AML.T0000.000")).toBe(
      "https://atlas.mitre.org/techniques/AML.T0000.000",
    );
  });

  it("falls back to an 'undefined' path segment for an unrecognized object type", () => {
    // Documents current behavior: the lookup table has no entry for unknown
    // object types, so the segment is silently `undefined`.
    const url = buildAtlasUrl("unknown-type" as unknown as Parameters<typeof buildAtlasUrl>[0], "AML.T0000");
    expect(url).toBe("https://atlas.mitre.org/undefined/AML.T0000");
  });
});
