#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(filename), "..");
const require = createRequire(import.meta.url);
const { filterCandidates } = require(resolve(root, "src/domain/suspects/candidate-service.js"));

function issue(severity, path, message, suggestion) {
  return { severity, path, message, suggestion };
}

function chaptersOf(game) {
  const chapters = game?.campaign?.chapters;
  if (chapters && typeof chapters === "object" && !Array.isArray(chapters)) {
    return Object.entries(chapters).map(([id, chapter]) => ({ id, ...chapter }));
  }
  return [{
    id: "implicit",
    culprit: game?.culprit,
    total_hours: game?.metadata?.total_hours,
    arrest_requirements: game?.arrest_requirements,
    scenarios: game?.scenarios,
    constraints: game?.constraints,
  }];
}

function effectiveConstraints(game, chapter, scenario) {
  if (Array.isArray(scenario?.constraints)) return scenario.constraints;
  if (Array.isArray(chapter?.constraints)) return chapter.constraints;
  return Array.isArray(game?.constraints) ? game.constraints : [];
}

function validateSolutions(game, issues) {
  const suspects = Array.isArray(game?.suspects) ? game.suspects : [];
  for (const chapter of chaptersOf(game)) {
    for (const scenario of Array.isArray(chapter.scenarios) ? chapter.scenarios : []) {
      const constraints = effectiveConstraints(game, chapter, scenario);
      if (constraints.length === 0) continue;
      const results = filterCandidates(suspects, constraints, game);
      const matches = results.filter((candidate) => candidate.result === "MATCH").map((candidate) => candidate.id);
      const path = `chapters.${chapter.id}.scenarios.${scenario.id}`;
      if (matches.length === 0) {
        issues.push(issue(
          "FAIL",
          path,
          "Nenhum suspeito compatível com as restrições deste cenário.",
          "Revise as restrições ou os atributos dos suspeitos para preservar ao menos uma solução.",
        ));
      } else if (matches.length > 1) {
        issues.push(issue(
          "FAIL",
          path,
          `Mais de um suspeito compatível ao final: [${matches.join(", ")}].`,
          "Acrescente uma restrição demonstrável que diferencie os candidatos restantes.",
        ));
      }
    }
  }
}

function scalarFields(record) {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record).filter(([field, value]) => {
    if (field === "id" || field === "name" || field === "codename") return false;
    return value !== null && (typeof value === "string" || typeof value === "number" || typeof value === "boolean");
  });
}

function comparable(value) {
  return `${typeof value}:${String(value)}`;
}

function validateTrivialAttributes(game, issues) {
  const suspects = Array.isArray(game?.suspects) ? game.suspects : [];
  const valuesByField = new Map();
  for (const suspect of suspects) {
    for (const [field, value] of scalarFields(suspect)) {
      if (!valuesByField.has(field)) valuesByField.set(field, new Map());
      const values = valuesByField.get(field);
      const key = comparable(value);
      if (!values.has(key)) values.set(key, []);
      values.get(key).push({ id: suspect.id, value });
    }
  }
  for (const [field, values] of valuesByField) {
    for (const entries of values.values()) {
      if (entries.length !== 1 || !entries[0].id) continue;
      const entry = entries[0];
      issues.push(issue(
        "WARN",
        `suspects.${entry.id}.${field}`,
        `Campo ${field}=${String(entry.value)} é único entre todos os suspeitos.`,
        "Evite que um único atributo revele a solução sem cruzamento de restrições.",
      ));
    }
  }
}

function locationMap(game) {
  const output = new Map();
  for (const location of Array.isArray(game?.locations) ? game.locations : []) {
    if (location?.id) output.set(location.id, location);
  }
  return output;
}

function effectiveAction(action, scenario) {
  return { ...action, ...(scenario?.action_overrides?.[action.id] || {}) };
}

function routeActions(game, scenario) {
  const locations = locationMap(game);
  const output = [];
  for (const locationId of Array.isArray(scenario?.route) ? scenario.route : []) {
    const location = locations.get(locationId);
    for (const action of Array.isArray(location?.actions) ? location.actions : []) {
      output.push(effectiveAction(action, scenario));
    }
  }
  return output;
}

function travelCost(game, route) {
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    const cost = game?.travel?.[route[index - 1]]?.[route[index]];
    if (Number.isFinite(cost)) total += cost;
  }
  return total;
}

function validateEvidenceRouteAndBudget(game, issues) {
  for (const chapter of chaptersOf(game)) {
    const required = Array.isArray(chapter?.arrest_requirements?.required_evidence)
      ? chapter.arrest_requirements.required_evidence
      : [];
    const hours = Number.isFinite(chapter?.total_hours)
      ? chapter.total_hours
      : game?.metadata?.total_hours;
    for (const scenario of Array.isArray(chapter.scenarios) ? chapter.scenarios : []) {
      const actions = routeActions(game, scenario);
      const minimumCosts = [];
      const missing = [];
      for (const evidenceId of required) {
        const costs = actions
          .filter((action) => action?.evidence === evidenceId && Number.isFinite(action.cost))
          .map((action) => action.cost);
        if (costs.length === 0) missing.push(evidenceId);
        else minimumCosts.push(Math.min(...costs));
      }
      const path = `chapters.${chapter.id}.scenarios.${scenario.id}.action_overrides`;
      for (const evidenceId of missing) {
        issues.push(issue(
          "FAIL",
          path,
          `Evidência ${evidenceId} obrigatória não está na rota [${(scenario.route || []).join(", ")}].`,
          "Inclua uma ação que produza a evidência na rota ou revise required_evidence.",
        ));
      }
      if (missing.length === 0 && Number.isFinite(hours)) {
        const route = Array.isArray(scenario.route) ? scenario.route : [];
        const minimum = travelCost(game, route) + minimumCosts.reduce((sum, cost) => sum + cost, 0);
        if (minimum > hours) {
          issues.push(issue(
            "FAIL",
            `chapters.${chapter.id}.arrest_requirements`,
            `Custo mínimo ${minimum}h supera orçamento ${hours}h do capítulo.`,
            "Aumente total_hours ou reduza custos indispensáveis da rota e das evidências.",
          ));
        }
      }
    }
  }
}

export function validateConstraints(gameJson) {
  const issues = [];
  if (!gameJson || typeof gameJson !== "object" || Array.isArray(gameJson)) {
    issues.push(issue("FAIL", "$", "Documento do caso ausente ou inválido.", "Forneça um objeto game.json."));
  } else {
    validateSolutions(gameJson, issues);
    validateTrivialAttributes(gameJson, issues);
    validateEvidenceRouteAndBudget(gameJson, issues);
  }
  const status = issues.some((item) => item.severity === "FAIL")
    ? "FAIL"
    : issues.some((item) => item.severity === "WARN") ? "WARN" : "PASS";
  return { status, issues };
}

async function runCli(path) {
  try {
    const game = JSON.parse(await readFile(path, "utf8"));
    const result = validateConstraints(game);
    console.log(`CONSTRAINT_VALIDATOR_${result.status} issues=${result.issues.length} file=${path}`);
    for (const item of result.issues) {
      console.log(`${item.severity} ${item.path}: ${item.message} Sugestão: ${item.suggestion}`);
    }
    process.exitCode = result.status === "FAIL" ? 1 : 0;
  } catch (error) {
    console.error(`CONSTRAINT_VALIDATOR_FAIL issues=1 file=${path}`);
    console.error(`FAIL $: Não foi possível ler o caso: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === filename) {
  await runCli(process.argv[2] || resolve(root, "dist/game.json"));
}
