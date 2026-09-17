"use strict";

/**
 * Browser board bootstrap (CommonJS mirror for tests).
 * Runtime browser entry is dist/modules/ui/evidence/evidence-board.js (ESM).
 */

const { buildEvidenceBoard } = require("../../application/evidence/build-evidence-board.js");
const { uniqueTags, DEFAULT_FILTERS } = require("./evidence-filters.js");
const { renderEvidenceDetails } = require("./evidence-details.js");

function createBoardController(options) {
  const opts = options || {};
  let filters = Object.assign({}, DEFAULT_FILTERS);
  let sort = { key: "id", dir: "asc" };
  let selectedId = null;
  let lastPayload = null;

  function refresh(state, game, chapter) {
    const payload = buildEvidenceBoard(state, game, {
      filters: filters,
      sort: sort,
      chapter: chapter || null,
    });
    lastPayload = payload;
    if (selectedId && !payload.items.some(function (i) { return i.id === selectedId; })) {
      selectedId = payload.items[0] ? payload.items[0].id : null;
    }
    if (!selectedId && payload.items[0]) selectedId = payload.items[0].id;
    return {
      payload: payload,
      selectedId: selectedId,
      selected: payload.items.find(function (i) { return i.id === selectedId; }) || null,
      tags: uniqueTags(payload.allItems || payload.items),
      filters: filters,
      sort: sort,
      detailsHtml: renderEvidenceDetails(
        payload.items.find(function (i) { return i.id === selectedId; }) || null
      ),
    };
  }

  function setFilter(key, value) {
    filters = Object.assign({}, filters, { [key]: value });
  }

  function setSort(key, dir) {
    sort = { key: key || "id", dir: dir === "desc" ? "desc" : "asc" };
  }

  function select(id) {
    selectedId = id || null;
  }

  function getState() {
    return { filters: filters, sort: sort, selectedId: selectedId, lastPayload: lastPayload };
  }

  return { refresh, setFilter, setSort, select, getState };
}

module.exports = {
  createBoardController,
};
