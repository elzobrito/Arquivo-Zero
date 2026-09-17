export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listBlock(title, items, emptyText) {
  if (!items || !items.length) {
    return `<section class="ev-section"><h4>${escapeHtml(title)}</h4><p class="ev-muted">${escapeHtml(emptyText)}</p></section>`;
  }
  return `<section class="ev-section"><h4>${escapeHtml(title)}</h4><ul>${items
    .map((item) => {
      if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
      const label = item.label || item.id || item.type || JSON.stringify(item);
      return `<li>${escapeHtml(label)}</li>`;
    })
    .join("")}</ul></section>`;
}

export function renderEvidenceDetails(model) {
  if (!model) {
    return `<div class="ev-detail-empty" role="status"><strong>Selecione uma evidência</strong><p>O detalhe mostra fato, interpretação (se houver), origem e status da policy — sem concluir autoria.</p></div>`;
  }
  const support = model.canSupportArrest
    ? "Pode contribuir para mandado"
    : "Não contribui para mandado";
  return `<article class="ev-detail" aria-labelledby="ev-detail-title">
    <header class="ev-detail-head">
      <p class="ev-kicker">${escapeHtml(model.id)}${model.essential ? " · essencial ao mandado" : ""}</p>
      <h3 id="ev-detail-title">${escapeHtml(model.title)}</h3>
      <p class="ev-tags"><span>${escapeHtml(model.tag)}</span><span>${escapeHtml(model.admissibilityLabel)}</span><span>${escapeHtml(model.integrityLabel)}</span><span>${escapeHtml(support)}</span></p>
    </header>
    <section class="ev-section ev-fact" aria-label="Fato"><h4>Fato</h4><p>${escapeHtml(model.fact)}</p></section>
    <section class="ev-section ev-interpretation" aria-label="Interpretação">
      <h4>Interpretação</h4>
      <p>${escapeHtml(model.interpretationLabel)}</p>
      ${model.interpretation ? "" : '<p class="ev-muted">Nenhuma interpretação cadastrada — permanece Desconhecido.</p>'}
    </section>
    <section class="ev-section"><h4>Origem e método</h4>
      <dl class="ev-dl">
        <div><dt>Origem / fonte</dt><dd>${escapeHtml(model.origin)}</dd></div>
        <div><dt>Método</dt><dd>${escapeHtml(model.method)}</dd></div>
        <div><dt>Capítulo</dt><dd>${escapeHtml(model.chapter)}</dd></div>
        <div><dt>Cenário</dt><dd>${escapeHtml(model.scenarioId)}</dd></div>
        <div><dt>Qualidade</dt><dd>${escapeHtml(model.qualityLabel)}</dd></div>
      </dl>
    </section>
    ${listBlock("Relações cadastradas", model.relations, "Nenhuma relação cadastrada.")}
    ${listBlock("Contradições", model.contradictions, "Nenhuma contradição cadastrada.")}
    ${listBlock("Notas da policy", model.policyNotes, "Sem notas.")}
    <p class="ev-disclaimer">Identificar evidência ≠ provar autoria. Este quadro não emite conclusão de culpado.</p>
  </article>`;
}
