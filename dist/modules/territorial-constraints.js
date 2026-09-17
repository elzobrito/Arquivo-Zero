function outcome(result, explanation) {
  return { result: result, explanation: explanation };
}

function unknown(explanation) {
  return outcome("UNKNOWN", explanation);
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalized(value) {
  const candidate = text(value);
  return candidate ? candidate.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR") : null;
}

function statesFrom(catalog) {
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.states)) return null;
  return catalog.states;
}

function findState(stateId, catalog) {
  const wanted = normalized(stateId);
  const states = statesFrom(catalog);
  if (!wanted || !states) return null;
  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    if (state && normalized(state.stateId) === wanted) return state;
  }
  return null;
}

export function matchRegion(stateId, region, catalog) {
  const wanted = normalized(region);
  if (!wanted) return unknown("região alvo ausente ou inválida.");
  if (!statesFrom(catalog)) return unknown("catálogo territorial ausente ou inválido.");
  const state = findState(stateId, catalog);
  if (!state) return unknown("estado " + String(stateId) + " não consta no catálogo territorial.");
  const actual = normalized(state.region);
  if (!actual) return unknown("região do estado " + String(stateId) + " não cadastrada.");
  if (actual === wanted) {
    return outcome("MATCH", "estado " + String(state.stateId) + " pertence à região " + String(state.region) + ".");
  }
  return outcome("NO_MATCH", "estado " + String(state.stateId) + " pertence à região " + String(state.region) + ", não a " + String(region) + ".");
}

export function matchState(stateId, targetStateId) {
  const actual = normalized(stateId);
  const wanted = normalized(targetStateId);
  if (!actual || !wanted) return unknown("identificador de estado ausente ou inválido.");
  if (actual === wanted) return outcome("MATCH", "estado " + String(stateId) + " corresponde a " + String(targetStateId) + ".");
  return outcome("NO_MATCH", "estado " + String(stateId) + " não corresponde a " + String(targetStateId) + ".");
}

function comparable(value) {
  if (typeof value === "string") return normalized(value);
  if (typeof value === "number" && Number.isFinite(value)) return "number:" + String(value);
  if (typeof value === "boolean") return "boolean:" + String(value);
  if (value && typeof value === "object") {
    for (const field of ["id", "code", "name", "value"]) {
      if (Object.prototype.hasOwnProperty.call(value, field)) {
        const candidate = comparable(value[field]);
        if (candidate !== null) return candidate;
      }
    }
  }
  return null;
}

export function matchInfrastructure(stateId, field, value, catalog) {
  if (!statesFrom(catalog)) return unknown("catálogo territorial ausente ou inválido.");
  const state = findState(stateId, catalog);
  if (!state) return unknown("estado " + String(stateId) + " não consta no catálogo territorial.");
  const fieldName = text(field);
  const attributes = state.investigativeAttributes;
  if (!fieldName || !attributes || typeof attributes !== "object" || !Object.prototype.hasOwnProperty.call(attributes, fieldName)) {
    return unknown("campo de infraestrutura " + String(field) + " não cadastrado para " + String(state.stateId) + ".");
  }
  const entries = attributes[fieldName];
  if (!Array.isArray(entries)) return unknown("campo de infraestrutura " + fieldName + " possui formato inválido.");
  if (entries.length === 0) return unknown("campo de infraestrutura " + fieldName + " não cadastrado; lista vazia não significa inexistência.");
  const wanted = comparable(value);
  if (wanted === null) return unknown("valor de infraestrutura ausente ou inválido.");
  let sawComparable = false;
  for (let index = 0; index < entries.length; index += 1) {
    const candidate = comparable(entries[index]);
    if (candidate === null) continue;
    sawComparable = true;
    if (candidate === wanted) {
      return outcome("MATCH", "infraestrutura " + fieldName + " contém " + String(value) + " em " + String(state.stateId) + ".");
    }
  }
  if (!sawComparable) return unknown("campo de infraestrutura " + fieldName + " não possui valores comparáveis.");
  return outcome("NO_MATCH", "infraestrutura " + fieldName + " não contém " + String(value) + " em " + String(state.stateId) + ".");
}
