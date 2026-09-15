import { describe, expect, it } from "vitest";
import { resolveWithinRoot } from "../scripts/sync-data.js";

describe("resolveWithinRoot", () => {
  it("resolves a same-directory symlink target", () => {
    expect(resolveWithinRoot("dist", "ATLAS-2026.07.yaml")).toBe("dist/ATLAS-2026.07.yaml");
  });

  it("resolves a symlink target in a nested directory", () => {
    expect(resolveWithinRoot("dist", "v6/ATLAS-latest.yaml")).toBe("dist/v6/ATLAS-latest.yaml");
    expect(resolveWithinRoot("dist/v6", "ATLAS-2026.07.yaml")).toBe("dist/v6/ATLAS-2026.07.yaml");
  });

  it("resolves a target that uses .. but stays within the root", () => {
    expect(resolveWithinRoot("dist/v6", "../v6/ATLAS-2026.07.yaml")).toBe("dist/v6/ATLAS-2026.07.yaml");
  });

  it("rejects a target that escapes the root via ..", () => {
    expect(() => resolveWithinRoot("dist", "../ATLAS.yaml")).toThrow(/escapes|resolves outside/i);
    expect(() => resolveWithinRoot("dist/v6", "../../etc/passwd.yaml")).toThrow(/escapes|resolves outside/i);
  });

  it("rejects a target that resolves to the root's parent directory", () => {
    expect(() => resolveWithinRoot("dist", "..")).toThrow(/escapes|resolves outside/i);
  });
});
