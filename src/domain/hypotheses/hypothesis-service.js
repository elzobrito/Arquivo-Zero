"use strict";

const TYPES = ["authorship", "route", "method", "motive", "link", "timeline"];
const STATUSES = ["active", "supported", "weakened", "refuted", "inconclusive"];
const ROLES = ["supports", "contradicts"];

let hypotheses = [];
let nextSequence = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " deve ser texto não vazio.");
  }
  return value.trim();
}

function oneOf(value, allowed, field) {
  if (allowed.indexOf(value) === -1) {
    throw new RangeError(field + " inválido: " + String(value) + ".");
  }
  return value;
}

function stableId(sequence) {
  return "HYP-" + String(sequence).padStart(4, "0");
}

function indexById(hypothesisId) {
  for (let index = 0; index < hypotheses.length; index += 1) {
    if (hypotheses[index].id === hypothesisId) return index;
  }
  return -1;
}

function current(hypothesisId) {
  const id = requiredText(hypothesisId, "hypothesisId");
  const index = indexById(id);
  if (index === -1) throw new RangeError("hipótese não encontrada: " + id + ".");
  return { index: index, record: hypotheses[index] };
}

function snapshot(record) {
  return {
    revision: record.revision,
    statement: record.statement,
    supports: record.supports.slice(),
    contradictions: record.contradictions.slice(),
    confidence: record.confidence,
    status: record.status,
  };
}

function revise(record, changes) {
  const next = Object.assign({}, record, changes);
  next.supports = (changes.supports || record.supports).slice();
  next.contradictions = (changes.contradictions || record.contradictions).slice();
  next.history = record.history.concat([snapshot(record)]);
  next.revision = record.revision + 1;
  return next;
}

function createHypothesis(type, statement) {
  const validType = oneOf(type, TYPES, "type");
  const proposition = requiredText(statement, "statement");
  const record = {
    id: stableId(nextSequence),
    type: validType,
    statement: proposition,
    supports: [],
    contradictions: [],
    confidence: "low",
    status: "active",
    revision: 1,
    history: [],
  };
  nextSequence += 1;
  hypotheses = hypotheses.concat([record]);
  return clone(record);
}

function linkEvidence(hypothesisId, evidenceId, role) {
  const located = current(hypothesisId);
  const id = requiredText(evidenceId, "evidenceId");
  const validRole = oneOf(role, ROLES, "role");
  const side = validRole === "contradicts" ? "contradictions" : "supports";
  const opposite = side === "supports" ? "contradictions" : "supports";
  if (located.record[opposite].indexOf(id) !== -1) {
    throw new RangeError("evidência " + id + " já está vinculada em " + opposite + ".");
  }
  if (located.record[side].indexOf(id) !== -1) return clone(located.record);

  const changes = {};
  changes[side] = located.record[side].concat([id]);
  if (side === "contradictions" && (located.record.status === "active" || located.record.status === "supported")) {
    changes.status = "weakened";
  }
  const revised = revise(located.record, changes);
  hypotheses = hypotheses.slice(0, located.index).concat([revised], hypotheses.slice(located.index + 1));
  return clone(revised);
}

function updateStatus(hypothesisId, status) {
  const located = current(hypothesisId);
  const nextStatus = oneOf(status, STATUSES, "status");
  if (located.record.status === nextStatus) return clone(located.record);
  const revised = revise(located.record, { status: nextStatus });
  hypotheses = hypotheses.slice(0, located.index).concat([revised], hypotheses.slice(located.index + 1));
  return clone(revised);
}

function normalizeSaved(record) {
  if (!record || typeof record !== "object") return null;
  return Object.assign({}, clone(record), {
    supports: Array.isArray(record.supports) ? record.supports.slice() : [],
    contradictions: Array.isArray(record.contradictions) ? record.contradictions.slice() : [],
    history: Array.isArray(record.history) ? clone(record.history) : [],
  });
}

function getHypotheses(state) {
  const source = state === undefined
    ? hypotheses
    : (state && Array.isArray(state.hypotheses) ? state.hypotheses : []);
  return source.map(normalizeSaved).filter(Boolean);
}

module.exports = {
  createHypothesis: createHypothesis,
  linkEvidence: linkEvidence,
  updateStatus: updateStatus,
  getHypotheses: getHypotheses,
};
