// close-to-god/js/app.js
// Client-side rendering for the Close to God static site.
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

const SECTION_ORDER = [
  'central-facility', 'lower-levels', 'side-towers',
  'upper-levels', 'hidden', 'deep-levels',
];

function sectionDisplayName(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Discover files: check CONTENT_INDEX first (GitHub Pages), fall back to
// fetching the folder URL and scraping hrefs (local Express dev server).
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

// ── SVG Map generation (ported from server.js generateSvg) ──────────────────

function generateSvg(rooms, layout) {
  const sorted = [...rooms].sort((a, b) => (b.sectionSlug === 'hidden') - (a.sectionSlug === 'hidden'));

  const roomElements = sorted.map(room => {
    const p = layout[room.id];
    if (!p) return '';
    const isTower  = room.sectionSlug === 'side-towers';
    const isHidden = room.sectionSlug === 'hidden';

    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    const words = room.name.split(' ');
    const mid   = Math.ceil(words.length / 2);
    const textEl = words.length > 1
      ? `<text class="t" x="${cx}" y="${cy - 1}" text-anchor="middle" fill="FILL" font-family="'Courier New',monospace" font-size="8">SPLIT1</text>
    <text class="t" x="${cx}" y="${cy + 8}" text-anchor="middle" fill="FILL" font-family="'Courier New',monospace" font-size="8">SPLIT2</text>`
      : `<text class="t" x="${cx}" y="${cy + 4}" text-anchor="middle" fill="FILL" font-family="'Courier New',monospace" font-size="8">${room.name}</text>`;

    const rectStyle = isHidden
      ? `fill="#08151e" stroke="#1a5a78" stroke-width="1.5" stroke-dasharray="4,3"`
      : `fill="#0c1d2e" stroke="#2a7aa8" stroke-width="1.5"`;
    const textFill = isHidden ? '#4a8aaa' : '#7ec8e3';
    const cls = `room-link${isTower ? ' tower-link' : ''}${isHidden ? ' hidden-room' : ''}`;

    if (isTower) {
      const mx = p.x + p.w / 2;
      return `
  <a class="${cls}" href="./room.html?id=${room.id}" data-id="${room.id}">
    <polygon class="p" points="${mx},${p.y - 16} ${p.x},${p.y} ${p.x + p.w},${p.y}" fill="#08151f" stroke="#3a8ab8" stroke-width="1.5"/>
    <rect class="r" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#08151f" stroke="#3a8ab8" stroke-width="1.5"/>
    <text class="t" x="${mx}" y="${p.y + 20}" text-anchor="middle" fill="#7ec8e3" font-family="'Courier New',monospace" font-size="8" letter-spacing="1">${room.name.toUpperCase()}</text>
    <text class="t" x="${mx}" y="${p.y + 50}" text-anchor="middle" fill="#2a6a88" font-family="'Courier New',monospace" font-size="14">⚡</text>
  </a>`;
    }

    return `
  <a class="${cls}" href="./room.html?id=${room.id}" data-id="${room.id}">
    <rect class="r" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" ${rectStyle}/>
    ${textEl.replace(/FILL/g, textFill).replace('SPLIT1', words.slice(0, mid).join(' ')).replace('SPLIT2', words.slice(mid).join(' '))}
  </a>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 720" id="facility-map">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0a1622" stroke-width="0.5"/>
    </pattern>
  </defs>

  <rect width="640" height="720" fill="#050b12"/>
  <rect width="640" height="720" fill="url(#grid)"/>
  <rect x="4" y="4" width="632" height="712" fill="none" stroke="#1a4060" stroke-width="1"/>
  <line x1="4" y1="20" x2="4" y2="4" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="4" y1="4" x2="20" y2="4" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="636" y1="20" x2="636" y2="4" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="636" y1="4" x2="620" y2="4" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="4" y1="700" x2="4" y2="716" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="4" y1="716" x2="20" y2="716" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="636" y1="700" x2="636" y2="716" stroke="#2a7aa8" stroke-width="1.5"/>
  <line x1="636" y1="716" x2="620" y2="716" stroke="#2a7aa8" stroke-width="1.5"/>
  <text x="320" y="17" text-anchor="middle" fill="#2a6a98" font-family="'Courier New',monospace" font-size="9" letter-spacing="3">CLOSE TO GOD — FACILITY SCHEMATIC</text>

  <!-- Section backgrounds -->
  <rect x="2" y="4"   width="636" height="140" fill="#070e18" stroke="#1a4060" stroke-width="1"/>
  <text x="10" y="17" fill="#2a6a98" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">UPPER LEVELS</text>
  <rect x="2" y="148" width="636" height="244" fill="#070e18" stroke="#1a4060" stroke-width="1"/>
  <text x="10" y="161" fill="#2a6a98" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">CENTRAL FACILITY</text>
  <rect x="2" y="396" width="636" height="110" fill="#070e18" stroke="#1a4060" stroke-width="1"/>
  <text x="10" y="409" fill="#2a6a98" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">LOWER LEVELS</text>
  <rect x="2" y="536" width="636" height="178" fill="#070e18" stroke="#1a4060" stroke-width="1"/>
  <text x="10" y="549" fill="#2a6a98" font-family="'Courier New',monospace" font-size="7" letter-spacing="2">DEEP LEVELS</text>

${roomElements}
</svg>`;
}

// ── Room detail rendering (ported from server.js roomDetailHtml) ─────────────

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

  const secretRaw = room.secret_pathways && room.secret_pathways !== '–' ? room.secret_pathways : null;
  const secretHtml = secretRaw ? secretRaw.split(/,\s*/).map(s => roomLink(s, nameToId)).join(' ') : null;

  const descHtml = Array.isArray(room.description)
    ? '<ul>' + room.description.map(d => `<li>${d}</li>`).join('') + '</ul>'
    : (room.description || '');

  const detailsArr = Array.isArray(room.details) ? room.details : [];
  const detailsHtml = detailsArr.length
    ? detailsArr.map(d => typeof d === 'object'
        ? `<div class="detail-item">${d.content || ''}${d.implication ? `<div class="detail-impl">→ ${d.implication}</div>` : ''}</div>`
        : `<div class="detail-item">${d}</div>`
      ).join('')
    : null;

  const access   = room.access && room.access !== '–' ? room.access : null;
  const presence = Array.isArray(room.presence)
    ? room.presence
    : (room.presence && room.presence !== '–' ? [room.presence] : []);

  const hallucinationHtml = (() => {
    const h = room.hallucinations;
    if (!h) return '';
    if (typeof h !== 'object') return `<div class="field"><div class="label">Hallucinations</div><div class="value haunt">${h}</div></div>`;
    const types = [
      { key: 'violence', label: '🩸 Violence', save: 'Body Save' },
      { key: 'theme',    label: '🕰️ Theme',    save: 'Sanity Save' },
      { key: 'hints',    label: '💡 Hints',    save: null },
    ];
    return types.filter(t => h[t.key]).map(t => {
      const entry = h[t.key];
      const saveTag = t.save ? ` <span class="save-tag">${t.save}</span>` : '';
      const entries = Array.isArray(entry) ? entry : [entry];
      const entriesHtml = entries.map(e =>
        `<div class="haunt-entry"><em>Trigger:</em> ${e.trigger || '–'}<br><em>Effect:</em> ${e.effect || '–'}</div>`
      ).join('');
      const implHtml = !Array.isArray(entry) && entry.implication
        ? `<div class="detail-impl">→ ${entry.implication}</div>` : '';
      return `<div class="field"><div class="label">${t.label}${saveTag}</div><div class="value haunt">${entriesHtml}${implHtml}</div></div>`;
    }).join('');
  })();

  document.title = `${room.name} — Close to God`;
  document.getElementById('room-badge').textContent  = room.section;
  document.getElementById('room-title').textContent  = room.name;

  const fields = document.getElementById('room-fields');
  fields.innerHTML = [
    descHtml    ? `<div class="field"><div class="label">Description</div><div class="value">${descHtml}</div></div>` : '',
    detailsHtml ? `<div class="field"><div class="label">Details</div><div class="value">${detailsHtml}</div></div>` : '',
    hallucinationHtml,
    connections.length ? `<div class="field"><div class="label">Connections</div><div class="value">${connHtml}</div></div>` : '',
    secretHtml  ? `<div class="field"><div class="label">Secret Pathways</div><div class="value">${secretHtml}</div></div>` : '',
    access      ? `<div class="field"><div class="label">Access</div><div class="value">${access}</div></div>` : '',
    presence.length ? `<div class="field"><div class="label">Presence</div><div class="value">${presence.join(', ')}</div></div>` : '',
  ].join('');
}

// ── Characters rendering (ported from server.js /characters route) ───────────

function renderCharacters(chars) {
  const colorDots = {
    Pink: '#ff69b4', White: '#e0e0e0', Red: '#cc2222', Green: '#3a8a3a',
    Yellow: '#ccaa00', Blue: '#2a7aa8', Orange: '#cc6600', Purple: '#7a3a9a', Black: '#444',
  };
  const rows = chars.map(c => {
    const dot = colorDots[c.color] || '#666';
    const looks = Array.isArray(c.looks) && c.looks.length
      ? c.looks.map(l => `<div class="look-line">${l}</div>`).join('')
      : '<span class="dim">—</span>';
    return `<tr>
      <td><span class="color-dot" style="background:${dot}"></span>${c.color}</td>
      <td>${c.class  || '<span class="dim">—</span>'}</td>
      <td>${c.skills || '<span class="dim">—</span>'}</td>
      <td>${c.item   || '<span class="dim">—</span>'}</td>
      <td>${looks}</td>
    </tr>`;
  }).join('');
  document.getElementById('char-tbody').innerHTML = rows;
}

// ── Timeline rendering (ported from server.js /timeline route) ──────────────

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

// ── Audio rendering (ported from server.js /audio route) ────────────────────

function renderAudio(tracks) {
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
  const md = await fetchText('./header.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

async function initMechanics() {
  const md = await fetchText('./mechanics.md');
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
