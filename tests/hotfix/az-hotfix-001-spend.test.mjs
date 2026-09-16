#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { isUnaffordable } = require(resolve(root, "src/domain/time/time-service.js"));
const src = await readFile(resolve(root, "dist/app.js"), "utf8");
if (!src.includes("hoursUnaffordable(state.hours,cost,allowZero)")) {
  console.error("AZ-HOTFIX-001 FAIL: dist/app.js não delega isUnaffordable");
  process.exit(1);
}

function run(hours, cost, allowZero) {
  return isUnaffordable(hours, cost, allowZero);
}

const cases = [
  ["menor que o saldo", 10, 4, false, false],
  ["igual ao saldo sem allowZero", 4, 4, false, true],
  ["maior que o saldo", 3, 4, false, true],
  ["prisão no limite exato", 1, 1, true, false],
  ["prisão acima do saldo", 0, 1, true, true],
];

const errors = [];
for (const [label, hours, cost, allowZero, expected] of cases) {
  const got = run(hours, cost, allowZero);
  if (got !== expected) errors.push(`${label}: hours=${hours} cost=${cost} allowZero=${allowZero} got=${got} expected=${expected}`);
}

if (!src.includes("Math.max(0,state.hours-cost)")) {
  errors.push("openTravel ainda pode exibir saldo negativo");
}
if (!src.includes("applyTravel(state,game,pendingDestination,nav)")) {
  errors.push("confirmação de viagem não delega a applyTravel");
}

if (errors.length) {
  console.error("AZ-HOTFIX-001 FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("AZ-HOTFIX-001 PASS cases=5");
