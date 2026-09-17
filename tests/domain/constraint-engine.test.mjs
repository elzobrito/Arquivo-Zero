#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const engine = require(resolve(root, "src/domain/constraints/constraint-engine.js"));

const errors = [];
function check(label, condition) {
  if (!condition) errors.push(label);
}

function R(result, explanation) {
  return { result, explanation: explanation || result };
}

function shape(item) {
  return (
    item &&
    (item.result === "MATCH" || item.result === "NO_MATCH" || item.result === "UNKNOWN") &&
    typeof item.explanation === "string" &&
    item.explanation.length > 0
  );
}

const M = "MATCH";
const N = "NO_MATCH";
const U = "UNKNOWN";
const andTable = {
  [`${M}+${M}`]: M,
  [`${M}+${N}`]: N,
  [`${M}+${U}`]: U,
  [`${N}+${M}`]: N,
  [`${N}+${N}`]: N,
  [`${N}+${U}`]: N,
  [`${U}+${M}`]: U,
  [`${U}+${N}`]: N,
  [`${U}+${U}`]: U,
};
const orTable = {
  [`${M}+${M}`]: M,
  [`${M}+${N}`]: M,
  [`${M}+${U}`]: M,
  [`${N}+${M}`]: M,
  [`${N}+${N}`]: N,
  [`${N}+${U}`]: U,
  [`${U}+${M}`]: M,
  [`${U}+${N}`]: U,
  [`${U}+${U}`]: U,
};
const notTable = { [M]: N, [N]: M, [U]: U };

for (const a of [M, N, U]) {
  for (const b of [M, N, U]) {
    const key = `${a}+${b}`;
    const andGot = engine.composeAnd([R(a), R(b)]);
    const orGot = engine.composeOr([R(a), R(b)]);
    check(`AND ${key}`, andGot.result === andTable[key] && shape(andGot));
    check(`OR ${key}`, orGot.result === orTable[key] && shape(orGot));
  }
  const notGot = engine.composeNot(R(a));
  check(`NOT ${a}`, notGot.result === notTable[a] && shape(notGot));
}

check("AND does not collapse U+M to NO_MATCH", engine.composeAnd([R(U), R(M)]).result === U);
check("OR does not collapse U+N to NO_MATCH", engine.composeOr([R(U), R(N)]).result === U);
check("NOT UNKNOWN stays UNKNOWN", engine.composeNot(R(U)).result === U);
check("AND empty UNKNOWN no throw", engine.composeAnd([]).result === U);
check("OR empty UNKNOWN no throw", engine.composeOr([]).result === U);
check("NOT malformed UNKNOWN no throw", engine.composeNot(null).result === U);

const record = {
  capabilities: ["network-access", "credential-cloning"],
  methods: ["token-reuse"],
  mobility: [{ mode: "road", vehicleClass: "car" }],
};
const atomNet = {
  id: "C-CAP-NET",
  op: "ATOM",
  path: "capabilities",
  operator: "contains",
  value: "network-access",
};
const atomMissing = {
  id: "C-ABSENT",
  op: "ATOM",
  path: "alibis",
  operator: "eq",
  value: "verified",
};
const atomPlane = {
  id: "C-VEHICLE-PLANE",
  op: "ATOM",
  path: "mobility.0.vehicleClass",
  operator: "eq",
  value: "cargo-plane",
};

const ctx = { record, candidateId: "byte" };
check("evaluate ATOM MATCH", engine.evaluate(atomNet, ctx).result === M && shape(engine.evaluate(atomNet, ctx)));
check("evaluate ATOM missing path UNKNOWN", engine.evaluate(atomMissing, ctx).result === U);
check("evaluate ATOM NO_MATCH", engine.evaluate(atomPlane, ctx).result === N);

const nested = {
  id: "C-BYTE-NETWORK",
  op: "AND",
  children: [
    atomNet,
    { id: "C-NOT-PLANE", op: "NOT", children: [atomPlane] },
  ],
};
check("evaluate nested AND/NOT MATCH", engine.evaluate(nested, ctx).result === M);

const orUnknown = {
  id: "C-OR",
  op: "OR",
  children: [atomMissing, atomPlane],
};
check("evaluate OR UNKNOWN+NO_MATCH stays UNKNOWN", engine.evaluate(orUnknown, ctx).result === U);

function chain(depth, leaf) {
  let node = leaf;
  for (let i = 0; i < depth - 1; i += 1) {
    node = { id: "D" + i, op: "AND", children: [node] };
  }
  return node;
}

const depth10 = chain(10, atomNet);
const depth11 = chain(11, atomNet);
check("depth 10 allowed", engine.evaluate(depth10, ctx).result === M);
const tooDeep = engine.evaluate(depth11, ctx);
check("depth 11 UNKNOWN", tooDeep.result === U);
check("depth 11 aviso", /aviso/.test(tooDeep.explanation) && /profundidade/.test(tooDeep.explanation));

const circular = { id: "C-LOOP", op: "AND", children: [] };
circular.children.push(circular);
const circ = engine.evaluate(circular, ctx);
check("circular object UNKNOWN", circ.result === U);
check("circular object explained", /circular/.test(circ.explanation));
check("circular does not throw", true);

const idCycle = {
  id: "DUP",
  op: "AND",
  children: [{ id: "DUP", op: "ATOM", path: "methods", operator: "contains", value: "token-reuse" }],
};
check("circular id UNKNOWN", engine.evaluate(idCycle, ctx).result === U);

const frozen = Object.freeze([R(M, "ok"), R(U, "maybe")]);
engine.composeAnd(frozen);
check("composeAnd does not mutate", frozen.length === 2 && frozen[0].result === M);

const esm = await readFile(resolve(root, "dist/modules/constraint-engine.js"), "utf8");
check("esm composeAnd", /export function composeAnd\(/.test(esm));
check("esm composeOr", /export function composeOr\(/.test(esm));
check("esm composeNot", /export function composeNot\(/.test(esm));
check("esm evaluate", /export function evaluate\(/.test(esm));

if (errors.length) {
  console.error("CONSTRAINT_ENGINE_FAIL tests=" + errors.length);
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("CONSTRAINT_ENGINE_PASS tests=45");
