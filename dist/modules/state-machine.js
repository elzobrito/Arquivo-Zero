export const STATES = {
  BRIEFING: "BRIEFING",
  INVESTIGATING: "INVESTIGATING",
  WARRANT_ISSUED: "WARRANT_ISSUED",
  ARREST_ATTEMPTED: "ARREST_ATTEMPTED",
  CASE_WON: "CASE_WON",
  CASE_LOST_TIME: "CASE_LOST_TIME",
  CASE_LOST_WARRANT: "CASE_LOST_WARRANT",
};

const TRANSITIONS = {
  BRIEFING: { ACTION: "INVESTIGATING", TRAVEL: "INVESTIGATING", TIMEOUT: "CASE_LOST_TIME" },
  INVESTIGATING: { ACTION: "INVESTIGATING", TRAVEL: "INVESTIGATING", WARRANT: "WARRANT_ISSUED", TIMEOUT: "CASE_LOST_TIME" },
  WARRANT_ISSUED: { ACTION: "WARRANT_ISSUED", TRAVEL: "WARRANT_ISSUED", ARREST: "ARREST_ATTEMPTED", ARREST_VALID: "CASE_WON", ARREST_INVALID: "CASE_LOST_WARRANT", TIMEOUT: "CASE_LOST_TIME" },
  ARREST_ATTEMPTED: { ARREST_VALID: "CASE_WON", ARREST_INVALID: "CASE_LOST_WARRANT" },
  CASE_WON: {},
  CASE_LOST_TIME: {},
  CASE_LOST_WARRANT: {},
};

export function getCurrentState(state) {
  if (state.finished && state.rewarded) return STATES.CASE_WON;
  if (state.finished && !state.warrant) return STATES.CASE_LOST_TIME;
  if (state.finished) return STATES.CASE_LOST_WARRANT;
  if (state.warrant) return STATES.WARRANT_ISSUED;
  if ((state.actions || []).length > 0 || (state.route || []).length > 1) return STATES.INVESTIGATING;
  return STATES.BRIEFING;
}

export function transition(state, event) {
  const from = typeof state === "string" ? state : getCurrentState(state);
  const table = TRANSITIONS[from] || {};
  const to = table[event];
  if (!to) {
    return { ok: false, newState: from, reason: `Transição inválida ${from} + ${event}` };
  }
  return { ok: true, newState: to, reason: null };
}

export function isTerminal(caseState) {
  return caseState === STATES.CASE_WON || caseState === STATES.CASE_LOST_TIME || caseState === STATES.CASE_LOST_WARRANT;
}

export function canArrest(caseState) {
  return caseState === STATES.WARRANT_ISSUED;
}
