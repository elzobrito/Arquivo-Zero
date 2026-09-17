#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const api = require(resolve(candidateRoot, "src/ui/report-editor/report-editor.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/ui/report-editor/report-editor.js"), "utf8");
const esmApi = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

const failures = [];
let tests = 0;
function check(label, condition) {
  tests += 1;
  if (!condition) failures.push(label);
}

const empty = api.buildReportEditorHTML({}, [], {});
const headings = [
  "Fatos observados",
  "Cronologia",
  "Rota reconstruída",
  "Hipóteses selecionadas",
  "Suspeito indicado",
  "Contradições",
  "Limitações",
  "Conclusão",
];
check("INV-RE-001 empty has 8 sections", headings.every((title) => empty.includes(title)) && (empty.match(/report-editor__section/g) || []).length === 8);

const invalid = api.validateReport({ evidenceIds: [], conclusion: "x", suspectId: "cifra" });
check("INV-RE-002 empty evidence invalid", invalid.valid === false && invalid.missing.includes("evidenceIds"));

const valid = api.validateReport({
  evidenceIds: ["E01"],
  suspectId: "cifra",
  conclusion: "Há suporte observado, sem afirmar vitória automática.",
});
check("INV-RE-003 complete draft valid", valid.valid === true && valid.missing.length === 0);

const html = api.buildReportEditorHTML(
  {
    evidenceIds: ["E01"],
    hypothesisIds: ["HYP-0001"],
    conclusion: "Rascunho",
    facts: ["E01"],
  },
  [{ id: "HYP-0001", statement: "Cifra pode ter praticado o fato.", contradictions: ["E06"] }],
  { E01: { id: "E01", title: "Laudo" }, E06: { id: "E06", title: "Álibi" } }
);
check("INV-RE-004 distinct fact/interpretation classes", html.includes("report-editor__fact") && html.includes("report-editor__interpretation"));
check("INV-RE-005 no automatic culprit", !/culpado/i.test(html));
check("INV-RE-006 no inline scripts", !/<script|on(?:click|keydown)=/i.test(html));
check("INV-RE-010 deterministic", api.buildReportEditorHTML({ evidenceIds: ["E01"] }, [], {}) === api.buildReportEditorHTML({ evidenceIds: ["E01"] }, [], {}));
check("XSS escaped", !api.buildReportEditorHTML({ conclusion: "<img src=x onerror=alert(1)>" }, [], {}).includes("<img"));

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.className = "";
    this._textContent = "";
  }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener() {}
  set textContent(value) { this._textContent = String(value); this.children = []; }
  get textContent() { return this._textContent; }
}
class FakeDocument {
  constructor() { this.activeElement = null; }
  createElement(tagName) { return new FakeElement(this, tagName); }
}

const state = { evidence: [], hypotheses: [], marker: "keep" };
const game = { culprit: "cifra", evidenceMap: {}, marker: "keep" };
const before = JSON.stringify({ state, game });
const container = new FakeElement(new FakeDocument(), "div");
const controller = api.createReportController(container, state, game);
controller.addEvidence("E01");
controller.addEvidence("E01");
check("INV-RE-008 addEvidence idempotent", controller.getReportDraft().evidenceIds.filter((id) => id === "E01").length === 1);
controller.removeEvidence("E01");
controller.removeEvidence("E01");
check("INV-RE-008 removeEvidence idempotent", controller.getReportDraft().evidenceIds.indexOf("E01") === -1);

const draft = controller.getReportDraft();
draft.conclusion = "MUTATION";
check("INV-RE-007 getReportDraft is a copy", controller.getReportDraft().conclusion !== "MUTATION");
check("INV-RE-007 does not mutate state/game", JSON.stringify({ state, game }) === before);

controller.setConclusion("");
check("INV-RE-009 empty conclusion invalid", controller.validateReport().valid === false);
controller.addEvidence("E03");
controller.setConclusion("Texto");
const stillInvalid = controller.validateReport();
check("valid still requires suspect", stillInvalid.valid === false && stillInvalid.missing.includes("suspectId"));

check("ESM builder", typeof esmApi.buildReportEditorHTML === "function");
check("ESM parity empty headings", headings.every((title) => esmApi.buildReportEditorHTML({}, [], {}).includes(title)));
check("ESM no import", !/\bimport\s/.test(esmSource));
check("controller exports", typeof controller.addFact === "function" && typeof controller.selectHypothesis === "function");

if (failures.length) {
  console.error("REPORT_EDITOR_FAIL tests=" + failures.length);
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}
console.log("REPORT_EDITOR_PASS tests=" + tests);
