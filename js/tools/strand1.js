// tools/strand1.js — interactive tools for the music language lessons.
import * as T from '../theory.js';
import { renderNotation } from '../notation.js';
import { keyboard } from '../keyboard.js';
import { playSequence, playNote, playChord, click } from '../audio.js';
import { eventsToSequence } from '../melody.js';

const { toMidi, pitchName, pitch, pitchFromDiatonic, diatonicIndex, keyScale, KEYS, interval, triad, PROGRESSIONS, METRES, gridToEvents } = T;

// ---------- staff and keyboard explorer (L1) ----------
export function staffExplorer(el, ctx) {
  let acc = 0;
  let placed = [];
  el.innerHTML = `<p class="muted small" style="margin:0 0 8px">Tap a line or space on the staff to place a note. Tap a key on the keyboard to see where it sits on the staff.</p>
    <div class="seg" data-role="acc"><button type="button" data-a="0" class="on">♮ natural</button><button type="button" data-a="1">♯ sharp</button><button type="button" data-a="-1">♭ flat</button></div>
    <div class="ex-staff" data-role="staff"></div>
    <div data-role="kb"></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="play">Play notes</button><button type="button" class="btn sm ghost" data-role="clear">Clear</button><span class="muted small" data-role="out"></span></div>`;
  const kb = keyboard({ from: 55, to: 84, voice: ctx.voice || 'piano', onTap: (m) => { const p = spell(m); placed.push(p); if (placed.length > 8) placed.shift(); draw(); say(p); } });
  el.querySelector('[data-role=kb]').appendChild(kb.el);
  function spell(m) { const pc = m % 12, oct = Math.floor(m / 12) - 1; const sharpNames = [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]]; const flatNames = [['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0]]; const [s, a] = (acc < 0 ? flatNames : sharpNames)[pc]; return pitch(s, a, oct); }
  function draw() {
    const events = placed.length ? placed.map(p => ({ pitches: [p], dur: 192 })) : [];
    const r = renderNotation({ key: 'C', events, labels: 'names', endBar: false, width: 420 });
    const box = el.querySelector('[data-role=staff]');
    box.innerHTML = r.svg;
    kb.update({ highlight: new Set(placed.map(toMidi)) });
    const svg = box.querySelector('svg');
    svg.addEventListener('click', (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      // staff geometry mirrors notation.js: top line y = 40, bottom line y = 80, half-space 5
      const bottomIdx = diatonicIndex(pitch('E', 0, 4));
      const steps = Math.round((80 - loc.y) / 5);
      if (steps < -6 || steps > 16) return;
      if (loc.x < 50) return;
      const p = pitchFromDiatonic(bottomIdx + steps, acc);
      placed.push(p); if (placed.length > 8) placed.shift();
      playNote(toMidi(p), { dur: 0.6, voice: ctx.voice || 'piano' });
      draw(); say(p);
    });
  }
  function say(p) { el.querySelector('[data-role=out]').textContent = `${pitchName(p, { octave: true })}${p.oct === 4 && p.step === 'C' && p.acc === 0 ? ' (middle C)' : ''}`; kb.flash(toMidi(p), 500); }
  el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { acc = +b.dataset.a; el.querySelectorAll('[data-a]').forEach(x => x.classList.toggle('on', x === b)); }));
  el.querySelector('[data-role=play]').addEventListener('click', () => { const evs = el.querySelectorAll('.ev'); playSequence(placed.map(p => ({ midi: toMidi(p), beats: 1 })), { bpm: 100, voice: ctx.voice || 'piano', onNote: (i) => { evs.forEach(x => x.classList.remove('hot')); evs[i] && evs[i].classList.add('hot'); kb.flash(toMidi(placed[i]), 500); }, onEnd: () => evs.forEach(x => x.classList.remove('hot')) }); });
  el.querySelector('[data-role=clear]').addEventListener('click', () => { placed = []; draw(); el.querySelector('[data-role=out]').textContent = ''; });
  draw();
}

// ---------- rhythm grid (L2, L3) ----------
export function rhythmGrid(el, ctx) {
  const unit = ctx.unit || 1;
  let time = '4/4';
  let cells = [];
  let bpm = 90;
  let running = null;
  el.innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><div class="seg" style="margin:0" data-role="time"><button type="button" data-t="4/4" class="on">4/4</button><button type="button" data-t="3/4">3/4</button>${unit >= 2 ? '<button type="button" data-t="6/8">6/8</button>' : '<button type="button" data-t="6/8" class="u2" title="Unit 2">6/8</button>'}</div><label class="muted small">Speed <input type="range" min="60" max="140" value="90" data-role="bpm" style="vertical-align:middle;width:110px"> <span data-role="bpmv">90</span></label></div>
    <div class="grid-row" data-role="grid"></div>
    <p class="muted small" style="margin:8px 0">Each box is a semiquaver. Tap boxes to place notes; a note lasts until the next note or the end of the beat. The notation below updates as you go.</p>
    <div class="ex-staff" data-role="staff"></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="play">Play</button><button type="button" class="btn sm ghost" data-role="clear">Clear</button><button type="button" class="btn sm ghost" data-role="random">Fill with a pattern</button></div>`;
  function setup() {
    const m = METRES[time];
    const beatCells = time === '6/8' ? 6 : 4;
    const n = m.beats * beatCells;
    cells = Array(n).fill(0); cells[0] = 1;
    const g = el.querySelector('[data-role=grid]');
    g.style.gridTemplateColumns = `repeat(${n},1fr)`;
    g.innerHTML = cells.map((c, i) => `<button type="button" data-i="${i}" class="${i % beatCells === 0 ? 'beat' : ''}">${i % beatCells === 0 ? (i / beatCells + 1) : ''}</button>`).join('');
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; cells[i] = cells[i] ? 0 : 1; paint(); }));
    paint();
  }
  function events() { return gridToEvents(cells, time === '6/8' ? 6 : 4).map(e => e.rest ? e : { ...e, pitches: [pitch('B', 0, 4)] }); }
  function paint() {
    el.querySelectorAll('[data-role=grid] button').forEach((b, i) => b.classList.toggle('on', !!cells[i]));
    el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', time, bars: [events()], endBar: true }).svg;
  }
  el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { time = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); setup(); }));
  el.querySelector('[data-role=bpm]').addEventListener('input', (e) => { bpm = +e.target.value; el.querySelector('[data-role=bpmv]').textContent = bpm; });
  el.querySelector('[data-role=clear]').addEventListener('click', () => { cells = cells.map(() => 0); paint(); });
  el.querySelector('[data-role=random]').addEventListener('click', () => {
    const beatCells = time === '6/8' ? 6 : 4;
    const pats4 = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 0, 0, 1], [1, 1, 1, 0]];
    const pats6 = [[1, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 0], [1, 1, 1, 1, 1, 1], [1, 1, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0]];
    const pats = beatCells === 6 ? pats6 : pats4;
    cells = cells.map((c, i) => { const beat = Math.floor(i / beatCells); const pat = pats[(beat * 7 + Math.floor(Math.random() * pats.length)) % pats.length]; return pat[i % beatCells]; });
    // keep each beat's pattern consistent: rebuild per beat
    const nb = cells.length / beatCells; const out = [];
    for (let b = 0; b < nb; b++) { const pat = pats[Math.floor(Math.random() * pats.length)]; out.push(...pat); }
    cells = out; paint();
  });
  el.querySelector('[data-role=play]').addEventListener('click', () => {
    if (running) { running.stop(); running = null; return; }
    const m = METRES[time];
    const beatSec = 60 / bpm * (m.beatUnit / 48);
    for (let b = 0; b < m.beats; b++) click(b === 0, b * beatSec);
    const seq = eventsToSequence([events()]);
    const grid = el.querySelectorAll('[data-role=grid] button');
    const evs = el.querySelectorAll('.ev');
    running = playSequence(seq, { bpm, voice: 'sine', onNote: (i, n) => { evs.forEach(x => x.classList.remove('hot')); const e = el.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => { running = null; evs.forEach(x => x.classList.remove('hot')); } });
  });
  setup();
}

// ---------- scale and chord builder (L5, L6, L10) ----------
export function scaleChordBuilder(el, ctx) {
  const mode = ctx.params && ctx.params.mode || 'scales';
  const unit = ctx.unit || 1;
  const majors = unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1;
  const scaleTypes = [['major', 'Major'], ['minor', 'Natural minor'], ['majorPentatonic', 'Major pentatonic'], ['minorPentatonic', 'Minor pentatonic']];
  let tonic = pitch('C', 0, 4), type = 'major', key = 'C', degree = 1;
  const voice = ctx.voice || 'piano';
  const tonics = ['C4', 'D4', 'E4', 'F4', 'G4', 'A3', 'B3', 'Bb3', 'Eb4', 'F#4'].map(T.parsePitch);
  el.innerHTML = mode === 'chords'
    ? `<div class="seg" data-role="keys">${T.MAJOR_KEYS_U2.map(k => `<button type="button" data-k="${k}" class="${k === 'C' ? 'on' : ''}${majors.includes(k) ? '' : ' u2'}">${k}</button>`).join('')}</div>
       <div class="seg" data-role="deg">${T.COURSE_DEGREES.map(d => `<button type="button" data-d="${d}" class="${d === 1 ? 'on' : ''}">${T.ROMAN[d - 1]}</button>`).join('')}</div>`
    : `<div class="seg" data-role="type">${scaleTypes.map(([v, n]) => `<button type="button" data-v="${v}" class="${v === type ? 'on' : ''}">${n}</button>`).join('')}</div>
       <div class="seg" data-role="tonic">${tonics.map(p => `<button type="button" data-p="${pitchName(p, { octave: true })}" class="${pitchName(p) === 'C' ? 'on' : ''}">${pitchName(p)}</button>`).join('')}</div>`;
  el.insertAdjacentHTML('beforeend', `<div data-role="kb"></div><div class="pattern" data-role="pat"></div><div class="ex-staff" data-role="staff"></div>
    <div class="row" style="margin-top:10px;align-items:center;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="play">${mode === 'chords' ? 'Play chord' : 'Play scale'}</button>${mode === 'chords' ? '<button type="button" class="btn sm ghost" data-role="broken">Play broken</button>' : ''}<span class="muted small" data-role="info"></span></div>`);
  const kb = keyboard({ from: 57, to: 76, voice });
  el.querySelector('[data-role=kb]').appendChild(kb.el);
  let notes = [];
  function draw() {
    if (mode === 'chords') {
      const t = triad(key, degree); notes = t.notes;
      const ms = notes.map(toMidi);
      kb.update({ from: Math.min(57, ms[0] - 2), to: Math.max(76, ms[2] + 2), highlight: new Set(ms), labels: new Map(notes.map((n, i) => [toMidi(n), ['root', '3rd', '5th'][i]])) });
      el.querySelector('[data-role=pat]').innerHTML = `<span>${interval(notes[0], notes[1]).name}</span><span>${interval(notes[1], notes[2]).name}</span>`;
      el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key, events: [{ pitches: notes, dur: 96 }, ...notes.map(n => ({ pitches: [n], dur: 48 }))], labels: 'names', endBar: false, width: 300 }).svg;
      el.querySelector('[data-role=info]').textContent = `${t.roman} in ${key} major is ${t.name}: a ${t.quality} triad (${interval(notes[0], notes[1]).name} then ${interval(notes[1], notes[2]).name}).`;
    } else {
      notes = T.scale(tonic, type);
      const ms = notes.map(toMidi);
      kb.update({ from: Math.min(...ms) - 1, to: Math.max(...ms) + 1, highlight: new Set(ms), labels: new Map(notes.slice(0, -1).map(n => [toMidi(n), pitchName(n)])) });
      const pat = T.SCALE_PATTERNS[type];
      el.querySelector('[data-role=pat]').innerHTML = pat.map(s => `<span class="${s === 1 ? 's' : ''}">${s === 1 ? 'S' : s === 2 ? 'T' : 'T+S'}</span>`).join('');
      el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', events: notes.map(n => ({ pitches: [n], dur: 48 })), labels: 'names', endBar: false, width: 360 }).svg;
      const typeName = scaleTypes.find(x => x[0] === type)[1].toLowerCase();
      el.querySelector('[data-role=info]').textContent = `${pitchName(tonic)} ${typeName}: ${notes.map(pitchName).join(' ')}.`;
    }
  }
  el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; el.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { degree = +b.dataset.d; el.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); draw(); playChord(notes.map(toMidi), { dur: 1.2, voice }); }));
  el.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { type = b.dataset.v; el.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { tonic = T.parsePitch(b.dataset.p); el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  el.querySelector('[data-role=play]').addEventListener('click', () => {
    const ms = notes.map(toMidi);
    if (mode === 'chords') { playChord(ms, { dur: 1.4, voice }); ms.forEach(m => kb.flash(m, 800)); return; }
    const evs = el.querySelectorAll('.ev');
    playSequence(ms.map(m => ({ midi: m, beats: 1 })), { bpm: 100, voice, onNote: (i) => { kb.flash(ms[i], 500); evs.forEach(x => x.classList.remove('hot')); evs[i] && evs[i].classList.add('hot'); }, onEnd: () => evs.forEach(x => x.classList.remove('hot')) });
  });
  const br = el.querySelector('[data-role=broken]');
  if (br) br.addEventListener('click', () => { const ms = notes.map(toMidi); playSequence([...ms, ms[0] + 12].map(m => ({ midi: m, beats: 0.5 })), { bpm: 100, voice, onNote: (i) => kb.flash(ms[i] ?? ms[0], 300) }); });
  draw();
}

// ---------- progression player (L11) ----------
export function progressionPlayer(el, ctx) {
  const unit = ctx.unit || 1;
  const keys = unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1;
  let key = 'C', pid = 'I-IV-V-I';
  const voice = ctx.voice || 'piano';
  el.innerHTML = `<div class="seg" data-role="keys">${T.MAJOR_KEYS_U2.map(k => `<button type="button" data-k="${k}" class="${k === 'C' ? 'on' : ''}${keys.includes(k) ? '' : ' u2'}">${k}</button>`).join('')}</div>
    <div class="seg" data-role="progs">${PROGRESSIONS.map(p => `<button type="button" data-p="${p.id}" class="${p.id === pid ? 'on' : ''}">${p.label}</button>`).join('')}</div>
    <div class="ex-staff" data-role="staff"></div>
    <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm" data-role="play">Play</button><button type="button" class="btn sm ghost" data-role="bass">Play with bass</button><span class="muted small" data-role="info"></span></div>`;
  let chords = [];
  function draw() {
    const prog = PROGRESSIONS.find(p => p.id === pid);
    chords = T.progressionChords(key, prog);
    el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key, events: chords.map(t => ({ pitches: t.notes, dur: 96, label: t.roman, text: t.name.replace(' major', '').replace(' minor', 'm') })), endBar: false, width: 360 }).svg;
    el.querySelector('[data-role=info]').textContent = `${prog.label} in ${key} major: ${chords.map(t => t.name).join(', ')}.`;
  }
  function play(withBass) {
    const evs = el.querySelectorAll('.ev');
    const seq = chords.map(t => ({ midis: withBass ? [toMidi(t.root) - 12, ...t.notes.map(toMidi)] : t.notes.map(toMidi), beats: 2 }));
    playSequence(seq, { bpm: 84, voice, onNote: (i) => { evs.forEach(x => x.classList.remove('hot')); evs[i] && evs[i].classList.add('hot'); }, onEnd: () => evs.forEach(x => x.classList.remove('hot')) });
  }
  el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; el.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { pid = b.dataset.p; el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); draw(); play(false); }));
  el.querySelector('[data-role=play]').addEventListener('click', () => play(false));
  el.querySelector('[data-role=bass]').addEventListener('click', () => play(true));
  el.querySelector('[data-role=staff]').addEventListener('click', () => play(false));
  draw();
}

// ---------- interval explorer (L7) ----------
export function intervalExplorer(el, ctx) {
  const voice = ctx.voice || 'piano';
  let a = null, b = null;
  el.innerHTML = `<p class="muted small" style="margin:0 0 8px">Tap two keys. The app names the interval between them, counting letter names and semitones. Keys up to one sharp or flat are shown as white and black keys, so any pair works.</p>
    <div data-role="kb"></div><div class="ex-staff" data-role="staff"></div><p class="ex-out" data-role="out">Tap the first note.</p>
    <div class="row" style="gap:8px"><button type="button" class="btn sm ghost" data-role="mel">Play one after the other</button><button type="button" class="btn sm ghost" data-role="har">Play together</button></div>`;
  const kb = keyboard({ from: 60, to: 76, voice, onTap: (m) => { if (a === null || b !== null) { a = m; b = null; kb.update({ highlight: new Set([a]) }); el.querySelector('[data-role=out]').textContent = 'Now tap the second note.'; el.querySelector('[data-role=staff]').innerHTML = ''; } else { b = m; show(); } } });
  el.querySelector('[data-role=kb]').appendChild(kb.el);
  function spell(m) { const pc = m % 12, oct = Math.floor(m / 12) - 1; const names = [['C', 0], ['C', 1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['B', -1], ['B', 0]]; const [s, ac] = names[pc]; return pitch(s, ac, oct); }
  function show() {
    const lo = spell(Math.min(a, b)), hi = spell(Math.max(a, b));
    const iv = interval(lo, hi);
    kb.update({ highlight: new Set([a, b]) });
    el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', events: [{ pitches: [lo], dur: 48 }, { pitches: [hi], dur: 48 }, { pitches: a === b ? [lo] : [lo, hi], dur: 96 }], labels: 'names', endBar: false, width: 260 }).svg;
    el.querySelector('[data-role=out]').textContent = `${pitchName(lo)} to ${pitchName(hi)}: ${iv.name} (${iv.number === 1 ? 'same letter' : iv.number + ' letter names'}, ${iv.semitones} semitone${iv.semitones === 1 ? '' : 's'}).`;
    playSequence([{ midi: Math.min(a, b), beats: 1 }, { midi: Math.max(a, b), beats: 1 }], { bpm: 100, voice });
  }
  el.querySelector('[data-role=mel]').addEventListener('click', () => { if (b !== null) playSequence([{ midi: Math.min(a, b), beats: 1 }, { midi: Math.max(a, b), beats: 1 }], { bpm: 100, voice }); });
  el.querySelector('[data-role=har]').addEventListener('click', () => { if (b !== null) playChord([a, b], { dur: 1.4, voice }); });
}

// ---------- dictation pad (L9): hear a short melody, enter it on a keyboard, check it ----------
export function dictationPad(el, ctx) {
  const unit = ctx.unit || 1;
  const voice = ctx.voice || 'piano';
  let key = 'C', target = [], entered = [], level = 1, lastKey = null;
  el.innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><div class="seg" style="margin:0" data-role="lvl"><button type="button" data-l="1" class="on">Steps only</button><button type="button" data-l="2">Steps and small leaps</button><button type="button" data-l="3">Any leap</button></div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><button type="button" class="btn sm" data-role="new">New melody</button><button type="button" class="btn sm ghost" data-role="hear">Hear it again</button><button type="button" class="btn sm ghost" data-role="tonic">Hear the tonic</button><span class="muted small" data-role="keyname"></span></div>
    <div class="ex-staff" data-role="staff"></div>
    <div data-role="kb"></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="check">Check</button><button type="button" class="btn sm ghost" data-role="undo">Undo</button><button type="button" class="btn sm ghost" data-role="show">Show answer</button></div>
    <p class="ex-out" data-role="out">Tap New melody. It starts on the tonic and has four crotchet beats. Enter the notes on the keyboard in order.</p>`;
  const kb = keyboard({ from: 60, to: 79, voice, onTap: (m) => { if (!target.length || entered.length >= 4) return; entered.push(m); draw(); } });
  el.querySelector('[data-role=kb]').appendChild(kb.el);
  function newMelody() {
    const keys = unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1;
    key = keys[Math.floor(Math.random() * keys.length)];
    const sc = keyScale(key); const ms = sc.map(toMidi);
    const maxLeap = level === 1 ? 1 : level === 2 ? 2 : 4;
    let i = 0; target = [ms[0]];
    for (let k = 1; k < 4; k++) { let j; do { j = i + (Math.floor(Math.random() * (2 * maxLeap + 1)) - maxLeap); } while (j < 0 || j > 7 || j === i && level > 1 && Math.random() < 0.7); i = j; target.push(ms[i]); }
    entered = [];
    el.querySelector('[data-role=keyname]').textContent = `${key} major`;
    kb.update({ highlight: new Set([ms[0]]), labels: new Map([[ms[0], 'tonic']]) });
    draw(); hear();
    el.querySelector('[data-role=out]').textContent = 'Listen, then enter the four notes.';
  }
  function hear() { if (!target.length) return; playSequence(target.map(m => ({ midi: m, beats: 1 })), { bpm: 84, voice }); }
  function draw() {
    const evs = entered.map(m => ({ pitches: [spellIn(m)], dur: 48 }));
    while (evs.length < 4) evs.push({ rest: true, dur: 48 });
    el.querySelector('[data-role=staff]').innerHTML = renderNotation({ key, time: '4/4', bars: [evs], endBar: true, width: 300 }).svg;
  }
  function spellIn(m) { const sc = keyScale(key); for (const n of sc) if (toMidi(n) === m) return n; for (const n of sc) if (toMidi(n) + 12 === m) return { ...n, oct: n.oct + 1 }; const pc = m % 12, oct = Math.floor(m / 12) - 1; const names = [['C', 0], ['C', 1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['B', -1], ['B', 0]]; return pitch(names[pc][0], names[pc][1], oct); }
  el.querySelectorAll('[data-l]').forEach(b => b.addEventListener('click', () => { level = +b.dataset.l; el.querySelectorAll('[data-l]').forEach(x => x.classList.toggle('on', x === b)); }));
  el.querySelector('[data-role=new]').addEventListener('click', newMelody);
  el.querySelector('[data-role=hear]').addEventListener('click', hear);
  el.querySelector('[data-role=tonic]').addEventListener('click', () => { if (target.length) playNote(target[0], { dur: 1, voice }); });
  el.querySelector('[data-role=undo]').addEventListener('click', () => { entered.pop(); draw(); });
  el.querySelector('[data-role=show]').addEventListener('click', () => { entered = target.slice(); draw(); el.querySelector('[data-role=out]').textContent = 'Answer: ' + target.map(m => pitchName(spellIn(m))).join(' ') + '.'; });
  el.querySelector('[data-role=check]').addEventListener('click', () => {
    if (!target.length) return;
    const right = entered.filter((m, i) => m === target[i]).length;
    el.querySelector('[data-role=out]').textContent = right === 4 && entered.length === 4 ? 'All four correct.' : `${right} of 4 correct. ${entered.length < 4 ? 'Enter all four notes. ' : ''}Hear it again and check the notes that are wrong.`;
    const evs = el.querySelectorAll('.ev'); entered.forEach((m, i) => { if (evs[i]) evs[i].classList.toggle('bad', m !== target[i]); });
  });
  draw();
}

export const mounts = { 'staff-explorer': staffExplorer, 'rhythm-grid': rhythmGrid, 'scale-chord-builder': scaleChordBuilder, 'progression-player': progressionPlayer, 'interval-explorer': intervalExplorer, 'dictation-pad': dictationPad };
