#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const service = require(resolve(candidateRoot, "src/domain/hypotheses/hypothesis-service.js"));
const schema = JSON.parse(await readFile(resolve(workspace, "src/contracts/hypothesis-record.schema.json"), "utf8"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/hypothesis-service.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

let tests = 0;
function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}
function throws(label, fn, pattern) {
  tests += 1;
  assert.throws(fn, pattern, label);
}
function matchesPublishedContract(record) {
  return schema.required.every((field) => Object.prototype.hasOwnProperty.call(record, field)) &&
    schema.properties.type.enum.includes(record.type) &&
    schema.properties.confidence.enum.includes(record.confidence) &&
    schema.properties.status.enum.includes(record.status) &&
    Array.isArray(record.supports) && Array.isArray(record.contradictions);
}

check("legacy save without hypotheses normalizes to empty", service.getHypotheses({ evidence: ["E01"] }).length === 0);
check("invalid save normalizes to empty", service.getHypotheses(null).length === 0);

const authorship = service.createHypothesis("authorship", "Byte pode ter praticado o fato.");
check("create returns published contract", matchesPublishedContract(authorship));
check("create starts active with low declared confidence", authorship.status === "active" && authorship.confidence === "low");
check("create starts with no evidence links", authorship.supports.length === 0 && authorship.contradictions.length === 0);
check("create starts revision history", authorship.revision === 1 && authorship.history.length === 0);
check("stable generated id", authorship.id === "HYP-0001");
check("record is hypothesis, not evidence or fact", !("fact" in authorship) && !("admissibility" in authorship));

const competing = service.createHypothesis("authorship", "Cifra pode ter praticado o mesmo fato.");
check("competing hypotheses coexist", service.getHypotheses().length === 2 && competing.id !== authorship.id);
check("competing statement remains independent", service.getHypotheses().map((item) => item.statement).includes(authorship.statement));

const supported = service.linkEvidence(authorship.id, "E03", "supports");
check("support evidence linked", supported.supports.includes("E03") && supported.contradictions.length === 0);
check("support does not automatically prove statement", supported.status === "active");
check("support increments revision and preserves history", supported.revision === 2 && supported.history.length === 1 && supported.history[0].supports.length === 0);

const duplicate = service.linkEvidence(authorship.id, "E03", "supports");
check("duplicate link is idempotent", duplicate.revision === 2 && duplicate.supports.length === 1);

const contradicted = service.linkEvidence(authorship.id, "E06", "contradicts");
check("contradiction remains visible", contradicted.contradictions.includes("E06") && contradicted.supports.includes("E03"));
check("contradiction weakens rather than removes", contradicted.status === "weakened" && service.getHypotheses().some((item) => item.id === authorship.id));
check("contradiction revision preserves previous state", contradicted.revision === 3 && contradicted.history[1].status === "active");

const refuted = service.updateStatus(authorship.id, "refuted");
check("status can become refuted", refuted.status === "refuted");
check("refuted hypothesis remains auditable", service.getHypotheses().some((item) => item.id === authorship.id && item.status === "refuted"));
check("status revision preserves contradiction", refuted.revision === 4 && refuted.contradictions.includes("E06"));

const reopened = service.updateStatus(authorship.id, "active");
check("status can reopen with stable id", reopened.status === "active" && reopened.id === authorship.id);
check("reopen appends history", reopened.revision === 5 && reopened.history.length === 4);
const unchanged = service.updateStatus(authorship.id, "active");
check("same status is idempotent", unchanged.revision === 5);

throws("invalid type rejected", () => service.createHypothesis("destination", "Destino possível"), /type inválido/);
throws("empty statement rejected", () => service.createHypothesis("route", "  "), /statement/);
throws("invalid role rejected", () => service.linkEvidence(authorship.id, "E01", "neutral"), /role inválido/);
throws("invalid status rejected", () => service.updateStatus(authorship.id, "closed"), /status inválido/);
throws("unknown hypothesis rejected", () => service.linkEvidence("HYP-9999", "E01", "supports"), /não encontrada/);
throws("same evidence cannot support and contradict", () => service.linkEvidence(authorship.id, "E03", "contradicts"), /já está vinculada/);

const external = service.getHypotheses();
external[0].supports.push("MUTATION");
check("getHypotheses returns defensive copies", !service.getHypotheses()[0].supports.includes("MUTATION"));
authorship.statement = "alteração externa";
check("create returns defensive copy", service.getHypotheses()[0].statement !== "alteração externa");

const saved = [{ id: "LEGACY-H1", type: "route", statement: "rota possível", confidence: "low", status: "active" }];
const normalized = service.getHypotheses({ hypotheses: saved });
check("saved hypotheses normalize missing collections", normalized.length === 1 && normalized[0].supports.length === 0 && normalized[0].contradictions.length === 0 && normalized[0].history.length === 0);
check("normalization does not mutate save", !("supports" in saved[0]));

const esmHypothesis = esm.createHypothesis("method", "O método envolveu reutilização de token.");
check("ESM create parity", matchesPublishedContract(esmHypothesis) && esmHypothesis.id === "HYP-0001");
const esmLinked = esm.linkEvidence(esmHypothesis.id, "E11", "contradicts");
check("ESM contradiction parity", esmLinked.status === "weakened" && esmLinked.contradictions.includes("E11"));
check("ESM status parity", esm.updateStatus(esmHypothesis.id, "inconclusive").status === "inconclusive");
check("ESM get parity", esm.getHypotheses().length === 1);

console.log("HYPOTHESIS_SERVICE_PASS tests=" + tests);
