const talks = window.PAROS_VOD_CATALOG || [];
const chapters = window.PAROS_CHAPTERS || [];

const state = {
  filter: "all",
  query: "",
  selectedTalk: null,
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

renderCatalog();
renderChapters();
