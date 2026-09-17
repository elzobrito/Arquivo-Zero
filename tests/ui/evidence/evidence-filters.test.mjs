#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const {
  applyFilters,
  applySort,
  uniqueTags,
  DEFAULT_FILTERS,
} = require(resolve(root, "src/ui/evidence/evidence-filters.js"));

const errors = [];
const check = (label, cond) => { if (!cond) errors.push(label); };

const models = [
  { id: "E02", title: "Beta", tag: "documento", admissibility: "admissible", integrity: "verified", quality: 0.9, canSupportArrest: true, fact: "fato b", interpretationLabel: "i", source: "s", method: "m" },
  { id: "E01", title: "Alpha", tag: "especialidade", admissibility: "inadmissible", integrity: "compromised", quality: null, canSupportArrest: false, fact: "fato a", interpretationLabel: "Desconhecido", source: "s", method: "m" },
  { id: "E03", title: "Gamma", tag: "documento", admissibility: "unknown", integrity: "unverified", quality: 0.4, canSupportArrest: true, fact: "pista", interpretationLabel: "x", source: "lab", method: "m" },
];

const sorted = applySort(models, { key: "id", dir: "asc" });
check("SORT-001 id asc", sorted.map((m) => m.id).join() === "E01,E02,E03");

const byTag = applyFilters(models, { ...DEFAULT_FILTERS, tag: "documento" });
check("FILT-001 tag documento", byTag.length === 2 && byTag.every((m) => m.tag === "documento"));

const inad = applyFilters(models, { ...DEFAULT_FILTERS, admissibility: "inadmissible" });
check("FILT-002 inadmissible remains", inad.length === 1 && inad[0].id === "E01");

const supportNo = applyFilters(models, { ...DEFAULT_FILTERS, support: "no" });
check("FILT-003 support no", supportNo.length === 1 && supportNo[0].id === "E01");

const q = applyFilters(models, { ...DEFAULT_FILTERS, query: "alpha" });
check("FILT-004 query", q.length === 1 && q[0].id === "E01");

const orig = models.map((m) => m.id).join();
applyFilters(models, { tag: "documento" });
applySort(models, { key: "title", dir: "desc" });
check("IMMUT-001 models untouched", models.map((m) => m.id).join() === orig);
check("TAG-001 unique sorted", uniqueTags(models).join() === "documento,especialidade");

if (errors.length) {
  console.error("EVIDENCE_FILTERS_FAIL");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}
console.log("EVIDENCE_FILTERS_PASS tests=7");
