const talks = window.PAROS_VOD_CATALOG || [];
const chapters = window.PAROS_CHAPTERS || [];

const state = {
  filter: "all",
  query: "",
  selectedTalk: null,
  set: JSON.parse(localStorage.getItem("paros-dcs-selection") || "[]"),
};

const els = {
  search: document.querySelector("#searchInput"),
  filters: document.querySelectorAll(".chip"),
  grid: document.querySelector("#talkGrid"),
  results: document.querySelector("#resultsLine"),
  detailTitle: document.querySelector("#detailTitle"),
  detailMeta: document.querySelector("#detailMeta"),
  detailPrompt: document.querySelector("#detailPrompt"),
  officialLink: document.querySelector("#officialLink"),
  addSelected: document.querySelector("#addSelected"),
  selectedList: document.querySelector("#selectedList"),
  selectionCount: document.querySelector("#selectionCount"),
  outlineBox: document.querySelector("#outlineBox"),
  copyOutline: document.querySelector("#copyOutline"),
  copyStatus: document.querySelector("#copyStatus"),
  clearSelection: document.querySelector("#clearSelection"),
  chapterTabs: document.querySelector("#chapterTabs"),
  chapterReader: document.querySelector("#chapterReader"),
};

function normalized(text) {
  return String(text || "").toLowerCase();
}

function visibleTalks() {
  const query = normalized(state.query);
  return talks.filter((talk) => {
    const matchesFilter = state.filter === "all" || talk.category === state.filter;
    const haystack = normalized([
      talk.title,
      talk.speaker,
      talk.day,
      talk.session,
      talk.category,
      talk.fullTitle,
    ].join(" "));
    return matchesFilter && (!query || haystack.includes(query));
  });
}

function renderCatalog() {
  const items = visibleTalks();
  els.results.textContent = `${items.length} of ${talks.length} talks shown`;
  els.grid.innerHTML = "";

  for (const talk of items) {
    const card = document.createElement("button");
    card.className = "talk-card";
    card.type = "button";
    card.innerHTML = `
      <img class="thumb" src="${talk.thumbnailUrl}" alt="" loading="lazy">
      <span class="talk-body">
        <span class="tag-row">
          <span class="tag">${talk.day}</span>
          <span class="tag">${talk.category}</span>
        </span>
        <h3>${escapeHtml(talk.title)}</h3>
        <p class="speaker">${escapeHtml(talk.speaker || talk.session)}</p>
      </span>
    `;
    card.addEventListener("click", () => chooseTalk(talk));
    els.grid.appendChild(card);
  }
}

function chooseTalk(talk) {
  state.selectedTalk = talk;
  els.detailTitle.textContent = talk.title;
  els.detailMeta.textContent = [talk.speaker, talk.day, talk.session].filter(Boolean).join(" · ");
  els.detailPrompt.textContent = talk.usePrompt;
  els.officialLink.href = talk.pageUrl;
  els.officialLink.setAttribute("aria-disabled", "false");
  els.addSelected.disabled = false;
}

function addCurrentTalk() {
  if (!state.selectedTalk) return;
  if (!state.set.some((talk) => talk.id === state.selectedTalk.id)) {
    state.set.push(state.selectedTalk);
    persistSelection();
  }
}

function removeTalk(id) {
  state.set = state.set.filter((talk) => talk.id !== id);
  persistSelection();
}

function persistSelection() {
  localStorage.setItem("paros-dcs-selection", JSON.stringify(state.set));
  renderSelection();
}

function renderSelection() {
  els.selectionCount.textContent = `${state.set.length} selected`;
  els.selectedList.innerHTML = "";

  if (!state.set.length) {
    const empty = document.createElement("li");
    empty.textContent = "Select talks from the catalog to build an agenda.";
    els.selectedList.appendChild(empty);
  } else {
    for (const talk of state.set) {
      const item = document.createElement("li");
      item.innerHTML = `
        <span>${escapeHtml(talk.idx)}. ${escapeHtml(talk.title)}</span>
        <button type="button" aria-label="Remove ${escapeHtml(talk.title)}">Remove</button>
      `;
      item.querySelector("button").addEventListener("click", () => removeTalk(talk.id));
      els.selectedList.appendChild(item);
    }
  }

  els.outlineBox.value = buildOutline();
}

function buildOutline() {
  if (!state.set.length) {
    return "DCS Takeaway Discussion Set\\n\\n1. Select 3-7 talks from the catalog.\\n2. Use this box as the agenda seed.\\n3. Replace catalog prompts with your own final takeaways after review.";
  }

  const grouped = state.set.reduce((acc, talk) => {
    acc[talk.category] ||= [];
    acc[talk.category].push(talk);
    return acc;
  }, {});

  const lines = [
    "DCS Takeaway Discussion Set",
    "",
    "Purpose:",
    "- Translate selected PAROS DCS/SEEG talks into practical clinical, teaching, or research takeaways.",
    "",
    "Selected talks:",
  ];

  for (const [category, categoryTalks] of Object.entries(grouped)) {
    lines.push("", category);
    for (const talk of categoryTalks) {
      lines.push(`- ${talk.title}${talk.speaker ? ` | ${talk.speaker}` : ""}`);
      lines.push(`  Use: ${talk.usePrompt}`);
      lines.push(`  Official page: ${talk.pageUrl}`);
    }
  }

  lines.push(
    "",
    "Discussion prompts:",
    "- What should change in our stimulation protocol, bedside questioning, or interpretation language?",
    "- Which findings are ready for clinical use, and which are hypothesis-generating?",
    "- What one local project or quality-improvement question follows from this set?",
    "",
    "Sharing note:",
    "- Share authored takeaways and teaching notes. Do not redistribute raw videos or transcripts without permission."
  );

  return lines.join("\\n");
}

function copyOutline() {
  navigator.clipboard.writeText(els.outlineBox.value).then(() => {
    els.copyStatus.textContent = "Outline copied.";
    window.setTimeout(() => (els.copyStatus.textContent = ""), 1800);
  });
}

function renderChapters() {
  if (!els.chapterTabs || !els.chapterReader || !chapters.length) return;

  els.chapterTabs.innerHTML = "";
  chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.className = `chapter-tab${index === 0 ? " active" : ""}`;
    button.type = "button";
    button.textContent = chapter.title;
    button.addEventListener("click", () => {
      document.querySelectorAll(".chapter-tab").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderChapterReader(chapter);
    });
    els.chapterTabs.appendChild(button);
  });

  renderChapterReader(chapters[0]);
}

function renderChapterReader(chapter) {
  els.chapterReader.innerHTML = `
    <p class="eyebrow">Draft chapter · ${chapter.talks} talks</p>
    <h3>${escapeHtml(chapter.title)}</h3>
    <p class="chapter-meta">${escapeHtml(chapter.thesis)}</p>
    <p>${escapeHtml(chapter.text)}</p>
    <p><strong>Best use:</strong> ${escapeHtml(chapter.use)}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCatalog();
});

for (const chip of els.filters) {
  chip.addEventListener("click", () => {
    state.filter = chip.dataset.filter;
    els.filters.forEach((button) => button.classList.toggle("active", button === chip));
    renderCatalog();
  });
}

els.addSelected.addEventListener("click", addCurrentTalk);
els.copyOutline.addEventListener("click", copyOutline);
els.clearSelection.addEventListener("click", () => {
  state.set = [];
  persistSelection();
});

renderCatalog();
renderSelection();
renderChapters();
