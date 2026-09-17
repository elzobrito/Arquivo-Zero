#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const panelApi = require(resolve(candidateRoot, "src/ui/constraint-panel/constraint-panel.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/ui/constraint-panel/constraint-panel.js"), "utf8");
const esmApi = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

const candidates = [
  { id: "byte", result: "MATCH", explanations: [{ field: "methods", explanation: "token compatível" }] },
  { id: "null", result: "NO_MATCH", explanations: [{ field: "mobility", explanation: "rota incompatível" }] },
  { id: "vertice", result: "UNKNOWN", explanations: [{ field: "alibi", explanation: "informação ausente" }] },
];
const constraints = [
  { constraintId: "C01", field: "methods", operator: "contains", value: "token", evidenceId: "E01" },
];

const failures = [];
let tests = 0;
function check(label, condition) {
  tests += 1;
  if (!condition) failures.push(label);
}

const empty = panelApi.buildConstraintPanelHTML([], []);
check("INV-CP-001 empty returns HTML", typeof empty === "string" && empty.includes("Nenhum candidato"));
check("INV-CP-001 empty has no card", !empty.includes("constraint-panel__card"));

const html = panelApi.buildConstraintPanelHTML(candidates, constraints);
check("INV-CP-002 MATCH in compatible group", /Compatíveis[\s\S]*byte/.test(html));
check("INV-CP-003 NO_MATCH in incompatible group", /Incompatíveis[\s\S]*null/.test(html));
check("INV-CP-004 UNKNOWN in indeterminate group", /Indeterminados[\s\S]*vertice/.test(html));
check("INV-CP-005 NO_MATCH explanation accessible", html.includes("rota incompatível") && html.includes("aria-expanded"));
check("INV-CP-006 all candidates remain visible", ["byte", "null", "vertice"].every((id) => html.includes(id)));
check("INV-CP-007 no automatic answer wording", !/culpado|solução/i.test(html));
check("INV-CP-008 no inline scripts", !/<script|on(?:click|keydown)=/i.test(html));
check("INV-CP-010 deterministic", panelApi.buildConstraintPanelHTML(candidates, constraints) === html);
check("external text escaped", !panelApi.buildConstraintPanelHTML([{ id: "<img src=x onerror=alert(1)>", result: "MATCH" }], []).includes("<img"));

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.className = "";
    this.tabIndex = -1;
    this._textContent = "";
  }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatch(type, key) {
    const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
    for (const listener of this.listeners[type] || []) listener(event);
    return event;
  }
  focus() { this.ownerDocument.activeElement = this; }
  set textContent(value) { this._textContent = String(value); this.children = []; }
  get textContent() { return this._textContent; }
}

class FakeDocument {
  constructor() { this.activeElement = null; }
  createElement(tagName) { return new FakeElement(this, tagName); }
}

function descendants(node) {
  return [node].concat(node.children.flatMap(descendants));
}

const documentRef = new FakeDocument();
const container = new FakeElement(documentRef, "div");
const game = { constraints, marker: "must-not-change" };
const before = JSON.stringify({ candidates, game });
const root = panelApi.renderConstraintPanel(container, candidates, constraints);
const nodes = descendants(root);
const cards = nodes.filter((node) => node.className === "constraint-panel__card");
check("DOM uses one card per candidate", cards.length === 3);
check("DOM external data uses textContent", cards[0].children[0].textContent === "byte");
check("render does not mutate inputs", JSON.stringify({ candidates, game }) === before);

const matchFilter = nodes.find((node) => node.getAttribute("data-filter") === "match" && node.tagName === "BUTTON");
matchFilter.dispatch("click");
const groups = nodes.filter((node) => node.className === "constraint-panel__group");
check("INV-CP-009 filter hides only presentation", groups.find((node) => node.getAttribute("data-result") === "match").hidden === false && groups.filter((node) => node.getAttribute("data-result") !== "match").every((node) => node.hidden));
check("INV-CP-009 filter keeps DOM candidates", descendants(root).filter((node) => node.className === "constraint-panel__card").length === 3);

const matchCardButton = cards[0].children[0];
const matchDetails = cards[0].children[1];
const enterEvent = matchCardButton.dispatch("keydown", "Enter");
check("Enter expands explanations", matchDetails.hidden === false && matchCardButton.getAttribute("aria-expanded") === "true" && enterEvent.prevented);
const spaceEvent = matchCardButton.dispatch("keydown", " ");
check("Space collapses explanations", matchDetails.hidden === true && spaceEvent.prevented);
matchCardButton.dispatch("click");
check("click expands explanations", matchDetails.hidden === false);

const sameGroupCandidates = [
  candidates[0],
  { id: "cifra", result: "MATCH", explanations: [] },
];
const navContainer = new FakeElement(documentRef, "div");
const navRoot = panelApi.renderConstraintPanel(navContainer, sameGroupCandidates, []);
const navCards = descendants(navRoot).filter((node) => node.className === "constraint-panel__card");
navCards[0].children[0].dispatch("keydown", "ArrowDown");
check("ArrowDown navigates inside group", documentRef.activeElement === navCards[1].children[0]);
navCards[1].children[0].dispatch("keydown", "ArrowUp");
check("ArrowUp navigates inside group", documentRef.activeElement === navCards[0].children[0]);
check("cards are tabbable", navCards.every((card) => card.children[0].tabIndex === 0));

const controllerContainer = new FakeElement(documentRef, "div");
const controller = panelApi.createPanelController(controllerContainer, candidates, game);
const added = controller.addConstraint("C01");
check("controller adds selected constraint locally", added.activeConstraints.length === 1 && added.activeConstraints[0].constraintId === "C01");
const duplicate = controller.addConstraint("C01");
check("controller add is idempotent", duplicate.activeConstraints.length === 1);
const removed = controller.removeConstraint("C01");
check("controller removes selected constraint", removed.activeConstraints.length === 0);
check("controller never mutates game", JSON.stringify({ candidates, game }) === before);

check("ESM exports builder", typeof esmApi.buildConstraintPanelHTML === "function");
check("ESM output parity", esmApi.buildConstraintPanelHTML(candidates, constraints) === html);
check("ESM exports renderer", typeof esmApi.renderConstraintPanel === "function");
check("ESM exports controller", typeof esmApi.createPanelController === "function");

if (failures.length) {
  console.error("CONSTRAINT_PANEL_FAIL tests=" + failures.length);
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("CONSTRAINT_PANEL_PASS tests=" + tests);
