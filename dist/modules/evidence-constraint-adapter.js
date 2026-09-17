import { evaluate as evaluateNode } from "./constraint-engine.js";
import { getById } from "./evidence-service.js";
import { canSupportArrest } from "./evidence-policy.js";

function evaluation(result, explanation) {
  return { result, explanation };
}

function discoveredIds(state) {
  return Array.isArray(state && state.evidence) ? state.evidence : [];
}

function resolveRecord(evidenceId, context) {
  if (context && context.record && context.record.id === evidenceId) {
    return context.record;
  }
  return getById(evidenceId, context && context.game);
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

  const support = canSupportArrest(record);
  const result = evaluateNode(node, { record });
  return evaluation(
    result.result,
    explain(node.evidenceId, true, support, result.explanation),
  );
}

export function buildConstraint(evidenceId, field, operator, value) {
  const node = {
    id: "EVIDENCE:" + String(evidenceId) + ":" + String(field) + ":" + String(operator),
    op: "ATOM",
    path: field,
    operator,
    value,
    evidenceId,
  };
  node.evaluate = function evaluate(context) {
    return evaluateEvidenceConstraint(node, context || {});
  };
  return node;
}
