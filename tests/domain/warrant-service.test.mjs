#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const service = require(resolve(candidateRoot, "src/domain/validation/warrant-service.js"));
const game = JSON.parse(await readFile(resolve(workspace, "dist/game.json"), "utf8"));
const esm = await import(pathToFileURL(resolve(candidateRoot, "dist/modules/warrant-service.js")).href);
const appJs = await readFile(resolve(candidateRoot, "dist/app.js"), "utf8");

let tests = 0;
const failures = [];
function check(label, condition) {
  tests += 1;
  if (!condition) failures.push(label);
}

const uniquePair = { specialty: "Engenharia social", vehicle: "Ônibus interestadual" };
const uniquePairEntries = [["specialty", "Engenharia social"], ["vehicle", "Ônibus interestadual"]];
const nameOnly = { name: "Cifra" };
const sharedSpecialty = { specialty: "Redes" };
const twoCompatible = { specialty: "Redes" };

const emptyState = { evidence: [], hypotheses: [] };
const deniedName = service.requestWarrant(emptyState, game, nameOnly);
check("INV-WS-001 name-only denied", deniedName.approved === false && deniedName.suspectId === null);
check("INV-WS-001 reason unique", deniedName.reasons.includes("sem_candidato_único"));

const approved = service.requestWarrant(emptyState, game, uniquePair);
check("INV-WS-002 object chosen approved", approved.approved === true && approved.suspectId === "cifra");
const approvedEntries = service.requestWarrant(emptyState, game, uniquePairEntries);
check("INV-WS-002 entries chosen approved", approvedEntries.approved === true && approvedEntries.suspectId === "cifra");
check("INV-WS-002 reasons", approved.reasons.includes("suspeito_único") && approved.reasons.includes("prova_suficiente"));

const ambiguous = service.requestWarrant(emptyState, game, sharedSpecialty);
check("INV-WS-003 two compatible denied", ambiguous.approved === false && ambiguous.reasons.includes("sem_candidato_único"));
check("INV-WS-003 two compatible no id", ambiguous.suspectId === null);

const strictGame = JSON.parse(JSON.stringify(game));
strictGame.arrest_requirements = Object.assign({}, strictGame.arrest_requirements || {}, { minWarrantStrength: 0.5 });
const weak = service.requestWarrant(emptyState, strictGame, uniquePair);
check("INV-WS-004 insufficient score denied", weak.approved === false && weak.reasons.includes("força_probatória_insuficiente"));
check("INV-WS-004 missing dimension", weak.missingDimensions.includes("probative_force"));

function leaksCulprit(result) {
  const blob = JSON.stringify(result);
  return /culpado/i.test(blob) || blob.includes(game.culprit) && result.approved === false && blob.includes('"suspectId":"' + game.culprit + '"');
}
check("INV-WS-005 name-only does not reveal culprit id as approved target", deniedName.suspectId === null && !/culpado/i.test(JSON.stringify(deniedName)));
check("INV-WS-005 ambiguous does not list culprit", !JSON.stringify(ambiguous).includes("culpado") && ambiguous.suspectId === null);
check("INV-WS-005 weak score does not approve culprit", weak.approved === false && weak.suspectId === null);

check("INV-WS-006 app.js imports warrant-service", appJs.includes("./modules/warrant-service.js"));
check("INV-WS-006 app.js submitDossier calls requestWarrant", /function submitDossier\(e\)[\s\S]*requestWarrant\(state,game,chosen\)/.test(appJs));
check("INV-WS-006 app.js no longer issues via issueWarrant in submitDossier", !/function submitDossier\(e\)[\s\S]*issueWarrant\(state,matches/.test(appJs));

check("denied missing unique dimension", deniedName.missingDimensions.includes("unique_suspect"));
check("empty chosen denied", service.requestWarrant(emptyState, game, {}).approved === false);
check("does not mutate game", JSON.stringify(game).includes('"culprit":"cifra"'));
check("ESM export", typeof esm.requestWarrant === "function");
check("ESM name-only parity", esm.requestWarrant(emptyState, game, nameOnly).approved === false);
check("ESM pair parity", esm.requestWarrant(emptyState, game, uniquePair).suspectId === "cifra");
check("approved is not victory flag", approved.approved === true && approved.decision !== "APPROVED");
check("twoCompatible alias", service.requestWarrant(emptyState, game, twoCompatible).approved === false);

const snapshot = JSON.stringify(emptyState);
service.requestWarrant(emptyState, game, uniquePair);
check("does not mutate state", JSON.stringify(emptyState) === snapshot);

if (failures.length) {
  console.error("WARRANT_SERVICE_FAIL tests=" + failures.length);
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}
console.log("WARRANT_SERVICE_PASS tests=" + tests);
assert.ok(tests >= 7);
