#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workspace = process.env.AZ_WORKSPACE || process.cwd();
const candidateRoot = process.env.AZ_CANDIDATE || workspace;
const require = createRequire(import.meta.url);
const builder = require(resolve(candidateRoot, "src/domain/reports/timeline-builder.js"));
const esmSource = await readFile(resolve(candidateRoot, "dist/modules/timeline-builder.js"), "utf8");
const esm = await import("data:text/javascript;base64," + Buffer.from(esmSource).toString("base64"));

let tests = 0;
function check(label, condition) {
  tests += 1;
  assert.ok(condition, label);
}

const dated = [
  { id: "E-ARRIVE", timestamp: "2026-09-17T12:00:00", description: "Cifra chega a Recife", source: "E04" },
  { id: "E-DEPART", timestamp: "2026-09-17T14:00:00", description: "Cifra embarca em Brasília", source: "HYP-0001", causes: "E-ARRIVE" }
];
const compatible = [
  { id: "A", timestamp: "2026-09-17T10:00:00", description: "Vistoria", source: "E01" },
  { id: "B", timestamp: "2026-09-17T11:00:00", description: "Depoimento", source: "E02" }
];
const mixed = [
  { id: "U1", timestamp: null, description: "Reserva localizada", source: "E04" },
  { id: "D1", timestamp: "2026-09-17T09:00:00", description: "Embarque", source: "E03" }
];

check("exports buildTimeline", typeof builder.buildTimeline === "function");
check("exports detectConflicts", typeof builder.detectConflicts === "function");
check("exports sortTimeline", typeof builder.sortTimeline === "function");

const empty = builder.buildTimeline([]);
check("INV-TL-001 buildTimeline([]) === []", Array.isArray(empty) && empty.length === 0);

const nullStamp = builder.buildTimeline([
  { id: "U1", timestamp: null, description: "Reserva localizada", source: "E04" }
]);
check("INV-TL-002 event with timestamp null remains null", nullStamp.length === 1 && nullStamp[0].timestamp === null);

const mixedSorted = builder.sortTimeline(mixed);
check("INV-TL-003 sortTimeline puts dated events before undated", mixedSorted.length === 2 && mixedSorted[0].id === "D1" && mixedSorted[1].id === "U1");

const compatibleOut = builder.buildTimeline(compatible);
check("INV-TL-004 two compatible timestamps → conflict false on both", compatibleOut.length === 2 && compatibleOut[0].conflict === false && compatibleOut[1].conflict === false);

const conflictOut = builder.buildTimeline(dated);
check("INV-TL-005 reverse causation marks both conflict true", conflictOut.length === 2 && conflictOut.every((item) => item.conflict === true));

check("INV-TL-006 detectConflicts returns [] when no conflict", Array.isArray(builder.detectConflicts(compatible)) && builder.detectConflicts(compatible).length === 0);

const detected = builder.detectConflicts(dated);
check(
  "INV-TL-007 detectConflicts returns the correct pair",
  detected.length === 1 &&
    detected[0].eventA === "E-ARRIVE" &&
    detected[0].eventB === "E-DEPART" &&
    typeof detected[0].reason === "string" &&
    detected[0].reason.length > 0
);

const first = builder.buildTimeline(dated);
const second = builder.buildTimeline(dated);
check("INV-TL-008 buildTimeline deterministic for same input", JSON.stringify(first) === JSON.stringify(second));

check(
  "INV-TL-009 events from distinct sources coexist",
  conflictOut.some((item) => item.source === "E04") && conflictOut.some((item) => item.source === "HYP-0001")
);

const single = builder.buildTimeline([
  { id: "S1", timestamp: null, description: "Nota avulsa", source: "manual" }
]);
check("INV-TL-010 single event without timestamp → timestamp null, conflict false", single.length === 1 && single[0].timestamp === null && single[0].conflict === false);

const snapshot = JSON.stringify(dated);
builder.buildTimeline(dated);
builder.sortTimeline(dated);
builder.detectConflicts(dated);
check("does not mutate input", JSON.stringify(dated) === snapshot);

const frozen = Object.freeze([
  Object.freeze({ id: "A", timestamp: "2026-09-17T10:00:00", description: "Vistoria", source: "E01" }),
  Object.freeze({ id: "B", timestamp: "2026-09-17T11:00:00", description: "Depoimento", source: "E02" })
]);
const frozenOut = builder.buildTimeline(frozen);
check("does not mutate frozen input", frozenOut.length === 2 && frozen[0].id === "A" && frozen[1].id === "B");

check(
  "ESM exports",
  typeof esm.buildTimeline === "function" &&
    typeof esm.detectConflicts === "function" &&
    typeof esm.sortTimeline === "function"
);
check("ESM has no import statements", !/\bimport\s/.test(esmSource));
check("ESM parity empty", esm.buildTimeline([]).length === 0);
check("ESM parity reverse causation", esm.buildTimeline(dated).every((item) => item.conflict === true));
check("ESM parity detectConflicts pair", esm.detectConflicts(dated).length === 1 && esm.detectConflicts(dated)[0].eventA === "E-ARRIVE");
check("ESM parity sort mixed", esm.sortTimeline(mixed)[0].id === "D1" && esm.sortTimeline(mixed)[1].id === "U1");

const emptyString = builder.buildTimeline([
  { id: "E", timestamp: "", description: "sem horário", source: "E01" }
]);
check("empty string timestamp treated as null", emptyString[0].timestamp === null && emptyString[0].order === null);

const undefinedStamp = builder.buildTimeline([
  { id: "M", description: "sem campo de horário", source: "E01" }
]);
check("undefined timestamp becomes null", undefinedStamp[0].timestamp === null);

const ties = [
  { id: "T2", timestamp: "2026-09-17T10:00:00", description: "segundo na entrada", source: "E02" },
  { id: "T1", timestamp: "2026-09-17T10:00:00", description: "terceiro na entrada", source: "E01" }
];
const tied = builder.sortTimeline(ties);
check("stable order of two events with identical timestamps", tied[0].id === "T2" && tied[1].id === "T1");

const unknownOut = builder.buildTimeline([
  { id: "U", timestamp: null, description: "Reserva localizada", source: "E04" }
]);
const unknownJson = JSON.stringify(unknownOut);
check("does not invent ISO dates in output", unknownOut[0].timestamp === null && !/\d{4}-\d{2}-\d{2}T/.test(unknownJson));
check(
  "unknown timestamp label not invented as a date",
  unknownOut[0].timeStatus === "unknown" &&
    unknownOut[0].timeLabel === "horário desconhecido" &&
    !/^\d{4}-\d{2}-\d{2}/.test(String(unknownOut[0].timeLabel))
);

const labeledInput = builder.buildTimeline([
  { id: "L", timestamp: "horário desconhecido", description: "rótulo literal", source: "E01" }
]);
check("literal unknown label is not parsed into an ISO date", labeledInput[0].timestamp === "horário desconhecido");

const builtMixed = builder.buildTimeline(mixed);
check("order 0 for dated event after sort", builtMixed.find((item) => item.id === "D1").order === 0);
check("order null for event without timestamp", builtMixed.find((item) => item.id === "U1").order === null);

const fromEvent = builder.buildTimeline([
  { id: "X", timestamp: "2026-09-17T08:00:00", event: "texto do schema", source: "E01" }
]);
check("description falls back to event", fromEvent[0].description === "texto do schema");

const noSource = builder.buildTimeline([
  { id: "NS", timestamp: null, description: "origem ausente" }
]);
check("missing source is null", noSource[0].source === null);

const clocks = builder.sortTimeline([
  { id: "C2", timestamp: "14:00", description: "tarde", source: "E01" },
  { id: "C1", timestamp: "09:30:00", description: "manhã", source: "E02" }
]);
check("clock times sort chronologically on an abstract day", clocks[0].id === "C1" && clocks[0].timestamp === "09:30:00" && clocks[1].id === "C2");

const reverseClocks = builder.buildTimeline([
  { id: "ARR", timestamp: "12:00", description: "chega", source: "E04" },
  { id: "DEP", timestamp: "14:00", description: "sai", source: "E03", causes: "ARR" }
]);
check("clock reverse causation conflicts", reverseClocks.every((item) => item.conflict === true));

const intervals = builder.buildTimeline([
  { id: "I1", timestamp: { start: "2026-09-17T10:00:00", end: "2026-09-17T12:00:00" }, description: "janela A", source: "E01", exclusive: true },
  { id: "I2", timestamp: { start: "2026-09-17T11:00:00", end: "2026-09-17T13:00:00" }, description: "janela B", source: "E02" }
]);
check("exclusive interval overlap conflicts", intervals.every((item) => item.conflict === true));

const disjoint = builder.detectConflicts([
  { id: "J1", timestamp: "2026-09-17T10:00:00/2026-09-17T12:00:00", description: "faixa A", source: "E01", disjointWith: "J2" },
  { id: "J2", timestamp: { start: "2026-09-17T11:00:00", end: "2026-09-17T13:00:00" }, description: "faixa B", source: "E02" }
]);
check("disjointWith overlapping intervals conflict", disjoint.length === 1 && disjoint[0].eventA === "J1" && disjoint[0].eventB === "J2");

const overlapOk = builder.buildTimeline([
  { id: "O1", timestamp: { start: "2026-09-17T10:00:00", end: "2026-09-17T12:00:00" }, description: "simultâneo A", source: "E01" },
  { id: "O2", timestamp: { start: "2026-09-17T11:00:00", end: "2026-09-17T13:00:00" }, description: "simultâneo B", source: "E02" }
]);
check("overlapping non-exclusive intervals are compatible", overlapOk.every((item) => item.conflict === false));

const arrayCauses = builder.buildTimeline([
  { id: "B", timestamp: "2026-09-17T10:00:00", description: "efeito", source: "E01" },
  { id: "A", timestamp: "2026-09-17T11:00:00", description: "causa", source: "E02", causes: ["B"] }
]);
check("causes array reverse chronology conflicts", arrayCauses.every((item) => item.conflict === true));

const forward = builder.buildTimeline([
  { id: "DEP", timestamp: "2026-09-17T10:00:00", description: "sai", source: "E01", causes: "ARR" },
  { id: "ARR", timestamp: "2026-09-17T12:00:00", description: "chega", source: "E02" }
]);
check("forward causation is not a conflict", forward.every((item) => item.conflict === false));

const reversedDetect = builder.detectConflicts(dated.slice().reverse());
check("detectConflicts pair is stable regardless of input order", JSON.stringify(reversedDetect) === JSON.stringify(detected));

const withEvidence = [
  { id: "EV", timestamp: null, description: "reserva", source: "E04", evidenceIds: ["E04"], notes: "observação do jogador" }
];
const evidenceOut = builder.buildTimeline(withEvidence);
evidenceOut[0].evidenceIds.push("MUT");
check("preserves evidenceIds and player notes", evidenceOut[0].evidenceIds[0] === "E04" && evidenceOut[0].notes === "observação do jogador");
check("cloned evidenceIds do not mutate input", withEvidence[0].evidenceIds.length === 1 && withEvidence[0].evidenceIds[0] === "E04");

check("conflict events are kept, not dropped", conflictOut.map((item) => item.id).sort().join(",") === "E-ARRIVE,E-DEPART");
check("Portuguese conflict reason", /cronologia invertida/.test(detected[0].reason));

const threeDated = builder.buildTimeline([
  { id: "C", timestamp: "2026-09-17T12:00:00", description: "tarde", source: "E03" },
  { id: "A", timestamp: "2026-09-17T08:00:00", description: "manhã", source: "E01" },
  { id: "B", timestamp: "2026-09-17T10:00:00", description: "meio", source: "E02" }
]);
check(
  "order is 0-based among dated events",
  threeDated[0].id === "A" && threeDated[0].order === 0 &&
    threeDated[1].id === "B" && threeDated[1].order === 1 &&
    threeDated[2].id === "C" && threeDated[2].order === 2
);

console.log("TIMELINE_BUILDER_PASS tests=" + tests);
