#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const defaultGamePath = resolve(root, "dist/game.json");
const appPath = resolve(root, "dist/app.js");
const requested = process.argv[2];
const gamePath = requested ? resolve(process.cwd(), requested) : defaultGamePath;
const validatingDefault = resolve(gamePath) === defaultGamePath;

const game = JSON.parse(await readFile(gamePath, "utf8"));
const app = await readFile(appPath, "utf8");
const errors = [];

const locations = new Map((game.locations || []).map(location => [location.id, location]));
const evidence = new Set((game.evidence || []).map(item => item.id));
const suspects = new Map((game.suspects || []).map(suspect => [suspect.id, suspect]));
const actions = new Map();
for (const location of game.locations || []) {
  for (const action of location.actions || []) actions.set(action.id, action);
}

function push(message) {
  errors.push(message);
}

function dossierFields() {
  return (game.dossier?.fields || []).map(field => field.id).filter(Boolean);
}

function culpritIsUnique(culprit, label) {
  const fields = dossierFields().filter(field => culprit[field] != null && culprit[field] !== "");
  if (!fields.length) {
    push(`${label}: culpado ${culprit.id} não tem atributos de dossiê`);
    return;
  }
  const matches = [...suspects.values()].filter(suspect =>
    fields.every(field => suspect[field] === culprit[field]),
  );
  if (matches.length !== 1 || matches[0].id !== culprit.id) {
    push(`${label}: perfil de dossiê do culpado ${culprit.id} não é único`);
  }
}

function validateScenario(scenario, chapter, seen) {
  const label = `${chapter.id}/${scenario.id || "<sem-id>"}`;
  if (!scenario.id || seen.ids.has(scenario.id)) push(`${label}: id ausente ou duplicado`);
  seen.ids.add(scenario.id);
  if (!scenario.code || seen.codes.has(scenario.code)) push(`${label}: code ausente ou duplicado`);
  seen.codes.add(scenario.code);

  const route = scenario.route || [];
  const signature = route.join(">");
  if (seen.routes.has(signature)) push(`${label}: rota duplicada`);
  seen.routes.add(signature);
  if (route.length < 3) push(`${label}: rota deve ter início, ao menos um intermediário e destino`);
  if (route[0] !== chapter.start) push(`${label}: rota não começa em ${chapter.start}`);
  if (new Set(route).size !== route.length) push(`${label}: rota repete cidades`);
  for (const locationId of route) {
    if (!locations.has(locationId)) push(`${label}: cidade inexistente ${locationId}`);
  }
  for (let index = 0; index < route.length - 1; index += 1) {
    if (!(scenario.navigation?.[route[index]] || []).includes(route[index + 1])) {
      push(`${label}: navegação não permite ${route[index]} -> ${route[index + 1]}`);
    }
  }

  const end = route.at(-1);
  const endLocation = locations.get(end);
  const arrest = (endLocation?.actions || []).some(base => {
    const effective = Object.assign({}, base, scenario.action_overrides?.[base.id] || {});
    return effective.arrest === true;
  });
  if (end && endLocation && !arrest) {
    push(`${label}: destino ${end} não tem ação de prisão`);
  }

  for (const [actionId, override] of Object.entries(scenario.action_overrides || {})) {
    if (!actions.has(actionId)) push(`${label}: override de ação inexistente ${actionId}`);
    if (override.evidence && !evidence.has(override.evidence)) {
      push(`${label}: ação ${actionId} referencia prova inexistente`);
    }
  }
  for (const evidenceId of Object.keys(scenario.evidence_overrides || {})) {
    if (!evidence.has(evidenceId)) push(`${label}: override de evidência inexistente ${evidenceId}`);
  }

  const required = new Set(chapter.arrest_requirements?.required_evidence || []);
  const minimum = chapter.arrest_requirements?.minimum_evidence || 0;
  const collected = new Set();
  for (const locationId of route) {
    for (const base of locations.get(locationId)?.actions || []) {
      const effective = Object.assign({}, base, scenario.action_overrides?.[base.id] || {});
      if (effective.evidence) collected.add(effective.evidence);
    }
  }
  if (collected.size < minimum) push(`${label}: oferece só ${collected.size}/${minimum} evidências`);
  for (const evidenceId of required) {
    if (!collected.has(evidenceId)) push(`${label}: não oferece prova obrigatória ${evidenceId}`);
  }
  const offRoute = [...locations.keys()].filter(locationId => !route.includes(locationId));
  for (const locationId of offRoute) {
    for (const base of locations.get(locationId)?.actions || []) {
      const effective = Object.assign({}, base, scenario.action_overrides?.[base.id] || {});
      if (effective.evidence && required.has(effective.evidence)) {
        push(`${label}: desvio ${locationId} vaza prova obrigatória ${effective.evidence}`);
      }
    }
  }
}

function validateChapter(chapter) {
  const culprit = suspects.get(chapter.culprit);
  if (!culprit) push(`${chapter.id}: culprit ${chapter.culprit} não existe na base de suspeitos`);
  else culpritIsUnique(culprit, chapter.id);
  if (!locations.has(chapter.start)) push(`${chapter.id}: start inexistente ${chapter.start}`);
  const scenarios = chapter.scenarios || [];
  if (scenarios.length < 2) push(`${chapter.id}: são necessários pelo menos dois cenários`);
  const seen = { ids: new Set(), codes: new Set(), routes: new Set() };
  for (const scenario of scenarios) validateScenario(scenario, chapter, seen);
  return { scenarioCount: scenarios.length, routeCount: seen.routes.size, culpritId: chapter.culprit };
}

function implicitChapter() {
  return {
    id: "implicit",
    culprit: game.culprit,
    start: game.metadata?.start,
    arrest_requirements: game.arrest_requirements || { minimum_evidence: 0, required_evidence: [] },
    scenarios: game.scenarios || [],
  };
}

function campaignChapters() {
  const campaign = game.campaign;
  if (!campaign.id) push("campaign.id ausente");
  const pool = campaign.lieutenant_pool;
  if (!Array.isArray(pool) || pool.length < 1) push("campaign.lieutenant_pool inválido");
  const poolSet = new Set(pool || []);
  if (poolSet.size !== (pool || []).length) push("campaign.lieutenant_pool tem duplicatas");
  for (const id of poolSet) {
    if (!suspects.has(id)) push(`campaign.lieutenant_pool cita suspeito inexistente ${id}`);
  }
  const count = campaign.lieutenant_chapters;
  if (!Number.isInteger(count) || count < 1 || count > poolSet.size) {
    push("campaign.lieutenant_chapters deve ser inteiro entre 1 e o tamanho do pool");
  }
  if (!campaign.boss || !suspects.has(campaign.boss)) push("campaign.boss inexistente");
  if (poolSet.has(campaign.boss)) push("campaign.boss não pode pertencer ao lieutenant_pool");
  const expected = new Set([...poolSet, campaign.boss]);
  const chapters = campaign.chapters || {};
  const keys = Object.keys(chapters);
  for (const key of keys) {
    if (!expected.has(key)) push(`campaign.chapters tem chave extra ${key}`);
  }
  for (const key of expected) {
    if (!chapters[key]) {
      push(`campaign.chapters falta ${key}`);
      continue;
    }
    if (chapters[key].culprit !== key) push(`campaign.chapters.${key}.culprit deve ser ${key}`);
  }
  return expected.size ? [...expected].map(id => ({ id, ...chapters[id] })) : [];
}

if (validatingDefault) {
  const pickerSource = app.match(/function pickScenario\(exclude=null\)\{.*?\}(?=function scenario)/s)?.[0];
  if (!pickerSource) {
    push("pickScenario não foi localizada no motor");
  } else {
    const sandbox = { game, Math: Object.create(Math) };
    sandbox.Math.random = () => 0;
    vm.runInNewContext(`${pickerSource};this.pickScenario=pickScenario`, sandbox);
    const pool = game.scenarios || [];
    for (const item of pool) {
      const selected = sandbox.pickScenario(item.id);
      if (pool.length > 1 && selected === item.id) push(`${item.id}: repetição imediata não foi evitada`);
      if (selected && !pool.some(candidate => candidate.id === selected)) {
        push(`${item.id}: sorteio retornou cenário desconhecido`);
      }
    }
    sandbox.game = { scenarios: [] };
    if (sandbox.pickScenario() !== null) push("caso legado sem scenarios não retorna fallback null");
  }
  if (!/state\.scenario=pickScenario\(\);save\(\)/.test(app)) push("migração de cenário não é persistida");
  if (!/scenario:pickScenario\(previousScenario\)/.test(app)) {
    push("novo estado não persiste cenário evitando o anterior");
  }
  if (!/active\?\.navigation\|\|game\.navigation/.test(app)) {
    push("navegação-base não está preservada para casos legados");
  }
}

function assertCanonicalScenarios() {
  const cifra = game.campaign?.chapters?.cifra;
  if (!cifra?.scenarios) return;
  const root = game.scenarios || [];
  if (JSON.stringify(cifra.scenarios) !== JSON.stringify(root)) {
    push("game.scenarios diverge de campaign.chapters.cifra.scenarios; a fonte canônica é o capítulo");
  }
}

assertCanonicalScenarios();
const chapters = game.campaign ? campaignChapters() : [implicitChapter()];
const tallies = chapters.map(chapter => validateChapter(chapter));
const scenarioCount = tallies.reduce((sum, item) => sum + item.scenarioCount, 0);
const routeCount = tallies.reduce((sum, item) => sum + item.routeCount, 0);
const culprits = tallies.map(item => item.culpritId).filter(Boolean);

if (errors.length) {
  console.error("RANDOM_SCENARIOS_FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `RANDOM_SCENARIOS_PASS chapters=${chapters.length} scenarios=${scenarioCount} routes=${routeCount} culprit=${culprits.join("|")}`,
);
