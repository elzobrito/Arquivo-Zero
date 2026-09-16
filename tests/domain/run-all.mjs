#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { isUnaffordable, debitHours } = require(resolve(root, "src/domain/time/time-service.js"));
const { canTravel, applyTravel } = require(resolve(root, "src/domain/travel/travel-service.js"));
const { catalogEvidence, getDiscovered, isEssential } = require(resolve(root, "src/domain/evidence/evidence-service.js"));
const { filterSuspects, issueWarrant } = require(resolve(root, "src/domain/dossier/dossier-service.js"));
const { validateArrest } = require(resolve(root, "src/domain/arrest/arrest-validator.js"));

const errors = [];
function check(label, cond) {
  if (!cond) errors.push(label);
}

// INV-1 hours never negative
check("INV-1 unaffordable > saldo", isUnaffordable(3, 4, false) === true);
check("INV-1 debit defeat", debitHours({ hours: 3 }, 4, false).defeat === true);
check("INV-1 debit hours 0", debitHours({ hours: 3 }, 4, false).hours === 0);
check("INV-1 ok remaining", debitHours({ hours: 10 }, 4, false).hours === 6);

const game = {
  culprit: "cifra",
  navigation: { a: ["b"], b: ["a"] },
  travel: { a: { b: 5 }, b: { a: 5 } },
  suspects: [
    { id: "cifra", name: "Cifra", specialty: "Social" },
    { id: "byte", name: "Byte", specialty: "Redes" },
  ],
  evidence: [{ id: "E01" }, { id: "E03" }],
  arrest_requirements: { minimum_evidence: 2, required_evidence: ["E01", "E03"] },
};
const state = { location: "a", hours: 10, visited: ["a"], route: ["a"], evidence: [], warrant: false, warrantSuspect: null };

// INV-2 graph
check("INV-2 block off-graph", canTravel(state, game, "z", game.navigation).ok === false);
check("INV-2 allow edge", canTravel(state, game, "b", game.navigation).ok === true);
const moved = applyTravel(state, game, "b", game.navigation);
check("INV-2 apply location", moved.ok && moved.newState.location === "b");

// INV-3 discovered only
const cataloged = catalogEvidence(state, "E01", game);
check("INV-3 catalog once", cataloged.ok && !cataloged.duplicate && cataloged.evidence.length === 1);
check("INV-3 idempotent", catalogEvidence({ evidence: cataloged.evidence }, "E01", game).duplicate === true);
check("INV-3 getDiscovered", getDiscovered({ evidence: cataloged.evidence }, game).map((e) => e.id).join() === "E01");
check("INV-3 essential chapter", isEssential("E01", game) === true && isEssential("E03", game) === true);

// INV-4 warrant unique
const none = filterSuspects(game, []);
check("INV-4 empty chosen all", none.length === 2);
const one = filterSuspects(game, [["name", "Cifra"]]);
check("INV-4 unique", one.length === 1 && one[0].id === "cifra");
const issued = issueWarrant(state, "cifra");
check("INV-4 warrant flag", issued.warrant === true && issued.warrantSuspect === "cifra");

// INV-5 arrest = warrant + min + essentials — NOT suspect-only
const onlyName = { ...issued, evidence: [] };
check("INV-5 correct suspect insufficient DENIED", validateArrest(onlyName, game).decision === "DENIED");
check("INV-5 reason insufficient", validateArrest(onlyName, game).reasons.includes("insufficient_evidence"));
const wrong = { warrant: true, warrantSuspect: "byte", evidence: ["E01", "E03"] };
check("INV-5 wrong warrant", validateArrest(wrong, game).reasons.includes("wrong_warrant"));
const ok = { warrant: true, warrantSuspect: "cifra", evidence: ["E01", "E03"] };
check("INV-5 approved with essentials", validateArrest(ok, game).decision === "APPROVED");
check("INV-5 not identify-equals-prove", validateArrest(onlyName, game).decision !== "APPROVED");

if (errors.length) {
  console.error("DOMAIN_FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("DOMAIN_PASS invariants=5");
