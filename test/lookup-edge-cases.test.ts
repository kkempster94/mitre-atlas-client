import { describe, expect, it } from "vitest";
import { getById } from "../src/index.js";

describe("getById edge cases", () => {
  it("returns undefined for an empty string", () => {
    expect(getById("")).toBeUndefined();
  });

  it("returns undefined for whitespace-only input", () => {
    expect(getById("   ")).toBeUndefined();
  });

  it("does not trim leading/trailing whitespace around an otherwise valid id", () => {
    expect(getById("  AML.TA0002  ")).toBeUndefined();
    expect(getById("AML.TA0002")?.name).toBe("Reconnaissance");
  });

  it("is case-sensitive", () => {
    expect(getById("aml.ta0002")).toBeUndefined();
  });

  it("returns undefined for non-string inputs", () => {
    expect(getById(null as unknown as string)).toBeUndefined();
    expect(getById(undefined as unknown as string)).toBeUndefined();
    expect(getById(123 as unknown as string)).toBeUndefined();
    expect(getById({} as unknown as string)).toBeUndefined();
  });

  it("returns undefined for an unknown but well-formed id", () => {
    expect(getById("AML.T9999")).toBeUndefined();
  });

  it("returns undefined for a partial/prefix id", () => {
    expect(getById("AML.T0000.")).toBeUndefined();
    expect(getById("AML.T000")).toBeUndefined();
  });
});
