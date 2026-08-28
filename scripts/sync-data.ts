import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";

const RAW_BASE = "https://raw.githubusercontent.com/mitre-atlas/atlas-data/main";
const ENTRY_PATH = "dist/ATLAS-latest.yaml";
const MAX_SYMLINK_HOPS = 5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEST_PATH = join(__dirname, "..", "data", "ATLAS.yaml");

// `atlas-data` publishes its "latest" files as git symlinks (e.g.
// dist/ATLAS-latest.yaml -> dist/v6/ATLAS-latest.yaml -> dist/v6/ATLAS-2026.07.yaml).
// raw.githubusercontent.com serves a symlink's raw blob content, which is just the
// target path as plain text, not the resolved file - so we follow the chain manually.
function looksLikeSymlinkTarget(text: string): boolean {
  const trimmed = text.trim();
  return !trimmed.includes("\n") && /^[\w./-]+\.ya?ml$/i.test(trimmed);
}

async function fetchText(path: string): Promise<string> {
  const url = `${RAW_BASE}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function resolveAtlasYaml(entryPath: string): Promise<{ path: string; content: string }> {
  let path = entryPath;
  for (let hop = 0; hop < MAX_SYMLINK_HOPS; hop++) {
    const content = await fetchText(path);
    if (!looksLikeSymlinkTarget(content)) {
      return { path, content };
    }
    path = posix.join(posix.dirname(path), content.trim());
  }
  throw new Error(`Too many symlink hops resolving ${entryPath}`);
}

async function main() {
  console.log(`Resolving ${RAW_BASE}/${ENTRY_PATH} ...`);
  const { path, content } = await resolveAtlasYaml(ENTRY_PATH);
  console.log(`Resolved to ${RAW_BASE}/${path}`);
  writeFileSync(DEST_PATH, content, "utf-8");
  console.log(`Wrote ${content.length} bytes to ${DEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
