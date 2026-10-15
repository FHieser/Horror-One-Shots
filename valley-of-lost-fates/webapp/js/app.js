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
// The old lady shuffles the 22 cards with mixed orientation. Cards are drawn one at a time;
// the players place each one into a free slot of its colour. Extra blue cards go under the
// blue card without effect. The reading ends when every yellow slot is filled.

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
  const data = await fetchYaml('../data/cards.yaml');
  const byId = Object.fromEntries(data.cards.map(c => [c.id, c]));
  const slotEls = [...document.querySelectorAll('.slot')];
  const slotById = Object.fromEntries(slotEls.map(s => [s.dataset.slot, s]));

  let state = null;
  try { state = JSON.parse(localStorage.getItem(READING_KEY)); } catch (e) { state = null; }
  let selected = null;

  const save = () => { try { localStorage.setItem(READING_KEY, JSON.stringify(state)); } catch (e) {} };
  const freeSlots = color => slotEls.filter(s => s.dataset.color === color && !state.placements[s.dataset.slot]);
  const yellowDone = () => state && freeSlots('yellow').length === 0;
  const orientLabel = rev => rev ? 'reversed' : 'upright';

  function start() {
    const deck = data.cards.map(c => ({ id: c.id, rev: Math.random() < 0.5 }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state = { deck, next: 0, current: null, placements: {}, under: [], note: '' };
    selected = null;
    draw();
  }

  function draw() {
    state.note = '';
    if (yellowDone() || state.next >= state.deck.length) { state.current = null; save(); render(); return; }
    const card = state.deck[state.next++];
    const color = byId[card.id].category;
    if (color === 'blue' && state.placements.map) {
      state.under.push(card);
      state.current = card;
      state.note = 'blue-under';
    } else if (!freeSlots(color).length) {
      state.current = card;
      state.note = 'no-slot';
    } else {
      state.current = card;
    }
    save();
    render();
  }

  function place(slotId) {
    state.placements[slotId] = state.current;
    state.current = null;
    draw();
  }

  function faceSvg(slot, card) {
    const c = byId[card.id];
    const w = +slot.dataset.w, h = +slot.dataset.h;
    const upright = slot.dataset.color === 'yellow';
    const lines = wrapWords(c.name, upright ? 10 : 16);
    const y0 = upright ? 48 : 36;
    const name = lines.map((l, i) => `<text class="name" x="${w / 2}" y="${y0 + i * 13}">${l}</text>`).join('');
    const under = slot.dataset.slot === 'map' && state.under.length ? `<text class="under" x="${w / 2}" y="${h - 22}">+${state.under.length} under</text>` : '';
    return `<text class="num" x="${w / 2}" y="${upright ? 22 : 18}">${ROMAN[c.id]}</text>${name}${under}
      <text class="orient ${card.rev ? 'rev' : ''}" x="${w / 2}" y="${h - 8}">${card.rev ? '▼ REVERSED' : '▲ UPRIGHT'}</text>`;
  }

  function cardDetail(slotId) {
    const card = state.placements[slotId];
    const c = byId[card.id];
    const effects = card.rev ? c.reversed : c.upright;
    return `<div class="box">
      <h3>${ROMAN[c.id]} · ${c.name} <span class="dim">(${orientLabel(card.rev)})</span></h3>
      <div class="where">${slotById[slotId].dataset.label} · ${c.category}${c.artifact ? ' · Artifact ' + c.artifact : ''}</div>
      ${list(effects) || '<p class="dim"><em>Still to be written.</em></p>'}
    </div>`;
  }

  function render() {
    // Slots
    slotEls.forEach(s => {
      const card = state && state.placements[s.dataset.slot];
      s.classList.toggle('filled', !!card);
      s.classList.toggle('selected', selected === s.dataset.slot);
      s.querySelector('.face').innerHTML = card ? faceSvg(s, card) : '';
      const valid = state && state.current && !state.note && s.dataset.color === byId[state.current.id].category && !card;
      s.classList.toggle('valid', !!valid);
    });

    // Drawn card + the old lady's words
    const drawn = document.getElementById('drawn');
    const lady = document.getElementById('lady');
    const btn = document.getElementById('draw-btn');
    if (!state) {
      drawn.className = 'drawn';
      drawn.innerHTML = '<span class="dim">22</span>';
      lady.innerHTML = '<p>On the Megalith, an old lady is waiting. She shuffles a deck of 22 cards and asks the expedition to lay out the valley with her. <em>"Where does this one belong, do you think?"</em></p>';
      btn.textContent = 'Start the reading';
      btn.hidden = false;
    } else if (state.current) {
      const c = byId[state.current.id];
      drawn.className = `drawn ${c.category}${state.current.rev ? ' rev' : ''}`;
      drawn.innerHTML = `<span class="num">${ROMAN[c.id]}</span><span class="name">${c.name}</span><span class="orient ${state.current.rev ? 'rev' : ''}">${orientLabel(state.current.rev)}</span>`;
      if (state.note === 'blue-under') {
        lady.innerHTML = `<p>She turns over <strong>${c.name}</strong>. The blue place is already taken, so she slides it under the first blue card. It has no effect.</p>`;
        btn.textContent = 'Draw next card'; btn.hidden = false;
      } else if (state.note === 'no-slot') {
        lady.innerHTML = `<p>She turns over <strong>${c.name}</strong>, but there is no free ${c.category} place left. She puts it aside.</p>`;
        btn.textContent = 'Draw next card'; btn.hidden = false;
      } else {
        lady.innerHTML = `<p>She turns over <strong>${c.name}</strong> (${orientLabel(state.current.rev)}). Place it in a free <strong>${c.category}</strong> slot on the map.</p>
          <p class="dim">${freeSlots('yellow').length} yellow ${freeSlots('yellow').length === 1 ? 'place remains' : 'places remain'} · ${state.deck.length - state.next} cards left in the deck</p>`;
        btn.hidden = true;
      }
    } else {
      drawn.className = 'drawn';
      drawn.innerHTML = `<span class="dim">${state.deck.length - state.next}</span>`;
      lady.innerHTML = '<p>Every place for a single location is taken. The old lady gathers the rest of the cards. <em>"So this is the valley you chose."</em></p><p class="dim">Click a card on the map to see its effect.</p>';
      btn.hidden = true;
    }

    // GM view: selected card, plus the full reading once it is complete
    const gm = document.getElementById('gm');
    let html = '';
    if (state && selected && state.placements[selected]) html += `<h2>Selected card</h2>${cardDetail(selected)}`;
    if (state && !state.current && Object.keys(state.placements).length) {
      html += '<h2>The reading (GM)</h2>' + slotEls
        .filter(s => state.placements[s.dataset.slot])
        .map(s => cardDetail(s.dataset.slot)).join('<div style="height:0.8rem"></div>');
    }
    gm.innerHTML = html;
  }

  document.getElementById('draw-btn').addEventListener('click', () => state ? draw() : start());
  document.getElementById('reset-btn').addEventListener('click', () => {
    state = null; selected = null;
    try { localStorage.removeItem(READING_KEY); } catch (e) {}
    render();
  });
  slotEls.forEach(s => s.addEventListener('click', () => {
    if (!state) return;
    if (s.classList.contains('valid')) { place(s.dataset.slot); return; }
    if (state.placements[s.dataset.slot]) {
      selected = selected === s.dataset.slot ? null : s.dataset.slot;
      render();
      if (selected) document.getElementById('gm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }));
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
    ${section('Artifacts', g.artifacts)}`;
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
