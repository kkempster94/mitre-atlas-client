import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, version } from "vite5";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_INDEX = resolve(__dirname, "..", "dist", "index.js");

// The full dataset is ~430 kB. The main chunk only carries the manifest and glue.
const MAX_MAIN_CHUNK_BYTES = 40_000;

describe("bundling with Vite 5", () => {
  let workDir: string;
  let files: { name: string; source: string }[];

  beforeAll(async () => {
    workDir = mkdtempSync(join(tmpdir(), "atlas-treeshake-"));
    const entry = join(workDir, "entry.js");
    writeFileSync(
      entry,
      `import { getByIdsAsync, getSummaryIndex } from ${JSON.stringify(DIST_INDEX)};
getByIdsAsync(["AML.T0000", "AML.TA0002"]).then(console.log);
getSummaryIndex().then(console.log);
`,
    );
    const outDir = join(workDir, "out");
    await build({
      root: workDir,
      configFile: false,
      logLevel: "error",
      build: { outDir, emptyOutDir: true, rollupOptions: { input: entry } },
    });
    files = readdirSync(join(outDir, "assets"))
      .filter((name) => name.endsWith(".js"))
      .map((name) => ({ name, source: readFileSync(join(outDir, "assets", name), "utf-8") }));
  }, 60_000);

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("builds with Vite 5", () => {
    expect(version.split(".")[0]).toBe("5");
  });

  it("keeps the main chunk small and free of the full dataset", () => {
    const main = files.find((f) => f.name.startsWith("entry"))!;
    expect(main.source.length).toBeLessThan(MAX_MAIN_CHUNK_BYTES);
    // Text from a case study description, which only exists in the full dataset and its own chunk.
    expect(main.source).not.toContain("Evasion of Deep Learning Detector");
    expect(main.source).not.toContain("Search Open Technical Databases");
  });

  it("emits the summary index as its own chunk", () => {
    const summary = files.filter((f) => f.name.startsWith("summary-index"));
    expect(summary).toHaveLength(1);
    expect(summary[0]!.source).toContain("Search Open Technical Databases");
    expect(summary[0]!.source.length).toBeLessThan(40_000);
  });

  it("splits every object into its own chunk", () => {
    const perId = files.filter((f) => f.name.startsWith("AML."));
    expect(perId.length).toBeGreaterThanOrEqual(299);
  });
});
