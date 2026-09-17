import { canSupportArrest } from "./evidence-policy.js";
import { calculateStrength } from "./evidence-strength.js";

function readSuspect(state) {
  if (state.warrantSuspect) return state.warrantSuspect;
  if (typeof state.warrant === "string" && state.warrant) return state.warrant;
  return null;
}

function discoveredRecords(state, game) {
  const ids = Array.isArray(state.evidence) ? state.evidence : [];
  const catalog = game && Array.isArray(game.evidence) ? game.evidence : [];
  const byId = Object.create(null);
  for (let i = 0; i < catalog.length; i += 1) {
    const record = catalog[i];
    if (record && record.id) byId[record.id] = record;
  }
  const records = [];
  for (let i = 0; i < ids.length; i += 1) {
    const item = ids[i];
    const id = typeof item === "string" ? item : item && item.id;
    if (id && byId[id]) {
      records.push(byId[id]);
    } else if (item && typeof item === "object") {
      records.push(item);
    } else {
      records.push({ id: id });
    }
  }
  return records;
}

function hypothesisScoreFor(state, game) {
  const hypotheses = state && Array.isArray(state.hypotheses) ? state.hypotheses : [];
  return calculateStrength(hypotheses, discoveredRecords(state, game), {
    canSupportArrest: canSupportArrest,
  }).score;
}

export function validateArrest(state, game) {
  const req = game.arrest_requirements || { minimum_evidence: 0, required_evidence: [] };
  const suspect = readSuspect(state);
  const hypothesisScore = hypothesisScoreFor(state, game);
  if (suspect !== game.culprit) {
    return {
      decision: "DENIED",
      suspect,
      evidenceScore: 0,
      procedureScore: state.warrant ? 1 : 0,
      hypothesisScore,
      reasons: ["wrong_warrant"],
    };
  }
  const hasAmount = (state.evidence || []).length >= (req.minimum_evidence || 0);
  const hasEssentials = (req.required_evidence || []).every((id) => (state.evidence || []).includes(id));
  if (!hasAmount || !hasEssentials) {
    return {
      decision: "DENIED",
      suspect,
      evidenceScore: 0,
      procedureScore: 1,
      hypothesisScore,
      reasons: ["insufficient_evidence"],
    };
  }
  return {
    decision: "APPROVED",
    suspect,
    evidenceScore: 1,
    procedureScore: 1,
    hypothesisScore,
    reasons: ["warrant_minimum_and_essentials"],
  };
}
