#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateConstraints } from "../../scripts/validate-case-constraints.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDir = resolve(root, "tests/qa/fixtures");
let tests = 0;

function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const published = validateConstraints(await json(resolve(root, "dist/game.json")));
check("INV-CV-001 caso publicado sem FAIL", published.status === "PASS" || published.status === "WARN");
check("INV-CV-001 nenhuma issue FAIL", published.issues.every((item) => item.severity !== "FAIL"));

const zero = validateConstraints(await json(resolve(fixtureDir, "constraint-zero-solution.json")));
check("INV-CV-002 solução zero falha", zero.status === "FAIL");
check("INV-CV-002 path correto", zero.issues.some((item) => item.path === "chapters.case.scenarios.zero" && /Nenhum suspeito/.test(item.message)));

const multiple = validateConstraints(await json(resolve(fixtureDir, "constraint-multi-solution.json")));
check("INV-CV-003 solução múltipla falha", multiple.status === "FAIL");
check("INV-CV-003 ids listados", multiple.issues.some((item) => /\[alpha, beta\]/.test(item.message)));

const trivial = validateConstraints(await json(resolve(fixtureDir, "constraint-trivial-attr.json")));
check("INV-CV-004 atributo trivial avisa", trivial.status === "WARN");
check("INV-CV-004 field e value", trivial.issues.some((item) => item.path === "suspects.alpha.skill" && /skill=rare/.test(item.message)));

const budget = validateConstraints(await json(resolve(fixtureDir, "constraint-budget-fail.json")));
check("INV-CV-005 orçamento falha", budget.status === "FAIL");
check("INV-CV-005 horas detalhadas", budget.issues.some((item) => item.path === "chapters.case.arrest_requirements" && /6h supera orçamento 5h/.test(item.message)));

const offRoute = validateConstraints(await json(resolve(fixtureDir, "constraint-ev-out-of-route.json")));
check("INV-CV-006 evidência fora da rota falha", offRoute.status === "FAIL");
check("INV-CV-006 path e id", offRoute.issues.some((item) => item.path === "chapters.case.scenarios.offroute.action_overrides" && /E1/.test(item.message)));

const cliPublished = spawnSync(process.execPath, [resolve(root, "scripts/validate-case-constraints.mjs"), resolve(root, "dist/game.json")], { encoding: "utf8" });
check("INV-CV-007 CLI publicada exit 0", cliPublished.status === 0);
check("INV-CV-007 CLI publica marcador", /CONSTRAINT_VALIDATOR_(PASS|WARN)/.test(cliPublished.stdout));

const cliFail = spawnSync(process.execPath, [resolve(root, "scripts/validate-case-constraints.mjs"), resolve(fixtureDir, "constraint-zero-solution.json")], { encoding: "utf8" });
check("INV-CV-008 CLI FAIL exit 1", cliFail.status === 1);
check("INV-CV-008 CLI publica FAIL", /CONSTRAINT_VALIDATOR_FAIL/.test(cliFail.stdout));

const frozen = Object.freeze({ suspects: Object.freeze([]) });
check("entrada congelada não lança", validateConstraints(frozen).status === "PASS");
check("resultado tem contrato estável", Array.isArray(published.issues) && ["PASS", "WARN", "FAIL"].includes(published.status));

console.log(`CONSTRAINT_VALIDATOR_TESTS_PASS tests=${tests}`);
