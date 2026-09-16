#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { adaptCase, detectVersion } = require(resolve(root, "src/infrastructure/schema/case-adapter.js"));

const errors = [];
function check(label, cond) {
  if (!cond) errors.push(label);
}

const livePath = resolve(root, "dist/game.json");
const liveRaw = readFileSync(livePath, "utf8");
const live = JSON.parse(liveRaw);
const adapted = adaptCase(live);
check("detect 2.x", detectVersion(live) === "2.x");
check("warn schemaVersion", adapted.warnings.some((w) => w.path === "schemaVersion"));
check("warn evidence", adapted.warnings.some((w) => /admissibility/.test(w.path)));
check("normalized schemaVersion 2.x", adapted.normalized.schemaVersion === "2.x");
check("disk unchanged", readFileSync(livePath, "utf8") === liveRaw);
check("source evidence not mutated", live.evidence[0].admissibility === undefined);
check("adapted evidence filled", adapted.normalized.evidence[0].admissibility === "unknown");

const valid = JSON.parse(readFileSync(resolve(root, "tests/fixtures/schema-3.0-valid.json"), "utf8"));
const v3 = adaptCase(valid);
check("3.x no adapt", v3.version === "3.x" && v3.warnings.length === 0);

const linear = { metadata: { id: "x" }, locations: [{}], travel: {}, dossier: {} };
check("1.x", adaptCase(linear).version === "1.x");

if (errors.length) {
  console.error("CASE_ADAPTER_FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("CASE_ADAPTER_PASS");
