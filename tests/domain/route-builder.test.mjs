#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const builder = require(resolve(candidateRoot, "src/domain/reports/route-builder.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/route-builder.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

let tests = 0;
function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}

function routeHyp(id, extra) {
  return Object.assign({
    id: id,
    type: "route",
    statement: "",
    supports: [],
    contradictions: [],
    confidence: "low",
    status: "active"
  }, extra);
}

check("exports buildRoute", typeof builder.buildRoute === "function");

const empty = builder.buildRoute([], [], []);
check("empty input → []", Array.isArray(empty) && empty.length === 0);

const emptyMissing = builder.buildRoute();
check("missing arguments → [] without throw", Array.isArray(emptyMissing) && emptyMissing.length === 0);

const visited = builder.buildRoute(["sao_paulo", "recife"], [], []);
check(
  "visited cities → confirmed true",
  visited.length === 2 &&
    visited[0].cityId === "sao_paulo" && visited[0].confirmed === true && visited[0].hypothesisId === null &&
    visited[1].cityId === "recife" && visited[1].confirmed === true && visited[1].hypothesisId === null
);
check("visited evidenceIds default to []", Array.isArray(visited[0].evidenceIds) && visited[0].evidenceIds.length === 0);

const inferredOnly = builder.buildRoute([], [routeHyp("HYP-0001", { subjectIds: ["manaus"], statement: "passagem por manaus" })], []);
check(
  "inferred-only city → confirmed false, hypothesisId filled",
  inferredOnly.length === 1 &&
    inferredOnly[0].cityId === "manaus" &&
    inferredOnly[0].confirmed === false &&
    inferredOnly[0].hypothesisId === "HYP-0001"
);

const mixed = builder.buildRoute(
  ["sao_paulo", "recife"],
  [routeHyp("HYP-0002", { route: ["recife", "brasilia"], statement: "recife then brasilia" })],
  []
);
check(
  "mixed: visited confirmed, extra inferred not confirmed",
  mixed.length === 3 &&
    mixed[0].cityId === "sao_paulo" && mixed[0].confirmed === true &&
    mixed[1].cityId === "recife" && mixed[1].confirmed === true &&
    mixed[2].cityId === "brasilia" && mixed[2].confirmed === false && mixed[2].hypothesisId === "HYP-0002"
);
check("visit order preserved before inferred", mixed[0].cityId === "sao_paulo" && mixed[1].cityId === "recife");
check("inferred appended after confirmed", mixed[2].cityId === "brasilia");
check("duplicate inferred of a visited city is skipped", mixed.filter((item) => item.cityId === "recife").length === 1);

const unknown = builder.buildRoute(
  ["sao_paulo", "rio_de_janeiro", "uf-sp", "curitiba"],
  [routeHyp("HYP-UF", { subjectIds: ["salvador", "SP"], locationId: "uf-am" })],
  []
);
check(
  "unknown city outside the five is omitted",
  unknown.length === 1 && unknown[0].cityId === "sao_paulo" &&
    !unknown.some((item) => item.cityId === "rio_de_janeiro" || item.cityId === "uf-sp" || item.cityId === "salvador")
);

const noProof = builder.buildRoute(
  [],
  [routeHyp("HYP-0003", { subjectIds: ["porto_alegre"], supports: [] })],
  []
);
check(
  "no evidence on inferred stretch still confirmed:false (not fact)",
  noProof.length === 1 && noProof[0].cityId === "porto_alegre" && noProof[0].confirmed === false && noProof[0].evidenceIds.length === 0
);

const inferredWithEvidence = builder.buildRoute(
  [],
  [routeHyp("HYP-0004", { locationId: "manaus", supports: ["E11"] })],
  [{ id: "E11", locationId: "manaus", text: "embarque em manaus" }]
);
check(
  "inferred stretch with evidence remains unconfirmed",
  inferredWithEvidence.length === 1 &&
    inferredWithEvidence[0].confirmed === false &&
    inferredWithEvidence[0].evidenceIds.length === 1 &&
    inferredWithEvidence[0].evidenceIds[0] === "E11"
);

const supportsPresent = builder.buildRoute(
  [],
  [routeHyp("HYP-0005", { subjectIds: ["brasilia"], supports: ["E01", "E99"] })],
  ["E01", { id: "E02", locationId: "recife" }]
);
check(
  "inferred evidenceIds use supports present in evidence",
  supportsPresent.length === 1 &&
    supportsPresent[0].cityId === "brasilia" &&
    supportsPresent[0].evidenceIds.length === 1 &&
    supportsPresent[0].evidenceIds[0] === "E01"
);

const located = builder.buildRoute(
  ["recife"],
  [],
  [
    { id: "E04", relations: { locationId: "recife" }, text: "reserva" },
    { id: "E05", locationId: "recife", text: "cais" },
    { id: "E06", locationId: "sao_paulo", text: "outro" }
  ]
);
check(
  "visited evidenceIds from relations.locationId and locationId",
  located.length === 1 &&
    located[0].cityId === "recife" &&
    located[0].confirmed === true &&
    located[0].evidenceIds.join(",") === "E04,E05"
);

const namedVisit = builder.buildRoute(
  ["sao_paulo"],
  [routeHyp("HYP-0006", { statement: "origem em sao_paulo" })],
  []
);
check(
  "visited city named by hypothesis keeps confirmed true and fills hypothesisId",
  namedVisit.length === 1 && namedVisit[0].confirmed === true && namedVisit[0].hypothesisId === "HYP-0006"
);

const statementOrder = builder.buildRoute(
  [],
  [routeHyp("HYP-0007", { statement: "de recife a porto_alegre via manaus" })],
  []
);
check(
  "statement city tokens infer in appearance order",
  statementOrder.map((item) => item.cityId).join(",") === "recife,porto_alegre,manaus" &&
    statementOrder.every((item) => item.confirmed === false && item.hypothesisId === "HYP-0007")
);

const inputVisits = ["sao_paulo", "recife"];
const inputHyps = [routeHyp("HYP-0008", { subjectIds: ["manaus"], supports: ["E01"] })];
const inputEvidence = [{ id: "E01", locationId: "manaus", text: "pista" }];
const visitSnap = JSON.stringify(inputVisits);
const hypSnap = JSON.stringify(inputHyps);
const evSnap = JSON.stringify(inputEvidence);
const built = builder.buildRoute(inputVisits, inputHyps, inputEvidence);
const manausStretch = built.find((item) => item.cityId === "manaus");
built.push({ cityId: "MUT" });
manausStretch.evidenceIds.push("MUT");
check("does not mutate input", JSON.stringify(inputVisits) === visitSnap && JSON.stringify(inputHyps) === hypSnap && JSON.stringify(inputEvidence) === evSnap);
check("cloned evidenceIds do not alias input supports", inputHyps[0].supports.length === 1 && inputHyps[0].supports[0] === "E01");

const frozenVisits = Object.freeze(["brasilia", "porto_alegre"]);
const frozenHyps = Object.freeze([Object.freeze(routeHyp("HYP-0009", { route: Object.freeze(["manaus"]) }))]);
const frozenEvidence = Object.freeze([Object.freeze({ id: "E08", locationId: "brasilia", text: "pista" })]);
const frozenOut = builder.buildRoute(frozenVisits, frozenHyps, frozenEvidence);
check(
  "does not mutate frozen input",
  frozenOut.length === 3 &&
    frozenOut[0].cityId === "brasilia" && frozenOut[0].confirmed === true &&
    frozenOut[1].cityId === "porto_alegre" && frozenOut[1].confirmed === true &&
    frozenOut[2].cityId === "manaus" && frozenOut[2].confirmed === false &&
    frozenVisits.length === 2 && frozenHyps[0].route.length === 1
);

const first = builder.buildRoute(["recife", "sao_paulo"], [routeHyp("HYP-0010", { locationId: "manaus" })], [{ id: "E04", locationId: "recife" }]);
const second = builder.buildRoute(["recife", "sao_paulo"], [routeHyp("HYP-0010", { locationId: "manaus" })], [{ id: "E04", locationId: "recife" }]);
check("deterministic", JSON.stringify(first) === JSON.stringify(second));

const dupVisit = builder.buildRoute(["sao_paulo", "recife", "sao_paulo"], [], []);
check("duplicate visit is not repeated", dupVisit.map((item) => item.cityId).join(",") === "sao_paulo,recife");

check("ESM exports buildRoute", typeof esm.buildRoute === "function");
check("ESM has no import statements", !/\bimport\s/.test(esmSource));
check("ESM parity empty", esm.buildRoute([], [], []).length === 0);
check(
  "ESM parity mixed route",
  JSON.stringify(esm.buildRoute(
    ["sao_paulo", "recife"],
    [routeHyp("HYP-0002", { route: ["recife", "brasilia"], statement: "recife then brasilia" })],
    []
  )) === JSON.stringify(mixed)
);
check(
  "ESM parity inferred-only",
  JSON.stringify(esm.buildRoute([], [routeHyp("HYP-0001", { subjectIds: ["manaus"], statement: "passagem por manaus" })], [])) ===
    JSON.stringify(inferredOnly)
);

const hypOrder = builder.buildRoute(
  [],
  [
    routeHyp("HYP-A", { subjectIds: ["manaus"] }),
    routeHyp("HYP-B", { subjectIds: ["porto_alegre", "manaus"] })
  ],
  []
);
check(
  "inferred cities follow hypothesis order and skip duplicates",
  hypOrder.map((item) => item.cityId + ":" + item.hypothesisId).join(",") === "manaus:HYP-A,porto_alegre:HYP-B"
);

const junk = builder.buildRoute(
  [null, 12, { cityId: "recife" }, "manaus", ""],
  [null, "route", { statement: "brasilia", type: "route" }, routeHyp("HYP-0011", { subjectIds: ["recife"] })],
  [null, { locationId: "manaus" }, "E07"]
);
check(
  "malformed entries are skipped without throw",
  junk.some((item) => item.cityId === "manaus" && item.confirmed === true) &&
    junk.some((item) => item.cityId === "recife" && item.confirmed === false && item.hypothesisId === "HYP-0011")
);

console.log("ROUTE_BUILDER_PASS tests=" + tests);
