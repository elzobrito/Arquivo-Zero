#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { filterCandidates } = require(resolve(root, "src/domain/suspects/candidate-service.js"));

const suspects = [
  {
    id: "byte",
    capabilities: ["network-access", "credential-cloning"],
    methods: ["token-reuse"],
  },
  {
    id: "cifra",
    capabilities: ["visual-forgery"],
    methods: ["document-forgery"],
  },
  {
    id: "vertice",
    capabilities: ["network-access"],
  },
];

const capability = {
  id: "capability-network",
  op: "ATOM",
  path: "capabilities",
  operator: "contains",
  value: "network-access",
};
const method = {
  id: "method-token",
  op: "ATOM",
  path: "methods",
  operator: "contains",
  value: "token-reuse",
};
const constraints = [capability, method];
const game = { id: "case-horus" };

const inputSnapshot = JSON.stringify({ suspects, constraints, game });
const actual = filterCandidates(suspects, constraints, game);

assert.deepEqual(
  actual.map(({ id, result }) => ({ id, result })),
  [
    { id: "byte", result: "MATCH" },
    { id: "cifra", result: "NO_MATCH" },
    { id: "vertice", result: "UNKNOWN" },
  ],
  "agregação Kleene por suspeito",
);
assert.equal(actual[0].explanations.length, 2, "explica cada dimensão avaliada");
assert.deepEqual(
  actual[0].explanations.map(({ constraintId, result }) => ({ constraintId, result })),
  [
    { constraintId: "capability-network", result: "MATCH" },
    { constraintId: "method-token", result: "MATCH" },
  ],
  "explicações preservam id e resultado por dimensão",
);
assert.match(actual[2].explanations[1].explanation, /ausente|null/i, "UNKNOWN explica dado ausente");
assert.equal(JSON.stringify({ suspects, constraints, game }), inputSnapshot, "não muta suspeitos, regras ou caso");
assert.deepEqual(filterCandidates(suspects, constraints, game), actual, "mesma entrada produz saída determinística");
assert.deepEqual(filterCandidates([], constraints, game), [], "lista vazia permanece vazia");
assert.deepEqual(filterCandidates(null, constraints, game), [], "entrada de suspeitos inválida é segura");

const frozenSuspects = Object.freeze(suspects.map((item) => Object.freeze({ ...item })));
assert.doesNotThrow(() => filterCandidates(frozenSuspects, constraints, game), "aceita lista e registros congelados");

const noRules = filterCandidates([suspects[0]], [], game);
assert.equal(noRules[0].result, "UNKNOWN", "sem restrições não promove candidato a MATCH");
assert.equal(noRules[0].explanations[0].constraintId, "constraints", "diagnostica ausência de restrições");

const anonymous = filterCandidates([{ capabilities: ["network-access"] }], [capability], game);
assert.equal(anonymous[0].id, null, "id ausente não é inventado");
assert.equal(anonymous[0].result, "UNKNOWN", "id ausente mantém candidato indeterminado");
assert.equal(anonymous[0].explanations[0].constraintId, "candidate-id", "id inválido é diagnosticado");

const malformed = filterCandidates([suspects[0]], [null], game);
assert.equal(malformed[0].result, "UNKNOWN", "restrição malformada falha de modo controlado");
assert.equal(malformed[0].explanations[0].constraintId, "constraint-1", "restrição sem id recebe diagnóstico estável");

const esm = await readFile(resolve(root, "dist/modules/candidate-service.js"), "utf8");
assert.match(esm, /from "\.\/constraint-engine\.js"/, "espelho ESM usa o mesmo constraint-engine");
assert.match(esm, /export function filterCandidates\(/, "espelho ESM exporta filterCandidates");

console.log("CANDIDATE_SERVICE_PASS tests=18");
