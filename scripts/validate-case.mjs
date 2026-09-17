#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const { validateCase } = require("../src/infrastructure/schema/schema-validator.js");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "docs/architecture/schemas/case-campaign-schema.json");

function pointerPath(error) {
  const pointer = error.instancePath || "";
  const segments = pointer.split("/").filter(Boolean).map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (error.keyword === "required" && error.params?.missingProperty) segments.push(error.params.missingProperty);
  return segments.join(".");
}

function validatePublishedDocument(raw) {
  const semantic = validateCase(raw);
  if (!String(raw?.schemaVersion || "").startsWith("3")) return semantic;

  const schema = JSON.parse(require("node:fs").readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  if (!ajv.validateSchema(schema)) {
    return {
      status: "FAIL",
      version: semantic.version,
      issues: (ajv.errors || []).map((error) => ({
        path: pointerPath(error) || "$schema",
        message: `Schema Draft-07 inválido: ${error.message}.`,
        severity: "error",
      })),
    };
  }

  const validateDocument = ajv.compile(schema);
  validateDocument(raw);
  const schemaIssues = (validateDocument.errors || []).map((error) => ({
    path: pointerPath(error),
    message: `Documento incompatível com schemaVersion 3.0: ${error.message}.`,
    severity: "error",
  }));
  const schemaIssuePaths = new Set(schemaIssues.map((item) => item.path));
  const semanticIssues = semantic.issues.filter((item) => (
    !schemaIssuePaths.has(item.path)
    && (item.severity !== "warning" || item.message !== "Opcional em 3.0; ausente.")
  ));
  const issues = schemaIssues.concat(semanticIssues);
  const status = issues.some((item) => item.severity === "error") ? "FAIL" : issues.length ? "WARN" : "PASS";
  return { status, version: semantic.version, issues };
}

const file = process.argv[2];
if (!file) {
  console.error("uso: node scripts/validate-case.mjs <arquivo.json>");
  process.exit(2);
}

const raw = JSON.parse(await readFile(resolve(process.cwd(), file), "utf8"));
const result = validatePublishedDocument(raw);
const tag = { PASS: "SCHEMA_PASS", WARN: "SCHEMA_WARN", FAIL: "SCHEMA_FAIL" }[result.status];
console.log(`${tag}  version=${result.version}  issues=${result.issues.length}  file=${file}`);
for (const item of result.issues) {
  const line = item.path ? `${item.path}: ${item.message}` : item.message;
  console.log(`- [${item.severity}] ${line}`);
}
process.exit(result.status === "FAIL" ? 1 : 0);
