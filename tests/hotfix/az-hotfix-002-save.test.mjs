#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const src = await readFile(resolve(root, "dist/app.js"), "utf8");
const errors = [];
for (const [label, snippet] of [
  ["isolateSave", "function isolateSave(reason)"],
  ["chave .invalid", ".invalid"],
  ["restoreState", "function restoreState()"],
  ["loadGame usa restoreState", "state=restoreState()"],
  ["guarda de render", 'if(!current){isolateSave("render")'],
  ["sem logar payload", "console.info(\"AZ: save isolado\""],
]) {
  if (!src.includes(snippet)) errors.push(`ausente: ${label}`);
}
if (errors.length) {
  console.error("AZ-HOTFIX-002 FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("AZ-HOTFIX-002 PASS");
