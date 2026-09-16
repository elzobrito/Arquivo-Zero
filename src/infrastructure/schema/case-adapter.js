"use strict";

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

function adaptCase(raw) {
  const warnings = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { normalized: raw, warnings, version: null };
  }
  const version = detectVersion(raw);
  const normalized = Object.assign({}, raw);
  if (version === "3.x") {
    return { normalized, warnings, version };
  }
  if (!raw.schemaVersion) {
    warnings.push({ path: "schemaVersion", message: `Ausente; tratado como ${version}` });
  }
  normalized.schemaVersion = version === "1.x" ? "1.x" : "2.x";
  normalized.evidence = (raw.evidence || []).map((item, index) => {
    if (!item || typeof item !== "object") return item;
    if (item.admissibility != null && item.integrity != null && item.quality !== undefined) return item;
    const id = item.id || String(index);
    if (item.admissibility == null) {
      warnings.push({ path: `evidence.${id}.admissibility`, message: "Ausente; preenchido com unknown" });
    }
    return Object.assign({ admissibility: "unknown", quality: null, integrity: "unverified" }, item);
  });
  return { normalized, warnings, version };
}

module.exports = { adaptCase, detectVersion };
