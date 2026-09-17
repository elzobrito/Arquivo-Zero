import { buildEvidenceBoard } from "./build-evidence-board.js";
import { DEFAULT_FILTERS, uniqueTags } from "./evidence-filters.js";
import { renderEvidenceDetails, escapeHtml } from "./evidence-details.js";

const STORE = "arquivo-zero-pursuit-v2";
const CAMPAIGN = "arquivo-zero-campaign-v1";

let gameCache = null;
let filters = { ...DEFAULT_FILTERS };
let sort = { key: "id", dir: "asc" };
let selectedId = null;
let wired = false;

async function loadGame() {
  if (gameCache) return gameCache;
  const res = await fetch("./game.json", { cache: "no-store" });
  if (!res.ok) throw new Error("game.json indisponível");
  gameCache = await res.json();
  return gameCache;
}

function campaignOn(game) {
  return !!(game && game.campaign && game.campaign.chapters);
}

function readCampaign(game) {
  if (!campaignOn(game)) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(`${CAMPAIGN}-${game.campaign.id}`) || "null");
    if (Array.isArray(raw?.run) && raw.run.length) return raw;
  } catch {}
  return null;
}

function chapterLabel(game, campaign) {
  if (!campaignOn(game) || !campaign) return null;
  const id = campaign.run?.[campaign.index];
  return id || null;
}

function saveKey(game, campaign) {
  if (campaignOn(game) && campaign) {
    return `${STORE}-${game.metadata.id}-${campaign.run[campaign.index]}`;
  }
  return `${STORE}-${game.metadata.id}`;
}

function readState(game) {
  const campaign = readCampaign(game);
  try {
    const parsed = JSON.parse(localStorage.getItem(saveKey(game, campaign)) || "null");
    if (parsed && typeof parsed === "object") return { state: parsed, campaign };
  } catch {}
  return {
    state: {
      evidence: [],
      scenario: null,
      location: game?.metadata?.start || null,
    },
    campaign,
  };
}

function optionList(values, current, allLabel) {
  const opts = [`<option value="all"${current === "all" ? " selected" : ""}>${escapeHtml(allLabel)}</option>`];
  values.forEach((v) => {
    opts.push(`<option value="${escapeHtml(v)}"${current === v ? " selected" : ""}>${escapeHtml(v)}</option>`);
  });
  return opts.join("");
}

function renderShell(root) {
  if (root.dataset.ready === "1") return;
  root.dataset.ready = "1";
  root.innerHTML = `
    <div class="ev-board" id="ev-board-root">
      <div class="ev-toolbar" role="search">
        <label class="ev-field"><span>Buscar</span>
          <input id="ev-filter-query" type="search" placeholder="id, título, fato…" autocomplete="off" />
        </label>
        <label class="ev-field"><span>Tag</span>
          <select id="ev-filter-tag">${optionList([], "all", "Todas")}</select>
        </label>
        <label class="ev-field"><span>Admissibilidade</span>
          <select id="ev-filter-admissibility">
            <option value="all">Todas</option>
            <option value="admissible">Admissível</option>
            <option value="inadmissible">Inadmissível</option>
            <option value="unknown">Não informado</option>
          </select>
        </label>
        <label class="ev-field"><span>Integridade</span>
          <select id="ev-filter-integrity">
            <option value="all">Todas</option>
            <option value="verified">Verificada</option>
            <option value="unverified">Não verificada</option>
            <option value="compromised">Comprometida</option>
          </select>
        </label>
        <label class="ev-field"><span>Qualidade</span>
          <select id="ev-filter-quality">
            <option value="all">Todas</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
            <option value="unknown">Não informada</option>
          </select>
        </label>
        <label class="ev-field"><span>Mandado</span>
          <select id="ev-filter-support">
            <option value="all">Todas</option>
            <option value="yes">Pode contribuir</option>
            <option value="no">Não contribui</option>
          </select>
        </label>
        <label class="ev-field"><span>Ordenar</span>
          <select id="ev-sort-key">
            <option value="id">ID</option>
            <option value="title">Título</option>
            <option value="tag">Tag</option>
          </select>
        </label>
      </div>
      <p class="ev-board-meta" id="ev-board-meta" aria-live="polite"></p>
      <div class="ev-board-body">
        <div id="evidence-board-list" class="evidence-board-list" role="listbox" aria-label="Evidências descobertas"></div>
        <aside id="evidence-detail" class="evidence-detail" aria-live="polite"></aside>
      </div>
    </div>`;
}

function paint(view) {
  const list = document.getElementById("evidence-board-list");
  const detail = document.getElementById("evidence-detail");
  const meta = document.getElementById("ev-board-meta");
  const count = document.getElementById("evidence-count");
  const tagSelect = document.getElementById("ev-filter-tag");
  if (!list || !detail || !meta) return;

  const tags = uniqueTags(view.payload.allItems || view.payload.items);
  if (tagSelect) {
    const current = filters.tag;
    tagSelect.innerHTML = optionList(tags, current, "Todas");
  }

  const n = view.payload.totalDiscovered;
  const v = view.payload.visibleCount;
  meta.textContent =
    n === 0
      ? "Nenhuma prova catalogada ainda."
      : v === n
        ? `${n} ${n === 1 ? "catalogada" : "catalogadas"}`
        : `${v} visíveis de ${n} catalogadas`;
  if (count) {
    count.textContent = `${n} ${n === 1 ? "catalogada" : "catalogadas"}`;
  }

  if (!view.payload.items.length) {
    list.innerHTML =
      n === 0
        ? `<div class="empty-state"><span>ARQUIVO LACRADO</span><strong>Nenhuma prova catalogada</strong><p>Investigue a cidade atual para revelar evidências. Inadmissíveis também aparecem aqui quando descobertas.</p></div>`
        : `<div class="empty-state"><span>FILTRO VAZIO</span><strong>Nenhuma evidência neste filtro</strong><p>Ajuste os filtros — o acervo descoberto não foi alterado.</p></div>`;
    detail.innerHTML = renderEvidenceDetails(null);
    return;
  }

  list.innerHTML = view.payload.items
    .map((item) => {
      const selected = item.id === view.selectedId;
      const blocked = !item.canSupportArrest;
      return `<button type="button" role="option" class="ev-card${selected ? " is-selected" : ""}${blocked ? " is-blocked" : ""}" data-id="${escapeHtml(item.id)}" aria-selected="${selected ? "true" : "false"}">
        <div class="ev-card-top"><span>${escapeHtml(item.id)}</span><em>${escapeHtml(item.tag)}</em></div>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="ev-card-flags">${escapeHtml(item.admissibilityLabel)} · ${escapeHtml(item.integrityLabel)}</span>
      </button>`;
    })
    .join("");

  detail.innerHTML = view.detailsHtml;
}

async function refreshBoard() {
  const host = document.getElementById("evidence-board-host");
  if (!host) return;
  renderShell(host);
  const game = await loadGame();
  const { state, campaign } = readState(game);
  const payload = buildEvidenceBoard(state, game, {
    filters,
    sort,
    chapter: chapterLabel(game, campaign),
  });
  if (selectedId && !payload.items.some((i) => i.id === selectedId)) {
    selectedId = payload.items[0]?.id || null;
  }
  if (!selectedId && payload.items[0]) selectedId = payload.items[0].id;
  const selected = payload.items.find((i) => i.id === selectedId) || null;
  paint({
    payload,
    selectedId,
    detailsHtml: renderEvidenceDetails(selected),
  });
}

function bindFilters() {
  const map = [
    ["ev-filter-query", "query"],
    ["ev-filter-tag", "tag"],
    ["ev-filter-admissibility", "admissibility"],
    ["ev-filter-integrity", "integrity"],
    ["ev-filter-quality", "quality"],
    ["ev-filter-support", "support"],
  ];
  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.dataset.bound = "1";
    const evt = id === "ev-filter-query" ? "input" : "change";
    el.addEventListener(evt, () => {
      filters = { ...filters, [key]: el.value };
      refreshBoard();
    });
  });
  const sortEl = document.getElementById("ev-sort-key");
  if (sortEl && !sortEl.dataset.bound) {
    sortEl.dataset.bound = "1";
    sortEl.addEventListener("change", () => {
      sort = { key: sortEl.value, dir: "asc" };
      refreshBoard();
    });
  }
  const list = document.getElementById("evidence-board-list");
  if (list && !list.dataset.bound) {
    list.dataset.bound = "1";
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      selectedId = btn.getAttribute("data-id");
      refreshBoard();
    });
    list.addEventListener("keydown", (e) => {
      const buttons = [...list.querySelectorAll("[data-id]")];
      if (!buttons.length) return;
      const idx = buttons.findIndex((b) => b.getAttribute("data-id") === selectedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = buttons[Math.min(buttons.length - 1, Math.max(0, idx) + 1)];
        selectedId = next.getAttribute("data-id");
        next.focus();
        refreshBoard();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = buttons[Math.max(0, idx - 1)];
        selectedId = prev.getAttribute("data-id");
        prev.focus();
        refreshBoard();
      } else if (e.key === "Enter" || e.key === " ") {
        const btn = e.target.closest("[data-id]");
        if (btn) {
          e.preventDefault();
          selectedId = btn.getAttribute("data-id");
          refreshBoard();
        }
      }
    });
  }
}

function wire() {
  if (wired) return;
  wired = true;
  const dialog = document.getElementById("evidence-dialog");
  const legacyList = document.getElementById("evidence-list");
  if (legacyList) {
    legacyList.hidden = true;
    legacyList.setAttribute("aria-hidden", "true");
  }
  const open = () => {
    bindFilters();
    refreshBoard();
  };
  if (dialog) {
    dialog.addEventListener("toggle", () => {
      if (dialog.open) open();
    });
  }
  const btn = document.getElementById("evidence-button");
  if (btn) {
    btn.addEventListener("click", () => {
      // after app.js showModal
      requestAnimationFrame(open);
    });
  }
  // When app.js rewrites legacy list on render, refresh if dialog open
  if (legacyList) {
    new MutationObserver(() => {
      if (dialog && dialog.open) refreshBoard();
    }).observe(legacyList, { childList: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wire);
} else {
  wire();
}

export { refreshBoard, wire };
