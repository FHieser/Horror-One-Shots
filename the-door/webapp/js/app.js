// the-door/webapp/js/app.js
// Client-side rendering for The Door static site.
// Depends on: jsyaml (CDN), marked (CDN, overview/mechanics only), CONTENT_INDEX (content-index.js).

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

function renderCharacters(chars) {
  const rows = chars.map(c => {
    const skills = Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || '–');
    const daily = Array.isArray(c.daily_job)
      ? c.daily_job.map(j => `<div class="look-line">${j}</div>`).join('')
      : (c.daily_job || '<span class="dim">—</span>');
    const minor = Array.isArray(c.minor_omen)
      ? c.minor_omen.map(o => `<div class="look-line">${o}</div>`).join('')
      : (c.minor_omen || '<span class="dim">—</span>');
    return `<tr>
      <td><strong>${c.role || '<span class="dim">—</span>'}</strong></td>
      <td>${c.salary || '<span class="dim">—</span>'}</td>
      <td>${skills}</td>
      <td>${daily}</td>
      <td>${minor}</td>
      <td>${c.major_omen || '<span class="dim">—</span>'}</td>
    </tr>`;
  }).join('');
  document.getElementById('char-tbody').innerHTML = rows;
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

async function initMechanics() {
  const md = await fetchText('../data/mechanics.md');
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
