"use strict";

/**
 * Builds the evidence board payload from discovered records + policy.
 * Pure: does not mutate state, game, or localStorage.
 */

const policy = require("../../domain/evidence/evidence-policy.js");
const { getDiscovered, isEssential } = require("../../domain/evidence/evidence-service.js");
const { buildViewModels } = require("../../ui/evidence/evidence-view-model.js");
const { applyFilters, applySort, DEFAULT_FILTERS } = require("../../ui/evidence/evidence-filters.js");

function applyScenarioOverrides(records, state, game) {
  const scenarios = (game && game.scenarios) || [];
  let scenario = null;
  for (let i = 0; i < scenarios.length; i += 1) {
    if (scenarios[i] && scenarios[i].id === (state && state.scenario)) {
      scenario = scenarios[i];
      break;
    }
  }
  const overrides = (scenario && scenario.evidence_overrides) || {};
  return records.map(function (item) {
    if (!item || !item.id) return item;
    const patch = overrides[item.id];
    return patch ? Object.assign({}, item, patch) : item;
  });
}

function buildEvidenceBoard(state, game, options) {
  const opts = options || {};
  const filters = Object.assign({}, DEFAULT_FILTERS, opts.filters || {});
  const sort = opts.sort || { key: "id", dir: "asc" };
  const discovered = applyScenarioOverrides(getDiscovered(state, game), state, game);
  const models = buildViewModels(discovered, {
    policy: policy,
    isEssential: function (id) { return isEssential(id, game); },
    chapter: opts.chapter || null,
    scenarioId: state && state.scenario ? state.scenario : null,
  });
  const filtered = applyFilters(models, filters);
  const items = applySort(filtered, sort);
  return {
    totalDiscovered: models.length,
    visibleCount: items.length,
    filters: filters,
    sort: sort,
    items: items,
    allItems: models,
  };
}

module.exports = {
  buildEvidenceBoard,
  applyScenarioOverrides,
};
