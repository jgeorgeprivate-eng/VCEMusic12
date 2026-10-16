// works.js — My works: the pieces her teacher sets, each with a listening template, stored on the phone and shown as revision cards.
import * as store from './store.js';

const FIELDS = [
  { id: 'duration', label: 'Duration', hint: 'Metre, tempo, rhythm patterns, syncopation' },
  { id: 'melody', label: 'Pitch: melody', hint: 'Contour, range, steps or leaps, register' },
  { id: 'harmony', label: 'Pitch: harmony', hint: 'Chords, progressions, how often they change' },
  { id: 'tonality', label: 'Pitch: tonality', hint: 'Major, minor, pentatonic, key changes' },
  { id: 'toneColour', label: 'Tone colour', hint: 'Instruments or voices, how they are played, quality words' },
  { id: 'texture', label: 'Texture', hint: 'Monophonic, homophonic, polyphonic, layering, changes' },
  { id: 'structure', label: 'Structure', hint: 'Sections with letters and timings' },
  { id: 'dynamics', label: 'Dynamics', hint: 'Levels, changes, where the loudest point is' },
  { id: 'articulation', label: 'Articulation', hint: 'Legato, staccato, accents, slides' },
  { id: 'devices', label: 'Compositional devices', hint: 'The main idea and what happens to it: repetition, sequence, variation, contrast, transition' },
  { id: 'organisation', label: 'Approach to organisation', hint: 'Binary, ternary, rondo, verse and chorus, 12-bar blues, riff-based, and so on' },
  { id: 'effect', label: 'Effect', hint: 'Mood, image or character, and which choices create it' },
  { id: 'context', label: 'Context', hint: 'When, where, what for, and one fact about the composer or performer that shaped it' },
];
const REQUIRED = ['duration', 'melody', 'harmony', 'tonality', 'toneColour', 'texture', 'structure', 'dynamics', 'articulation', 'organisation'];

let pendingMsg = '';
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function complete(w) { return REQUIRED.every(f => (w.fields[f] || '').trim().length > 0); }

export function mountWorks(el, arg) {
  const st = store.get();
  if (arg === 'new') return editWork(el, { id: uid(), title: '', composer: '', link: '', fields: {}, created: Date.now() }, true);
  if (arg && arg.startsWith('edit-')) { const w = st.works.find(x => x.id === arg.slice(5)); if (w) return editWork(el, w, false); }
  if (arg === 'cards') return cards(el);
  el.innerHTML = `<div class="top"><h1>My works</h1><a class="btn sm" href="#works/new">Add a work</a></div>
    <p class="muted" style="margin-top:0">The pieces you are studying for analysis. Fill in the listening template for each one. A completed template earns a life and becomes a revision card.</p>
    <div class="works" data-role="list"></div>
    ${st.works.length ? `<div class="row" style="margin-top:14px"><a class="btn ghost sm" href="#works/cards">Revision cards</a></div>` : ''}`;
  const list = el.querySelector('[data-role=list]');
  if (!st.works.length) list.innerHTML = `<div class="card"><p class="muted" style="margin:0">No works yet. Add the first piece your teacher sets, with the title, the composer or performer and a link to a recording.</p></div>`;
  st.works.forEach(w => {
    const done = complete(w); const filled = FIELDS.filter(f => (w.fields[f.id] || '').trim()).length;
    list.insertAdjacentHTML('beforeend', `<a class="work-row ${done ? 'done' : ''}" href="#works/edit-${w.id}"><div><div class="n">${esc(w.title || 'Untitled')}</div><div class="s">${esc(w.composer || '')}${w.composer && w.performer ? ' · ' : ''}${esc(w.performer || '')}</div><div class="bar"><b style="width:${Math.round(100 * filled / FIELDS.length)}%;background:var(--anal)"></b></div></div><span class="best">${done ? 'Complete' : filled + ' of ' + FIELDS.length}</span></a>`);
  });
}

function editWork(el, w, isNew) {
  el.innerHTML = `<div class="top"><h1>${isNew ? 'Add a work' : 'Listening template'}</h1><a class="btn ghost sm" href="#works">Back</a></div>
    <form data-role="form" class="work-form">
      <label>Title<input type="text" id="w-title" value="${esc(w.title)}" required placeholder="For example: Für Elise"></label>
      <label>Composer<input type="text" id="w-composer" value="${esc(w.composer)}" placeholder="For example: Beethoven"></label>
      <label>Performer or recording<input type="text" id="w-performer" value="${esc(w.performer || '')}" placeholder="Who plays it on the recording you use"></label>
      <label>Link to a recording<input type="url" id="w-link" value="${esc(w.link)}" placeholder="https://…"></label>
      ${w.link ? `<a class="btn ghost sm" href="${esc(w.link)}" target="_blank" rel="noopener">Open recording</a>` : ''}
      <h2 style="margin-top:18px">Listening template</h2>
      <p class="muted small">One or two sentences each, with terms and timings. The ten starred lines complete the template.</p>
      ${FIELDS.map(f => `<label>${f.label}${REQUIRED.includes(f.id) ? ' *' : ''}<small>${f.hint}</small><textarea id="w-${f.id}" rows="2">${esc(w.fields[f.id] || '')}</textarea></label>`).join('')}
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button type="submit" class="btn">Save</button>${isNew ? '' : '<button type="button" class="btn ghost" data-role="delete">Remove this work</button>'}</div>
      <p class="muted small" data-role="msg">${esc(pendingMsg)}</p>
    </form>`;
  pendingMsg = '';
  const form = el.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    w.title = form.querySelector('#w-title').value.trim(); w.composer = form.querySelector('#w-composer').value.trim(); w.performer = form.querySelector('#w-performer').value.trim(); w.link = form.querySelector('#w-link').value.trim();
    FIELDS.forEach(f => { w.fields[f.id] = form.querySelector('#w-' + f.id).value; });
    const st = store.get();
    if (!st.works.find(x => x.id === w.id)) st.works.push(w);
    let msg = 'Saved.';
    if (complete(w)) { const r = store.recordWorkTemplate(w); if (r.lives) msg = 'Template complete. You earned 1 life.'; else msg = 'Saved. Template complete.'; }
    store.save();
    el.querySelector('[data-role=msg]').textContent = msg;
    if (isNew) { pendingMsg = msg; location.hash = '#works/edit-' + w.id; }
  });
  const del = el.querySelector('[data-role=delete]');
  if (del) del.addEventListener('click', () => {
    if (del.dataset.armed) { const st = store.get(); st.works = st.works.filter(x => x.id !== w.id); store.save(); location.hash = '#works'; return; }
    del.dataset.armed = '1'; del.textContent = 'Tap again to confirm removal';
  });
}

function cards(el) {
  const st = store.get();
  const items = [];
  st.works.forEach(w => FIELDS.forEach(f => { if ((w.fields[f.id] || '').trim()) items.push({ w, f }); }));
  el.innerHTML = `<div class="top"><h1>Revision cards</h1><a class="btn ghost sm" href="#works">Back</a></div>`;
  if (!items.length) { el.insertAdjacentHTML('beforeend', '<p class="muted">Fill in a listening template first. Each line you write becomes a card.</p>'); return; }
  let i = Math.floor(Math.random() * items.length);
  const box = document.createElement('div'); el.appendChild(box);
  const show = () => {
    const { w, f } = items[i];
    box.innerHTML = `<div class="card rev" data-role="card"><div class="eyebrow">${esc(w.title)}${w.composer ? ' · ' + esc(w.composer) : ''}</div><h2 style="font-size:22px;margin:6px 0 10px">${esc(f.label)}</h2><p class="muted" data-role="q">What did you note about the ${f.label.toLowerCase()}? Tap to reveal.</p><p data-role="a" hidden>${esc(w.fields[f.id])}</p></div>
      <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="btn ghost sm" data-role="reveal">Reveal</button><button type="button" class="btn sm" data-role="next">Next card</button><span class="muted small" style="align-self:center">${items.length} cards</span></div>`;
    const reveal = () => { box.querySelector('[data-role=a]').hidden = false; box.querySelector('[data-role=q]').hidden = true; };
    box.querySelector('[data-role=card]').addEventListener('click', reveal); box.querySelector('[data-role=reveal]').addEventListener('click', reveal);
    box.querySelector('[data-role=next]').addEventListener('click', () => { i = (i + 1 + Math.floor(Math.random() * (items.length - 1))) % items.length; show(); });
  };
  show();
}

export const CSS = `
.works{display:grid;gap:8px}
.work-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;border:1px solid var(--rule);border-left:4px solid var(--anal);border-radius:12px;padding:10px 14px;text-decoration:none}
.work-row .n{font-weight:600}.work-row .s{font-size:14px;color:var(--ink-2)}
.work-row .best{font-size:13px;color:var(--ink-2);font-variant-numeric:tabular-nums}
.work-row.done .best{color:var(--ok);font-weight:600}
.work-form label{display:block;font-weight:600;margin-bottom:10px}
.work-form label small{display:block;font-weight:400;color:var(--ink-2);font-size:13px}
.work-form input,.work-form textarea{display:block;width:100%;margin-top:4px;font:inherit;font-weight:400;padding:8px 10px;border:1.5px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink);min-height:44px}
.work-form textarea{resize:vertical}
.rev{cursor:pointer;min-height:140px}
`;
