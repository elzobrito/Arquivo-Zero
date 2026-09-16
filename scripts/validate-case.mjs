#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { validateCase } = require("../src/infrastructure/schema/schema-validator.js");

const file = process.argv[2];
if (!file) {
  console.error("uso: node scripts/validate-case.mjs <arquivo.json>");
  process.exit(2);
}

const raw = JSON.parse(await readFile(resolve(process.cwd(), file), "utf8"));
const result = validateCase(raw);
const tag = { PASS: "SCHEMA_PASS", WARN: "SCHEMA_WARN", FAIL: "SCHEMA_FAIL" }[result.status];
console.log(`${tag}  version=${result.version}  issues=${result.issues.length}  file=${file}`);
for (const item of result.issues) {
  const line = item.path ? `${item.path}: ${item.message}` : item.message;
  console.log(`- [${item.severity}] ${line}`);
}
process.exit(result.status === "FAIL" ? 1 : 0);
