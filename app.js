const talks = window.PAROS_VOD_CATALOG || [];
const talkTexts = new Map((window.PAROS_TALK_TEXTS || []).map((note) => [note.id, note]));

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
  talkTextTitle: document.querySelector("#talkTextTitle"),
  talkTextStatus: document.querySelector("#talkTextStatus"),
  talkTextBody: document.querySelector("#talkTextBody"),
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
  renderTalkText(talk);
}

function renderTalkText(talk) {
  const note = talkTexts.get(talk.id);
  if (!note) {
    els.talkTextTitle.textContent = "Text not available";
    els.talkTextStatus.textContent = "No mapped transcript text is available for this talk yet.";
    els.talkTextBody.innerHTML = "";
    return;
  }

  const mainPoints = Array.isArray(note.mainPoints) ? note.mainPoints : [];
  const takeaways = Array.isArray(note.clinicalTakeaways) ? note.clinicalTakeaways : [];
  const terms = Array.isArray(note.keyTerms) && note.keyTerms.length ? `<p class="key-terms"><strong>Terms to track:</strong> ${note.keyTerms.map(escapeHtml).join(", ")}</p>` : "";

  els.talkTextTitle.textContent = note.heading || `${talk.title} | ${talk.speaker}`;
  els.talkTextStatus.textContent = "Mapped transcript text";
  els.talkTextBody.innerHTML = `
    ${note.overview ? `<h5>Overview</h5><p>${escapeHtml(note.overview)}</p>` : ""}
    ${mainPoints.length ? `
      <h5>Main points</h5>
      <ol>
        ${mainPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    ` : ""}
    ${takeaways.length ? `
      <h5>Clinical takeaways</h5>
      <ul>
        ${takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    ` : ""}
    ${terms}
    ${note.sourceNote ? `<p class="source-note">${escapeHtml(note.sourceNote)}</p>` : ""}
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
