import * as policy from "../../evidence-policy.js";
import { getDiscovered, isEssential } from "../../evidence-service.js";
import { buildViewModels } from "./evidence-view-model.js";
import { applyFilters, applySort, DEFAULT_FILTERS } from "./evidence-filters.js";

export function applyScenarioOverrides(records, state, game) {
  const scenarios = (game && game.scenarios) || [];
  const scenario = scenarios.find((s) => s && s.id === (state && state.scenario)) || null;
  const overrides = (scenario && scenario.evidence_overrides) || {};
  return records.map((item) => {
    if (!item || !item.id) return item;
    const patch = overrides[item.id];
    return patch ? { ...item, ...patch } : item;
  });
}

export function buildEvidenceBoard(state, game, options = {}) {
  const filters = { ...DEFAULT_FILTERS, ...(options.filters || {}) };
  const sort = options.sort || { key: "id", dir: "asc" };
  const discovered = applyScenarioOverrides(getDiscovered(state, game), state, game);
  const models = buildViewModels(discovered, {
    policy,
    isEssential: (id) => isEssential(id, game),
    chapter: options.chapter || null,
    scenarioId: state && state.scenario ? state.scenario : null,
  });
  const filtered = applyFilters(models, filters);
  const items = applySort(filtered, sort);
  return {
    totalDiscovered: models.length,
    visibleCount: items.length,
    filters,
    sort,
    items,
    allItems: models,
  };
}
