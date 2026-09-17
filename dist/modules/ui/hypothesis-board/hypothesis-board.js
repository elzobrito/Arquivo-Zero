const GROUPS = [
  { status: "active", label: "Em análise" },
  { status: "supported", label: "Sustentada" },
  { status: "weakened", label: "Enfraquecida" },
  { status: "refuted", label: "Refutada" },
  { status: "inconclusive", label: "Inconclusiva" },
];

const CONFIDENCE_LABELS = {
  low: "baixa",
  medium: "média",
  high: "alta",
};

const TYPES = ["authorship", "route", "method", "motive", "link", "timeline"];
const STATUSES = GROUPS.map(function (group) { return group.status; });

var loadedService = null;

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

function cloneHypothesis(record) {
  const item = record && typeof record === "object" ? record : {};
  const status = STATUSES.indexOf(item.status) === -1 ? "active" : item.status;
  const confidence = CONFIDENCE_LABELS[item.confidence] ? item.confidence : "low";
  const type = TYPES.indexOf(item.type) === -1 ? "authorship" : item.type;
  return {
    id: item.id == null ? "" : String(item.id),
    type: type,
    statement: item.statement == null ? "" : String(item.statement),
    supports: cloneList(item.supports),
    contradictions: cloneList(item.contradictions),
    confidence: confidence,
    status: status,
  };
}

function normalizeHypotheses(hypotheses) {
  return (Array.isArray(hypotheses) ? hypotheses : []).map(cloneHypothesis);
}

function evidenceMapFrom(evidenceMap) {
  if (!evidenceMap) return {};
  if (Array.isArray(evidenceMap)) {
    const mapped = {};
    evidenceMap.forEach(function (record) {
      if (record && record.id != null) mapped[String(record.id)] = record;
    });
    return mapped;
  }
  if (typeof evidenceMap === "object") return evidenceMap;
  return {};
}

function evidenceCaption(evidenceId, evidenceMap) {
  const record = evidenceMap[evidenceId];
  if (record && typeof record === "object" && record.title) {
    return String(evidenceId) + " · " + String(record.title);
  }
  return String(evidenceId);
}

function confidenceLabel(confidence) {
  return "Confiança declarada: " + (CONFIDENCE_LABELS[confidence] || CONFIDENCE_LABELS.low);
}

function buildEvidenceItemsHTML(hypothesis, evidenceMap) {
  let html = '<ul class="hypothesis-board__evidence-list">';
  if (hypothesis.supports.length === 0 && hypothesis.contradictions.length === 0) {
    html += '<li class="hypothesis-board__evidence-empty">Nenhuma evidência vinculada.</li>';
  }
  hypothesis.supports.forEach(function (evidenceId) {
    html += '<li class="hypothesis-board__evidence" data-role="supports" data-evidence-id="' +
      escapeHtml(evidenceId) + '">' + escapeHtml(evidenceCaption(evidenceId, evidenceMap)) +
      " — favorável</li>";
  });
  hypothesis.contradictions.forEach(function (evidenceId) {
    html += '<li class="hypothesis-board__evidence" data-role="contradicts" data-evidence-id="' +
      escapeHtml(evidenceId) + '">' + escapeHtml(evidenceCaption(evidenceId, evidenceMap)) +
      " — contraditória</li>";
  });
  return html + "</ul>";
}

function buildHypothesisBoardHTML(hypotheses, evidenceMap) {
  const records = normalizeHypotheses(hypotheses);
  const evidence = evidenceMapFrom(evidenceMap);
  let html = '<section class="hypothesis-board" aria-label="Quadro de hipóteses">';
  html += "<header><h2>Quadro de hipóteses</h2>";
  html += "<p>Declare afirmações revisáveis. Confiança declarada não substitui prova.</p></header>";
  if (records.length === 0) {
    html += '<p class="hypothesis-board__empty" role="status">Nenhuma hipótese declarada.</p>';
  }
  GROUPS.forEach(function (group) {
    const members = records.filter(function (item) { return item.status === group.status; });
    html += '<section class="hypothesis-board__group" data-status="' + group.status + '">';
    html += "<h3>" + group.label + "</h3><ul>";
    members.forEach(function (hypothesis) {
      html += '<li class="hypothesis-board__card" data-hypothesis-id="' + escapeHtml(hypothesis.id) +
        '" data-status="' + hypothesis.status + '" data-type="' + escapeHtml(hypothesis.type) + '">';
      html += '<button type="button" aria-expanded="false">' +
        escapeHtml(hypothesis.type) + " — " + escapeHtml(hypothesis.statement) + "</button>";
      html += '<div class="hypothesis-board__details" hidden>';
      html += '<p class="hypothesis-board__type" data-type="' + escapeHtml(hypothesis.type) + '">' +
        escapeHtml(hypothesis.type) + "</p>";
      html += '<p class="hypothesis-board__statement">' + escapeHtml(hypothesis.statement) + "</p>";
      html += '<p class="hypothesis-board__confidence" data-confidence="' + hypothesis.confidence + '">' +
        escapeHtml(confidenceLabel(hypothesis.confidence)) + "</p>";
      html += buildEvidenceItemsHTML(hypothesis, evidence);
      html += "</div></li>";
    });
    html += "</ul></section>";
  });
  return html + "</section>";
}

function element(documentRef, name, className, textValue) {
  const node = documentRef.createElement(name);
  if (className) node.className = className;
  if (textValue !== undefined) node.textContent = String(textValue);
  return node;
}

function setAttribute(node, name, value) {
  node.setAttribute(name, String(value));
  return node;
}

function hypothesesFrom(state, game) {
  if (state && Array.isArray(state.hypotheses)) return state.hypotheses;
  const service = resolveService(game);
  if (service && typeof service.getHypotheses === "function") {
    return service.getHypotheses(state);
  }
  return [];
}

function evidenceFrom(game) {
  if (!game || typeof game !== "object") return {};
  if (game.evidenceMap) return evidenceMapFrom(game.evidenceMap);
  if (game.evidence) return evidenceMapFrom(game.evidence);
  return {};
}

function resolveService(game) {
  if (game && game.hypothesisService) return game.hypothesisService;
  return loadedService;
}

function appendEvidenceItems(documentRef, list, hypothesis, evidenceMap) {
  if (hypothesis.supports.length === 0 && hypothesis.contradictions.length === 0) {
    list.appendChild(element(documentRef, "li", "hypothesis-board__evidence-empty", "Nenhuma evidência vinculada."));
    return [];
  }
  const nodes = [];
  function addItem(evidenceId, role, label) {
    const item = element(documentRef, "li", "hypothesis-board__evidence", evidenceCaption(evidenceId, evidenceMap) + " — " + label);
    item.setAttribute("data-role", role);
    item.setAttribute("data-evidence-id", evidenceId);
    item.tabIndex = 0;
    list.appendChild(item);
    nodes.push(item);
  }
  hypothesis.supports.forEach(function (evidenceId) { addItem(evidenceId, "supports", "favorável"); });
  hypothesis.contradictions.forEach(function (evidenceId) { addItem(evidenceId, "contradicts", "contraditória"); });
  return nodes;
}

function renderHypothesisBoard(container, state, game) {
  if (!container || !container.ownerDocument || typeof container.appendChild !== "function") {
    throw new TypeError("container DOM válido é obrigatório.");
  }
  const documentRef = container.ownerDocument;
  const records = normalizeHypotheses(hypothesesFrom(state, game));
  const evidence = evidenceFrom(game);
  container.textContent = "";

  const panel = setAttribute(element(documentRef, "section", "hypothesis-board"), "aria-label", "Quadro de hipóteses");
  const header = element(documentRef, "header");
  header.appendChild(element(documentRef, "h2", null, "Quadro de hipóteses"));
  header.appendChild(element(documentRef, "p", null, "Declare afirmações revisáveis. Confiança declarada não substitui prova."));
  panel.appendChild(header);

  if (records.length === 0) {
    const empty = setAttribute(element(documentRef, "p", "hypothesis-board__empty", "Nenhuma hipótese declarada."), "role", "status");
    panel.appendChild(empty);
  }

  const headerButtons = [];
  GROUPS.forEach(function (group) {
    const members = records.filter(function (item) { return item.status === group.status; });
    const section = element(documentRef, "section", "hypothesis-board__group");
    section.setAttribute("data-status", group.status);
    section.appendChild(element(documentRef, "h3", null, group.label));
    const list = element(documentRef, "ul");
    members.forEach(function (hypothesis) {
      const card = element(documentRef, "li", "hypothesis-board__card");
      card.setAttribute("data-hypothesis-id", hypothesis.id);
      card.setAttribute("data-status", hypothesis.status);
      card.setAttribute("data-type", hypothesis.type);
      const button = setAttribute(
        element(documentRef, "button", null, hypothesis.type + " — " + hypothesis.statement),
        "type",
        "button"
      );
      button.setAttribute("aria-expanded", "false");
      button.tabIndex = 0;
      const details = element(documentRef, "div", "hypothesis-board__details");
      details.hidden = true;
      details.appendChild(setAttribute(element(documentRef, "p", "hypothesis-board__type", hypothesis.type), "data-type", hypothesis.type));
      details.appendChild(element(documentRef, "p", "hypothesis-board__statement", hypothesis.statement));
      const confidence = setAttribute(
        element(documentRef, "p", "hypothesis-board__confidence", confidenceLabel(hypothesis.confidence)),
        "data-confidence",
        hypothesis.confidence
      );
      details.appendChild(confidence);
      const evidenceList = element(documentRef, "ul", "hypothesis-board__evidence-list");
      const evidenceNodes = appendEvidenceItems(documentRef, evidenceList, hypothesis, evidence);
      details.appendChild(evidenceList);

      function toggleDetails() {
        details.hidden = !details.hidden;
        button.setAttribute("aria-expanded", details.hidden ? "false" : "true");
      }

      button.addEventListener("click", toggleDetails);
      button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleDetails();
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const index = headerButtons.indexOf(button);
          const delta = event.key === "ArrowDown" ? 1 : -1;
          const next = (index + delta + headerButtons.length) % headerButtons.length;
          headerButtons[next].focus();
          return;
        }
        if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && evidenceNodes.length > 0) {
          event.preventDefault();
          if (details.hidden) toggleDetails();
          const start = event.key === "ArrowRight" ? 0 : evidenceNodes.length - 1;
          evidenceNodes[start].focus();
        }
      });
      evidenceNodes.forEach(function (node, index) {
        node.addEventListener("keydown", function (event) {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            evidenceNodes[(index + 1) % evidenceNodes.length].focus();
            return;
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            evidenceNodes[(index - 1 + evidenceNodes.length) % evidenceNodes.length].focus();
            return;
          }
          if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            button.focus();
          }
        });
      });

      headerButtons.push(button);
      card.appendChild(button);
      card.appendChild(details);
      list.appendChild(card);
    });
    section.appendChild(list);
    panel.appendChild(section);
  });

  container.appendChild(panel);
  return panel;
}

function createHypothesisBoardController(container, state, game) {
  const service = resolveService(game);
  let records = normalizeHypotheses(hypothesesFrom(state, game));
  const gameRef = game || {};

  function viewState() {
    return { hypotheses: records };
  }

  function refresh() {
    renderHypothesisBoard(container, viewState(), gameRef);
    return { hypotheses: records.map(cloneHypothesis) };
  }

  function upsert(record) {
    const next = cloneHypothesis(record);
    let found = false;
    records = records.map(function (item) {
      if (item.id !== next.id) return item;
      found = true;
      return next;
    });
    if (!found) records = records.concat([next]);
    return refresh();
  }

  function addHypothesis(type, statement) {
    let record;
    if (service && typeof service.createHypothesis === "function") {
      record = service.createHypothesis(type, statement);
    } else {
      record = {
        id: "HYP-LOCAL-" + String(records.length + 1).padStart(4, "0"),
        type: type,
        statement: statement,
        supports: [],
        contradictions: [],
        confidence: "low",
        status: "active",
      };
    }
    upsert(record);
    return cloneHypothesis(record);
  }

  function linkEvidence(hypothesisId, evidenceId, role) {
    let record = null;
    if (service && typeof service.linkEvidence === "function") {
      record = service.linkEvidence(hypothesisId, evidenceId, role);
    } else {
      const current = records.filter(function (item) { return item.id === hypothesisId; })[0];
      if (!current) return refresh();
      const next = cloneHypothesis(current);
      const side = role === "contradicts" ? "contradictions" : "supports";
      if (next[side].indexOf(evidenceId) === -1) next[side] = next[side].concat([evidenceId]);
      record = next;
    }
    upsert(record);
    return cloneHypothesis(record);
  }

  function removeEvidence(hypothesisId, evidenceId) {
    records = records.map(function (item) {
      if (item.id !== hypothesisId) return item;
      const next = cloneHypothesis(item);
      next.supports = next.supports.filter(function (id) { return id !== evidenceId; });
      next.contradictions = next.contradictions.filter(function (id) { return id !== evidenceId; });
      return next;
    });
    return refresh();
  }

  refresh();
  return {
    addHypothesis: addHypothesis,
    linkEvidence: linkEvidence,
    removeEvidence: removeEvidence,
    refresh: refresh,
  };
}

export { renderHypothesisBoard, buildHypothesisBoardHTML, createHypothesisBoardController };
