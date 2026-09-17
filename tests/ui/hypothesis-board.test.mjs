#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const boardApi = require(resolve(candidateRoot, "src/ui/hypothesis-board/hypothesis-board.js"));
const service = require(resolve(candidateRoot, "src/domain/hypotheses/hypothesis-service.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/ui/hypothesis-board/hypothesis-board.js"), "utf8");
const esmApi = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

const hypotheses = [
  {
    id: "HYP-0001",
    type: "authorship",
    statement: "Byte pode ter praticado o fato.",
    supports: ["E03"],
    contradictions: ["E06"],
    confidence: "medium",
    status: "supported",
  },
  {
    id: "HYP-0002",
    type: "authorship",
    statement: "Cifra pode ter praticado o mesmo fato.",
    supports: [],
    contradictions: [],
    confidence: "low",
    status: "active",
  },
  {
    id: "HYP-0003",
    type: "route",
    statement: "A rota passou por Recife.",
    supports: [],
    contradictions: ["E05"],
    confidence: "high",
    status: "refuted",
  },
];
const evidenceMap = {
  E03: { id: "E03", title: "Laudo" },
  E06: { id: "E06", title: "Álibi" },
  E05: { id: "E05", title: "Bilhete" },
};

const failures = [];
let tests = 0;
function check(label, condition) {
  tests += 1;
  if (!condition) failures.push(label);
}

const empty = boardApi.buildHypothesisBoardHTML([], {});
check("INV-HB-001 empty returns HTML", typeof empty === "string" && empty.includes("Nenhuma hipótese declarada"));
check("INV-HB-001 empty has no card", !empty.includes("hypothesis-board__card"));

const html = boardApi.buildHypothesisBoardHTML(hypotheses, evidenceMap);
check("INV-HB-002 supported appears in Sustentada", /Sustentada[\s\S]*HYP-0001/.test(html) && /Sustentada[\s\S]*Byte pode ter praticado o fato/.test(html));
check("INV-HB-003 refuted appears in Refutada", /Refutada[\s\S]*HYP-0003/.test(html) && html.includes("A rota passou por Recife."));
check("INV-HB-003 refuted is not omitted", html.includes('data-status="refuted"') && html.includes("HYP-0003"));
check("INV-HB-004 support evidence labeled favorável", /data-role="supports"[\s\S]*favorável/.test(html) && html.includes("E03"));
check("INV-HB-005 contradiction labeled contraditória", /data-role="contradicts"[\s\S]*contraditória/.test(html) && html.includes("E06"));
check(
  "INV-HB-006 confidence is a visual indicator, not guilt percent",
  html.includes('data-confidence="medium"') &&
    html.includes("Confiança declarada: média") &&
    !html.includes("%") &&
    !/probabilidade de culpa/i.test(html)
);
check("INV-HB-007 no automatic culprit wording", !/culpado/i.test(html));
check(
  "INV-HB-008 competing same-type hypotheses are two cards",
  (html.match(/hypothesis-board__card/g) || []).length === 3 &&
    html.includes("HYP-0001") &&
    html.includes("HYP-0002") &&
    /data-type="authorship"[\s\S]*data-type="authorship"/.test(html)
);
check("INV-HB-009 no inline scripts", !/<script|on(?:click|keydown)=/i.test(html));
check("INV-HB-010 deterministic", boardApi.buildHypothesisBoardHTML(hypotheses, evidenceMap) === html);

check(
  "external text escaped",
  !boardApi.buildHypothesisBoardHTML(
    [{ id: "HYP-X", type: "method", statement: "<img src=x onerror=alert(1)>", supports: [], contradictions: [], confidence: "low", status: "active" }],
    {}
  ).includes("<img")
);
check("high confidence indicator present", html.includes('data-confidence="high"') && html.includes("Confiança declarada: alta"));
check("active group label", html.includes("Em análise") && /Em análise[\s\S]*HYP-0002/.test(html));
check("weakened group exists even if empty", html.includes('data-status="weakened"') && html.includes("Enfraquecida"));
check("inconclusive group exists even if empty", html.includes('data-status="inconclusive"') && html.includes("Inconclusiva"));

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
const game = { evidenceMap, marker: "must-not-change" };
const before = JSON.stringify({ hypotheses, game });
const root = boardApi.renderHypothesisBoard(container, { hypotheses }, game);
const nodes = descendants(root);
const cards = nodes.filter((node) => node.className === "hypothesis-board__card");
check("DOM uses one card per hypothesis", cards.length === 3);
const supportedCard = cards.find((card) => card.getAttribute("data-hypothesis-id") === "HYP-0001");
check("DOM statement uses textContent", supportedCard && supportedCard.children[0].textContent.includes("Byte pode ter praticado o fato."));
check("render does not mutate inputs", JSON.stringify({ hypotheses, game }) === before);
check("cards are tabbable", cards.every((card) => card.children[0].tabIndex === 0));

const firstButton = cards[0].children[0];
const firstDetails = cards[0].children[1];
const enterEvent = firstButton.dispatch("keydown", "Enter");
check("Enter expands details", firstDetails.hidden === false && firstButton.getAttribute("aria-expanded") === "true" && enterEvent.prevented);
const spaceEvent = firstButton.dispatch("keydown", " ");
check("Space collapses details", firstDetails.hidden === true && spaceEvent.prevented);
firstButton.dispatch("click");
check("click expands details", firstDetails.hidden === false);

const authorshipCards = cards.filter((card) => card.getAttribute("data-type") === "authorship");
authorshipCards[0].children[0].dispatch("keydown", "ArrowDown");
check("ArrowDown navigates between hypotheses", documentRef.activeElement === cards[1].children[0] || documentRef.activeElement === authorshipCards[1].children[0] || cards.some((card) => card.children[0] === documentRef.activeElement));

const navDocument = new FakeDocument();
const navContainer = new FakeElement(navDocument, "div");
const navRoot = boardApi.renderHypothesisBoard(navContainer, { hypotheses }, game);
const navButtons = descendants(navRoot).filter((node) => node.tagName === "BUTTON");
navButtons[0].dispatch("keydown", "ArrowDown");
check("ArrowDown moves to next hypothesis header", navDocument.activeElement === navButtons[1]);
navButtons[1].dispatch("keydown", "ArrowUp");
check("ArrowUp moves to previous hypothesis header", navDocument.activeElement === navButtons[0]);

const controllerContainer = new FakeElement(new FakeDocument(), "div");
const controller = boardApi.createHypothesisBoardController(controllerContainer, { hypotheses: [] }, { evidenceMap });
const created = controller.addHypothesis("authorship", "Null pode ter praticado o fato.");
check("controller addHypothesis uses the service", created && created.id && created.statement === "Null pode ter praticado o fato.");
check("controller addHypothesis is active with low confidence", created.status === "active" && created.confidence === "low");
const afterAdd = descendants(controllerContainer).filter((node) => node.className === "hypothesis-board__card");
check("controller refresh shows declared hypothesis", afterAdd.length >= 1);

const linked = controller.linkEvidence(created.id, "E03", "supports");
check("controller linkEvidence records support", linked.supports.includes("E03"));
const supportNode = descendants(controllerContainer).find((node) => node.getAttribute && node.getAttribute("data-role") === "supports");
check("controller linked evidence appears as favorável", supportNode && supportNode.textContent.includes("favorável"));

const removed = controller.removeEvidence(created.id, "E03");
check("controller removeEvidence is local overlay", removed.hypotheses[0].supports.includes("E03") === false);
check("controller never mutates game", JSON.stringify(game) === JSON.stringify({ evidenceMap, marker: "must-not-change" }));

check("ESM exports builder", typeof esmApi.buildHypothesisBoardHTML === "function");
check("ESM output parity", esmApi.buildHypothesisBoardHTML(hypotheses, evidenceMap) === html);
check("ESM exports renderer", typeof esmApi.renderHypothesisBoard === "function");
check("ESM exports controller", typeof esmApi.createHypothesisBoardController === "function");
check("ESM has no import statements", !/\bimport\s/.test(esmSource));
check("service still exports createHypothesis", typeof service.createHypothesis === "function");

const missingContainer = {};
let threw = false;
try { boardApi.renderHypothesisBoard(missingContainer, { hypotheses: [] }, {}); } catch (error) {
  threw = error instanceof TypeError;
}
check("invalid container throws TypeError", threw);

if (failures.length) {
  console.error("HYPOTHESIS_BOARD_FAIL tests=" + failures.length);
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("HYPOTHESIS_BOARD_PASS tests=" + tests);
