export function validateArrest(state, game) {
  const req = game.arrest_requirements || { minimum_evidence: 0, required_evidence: [] };
  const suspect = state.warrantSuspect || null;
  if (suspect !== game.culprit) {
    return {
      decision: "DENIED",
      suspect,
      evidenceScore: 0,
      procedureScore: state.warrant ? 1 : 0,
      hypothesisScore: 0,
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
      hypothesisScore: 0,
      reasons: ["insufficient_evidence"],
    };
  }
  return {
    decision: "APPROVED",
    suspect,
    evidenceScore: 1,
    procedureScore: 1,
    hypothesisScore: 0,
    reasons: ["warrant_minimum_and_essentials"],
  };
}
