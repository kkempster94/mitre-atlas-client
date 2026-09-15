import { describe, expect, it } from "vitest";
import { looksLikeSymlinkTarget, resolveWithinRoot } from "../scripts/sync-data.js";

describe("looksLikeSymlinkTarget", () => {
  it("recognizes a bare relative yaml filename as a symlink target", () => {
    expect(looksLikeSymlinkTarget("ATLAS-2026.07.yaml")).toBe(true);
  });

  it("recognizes a relative path with directories", () => {
    expect(looksLikeSymlinkTarget("v6/ATLAS-2026.07.yml")).toBe(true);
  });

  it("tolerates surrounding whitespace/newline from the raw blob", () => {
    expect(looksLikeSymlinkTarget("  ATLAS-2026.07.yaml\n")).toBe(true);
  });

  it("is case-insensitive on the .yaml/.yml extension", () => {
    expect(looksLikeSymlinkTarget("ATLAS-2026.07.YAML")).toBe(true);
  });

  it("rejects actual YAML document content", () => {
    const yamlDoc = "tactics:\n  AML.TA0000:\n    name: Reconnaissance\n";
    expect(looksLikeSymlinkTarget(yamlDoc)).toBe(false);
  });

  it("rejects multi-line text even if the first line looks like a path", () => {
    expect(looksLikeSymlinkTarget("ATLAS-2026.07.yaml\nsome other line")).toBe(false);
  });

  it("rejects empty content", () => {
    expect(looksLikeSymlinkTarget("")).toBe(false);
  });

  it("rejects a path without a yaml/yml extension", () => {
    expect(looksLikeSymlinkTarget("ATLAS-2026.07.json")).toBe(false);
  });
});

describe("resolveWithinRoot", () => {
  it("resolves a target relative to its symlink's directory", () => {
    expect(resolveWithinRoot("dist/v6", "ATLAS-2026.07.yaml")).toBe("dist/v6/ATLAS-2026.07.yaml");
  });

  it("resolves a target at the root", () => {
    expect(resolveWithinRoot("dist", "ATLAS-2026.07.yaml")).toBe("dist/ATLAS-2026.07.yaml");
  });

  it("trims whitespace/newline from the target before joining", () => {
    expect(resolveWithinRoot("dist", "  v6/ATLAS-2026.07.yaml\n".trim())).toBe(
      "dist/v6/ATLAS-2026.07.yaml",
    );
  });

  it("follows a target that walks back up a directory within the root", () => {
    expect(resolveWithinRoot("dist/v6", "../v7/ATLAS-2026.07.yaml")).toBe("dist/v7/ATLAS-2026.07.yaml");
  });

  it("rejects a target that escapes the root via parent traversal", () => {
    expect(() => resolveWithinRoot("dist", "../ATLAS-2026.07.yaml")).toThrow(/resolves outside/);
  });

  it("rejects a target that walks out and back to a sibling of the root", () => {
    expect(() => resolveWithinRoot("dist/v6", "../../etc/passwd")).toThrow(/resolves outside/);
  });
});
