#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const ops = require(resolve(root, "src/domain/constraints/scalar-operators.js"));

const errors = [];
function check(label, condition) {
  if (!condition) errors.push(label);
}

function shape(result) {
  return (
    result &&
    (result.result === "MATCH" || result.result === "NO_MATCH" || result.result === "UNKNOWN") &&
    typeof result.explanation === "string" &&
    result.explanation.length > 0
  );
}

const names = ["eq", "neq", "contains", "in", "notIn", "range"];
for (const name of names) {
  check(`export ${name}`, typeof ops[name] === "function");
}

check("eq MATCH primitives", ops.eq("token-reuse", "token-reuse").result === "MATCH" && shape(ops.eq("token-reuse", "token-reuse")));
check("eq NO_MATCH primitives", ops.eq("token-reuse", "visual-forgery").result === "NO_MATCH");
check("eq UNKNOWN absent", ops.eq(undefined, "x").result === "UNKNOWN");
check("eq UNKNOWN null", ops.eq(null, "x").result === "UNKNOWN");
check("eq UNKNOWN types", ops.eq("1", 1).result === "UNKNOWN" && /tipos incompatíveis/.test(ops.eq("1", 1).explanation));
check("eq MATCH arrays", ops.eq(["a", "b"], ["a", "b"]).result === "MATCH");
check("eq NO_MATCH arrays length", ops.eq(["a"], ["a", "b"]).result === "NO_MATCH");
check("eq UNKNOWN objects", ops.eq({ a: 1 }, { a: 1 }).result === "UNKNOWN");
check("eq UNKNOWN NaN", ops.eq(Number.NaN, Number.NaN).result === "UNKNOWN");

check("neq MATCH different", ops.neq("a", "b").result === "MATCH" && shape(ops.neq("a", "b")));
check("neq NO_MATCH equal", ops.neq("a", "a").result === "NO_MATCH");
check("neq UNKNOWN absent", ops.neq(undefined, "a").result === "UNKNOWN");
check("neq UNKNOWN null", ops.neq(null, "a").result === "UNKNOWN");
check("neq UNKNOWN types", ops.neq("1", 1).result === "UNKNOWN");

check("contains MATCH string", ops.contains("token-reuse", "token").result === "MATCH" && shape(ops.contains("token-reuse", "token")));
check("contains NO_MATCH string", ops.contains("token-reuse", "forgery").result === "NO_MATCH");
check("contains MATCH array", ops.contains(["token-reuse", "phish"], "phish").result === "MATCH");
check("contains NO_MATCH array", ops.contains(["token-reuse"], "phish").result === "NO_MATCH");
check("contains UNKNOWN absent", ops.contains(undefined, "x").result === "UNKNOWN");
check("contains UNKNOWN null", ops.contains(null, "x").result === "UNKNOWN");
check("contains UNKNOWN type number", ops.contains(42, "4").result === "UNKNOWN");
check("contains UNKNOWN expected array on string", ops.contains("token-reuse", ["token"]).result === "UNKNOWN");
check("contains empty array NO_MATCH", ops.contains([], "x").result === "NO_MATCH");

check("in MATCH", ops.in("byte", ["byte", "null"]).result === "MATCH" && shape(ops.in("byte", ["byte", "null"])));
check("in NO_MATCH", ops.in("cifra", ["byte", "null"]).result === "NO_MATCH");
check("in empty set NO_MATCH", ops.in("byte", []).result === "NO_MATCH");
check("in UNKNOWN absent", ops.in(undefined, ["byte"]).result === "UNKNOWN");
check("in UNKNOWN null", ops.in(null, ["byte"]).result === "UNKNOWN");
check("in UNKNOWN expected not array", ops.in("byte", "byte").result === "UNKNOWN");

check("notIn MATCH", ops.notIn("cifra", ["byte", "null"]).result === "MATCH" && shape(ops.notIn("cifra", ["byte"])));
check("notIn NO_MATCH", ops.notIn("byte", ["byte", "null"]).result === "NO_MATCH");
check("notIn empty set MATCH", ops.notIn("byte", []).result === "MATCH");
check("notIn UNKNOWN absent", ops.notIn(undefined, ["byte"]).result === "UNKNOWN");
check("notIn UNKNOWN null", ops.notIn(null, ["byte"]).result === "UNKNOWN");
check("notIn UNKNOWN expected not array", ops.notIn("byte", { byte: true }).result === "UNKNOWN");

check("range MATCH both bounds", ops.range(10, { min: 0, max: 10 }).result === "MATCH" && shape(ops.range(10, { min: 0, max: 10 })));
check("range MATCH min only", ops.range(10, { min: 10 }).result === "MATCH");
check("range MATCH max only", ops.range(10, { max: 10 }).result === "MATCH");
check("range NO_MATCH below min", ops.range(10, { min: 11 }).result === "NO_MATCH");
check("range NO_MATCH above max", ops.range(11, { min: 0, max: 10 }).result === "NO_MATCH");
check("range UNKNOWN absent", ops.range(undefined, { min: 0, max: 10 }).result === "UNKNOWN");
check("range UNKNOWN null", ops.range(null, { min: 0, max: 10 }).result === "UNKNOWN");
check("range UNKNOWN string actual", ops.range("10", { min: 0, max: 10 }).result === "UNKNOWN");
check("range UNKNOWN empty expected", ops.range(10, {}).result === "UNKNOWN");
check("range UNKNOWN inverted", ops.range(10, { min: 20, max: 5 }).result === "UNKNOWN");
check("range UNKNOWN expected not object", ops.range(10, [0, 10]).result === "UNKNOWN");

const frozenActual = Object.freeze(["token-reuse"]);
const frozenExpected = Object.freeze({ min: 0, max: 10 });
ops.contains(frozenActual, "token-reuse");
ops.range(5, frozenExpected);
check("pure does not mutate array", frozenActual.length === 1 && frozenActual[0] === "token-reuse");
check("pure does not mutate range", frozenExpected.min === 0 && frozenExpected.max === 10);

const first = ops.eq("a", "b");
const second = ops.eq("a", "b");
check("pure deterministic", first.result === second.result && first.explanation === second.explanation);

const withPath = ops.eq(undefined, "x", { path: "methods" });
check("path prefixes UNKNOWN", withPath.explanation.startsWith("methods: ") && withPath.result === "UNKNOWN");

const esmSource = await readFile(resolve(root, "dist/modules/scalar-operators.js"), "utf8");
check("esm exports eq", /export function eq\(/.test(esmSource));
check("esm exports neq", /export function neq\(/.test(esmSource));
check("esm exports contains", /export function contains\(/.test(esmSource));
check("esm exports in", /export \{ inOp as in \}/.test(esmSource));
check("esm exports notIn", /export function notIn\(/.test(esmSource));
check("esm exports range", /export function range\(/.test(esmSource));

if (errors.length) {
  console.error("SCALAR_OPERATORS_FAIL tests=" + errors.length);
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("SCALAR_OPERATORS_PASS tests=52");
