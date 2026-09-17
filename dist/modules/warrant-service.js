import { filterSuspects } from "./dossier-service.js";
import { calculateStrength } from "./evidence-strength.js";
import { canSupportArrest } from "./evidence-policy.js";

const REASON_NOT_UNIQUE = "sem_candidato_único";
const REASON_WEAK = "força_probatória_insuficiente";
const REASON_UNIQUE = "suspeito_único";
const REASON_PROOF = "prova_suficiente";

function toPairs(chosen) {
  if (Array.isArray(chosen)) {
    return chosen.filter(function (pair) {
      return pair && pair[1] !== undefined && pair[1] !== null && pair[1] !== "";
    });
  }
  if (!chosen || typeof chosen !== "object") return [];
  return Object.keys(chosen).map(function (key) {
    return [key, chosen[key]];
  }).filter(function (pair) {
    return pair[1] !== undefined && pair[1] !== null && pair[1] !== "";
  });
}

function deny(reasons, missing) {
  return {
    approved: false,
    suspectId: null,
    reasons: reasons.slice(),
    missingDimensions: missing.slice(),
  };
}

function discoveredRecords(state, game) {
  const ids = state && Array.isArray(state.evidence) ? state.evidence : [];
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
    if (id && byId[id]) records.push(byId[id]);
    else if (item && typeof item === "object") records.push(item);
    else if (id) records.push({ id: id });
  }
  return records;
}

function warrantThreshold(game) {
  const req = (game && game.arrest_requirements) || {};
  const value = Number(req.minWarrantStrength);
  return Number.isFinite(value) ? value : 0;
}

export function requestWarrant(state, game, chosen) {
  const pairs = toPairs(chosen);
  if (pairs.length === 0) {
    return deny([REASON_NOT_UNIQUE], ["unique_suspect"]);
  }
  const matches = filterSuspects(game, pairs);
  if (!matches || matches.length !== 1) {
    return deny([REASON_NOT_UNIQUE], ["unique_suspect"]);
  }
  const candidate = matches[0];
  const hypotheses = state && Array.isArray(state.hypotheses) ? state.hypotheses : [];
  const strength = calculateStrength(hypotheses, discoveredRecords(state, game), {
    canSupportArrest: canSupportArrest,
  });
  const threshold = warrantThreshold(game);
  if (strength.score < threshold) {
    return deny([REASON_WEAK], ["probative_force"]);
  }
  return {
    approved: true,
    suspectId: candidate.id,
    reasons: [REASON_UNIQUE, REASON_PROOF],
    missingDimensions: [],
  };
}
