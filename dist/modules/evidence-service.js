export function getById(evidenceId, game) {
  if (!evidenceId || !game || !Array.isArray(game.evidence)) return null;
  for (let i = 0; i < game.evidence.length; i += 1) {
    const item = game.evidence[i];
    if (item && item.id === evidenceId) return item;
  }
  return null;
}

function evidenceIds(state) {
  return Array.isArray(state && state.evidence) ? state.evidence.slice() : [];
}

export function catalogEvidence(state, evidenceId, game) {
  const evidence = evidenceIds(state);
  const record = getById(evidenceId, game);
  if (!evidenceId || !record) {
    return { ok: false, record: null, duplicate: false, evidence };
  }
  if (evidence.indexOf(evidenceId) !== -1) {
    return { ok: true, record, duplicate: true, evidence };
  }
  return { ok: true, record, duplicate: false, evidence: evidence.concat(evidenceId) };
}

export function getDiscovered(state, game) {
  const have = {};
  const ids = evidenceIds(state);
  for (let i = 0; i < ids.length; i += 1) have[ids[i]] = true;
  const catalog = (game && game.evidence) || [];
  const found = [];
  for (let i = 0; i < catalog.length; i += 1) {
    const item = catalog[i];
    if (item && have[item.id]) found.push(item);
  }
  return found;
}

export function isEssential(evidenceId, game) {
  const required = (game && game.arrest_requirements && game.arrest_requirements.required_evidence) || [];
  return !!evidenceId && required.indexOf(evidenceId) !== -1;
}
