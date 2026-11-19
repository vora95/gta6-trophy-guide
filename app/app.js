// Leonida Platinum Guide — tracker logic only. All trophy content lives in
// data/trophies.json; this file only renders it, filters it, and saves
// the player's checklist in the browser. No network use beyond the local
// fetch of trophies.json. No dates, no random values: every screenshot
// state is deterministic.

const STORE_KEY = 'gta6-trophy-guide-v1';
const KIND_LABELS = {
  story: 'Story',
  side: 'Side stories',
  activity: 'Activities',
  collectible: 'Collectibles',
  combat: 'Combat & crime',
  exploration: 'Exploration',
  money: 'Money',
  misc: 'One-offs',
};
const PHASES = [
  {
    title: 'Phase 1 — Play the story, save every chapter',
    text: 'Finish the five chapters and their named missions. All 12 story trophies are unmissable, but keep one manual save at the start of every chapter and one untouched save from just before the final mission: there is no mission replay. Do Lucia\u2019s balcony meditation in Chapter 1 (Positive Mental Attitude) and Race Against Yago the moment it appears in Chapter 3.',
    kinds: ['story'],
  },
  {
    title: 'Phase 2 — Side stories and strangers',
    text: 'After the story, finish the six side-story finales (Andy, Kenton, Billy, Randy, Tyrone, Bret) and the 8 Strangers & Freaks strands. All of them stay available after the credits. Andy\u2019s strand is reported Lucia-only; Tyrone\u2019s and Bret\u2019s are reported Jason-only.',
    kinds: ['side'],
  },
  {
    title: 'Phase 3 — Activities, collectibles and free roam',
    text: 'Work the open world: stunts, Shooting Range golds, drone races, races, fishing, arcade, cards, WAiNK scans, vehicles, meditation spots, robberies and money. Most of these overlap with the 100% checklist, so progress here is progress toward Phase 4.',
    kinds: ['activity', 'collectible', 'exploration', 'combat', 'money'],
  },
  {
    title: 'Phase 4 — Cleanup and 100% completion',
    text: 'Finish the 100% checklist (reported as 35 tasks, under Progress > Stats > 100% Completion after the story): 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 bank vaults, all 39 Illegal Operations. That earns A Long Road, and with it the Platinum, Vice Got a Price!',
    kinds: ['misc'],
  },
];
// Fixed demo checklist: a deterministic sample so the tracker can be previewed.
const DEMO_EARNED = [
  'just-like-paradise', 'paradise-lost', 'tits-ass-drug-money',
  'vice-city-baby', 'top-of-the-world-ma', 'trust', 'break-the-bank',
  'family-matters', 'dwnfall', 'hi-jacked', 'snow-storm',
  'you-gotta-know-when-to-get-off', 'baited-my-tackle', 'stick-fiddler',
  'master-of-none', 'earn-cash-not-kudos', 'top-fun', 'treat-yo-self',
  'little-boxes', 'on-the-spot', 'gunslinger', 'sneakthief',
  'a-classic-blitz-play', 'the-goodtime-state', 'whip-it-good',
  'catch-me-if-you-can', 'challenging-tank', 'lets-go-bowling',
  'personal-best', 'actions-speak-louder', 'one-last-thing',
];

let TROPHIES = [];
let META = null;
let state = loadState();
let selectedId = null;
let currentView = 'list';

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: {}, notes: {}, spoiler: true, demo: false };
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
      demo: false,
    };
  } catch (e) {
    return { earned: {}, notes: {}, spoiler: true, demo: false };
  }
}

function saveState() {
  const toSave = {
    earned: state.earned,
    notes: state.notes,
    spoiler: state.spoiler,
    demo: false,
  };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(toSave)); } catch (e) { /* storage full or blocked: checklist still works for the session */ }
}

function isEarned(t) {
  if (state.demo) return DEMO_EARNED.indexOf(t.id) !== -1;
  return !!state.earned[t.id];
}

function earnedCount() {
  return TROPHIES.filter(isEarned).length;
}

function el(id) { return document.getElementById(id); }

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gradeBadge(t) {
  return '<span class="badge ' + t.grade + '">' + esc(t.grade) + '</span>';
}

function metaBadges(t) {
  let out = '';
  if (t.missable) out += '<span class="badge missable">CAN MISS</span>';
  if (t.hidden) out += '<span class="badge hidden">Hidden</span>';
  out += '<span class="badge hidden">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>';
  return out;
}

function storyHidden(t) {
  return state.spoiler && t.story && !isEarned(t);
}

function trophyRow(t) {
  const earned = isEarned(t);
  const hidden = storyHidden(t);
  const li = document.createElement('li');
  li.className = 'trophy-row' + (earned ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
  li.dataset.id = t.id;
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = earned;
  check.setAttribute('aria-label', 'Earned: ' + (hidden ? 'hidden story trophy' : t.name));
  check.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (state.demo) return;
    if (check.checked) state.earned[t.id] = true; else delete state.earned[t.id];
    saveState();
    renderAll();
  });
  li.appendChild(check);
  const main = document.createElement('div');
  main.className = 'trophy-main';
  if (hidden) {
    main.innerHTML = '<div class="trophy-name">Hidden story trophy</div>' +
      '<p class="trophy-desc">Finish the story to reveal it. Turn off \u201CHide story trophies\u201D to show it now.</p>' +
      '<div class="trophy-meta">' + gradeBadge(t) + '<span class="badge hidden">Story</span></div>';
  } else {
    main.innerHTML = '<div class="trophy-name">' + esc(t.name) + '</div>' +
      '<p class="trophy-desc">' + esc(t.description) + '</p>' +
      '<div class="trophy-meta">' + gradeBadge(t) + metaBadges(t) + '</div>';
  }
  li.appendChild(main);
  li.addEventListener('click', function () { selectTrophy(t.id); });
  return li;
}

function filteredTrophies() {
  const q = el('search').value.trim().toLowerCase();
  const kind = el('filterKind').value;
  const grade = el('filterGrade').value;
  const status = el('filterStatus').value;
  return TROPHIES.filter(function (t) {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !isEarned(t)) return false;
    if (status === 'remaining' && isEarned(t)) return false;
    if (status === 'missable' && !t.missable) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (KIND_LABELS[t.kind] || '')).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = TROPHIES.length;
  const got = earnedCount();
  const pct = total ? Math.round((got / total) * 100) : 0;
  el('progressFill').style.width = pct + '%';
  el('progressText').textContent = got + ' of ' + total + ' trophies — ' + pct + '% to the Platinum' + (state.demo ? ' (DEMO profile)' : '');
  const byGrade = {};
  TROPHIES.forEach(function (t) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (isEarned(t)) byGrade[t.grade].got += 1;
  });
  el('gradeCounts').textContent = ['Platinum', 'Gold', 'Silver', 'Bronze'].map(function (g) {
    const b = byGrade[g] || { got: 0, total: 0 };
    return g + ' ' + b.got + '/' + b.total;
  }).join('  ·  ');
  const miss = TROPHIES.filter(function (t) { return t.missable && !isEarned(t); });
  el('doFirst').innerHTML = miss.length
    ? '<strong>Do first:</strong> ' + miss.map(function (t) { return esc(t.name); }).join(', ') + ' — can be missed. See its guide below.'
    : '<strong>Do first:</strong> nothing missable left. Work the roadmap in order.';
}

function renderList() {
  const list = el('trophyList');
  list.innerHTML = '';
  const rows = filteredTrophies();
  rows.forEach(function (t) { list.appendChild(trophyRow(t)); });
  el('resultCount').textContent = rows.length + ' of ' + TROPHIES.length + ' trophies shown.';
  el('demoBanner').hidden = !state.demo;
}

function renderDetail() {
  const box = el('detailContent');
  const empty = document.querySelector('.detail-empty');
  const t = TROPHIES.find(function (x) { return x.id === selectedId; });
  if (!t) { box.hidden = true; empty.hidden = false; box.innerHTML = ''; return; }
  empty.hidden = true;
  box.hidden = false;
  const note = state.demo ? '' : (state.notes[t.id] || '');
  box.innerHTML =
    '<h3>' + esc(t.name) + '</h3>' +
    '<p>' + gradeBadge(t) + metaBadges(t) + '</p>' +
    '<p class="official">Official: \u201C' + esc(t.description) + '\u201D' + (t.chapter ? ' — Chapter ' + esc(t.chapter) : '') + '</p>' +
    '<p class="guide-text">' + esc(t.guide) + '</p>' +
    (t.missable && t.missableNote ? '<p><span class="badge missable">CAN MISS</span> ' + esc(t.missableNote) + '</p>' : '') +
    '<p class="sources">Sources: ' + t.sources.map(esc).join(', ') + '</p>' +
    '<p class="earned-line">' + (isEarned(t) ? 'Earned \u2713' : 'Not earned yet') + '</p>' +
    (state.demo ? '<p class="sources">Demo profile: notes are off while the demo is loaded.</p>'
      : '<label>Your note<textarea id="noteField" placeholder="Where you are with this one&hellip;">' + esc(note) + '</textarea></label>');
  const field = document.getElementById('noteField');
  if (field) {
    field.addEventListener('change', function () {
      const v = field.value.trim();
      if (v) state.notes[t.id] = v; else delete state.notes[t.id];
      saveState();
    });
  }
}

function renderRoadmap() {
  const host = el('roadmapContent');
  host.innerHTML = '';
  PHASES.forEach(function (phase, i) {
    const div = document.createElement('div');
    div.className = 'phase';
    const items = TROPHIES.filter(function (t) { return phase.kinds.indexOf(t.kind) !== -1; });
    const listHtml = items.map(function (t) {
      const done = isEarned(t);
      const label = storyHidden(t) ? 'Hidden story trophy' : t.name;
      return '<li class="' + (done ? 'done' : '') + '">' + (done ? '\u2713 ' : '') + esc(label) + ' — ' + esc(t.grade) + (t.missable ? ' — CAN MISS' : '') + '</li>';
    }).join('');
    div.innerHTML = '<h3>' + esc(phase.title) + '</h3><p>' + esc(phase.text) + '</p><ul>' + listHtml + '</ul>';
    host.appendChild(div);
  });
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
  const d = el('detail');
  if (d && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' });
}

function setView(name) {
  currentView = name;
  document.querySelectorAll('.view-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.view === name);
  });
  el('view-list').hidden = name !== 'list';
  el('view-roadmap').hidden = name !== 'roadmap';
  el('view-sources').hidden = name !== 'sources';
}

function exportProgress() {
  const data = {
    app: 'leonida-platinum-guide',
    version: 1,
    earned: TROPHIES.filter(function (t) { return !!state.earned[t.id]; }).map(function (t) { return t.id; }),
    notes: state.notes,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error('bad file');
      const known = {};
      TROPHIES.forEach(function (t) { known[t.id] = true; });
      const unknown = data.earned.filter(function (id) { return !known[id]; });
      if (unknown.length) {
        alert('Import stopped: ' + unknown.length + ' unknown trophy id(s), first: ' + unknown[0]);
        return;
      }
      state.earned = {};
      data.earned.forEach(function (id) { state.earned[id] = true; });
      state.notes = (data.notes && typeof data.notes === 'object') ? data.notes : {};
      state.demo = false;
      saveState();
      renderAll();
    } catch (e) {
      alert('Could not import that file: it is not a Leonida Platinum Guide progress export.');
    }
  };
  reader.readAsText(file);
}

function applyShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'overview') {
    state.spoiler = false;
    setView('list');
  } else if (shot === 'detail') {
    state.spoiler = false;
    setView('list');
    selectedId = 'a-long-road';
    // The detail panel sits below the trophy list, so bring it into view
    // after the first render — otherwise a screenshot of this mode shows
    // only the list and never the guide itself.
    setTimeout(function () {
      const d = el('detail');
      if (d && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' });
    }, 0);
  } else if (shot === 'roadmap') {
    // A roadmap must name its trophies: show the story names here even
    // though the spoiler setting hides them in the list by default.
    state.spoiler = false;
    setView('roadmap');
  } else if (shot === 'progress') {
    state.demo = true;
    setView('list');
  }
  el('spoilerToggle').checked = state.spoiler;
}

function bind() {
  document.querySelectorAll('.view-btn').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });
  // Search filters live on every keystroke (input only). A 'change'
  // listener on the search box would re-render the list when the box loses
  // focus — exactly as the user clicks a row — replacing the row under the
  // mouse before mouseup, which swallows that click. Selects keep both
  // events: their change fires from picking an option, not from a blur.
  el('search').addEventListener('input', renderList);
  ['filterKind', 'filterGrade', 'filterStatus'].forEach(function (id) {
    el(id).addEventListener('input', renderList);
    el(id).addEventListener('change', renderList);
  });
  el('spoilerToggle').addEventListener('change', function () {
    state.spoiler = el('spoilerToggle').checked;
    saveState();
    renderAll();
  });
  el('exportBtn').addEventListener('click', exportProgress);
  el('importBtn').addEventListener('click', function () { el('importFile').click(); });
  el('importFile').addEventListener('change', function () {
    if (el('importFile').files.length) importProgress(el('importFile').files[0]);
    el('importFile').value = '';
  });
  el('demoBtn').addEventListener('click', function () {
    state.demo = true;
    renderAll();
  });
  el('demoClear').addEventListener('click', function () {
    state.demo = false;
    renderAll();
  });
  el('resetBtn').addEventListener('click', function () {
    if (!window.confirm('Clear all earned trophies and notes?')) return;
    state.earned = {};
    state.notes = {};
    state.demo = false;
    saveState();
    renderAll();
  });
}

fetch('data/trophies.json')
  .then(function (r) { return r.json(); })
  .then(function (data) {
    META = data.meta || null;
    TROPHIES = data.trophies || [];
    el('spoilerToggle').checked = state.spoiler;
    bind();
    applyShotMode();
    renderAll();
  })
  .catch(function () {
    el('progressText').textContent = 'Could not load data/trophies.json.';
  });
