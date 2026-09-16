#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const dir = dirname(fileURLToPath(import.meta.url));
const files = (await readdir(dir)).filter((f) => f.endsWith(".test.mjs")).sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [resolve(dir, file)], { stdio: "inherit" });
  if (result.status !== 0) failed += 1;
}
if (failed) process.exit(1);
console.log(`HOTFIX_SUITE_PASS tests=${files.length}`);
