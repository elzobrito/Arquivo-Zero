#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const { calculateStrength } = require(resolve(candidateRoot, "src/domain/hypotheses/evidence-strength.js"));
const { canSupportArrest } = require(resolve(candidateRoot, "src/domain/evidence/evidence-policy.js"));
const { validateArrest } = require(resolve(candidateRoot, "src/domain/arrest/arrest-validator.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/evidence-strength.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));
const esmValidator = await import(pathToFileURL(resolve(candidateRoot, "dist/modules/arrest-validator.js")));

let tests = 0;
function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}

const policy = { canSupportArrest };

function hyp(overrides) {
  return Object.assign({
    id: "HYP-0001",
    type: "authorship",
    statement: "Cifra pode ter praticado o fato.",
    supports: ["E01"],
    contradictions: [],
    confidence: "low",
    status: "supported",
  }, overrides);
}

function record(id, overrides) {
  return Object.assign({ id: id, admissibility: "admissible", integrity: "verified", quality: 0.8 }, overrides);
}

check("CJS export exists", typeof calculateStrength === "function");
check("ESM export exists", typeof esm.calculateStrength === "function");
check("ESM module has no import statements", !/^\s*import\b/m.test(esmSource) && !/\bfrom\s+["']/m.test(esmSource));

const missing = calculateStrength(undefined, [record("E01")], policy);
check("missing hypotheses → score 0", missing.score === 0 && missing.reasons.includes("no_hypothesis"));

const emptyHyps = calculateStrength([], [record("E01")], policy);
check("empty hypotheses → score 0", emptyHyps.score === 0 && emptyHyps.reasons.includes("no_hypothesis"));

const emptyEvidence = calculateStrength([hyp()], [], policy);
check("empty discovered → score 0", emptyEvidence.score === 0 && emptyEvidence.reasons.includes("no_evidence"));
check("undiscovered support is ignored", emptyEvidence.supporting.length === 0 && emptyEvidence.reasons.includes("evidence_not_discovered"));

const withoutSupports = calculateStrength([hyp({ supports: [] })], [record("E01")], policy);
check("hypothesis without supports → score 0", withoutSupports.score === 0 && withoutSupports.reasons.includes("hypothesis_without_evidence"));

const inadmissible = calculateStrength(
  [hyp()],
  [record("E01", { admissibility: "inadmissible" })],
  policy,
);
check("inadmissible evidence does not raise score", inadmissible.score === 0 && inadmissible.supporting.length === 0);
check("inadmissible id is listed and never supporting", inadmissible.inadmissible.join() === "E01" && !inadmissible.supporting.includes("E01"));
check("inadmissible reason is stable", inadmissible.reasons.includes("evidence_inadmissible"));

const compromised = calculateStrength(
  [hyp()],
  [record("E01", { integrity: "compromised" })],
  policy,
);
check("compromised evidence does not raise score", compromised.score === 0 && compromised.inadmissible.join() === "E01");

const single = calculateStrength([hyp()], [record("E01")], policy);
const duplicatedSupports = calculateStrength([hyp({ supports: ["E01", "E01"] })], [record("E01")], policy);
const twoHypsSameId = calculateStrength(
  [hyp(), hyp({ id: "HYP-0002", type: "method", status: "active" })],
  [record("E01")],
  policy,
);
check("redundant duplicate supports do not inflate score", duplicatedSupports.score === single.score && duplicatedSupports.supporting.join() === "E01");
check("same evidence on two hypotheses counts once", twoHypsSameId.score === single.score && twoHypsSameId.supporting.join() === "E01");
check("redundancy is explained", duplicatedSupports.reasons.includes("evidence_redundant") && twoHypsSameId.reasons.includes("evidence_redundant"));

const refuted = calculateStrength(
  [hyp({ status: "refuted" })],
  [record("E01")],
  policy,
);
check("refuted hypothesis does not contribute supports", refuted.score === 0 && refuted.supporting.length === 0 && refuted.reasons.includes("hypothesis_refuted"));

const refutedWithOpen = calculateStrength(
  [
    hyp({ status: "refuted", supports: ["E01"] }),
    hyp({ id: "HYP-0002", status: "supported", supports: ["E03"] }),
  ],
  [record("E01"), record("E03")],
  policy,
);
check("refuted supports stay out when another hyp is open", refutedWithOpen.supporting.join() === "E03" && refutedWithOpen.score === 1);

const authored = calculateStrength([hyp()], [record("E01")], policy);
check("authorship supported with admissible evidence → score > 0", authored.score > 0 && authored.reasons.includes("authorship_supported"));
check("single admissible support without contradiction scores 1", authored.score === 1 && authored.supporting.join() === "E01");

const mixed = calculateStrength(
  [hyp({ supports: ["E01"], contradictions: ["E06"] })],
  [record("E01"), record("E06")],
  policy,
);
check("score is supports/(supports+contradictions)", mixed.score === 0.5 && mixed.contradicting.join() === "E06");

const low = calculateStrength([hyp({ confidence: "low" })], [record("E01")], policy);
const high = calculateStrength([hyp({ confidence: "high" })], [record("E01")], policy);
check("confidence is not used in the score", low.score === high.score && low.score === 1);

const first = calculateStrength(
  [hyp({ supports: ["E03", "E01"], contradictions: ["E06"] })],
  [record("E06"), record("E01"), record("E03")],
  policy,
);
const second = calculateStrength(
  [hyp({ supports: ["E01", "E03"], contradictions: ["E06"] })],
  [record("E03"), record("E06"), record("E01")],
  policy,
);
check("deterministic", JSON.stringify(first) === JSON.stringify(second));
check("output ids are sorted uniquely", first.supporting.join() === "E01,E03" && first.contradicting.join() === "E06");

const hyps2 = [hyp({ supports: ["E01"], contradictions: [] })];
const discovered2 = [record("E01")];
const snapHyps = JSON.stringify(hyps2);
const snapDisc = JSON.stringify(discovered2);
const snapPol = JSON.stringify(policy);
const frozenResult = calculateStrength(hyps2, discovered2, policy);
check("does not mutate input objects", JSON.stringify(hyps2) === snapHyps && JSON.stringify(discovered2) === snapDisc && JSON.stringify(policy) === snapPol);
hyps2[0].supports.push("E99");
check("result arrays are independent of later input mutation", frozenResult.supporting.join() === "E01");

const fromStrings = calculateStrength([hyp()], ["E01"], policy);
check("string discovered ids wrap as records", fromStrings.score === 1 && fromStrings.supporting.join() === "E01");

const unknown = calculateStrength([hyp()], [{ id: "E01", admissibility: "unknown", integrity: "unverified" }]);
check("default policy gives benefit of the doubt", unknown.score === 1);

const reasonsOrder = calculateStrength([], [], policy);
check("reasons are unique and sorted", reasonsOrder.reasons.join() === "no_evidence,no_hypothesis");

const esmAuthored = esm.calculateStrength([hyp()], [record("E01")], policy);
check("ESM/CJS parity", JSON.stringify(esmAuthored) === JSON.stringify(authored));

const game = {
  culprit: "cifra",
  evidence: [record("E01"), record("E03")],
  arrest_requirements: { minimum_evidence: 2, required_evidence: ["E01", "E03"] },
};
const wrong = validateArrest({ warrant: true, warrantSuspect: "byte", evidence: ["E01", "E03"] }, game);
check("wrong_warrant still DENIED", wrong.decision === "DENIED" && wrong.reasons.join() === "wrong_warrant");
check("wrong_warrant keeps evidenceScore 0", wrong.evidenceScore === 0 && wrong.suspect === "byte");

const insufficient = validateArrest({ warrant: true, warrantSuspect: "cifra", evidence: [] }, game);
check("insufficient_evidence still DENIED", insufficient.decision === "DENIED" && insufficient.reasons.join() === "insufficient_evidence");
check("insufficient_evidence keeps evidenceScore 0", insufficient.evidenceScore === 0);

const approvedNoHyp = validateArrest({ warrant: true, warrantSuspect: "cifra", evidence: ["E01", "E03"] }, game);
check("APPROVED without hypotheses still APPROVED", approvedNoHyp.decision === "APPROVED" && approvedNoHyp.reasons.join() === "warrant_minimum_and_essentials");
check("APPROVED without hypotheses has hypothesisScore===0", approvedNoHyp.hypothesisScore === 0);
check("APPROVED without hypotheses keeps evidenceScore 1", approvedNoHyp.evidenceScore === 1 && approvedNoHyp.procedureScore === 1);

const approvedWithHyp = validateArrest({
  warrant: true,
  warrantSuspect: "cifra",
  evidence: ["E01", "E03"],
  hypotheses: [hyp({ supports: ["E01"] })],
}, game);
check("APPROVED with supported authorship hyp → hypothesisScore > 0", approvedWithHyp.decision === "APPROVED" && approvedWithHyp.hypothesisScore > 0);
check("APPROVED with hyp does not change 2.x reasons", approvedWithHyp.reasons.join() === "warrant_minimum_and_essentials");

const warrantFallback = validateArrest({ warrant: "cifra", evidence: ["E01", "E03"] }, game);
check("string warrant falls back as suspect id", warrantFallback.decision === "APPROVED" && warrantFallback.suspect === "cifra");

const booleanWarrant = validateArrest({ warrant: true, evidence: ["E01", "E03"] }, game);
check("boolean warrant is not a suspect id", booleanWarrant.decision === "DENIED" && booleanWarrant.reasons.join() === "wrong_warrant" && booleanWarrant.suspect === null);

const esmApproved = esmValidator.validateArrest({
  warrant: true,
  warrantSuspect: "cifra",
  evidence: ["E01", "E03"],
  hypotheses: [hyp({ supports: ["E01"] })],
}, game);
check("ESM arrest-validator hypothesisScore > 0", esmApproved.decision === "APPROVED" && esmApproved.hypothesisScore > 0);
check("ESM arrest-validator still APPROVED without hypotheses", esmValidator.validateArrest({ warrant: true, warrantSuspect: "cifra", evidence: ["E01", "E03"] }, game).hypothesisScore === 0);

console.log("EVIDENCE_STRENGTH_PASS tests=" + tests);
