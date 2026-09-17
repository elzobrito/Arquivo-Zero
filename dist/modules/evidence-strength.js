/**
 * Evidence can support an arrest unless admissibility or integrity is an
 * explicit block. Unknown and missing fields get the benefit of the doubt.
 */
function defaultCanSupportArrest(record) {
  return !!record && record.admissibility !== "inadmissible" && record.integrity !== "compromised";
}

function resolveCanSupport(policy) {
  if (policy && typeof policy.canSupportArrest === "function") {
    return function canSupport(record) {
      return policy.canSupportArrest(record);
    };
  }
  return defaultCanSupportArrest;
}

function asRecord(item) {
  if (typeof item === "string") return { id: item };
  if (item && typeof item === "object") return item;
  return null;
}

function listIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = [];
  for (let i = 0; i < value.length; i += 1) {
    const item = value[i];
    if (typeof item === "string" && item !== "") ids.push(item);
  }
  return ids;
}

function uniqueSorted(ids) {
  const copy = ids.slice();
  copy.sort();
  const out = [];
  for (let i = 0; i < copy.length; i += 1) {
    if (i === 0 || copy[i] !== copy[i - 1]) out.push(copy[i]);
  }
  return out;
}

function keysSorted(flags) {
  const keys = Object.keys(flags);
  keys.sort();
  return keys;
}

/**
 * Pure strength of linked evidence. Does not mutate inputs.
 * Confidence is not proof and is not used in the score.
 * Standalone module: tests load this via data URL.
 */
export function calculateStrength(hypotheses, discoveredEvidence, policy) {
  const canSupport = resolveCanSupport(policy);
  const hypList = Array.isArray(hypotheses) ? hypotheses : [];
  const discoveredList = Array.isArray(discoveredEvidence) ? discoveredEvidence : [];
  const reasonFlags = Object.create(null);
  const mentionCount = Object.create(null);
  const supportingFlags = Object.create(null);
  const contradictingFlags = Object.create(null);
  const inadmissibleFlags = Object.create(null);
  const discoveredById = Object.create(null);

  if (hypList.length === 0) reasonFlags.no_hypothesis = true;
  if (discoveredList.length === 0) reasonFlags.no_evidence = true;

  for (let i = 0; i < discoveredList.length; i += 1) {
    const record = asRecord(discoveredList[i]);
    if (!record || record.id == null || record.id === "") continue;
    const id = String(record.id);
    if (!Object.prototype.hasOwnProperty.call(discoveredById, id)) {
      discoveredById[id] = record;
    }
  }

  function mention(id) {
    mentionCount[id] = (mentionCount[id] || 0) + 1;
  }

  function consider(id, role, contributeSupport) {
    mention(id);
    if (!Object.prototype.hasOwnProperty.call(discoveredById, id)) {
      reasonFlags.evidence_not_discovered = true;
      return;
    }
    const record = discoveredById[id];
    if (!canSupport(record)) {
      inadmissibleFlags[id] = true;
      reasonFlags.evidence_inadmissible = true;
      if (role === "contradicts") contradictingFlags[id] = true;
      return;
    }
    if (role === "supports") {
      if (contributeSupport) supportingFlags[id] = true;
    } else {
      contradictingFlags[id] = true;
    }
  }

  for (let h = 0; h < hypList.length; h += 1) {
    const hyp = hypList[h];
    if (!hyp || typeof hyp !== "object") continue;
    const supports = listIds(hyp.supports);
    const contradictions = listIds(hyp.contradictions);
    const refuted = hyp.status === "refuted";
    if (supports.length === 0) reasonFlags.hypothesis_without_evidence = true;
    if (refuted) reasonFlags.hypothesis_refuted = true;
    if (hyp.type === "authorship" && hyp.status === "supported") {
      reasonFlags.authorship_supported = true;
    }
    for (let s = 0; s < supports.length; s += 1) {
      consider(supports[s], "supports", !refuted);
    }
    for (let c = 0; c < contradictions.length; c += 1) {
      consider(contradictions[c], "contradicts", false);
    }
  }

  const mentioned = Object.keys(mentionCount);
  for (let i = 0; i < mentioned.length; i += 1) {
    if (mentionCount[mentioned[i]] > 1) {
      reasonFlags.evidence_redundant = true;
      break;
    }
  }

  const supporting = uniqueSorted(keysSorted(supportingFlags));
  const contradicting = uniqueSorted(keysSorted(contradictingFlags));
  const inadmissible = uniqueSorted(keysSorted(inadmissibleFlags));
  let score = 0;
  if (supporting.length > 0) {
    score = supporting.length / (supporting.length + contradicting.length);
  }
  if (score < 0) score = 0;
  if (score > 1) score = 1;

  return {
    score: score,
    supporting: supporting,
    contradicting: contradicting,
    inadmissible: inadmissible,
    reasons: keysSorted(reasonFlags),
  };
}
