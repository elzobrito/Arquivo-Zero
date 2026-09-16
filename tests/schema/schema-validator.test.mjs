#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { validateCase, detectVersion } = require(resolve(root, "src/infrastructure/schema/schema-validator.js"));

function load(rel) {
  return JSON.parse(require("node:fs").readFileSync(resolve(root, rel), "utf8"));
}

const errors = [];
function check(label, cond) {
  if (!cond) errors.push(label);
}

const live = load("dist/game.json");
const liveResult = validateCase(live);
check("game.json version 2.x", detectVersion(live) === "2.x");
check("game.json WARN", liveResult.status === "WARN");
check("game.json schemaVersion warning", liveResult.issues.some((i) => i.path === "schemaVersion" && i.severity === "warning"));
check("game.json not FAIL", liveResult.status !== "FAIL");

const min = load("tests/fixtures/campaign-contract-min.json");
const minResult = validateCase(min);
check(`campaign-min status ${minResult.status}`, minResult.status === "PASS" || minResult.status === "WARN");
if (minResult.status === "FAIL") {
  errors.push("campaign-min FAIL: " + minResult.issues.map((i) => i.message).join("; "));
}

const valid = load("tests/fixtures/schema-3.0-valid.json");
const validResult = validateCase(valid);
check(`schema-3.0-valid ${validResult.status}`, validResult.status === "PASS");
if (validResult.status !== "PASS") {
  errors.push("valid issues: " + validResult.issues.map((i) => i.path + " " + i.message).join("; "));
}

const invalid = load("tests/fixtures/schema-3.0-invalid.json");
const invalidResult = validateCase(invalid);
check("schema-3.0-invalid FAIL", invalidResult.status === "FAIL");
check("invalid mentions metadata.id", invalidResult.issues.some((i) => i.path === "metadata.id"));

const broken = JSON.parse(JSON.stringify(valid));
broken.culprit = "ghost";
const brokenResult = validateCase(broken);
check("broken culprit FAIL", brokenResult.status === "FAIL");
check("broken path culprit", brokenResult.issues.some((i) => i.path === "culprit"));

const dup = JSON.parse(JSON.stringify(valid));
dup.suspects.push({ ...dup.suspects[0] });
const dupResult = validateCase(dup);
check("duplicate id FAIL", dupResult.status === "FAIL");
check("duplicate message", dupResult.issues.some((i) => /duplicado/.test(i.message)));

const insolvent = JSON.parse(JSON.stringify(valid));
insolvent.scenarios[0].route = ["missing-city"];
const insolventResult = validateCase(insolvent);
check("missing city FAIL", insolventResult.status === "FAIL");

const budget = JSON.parse(JSON.stringify(valid));
budget.locations.push({
  id: "beta",
  name: "Beta",
  actions: [{ id: "beta_arrest", arrest: true, cost: 1 }],
});
budget.travel = { alpha: { beta: 99 }, beta: { alpha: 99 } };
budget.navigation = { alpha: ["beta"], beta: ["alpha"] };
budget.scenarios[0].route = ["alpha", "beta"];
budget.scenarios[0].navigation = { alpha: ["beta"], beta: ["alpha"] };
budget.metadata.total_hours = 2;
const budgetResult = validateCase(budget);
check("budget FAIL", budgetResult.status === "FAIL");
check("budget message", budgetResult.issues.some((i) => /excede o prazo/.test(i.message)));

const before = JSON.stringify(live);
validateCase(live);
check("does not mutate", JSON.stringify(live) === before);

if (errors.length) {
  console.error("SCHEMA_VALIDATOR_FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("SCHEMA_VALIDATOR_PASS");
