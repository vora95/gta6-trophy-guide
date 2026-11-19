// Leonida Platinum Guide — the tracker. Content lives in data/trophies.json;
// this script only turns it into a checklist: it renders the list, filters
// it, remembers what the player ticked, and exports or imports that progress.
// It talks to nothing outside the app folder besides the local trophy file,
// and it never uses the clock or a random number, so every screenshot mode
// renders the same way every time.

const SAVE_KEY = "gta6-trophy-guide-v1";
const KIND_NAMES = {
  story: "Story",
  side: "Side stories",
  activity: "Activities",
  collectible: "Collectibles",
  combat: "Combat & crime",
  exploration: "Exploration",
  money: "Money",
  misc: "One-offs",
};

// The four roadmap phases, in the order a player should work through them.
const ROADMAP = [
  {
    title: "Phase 1 — Play the story, save every chapter",
    text: "Finish the five chapters and their named missions. All 12 story trophies are unmissable, but keep one manual save at the start of every chapter and one untouched save from just before the final mission: there is no mission replay. Do Lucia\u2019s balcony meditation in Chapter 1 (Positive Mental Attitude) and Race Against Yago the moment it appears in Chapter 3.",
    kinds: ["story"],
  },
  {
    title: "Phase 2 — Side stories and strangers",
    text: "After the story, finish the six side-story finales (Andy, Kenton, Billy, Randy, Tyrone, Bret) and the 8 Strangers & Freaks strands. All of them stay available after the credits. Andy\u2019s strand is reported Lucia-only; Tyrone\u2019s and Bret\u2019s are reported Jason-only.",
    kinds: ["side"],
  },
  {
    title: "Phase 3 — Activities, collectibles and free roam",
    text: "Work the open world: stunts, Shooting Range golds, drone races, races, fishing, arcade, cards, WAiNK scans, vehicles, meditation spots, robberies and money. Most of these overlap with the 100% checklist, so progress here is progress toward Phase 4.",
    kinds: ["activity", "collectible", "exploration", "combat", "money"],
  },
  {
    title: "Phase 4 — Cleanup and 100% completion",
    text: "Finish the 100% checklist (reported as 35 tasks, under Progress > Stats > 100% Completion after the story): 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 bank vaults, all 39 Illegal Operations. That earns A Long Road, and with it the Platinum, Vice Got a Price!",
    kinds: ["misc"],
  },
];

// A fixed sample checklist so the tracker can be previewed with progress.
const SAMPLE_EARNED = [
  "just-like-paradise", "paradise-lost", "tits-ass-drug-money",
  "vice-city-baby", "top-of-the-world-ma", "trust", "break-the-bank",
  "family-matters", "dwnfall", "hi-jacked", "snow-storm",
  "you-gotta-know-when-to-get-off", "baited-my-tackle", "stick-fiddler",
  "master-of-none", "earn-cash-not-kudos", "top-fun", "treat-yo-self",
  "little-boxes", "on-the-spot", "gunslinger", "sneakthief",
  "a-classic-blitz-play", "the-goodtime-state", "whip-it-good",
  "catch-me-if-you-can", "challenging-tank", "lets-go-bowling",
  "personal-best", "actions-speak-louder", "one-last-thing",
];

let trophies = [];
let meta = null;
let store = readSaved();
let pickedId = null;
let currentView = "list";

function readSaved() {
  const fallback = { earned: {}, notes: {}, spoiler: true, demo: false };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {},
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
      demo: false,
    };
  } catch (err) {
    return fallback;
  }
}

function writeSaved() {
  const snapshot = { earned: store.earned, notes: store.notes, spoiler: store.spoiler, demo: false };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    // Storage full or blocked: the checklist keeps working for this session.
  }
}

function earnedOf(trophy) {
  if (store.demo) return SAMPLE_EARNED.indexOf(trophy.id) !== -1;
  return !!store.earned[trophy.id];
}

function earnedTotal() {
  return trophies.filter(earnedOf).length;
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gradeChip(trophy) {
  return `<span class="badge ${trophy.grade}">${escapeHtml(trophy.grade)}</span>`;
}

function extraChips(trophy) {
  let chips = "";
  if (trophy.missable) chips += `<span class="badge missable">CAN MISS</span>`;
  if (trophy.hidden) chips += `<span class="badge hidden">Hidden</span>`;
  chips += `<span class="badge hidden">${escapeHtml(KIND_NAMES[trophy.kind] || trophy.kind)}</span>`;
  return chips;
}

function isHiddenStory(trophy) {
  return store.spoiler && trophy.story && !earnedOf(trophy);
}

function makeRow(trophy) {
  const earned = earnedOf(trophy);
  const hidden = isHiddenStory(trophy);
  const li = document.createElement("li");
  li.className = "trophy-row" + (earned ? " earned" : "") + (pickedId === trophy.id ? " selected" : "");
  li.dataset.id = trophy.id;
  const body = hidden
    ? `<div class="trophy-name">Hidden story trophy</div>
      <p class="trophy-desc">Finish the story to reveal it. Turn off \u201CHide story trophies\u201D to show it now.</p>
      <div class="trophy-meta">${gradeChip(trophy)}<span class="badge hidden">Story</span></div>`
    : `<div class="trophy-name">${escapeHtml(trophy.name)}</div>
      <p class="trophy-desc">${escapeHtml(trophy.description)}</p>
      <div class="trophy-meta">${gradeChip(trophy)}${extraChips(trophy)}</div>`;
  li.innerHTML = `<input type="checkbox" aria-label="Earned: ${hidden ? "hidden story trophy" : escapeHtml(trophy.name)}">
    <div class="trophy-main">${body}</div>`;
  const box = li.querySelector(`input[type="checkbox"]`);
  box.checked = earned;
  box.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (store.demo) return;
    if (box.checked) store.earned[trophy.id] = true;
    else delete store.earned[trophy.id];
    writeSaved();
    paintAll();
  });
  li.addEventListener("click", () => pick(trophy.id));
  return li;
}

function visibleTrophies() {
  const q = byId("search").value.trim().toLowerCase();
  const kind = byId("filterKind").value;
  const grade = byId("filterGrade").value;
  const status = byId("filterStatus").value;
  return trophies.filter((trophy) => {
    if (kind !== "all" && trophy.kind !== kind) return false;
    if (grade !== "all" && trophy.grade !== grade) return false;
    if (status === "earned" && !earnedOf(trophy)) return false;
    if (status === "remaining" && earnedOf(trophy)) return false;
    if (status === "missable" && !trophy.missable) return false;
    if (q) {
      const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${KIND_NAMES[trophy.kind] || ""}`.toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function paintProgress() {
  const total = trophies.length;
  const got = earnedTotal();
  const pct = total ? Math.round((got / total) * 100) : 0;
  byId("progressFill").style.width = `${pct}%`;
  byId("progressText").textContent = `${got} of ${total} trophies — ${pct}% to the Platinum${store.demo ? " (DEMO profile)" : ""}`;
  const perGrade = {};
  for (const trophy of trophies) {
    perGrade[trophy.grade] = perGrade[trophy.grade] || { got: 0, total: 0 };
    perGrade[trophy.grade].total += 1;
    if (earnedOf(trophy)) perGrade[trophy.grade].got += 1;
  }
  byId("gradeCounts").textContent = ["Platinum", "Gold", "Silver", "Bronze"]
    .map((grade) => {
      const bucket = perGrade[grade] || { got: 0, total: 0 };
      return `${grade} ${bucket.got}/${bucket.total}`;
    })
    .join("  ·  ");
  const open = trophies.filter((trophy) => trophy.missable && !earnedOf(trophy));
  byId("doFirst").innerHTML = open.length
    ? `<strong>Do first:</strong> ${open.map((trophy) => escapeHtml(trophy.name)).join(", ")} — can be missed. See its guide below.`
    : `<strong>Do first:</strong> nothing missable left. Work the roadmap in order.`;
}

function paintList() {
  const list = byId("trophyList");
  list.innerHTML = "";
  const rows = visibleTrophies();
  for (const trophy of rows) list.appendChild(makeRow(trophy));
  byId("resultCount").textContent = `${rows.length} of ${trophies.length} trophies shown.`;
  byId("demoBanner").hidden = !store.demo;
}

function paintDetail() {
  const panel = byId("detailContent");
  const empty = document.querySelector(".detail-empty");
  const trophy = trophies.find((item) => item.id === pickedId);
  if (!trophy) {
    panel.hidden = true;
    empty.hidden = false;
    panel.innerHTML = "";
    return;
  }
  empty.hidden = true;
  panel.hidden = false;
  const note = store.demo ? "" : store.notes[trophy.id] || "";
  const missableLine = trophy.missable && trophy.missableNote
    ? `<p><span class="badge missable">CAN MISS</span> ${escapeHtml(trophy.missableNote)}</p>`
    : "";
  const noteBlock = store.demo
    ? `<p class="sources">Demo profile: notes are off while the demo is loaded.</p>`
    : `<label>Your note<textarea id="noteField" placeholder="Where you are with this one&hellip;">${escapeHtml(note)}</textarea></label>`;
  panel.innerHTML =
    `<h3>${escapeHtml(trophy.name)}</h3>` +
    `<p>${gradeChip(trophy)}${extraChips(trophy)}</p>` +
    `<p class="official">Official: \u201C${escapeHtml(trophy.description)}\u201D${trophy.chapter ? ` — Chapter ${escapeHtml(trophy.chapter)}` : ""}</p>` +
    `<p class="guide-text">${escapeHtml(trophy.guide)}</p>` +
    missableLine +
    `<p class="sources">Sources: ${trophy.sources.map(escapeHtml).join(", ")}</p>` +
    `<p class="earned-line">${earnedOf(trophy) ? "Earned \u2713" : "Not earned yet"}</p>` +
    noteBlock;
  const field = document.getElementById("noteField");
  if (field) {
    field.addEventListener("change", () => {
      const value = field.value.trim();
      if (value) store.notes[trophy.id] = value;
      else delete store.notes[trophy.id];
      writeSaved();
    });
  }
}

function paintRoadmap() {
  const host = byId("roadmapContent");
  host.innerHTML = "";
  for (const phase of ROADMAP) {
    const card = document.createElement("div");
    card.className = "phase";
    const members = trophies.filter((trophy) => phase.kinds.indexOf(trophy.kind) !== -1);
    const doneCount = members.filter(earnedOf).length;
    const items = members
      .map((trophy) => {
        const done = earnedOf(trophy);
        const label = isHiddenStory(trophy) ? "Hidden story trophy" : trophy.name;
        return `<li class="${done ? "done" : ""}">${done ? "\u2713 " : ""}${escapeHtml(label)} — ${escapeHtml(trophy.grade)}${trophy.missable ? " — CAN MISS" : ""}</li>`;
      })
      .join("");
    card.innerHTML = `<h3>${escapeHtml(phase.title)} — ${doneCount} of ${members.length} earned</h3><p>${escapeHtml(phase.text)}</p><ul>${items}</ul>`;
    host.appendChild(card);
  }
}

function phaseIndexOf(trophy) {
  // Which roadmap phase a trophy belongs to, for ordering the planner.
  if (trophy.kind === "story") return 0;
  if (trophy.kind === "side") return 1;
  if (trophy.kind === "misc") return 3;
  return 2;
}

function reasonFor(trophy) {
  if (trophy.missable) return "Can be missed — do it now";
  if (trophy.story) return trophy.chapter ? `Story, chapter ${trophy.chapter}` : "Story";
  if (trophy.kind === "side") return "Side story finale";
  return `Phase ${phaseIndexOf(trophy) + 1} — free roam`;
}

function nextUpList() {
  const remaining = trophies.filter((trophy) => !earnedOf(trophy));
  remaining.sort((a, b) => {
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    const phaseDiff = phaseIndexOf(a) - phaseIndexOf(b);
    if (phaseDiff !== 0) return phaseDiff;
    return trophies.indexOf(a) - trophies.indexOf(b);
  });
  return remaining.slice(0, 5);
}

function paintNextUp() {
  const host = byId("nextUp");
  if (!host) return;
  const picks = nextUpList();
  if (trophies.length === 0) {
    host.innerHTML = "";
    return;
  }
  if (picks.length === 0) {
    host.innerHTML = `<h2>Next up</h2><p class="nextup-done">Every trophy earned — the Platinum is yours. Vice Got a Price!</p>`;
    return;
  }
  const rows = picks
    .map((trophy) => {
      const label = isHiddenStory(trophy) ? "Hidden story trophy" : trophy.name;
      return `<li><button type="button" class="nextup-item" data-id="${trophy.id}"><span class="nextup-name">${escapeHtml(label)}</span><span class="nextup-why">${escapeHtml(reasonFor(trophy))} — ${escapeHtml(trophy.grade)}</span></button></li>`;
    })
    .join("");
  host.innerHTML = `<h2>Next up</h2><p class="nextup-intro">Five trophies to chase next, in the order the roadmap suggests. Missable ones come first.</p><ul class="nextup-list">${rows}</ul>`;
  host.querySelectorAll(".nextup-item").forEach((button) => {
    button.addEventListener("click", () => pick(button.dataset.id));
  });
}

function paintAll() {
  paintProgress();
  paintNextUp();
  paintList();
  paintDetail();
  paintRoadmap();
}

function pick(id) {
  pickedId = id;
  paintList();
  paintDetail();
  const panel = byId("detail");
  if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: "nearest" });
}

function show(view) {
  currentView = view;
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  byId("view-list").hidden = view !== "list";
  byId("view-roadmap").hidden = view !== "roadmap";
  byId("view-sources").hidden = view !== "sources";
}

function download() {
  const payload = {
    app: "leonida-platinum-guide",
    version: 1,
    earned: trophies.filter((trophy) => !!store.earned[trophy.id]).map((trophy) => trophy.id),
    notes: store.notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "gta6-trophy-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function upload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("bad file");
      const known = {};
      for (const trophy of trophies) known[trophy.id] = true;
      const unknown = data.earned.filter((id) => !known[id]);
      if (unknown.length) {
        alert(`Import stopped: ${unknown.length} unknown trophy id(s), first: ${unknown[0]}`);
        return;
      }
      store.earned = {};
      for (const id of data.earned) store.earned[id] = true;
      store.notes = data.notes && typeof data.notes === "object" ? data.notes : {};
      store.demo = false;
      writeSaved();
      paintAll();
    } catch (err) {
      alert("Could not import that file: it is not a Leonida Platinum Guide progress export.");
    }
  };
  reader.readAsText(file);
}

function setupShots() {
  const shot = new URLSearchParams(window.location.search).get("shot");
  if (!shot) return;
  if (shot === "overview") {
    store.spoiler = false;
    show("list");
  } else if (shot === "detail") {
    store.spoiler = false;
    show("list");
    pickedId = "a-long-road";
    // The detail panel sits below the trophy list, so bring it into view
    // after the first render — otherwise a screenshot of this mode shows
    // only the list and never the guide itself.
    setTimeout(() => {
      const panel = byId("detail");
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: "nearest" });
    }, 0);
  } else if (shot === "roadmap") {
    // A roadmap must name its trophies: show the story names here even
    // though the spoiler setting hides them in the list by default.
    store.spoiler = false;
    show("roadmap");
  } else if (shot === "progress") {
    store.demo = true;
    show("list");
  }
  byId("spoilerToggle").checked = store.spoiler;
}

function wireEvents() {
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.view));
  });
  // The search box filters live on every keystroke (input only). A change
  // listener on it would re-render the list when the box loses focus —
  // exactly as the player clicks a row — replacing the row under the mouse
  // before mouseup, which swallows that click. The selects keep both
  // events: their change fires from picking an option, not from a blur.
  byId("search").addEventListener("input", paintList);
  for (const id of ["filterKind", "filterGrade", "filterStatus"]) {
    byId(id).addEventListener("input", paintList);
    byId(id).addEventListener("change", paintList);
  }
  byId("spoilerToggle").addEventListener("change", () => {
    store.spoiler = byId("spoilerToggle").checked;
    writeSaved();
    paintAll();
  });
  byId("exportBtn").addEventListener("click", download);
  byId("importBtn").addEventListener("click", () => byId("importFile").click());
  byId("importFile").addEventListener("change", () => {
    if (byId("importFile").files.length) upload(byId("importFile").files[0]);
    byId("importFile").value = "";
  });
  byId("demoBtn").addEventListener("click", () => {
    store.demo = true;
    paintAll();
  });
  byId("demoClear").addEventListener("click", () => {
    store.demo = false;
    paintAll();
  });
  byId("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned trophies and notes?")) return;
    store.earned = {};
    store.notes = {};
    store.demo = false;
    writeSaved();
    paintAll();
  });
}

fetch("data/trophies.json")
  .then((response) => response.json())
  .then((data) => {
    meta = data.meta || null;
    trophies = data.trophies || [];
    byId("spoilerToggle").checked = store.spoiler;
    wireEvents();
    setupShots();
    paintAll();
  })
  .catch(() => {
    byId("progressText").textContent = "Could not load data/trophies.json.";
  });
