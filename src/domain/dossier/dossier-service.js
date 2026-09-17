"use strict";

function chosenPairs(chosen) {
  return Array.isArray(chosen) ? chosen : [];
}

function distinctKeyCount(pairs) {
  const seen = {};
  let count = 0;
  for (let i = 0; i < pairs.length; i += 1) {
    const key = pairs[i] && pairs[i][0];
    if (key == null || seen[key]) continue;
    seen[key] = true;
    count += 1;
  }
  return count;
}

function filterSuspects(game, chosen) {
  const pairs = chosenPairs(chosen);
  const suspects = game && Array.isArray(game.suspects) ? game.suspects : [];
  if (pairs.length === 0) return suspects.slice();
  if (distinctKeyCount(pairs) < 2) return [];
  return suspects.filter(function (suspect) {
    return pairs.every(function (entry) {
      return suspect[entry[0]] === entry[1];
    });
  });
}

function findSuspect(game, suspectId) {
  const suspects = game && Array.isArray(game.suspects) ? game.suspects : [];
  for (let i = 0; i < suspects.length; i += 1) {
    if (suspects[i] && suspects[i].id === suspectId) return suspects[i];
  }
  return null;
}

function hypothesesFrom(state, context) {
  if (context && Array.isArray(context.hypotheses)) return context.hypotheses;
  if (state && Array.isArray(state.hypotheses)) return state.hypotheses;
  return null;
}

function evidenceFrom(state, context) {
  if (context && Object.prototype.hasOwnProperty.call(context, "discoveredEvidence")) {
    return Array.isArray(context.discoveredEvidence) ? context.discoveredEvidence : [];
  }
  if (state && Array.isArray(state.evidence)) return state.evidence;
  return null;
}

function linkedToSubject(record, suspectId, game) {
  if (!record) return false;
  if (record.suspectId != null && record.suspectId !== suspectId) return false;
  if (record.subjectId != null && record.subjectId !== suspectId) return false;
  if (!Array.isArray(record.subjectIds)) return true;
  if (record.subjectIds.indexOf(suspectId) !== -1) return true;
  const caseId = game && game.metadata && game.metadata.id;
  return !!(caseId && record.subjectIds.indexOf(caseId) !== -1);
}

function hasSupportedAuthorship(hypotheses, suspectId, game) {
  for (let i = 0; i < hypotheses.length; i += 1) {
    const record = hypotheses[i];
    if (!record || record.type !== "authorship" || record.status !== "supported") continue;
    if (!Array.isArray(record.supports) || record.supports.length < 1) continue;
    if (!linkedToSubject(record, suspectId, game)) continue;
    return true;
  }
  return false;
}

function issueWarrant(state, suspectId, context) {
  const ctx = context && typeof context === "object" && !Array.isArray(context) ? context : null;
  const satisfied = [];
  const failed = [];
  const reasons = [];

  if (ctx && ctx.game) {
    if (findSuspect(ctx.game, suspectId)) {
      satisfied.push("identity");
    } else {
      failed.push("identity");
      reasons.push("ambiguous_suspect");
    }
  }

  if (ctx && Array.isArray(ctx.chosen)) {
    if (distinctKeyCount(ctx.chosen) >= 2) {
      satisfied.push("multiple_attributes");
    } else {
      failed.push("multiple_attributes");
      reasons.push("name_only");
    }
  }

  const evidence = evidenceFrom(state, ctx);
  if (ctx && ctx.game && evidence) {
    const minimum = (ctx.game.arrest_requirements && ctx.game.arrest_requirements.minimum_evidence) || 0;
    if (evidence.length >= minimum) {
      satisfied.push("evidence");
    } else {
      failed.push("evidence");
      reasons.push("insufficient_evidence");
    }
  }

  const hypotheses = hypothesesFrom(state, ctx);
  if (hypotheses) {
    if (hasSupportedAuthorship(hypotheses, suspectId, ctx && ctx.game)) {
      satisfied.push("hypothesis");
    } else {
      failed.push("hypothesis");
      reasons.push("hypothesis_missing");
    }
  }

  const approved = failed.length === 0;
  return Object.assign({}, state || {}, {
    warrant: approved,
    warrantSuspect: approved ? suspectId : null,
    warrantApproved: approved,
    warrantReasons: reasons,
    satisfiedDimensions: satisfied,
    failedDimensions: failed,
  });
}

module.exports = { filterSuspects, issueWarrant };
