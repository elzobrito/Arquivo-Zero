#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const { renderEvidenceDetails, escapeHtml } = require(resolve(root, "src/ui/evidence/evidence-details.js"));

const errors = [];
const check = (label, cond) => { if (!cond) errors.push(label); };

check("ESC-001 escapes html", escapeHtml("<script>") === "&lt;script&gt;");

const html = renderEvidenceDetails({
  id: "E01",
  title: "T",
  tag: "x",
  fact: "fato",
  interpretation: null,
  interpretationLabel: "Desconhecido",
  origin: "Não informado",
  method: "Não informado",
  chapter: "Não informado",
  scenarioId: "S1",
  qualityLabel: "Não informado",
  admissibilityLabel: "Não informado",
  integrityLabel: "Não verificada",
  relations: [],
  contradictions: [],
  policyNotes: ["nota"],
  canSupportArrest: true,
  essential: false,
});

check("A11Y-001 fact region", /aria-label="Fato"|ev-fact|class="ev-section ev-fact"/.test(html));
check("A11Y-002 interpretation region", /Interpretação|ev-interpretation/.test(html));
check("A11Y-003 fact before interpretation", html.indexOf("Fato") < html.indexOf("Interpretação"));
check("A11Y-004 disclaimer", /Identificar|≠|provar|autoria/.test(html));
check("A11Y-005 title", /ev-detail-title|id="ev-detail-title"/.test(html));

const index = readFileSync(resolve(root, "dist/index.html"), "utf8");
check("HTML-001 board host", index.includes('id="evidence-board-host"'));
check("HTML-002 board script", index.includes("modules/ui/evidence/evidence-board.js"));
check("HTML-003 legacy list hidden", /id="evidence-list"[^>]*(hidden|aria-hidden)/.test(index));

const boardJs = readFileSync(resolve(root, "dist/modules/ui/evidence/evidence-board.js"), "utf8");
check("KB-001 arrow keys", boardJs.includes("ArrowDown") && boardJs.includes("ArrowUp"));
check("KB-002 listbox", boardJs.includes('role="listbox"') && boardJs.includes('role="option"'));

if (errors.length) {
  console.error("EVIDENCE_A11Y_FAIL");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}
console.log("EVIDENCE_A11Y_PASS tests=11");
