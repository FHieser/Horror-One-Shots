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
        ${l.artifact?.length ? `<div class="section box artifact"><div class="label">Artifact challenge</div>${list(l.artifact)}</div>` : ''}
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
      cat === 'all' || (cat === 'artifact' ? !!c.artifact : c.category === cat));
    document.getElementById('card-grid').innerHTML = cards.map(c => `
      <article class="tarot ${c.category}">
        <div class="tarot-head">
          <div class="tarot-num">${ROMAN[c.id]}</div>
          <div class="tarot-name">${c.name}</div>
          <div class="tarot-de">${c.german || ''}</div>
          <div class="tarot-tags">
            <span class="badge">${c.category}</span>
            ${c.artifact ? `<span class="badge art">Artifact ${c.artifact}</span>` : ''}
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
  const f = await fetchYaml('../data/final.yaml');
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
    <h2>Unlocking</h2>${list(f.unlock)}
    <h2>Arrival</h2>${list(f.arrival)}
    <h2>Ruler</h2>
    <p class="group-note">Set by the A1 artifact card in play (Empress, Emperor, Hierophant).</p>
    <div class="forms">${(f.rulers || []).map(form).join('')}</div>
    <h2>People</h2>
    <p class="group-note">Set by the A2 artifact card in play (Strength, Justice, Temperance).</p>
    <div class="forms">${(f.people || []).map(form).join('')}</div>
    <h2>Realm</h2>
    <p class="group-note">Set by the A3 artifact card in play (Star, Moon, Sun).</p>
    <div class="forms">${(f.realms || []).map(form).join('')}</div>
    ${openBox(f.open)}`;
}

// ── Crew ────────────────────────────────────────────────────────────────────

async function initCrew() {
  const c = await fetchYaml('../data/crew.yaml');
  document.getElementById('crew').innerHTML = `
    ${(c.intro || []).map(p => `<p>${p}</p>`).join('')}
    <div class="roles">${(c.roles || []).map(r => `
      <div class="role">
        <h3>${r.name}</h3>
        <div class="de">${r.german && r.german !== r.name ? r.german : '&nbsp;'}</div>
        ${r.duty ? `<p class="duty">${r.duty}</p>` : ''}
        <div class="label">Gear</div>
        ${list(r.gear)}
      </div>`).join('')}
    </div>
    ${openBox(c.open)}`;
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
