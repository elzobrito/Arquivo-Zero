"use strict";

function issue(path, message, severity) {
  return { path, message, severity };
}

function detectVersion(raw) {
  const declared = raw && raw.schemaVersion;
  if (typeof declared === "string") {
    if (declared.startsWith("3")) return "3.x";
    if (declared.startsWith("2")) return "2.x";
    if (declared.startsWith("1")) return "1.x";
  }
  if (raw && raw.campaign) return "2.x";
  return "1.x";
}

function cloneRead(raw) {
  return raw;
}

function uniquePush(list, id, path, errors) {
  if (!id) return;
  if (list.has(id)) errors.push(issue(path, `ID duplicado '${id}'.`, "error"));
  list.add(id);
}

function actionEffective(action, scenario) {
  return Object.assign({}, action, scenario?.action_overrides?.[action.id] || {});
}

function travelCost(game, from, to) {
  const cost = game.travel?.[from]?.[to];
  return typeof cost === "number" ? cost : null;
}

function validateCase(raw) {
  const errors = [];
  const warnings = [];
  const game = cloneRead(raw);
  if (!game || typeof game !== "object" || Array.isArray(game)) {
    return { status: "FAIL", version: null, issues: [issue("", "O caso deve ser um objeto JSON.", "error")] };
  }

  const version = detectVersion(game);
  if (!game.schemaVersion) {
    warnings.push(issue("schemaVersion", `Ausente; tratado como ${version}.`, "warning"));
  }

  const meta = game.metadata || {};
  if (version === "3.x") {
    if (!meta.id) errors.push(issue("metadata.id", "Campo obrigatório ausente.", "error"));
    if (!meta.title) errors.push(issue("metadata.title", "Campo obrigatório ausente.", "error"));
    if (!meta.code) errors.push(issue("metadata.code", "Campo obrigatório ausente.", "error"));
    if (!meta.briefing) errors.push(issue("metadata.briefing", "Campo obrigatório ausente.", "error"));
    if (!meta.start) errors.push(issue("metadata.start", "Campo obrigatório ausente.", "error"));
    if (!Number.isInteger(meta.total_hours) || meta.total_hours < 1) {
      errors.push(issue("metadata.total_hours", "Deve ser inteiro >= 1.", "error"));
    }
    if (!game.schemaVersion || !String(game.schemaVersion).startsWith("3")) {
      errors.push(issue("schemaVersion", "Caso 3.x exige schemaVersion 3.x.", "error"));
    }
    for (const key of ["suspects", "evidence", "locations", "scenarios"]) {
      if (!Array.isArray(game[key])) errors.push(issue(key, "Campo obrigatório ausente ou inválido.", "error"));
    }
    if (!game.dossier || !Array.isArray(game.dossier.fields)) {
      errors.push(issue("dossier.fields", "Campo obrigatório ausente.", "error"));
    }
    if (!game.travel || typeof game.travel !== "object") errors.push(issue("travel", "Campo obrigatório ausente.", "error"));
    if (!game.navigation || typeof game.navigation !== "object") errors.push(issue("navigation", "Campo obrigatório ausente.", "error"));
    if (!game.arrest_requirements) errors.push(issue("arrest_requirements", "Campo obrigatório ausente.", "error"));
    if (!game.culprit) errors.push(issue("culprit", "Campo obrigatório ausente.", "error"));
    if (!game.ending?.win_title) errors.push(issue("ending.win_title", "Campo obrigatório ausente.", "error"));
  } else {
    if (!meta.id) errors.push(issue("metadata.id", "Campo obrigatório ausente.", "error"));
    if (!Array.isArray(game.locations) || !game.locations.length) {
      errors.push(issue("locations", "Estrutura mínima ausente.", "error"));
    }
    if (!game.travel) errors.push(issue("travel", "Estrutura mínima ausente.", "error"));
    if (!game.dossier) errors.push(issue("dossier", "Estrutura mínima ausente.", "error"));
  }

  const suspects = new Map();
  const suspectIds = new Set();
  const evidence = new Set();
  const locations = new Map();
  const actions = new Set();
  const scenarioIds = new Set();

  for (const [i, s] of (game.suspects || []).entries()) {
    uniquePush(suspectIds, s?.id, `suspects[${i}].id`, errors);
    if (s?.id) suspects.set(s.id, s);
  }
  for (const [i, e] of (game.evidence || []).entries()) {
    if (!e?.id) errors.push(issue(`evidence[${i}].id`, "Evidência sem id.", "error"));
    else if (evidence.has(e.id)) errors.push(issue(`evidence[${i}].id`, `ID duplicado '${e.id}'.`, "error"));
    else evidence.add(e.id);
    if (version === "3.x" && e && e.admissibility == null) {
      warnings.push(issue(`evidence[${i}].admissibility`, "Opcional em 3.0; ausente.", "warning"));
    }
  }
  for (const [i, loc] of (game.locations || []).entries()) {
    if (!loc?.id) errors.push(issue(`locations[${i}].id`, "Local sem id.", "error"));
    else if (locations.has(loc.id)) errors.push(issue(`locations[${i}].id`, `ID duplicado '${loc.id}'.`, "error"));
    else locations.set(loc.id, loc);
    for (const [j, act] of (loc?.actions || []).entries()) {
      if (!act?.id) continue;
      if (actions.has(act.id)) errors.push(issue(`locations[${i}].actions[${j}].id`, `ID duplicado '${act.id}'.`, "error"));
      actions.add(act.id);
      if (act.evidence && !evidence.has(act.evidence)) {
        errors.push(issue(`locations[${i}].actions[${j}].evidence`, `Prova '${act.evidence}' não existe.`, "error"));
      }
    }
  }

  if (meta.start && locations.size && !locations.has(meta.start)) {
    errors.push(issue("metadata.start", `Cidade '${meta.start}' não existe em locations.`, "error"));
  }
  if (game.culprit && suspects.size && !suspects.has(game.culprit)) {
    errors.push(issue("culprit", `Suspeito '${game.culprit}' não existe.`, "error"));
  }

  for (const [from, dests] of Object.entries(game.travel || {})) {
    if (locations.size && !locations.has(from)) {
      errors.push(issue(`travel.${from}`, `Origem '${from}' não existe em locations.`, "error"));
    }
    for (const to of Object.keys(dests || {})) {
      if (locations.size && !locations.has(to)) {
        errors.push(issue(`travel.${from}.${to}`, `Destino '${to}' não existe em locations.`, "error"));
      }
    }
  }

  const chapters = [];
  if (game.campaign?.chapters) {
    for (const [id, ch] of Object.entries(game.campaign.chapters)) {
      chapters.push({ id, ...ch });
    }
  } else {
    chapters.push({
      id: "implicit",
      culprit: game.culprit,
      start: meta.start,
      total_hours: meta.total_hours,
      arrest_requirements: game.arrest_requirements || { minimum_evidence: 0, required_evidence: [] },
      scenarios: game.scenarios || [],
    });
  }

  for (const chapter of chapters) {
    const start = chapter.start || meta.start;
    const hours = chapter.total_hours || meta.total_hours || 0;
    const required = new Set(chapter.arrest_requirements?.required_evidence || []);
    for (const req of required) {
      if (evidence.size && !evidence.has(req)) {
        errors.push(issue(`chapter.${chapter.id}.arrest_requirements`, `Prova obrigatória '${req}' não existe.`, "error"));
      }
    }
    for (const [si, scenario] of (chapter.scenarios || []).entries()) {
      const spath = `campaign.chapters.${chapter.id}.scenarios[${si}]`;
      if (scenario?.id) {
        if (scenarioIds.has(scenario.id)) errors.push(issue(`${spath}.id`, `ID duplicado '${scenario.id}'.`, "error"));
        scenarioIds.add(scenario.id);
      }
      const route = scenario?.route || [];
      if (route.length && start && route[0] !== start) {
        errors.push(issue(`${spath}.route[0]`, `Rota deve começar em '${start}'.`, "error"));
      }
      const seen = new Set();
      let travelTotal = 0;
      let cyclic = false;
      for (const [ri, city] of route.entries()) {
        if (!locations.has(city) && locations.size) {
          errors.push(issue(`${spath}.route[${ri}]`, `Cidade '${city}' não existe em locations.`, "error"));
        }
        if (seen.has(city)) cyclic = true;
        seen.add(city);
        if (ri > 0) {
          const cost = travelCost(game, route[ri - 1], city);
          if (cost == null) {
            errors.push(issue(`${spath}.route[${ri}]`, `Sem custo de viagem ${route[ri - 1]} → ${city}.`, "error"));
          } else travelTotal += cost;
          const nav = scenario.navigation || game.navigation || {};
          if (nav[route[ri - 1]] && !nav[route[ri - 1]].includes(city)) {
            errors.push(issue(`${spath}.route[${ri}]`, `Navegação não permite ${route[ri - 1]} → ${city}.`, "error"));
          }
        }
      }
      if (cyclic) errors.push(issue(`${spath}.route`, "Rota cíclica.", "error"));
      if (typeof hours === "number" && travelTotal > hours) {
        errors.push(issue(`${spath}.route`, `Custo da rota ${travelTotal}h excede o prazo ${hours}h.`, "error"));
      }
      const collected = new Set();
      for (const city of route) {
        for (const base of locations.get(city)?.actions || []) {
          const eff = actionEffective(base, scenario);
          if (eff.evidence) collected.add(eff.evidence);
        }
      }
      for (const req of required) {
        if (!collected.has(req)) {
          errors.push(issue(`${spath}.route`, `Rota não oferece prova obrigatória '${req}'.`, "error"));
        }
      }
      const end = route[route.length - 1];
      const endLoc = locations.get(end);
      const hasArrest = (endLoc?.actions || []).some((base) => actionEffective(base, scenario).arrest === true);
      if (end && endLoc && !hasArrest) {
        errors.push(issue(`${spath}.route`, `Destino '${end}' não tem ação de prisão.`, "error"));
      }
    }
  }

  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  return { status, version, issues: [...errors, ...warnings] };
}

module.exports = { validateCase, detectVersion };
