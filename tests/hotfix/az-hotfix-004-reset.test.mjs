#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const app = await readFile(resolve(root, "dist/app.js"), "utf8");
const html = await readFile(resolve(root, "dist/index.html"), "utf8");
const errors = [];
if (app.includes("Reiniciar toda a investigação")) errors.push("copy antigo de reset permanece");
for (const fn of ["resetChapter", "resetCampaign", "resetCareer"]) {
  if (!app.includes(`function ${fn}()`)) errors.push(`ausente ${fn}`);
}
if (!app.includes("A campanha e as estrelas são preservadas")) errors.push("capítulo não declara o que preserva");
if (!app.includes("As estrelas são preservadas")) errors.push("campanha não declara preservação de estrelas");
if (!app.includes("O capítulo e a campanha atuais permanecem")) errors.push("carreira não declara o que permanece");
if (app.includes("localStorage.removeItem(CAREER)") && !app.includes("function resetCareer()")) {
  errors.push("CAREER removido fora de resetCareer");
}
for (const id of ["reset-button", "reset-campaign-button", "reset-career-button"]) {
  if (!html.includes(`id="${id}"`)) errors.push(`html sem ${id}`);
}
if (errors.length) {
  console.error("AZ-HOTFIX-004 FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("AZ-HOTFIX-004 PASS");
