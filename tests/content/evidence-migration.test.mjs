#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { catalogEvidence, getDiscovered, getById } = require(resolve(root, "src/domain/evidence/evidence-service.js"));
const { adaptCase, detectVersion } = require(resolve(root, "src/infrastructure/schema/case-adapter.js"));

function load(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}

function run(script, args = []) {
  return spawnSync(process.execPath, [resolve(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

const errors = [];
function check(label, condition) {
  if (!condition) errors.push(label);
}

const live = load("dist/game.json");
const raw = readFileSync(resolve(root, "dist/game.json"), "utf8");
const before = load("tests/fixtures/evidence/catalog-before.json");
const after = load("tests/fixtures/evidence/catalog-after.json");
const ownership = load("tests/fixtures/evidence/chapter-ownership.json");
const gap = load("tests/fixtures/evidence/historical-gap.json");
const invented = ["kind", "method", "type", "completeness", "observedAt", "relations", "contradicts", "notes"];
const expectedIds = ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E11", "E12", "E13", "E14", "E15", "E16"];
const allOwned = new Set(["cifra", "byte", "null", "vertice"].flatMap((key) => ownership[key]));

const ids = live.evidence.map((item) => item.id);
check("published catalog has 14 records", ids.length === 14);
check("published IDs are E01-E08 and E11-E16", ids.join() === expectedIds.join());
check("fixture after matches published catalog", JSON.stringify(live.evidence) === JSON.stringify(after));
check("fixture before has the same 14 IDs", before.map((item) => item.id).join() === expectedIds.join());
check("historical gap lists E09 and E10 only", gap.never_defined.join() === "E09,E10");
check("document does not invent E09", !/"E09"/.test(raw));
check("document does not invent E10", !/"E10"/.test(raw));

check("facts id/title/text/tag/source preserved", live.evidence.every((item, index) => (
  item.id === before[index].id
  && item.title === before[index].title
  && item.text === before[index].text
  && item.tag === before[index].tag
  && item.source === before[index].source
  && before[index].source === null
)));
check("unknown origin remains source null", live.evidence.every((item) => item.source === null));
check("admissibility unknown is explicit", live.evidence.every((item) => item.admissibility === "unknown"));
check("integrity unverified is explicit", live.evidence.every((item) => item.integrity === "unverified"));
check("quality null is explicit and not zero", live.evidence.every((item) => item.quality === null));
check("no invented kind/method/relations", live.evidence.every((item) => invented.every((key) => !(key in item))));

check("schemaVersion remains 3.0", live.schemaVersion === "3.0");
check("adapter treats published case as 3.x", detectVersion(live) === "3.x");
const adapted = adaptCase(JSON.parse(raw));
check(
  "3.x adapter does not rewrite published evidence",
  adapted.warnings.length === 0
    && JSON.stringify(adapted.normalized.evidence) === JSON.stringify(live.evidence),
);
check("adapter leaves disk image untouched", readFileSync(resolve(root, "dist/game.json"), "utf8") === raw);

const first = catalogEvidence({ evidence: [] }, "E01", live);
const again = catalogEvidence({ evidence: first.evidence }, "E01", live);
check("catalogEvidence accepts published E01", first.ok === true && first.duplicate === false && first.record.id === "E01");
check("catalogEvidence is idempotent", again.ok === true && again.duplicate === true && again.evidence.join() === "E01");
check("getById preserves source null", getById("E08", live).source === null && getById("E16", live).quality === null);
const discovered = getDiscovered({ evidence: ["E01", "E11"] }, live);
check("getDiscovered returns only discovered IDs", discovered.map((item) => item.id).join() === "E01,E11");
check("undiscovered E03 stays out of the board", discovered.every((item) => item.id !== "E03"));

function effectiveAction(base, scenario) {
  return Object.assign({}, base, scenario.action_overrides?.[base.id] || {});
}

const isolationLeaks = [];
const missingRequired = [];
for (const [chapterId, chapter] of Object.entries(live.campaign.chapters)) {
  const own = new Set(ownership[chapterId]);
  const required = new Set(chapter.arrest_requirements.required_evidence);
  for (const scenario of chapter.scenarios) {
    const collected = new Set();
    for (const location of live.locations) {
      for (const base of location.actions || []) {
        const evidenceId = effectiveAction(base, scenario).evidence;
        if (!evidenceId) continue;
        if (scenario.route.includes(location.id)) collected.add(evidenceId);
        if (!own.has(evidenceId) && allOwned.has(evidenceId)) {
          isolationLeaks.push(`${chapterId}/${scenario.id}/${base.id}->${evidenceId}`);
        }
      }
    }
    for (const evidenceId of required) {
      if (!collected.has(evidenceId)) missingRequired.push(`${chapterId}/${scenario.id}:${evidenceId}`);
    }
  }
}
check("other-chapter evidence does not leak", isolationLeaks.length === 0);
check("required evidence remains collectable on-route", missingRequired.length === 0);
check("root scenarios stay canonical with cifra", JSON.stringify(live.scenarios) === JSON.stringify(live.campaign.chapters.cifra.scenarios));

const schemaCli = run("scripts/validate-case.mjs", ["dist/game.json"]);
check("validate-case exits 0", schemaCli.status === 0);
check("validate-case SCHEMA_PASS issues=0", /SCHEMA_PASS\s+version=3\.x\s+issues=0/.test(schemaCli.stdout));

const scenarioCli = run("scripts/verify-random-scenarios.mjs");
check("random scenarios exit 0", scenarioCli.status === 0);
check("campaign remains 4 chapters and 9 scenarios", /RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9/.test(scenarioCli.stdout));

if (errors.length) {
  console.error("EVIDENCE_MIGRATION_FAIL");
  for (const error of errors) console.error("-", error);
  if (isolationLeaks.length) {
    console.error("leaks:", isolationLeaks.join("; "));
  }
  if (missingRequired.length) {
    console.error("missing:", missingRequired.join("; "));
  }
  process.exit(1);
}

console.log("EVIDENCE_MIGRATION_PASS tests=29");
