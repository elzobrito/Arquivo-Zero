#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { buildConstraint } = require(resolve(root, "src/domain/constraints/evidence-constraint-adapter.js"));
const engine = require(resolve(root, "src/domain/constraints/constraint-engine.js"));

const errors = [];
let tests = 0;
function check(label, condition) {
  tests += 1;
  if (!condition) errors.push(label);
}

const game = {
  evidence: [
    {
      id: "E01",
      tag: "registro",
      source: "terminal",
      admissibility: "admissible",
      integrity: "verified",
      quality: 0.9,
    },
    {
      id: "E02",
      tag: "relato",
      source: null,
      admissibility: "inadmissible",
      integrity: "unverified",
      quality: null,
    },
  ],
};

const tagConstraint = buildConstraint("E01", "tag", "eq", "registro");
check("exports buildConstraint", typeof buildConstraint === "function");
check("constraint is ATOM", tagConstraint.op === "ATOM");
check("constraint carries field", tagConstraint.path === "tag");
check("constraint carries operator", tagConstraint.operator === "eq");
check("constraint carries value", tagConstraint.value === "registro");
check("constraint references evidenceId", tagConstraint.evidenceId === "E01");
check("constraint has evaluator", typeof tagConstraint.evaluate === "function");

const direct = engine.evaluate(tagConstraint, { record: game.evidence[0] });
check("constraint is compatible with engine", direct.result === "MATCH");

const discovered = tagConstraint.evaluate({ state: { evidence: ["E01"] }, game });
check("discovered evidence matches", discovered.result === "MATCH");
check("discovered explanation references evidence", /evidenceId=E01/.test(discovered.explanation));
check("admissible explanation supports arrest", /canSupportArrest=true/.test(discovered.explanation));

const noMatch = buildConstraint("E01", "tag", "eq", "outro").evaluate({
  state: { evidence: ["E01"] },
  game,
});
check("discovered mismatch is NO_MATCH", noMatch.result === "NO_MATCH");

const undiscovered = tagConstraint.evaluate({ state: { evidence: [] }, game });
check("undiscovered is UNKNOWN", undiscovered.result === "UNKNOWN");
check("undiscovered is never NO_MATCH", undiscovered.result !== "NO_MATCH");
check("undiscovered explanation is actionable", /não descoberta/.test(undiscovered.explanation));

const inadmissible = buildConstraint("E02", "tag", "eq", "relato").evaluate({
  state: { evidence: ["E02"] },
  game,
});
check("inadmissible can still match constraint", inadmissible.result === "MATCH");
check("inadmissible records arrest block", /canSupportArrest=false/.test(inadmissible.explanation));
check("inadmissible remains identified", /evidenceId=E02/.test(inadmissible.explanation));

const missingField = buildConstraint("E01", "relations.suspectIds", "contains", "S01").evaluate({
  state: { evidence: ["E01"] },
  game,
});
check("missing field is UNKNOWN", missingField.result === "UNKNOWN");
check("missing field is never NO_MATCH", missingField.result !== "NO_MATCH");

const missingRecord = buildConstraint("E99", "tag", "eq", "registro").evaluate({
  state: { evidence: ["E99"] },
  game,
});
check("missing catalog record is UNKNOWN", missingRecord.result === "UNKNOWN");
check("missing record explanation references id", /evidenceId=E99/.test(missingRecord.explanation));

const explicitRecord = tagConstraint.evaluate({ discovered: true, record: game.evidence[0] });
check("explicit discovered record supported", explicitRecord.result === "MATCH");

const explicitHidden = tagConstraint.evaluate({ discovered: false, record: game.evidence[0] });
check("explicit hidden record remains UNKNOWN", explicitHidden.result === "UNKNOWN");

const before = JSON.stringify(game);
tagConstraint.evaluate({ state: { evidence: ["E01"] }, game });
check("evaluation does not mutate game", JSON.stringify(game) === before);

const esm = await import(pathToFileURL(resolve(root, "dist/modules/evidence-constraint-adapter.js")));
const esmConstraint = esm.buildConstraint("E02", "tag", "eq", "relato");
const esmResult = esmConstraint.evaluate({ state: { evidence: ["E02"] }, game });
check("ESM exports buildConstraint", typeof esm.buildConstraint === "function");
check("ESM mirrors result", esmResult.result === "MATCH");
check("ESM mirrors policy explanation", /canSupportArrest=false/.test(esmResult.explanation));

if (errors.length) {
  console.error("EVIDENCE_CONSTRAINT_ADAPTER_FAIL tests=" + errors.length);
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("EVIDENCE_CONSTRAINT_ADAPTER_PASS tests=" + tests);
