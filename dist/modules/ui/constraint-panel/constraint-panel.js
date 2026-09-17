const GROUPS = [
  { result: "MATCH", label: "Compatíveis", filter: "match" },
  { result: "NO_MATCH", label: "Incompatíveis", filter: "no-match" },
  { result: "UNKNOWN", label: "Indeterminados", filter: "unknown" },
];

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCandidates(candidates) {
  return (Array.isArray(candidates) ? candidates : []).map(function (candidate, index) {
    const item = candidate && typeof candidate === "object" ? candidate : {};
    const result = GROUPS.some(function (group) { return group.result === item.result; })
      ? item.result
      : "UNKNOWN";
    return {
      id: item.id == null ? "candidato-" + String(index + 1) : String(item.id),
      result: result,
      explanations: Array.isArray(item.explanations) ? item.explanations.slice() : [],
    };
  });
}

function explanationText(explanation) {
  if (explanation && typeof explanation === "object") {
    const field = explanation.field || explanation.constraintId || "restrição";
    const detail = explanation.explanation || explanation.result || "Sem detalhe cadastrado.";
    return String(field) + ": " + String(detail);
  }
  return String(explanation == null ? "Sem detalhe cadastrado." : explanation);
}

function constraintText(constraint) {
  const item = constraint && typeof constraint === "object" ? constraint : {};
  const id = item.constraintId || item.id || "restrição";
  const parts = [id];
  if (item.field) parts.push(item.field);
  if (item.operator) parts.push(item.operator);
  if (item.value !== undefined) parts.push(String(item.value));
  return parts.join(" · ");
}

function buildConstraintPanelHTML(candidates, activeConstraints) {
  const records = normalizeCandidates(candidates);
  const active = Array.isArray(activeConstraints) ? activeConstraints : [];
  let html = '<section class="constraint-panel" data-filter="all" aria-label="Painel de filtragem">';
  html += '<header><h2>Filtragem explicável</h2><p>Selecione restrições e consulte os motivos de cada resultado.</p></header>';
  html += '<div class="constraint-panel__active" aria-label="Restrições ativas"><h3>Restrições ativas</h3><ul>';
  if (active.length === 0) html += '<li class="constraint-panel__neutral">Nenhuma restrição selecionada.</li>';
  for (const constraint of active) html += "<li>" + escapeHtml(constraintText(constraint)) + "</li>";
  html += "</ul></div>";
  html += '<nav aria-label="Filtrar grupos">';
  html += '<button type="button" data-filter="all">Mostrar todos</button>';
  html += '<button type="button" data-filter="match">Só compatíveis</button>';
  html += '<button type="button" data-filter="unknown">Só indeterminados</button></nav>';
  if (records.length === 0) {
    html += '<p class="constraint-panel__empty" role="status">Nenhum candidato disponível para exibição.</p>';
  }
  for (const group of GROUPS) {
    const members = records.filter(function (candidate) { return candidate.result === group.result; });
    html += '<section class="constraint-panel__group" data-result="' + group.filter + '">';
    html += "<h3>" + group.label + "</h3><ul>";
    for (const candidate of members) {
      html += '<li class="constraint-panel__card" data-candidate-id="' + escapeHtml(candidate.id) + '">';
      html += '<button type="button" aria-expanded="false">' + escapeHtml(candidate.id) + "</button>";
      html += '<div class="constraint-panel__explanations" hidden><ul>';
      if (candidate.explanations.length === 0) html += "<li>Sem explicações cadastradas.</li>";
      for (const explanation of candidate.explanations) html += "<li>" + escapeHtml(explanationText(explanation)) + "</li>";
      html += "</ul></div></li>";
    }
    html += "</ul></section>";
  }
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

function renderConstraintPanel(container, candidates, activeConstraints) {
  if (!container || !container.ownerDocument || typeof container.appendChild !== "function") {
    throw new TypeError("container DOM válido é obrigatório.");
  }
  const documentRef = container.ownerDocument;
  const records = normalizeCandidates(candidates);
  const active = Array.isArray(activeConstraints) ? activeConstraints : [];
  container.textContent = "";

  const panel = setAttribute(element(documentRef, "section", "constraint-panel"), "aria-label", "Painel de filtragem");
  panel.setAttribute("data-filter", "all");
  const header = element(documentRef, "header");
  header.appendChild(element(documentRef, "h2", null, "Filtragem explicável"));
  header.appendChild(element(documentRef, "p", null, "Selecione restrições e consulte os motivos de cada resultado."));
  panel.appendChild(header);

  const activeBox = setAttribute(element(documentRef, "div", "constraint-panel__active"), "aria-label", "Restrições ativas");
  activeBox.appendChild(element(documentRef, "h3", null, "Restrições ativas"));
  const activeList = element(documentRef, "ul");
  if (active.length === 0) activeList.appendChild(element(documentRef, "li", "constraint-panel__neutral", "Nenhuma restrição selecionada."));
  active.forEach(function (constraint) { activeList.appendChild(element(documentRef, "li", null, constraintText(constraint))); });
  activeBox.appendChild(activeList);
  panel.appendChild(activeBox);

  const controls = setAttribute(element(documentRef, "nav"), "aria-label", "Filtrar grupos");
  const groupNodes = [];
  function applyFilter(filter) {
    panel.setAttribute("data-filter", filter);
    groupNodes.forEach(function (entry) {
      entry.node.hidden = filter !== "all" && entry.filter !== filter;
    });
  }
  [
    ["all", "Mostrar todos"],
    ["match", "Só compatíveis"],
    ["unknown", "Só indeterminados"],
  ].forEach(function (spec) {
    const button = setAttribute(element(documentRef, "button", null, spec[1]), "type", "button");
    button.setAttribute("data-filter", spec[0]);
    button.addEventListener("click", function () { applyFilter(spec[0]); });
    controls.appendChild(button);
  });
  panel.appendChild(controls);

  if (records.length === 0) {
    const empty = setAttribute(element(documentRef, "p", "constraint-panel__empty", "Nenhum candidato disponível para exibição."), "role", "status");
    panel.appendChild(empty);
  }

  GROUPS.forEach(function (group) {
    const section = element(documentRef, "section", "constraint-panel__group");
    section.setAttribute("data-result", group.filter);
    section.appendChild(element(documentRef, "h3", null, group.label));
    const list = element(documentRef, "ul");
    const buttons = [];
    records.filter(function (candidate) { return candidate.result === group.result; }).forEach(function (candidate) {
      const card = element(documentRef, "li", "constraint-panel__card");
      card.setAttribute("data-candidate-id", candidate.id);
      const button = setAttribute(element(documentRef, "button", null, candidate.id), "type", "button");
      button.setAttribute("aria-expanded", "false");
      button.tabIndex = 0;
      const details = element(documentRef, "div", "constraint-panel__explanations");
      details.hidden = true;
      const explanationList = element(documentRef, "ul");
      if (candidate.explanations.length === 0) explanationList.appendChild(element(documentRef, "li", null, "Sem explicações cadastradas."));
      candidate.explanations.forEach(function (item) { explanationList.appendChild(element(documentRef, "li", null, explanationText(item))); });
      details.appendChild(explanationList);
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
          const index = buttons.indexOf(button);
          const delta = event.key === "ArrowDown" ? 1 : -1;
          const next = (index + delta + buttons.length) % buttons.length;
          buttons[next].focus();
        }
      });
      buttons.push(button);
      card.appendChild(button);
      card.appendChild(details);
      list.appendChild(card);
    });
    section.appendChild(list);
    groupNodes.push({ node: section, filter: group.filter });
    panel.appendChild(section);
  });

  container.appendChild(panel);
  return panel;
}

function createPanelController(container, candidates, game) {
  let records = Array.isArray(candidates) ? candidates.slice() : [];
  let active = [];
  const source = game && Array.isArray(game.constraints) ? game.constraints : [];

  function resolveConstraint(constraint) {
    if (constraint && typeof constraint === "object") return constraint;
    return source.find(function (item) {
      return item && (item.constraintId === constraint || item.id === constraint);
    }) || null;
  }

  function keyOf(constraint) {
    return constraint && (constraint.constraintId || constraint.id) || null;
  }

  function refresh(nextCandidates) {
    if (Array.isArray(nextCandidates)) records = nextCandidates.slice();
    renderConstraintPanel(container, records, active);
    return { candidates: records.slice(), activeConstraints: active.slice() };
  }

  function addConstraint(constraint) {
    const resolved = resolveConstraint(constraint);
    if (!resolved) return refresh();
    const key = keyOf(resolved);
    if (!active.some(function (item) { return key && keyOf(item) === key; })) {
      active = active.concat([Object.assign({}, resolved)]);
    }
    return refresh();
  }

  function removeConstraint(constraint) {
    const key = typeof constraint === "object" ? keyOf(constraint) : constraint;
    active = active.filter(function (item) { return keyOf(item) !== key; });
    return refresh();
  }

  refresh();
  return { addConstraint: addConstraint, removeConstraint: removeConstraint, refresh: refresh };
}

export { renderConstraintPanel, buildConstraintPanelHTML, createPanelController };
