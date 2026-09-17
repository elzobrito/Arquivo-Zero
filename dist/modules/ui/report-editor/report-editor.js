const SECTIONS = [
  { id: "facts", title: "Fatos observados" },
  { id: "timeline", title: "Cronologia" },
  { id: "route", title: "Rota reconstruída" },
  { id: "hypotheses", title: "Hipóteses selecionadas" },
  { id: "suspect", title: "Suspeito indicado" },
  { id: "contradictions", title: "Contradições" },
  { id: "limitations", title: "Limitações" },
  { id: "conclusion", title: "Conclusão" },
];

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cloneList(list) {
  return Array.isArray(list) ? list.slice() : [];
}

function emptyDraft() {
  return {
    facts: [],
    timeline: [],
    route: [],
    hypothesisIds: [],
    conclusion: "",
    limitations: [],
    evidenceIds: [],
    suspectId: null,
  };
}

function looksLikeDraft(value) {
  if (!value || typeof value !== "object") return false;
  return Array.isArray(value.facts) ||
    Array.isArray(value.evidenceIds) ||
    Array.isArray(value.limitations) ||
    Array.isArray(value.timeline) ||
    typeof value.conclusion === "string";
}

function normalizeDraft(value) {
  const src = looksLikeDraft(value) ? value : emptyDraft();
  return {
    facts: cloneList(src.facts),
    timeline: cloneList(src.timeline),
    route: cloneList(src.route),
    hypothesisIds: cloneList(src.hypothesisIds),
    conclusion: src.conclusion == null ? "" : String(src.conclusion),
    limitations: cloneList(src.limitations),
    evidenceIds: cloneList(src.evidenceIds),
    suspectId: src.suspectId == null || src.suspectId === "" ? null : String(src.suspectId),
  };
}

function evidenceCaption(id, evidenceMap) {
  const record = evidenceMap && evidenceMap[id];
  if (record && record.title) return String(id) + " · " + String(record.title);
  return String(id);
}

function buildReportEditorHTML(reportDraft, hypotheses, evidenceMap) {
  const draft = normalizeDraft(reportDraft);
  const hyps = Array.isArray(hypotheses) ? hypotheses : [];
  const evidence = evidenceMap && typeof evidenceMap === "object" ? evidenceMap : {};
  let html = '<section class="report-editor" aria-label="Editor de relatório">';
  html += "<header><h2>Relatório investigativo</h2>";
  html += "<p>Selecione fatos e interpretações. O editor não conclui o caso.</p></header>";
  SECTIONS.forEach(function (section) {
    html += '<section class="report-editor__section" data-section="' + section.id + '">';
    html += "<h3>" + section.title + "</h3>";
    if (section.id === "facts") {
      html += '<ul class="report-editor__facts">';
      const ids = draft.evidenceIds.length ? draft.evidenceIds : draft.facts;
      if (ids.length === 0) html += '<li class="report-editor__empty">Nenhum fato selecionado.</li>';
      ids.forEach(function (id) {
        html += '<li class="report-editor__fact">' + escapeHtml(evidenceCaption(id, evidence)) + "</li>";
      });
      html += "</ul>";
    } else if (section.id === "hypotheses") {
      html += '<ul class="report-editor__interpretations">';
      const selected = hyps.filter(function (item) {
        return item && draft.hypothesisIds.indexOf(item.id) !== -1;
      });
      if (selected.length === 0) html += '<li class="report-editor__empty">Nenhuma hipótese selecionada.</li>';
      selected.forEach(function (item) {
        html += '<li class="report-editor__interpretation">' + escapeHtml(item.statement || item.id) + "</li>";
      });
      html += "</ul>";
    } else if (section.id === "contradictions") {
      html += '<ul class="report-editor__contradictions">';
      const selected = hyps.filter(function (item) {
        return item && draft.hypothesisIds.indexOf(item.id) !== -1;
      });
      let count = 0;
      selected.forEach(function (item) {
        (item.contradictions || []).forEach(function (id) {
          count += 1;
          html += '<li class="report-editor__interpretation">' + escapeHtml(evidenceCaption(id, evidence)) + "</li>";
        });
      });
      if (count === 0) html += '<li class="report-editor__empty">Nenhuma contradição registrada.</li>';
      html += "</ul>";
    } else if (section.id === "conclusion") {
      html += '<p class="report-editor__conclusion">' + escapeHtml(draft.conclusion) + "</p>";
    } else if (section.id === "limitations") {
      html += "<ul>";
      if (draft.limitations.length === 0) html += '<li class="report-editor__empty">Nenhuma limitação declarada.</li>';
      draft.limitations.forEach(function (item) {
        html += "<li>" + escapeHtml(item) + "</li>";
      });
      html += "</ul>";
    } else if (section.id === "suspect") {
      html += '<p class="report-editor__suspect">' + (draft.suspectId ? escapeHtml("Indicado: " + draft.suspectId) : "Nenhum suspeito indicado.") + "</p>";
    } else if (section.id === "timeline") {
      html += "<ul>";
      if (draft.timeline.length === 0) html += '<li class="report-editor__empty">Cronologia não montada.</li>';
      draft.timeline.forEach(function (item) {
        const label = item && (item.event || item.description) ? (item.event || item.description) : String(item);
        html += "<li>" + escapeHtml(label) + "</li>";
      });
      html += "</ul>";
    } else if (section.id === "route") {
      html += "<ul>";
      if (draft.route.length === 0) html += '<li class="report-editor__empty">Rota não reconstruída.</li>';
      draft.route.forEach(function (item) {
        const label = item && item.cityId ? item.cityId : String(item);
        html += "<li>" + escapeHtml(label) + "</li>";
      });
      html += "</ul>";
    }
    html += "</section>";
  });
  return html + "</section>";
}

function validateReport(draft) {
  const current = normalizeDraft(draft);
  const missing = [];
  const reasons = [];
  if (!current.evidenceIds.length) {
    missing.push("evidenceIds");
    reasons.push("relatório_sem_evidências");
  }
  if (!current.suspectId) {
    missing.push("suspectId");
    reasons.push("suspeito_ausente");
  }
  if (!String(current.conclusion).trim()) {
    missing.push("conclusion");
    reasons.push("conclusão_ausente");
  }
  return {
    valid: missing.length === 0,
    missing: missing,
    reasons: reasons,
  };
}

function uniquePush(list, value) {
  if (list.indexOf(value) !== -1) return list.slice();
  return list.concat([value]);
}

function createReportController(container, state, game) {
  const gameRef = game || {};
  const stateRef = state || {};
  let draft = emptyDraft();
  if (stateRef && Array.isArray(stateRef.evidence)) draft.evidenceIds = stateRef.evidence.slice();

  function view() {
    return normalizeDraft(draft);
  }

  function refresh() {
    if (container && typeof container.appendChild === "function" && container.ownerDocument) {
      const html = buildReportEditorHTML(draft, stateRef.hypotheses || [], gameRef.evidenceMap || {});
      container.textContent = "";
      const wrap = container.ownerDocument.createElement("div");
      wrap.className = "report-editor__mount";
      wrap.textContent = html;
      container.appendChild(wrap);
    }
    return view();
  }

  function addFact(text) {
    const value = String(text || "").trim();
    if (value) draft.facts = uniquePush(draft.facts, value);
    return refresh();
  }
  function removeFact(text) {
    draft.facts = draft.facts.filter(function (item) { return item !== text; });
    return refresh();
  }
  function addEvidence(evidenceId) {
    const id = String(evidenceId || "");
    if (id) draft.evidenceIds = uniquePush(draft.evidenceIds, id);
    return refresh();
  }
  function removeEvidence(evidenceId) {
    draft.evidenceIds = draft.evidenceIds.filter(function (id) { return id !== evidenceId; });
    return refresh();
  }
  function selectHypothesis(hypothesisId) {
    const id = String(hypothesisId || "");
    if (id) draft.hypothesisIds = uniquePush(draft.hypothesisIds, id);
    return refresh();
  }
  function deselectHypothesis(hypothesisId) {
    draft.hypothesisIds = draft.hypothesisIds.filter(function (id) { return id !== hypothesisId; });
    return refresh();
  }
  function setConclusion(text) {
    draft.conclusion = text == null ? "" : String(text);
    return refresh();
  }
  function addLimitation(text) {
    const value = String(text || "").trim();
    if (value) draft.limitations = uniquePush(draft.limitations, value);
    return refresh();
  }
  function getReportDraft() {
    return view();
  }

  refresh();
  return {
    addFact: addFact,
    removeFact: removeFact,
    addEvidence: addEvidence,
    removeEvidence: removeEvidence,
    selectHypothesis: selectHypothesis,
    deselectHypothesis: deselectHypothesis,
    setConclusion: setConclusion,
    addLimitation: addLimitation,
    getReportDraft: getReportDraft,
    validateReport: function () { return validateReport(draft); },
  };
}

export { buildReportEditorHTML, createReportController, validateReport };
