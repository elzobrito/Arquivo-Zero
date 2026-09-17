import { composeAnd, evaluate } from "./constraint-engine.js";

function candidateId(suspect) {
  if (suspect && typeof suspect.id === "string" && suspect.id.trim() !== "") {
    return suspect.id;
  }
  return null;
}

function constraintId(constraint, index) {
  if (constraint && typeof constraint.id === "string" && constraint.id.trim() !== "") {
    return constraint.id;
  }
  return "constraint-" + String(index + 1);
}

function explanation(constraintIdValue, evaluation) {
  return {
    constraintId: constraintIdValue,
    result: evaluation.result,
    explanation: evaluation.explanation,
  };
}

function evaluateCandidate(suspect, constraints, game) {
  const id = candidateId(suspect);
  const evaluations = [];
  const explanations = [];

  if (id === null) {
    const missingId = {
      result: "UNKNOWN",
      explanation: "suspeito sem id estável; identidade não pode ser avaliada.",
    };
    evaluations.push(missingId);
    explanations.push(explanation("candidate-id", missingId));
  }

  for (let i = 0; i < constraints.length; i += 1) {
    const current = evaluate(constraints[i], {
      record: suspect,
      candidateId: id,
      game,
    });
    evaluations.push(current);
    explanations.push(explanation(constraintId(constraints[i], i), current));
  }

  const aggregate = composeAnd(evaluations);
  if (constraints.length === 0 && id !== null) {
    explanations.push(explanation("constraints", aggregate));
  }

  return {
    id,
    result: aggregate.result,
    explanations,
  };
}

export function filterCandidates(suspects, constraints, game) {
  const records = Array.isArray(suspects) ? suspects : [];
  const rules = Array.isArray(constraints) ? constraints : [];
  const output = [];

  for (let i = 0; i < records.length; i += 1) {
    output.push(evaluateCandidate(records[i], rules, game));
  }

  return output;
}
