#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidate = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const constraints = require(resolve(candidate, "src/domain/constraints/territorial-constraints.js"));
const esmSource = await readFile(resolve(candidate, "dist/modules/territorial-constraints.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));
const catalog = JSON.parse(await readFile(resolve(workspace, "content/territories/brazil-states.json"), "utf8"));

const fixture = structuredClone(catalog);
const sp = fixture.states.find((state) => state.stateId === "SP");
sp.investigativeAttributes.airports = ["GRU", { id: "CGH", name: "Congonhas" }];
sp.investigativeAttributes.highways = [{ code: "BR-116" }];
sp.investigativeAttributes.biomes = [{ name: "Mata Atlântica" }];
sp.investigativeAttributes.economicSectors = [42, true];

const failures = [];
let tests = 0;
function check(label, condition) {
  tests += 1;
  if (!condition) failures.push(label);
}
function shape(value) {
  return value && ["MATCH", "NO_MATCH", "UNKNOWN"].includes(value.result) && typeof value.explanation === "string" && value.explanation.length > 0;
}

check("catalog has 27 states", catalog.states.length === 27);
check("matchRegion MATCH", constraints.matchRegion("SP", "Sudeste", catalog).result === "MATCH");
check("matchRegion NO_MATCH", constraints.matchRegion("SP", "Sul", catalog).result === "NO_MATCH");
check("matchRegion case and accent normalization", constraints.matchRegion("sp", "SUDESTE", catalog).result === "MATCH");
check("matchRegion unknown state", constraints.matchRegion("XX", "Sul", catalog).result === "UNKNOWN");
check("matchRegion missing state", constraints.matchRegion(null, "Sul", catalog).result === "UNKNOWN");
check("matchRegion missing region", constraints.matchRegion("SP", null, catalog).result === "UNKNOWN");
check("matchRegion malformed catalog", constraints.matchRegion("SP", "Sudeste", {}).result === "UNKNOWN");
check("matchRegion shape", shape(constraints.matchRegion("AM", "Norte", catalog)));

check("matchState MATCH", constraints.matchState("SP", "SP").result === "MATCH");
check("matchState normalized", constraints.matchState(" sp ", "SP").result === "MATCH");
check("matchState NO_MATCH", constraints.matchState("SP", "RJ").result === "NO_MATCH");
check("matchState missing actual", constraints.matchState(undefined, "RJ").result === "UNKNOWN");
check("matchState missing target", constraints.matchState("SP", "").result === "UNKNOWN");
check("matchState shape", shape(constraints.matchState("SP", "RJ")));

check("matchInfrastructure string MATCH", constraints.matchInfrastructure("SP", "airports", "GRU", fixture).result === "MATCH");
check("matchInfrastructure object id MATCH", constraints.matchInfrastructure("SP", "airports", "CGH", fixture).result === "MATCH");
check("matchInfrastructure object code MATCH", constraints.matchInfrastructure("SP", "highways", "BR-116", fixture).result === "MATCH");
check("matchInfrastructure accent normalization", constraints.matchInfrastructure("SP", "biomes", "mata atlantica", fixture).result === "MATCH");
check("matchInfrastructure number MATCH", constraints.matchInfrastructure("SP", "economicSectors", 42, fixture).result === "MATCH");
check("matchInfrastructure boolean MATCH", constraints.matchInfrastructure("SP", "economicSectors", true, fixture).result === "MATCH");
check("matchInfrastructure NO_MATCH", constraints.matchInfrastructure("SP", "airports", "BSB", fixture).result === "NO_MATCH");
check("matchInfrastructure empty means UNKNOWN", constraints.matchInfrastructure("RJ", "airports", "GIG", fixture).result === "UNKNOWN");
check("matchInfrastructure unknown state", constraints.matchInfrastructure("XX", "airports", "GRU", fixture).result === "UNKNOWN");
check("matchInfrastructure unknown field", constraints.matchInfrastructure("SP", "ports", "Santos", fixture).result === "UNKNOWN");
check("matchInfrastructure missing value", constraints.matchInfrastructure("SP", "airports", null, fixture).result === "UNKNOWN");
check("matchInfrastructure malformed catalog", constraints.matchInfrastructure("SP", "airports", "GRU", null).result === "UNKNOWN");
check("matchInfrastructure shape", shape(constraints.matchInfrastructure("SP", "airports", "GRU", fixture)));

check("ESM matchRegion", esm.matchRegion("PE", "Nordeste", catalog).result === "MATCH");
check("ESM matchState", esm.matchState("PE", "SP").result === "NO_MATCH");
check("ESM matchInfrastructure", esm.matchInfrastructure("SP", "highways", "BR-116", fixture).result === "MATCH");

if (failures.length) {
  console.error("TERRITORIAL_CONSTRAINTS_FAIL tests=" + failures.length);
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("TERRITORIAL_CONSTRAINTS_PASS tests=" + tests);
