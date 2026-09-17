#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { filterSuspects, issueWarrant } = require(resolve(root, "src/domain/dossier/dossier-service.js"));
const published = JSON.parse(await readFile(resolve(root, "dist/game.json"), "utf8"));
const esmSource = await readFile(resolve(root, "dist/modules/dossier-service.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

let tests = 0;
function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}

const fixture = {
  metadata: { id: "caca_algoritmo_001" },
  suspects: [
    { id: "cifra", name: "Cifra", specialty: "Social", vehicle: "Onibus" },
    { id: "byte", name: "Byte", specialty: "Redes", vehicle: "Carro" },
  ],
  arrest_requirements: { minimum_evidence: 2, required_evidence: ["E01", "E03"] },
};
const twoKeys = [["name", "Cifra"], ["specialty", "Social"]];
const supportedAuthorship = [{
  type: "authorship",
  status: "supported",
  supports: ["E01"],
  subjectIds: ["cifra"],
}];

check("empty chosen returns all", filterSuspects(fixture, []).length === 2);
check("missing chosen returns all", filterSuspects(fixture).length === 2);
check("name-only chosen does not isolate", filterSuspects(fixture, [["name", "Cifra"]]).length === 0);
check("shared specialty alone does not isolate", filterSuspects(published, [["specialty", "Redes"]]).length === 0);
check("shared vehicle alone does not isolate", filterSuspects(published, [["vehicle", "Carro preto"]]).length === 0);

const byTwo = filterSuspects(fixture, twoKeys);
check("two dimensions isolate one suspect", byTwo.length === 1 && byTwo[0].id === "cifra");

const pairing = [
  { id: "byte", chosen: [["specialty", "Redes"], ["vehicle", "Carro preto"]] },
  { id: "null", chosen: [["specialty", "Redes"], ["vehicle", "Ônibus interestadual"]] },
  { id: "cifra", chosen: [["specialty", "Engenharia social"], ["vehicle", "Ônibus interestadual"]] },
  { id: "vertice", chosen: [["specialty", "Engenharia social"], ["vehicle", "Carro preto"]] },
];
for (const { id, chosen } of pairing) {
  const matches = filterSuspects(published, chosen);
  check("published pair isolates " + id, matches.length === 1 && matches[0].id === id);
}

function counts(field) {
  const tallies = {};
  for (const suspect of published.suspects) {
    const value = suspect[field];
    tallies[value] = (tallies[value] || 0) + 1;
  }
  return tallies;
}
const specialties = counts("specialty");
const vehicles = counts("vehicle");
check("every specialty shared by >=2", Object.keys(specialties).length > 0 && Object.values(specialties).every((n) => n >= 2));
check("every vehicle shared by >=2", Object.keys(vehicles).length > 0 && Object.values(vehicles).every((n) => n >= 2));
check("recommended specialty pair", specialties.Redes === 2 && specialties["Engenharia social"] === 2);
check("recommended vehicle pair", vehicles["Carro preto"] === 2 && vehicles["Ônibus interestadual"] === 2);

const snapshot = JSON.stringify(published);
filterSuspects(published, pairing[0].chosen);
issueWarrant({ evidence: [] }, "cifra", {
  game: published,
  chosen: pairing[2].chosen,
  hypotheses: [],
  discoveredEvidence: [],
});
check("does not mutate game", JSON.stringify(published) === snapshot);

const approved = issueWarrant({ location: "a" }, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: supportedAuthorship,
  discoveredEvidence: ["E01", "E03"],
});
check("approved warrant flag", approved.warrant === true && approved.warrantApproved === true && approved.warrantSuspect === "cifra");
check(
  "approved explains satisfiedDimensions",
  ["identity", "multiple_attributes", "evidence", "hypothesis"].every((dim) => approved.satisfiedDimensions.includes(dim))
    && approved.failedDimensions.length === 0,
);
check("approved does not copy caller state mutation", approved.location === "a" && approved !== fixture);

const deniedEmpty = issueWarrant({ location: "a" }, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: [],
  discoveredEvidence: ["E01", "E03"],
});
check("denied empty hypotheses", deniedEmpty.warrant === false && deniedEmpty.warrantSuspect === null && deniedEmpty.warrantApproved === false);
check("denied empty hypotheses lists hypothesis", deniedEmpty.failedDimensions.includes("hypothesis") && deniedEmpty.warrantReasons.includes("hypothesis_missing"));

const deniedActive = issueWarrant({}, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: [{ type: "authorship", status: "active", supports: ["E01"] }],
  discoveredEvidence: ["E01", "E03"],
});
check("denied without supported authorship", deniedActive.failedDimensions.includes("hypothesis") && deniedActive.warrant === false);

const deniedSupports = issueWarrant({}, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: [{ type: "authorship", status: "supported", supports: [] }],
  discoveredEvidence: ["E01", "E03"],
});
check("denied authorship without supports", deniedSupports.failedDimensions.includes("hypothesis"));

const deniedName = issueWarrant({}, "cifra", { chosen: [["name", "Cifra"]] });
check("name-only warrant denied", deniedName.warrant === false && deniedName.failedDimensions.includes("multiple_attributes") && deniedName.warrantReasons.includes("name_only"));

const deniedEvidence = issueWarrant({}, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: supportedAuthorship,
  discoveredEvidence: ["E01"],
});
check("insufficient evidence denied", deniedEvidence.failedDimensions.includes("evidence") && deniedEvidence.warrantReasons.includes("insufficient_evidence"));

const deniedIdentity = issueWarrant({}, "ghost", { game: fixture, chosen: twoKeys, hypotheses: supportedAuthorship, discoveredEvidence: ["E01", "E03"] });
check("unknown suspect denied", deniedIdentity.failedDimensions.includes("identity") && deniedIdentity.warrantReasons.includes("ambiguous_suspect"));

const legacy = issueWarrant({ warrant: false, warrantSuspect: null, hours: 10 }, "cifra");
check("legacy 2-arg still issues", legacy.warrant === true && legacy.warrantSuspect === "cifra" && legacy.warrantApproved === true && legacy.hours === 10 && legacy.failedDimensions.length === 0);

const stateHyp = issueWarrant({ hypotheses: [] }, "cifra", { game: fixture, chosen: twoKeys, discoveredEvidence: ["E01", "E03"] });
check("state.hypotheses empty fails hypothesis", stateHyp.failedDimensions.includes("hypothesis"));

const absentHyp = issueWarrant({ evidence: ["E01", "E03"] }, "cifra", { game: fixture, chosen: twoKeys, discoveredEvidence: ["E01", "E03"] });
check("absent hypotheses do not fail 2.x path", absentHyp.warrant === true && !absentHyp.failedDimensions.includes("hypothesis"));

const esmNameOnly = esm.filterSuspects(published, [["name", "Cifra"]]);
const cjsNameOnly = filterSuspects(published, [["name", "Cifra"]]);
check("ESM filterSuspects name-only parity", esmNameOnly.length === 0 && JSON.stringify(esmNameOnly) === JSON.stringify(cjsNameOnly));
const esmPair = esm.filterSuspects(published, pairing[2].chosen);
const cjsPair = filterSuspects(published, pairing[2].chosen);
check("ESM filterSuspects pair parity", esmPair.length === 1 && esmPair[0].id === "cifra" && esmPair[0].id === cjsPair[0].id);

const esmDenied = esm.issueWarrant({}, "cifra", { game: fixture, chosen: twoKeys, hypotheses: [], discoveredEvidence: ["E01", "E03"] });
const cjsDenied = issueWarrant({}, "cifra", { game: fixture, chosen: twoKeys, hypotheses: [], discoveredEvidence: ["E01", "E03"] });
check("ESM issueWarrant denied parity", esmDenied.warrant === false && JSON.stringify(esmDenied.failedDimensions) === JSON.stringify(cjsDenied.failedDimensions));
const esmApproved = esm.issueWarrant({}, "cifra", {
  game: fixture,
  chosen: twoKeys,
  hypotheses: supportedAuthorship,
  discoveredEvidence: ["E01", "E03"],
});
check("ESM issueWarrant approved parity", esmApproved.warrant === true && esmApproved.satisfiedDimensions.includes("hypothesis"));

const frozenGame = Object.freeze({
  suspects: Object.freeze(published.suspects.map((item) => Object.freeze({ ...item }))),
});
assert.doesNotThrow(() => filterSuspects(frozenGame, pairing[0].chosen));
check("frozen game does not throw", filterSuspects(frozenGame, pairing[0].chosen)[0].id === "byte");

console.log("DOSSIER_SERVICE_PASS tests=" + tests);
