/**
 * View-model for one discovered evidence record (ESM).
 */

export function labelOrUnknown(value, unknownLabel) {
  if (value == null || value === "") return unknownLabel;
  return String(value);
}

export function qualityLabel(quality) {
  if (quality == null || Number.isNaN(Number(quality))) return "Não informado";
  const n = Number(quality);
  if (n >= 0.8) return `Alta (${n})`;
  if (n >= 0.5) return `Média (${n})`;
  return `Baixa (${n})`;
}

export function admissibilityLabel(value) {
  if (value === "admissible") return "Admissível";
  if (value === "inadmissible") return "Inadmissível";
  return "Não informado";
}

export function integrityLabel(value) {
  if (value === "verified") return "Verificada";
  if (value === "compromised") return "Comprometida";
  if (value === "unverified") return "Não verificada";
  return "Não informado";
}

function policyNotes(record, policy) {
  const notes = [];
  if (!policy.isAdmissible(record)) {
    notes.push("Marcação explícita de inadmissibilidade — não contribui para mandado.");
  } else if (record.admissibility === "unknown" || record.admissibility == null) {
    notes.push("Admissibilidade não informada — benefício da dúvida (não bloqueia).");
  } else {
    notes.push("Admissível para consulta e possível uso em mandado.");
  }
  if (!policy.isIntegrityVerified(record)) {
    notes.push("Integridade comprometida — não contribui para mandado.");
  } else if (record.integrity === "unverified" || record.integrity == null) {
    notes.push("Integridade não verificada — benefício da dúvida (não bloqueia).");
  } else {
    notes.push("Integridade verificada.");
  }
  if (record.quality == null) {
    notes.push("Qualidade não informada — não falha o limiar por ausência.");
  }
  if (policy.canSupportArrest(record)) {
    notes.push("Pode contribuir para um mandado (não prova autoria sozinha).");
  } else {
    notes.push("Não pode contribuir para mandado enquanto o bloqueio explícito permanecer.");
  }
  return notes;
}

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.slice();
  return [value];
}

export function buildViewModel(record, ctx = {}) {
  const policy = ctx.policy;
  const factText = labelOrUnknown(record.text || record.fact, "Desconhecido");
  const interpretation =
    record.interpretation != null && record.interpretation !== ""
      ? String(record.interpretation)
      : null;
  return {
    id: record.id,
    title: labelOrUnknown(record.title, "Sem título"),
    tag: labelOrUnknown(record.tag, "sem-tag"),
    fact: factText,
    interpretation,
    interpretationLabel: interpretation || "Desconhecido",
    source: labelOrUnknown(record.source, "Não informado"),
    method: labelOrUnknown(record.method, "Não informado"),
    origin: labelOrUnknown(record.origin || record.source, "Não informado"),
    chapter: ctx.chapter || "Não informado",
    scenarioId: ctx.scenarioId || "Não informado",
    quality: record.quality,
    qualityLabel: qualityLabel(record.quality),
    admissibility: record.admissibility == null ? "unknown" : record.admissibility,
    admissibilityLabel: admissibilityLabel(record.admissibility),
    integrity: record.integrity == null ? "unverified" : record.integrity,
    integrityLabel: integrityLabel(record.integrity),
    relations: asList(record.relations),
    contradictions: asList(record.contradictions),
    essential: !!(ctx.isEssential && ctx.isEssential(record.id)),
    canSupportArrest: policy.canSupportArrest(record),
    isAdmissible: policy.isAdmissible(record),
    isIntegrityVerified: policy.isIntegrityVerified(record),
    policyNotes: policyNotes(record, policy),
    raw: record,
  };
}

export function buildViewModels(records, ctx) {
  return (Array.isArray(records) ? records : []).map((record) => buildViewModel(record, ctx || {}));
}
