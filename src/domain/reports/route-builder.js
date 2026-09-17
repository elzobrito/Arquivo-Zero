"use strict";

// Five municipalities from AZ-TERR-002. National UF catalog is out of scope.
var CATALOG = ["sao_paulo", "recife", "brasilia", "manaus", "porto_alegre"];

function knownCities() {
  const known = Object.create(null);
  for (let i = 0; i < CATALOG.length; i += 1) known[CATALOG[i]] = true;
  return known;
}

function asArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function cityIdOf(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isCatalogCity(cityId, known) {
  return !!cityId && !!known[cityId];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenPattern(cityId) {
  return new RegExp("\\b" + escapeRegExp(cityId) + "\\b", "i");
}

function pushCity(list, seen, cityId, known) {
  if (!isCatalogCity(cityId, known) || seen[cityId]) return;
  seen[cityId] = true;
  list.push(cityId);
}

function collectFromText(text, list, seen, known) {
  if (typeof text !== "string" || text === "") return;
  const hits = [];
  for (let i = 0; i < CATALOG.length; i += 1) {
    const cityId = CATALOG[i];
    const match = tokenPattern(cityId).exec(text);
    if (match) hits.push({ cityId: cityId, index: match.index });
  }
  hits.sort(function (a, b) {
    return a.index - b.index;
  });
  for (let i = 0; i < hits.length; i += 1) pushCity(list, seen, hits[i].cityId, known);
}

function collectFromValue(value, list, seen, known) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) collectFromValue(value[i], list, seen, known);
    return;
  }
  const cityId = cityIdOf(value);
  if (isCatalogCity(cityId, known)) {
    pushCity(list, seen, cityId, known);
    return;
  }
  if (typeof value === "string") collectFromText(value, list, seen, known);
}

function collectFromRecord(record, list, seen, known) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return;
  collectFromValue(record.subjectIds, list, seen, known);
  collectFromValue(record.route, list, seen, known);
  collectFromValue(record.locationId, list, seen, known);
  collectFromText(record.statement, list, seen, known);
}

function citiesFromHypothesis(hypothesis, known) {
  const list = [];
  const seen = Object.create(null);
  collectFromRecord(hypothesis, list, seen, known);
  if (hypothesis && hypothesis.metadata) collectFromRecord(hypothesis.metadata, list, seen, known);
  return list;
}

function evidenceIdOf(item) {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (item && typeof item === "object" && !Array.isArray(item) && item.id != null && item.id !== "") {
    return String(item.id);
  }
  return null;
}

function evidenceLocationOf(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  if (item.relations && typeof item.relations === "object" && !Array.isArray(item.relations)) {
    const related = cityIdOf(item.relations.locationId);
    if (related) return related;
  }
  return cityIdOf(item.locationId);
}

function indexEvidence(evidence) {
  const list = asArray(evidence);
  const records = [];
  const present = Object.create(null);
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    const id = evidenceIdOf(item);
    if (id) present[id] = true;
    records.push({ id: id, locationId: evidenceLocationOf(item) });
  }
  return { records: records, present: present };
}

function locationEvidenceIds(cityId, indexed) {
  const ids = [];
  const seen = Object.create(null);
  for (let i = 0; i < indexed.records.length; i += 1) {
    const record = indexed.records[i];
    if (!record.id || record.locationId !== cityId || seen[record.id]) continue;
    seen[record.id] = true;
    ids.push(record.id);
  }
  return ids;
}

function mergeSupportIds(hypothesis, indexed, baseIds) {
  const ids = baseIds.slice();
  const seen = Object.create(null);
  for (let i = 0; i < ids.length; i += 1) seen[ids[i]] = true;
  const supports = hypothesis && Array.isArray(hypothesis.supports) ? hypothesis.supports : [];
  for (let i = 0; i < supports.length; i += 1) {
    const id = evidenceIdOf(supports[i]);
    if (!id || !indexed.present[id] || seen[id]) continue;
    seen[id] = true;
    ids.push(id);
  }
  return ids;
}

function hypothesisIdOf(hypothesis) {
  if (!hypothesis || hypothesis.id == null || hypothesis.id === "") return null;
  return String(hypothesis.id);
}

function firstNamingHypothesis(hypotheses, cityId, known) {
  for (let i = 0; i < hypotheses.length; i += 1) {
    const hypothesis = hypotheses[i];
    if (!hypothesis || typeof hypothesis !== "object" || Array.isArray(hypothesis)) continue;
    if (!hypothesisIdOf(hypothesis)) continue;
    const cities = citiesFromHypothesis(hypothesis, known);
    if (cities.indexOf(cityId) !== -1) return hypothesis;
  }
  return null;
}

function stretch(cityId, confirmed, hypothesisId, evidenceIds) {
  return {
    cityId: cityId,
    confirmed: confirmed,
    hypothesisId: hypothesisId,
    evidenceIds: evidenceIds.slice()
  };
}

function buildRoute(visitedCities, hypotheses, evidence) {
  const known = knownCities();
  const visits = asArray(visitedCities);
  const hyps = asArray(hypotheses);
  const indexed = indexEvidence(evidence);
  const result = [];
  const seen = Object.create(null);

  for (let i = 0; i < visits.length; i += 1) {
    const cityId = cityIdOf(visits[i]);
    if (!isCatalogCity(cityId, known) || seen[cityId]) continue;
    seen[cityId] = true;
    const named = firstNamingHypothesis(hyps, cityId, known);
    result.push(stretch(
      cityId,
      true,
      named ? hypothesisIdOf(named) : null,
      locationEvidenceIds(cityId, indexed)
    ));
  }

  for (let i = 0; i < hyps.length; i += 1) {
    const hypothesis = hyps[i];
    if (!hypothesis || typeof hypothesis !== "object" || Array.isArray(hypothesis)) continue;
    const hypothesisId = hypothesisIdOf(hypothesis);
    if (!hypothesisId) continue;
    const cities = citiesFromHypothesis(hypothesis, known);
    for (let j = 0; j < cities.length; j += 1) {
      const cityId = cities[j];
      if (seen[cityId]) continue;
      seen[cityId] = true;
      result.push(stretch(
        cityId,
        false,
        hypothesisId,
        mergeSupportIds(hypothesis, indexed, locationEvidenceIds(cityId, indexed))
      ));
    }
  }

  return result;
}

module.exports = {
  buildRoute: buildRoute
};
