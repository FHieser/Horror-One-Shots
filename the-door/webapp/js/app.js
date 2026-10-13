// the-door/webapp/js/app.js
// Client-side rendering for The Door static site.
// Depends on: jsyaml (CDN), marked (CDN, overview/door/timeline), CONTENT_INDEX (content-index.js).

// ── Data loading ────────────────────────────────────────────────────────────

async function fetchYaml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return jsyaml.load(await res.text());
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.text();
}

// ── Room loading ─────────────────────────────────────────────────────────────

const SECTION_ORDER = ['surface', 'facility', 'mines'];

function sectionDisplayName(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

async function discoverYamlFiles(folderPath) {
  if (typeof CONTENT_INDEX !== 'undefined' && CONTENT_INDEX[folderPath]) {
    return CONTENT_INDEX[folderPath];
  }
  const res = await fetch(`../data/${folderPath}/`);
  const html = await res.text();
  const matches = [...html.matchAll(/href="([^"]+\.yaml)"/g)];
  return matches.map(m => m[1]).sort();
}

async function loadAllRooms() {
  const sections = await Promise.all(SECTION_ORDER.map(async section => {
    const files = await discoverYamlFiles(`rooms/${section}`);
    return Promise.all(files.map(async file => ({
      ...(await fetchYaml(`../data/rooms/${section}/${file}`)),
      id: file.replace('.yaml', ''),
      section: sectionDisplayName(section),
      sectionSlug: section,
    })));
  }));
  return sections.flat();
}

// ── Room detail rendering ────────────────────────────────────────────────────

function roomLink(name, nameToId) {
  const id = nameToId[(name || '').trim().toLowerCase()];
  return id
    ? `<a class="conn-link" href="./room.html?id=${id}">${(name || '').trim()}</a>`
    : `<span class="conn-tag">${(name || '').trim()}</span>`;
}

function renderRoomDetail(room, allRooms) {
  const nameToId = {};
  for (const r of allRooms) nameToId[r.name.toLowerCase()] = r.id;

  const connections = Array.isArray(room.connections) ? room.connections : [];
  const connHtml = connections.length
    ? connections.map(c => roomLink(c, nameToId)).join('')
    : '<span class="dim">–</span>';

  const descHtml = Array.isArray(room.description)
    ? '<ul>' + room.description.map(d => `<li>${d}</li>`).join('') + '</ul>'
    : (room.description || '');

  const notes = room.notes && room.notes !== '' ? room.notes : null;

  document.title = `${room.name} — The Door`;
  document.getElementById('room-badge').textContent = room.section;
  document.getElementById('room-title').textContent = room.name;

  const fields = document.getElementById('room-fields');
  fields.innerHTML = [
    descHtml ? `<div class="field"><div class="label">Description</div><div class="value">${descHtml}</div></div>` : '',
    connections.length ? `<div class="field"><div class="label">Connections</div><div class="value">${connHtml}</div></div>` : '',
    notes ? `<div class="field"><div class="label">Notes</div><div class="value">${notes}</div></div>` : '',
  ].join('');
}

// ── Characters rendering ─────────────────────────────────────────────────────

function roleSlug(role) {
  return (role || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function listHtml(value) {
  if (Array.isArray(value)) return value.length ? '<ul>' + value.map(v => `<li>${v}</li>`).join('') + '</ul>' : '<p class="dim">—</p>';
  return value ? `<p>${value}</p>` : '<p class="dim">—</p>';
}

function renderRoleSheet(c) {
  const skills = Array.isArray(c.skills) && c.skills.length
    ? c.skills.map(s => `<span class="tag">${s}</span>`).join('')
    : '<span class="dim">No special skills</span>';
  document.getElementById('role-sheet').innerHTML = `
    <article class="sheet">
      <div class="sheet-head"><h2>${c.role}</h2><span class="salary">${c.salary || '—'} / month</span></div>
      <p class="sheet-desc">${c.description || ''}</p>
      <div class="label">Skills</div>
      <div class="tags">${skills}</div>
      <div class="label">Daily Job</div>
      ${listHtml(c.daily_job)}
      <div class="omens">
        <div class="omen"><span class="gm-tag">GM ONLY</span><div class="label">Minor Omens</div>${listHtml(c.minor_omen)}</div>
        <div class="omen major"><span class="gm-tag">GM ONLY</span><div class="label">Major Omen</div>${listHtml(c.major_omen)}</div>
      </div>
    </article>`;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('active', b.dataset.role === roleSlug(c.role)));
}

function renderCharacters(chars) {
  // Roles tab: selector + one role sheet
  document.getElementById('role-picker').innerHTML = chars
    .map(c => `<button class="role-btn" data-role="${roleSlug(c.role)}">${c.role}</button>`).join('');

  // Overview tab: all roles in one table
  const cell = v => Array.isArray(v)
    ? v.map(j => `<div class="look-line">${j}</div>`).join('')
    : (v || '<span class="dim">—</span>');
  document.getElementById('char-tbody').innerHTML = chars.map(c => `<tr>
      <td><a href="#role-${roleSlug(c.role)}">${c.role}</a></td>
      <td>${c.salary || '<span class="dim">—</span>'}</td>
      <td>${Array.isArray(c.skills) && c.skills.length ? c.skills.join(', ') : '<span class="dim">—</span>'}</td>
      <td>${cell(c.daily_job)}</td>
      <td>${cell(c.minor_omen)}</td>
      <td>${cell(c.major_omen)}</td>
    </tr>`).join('');

  // Tabs and selected role live in the URL hash: #roles, #overview, #creation, #role-<slug>
  const bySlug = Object.fromEntries(chars.map(c => [roleSlug(c.role), c]));
  let currentRole = roleSlug(chars[0].role);

  function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== `panel-${tab}`; });
  }

  function route() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('role-') && bySlug[hash.slice(5)]) {
      currentRole = hash.slice(5);
      showTab('roles');
    } else {
      showTab(['overview', 'creation'].includes(hash) ? hash : 'roles');
    }
    renderRoleSheet(bySlug[currentRole]);
  }

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    location.hash = t.dataset.tab === 'roles' ? `role-${currentRole}` : t.dataset.tab;
  }));
  document.getElementById('role-picker').addEventListener('click', e => {
    const btn = e.target.closest('.role-btn');
    if (btn) location.hash = `role-${btn.dataset.role}`;
  });
  window.addEventListener('hashchange', route);
  route();
}

// ── Omens + pager ────────────────────────────────────────────────────────────

function renderOmens(omens) {
  document.getElementById('escalation').innerHTML = (omens.escalation || [])
    .map(e => `<div class="act"><div class="label">${e.act}</div><p>${e.text}</p></div>`).join('');
  document.getElementById('omens-minor').innerHTML = (omens.minor || []).map(o => `<li>${o}</li>`).join('');
  document.getElementById('omens-major').innerHTML = (omens.major || []).map(o => `<li>${o}</li>`).join('');
}

function setupPager(categories) {
  let filter = 'all';
  let bag = [];   // shuffled messages not yet shown for the current filter

  const pool = () => categories
    .filter(c => filter === 'all' || c.id === filter)
    .flatMap(c => c.messages.map(m => ({ ...m, category: c.label })));

  function refill() {
    bag = pool();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function setFilter(id) {
    filter = id;
    refill();
    document.querySelectorAll('#pager-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.id === id));
    const cat = categories.find(c => c.id === id);
    document.getElementById('pager-hint').textContent = cat ? cat.hint : 'Random message from every category.';
  }

  function page() {
    if (!bag.length) refill();
    const m = bag.pop();
    const hh = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    document.getElementById('pager-screen').innerHTML = `
      <div class="screen-meta"><span>FROM: ${m.from}</span><span>${hh}:${mm}</span></div>
      <div class="screen-text">${m.text}</div>`;
    const led = document.getElementById('pager-led');
    led.classList.remove('on'); void led.offsetWidth; led.classList.add('on');
    if (filter === 'all') document.getElementById('pager-hint').textContent = `${m.category}: ${categories.find(c => c.label === m.category).hint}`;
  }

  document.getElementById('pager-filters').innerHTML =
    `<button class="chip" data-id="all">All</button>` +
    categories.map(c => `<button class="chip" data-id="${c.id}">${c.label}</button>`).join('');
  document.getElementById('pager-filters').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) setFilter(chip.dataset.id);
  });
  document.getElementById('page-btn').addEventListener('click', page);
  setFilter('all');

  // Full list of every message, grouped by category
  document.getElementById('pager-list').innerHTML = categories.map(c => `
    <section class="msg-group">
      <h3>${c.label}</h3>
      <p class="group-hint">${c.hint || ''}</p>
      ${c.messages.map(m => `<div class="msg"><span class="msg-from">${m.from}</span><span class="msg-text">${m.text}</span></div>`).join('')}
    </section>`).join('');
}

// ── Timeline rendering ───────────────────────────────────────────────────────

function renderTimeline(events) {
  let rows = '';
  let extra = '';
  let idx = 0;
  let inExtra = false;

  for (const e of events) {
    if (e.intro) {
      document.getElementById('tl-intro').innerHTML = marked.parse(e.intro);
      continue;
    }
    if (e.phase) {
      const header = `<div class="tl-phase-header"><span>${e.phase}</span></div>`;
      if (e.note || inExtra) { inExtra = true; extra += header; } else rows += header;
      continue;
    }
    if (e.note) {
      inExtra = true;
      extra += `<div class="tl-note">${marked.parse(e.note)}</div>`;
      continue;
    }
    if (inExtra) continue;
    const optional = e.optional ? ' <span class="tl-optional">optional</span>' : '';
    const card = `<div class="tl-card ${e.type || ''}${e.optional ? ' optional' : ''}"><div class="tl-card-label">${e.title || ''}${optional}</div><p>${e.text || ''}</p></div>`;
    const isLeft = idx % 2 === 0;
    rows += `
      <div class="tl-row">
        <div class="tl-left">${isLeft ? card : ''}</div>
        <div class="tl-center"><div class="tl-dot"></div><div class="tl-label">${e.label || ''}</div></div>
        <div class="tl-right">${!isLeft ? card : ''}</div>
      </div>`;
    idx++;
  }

  document.getElementById('tl-rows').innerHTML  = rows;
  document.getElementById('tl-extra').innerHTML = extra;
}

// ── Audio rendering ──────────────────────────────────────────────────────────

function renderAudio(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    document.getElementById('audio-grid').innerHTML = '<p style="color:#444;font-family:\'Courier New\',monospace;font-size:0.85rem">No audio tracks added yet.</p>';
    return;
  }
  function videoId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : null;
  }
  const cards = tracks.map(t => {
    const id = videoId(t.url);
    if (!id) return '';
    return `<div class="audio-card">
      <div class="audio-card-title">${t.title || ''}</div>
      <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
    </div>`;
  }).join('');
  document.getElementById('audio-grid').innerHTML = cards;
}

// ── Page initializers ────────────────────────────────────────────────────────

async function initRoom() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('room-fields').textContent = 'No room ID specified.'; return; }

  const allRooms = await loadAllRooms();
  const room = allRooms.find(r => r.id === id);
  if (!room) { document.getElementById('room-fields').textContent = `Room "${id}" not found.`; return; }
  renderRoomDetail(room, allRooms);
}

async function initOverview() {
  const md = await fetchText('../data/overview.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

async function initOmens() {
  const [pager, omens] = await Promise.all([
    fetchYaml('../data/pager.yaml'),
    fetchYaml('../data/omens.yaml'),
  ]);
  renderOmens(omens);
  setupPager(pager);
}

async function initDoor() {
  const md = await fetchText('../data/door.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

async function initCharacters() {
  const chars = await fetchYaml('../data/characters.yaml');
  renderCharacters(chars);
}

async function initTimeline() {
  const events = await fetchYaml('../data/timeline.yaml');
  renderTimeline(events);
}

async function initAudio() {
  const tracks = await fetchYaml('../data/audio.yaml');
  renderAudio(tracks);
}
