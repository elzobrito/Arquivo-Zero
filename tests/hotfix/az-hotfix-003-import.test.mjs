#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const src = await readFile(resolve(root, "dist/app.js"), "utf8");
const errors = [];
if (src.includes("html?c:escape(c)")) errors.push("show ainda interpola HTML cru");
if (!src.includes('escape(c).replace(/\\n/g,"<br>")')) errors.push("show não escapa mensagens");
if (!src.includes("async function importCase(file)")) errors.push("importCase ausente");
if (!src.includes("const max=524288")) errors.push("limite de tamanho ausente");
if (src.includes("JSON.parse(await f.text())")) errors.push("import ainda faz parse direto no input");
if (!src.includes("<h3>${escape(e.title)}</h3>")) errors.push("títulos de evidência sem escape");
if (errors.length) {
  console.error("AZ-HOTFIX-003 FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("AZ-HOTFIX-003 PASS");
