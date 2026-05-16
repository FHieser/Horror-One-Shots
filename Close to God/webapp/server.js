const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const CONTENT_DIR = path.join(__dirname, '..');
const ROOMS_DIR = path.join(CONTENT_DIR, 'rooms');
const LAYOUT_FILE = path.join(CONTENT_DIR, 'layout.json');

const SECTION_ORDER = [
  'central-facility', 'lower-levels', 'side-towers',
  'upper-levels', 'hidden', 'deep-levels',
];

function sectionDisplayName(folder) {
  return folder.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function readAllRooms() {
  const rooms = [];
  for (const section of SECTION_ORDER) {
    const sectionDir = path.join(ROOMS_DIR, section);
    if (!fs.existsSync(sectionDir)) continue;
    const files = fs.readdirSync(sectionDir).filter(f => f.endsWith('.yaml')).sort();
    for (const file of files) {
      const data = yaml.load(fs.readFileSync(path.join(sectionDir, file), 'utf8'));
      rooms.push({ ...data, id: file.replace('.yaml', ''), section: sectionDisplayName(section), sectionSlug: section });
    }
  }
  return rooms;
}

function readLayout() {
  return JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf8'));
}

function saveLayout(id, x, y) {
  const layout = readLayout();
  if (layout[id]) {
    layout[id].x = x;
    layout[id].y = y;
    fs.writeFileSync(LAYOUT_FILE, JSON.stringify(layout, null, 2), 'utf8');
  }
}

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
  <a class="${cls}" href="/room/${room.id}" target="_blank" data-id="${room.id}">
    <polygon class="p" points="${mx},${p.y - 16} ${p.x},${p.y} ${p.x + p.w},${p.y}" fill="#08151f" stroke="#3a8ab8" stroke-width="1.5"/>
    <rect class="r" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#08151f" stroke="#3a8ab8" stroke-width="1.5"/>
    <text class="t" x="${mx}" y="${p.y + 20}" text-anchor="middle" fill="#7ec8e3" font-family="'Courier New',monospace" font-size="8" letter-spacing="1">${room.name.toUpperCase()}</text>
    <text class="t" x="${mx}" y="${p.y + 50}" text-anchor="middle" fill="#2a6a88" font-family="'Courier New',monospace" font-size="14">⚡</text>
  </a>`;
    }

    return `
  <a class="${cls}" href="/room/${room.id}" target="_blank" data-id="${room.id}">
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

function generateReadme(rooms) {
  const header = fs.readFileSync(path.join(__dirname, 'header.md'), 'utf8');
  let md = header.trimEnd() + '\n\n';
  const grouped = {};
  for (const room of rooms) {
    if (!grouped[room.sectionSlug]) grouped[room.sectionSlug] = [];
    grouped[room.sectionSlug].push(room);
  }
  for (const section of SECTION_ORDER) {
    if (!grouped[section]) continue;
    md += `## ${sectionDisplayName(section)}\n\n`;
    md += `| Location | General Description | Hallucinations | Connections | Secret Pathways | Access | Findings / Clues |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    for (const room of grouped[section]) {
      const conns = Array.isArray(room.connections) ? (room.connections.length ? room.connections.join(', ') : '–') : (room.connections || '–');
      const clues = Array.isArray(room.clues) ? room.clues.join('; ') : (room.clues || '–');
      md += `| ${room.name} | ${room.description || '–'} | ${room.hallucinations || '–'} | ${conns} | ${room.secret_pathways || '–'} | ${room.access || '–'} | ${clues} |\n`;
    }
    md += '\n';
  }
  fs.writeFileSync(path.join(CONTENT_DIR, 'Readme.md'), md, 'utf8');
  console.log('Readme.md regenerated.');
}

function extractSection(heading, text) {
  const re = new RegExp(`## ${heading}([\\s\\S]*?)(?=\\n## |$)`);
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function mdToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  for (const raw of lines) {
    const t = raw.trim();
    const isBullet = /^[•○§]/.test(t);
    if (isBullet && !inList) { html += '<ul>'; inList = true; }
    if (!isBullet && inList) { html += '</ul>'; inList = false; }
    if (t.startsWith('### ')) {
      html += `<h3>${t.slice(4)}</h3>`;
    } else if (isBullet) {
      html += `<li>${t.slice(1).trim()}</li>`;
    } else if (t === '') {
      /* skip */
    } else {
      html += `<p>${t}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function pageHtml(title, activePage, bodyContent, extraStyle = '', extraScript = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Close to God</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; font-family: Georgia, serif; }
    header { background: #0a0000; border-bottom: 2px solid #330000; padding: 0.5rem 1.5rem; display: flex; align-items: center; gap: 2rem; position: sticky; top: 0; z-index: 10; }
    .brand { color: #cc2222; font-size: 1.1rem; letter-spacing: 0.05em; text-decoration: none; font-family: Georgia, serif; }
    nav { display: flex; margin-left: auto; }
    nav a { color: #666; text-decoration: none; font-size: 0.82rem; padding: 0.3rem 1rem; border: 1px solid transparent; letter-spacing: 0.06em; text-transform: uppercase; }
    nav a:hover { color: #cc2222; }
    nav a.active { color: #cc2222; border-color: #330000; background: #1a0000; }
    nav a + a { border-left: none; }
    .content { max-width: 820px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }
    .block { margin-bottom: 3rem; }
    h2 { color: #cc2222; font-size: 1.5rem; border-bottom: 1px solid #330000; padding-bottom: 0.4rem; margin-bottom: 1.2rem; }
    h3 { color: #aa3333; font-size: 1rem; margin: 1.4rem 0 0.5rem; letter-spacing: 0.02em; }
    p { color: #b8b8b8; font-size: 0.9rem; line-height: 1.75; margin-bottom: 0.5rem; }
    ul { color: #b8b8b8; font-size: 0.9rem; line-height: 1.75; padding-left: 1.4rem; margin-bottom: 0.6rem; list-style: none; }
    li::before { content: "›  "; color: #cc2222; }
    ${extraStyle}
  </style>
</head>
<body>
  <header>
    <a class="brand" href="/">Close to God</a>
    <nav>
      <a href="/" ${activePage === 'overview' ? 'class="active"' : ''}>Overview</a>
      <a href="/story" ${activePage === 'story' ? 'class="active"' : ''}>Story</a>
      <a href="/map" ${activePage === 'map' ? 'class="active"' : ''}>Map</a>
      <a href="/mechanics" ${activePage === 'mechanics' ? 'class="active"' : ''}>Mechanics</a>
    </nav>
  </header>
  ${bodyContent}
  ${extraScript ? `<script>${extraScript}</script>` : ''}
</body>
</html>`;
}

function roomDetailHtml(room, allRooms) {
  const nameToId = {};
  for (const r of allRooms) nameToId[r.name.toLowerCase()] = r.id;
  const connections = Array.isArray(room.connections) ? room.connections : [];
  const connHtml = connections.length
    ? connections.map(c => {
        const id = nameToId[c.toLowerCase()];
        return id ? `<a class="conn-link" href="/room/${id}" target="_blank">${c}</a>` : `<span class="conn-tag">${c}</span>`;
      }).join('')
    : '<span class="dim">–</span>';
  const clues = Array.isArray(room.clues) ? room.clues : (room.clues ? [room.clues] : []);
  const cluesHtml = clues.length ? '<ul>' + clues.map(c => `<li>${c}</li>`).join('') + '</ul>' : '<span class="dim">–</span>';
  const secret = room.secret_pathways && room.secret_pathways !== '–' ? room.secret_pathways : null;
  const access = room.access && room.access !== '–' ? room.access : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${room.name} — Close to God</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; color: #c9c9c9; font-family: 'Georgia', serif; min-height: 100vh; padding: 2rem; }
    .back { display: inline-block; color: #555; font-size: 0.8rem; text-decoration: none; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
    .back:hover { color: #cc2222; }
    .badge { display: inline-block; background: #1a0000; color: #aa3333; font-size: 0.7rem; padding: 0.2rem 0.6rem; border: 1px solid #330000; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.6rem; }
    h1 { color: #cc2222; font-size: 2rem; border-bottom: 2px solid #cc2222; padding-bottom: 0.4rem; margin-bottom: 1.5rem; }
    .fields { display: flex; flex-direction: column; gap: 1.2rem; max-width: 720px; }
    .field { border-top: 1px solid #1a1a1a; padding-top: 0.8rem; }
    .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 0.35rem; font-family: 'Courier New', monospace; }
    .value { font-size: 0.9rem; line-height: 1.6; }
    .value.haunt { color: #aa7777; font-style: italic; }
    .value ul { list-style: none; }
    .value ul li::before { content: '› '; color: #cc2222; }
    .conn-link, .conn-tag { display: inline-block; padding: 0.15rem 0.5rem; margin: 0.15rem; border-radius: 2px; font-size: 0.82rem; border: 1px solid #2a2a2a; background: #111; }
    .conn-link { color: #cc2222; text-decoration: none; border-color: #330000; }
    .conn-link:hover { background: #1a0000; }
    .conn-tag { color: #888; }
    .dim { color: #444; }
    .notes-box { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 3px; padding: 0.8rem; font-size: 0.88rem; color: #888; }
  </style>
</head>
<body>
  <a class="back" href="javascript:window.close()">✕ close</a>&nbsp;&nbsp;<a class="back" href="/" target="_blank">← map</a>
  <div class="badge">${room.section}</div>
  <h1>${room.name}</h1>
  <div class="fields">
    ${room.description ? `<div class="field"><div class="label">Description</div><div class="value">${room.description}</div></div>` : ''}
    <div class="field"><div class="label">Hallucinations</div><div class="value haunt">${room.hallucinations || '–'}</div></div>
    ${connections.length ? `<div class="field"><div class="label">Connections</div><div class="value">${connHtml}</div></div>` : ''}
    ${secret ? `<div class="field"><div class="label">Secret Pathways</div><div class="value">${secret}</div></div>` : ''}
    ${access ? `<div class="field"><div class="label">Access</div><div class="value">${access}</div></div>` : ''}
    <div class="field"><div class="label">Findings / Clues</div><div class="value">${cluesHtml}</div></div>
    ${room.notes && room.notes.trim() ? `<div class="field"><div class="label">Notes</div><div class="notes-box">${room.notes}</div></div>` : ''}
  </div>
</body>
</html>`;
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.use(express.json());
app.use('/images', express.static(CONTENT_DIR));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  const header         = fs.readFileSync(path.join(__dirname, 'header.md'), 'utf8');
  const backgroundHtml = mdToHtml(extractSection('Background',   header));
  const teaserHtml     = mdToHtml(extractSection('Teaser',       header));
  const introHtml      = mdToHtml(extractSection('Introduction', header));
  const body = `<div class="content">
    <div class="block"><h2>Background</h2>${backgroundHtml}</div>
    <div class="block"><h2>Teaser</h2>${teaserHtml}</div>
    <div class="block"><h2>Introduction</h2>${introHtml}</div>
  </div>`;
  res.send(pageHtml('Overview', 'overview', body));
});

app.get('/map', (req, res) => {
  const rooms  = readAllRooms();
  const layout = readLayout();
  const svg    = generateSvg(rooms, layout);
  const mapStyle = `
    #map-area { height: calc(100vh - 46px); overflow: auto; background: #080808; display: flex; align-items: flex-start; justify-content: center; padding: 1rem; }
    #map-area svg { max-height: calc(100vh - 62px); width: auto; display: block; }
    .room-link { cursor: pointer; }
    .room-link:hover .r { fill: #1a3a55; }
    .room-link:hover .t { fill: #d0f0ff; }
    .room-link.hidden-room:hover .r { fill: #0f2030; }
    .room-link.hidden-room:hover .t { fill: #90ccdd; }
    .room-link.tower-link:hover .r { fill: #1a3050; }
    .room-link.tower-link:hover .p { fill: #1a3050; }
    .room-link.tower-link:hover .t { fill: #d0f0ff; }`;
  const mapScript = `
    const svg = document.querySelector('#facility-map');
    let dragging = null, startSvg = null, startPos = null, svgPt = null, didDrag = false;
    function toSvgCoords(e) { svgPt.x = e.clientX; svgPt.y = e.clientY; return svgPt.matrixTransform(svg.getScreenCTM().inverse()); }
    svg.addEventListener('mousedown', e => {
      const link = e.target.closest('.room-link');
      if (!link) return;
      e.preventDefault();
      dragging = link; didDrag = false;
      svgPt = svg.createSVGPoint();
      startSvg = toSvgCoords(e);
      const rect = link.querySelector('.r');
      startPos = { x: parseFloat(rect.getAttribute('x')), y: parseFloat(rect.getAttribute('y')) };
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const p = toSvgCoords(e);
      const dx = p.x - startSvg.x, dy = p.y - startSvg.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      dragging.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
    });
    window.addEventListener('mouseup', async e => {
      if (!dragging) return;
      const p = toSvgCoords(e);
      const dx = Math.round(p.x - startSvg.x), dy = Math.round(p.y - startSvg.y);
      const id = dragging.dataset.id;
      const newX = startPos.x + dx, newY = startPos.y + dy;
      dragging.setAttribute('transform', '');
      dragging.querySelectorAll('[x]').forEach(el => el.setAttribute('x', parseFloat(el.getAttribute('x')) + dx));
      dragging.querySelectorAll('[y]').forEach(el => el.setAttribute('y', parseFloat(el.getAttribute('y')) + dy));
      const poly = dragging.querySelector('polygon');
      if (poly) { const pts = poly.getAttribute('points').split(' ').map(pt => { const [px,py] = pt.split(',').map(Number); return (px+dx)+','+(py+dy); }); poly.setAttribute('points', pts.join(' ')); }
      const justDragged = dragging; dragging = null;
      if (didDrag) { const cc = e => { e.preventDefault(); e.stopPropagation(); justDragged.removeEventListener('click', cc, true); }; justDragged.addEventListener('click', cc, true); }
      if (!didDrag) return;
      await fetch('/api/layout/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: newX, y: newY }) });
    });`;
  res.send(pageHtml('Map', 'map', `<div id="map-area">${svg}</div>`, mapStyle, mapScript));
});

app.get('/story', (req, res) => {
  const md   = fs.readFileSync(path.join(__dirname, 'story.md'), 'utf8');
  const body = `<div class="content">${mdToHtml(md)}</div>`;
  res.send(pageHtml('Story', 'story', body));
});

app.get('/mechanics', (req, res) => {
  const md   = fs.readFileSync(path.join(__dirname, 'mechanics.md'), 'utf8');
  const body = `<div class="content">${mdToHtml(md)}</div>`;
  res.send(pageHtml('Mechanics', 'mechanics', body));
});

app.get('/room/:id', (req, res) => {
  const rooms = readAllRooms();
  const room  = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).send('Room not found');
  res.send(roomDetailHtml(room, rooms));
});

app.post('/api/layout/:id', (req, res) => {
  const { x, y } = req.body;
  saveLayout(req.params.id, Math.round(x), Math.round(y));
  res.json({ ok: true });
});

app.get('/api/rooms', (req, res) => res.json(readAllRooms()));

const rooms = readAllRooms();
generateReadme(rooms);

app.listen(PORT, () => console.log(`Close to God running at http://localhost:${PORT}`));
