#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const { buildEvidenceBoard } = require(resolve(root, "src/application/evidence/build-evidence-board.js"));
const { createBoardController } = require(resolve(root, "src/ui/evidence/evidence-board.js"));

const errors = [];
const check = (label, cond) => { if (!cond) errors.push(label); };

const game = {
  evidence: [
    { id: "E01", title: "A", text: "fato A", tag: "t1", admissibility: "unknown", quality: null, integrity: "unverified" },
    { id: "E02", title: "B", text: "fato B", tag: "t2", admissibility: "inadmissible", quality: 0.2, integrity: "verified", interpretation: "talvez" },
    { id: "E03", title: "C", text: "oculto", tag: "t1", admissibility: "admissible", quality: 1, integrity: "verified" },
  ],
  scenarios: [{ id: "S1", evidence_overrides: { E01: { title: "A+" } } }],
  arrest_requirements: { required_evidence: ["E01"] },
};
const state = { evidence: ["E01", "E02"], scenario: "S1" };
const board = buildEvidenceBoard(state, game, {});

check("DISC-001 only discovered", board.totalDiscovered === 2 && board.items.length === 2);
check("DISC-002 hidden not present", !board.items.some((i) => i.id === "E03"));
check("DISC-003 inadmissible visible", board.items.some((i) => i.id === "E02"));
check("OVRD-001 scenario title", board.items.find((i) => i.id === "E01").title === "A+");
check("POL-001 unknown can support", board.items.find((i) => i.id === "E01").canSupportArrest === true);
check("POL-002 inadmissible cannot", board.items.find((i) => i.id === "E02").canSupportArrest === false);
check(
  "VM-001 interpretation labels",
  board.items.find((i) => i.id === "E01").interpretationLabel === "Desconhecido" &&
    board.items.find((i) => i.id === "E02").interpretationLabel === "talvez"
);
check("VM-002 essential flag", board.items.find((i) => i.id === "E01").essential === true);

const ctrl = createBoardController();
ctrl.setFilter("admissibility", "inadmissible");
const view = ctrl.refresh(state, game);
check("CTRL-001 filter inadmissible", view.payload.visibleCount === 1 && view.selectedId === "E02");

const before = JSON.stringify(state.evidence);
ctrl.setFilter("query", "zzz");
ctrl.refresh(state, game);
check("IMMUT-002 state evidence untouched", JSON.stringify(state.evidence) === before);

if (errors.length) {
  console.error("EVIDENCE_BOARD_FAIL");
  errors.forEach((e) => console.error("-", e));
  process.exit(1);
}
console.log("EVIDENCE_BOARD_PASS tests=10");
