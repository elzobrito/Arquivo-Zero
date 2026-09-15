#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourcePath = resolve(root, "dist/app.js");
const mapPath = resolve(root, "docs/architecture/function-map.json");
const docsPath = resolve(root, "docs/architecture/function-map.md");

const [source, rawMap, docs] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(mapPath, "utf8"),
  readFile(docsPath, "utf8"),
]);

const map = JSON.parse(rawMap);
const errors = [];
const requiredArrays = [
  "inputs", "calls", "calledBy", "events", "dom", "stateReads",
  "stateWrites", "gamePaths", "storage", "sideEffects", "external",
  "impactAreas",
];
const ids = new Set();

if (map.schemaVersion !== 1) errors.push("schemaVersion deve ser 1");
if (map.source !== "dist/app.js") errors.push("source deve ser dist/app.js");
if (!Array.isArray(map.functions)) errors.push("functions deve ser um array");
const sourceSha256 = createHash("sha256").update(source).digest("hex");
if (map.sourceSha256 !== sourceSha256) {
  errors.push(`sourceSha256 obsoleto: mapa=${map.sourceSha256} atual=${sourceSha256}`);
}

for (const fn of map.functions || []) {
  if (!/^((FN)|(CB))-\d{3}$/.test(fn.id || "")) {
    errors.push(`ID inválido: ${fn.id || "<ausente>"}`);
  } else if (ids.has(fn.id)) {
    errors.push(`ID duplicado: ${fn.id}`);
  } else {
    ids.add(fn.id);
  }
  if (!["function", "arrow", "function-expression"].includes(fn.kind)) {
    errors.push(`${fn.id}: kind inválido`);
  }
  for (const field of ["name", "signature", "responsibility", "returns"]) {
    if (typeof fn[field] !== "string" || !fn[field]) errors.push(`${fn.id}: ${field} ausente`);
  }
  for (const field of requiredArrays) {
    if (!Array.isArray(fn[field])) errors.push(`${fn.id}: ${field} deve ser array`);
  }
  if (!fn.source || fn.source.file !== "dist/app.js" || !Number.isInteger(fn.source.line)) {
    errors.push(`${fn.id}: source inválido`);
    continue;
  }
  if (typeof fn.source.anchor !== "string" || !fn.source.anchor) {
    errors.push(`${fn.id}: anchor ausente`);
    continue;
  }
  const first = source.indexOf(fn.source.anchor);
  const second = first < 0 ? -1 : source.indexOf(fn.source.anchor, first + 1);
  if (first < 0) {
    errors.push(`${fn.id}: anchor obsoleto ou ausente`);
  } else {
    const line = source.slice(0, first).split("\n").length;
    if (line !== fn.source.line) errors.push(`${fn.id}: linha esperada ${fn.source.line}, atual ${line}`);
    if (second >= 0) errors.push(`${fn.id}: anchor não é único`);
  }
  if (!docs.includes(`\`${fn.id}\``)) errors.push(`${fn.id}: ausente do mapa Markdown`);
}

for (const fn of map.functions || []) {
  for (const relation of [...(fn.calls || []), ...(fn.calledBy || [])]) {
    if (!ids.has(relation)) errors.push(`${fn.id}: relação aponta para ID inexistente ${relation}`);
  }
}

const expectedFunctions = (source.match(/\bfunction\b/g) || []).length;
const expectedArrows = (source.match(/=>/g) || []).length;
const mappedFunctions = (map.functions || []).filter(fn =>
  fn.kind === "function" || fn.kind === "function-expression"
).length;
const mappedArrows = (map.functions || []).filter(fn => fn.kind === "arrow").length;

if (expectedFunctions !== mappedFunctions) {
  errors.push(`cobertura function: fonte=${expectedFunctions}, mapa=${mappedFunctions}`);
}
if (expectedArrows !== mappedArrows) {
  errors.push(`cobertura arrow: fonte=${expectedArrows}, mapa=${mappedArrows}`);
}
if ((map.functions || []).length !== mappedFunctions + mappedArrows) {
  errors.push("há entradas não contabilizadas por kind");
}

const inventory = map.inventory || {};
if (inventory.total !== (map.functions || []).length) {
  errors.push(`inventory.total=${inventory.total}, entradas=${(map.functions || []).length}`);
}
if (inventory.functions !== mappedFunctions) {
  errors.push(`inventory.functions=${inventory.functions}, mapeadas=${mappedFunctions}`);
}
if (inventory.arrows !== mappedArrows) {
  errors.push(`inventory.arrows=${inventory.arrows}, mapeadas=${mappedArrows}`);
}
if (typeof map.lastUpdatedForTask !== "string" || !map.lastUpdatedForTask) {
  errors.push("lastUpdatedForTask ausente");
}
if (!docs.includes(sourceSha256)) {
  errors.push("SHA-256 do Markdown diverge da fonte");
}

const validation = docs.split("## Validação")[1] || "";
if (!validation) {
  errors.push("seção Validação ausente no Markdown");
} else {
  if (!validation.includes(String((map.functions || []).length))) {
    errors.push("parágrafo de Validação não cita o total atual");
  }
  if (!validation.includes(String(mappedFunctions))) {
    errors.push("parágrafo de Validação não cita o total de function atual");
  }
  if (!validation.includes(String(mappedArrows))) {
    errors.push("parágrafo de Validação não cita o total de arrows atual");
  }
  if (mappedFunctions !== 25 && /25 ocorrências de `function`/.test(validation)) {
    errors.push("parágrafo de Validação com contagem obsoleta de function");
  }
  if ((map.functions || []).length !== 58 && /58 entradas/.test(validation)) {
    errors.push("parágrafo de Validação com total obsoleto de 58 entradas");
  }
}

const byId = Object.fromEntries((map.functions || []).map(fn => [fn.id, fn]));
for (const fn of map.functions || []) {
  for (const callee of fn.calls || []) {
    const target = byId[callee];
    if (target && !(target.calledBy || []).includes(fn.id)) {
      errors.push(`${fn.id} chama ${callee}, mas ${callee}.calledBy não lista ${fn.id}`);
    }
  }
  for (const caller of fn.calledBy || []) {
    const sourceFn = byId[caller];
    if (sourceFn && !(sourceFn.calls || []).includes(fn.id)) {
      errors.push(`${fn.id}.calledBy lista ${caller}, mas ${caller}.calls não lista ${fn.id}`);
    }
  }
}

if (errors.length) {
  console.error("FUNCTION_MAP_FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `FUNCTION_MAP_PASS total=${map.functions.length} functions=${mappedFunctions} arrows=${mappedArrows}`,
);
