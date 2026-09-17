export const DEFAULT_FILTERS = {
  query: "",
  tag: "all",
  admissibility: "all",
  integrity: "all",
  quality: "all",
  support: "all",
};

function normalizeQuery(q) {
  return String(q || "").trim().toLowerCase();
}

export function matchesQuality(model, band) {
  if (band === "all") return true;
  if (band === "unknown") return model.quality == null;
  const q = model.quality;
  if (q == null) return false;
  if (band === "high") return q >= 0.8;
  if (band === "medium") return q >= 0.5 && q < 0.8;
  if (band === "low") return q < 0.5;
  return true;
}

export function applyFilters(models, filters) {
  const f = { ...DEFAULT_FILTERS, ...(filters || {}) };
  const query = normalizeQuery(f.query);
  return (models || []).filter((m) => {
    if (!m) return false;
    if (f.tag !== "all" && m.tag !== f.tag) return false;
    if (f.admissibility !== "all" && m.admissibility !== f.admissibility) return false;
    if (f.integrity !== "all" && m.integrity !== f.integrity) return false;
    if (!matchesQuality(m, f.quality)) return false;
    if (f.support === "yes" && !m.canSupportArrest) return false;
    if (f.support === "no" && m.canSupportArrest) return false;
    if (query) {
      const hay = [m.id, m.title, m.tag, m.fact, m.interpretationLabel, m.source, m.method]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function applySort(models, sort) {
  const key = (sort && sort.key) || "id";
  const dir = (sort && sort.dir) === "desc" ? -1 : 1;
  return (models || []).slice().sort((a, b) => {
    const av = a && a[key] != null ? String(a[key]) : "";
    const bv = b && b[key] != null ? String(b[key]) : "";
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    const ai = a && a.id != null ? String(a.id) : "";
    const bi = b && b.id != null ? String(b.id) : "";
    if (ai < bi) return -1;
    if (ai > bi) return 1;
    return 0;
  });
}

export function uniqueTags(models) {
  const seen = {};
  const out = [];
  (models || []).forEach((m) => {
    if (!m || !m.tag || seen[m.tag]) return;
    seen[m.tag] = true;
    out.push(m.tag);
  });
  out.sort();
  return out;
}
