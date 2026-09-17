"use strict";

const engine = require("./constraint-engine.js");
const evidenceService = require("../evidence/evidence-service.js");
const evidencePolicy = require("../evidence/evidence-policy.js");

function evaluation(result, explanation) {
  return { result: result, explanation: explanation };
}

function discoveredIds(state) {
  return Array.isArray(state && state.evidence) ? state.evidence : [];
}

function resolveRecord(evidenceId, context) {
  if (context && context.record && context.record.id === evidenceId) {
    return context.record;
  }
  return evidenceService.getById(evidenceId, context && context.game);
}

function isDiscovered(evidenceId, context) {
  if (context && typeof context.discovered === "boolean") return context.discovered;
  return discoveredIds(context && context.state).indexOf(evidenceId) !== -1;
}

function explain(evidenceId, discovered, support, detail) {
  return (
    "evidenceId=" + evidenceId +
    "; discovered=" + String(discovered) +
    "; canSupportArrest=" + String(support) +
    "; " + detail
  );
}

function evaluateEvidenceConstraint(node, context) {
  if (!isDiscovered(node.evidenceId, context)) {
    return evaluation(
      "UNKNOWN",
      explain(node.evidenceId, false, "unknown", "evidência não descoberta; restrição não afeta candidatos."),
    );
  }

  const record = resolveRecord(node.evidenceId, context);
  if (!record) {
    return evaluation(
      "UNKNOWN",
      explain(node.evidenceId, true, false, "registro de evidência ausente do catálogo."),
    );
  }

  const support = evidencePolicy.canSupportArrest(record);
  const result = engine.evaluate(node, { record: record });
  return evaluation(
    result.result,
    explain(node.evidenceId, true, support, result.explanation),
  );
}

function buildConstraint(evidenceId, field, operator, value) {
  const node = {
    id: "EVIDENCE:" + String(evidenceId) + ":" + String(field) + ":" + String(operator),
    op: "ATOM",
    path: field,
    operator: operator,
    value: value,
    evidenceId: evidenceId,
  };
  node.evaluate = function evaluate(context) {
    return evaluateEvidenceConstraint(node, context || {});
  };
  return node;
}

module.exports = { buildConstraint: buildConstraint };
