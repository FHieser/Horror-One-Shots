// valley-of-lost-fates/webapp/js/app.js
// Client-side rendering for the Valley of Lost Fates site.
// Depends on: jsyaml (CDN) for YAML pages, marked (CDN) for the overview and lore.

// ── Data loading ────────────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.text();
}

async function fetchYaml(url) {
  return jsyaml.load(await fetchText(url));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const REGIONS = {
  central:   { label: 'Central',   color: 'var(--central)' },
  plains:    { label: 'Plains',    color: 'var(--plains)' },
  swamp:     { label: 'Swamp',     color: 'var(--swamp)' },
  sea:       { label: 'Sea',       color: 'var(--sea)' },
  highlands: { label: 'Highlands', color: 'var(--highlands)' },
  special:   { label: 'Special',   color: 'var(--special)' },
};

const MYTHS = [
  { id: 'liebende',         title: 'Der Fall der Liebenden' },
  { id: 'sturmkrone',       title: 'Die Sturmkrone' },
  { id: 'hexe-und-waerter', title: 'Die Hexe und der Wärter' },
  { id: 'narr-und-wald',    title: 'Der Narr und der verbotene Wald' },
];

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

function list(items) {
  return Array.isArray(items) && items.length
    ? '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>'
    : '';
}

function openBox(items) {
  return Array.isArray(items) && items.length
    ? `<div class="open"><div class="label">Open</div>${list(items)}</div>`
    : '';
}

// Wires a row of .pill buttons to the URL hash: #<prefix><id>
function hashSelect(prefix, ids, render) {
  function route() {
    const hash = location.hash.slice(1);
    const id = hash.startsWith(prefix) && ids.includes(hash.slice(prefix.length)) ? hash.slice(prefix.length) : ids[0];
    document.querySelectorAll('[data-select]').forEach(b => b.classList.toggle('active', b.dataset.select === id));
    render(id);
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-select]');
    if (btn) location.hash = prefix + btn.dataset.select;
  });
  window.addEventListener('hashchange', route);
  route();
}

// ── Overview ────────────────────────────────────────────────────────────────

async function initOverview() {
  const md = await fetchText('../data/overview.md');
  document.getElementById('md-content').innerHTML = marked.parse(md);
}

// ── Reading (map page) ──────────────────────────────────────────────────────
// The reading happens at the table with real cards. The GM records it here:
// click an empty slot to choose the card (only cards of the slot's colour), click a filled slot to see,
// flip or remove it. Saved in the browser so a reload keeps the valley.

const READING_KEY = 'vlf-reading';

function wrapWords(text, max) {
  const lines = [];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
}

async function initReading() {
  const [data, pageData] = await Promise.all([fetchYaml('../data/cards.yaml'), fetchYaml('../data/pages.yaml')]);
  const byId = Object.fromEntries(data.cards.map(c => [c.id, c]));
  const slotEls = [...document.querySelectorAll('.slot')];
  const slotById = Object.fromEntries(slotEls.map(s => [s.dataset.slot, s]));

  let placements = {};
  try { placements = JSON.parse(localStorage.getItem(READING_KEY)) || {}; } catch (e) { placements = {}; }
  if (placements.placements) placements = placements.placements;   // reading saved by the old draw version
  let active = null;   // slot id whose panel is open

  const save = () => { try { localStorage.setItem(READING_KEY, JSON.stringify(placements)); } catch (e) {} };

  // First card drawn → where the three pages lie
  const FIRST_KEY = 'vlf-first-card';
  const firstSel = document.getElementById('first-card');
  firstSel.innerHTML += data.cards.map(c => `<option value="${c.id}">${ROMAN[c.id]} · ${c.name}</option>`).join('');
  try { firstSel.value = localStorage.getItem(FIRST_KEY) || ''; } catch (e) {}
  function renderPages() {
    const row = pageData.table.find(r => String(r.card) === firstSel.value);
    slotEls.forEach(s => {
      const mark = s.querySelector('.page-mark');
      const i = row ? row.pages.indexOf(s.dataset.slot) : -1;
      mark.toggleAttribute('hidden', i < 0);   // SVG elements have no .hidden property
      if (i >= 0) mark.querySelector('text').textContent = ROMAN[i + 1];
    });
    document.getElementById('pages-line').innerHTML = row
      ? 'Pages: ' + row.pages.map((l, i) => `<strong>${ROMAN[i + 1]}</strong> ${slotById[l].dataset.label}`).join(' · ')
      : '<span class="dim">Choose the first card drawn to see where the three pages lie.</span>';
  }
  firstSel.addEventListener('change', () => {
    try { localStorage.setItem(FIRST_KEY, firstSel.value); } catch (e) {}
    renderPages();
  });
  renderPages();
  const usedIds = () => new Set(Object.values(placements).map(p => p.id));
  const orient = rev => rev ? 'reversed' : 'upright';

  function faceSvg(slot, card) {
    const c = byId[card.id];
    const w = +slot.dataset.w, h = +slot.dataset.h;
    const upright = slot.dataset.color === 'yellow';
    const lines = wrapWords(c.name, upright ? 10 : 16);
    const y0 = upright ? 48 : 36;
    const name = lines.map((l, i) => `<text class="name" x="${w / 2}" y="${y0 + i * 13}">${l}</text>`).join('');
    return `<text class="num" x="${w / 2}" y="${upright ? 22 : 18}">${ROMAN[c.id]}</text>${name}
      <text class="orient ${card.rev ? 'rev' : ''}" x="${w / 2}" y="${h - 8}">${card.rev ? '▼ REVERSED' : '▲ UPRIGHT'}</text>`;
  }

  function effectBox(slotId) {
    const card = placements[slotId];
    const c = byId[card.id];
    return `<div class="box">
      <h3>${ROMAN[c.id]} · ${c.name} <span class="dim">(${orient(card.rev)})</span></h3>
      <div class="where">${slotById[slotId].dataset.label} · ${c.category}</div>
      ${list(card.rev ? c.reversed : c.upright) || '<p class="dim"><em>Still to be written.</em></p>'}
    </div>`;
  }

  function panelHtml() {
    if (!active) return '';
    const slot = slotById[active];
    const label = slot.dataset.label;
    if (placements[active]) {
      return `<div class="panel-head"><h2>${label}</h2><button class="btn ghost" data-act="close">Close</button></div>
        ${effectBox(active)}
        <div class="panel-actions">
          <button class="btn" data-act="flip">Flip to ${orient(!placements[active].rev)}</button>
          <button class="btn ghost" data-act="change">Change card</button>
          <button class="btn ghost" data-act="remove">Remove</button>
        </div>`;
    }
    const color = slot.dataset.color;
    const used = usedIds();
    const options = data.cards.filter(c => c.category === color && !used.has(c.id));
    return `<div class="panel-head"><h2>${label} <span class="dim">· choose a ${color} card</span></h2><button class="btn ghost" data-act="close">Close</button></div>
      <div class="pick-grid">${options.map(c => `
        <div class="pick ${c.category}">
          <div class="pick-name"><span class="num">${ROMAN[c.id]}</span> ${c.name}</div>
          <div class="pick-btns">
            <button class="btn" data-act="pick" data-id="${c.id}" data-rev="0">▲ Upright</button>
            <button class="btn" data-act="pick" data-id="${c.id}" data-rev="1">▼ Reversed</button>
          </div>
        </div>`).join('') || '<p class="dim">Every card of this colour is already on the map.</p>'}
      </div>`;
  }

  function render() {
    slotEls.forEach(s => {
      const card = placements[s.dataset.slot];
      s.classList.toggle('filled', !!card);
      s.classList.toggle('selected', active === s.dataset.slot);
      s.querySelector('.face').innerHTML = card ? faceSvg(s, card) : '';
    });
    const panel = document.getElementById('slot-panel');
    panel.innerHTML = panelHtml();
    panel.hidden = !active;

    const filled = slotEls.filter(s => placements[s.dataset.slot]);
    document.getElementById('gm').innerHTML = filled.length
      ? '<h2>The reading</h2>' + filled.map(s => effectBox(s.dataset.slot)).join('<div style="height:0.8rem"></div>')
      : '';
  }

  slotEls.forEach(s => s.addEventListener('click', () => {
    active = active === s.dataset.slot ? null : s.dataset.slot;
    render();
    if (active) document.getElementById('slot-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));

  document.getElementById('slot-panel').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'close') active = null;
    if (act === 'pick') { placements[active] = { id: +b.dataset.id, rev: b.dataset.rev === '1' }; save(); }
    if (act === 'flip') { placements[active].rev = !placements[active].rev; save(); }
    if (act === 'remove' || act === 'change') { delete placements[active]; save(); if (act === 'remove') active = null; }
    render();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    placements = {}; active = null; save(); render();
    firstSel.value = '';
    try { localStorage.removeItem(FIRST_KEY); } catch (e) {}
    renderPages();
  });
  render();
}

// ── Locations ───────────────────────────────────────────────────────────────

async function initLocations() {
  const locs = await fetchYaml('../data/locations.yaml');
  const byId = Object.fromEntries(locs.map(l => [l.id, l]));

  document.getElementById('loc-picker').innerHTML = locs.map(l =>
    `<button class="pill" data-select="${l.id}"><span class="dot" style="background:${REGIONS[l.region]?.color || '#666'}"></span>${l.name}</button>`
  ).join('');

  hashSelect('loc-', locs.map(l => l.id), id => {
    const l = byId[id];
    const region = REGIONS[l.region] || { label: l.region, color: '#888' };
    const myth = MYTHS.find(m => m.id === l.lore);
    document.getElementById('loc-sheet').innerHTML = `
      <article class="sheet">
        <div class="sheet-head"><h2>${l.name}</h2><span class="badge" style="color:${region.color}">${region.label}</span></div>
        ${list(l.narrative)}
        ${myth ? `<p class="dim">Myth: <a href="./lore.html#myth-${myth.id}">${myth.title}</a></p>` : ''}
        ${l.meeting ? `<div class="section"><div class="label">Meeting place</div><p>${l.meeting}</p></div>` : ''}
        ${l.mechanic?.length ? `<div class="section"><div class="label">Mechanic</div>${list(l.mechanic)}</div>` : ''}
        ${l.challenge?.length ? `<div class="section box artifact"><div class="label">Challenge</div>${list(l.challenge)}</div>` : ''}
        ${openBox(l.open)}
      </article>`;
  });
}

// ── Cards ───────────────────────────────────────────────────────────────────

async function initCards() {
  const data = await fetchYaml('../data/cards.yaml');
  document.getElementById('card-system').innerHTML = (data.system || []).map(s => `<li>${s}</li>`).join('');

  let side = 'both';
  let cat = 'all';

  function sideHtml(label, items) {
    return `<div class="side"><div class="label">${label}</div>${
      items && items.length ? list(items) : '<p class="todo">Still to be written.</p>'}</div>`;
  }

  function render() {
    const cards = data.cards.filter(c =>
      cat === 'all' || c.category === cat);
    document.getElementById('card-grid').innerHTML = cards.map(c => `
      <article class="tarot ${c.category}">
        <div class="tarot-head">
          <div class="tarot-num">${ROMAN[c.id]}</div>
          <div class="tarot-name">${c.name}</div>
          <div class="tarot-de">${c.german || ''}</div>
          <div class="tarot-tags">
            <span class="badge">${c.category}</span>
          </div>
        </div>
        <div class="tarot-body">
          ${side !== 'reversed' ? sideHtml('Upright', c.upright) : ''}
          ${side !== 'upright' ? sideHtml('Reversed', c.reversed) : ''}
        </div>
      </article>`).join('');
  }

  document.getElementById('side-picker').addEventListener('click', e => {
    const b = e.target.closest('[data-side]');
    if (!b) return;
    side = b.dataset.side;
    document.querySelectorAll('#side-picker .pill').forEach(p => p.classList.toggle('active', p === b));
    render();
  });
  document.getElementById('cat-picker').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    document.querySelectorAll('#cat-picker .pill').forEach(p => p.classList.toggle('active', p === b));
    render();
  });
  render();
}

// ── Final location ──────────────────────────────────────────────────────────

async function initFinal() {
  const [f, pg, cards, locs] = await Promise.all([
    fetchYaml('../data/final.yaml'), fetchYaml('../data/pages.yaml'),
    fetchYaml('../data/cards.yaml'), fetchYaml('../data/locations.yaml'),
  ]);
  const cardName = Object.fromEntries(cards.cards.map(c => [c.id, c.name]));
  const locName = Object.fromEntries(locs.map(l => [l.id, l.name]));
  const pageTable = `<div class="table-wrap"><table class="pages-table">
      <thead><tr><th>First card drawn</th>${pg.pages.map(p => `<th>${ROMAN[p.id]} · ${p.name}</th>`).join('')}</tr></thead>
      <tbody>${pg.table.map(r => `<tr><td><span class="dim">${ROMAN[r.card]}</span> ${cardName[r.card]}</td>${r.pages.map(l => `<td><a href="./locations.html#loc-${l}">${locName[l]}</a></td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  const row = (label, value) => value ? `<div class="row"><div class="label">${label}</div>${value}</div>` : '';
  const form = x => `
    <div class="form">
      <h3>${x.card}</h3>
      ${list(x.theme) || '<p class="todo dim"><em>Still to be written.</em></p>'}
      ${row('Attack', x.attack)}
      ${row('Ability 1', x.ability1)}
      ${row('Ability 2', x.ability2)}
      ${row('Effect', x.effect)}
    </div>`;

  document.getElementById('final').innerHTML = `
    <h2>The Three Pages</h2>${list(pg.rules)}
    ${pageTable}
    ${openBox(pg.open)}
    <h2>Unlocking</h2>${list(f.unlock)}
    <h2>Arrival</h2>${list(f.arrival)}
    <p class="group-note">The forms below are the old variant idea and are being replaced by a single boss form.</p>
    <h2>Ruler</h2>
    <div class="forms">${(f.rulers || []).map(form).join('')}</div>
    <h2>People</h2>
    <div class="forms">${(f.people || []).map(form).join('')}</div>
    <h2>Realm</h2>
    <div class="forms">${(f.realms || []).map(form).join('')}</div>
    ${openBox(f.open)}`;
}

// ── Gear ────────────────────────────────────────────────────────────────────

async function initGear() {
  const g = await fetchYaml('../data/gear.yaml');
  const card = c => `
    <div class="found ${c.type === 'artifact' ? 'artifact' : ''}">
      <div class="found-head"><h3>${c.name}</h3><span class="slots">${c.slots === undefined ? '? slots' : c.slots + (c.slots === 1 ? ' slot' : ' slots')}</span></div>
      <div class="from">${c.found || ''}</div>
      ${list(c.text) || '<p class="dim"><em>Still to be written.</em></p>'}
      ${openBox(c.open)}
    </div>`;
  const section = (title, items) => items && items.length
    ? `<h2>${title}</h2><div class="found-grid">${items.map(card).join('')}</div>` : '';
  document.getElementById('gear').innerHTML = `
    ${(g.intro || []).map(p => `<p>${p}</p>`).join('')}
    ${section('Expedition Gear', g.expedition)}
    ${section('Items', g.items)}
    ${section('The Three Pages', g.pages)}`;
}

// ── Lore ────────────────────────────────────────────────────────────────────

async function initLore() {
  document.getElementById('lore-picker').innerHTML = MYTHS.map(m =>
    `<button class="pill" data-select="${m.id}">${m.title}</button>`).join('');
  const cache = {};
  hashSelect('myth-', MYTHS.map(m => m.id), async id => {
    const el = document.getElementById('lore-text');
    if (!cache[id]) cache[id] = await fetchText(`../data/lore/${id}.md`);
    el.innerHTML = marked.parse(cache[id], { breaks: true });
  });
}
