#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

function load(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function runValidator(path) {
  return spawnSync(process.execPath, ["scripts/validate-case.mjs", path], {
    cwd: root,
    encoding: "utf8",
  });
}

const errors = [];
function check(label, condition) {
  if (!condition) errors.push(label);
}

const schema = load("docs/architecture/schemas/case-campaign-schema.json");
const live = load("dist/game.json");
const ajv = new Ajv({ allErrors: true, strict: false });

check("Draft-07 declared", schema.$schema === "http://json-schema.org/draft-07/schema#");
check("Draft-07 meta-schema valid", ajv.validateSchema(schema) === true);
check("root requires schemaVersion", schema.required.includes("schemaVersion"));
check("schemaVersion is exactly 3.0", schema.properties.schemaVersion.const === "3.0");
check("published case declares 3.0", live.schemaVersion === "3.0");

const validateDocument = ajv.compile(schema);
check("complete published document valid", validateDocument(live) === true);
check("complete validation has zero errors", validateDocument.errors === null);
check("campaign fragment is not accepted as complete document", validateDocument(live.campaign) === false);

const liveCli = runValidator("dist/game.json");
check("published CLI exits zero", liveCli.status === 0);
check("published CLI returns SCHEMA_PASS", /SCHEMA_PASS\s+version=3\.x\s+issues=0/.test(liveCli.stdout));

const legacyCli = runValidator("tests/fixtures/campaign-contract-min.json");
check("2.x fixture exits zero", legacyCli.status === 0);
check("2.x fixture remains WARN", /SCHEMA_WARN\s+version=2\.x/.test(legacyCli.stdout) && /schemaVersion/.test(legacyCli.stdout));

const invalidCli = runValidator("tests/fixtures/schema-3.0-invalid.json");
check("invalid 3.0 fixture exits one", invalidCli.status === 1);
check("invalid 3.0 fixture returns actionable FAIL", /SCHEMA_FAIL/.test(invalidCli.stdout) && /metadata\.id/.test(invalidCli.stdout));

if (errors.length) {
  console.error("CASE_CAMPAIGN_SCHEMA_FAIL");
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("CASE_CAMPAIGN_SCHEMA_PASS tests=14");
