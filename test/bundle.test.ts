import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite5";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Builds an app against the packed tarball installed as a real node_modules dependency, which is how
// consumers get the package. Vite skips variable-path dynamic imports inside node_modules, so the
// tree-shaking test (which imports dist directly) cannot catch a regression here.
describe("bundling the installed package with Vite 5", () => {
  let workDir: string;
  let warnings: string[];
  let files: { name: string; source: string }[];

  beforeAll(async () => {
    workDir = mkdtempSync(join(tmpdir(), "atlas-bundle-"));
    const packDir = join(workDir, "pack");
    const appDir = join(workDir, "app");
    mkdirSync(packDir);
    mkdirSync(appDir);

    const [{ filename }] = JSON.parse(
      execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", packDir], { cwd: ROOT, encoding: "utf-8" }),
    ) as { filename: string }[];

    writeFileSync(join(appDir, "package.json"), JSON.stringify({ name: "app", private: true, type: "module" }));
    execFileSync("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", join(packDir, filename)], {
      cwd: appDir,
      stdio: "pipe",
    });

    const entry = join(appDir, "entry.js");
    writeFileSync(
      entry,
      `import { getByIdsAsync, getSummaryIndex } from "mitre-atlas-client";
getByIdsAsync(["AML.T0051", "AML.T0054"]).then(console.log);
getSummaryIndex().then(console.log);
`,
    );

    warnings = [];
    const outDir = join(appDir, "out");
    await build({
      root: appDir,
      configFile: false,
      logLevel: "warn",
      customLogger: {
        info() {},
        warn: (message) => warnings.push(message),
        warnOnce: (message) => warnings.push(message),
        error: (message) => warnings.push(message),
        clearScreen() {},
        hasErrorLogged: () => false,
        hasWarned: false,
      },
      build: { outDir, emptyOutDir: true, rollupOptions: { input: entry } },
    });
    files = readdirSync(join(outDir, "assets"))
      .filter((name) => name.endsWith(".js"))
      .map((name) => ({ name, source: readFileSync(join(outDir, "assets", name), "utf-8") }));
  }, 180_000);

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("emits one chunk per object", () => {
    const perId = files.filter((f) => f.name.startsWith("AML."));
    expect(perId.length).toBeGreaterThanOrEqual(299);
    expect(perId.map((f) => f.name.split("-")[0])).toEqual(expect.arrayContaining(["AML.T0051", "AML.T0054"]));
  });

  it("keeps the main chunk small and free of the full dataset", () => {
    const main = files.find((f) => f.name.startsWith("entry"))!;
    console.log(`main chunk: ${main.source.length} B raw, ${gzipSync(main.source).length} B gzip`);
    expect(main.source.length).toBeLessThan(40_000);
    expect(main.source).not.toContain("Evasion of Deep Learning Detector");
  });

  it("emits the summary index as its own chunk", () => {
    const summary = files.filter((f) => f.name.startsWith("summary-index"));
    expect(summary).toHaveLength(1);
    console.log(`summary index: ${summary[0]!.source.length} B raw, ${gzipSync(summary[0]!.source).length} B gzip`);
    expect(summary[0]!.source).toContain("Search Open Technical Databases");
  });

  it("does not warn about modules imported both statically and dynamically", () => {
    console.log(`chunks: ${files.length}, warnings: ${warnings.length}`);
    expect(warnings.filter((w) => /dynamic(ally)? imported|manifest/i.test(w))).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
