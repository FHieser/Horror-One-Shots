// the-door/js/app.js
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
  const res = await fetch(`./${folderPath}/`);
  const html = await res.text();
  const matches = [...html.matchAll(/href="([^"]+\.yaml)"/g)];
  return matches.map(m => m[1]).sort();
}

async function loadAllRooms() {
  const rooms = [];
  for (const section of SECTION_ORDER) {
    const files = await discoverYamlFiles(`rooms/${section}`);
    for (const file of files) {
      const data = await fetchYaml(`./rooms/${section}/${file}`);
      rooms.push({
        ...data,
        id: file.replace('.yaml', ''),
        section: sectionDisplayName(section),
        sectionSlug: section,
      });
    }
  }
  return rooms;
}

// ── SVG Map generation ───────────────────────────────────────────────────────

function generateSvg(rooms, layout) {
  const sorted = [...rooms].sort((a, b) => (b.sectionSlug === 'mines') - (a.sectionSlug === 'mines'));

  const roomElements = sorted.map(room => {
    const p = layout[room.id];
    if (!p) return '';
    const isMines = room.sectionSlug === 'mines';

    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    const words = room.name.split(' ');
    const mid   = Math.ceil(words.length / 2);
    const textFill = isMines ? '#6aaa40' : '#d4a040';
    const textEl = words.length > 1
      ? `<text class="t" x="${cx}" y="${cy - 1}" text-anchor="middle" fill="${textFill}" font-family="'Courier New',monospace" font-size="8">${words.slice(0, mid).join(' ')}</text>
    <text class="t" x="${cx}" y="${cy + 8}" text-anchor="middle" fill="${textFill}" font-family="'Courier New',monospace" font-size="8">${words.slice(mid).join(' ')}</text>`
      : `<text class="t" x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${textFill}" font-family="'Courier New',monospace" font-size="8">${room.name}</text>`;

    const rectStyle = isMines
      ? `fill="#080c05" stroke="#4a6a30" stroke-width="1.5" stroke-dasharray="4,3"`
      : `fill="#120e04" stroke="#8a6000" stroke-width="1.5"`;
    const cls = `room-link${isMines ? ' mines-room' : ''}`;

    return `
  <a class="${cls}" href="./room.html?id=${room.id}" data-id="${room.id}">
    <rect class="r" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" ${rectStyle}/>
    ${textEl}
  </a>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560" width="640" height="560" id="facility-map">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e0900" stroke-width="0.5"/>
    </pattern>
  </defs>

  <rect width="640" height="560" fill="#060400"/>
  <rect width="640" height="560" fill="url(#grid)"/>
  <rect x="4" y="4" width="632" height="552" fill="none" stroke="#3d2000" stroke-width="1"/>
  <line x1="4" y1="20" x2="4" y2="4" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="4" y1="4" x2="20" y2="4" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="636" y1="20" x2="636" y2="4" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="636" y1="4" x2="620" y2="4" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="4" y1="540" x2="4" y2="556" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="4" y1="556" x2="20" y2="556" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="636" y1="540" x2="636" y2="556" stroke="#cc8800" stroke-width="1.5"/>
  <line x1="636" y1="556" x2="620" y2="556" stroke="#cc8800" stroke-width="1.5"/>
  <text x="320" y="17" text-anchor="middle" fill="#6a4000" font-family="'Courier New',monospace" font-size="9" letter-spacing="3">4D7 — FACILITY SCHEMATIC</text>

  <!-- Section backgrounds -->
  <rect x="2" y="4"   width="636" height="100" fill="#0a0800" stroke="#2a1800" stroke-width="1"/>
  <text x="10" y="17" fill="#6a4000" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">SURFACE</text>
  <rect x="2" y="104" width="636" height="336" fill="#0a0800" stroke="#2a1800" stroke-width="1"/>
  <text x="10" y="117" fill="#6a4000" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">FACILITY</text>
  <rect x="2" y="440" width="636" height="116" fill="#080a06" stroke="#2a1800" stroke-width="1"/>
  <text x="10" y="453" fill="#3a5020" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">MINES</text>

${roomElements}
</svg>`;
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
    const card = `<div class="tl-card ${e.type || ''}"><div class="tl-card-label">${e.title || ''}</div><p>${e.text || ''}</p></div>`;
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

async function initMap() {
  const [rooms, layout] = await Promise.all([
    loadAllRooms(),
    fetchJson('./layout.json'),
  ]);
  document.getElementById('map-wrapper').innerHTML = generateSvg(rooms, layout);
}

async function initRoom() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('room-fields').textContent = 'No room ID specified.'; return; }

  const allRooms = await loadAllRooms();
  const room = allRooms.find(r => r.id === id);
  if (!room) { document.getElementById('room-fields').textContent = `Room "${id}" not found.`; return; }
  renderRoomDetail(room, allRooms);
}

async function initOverview() {
  const md = await fetchText('./introduction.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

async function initMechanics() {
  const md = await fetchText('./entity-the-door.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

async function initCharacters() {
  const chars = await fetchYaml('./data/characters.yaml');
  renderCharacters(chars);
}

async function initTimeline() {
  const events = await fetchYaml('./data/timeline.yaml');
  renderTimeline(events);
}

async function initAudio() {
  const tracks = await fetchYaml('./data/audio.yaml');
  renderAudio(tracks);
}
