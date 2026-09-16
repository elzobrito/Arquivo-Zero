#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const svc = require(resolve(root, "src/domain/evidence/evidence-service.js"));
const { catalogEvidence, getDiscovered, getById, isEssential } = svc;

const errors = [];
function check(label, cond) {
  if (!cond) errors.push(label);
}

const game = {
  evidence: [
    { id: "EA1", title: "Vistoria", text: "Fato.", tag: "id", source: null, admissibility: "admissible", quality: null, integrity: "unverified" },
    { id: "EB1", title: "Rumor", text: "Frágil.", tag: "rota", source: "informante", admissibility: "inadmissible", quality: 0.2, integrity: "compromised" },
    { id: "EC1", title: "Manifesto", text: "Carga.", tag: "prova", source: "hangar", admissibility: "unknown", quality: null, integrity: "unverified" },
  ],
  arrest_requirements: { minimum_evidence: 1, required_evidence: ["EA1"] },
};

const empty = { evidence: [] };

const first = catalogEvidence(empty, "EA1", game);
check("catalog ok", first.ok === true && first.duplicate === false);
check("catalog record", first.record && first.record.id === "EA1");
check("catalog accumulates", first.evidence.length === 1 && first.evidence[0] === "EA1");
check("catalog does not mutate state", empty.evidence.length === 0);

const again = catalogEvidence({ evidence: first.evidence }, "EA1", game);
check("idempotent duplicate flag", again.ok === true && again.duplicate === true);
check("idempotent length", again.evidence.length === 1);
check("idempotent same id", again.evidence[0] === "EA1");

const unknown = catalogEvidence({ evidence: first.evidence }, "NOPE", game);
check("unknown not added", unknown.ok === false && unknown.record === null && unknown.evidence.join() === "EA1");

const missing = catalogEvidence({ evidence: first.evidence }, "", game);
check("empty id rejected", missing.ok === false && missing.evidence.join() === "EA1");

const inadmissible = catalogEvidence({ evidence: first.evidence }, "EB1", game);
check("inadmissible cataloged", inadmissible.ok === true && inadmissible.record.admissibility === "inadmissible");
check("inadmissible kept in history", inadmissible.evidence.join() === "EA1,EB1");

const discovered = getDiscovered({ evidence: inadmissible.evidence }, game);
check("getDiscovered only discovered", discovered.map((e) => e.id).join() === "EA1,EB1");
check("getDiscovered keeps inadmissible", discovered.some((e) => e.id === "EB1" && e.admissibility === "inadmissible"));
check("getDiscovered excludes undiscovered", discovered.every((e) => e.id !== "EC1"));

check("source null preserved", getById("EA1", game).source === null);
check("quality null is not zero", getById("EA1", game).quality === null);
check("getById miss", getById("NOPE", game) === null);

check("isEssential current chapter EA1", isEssential("EA1", game) === true);
check("isEssential current chapter EB1", isEssential("EB1", game) === false);

const otherChapter = {
  evidence: game.evidence,
  arrest_requirements: { minimum_evidence: 1, required_evidence: ["EB1"] },
};
check("isEssential follows chapter overlay", isEssential("EA1", otherChapter) === false && isEssential("EB1", otherChapter) === true);
check("isEssential empty required", isEssential("EA1", { arrest_requirements: { required_evidence: [] } }) === false);

const neverRemoved = catalogEvidence({ evidence: ["EA1", "EB1"] }, "EA1", game);
check("history never shrinks", neverRemoved.evidence.join() === "EA1,EB1");

check("issueWarrant untouched export", typeof require(resolve(root, "src/domain/dossier/dossier-service.js")).issueWarrant === "function");

const esm = await readFile(resolve(root, "dist/modules/evidence-service.js"), "utf8");
check("esm exports catalogEvidence", esm.includes("export function catalogEvidence"));
check("esm exports getDiscovered", esm.includes("export function getDiscovered"));
check("esm exports getById", esm.includes("export function getById"));
check("esm exports isEssential", esm.includes("export function isEssential"));

if (errors.length) {
  console.error("EVIDENCE_SERVICE_FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("EVIDENCE_SERVICE_PASS tests=18");
