// tools/creating.js — the creating tools: harmoniser, melody and bass writer, effect sandbox, motif developer, structure planner, reflection.
import * as T from '../theory.js';
import * as store from '../store.js';
import { renderNotation } from '../notation.js';
import { keyboard } from '../keyboard.js';
import { playSequence, playNote, playChord, click } from '../audio.js';
import { parseMelody, eventsToSequence, TUNES } from '../melody.js';
import { writeMidi, download, svgToPng } from '../midi.js';

const { toMidi, pitchName, pitch, keyScale, triad, PROGRESSIONS, progressionChords, ROMAN } = T;
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function spellIn(m, key) { const sc = keyScale(key); for (let o = -2; o <= 2; o++) for (const p of sc) if (toMidi(p) + 12 * o === m) return { ...p, oct: p.oct + o }; const names = [['C', 0], ['C', 1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['B', -1], ['B', 0]]; const pc = m % 12; return pitch(names[pc][0], names[pc][1], Math.floor(m / 12) - 1); }

/** Draw bars of notation in systems of `perLine` bars so it reads on a phone. Returns html; events keep a global data-i via offset. */
function systems(bars, { key, time, perLine = 2, chordText = null, width = 420 }) {
  let html = ''; let offset = 0;
  for (let i = 0; i < bars.length; i += perLine) {
    const slice = bars.slice(i, i + perLine).map((bar, k) => bar.map((ev, j) => ({ ...ev, text: j === 0 && chordText ? chordText[i + k] : ev.text })));
    const r = renderNotation({ key, time, bars: slice, endBar: i + perLine >= bars.length, width, noClef: false, noTime: i > 0 });
    // renumber data-i so highlighting works across systems
    const svg = r.svg.replace(/data-i="(\d+)"/g, (m, n) => `data-i="${+n + offset}"`);
    offset += slice.flat().length;
    html += `<div class="ex-staff sys">${svg}</div>`;
  }
  return html;
}

// ---------- melody generator for the harmoniser ----------
// Rules (all distances are in scale steps: 1 = a step, 2 = a third, 3 = a fourth, 4 = a fifth):
//  - strong beats (1 and 3) take the chord note nearest the previous note, or the next nearest when that is
//    within a third, so the line moves rather than repeating;
//  - no leap larger than a fifth;
//  - after a leap larger than a third the line moves back by step the opposite way;
//  - the whole melody stays within about a ninth, in a comfortable oboe range (about D4 to C6);
//  - weak-beat notes step toward the next chord note (passing notes), or are neighbour notes when the chord
//    note repeats;
//  - the melody ends on the tonic, approached by step from degree 2 or degree 7.
// Pitches are handled as indices into a three-octave diatonic pool; `sign` and `Math.abs` give direction and size.
const HARMONY_PLANS = [[1, 4, 5, 1, 1, 4, 5, 1], [1, 1, 4, 4, 1, 1, 5, 1], [1, 5, 1, 4, 1, 4, 5, 1], [1, 4, 1, 5, 1, 4, 5, 1]];   // all end V then I, as the lesson suggests
const OBOE_LOW = 62, OBOE_HIGH = 84;   // D4 to C6
function generateMelody(key) {
  const sc = keyScale(key).slice(0, 7);
  const pool = [-1, 0, 1].flatMap(o => sc.map(p => ({ ...p, oct: p.oct + o })));   // indices 0..20; tonic at 0, 7, 14
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rnd(arr.length)];
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  // choose a ninth-wide window [lo, lo+8] inside the oboe range that holds a tonic with room on both sides of it
  const windows = [];
  for (let lo = 0; lo + 8 < pool.length; lo++) {
    if (toMidi(pool[lo]) < OBOE_LOW || toMidi(pool[lo + 8]) > OBOE_HIGH) continue;
    const tonics = [0, 7, 14].filter(t => t >= lo + 1 && t <= lo + 7);
    if (tonics.length) windows.push({ lo, hi: lo + 8, tonics });
  }
  const win = pick(windows);
  const tonic = pick(win.tonics);
  const chordTones = (deg) => { const t = triad(key, deg); const rel = t.notes.map(n => ((T.diatonicIndex(n) - T.diatonicIndex(sc[0])) % 7 + 7) % 7); const out = []; for (let i = win.lo; i <= win.hi; i++) if (rel.includes(((i % 7) + 7) % 7)) out.push(i); return out; };
  const inWin = (i) => i >= win.lo && i <= win.hi;

  function attempt() {
    const plan = pick(HARMONY_PLANS);
    // slot layout: bars 1 to 7 are either two minims (strong, strong) or four crotchets (strong, weak, strong, weak); bar 8 is the tonic
    const slots = [];
    for (let b = 0; b < 7; b++) {
      const minims = Math.random() < 0.35;
      if (minims) slots.push({ b, strong: true, dur: 96 }, { b, strong: true, dur: 96 });
      else slots.push({ b, strong: true, dur: 48 }, { b, strong: false, dur: 48 }, { b, strong: true, dur: 48 }, { b, strong: false, dur: 48 });
    }
    slots.push({ b: 7, strong: true, dur: 192, final: true });
    const notes = new Array(slots.length).fill(null);
    // 1. strong beats: nearest chord note to the previous strong-beat note
    let prev = null, prevMove = 0;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.strong) continue;
      if (s.final) { notes[i] = tonic; continue; }
      const tones = chordTones(plan[s.b]);
      if (prev === null) { notes[i] = pick(tones.filter(t => Math.abs(t - tonic) <= 4)); prev = notes[i]; continue; }
      const nextIsStrong = i + 1 < slots.length && slots[i + 1].strong;
      const lastBeforeFinal = slots[i + 1] && slots[i + 1].final;
      let cands = tones.filter(t => Math.abs(t - prev) <= (nextIsStrong ? 2 : 4));   // a leap larger than a third needs a weak beat after it to step back
      if (Math.abs(prevMove) > 2) cands = cands.filter(t => { const d = (t - prev) * -sign(prevMove); return d >= 0 && d <= 3; });   // after a leap the weak note steps back the opposite way, so the next chord note must lie on that side
      if (lastBeforeFinal) cands = cands.filter(t => Math.abs(t - tonic) === 1);              // approach the tonic by step from degree 2 or 7
      else if (i + 2 < slots.length && slots[i + 2].final) cands = cands.filter(t => Math.abs(t - tonic) <= 3);   // leave room for a weak-beat note on degree 2 or 7
      if (!cands.length) return null;
      cands.sort((x, y) => Math.abs(x - prev) - Math.abs(y - prev));
      let choice = cands[0];
      if (cands.length > 1 && Math.abs(cands[1] - prev) <= 2 && (choice === prev || Math.random() < 0.5)) choice = cands[1];
      const leaps = cands.filter(t => Math.abs(t - prev) > 2);
      if (leaps.length && Math.abs(prevMove) <= 2 && !lastBeforeFinal && Math.random() < 0.35) choice = pick(leaps);   // an occasional leap of a fourth or fifth, stepped back from on the next note
      notes[i] = choice; prevMove = choice - prev; prev = choice;
    }
    // 2. weak beats: step toward the next chord note
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].strong) continue;
      const a = notes[i - 1], c = notes[i + 1];
      const d = c - a, dir = sign(d), size = Math.abs(d);
      let opts;
      if (size === 0) opts = [a + 1, a - 1].filter(inWin);          // neighbour note
      else if (size === 1) opts = [a, c];                             // repeat, or anticipate the chord note
      else if (size === 2) opts = [a + dir];                          // passing note
      else if (size === 3) opts = [a + dir, a + dir * 2];             // step then third, or third then step
      else opts = [a + dir * 2];                                      // a fifth: third then third
      if (slots[i + 1].final) opts = opts.filter(w => Math.abs(w - tonic) === 1);   // into the last note by step from degree 2 or 7
      if (i >= 2) { const into = a - notes[i - 2]; if (Math.abs(into) > 2) opts = opts.filter(w => w === a - sign(into)); }   // step back after a leap
      if (!opts.length) return null;
      notes[i] = pick(opts);
    }
    // 3. check every rule
    for (let i = 1; i < notes.length; i++) {
      const m = notes[i] - notes[i - 1];
      if (Math.abs(m) > 4 || !inWin(notes[i])) return null;
      if (i >= 2) { const pm = notes[i - 1] - notes[i - 2]; if (Math.abs(pm) > 2 && m !== -sign(pm)) return null; }
    }
    if (Math.abs(notes[notes.length - 2] - tonic) !== 1) return null;
    const bars = Array.from({ length: 8 }, () => []);
    slots.forEach((s, i) => bars[s.b].push({ pitches: [pool[notes[i]]], dur: s.dur }));
    bars.plan = plan;
    return bars;
  }
  for (let n = 0; n < 400; n++) { const r = attempt(); if (r) return r; }
  // fallback (should not happen): a plain chord-tone melody
  const plan = HARMONY_PLANS[0];
  const bars = plan.map((d, b) => b === 7 ? [{ pitches: [pool[tonic]], dur: 192 }] : [{ pitches: [pool[chordTones(d)[0]]], dur: 96 }, { pitches: [pool[chordTones(d)[1] ?? chordTones(d)[0]]], dur: 96 }]);
  bars.plan = plan;
  return bars;
}

// ---------- harmoniser (C1): choose I, IV or V for each bar of an 8-bar melody ----------
export function harmoniser(el, ctx) {
  const unit = ctx.unit || 1;
  const keys = unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1;
  let key = 'C', melody = null, choices = [], plan = [];
  const voice = ctx.voice || 'oboe';
  el.innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><div class="seg" style="margin:0" data-role="keys">${keys.map(k => `<button type="button" data-k="${k}" class="${k === key ? 'on' : ''}">${k}</button>`).join('')}</div><button type="button" class="btn sm ghost" data-role="new">New melody</button></div>
    <div data-role="staff"></div>
    <p class="muted small">Choose a chord for each bar. A chord fits when the notes on beats 1 and 3 belong to it.</p>
    <div class="harm-grid" data-role="grid"></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="play">Play with my chords</button><button type="button" class="btn sm ghost" data-role="melody">Melody only</button><button type="button" class="btn sm ghost" data-role="check">Check</button></div>
    <p class="ex-out" data-role="out"></p>`;
  function makeMelody() {
    melody = generateMelody(key);
    plan = melody.plan;
    choices = Array(8).fill(null);
    draw(); el.querySelector('[data-role=out]').textContent = '';
  }
  function draw() {
    const chordText = choices.map(d => d ? triad(key, d).name.replace(' major', '').replace(' minor', 'm') : '');
    el.querySelector('[data-role=staff]').innerHTML = systems(melody, { key, time: '4/4', perLine: 2, chordText });
    const g = el.querySelector('[data-role=grid]');
    g.innerHTML = melody.map((bar, b) => `<div class="harm-bar"><span class="muted small">Bar ${b + 1}</span><div class="seg" style="margin:0">${[1, 4, 5].map(d => `<button type="button" data-b="${b}" data-d="${d}" class="${choices[b] === d ? 'on' : ''}">${ROMAN[d - 1]}</button>`).join('')}</div></div>`).join('');
    g.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { const b = +btn.dataset.b; choices[b] = +btn.dataset.d; draw(); playChord(triad(key, choices[b]).notes.map(toMidi), { dur: 1, voice: 'piano' }); }));
  }
  function fits(b) { const d = choices[b]; if (!d) return null; const t = triad(key, d); const pcs = t.notes.map(n => toMidi(n) % 12); let pos = 0; return melody[b].every(ev => { const strong = pos % 96 === 0; pos += ev.dur; return !strong || pcs.includes(toMidi(ev.pitches[0]) % 12); }); }
  function play(withChords) {
    const seq = eventsToSequence(melody);
    const evs = el.querySelectorAll('.ev');
    playSequence(seq, { bpm: 96, voice, onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = el.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
    if (withChords) choices.forEach((d, b) => { if (!d) return; const t = triad(key, d); playChord([toMidi(t.root) - 12, ...t.notes.map(toMidi)], { at: b * 4 * 60 / 96, dur: 4 * 60 / 96 * 0.95, voice: 'strings', gain: 0.5 }); });
  }
  el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; el.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); makeMelody(); }));
  el.querySelector('[data-role=new]').addEventListener('click', makeMelody);
  el.querySelector('[data-role=play]').addEventListener('click', () => play(true));
  el.querySelector('[data-role=melody]').addEventListener('click', () => play(false));
  el.querySelector('[data-role=check]').addEventListener('click', () => {
    const res = choices.map((d, b) => fits(b));
    if (res.some(r => r === null)) { el.querySelector('[data-role=out]').textContent = 'Choose a chord for every bar first.'; return; }
    const good = res.filter(Boolean).length;
    const bad = res.map((r, b) => r ? null : b + 1).filter(Boolean);
    el.querySelector('[data-role=out]').textContent = good === 8 ? 'Every chord fits its bar. Play it and listen to whether the ending feels finished (it should end on I).' : `${good} of 8 bars fit. Bar${bad.length > 1 ? 's' : ''} ${bad.join(', ')}: a note on beat 1 or 3 is not in the chord you chose. Try another chord there.`;
  });
  makeMelody();
}

// ---------- melody and bass writer (C2, C3) ----------
export function melodyWriter(el, ctx) {
  const unit = ctx.unit || 1;
  const keys = unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1;
  const voice = ctx.voice || 'oboe';
  const st = store.get();
  const comp = (st.compositions && ctx.params && ctx.params.load && st.compositions.find(c => c.id === ctx.params.load)) || { id: uid(), name: '', key: 'C', time: '4/4', prog: 'I-IV-V-I', bars: 4, bpm: 100, notes: [], bass: 'roots', created: Date.now() };
  if (!comp.time) comp.time = '4/4';
  let dur = 48, cursor = comp.notes.reduce((a, n) => Math.max(a, n.start + n.dur), 0);
  let barLen = comp.time === '3/4' ? 144 : 192;
  const beatsPerBar = () => barLen / 48;
  el.innerHTML = `
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <label class="muted small">Key <select data-role="key">${keys.map(k => `<option value="${k}" ${k === comp.key ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="muted small">Chords <select data-role="prog">${PROGRESSIONS.map(p => `<option value="${p.id}" ${p.id === comp.prog ? 'selected' : ''}>${p.label}</option>`).join('')}</select></label>
      <label class="muted small">Time <select data-role="time"><option value="4/4" ${comp.time === '4/4' ? 'selected' : ''}>4/4</option><option value="3/4" ${comp.time === '3/4' ? 'selected' : ''}>3/4</option></select></label>
      <label class="muted small">Bars <select data-role="bars"><option value="4" ${comp.bars === 4 ? 'selected' : ''}>4</option><option value="8" ${comp.bars === 8 ? 'selected' : ''}>8</option></select></label>
      <label class="muted small">Bass <select data-role="bass"><option value="none" ${comp.bass === 'none' ? 'selected' : ''}>None</option><option value="roots" ${comp.bass === 'roots' ? 'selected' : ''}>Root notes</option><option value="rootfifth" ${comp.bass === 'rootfifth' ? 'selected' : ''}>Root and fifth</option><option value="arpeggio" ${comp.bass === 'arpeggio' ? 'selected' : ''}>Broken chord</option><option value="walking" ${comp.bass === 'walking' ? 'selected' : ''}>Walking</option></select></label>
      <label class="muted small">Tempo <input type="range" min="60" max="140" value="${comp.bpm}" data-role="bpm" style="width:90px;vertical-align:middle"> <span data-role="bpmv">${comp.bpm}</span></label>
      <label class="muted small">Name <input type="text" data-role="name" value="${esc(comp.name)}" placeholder="My piece" style="font:inherit;padding:6px 8px;border:1.5px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink);width:140px"></label>
    </div>
    <div data-role="staff"></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0"><span class="muted small">Note length</span><div class="seg" style="margin:0" data-role="durs"><button type="button" data-dur="192" title="Semibreve"><span class="bv"></span></button><button type="button" data-dur="96" title="Minim"><span class="bv"></span></button><button type="button" data-dur="48" class="on" title="Crotchet"><span class="bv"></span></button><button type="button" data-dur="24" title="Quaver"><span class="bv"></span></button></div><button type="button" class="btn sm ghost" data-role="dot">Dot</button><button type="button" class="btn sm ghost" data-role="rest">Rest</button><button type="button" class="btn sm ghost" data-role="undo">Undo</button></div>
    <div data-role="kb"></div>
    <p class="muted small" data-role="pos" style="margin:6px 0"></p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn sm" data-role="play">Play</button><button type="button" class="btn sm ghost" data-role="hint">Chord notes</button><button type="button" class="btn sm ghost" data-role="save">Save</button><button type="button" class="btn sm ghost" data-role="png">Export image</button><button type="button" class="btn sm ghost" data-role="midi">Export MIDI</button><button type="button" class="btn sm ghost" data-role="clear">Clear</button></div>
    <p class="ex-out" data-role="out"></p>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  let dotted = false, showHint = false;
  const kb = keyboard({ from: 60, to: 81, voice, onTap: (m) => addNote(m) });
  q('kb').appendChild(kb.el);
  function chords() { const prog = PROGRESSIONS.find(p => p.id === comp.prog); const out = []; for (let b = 0; b < comp.bars; b++) out.push(triad(comp.key, prog.degrees[b % prog.degrees.length])); return out; }
  function total() { return comp.bars * barLen; }
  function bars() {
    // turn the flat note list into bars with rests filling the gaps; notes never cross bar lines (split with ties)
    const out = []; const notes = comp.notes.slice().sort((a, b) => a.start - b.start);
    for (let b = 0; b < comp.bars; b++) {
      const bar = []; let pos = b * barLen; const end = pos + barLen;
      notes.filter(n => n.start < end && n.start + n.dur > b * barLen).forEach(n => {
        const s = Math.max(n.start, b * barLen), e = Math.min(n.start + n.dur, end);
        if (s > pos) T.splitDur(s - pos).forEach(x => bar.push({ rest: true, dur: x.dur, dot: x.dot }));
        const parts = T.splitDur(e - s);
        parts.forEach((x, i) => bar.push({ pitches: [spellIn(n.midi, comp.key)], dur: x.dur, dot: x.dot, tie: i < parts.length - 1 || e < n.start + n.dur, id: n.id }));
        pos = e;
      });
      if (pos < end) T.splitDur(end - pos).forEach(x => bar.push({ rest: true, dur: x.dur, dot: x.dot }));
      out.push(bar);
    }
    return out;
  }
  function draw() {
    const cs = chords();
    q('staff').innerHTML = systems(bars(), { key: comp.key, time: comp.time, perLine: 2, chordText: cs.map(t => t.name.replace(' major', '').replace(' minor', 'm')) });
    const bar = Math.floor(cursor / barLen), beat = (cursor % barLen) / 48 + 1;
    q('pos').textContent = cursor >= total() ? 'The piece is full. Undo or clear to change it.' : `Next note goes in bar ${bar + 1}, beat ${beat}${beat % 1 ? '' : ''}. Chord there: ${cs[bar].roman} (${cs[bar].notes.map(pitchName).join(' ')}).`;
    const tones = new Set(cs[Math.min(bar, comp.bars - 1)].notes.map(n => toMidi(n) % 12));
    const hl = new Set(); if (showHint) for (let m = 60; m <= 81; m++) if (tones.has(m % 12)) hl.add(m);
    kb.update({ highlight: hl });
  }
  function addNote(m) {
    if (cursor >= total()) return;
    const d = Math.min(dotted ? dur * 1.5 : dur, total() - cursor);
    comp.notes.push({ id: uid(), start: cursor, dur: d, midi: m }); cursor += d; draw();
  }
  q('durs').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { dur = +b.dataset.dur; q('durs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }));
  q('dot').addEventListener('click', () => { dotted = !dotted; q('dot').classList.toggle('on', dotted); });
  q('rest').addEventListener('click', () => { if (cursor >= total()) return; cursor += Math.min(dotted ? dur * 1.5 : dur, total() - cursor); draw(); });
  q('undo').addEventListener('click', () => { const last = comp.notes.reduce((a, n) => !a || n.start > a.start ? n : a, null); if (last && last.start + last.dur === cursor) { comp.notes = comp.notes.filter(n => n !== last); cursor = last.start; } else cursor = Math.max(0, cursor - dur); draw(); });
  q('clear').addEventListener('click', () => { comp.notes = []; cursor = 0; draw(); });
  q('hint').addEventListener('click', () => { showHint = !showHint; q('hint').classList.toggle('on', showHint); draw(); });
  q('key').addEventListener('change', (e) => { comp.key = e.target.value; draw(); });
  q('prog').addEventListener('change', (e) => { comp.prog = e.target.value; draw(); });
  q('time').addEventListener('change', (e) => { comp.time = e.target.value; barLen = comp.time === '3/4' ? 144 : 192; comp.notes = []; cursor = 0; draw(); });
  q('bars').addEventListener('change', (e) => { comp.bars = +e.target.value; comp.notes = comp.notes.filter(n => n.start < total()); cursor = Math.min(cursor, total()); draw(); });
  q('bass').addEventListener('change', (e) => { comp.bass = e.target.value; });
  q('bpm').addEventListener('input', (e) => { comp.bpm = +e.target.value; q('bpmv').textContent = comp.bpm; });
  function bassNotes() {
    const cs = chords(); const out = [];
    cs.forEach((t, b) => {
      const root = toMidi(t.root) - 24, fifth = root + 7, third = toMidi(t.notes[1]) - 24;
      const s = b * barLen;
      const three = barLen === 144;
      if (comp.bass === 'roots') out.push({ start: s, dur: barLen, midi: root });
      else if (comp.bass === 'rootfifth') { if (three) out.push({ start: s, dur: 48, midi: root }, { start: s + 48, dur: 48, midi: fifth }, { start: s + 96, dur: 48, midi: fifth }); else out.push({ start: s, dur: 96, midi: root }, { start: s + 96, dur: 96, midi: fifth }); }
      else if (comp.bass === 'arpeggio') { out.push({ start: s, dur: 48, midi: root }, { start: s + 48, dur: 48, midi: third }, { start: s + 96, dur: 48, midi: fifth }); if (!three) out.push({ start: s + 144, dur: 48, midi: third }); }
      else if (comp.bass === 'walking') { const next = cs[(b + 1) % cs.length]; const target = toMidi(next.root) - 24; const step = target > root ? 1 : -1; const mid = root + step * 2; const last = Math.abs(target - root) > 2 ? target - step : mid; if (three) out.push({ start: s, dur: 48, midi: root }, { start: s + 48, dur: 48, midi: fifth }, { start: s + 96, dur: 48, midi: last }); else out.push({ start: s, dur: 48, midi: root }, { start: s + 48, dur: 48, midi: third }, { start: s + 96, dur: 48, midi: fifth }, { start: s + 144, dur: 48, midi: last }); }
    });
    return out;
  }
  let running = null;
  function play() {
    if (running) { running.stop(); running = null; return; }
    const bpm = comp.bpm; const spb = 60 / bpm;
    const evs = el.querySelectorAll('.ev');
    const seq = eventsToSequence(bars());
    running = playSequence(seq, { bpm, voice, onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = el.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => { running = null; evs.forEach(e => e.classList.remove('hot')); } });
    chords().forEach((t, b) => playChord(t.notes.map(toMidi), { at: b * beatsPerBar() * spb, dur: beatsPerBar() * spb * 0.95, voice: 'strings', gain: 0.4 }));
    bassNotes().forEach(n => playNote(n.midi, { at: n.start / 48 * spb, dur: n.dur / 48 * spb * 0.9, voice: 'strings', gain: 0.9 }));
  }
  q('play').addEventListener('click', play);
  q('save').addEventListener('click', () => {
    const st2 = store.get(); st2.compositions = st2.compositions || [];
    comp.name = q('name').value.trim() || `${comp.key} major piece ${st2.compositions.length + 1}`; q('name').value = comp.name;
    comp.saved = Date.now();
    if (!st2.compositions.find(c => c.id === comp.id)) st2.compositions.push(comp);
    store.save(); q('out').textContent = `Saved as "${comp.name}". Your saved pieces are listed in lesson C5 and in C7 for reflection.`;
  });
  q('png').addEventListener('click', async () => {
    const cs = chords();
    const r = renderNotation({ key: comp.key, time: comp.time, bars: bars().map((bar, b) => bar.map((ev, j) => ({ ...ev, text: j === 0 ? cs[b].name.replace(' major', '').replace(' minor', 'm') : undefined }))), endBar: true });
    try { await svgToPng(r.svg, `${comp.name || 'upbeat-melody'}.png`); q('out').textContent = 'Image exported.'; } catch (e) { q('out').textContent = 'The image could not be exported in this browser.'; console.error(e); }
  });
  q('midi').addEventListener('click', () => {
    const cs = chords();
    const tracks = [
      { name: 'Melody', program: 68, notes: comp.notes.map(n => ({ start: n.start, dur: n.dur, midi: n.midi, vel: 96 })) },
      { name: 'Chords', program: 48, notes: cs.flatMap((t, b) => t.notes.map(n => ({ start: b * barLen, dur: barLen, midi: toMidi(n), vel: 60 }))) },
      { name: 'Bass', program: 42, notes: bassNotes().map(n => ({ ...n, vel: 90 })) },
    ];
    download(writeMidi(tracks, { bpm: comp.bpm, timeSig: comp.time === '3/4' ? [3, 4] : [4, 4] }), `${comp.name || 'upbeat-melody'}.mid`); q('out').textContent = 'MIDI exported. Open it in MuseScore, Sibelius, GarageBand or any notation program.';
  });
  draw();
}

// ---------- effect sandbox (C6) ----------
export function effectSandbox(el, ctx) {
  const tunes = Object.entries(TUNES).map(([id, t]) => ({ id, ...t }));
  const st = store.get();
  const comps = (st.compositions || []).map(c => ({ id: 'comp:' + c.id, title: c.name + ' (mine)', comp: c }));
  let sel = tunes[0];
  const s = { bpm: 100, oct: 0, gain: 0.75, artic: 'normal', voice: 'piano', acc: 'none', mode: 'major' };
  el.innerHTML = `
    <label class="muted small">Melody <select data-role="tune">${tunes.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}${comps.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
    <div class="sliders">
      <label>Tempo <span data-role="bpmv">100</span><input type="range" min="50" max="180" value="100" data-role="bpm"></label>
      <label>Register <span data-role="octv">middle</span><input type="range" min="-2" max="2" value="0" data-role="oct"></label>
      <label>Dynamics <span data-role="gainv">mf</span><input type="range" min="1" max="6" value="4" data-role="gain"></label>
      <label>Articulation <select data-role="artic"><option value="normal">Plain</option><option value="legato">Legato</option><option value="staccato">Staccato</option><option value="accent">Accented</option><option value="marcato">Marcato</option></select></label>
      <label>Instrument <select data-role="voice"><option value="piano">Piano</option><option value="oboe">Oboe</option><option value="flute">Flute</option><option value="clarinet">Clarinet</option><option value="horn">French horn</option><option value="trumpet">Trumpet</option><option value="strings">Strings</option><option value="harp">Harp</option></select></label>
      <label>Accompaniment <select data-role="acc"><option value="none">None</option><option value="chords">Sustained chords</option><option value="bass">Bass notes</option><option value="drone">Drone</option><option value="pulse">Pulsing chords</option></select></label>
      <label>Tonality <select data-role="mode"><option value="major">Major (as written)</option><option value="minor">Minor</option></select></label>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play</button><button type="button" class="btn sm ghost" data-role="desc">Describe my settings</button></div>
    <p class="ex-out" data-role="out"></p>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  const dyn = ['pp', 'p', 'mp', 'mf', 'f', 'ff']; const lvl = [0.25, 0.4, 0.55, 0.75, 0.95, 1.2];
  q('tune').addEventListener('change', (e) => { const v = e.target.value; sel = v.startsWith('comp:') ? comps.find(c => c.id === v) : tunes.find(t => t.id === v); });
  q('bpm').addEventListener('input', (e) => { s.bpm = +e.target.value; q('bpmv').textContent = s.bpm; });
  q('oct').addEventListener('input', (e) => { s.oct = +e.target.value; q('octv').textContent = ['very low', 'low', 'middle', 'high', 'very high'][s.oct + 2]; });
  q('gain').addEventListener('input', (e) => { s.gain = lvl[+e.target.value - 1]; q('gainv').textContent = dyn[+e.target.value - 1]; });
  ['artic', 'voice', 'acc', 'mode'].forEach(k => q(k).addEventListener('change', (e) => { s[k] = e.target.value; }));
  function material() {
    if (sel.comp) { const c = sel.comp; const notes = c.notes.slice().sort((a, b) => a.start - b.start); const seq = []; let pos = 0; notes.forEach(n => { if (n.start > pos) seq.push({ rest: true, beats: (n.start - pos) / 48 }); seq.push({ midis: [n.midi], beats: n.dur / 48 }); pos = n.start + n.dur; }); const prog = PROGRESSIONS.find(p => p.id === c.prog); const chords = []; for (let b = 0; b < c.bars; b++) chords.push(triad(c.key, prog.degrees[b % prog.degrees.length])); return { seq, key: c.key, chords, barBeats: c.time === '3/4' ? 3 : 4 }; }
    const bars = parseMelody(sel.notes); const seq = eventsToSequence(bars); const key = sel.key; const m = T.METRES[sel.time]; const chords = bars.map((bar, b) => triad(key, [1, 4, 5, 1, 1, 4, 5, 1][b % 8])); return { seq, key, chords, barBeats: m.beats * (m.beatUnit / 48) };
  }
  function play() {
    const { seq, key, chords, barBeats } = material();
    const tonic = toMidi(keyScale(key)[0]) % 12;
    const minorise = (m) => { if (s.mode !== 'minor') return m; const d = (m - tonic + 120) % 12; return [4, 9, 11].includes(d) ? m - 1 : m; };
    const spb = 60 / s.bpm;
    const out = seq.map(n => n.rest ? n : { ...n, midis: n.midis.map(m => minorise(m + 12 * s.oct)), artic: s.artic === 'normal' ? undefined : s.artic, gain: s.gain });
    playSequence(out, { bpm: s.bpm, voice: s.voice, legato: s.artic === 'legato' });
    const chordNotes = (t) => t.notes.map(n => minorise(toMidi(n) - 12));
    chords.forEach((t, b) => {
      const at = b * barBeats * spb;
      if (s.acc === 'chords') playChord(chordNotes(t), { at, dur: barBeats * spb * 0.95, voice: 'strings', gain: s.gain * 0.5 });
      if (s.acc === 'bass') playNote(toMidi(t.root) - 24, { at, dur: barBeats * spb * 0.9, voice: 'strings', gain: s.gain });
      if (s.acc === 'pulse') for (let k = 0; k < barBeats; k++) playChord(chordNotes(t), { at: at + k * spb, dur: spb * 0.5, voice: 'piano', gain: s.gain * 0.5 });
    });
    if (s.acc === 'drone') { const total = chords.length * barBeats * spb; playNote(tonic + 36, { dur: total, voice: 'organ', gain: s.gain * 0.6 }); playNote(tonic + 43, { dur: total, voice: 'organ', gain: s.gain * 0.4 }); }
  }
  q('play').addEventListener('click', play);
  q('desc').addEventListener('click', () => {
    const d = dyn[lvl.indexOf(s.gain)];
    q('out').textContent = `Tempo ${s.bpm} beats a minute (${s.bpm < 76 ? 'slow' : s.bpm < 120 ? 'moderate' : 'fast'}); ${['very low', 'low', 'middle', 'high', 'very high'][s.oct + 2]} register; ${d}; ${s.artic} articulation; ${s.voice} sound; ${s.acc === 'none' ? 'no accompaniment' : s.acc + ' accompaniment'}; ${s.mode} tonality. Use this list when you write up the effect you were going for and which choices created it.`;
  });
}

// ---------- motif developer (C4) ----------
export function motifDeveloper(el, ctx) {
  const voice = ctx.voice || 'piano';
  let motif = [];           // { midi, dur }
  let phrase = [];          // list of { name, notes }
  let dur = 24;
  el.innerHTML = `<p class="muted small" style="margin:0 0 6px">1. Tap three to five notes to make a motif. 2. Apply devices to it to build a phrase. 3. Play the phrase.</p>
    <div class="row" style="gap:6px;align-items:center;flex-wrap:wrap"><span class="muted small">Length</span><div class="seg" style="margin:0" data-role="durs"><button type="button" data-dur="48" title="Crotchet"><span class="bv"></span></button><button type="button" data-dur="24" class="on" title="Quaver"><span class="bv"></span></button><button type="button" data-dur="96" title="Minim"><span class="bv"></span></button></div><button type="button" class="btn sm ghost" data-role="undo">Undo</button><button type="button" class="btn sm ghost" data-role="clear">Clear motif</button></div>
    <div data-role="kb"></div>
    <div class="ex-staff" data-role="motif"></div>
    <div class="seg" data-role="devs">${['Repeat', 'Sequence up', 'Sequence down', 'Augmentation', 'Diminution', 'Inversion', 'Fragment', 'Contrast'].map(d => `<button type="button" data-dev="${d}">${d}</button>`).join('')}</div>
    <div class="ex-staff" data-role="phrase"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-role="play">Play phrase</button><button type="button" class="btn sm ghost" data-role="undop">Remove last</button><button type="button" class="btn sm ghost" data-role="clearp">Clear phrase</button></div>
    <p class="ex-out" data-role="out"></p>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  const kb = keyboard({ from: 60, to: 79, voice, onTap: (m) => { if (motif.length >= 6) return; motif.push({ midi: m, dur }); draw(); } });
  q('kb').appendChild(kb.el);
  const toBars = (notes) => { const bars = [[]]; let pos = 0; notes.forEach(n => { if (pos + n.dur > 192) { bars.push([]); pos = 0; } bars[bars.length - 1].push({ pitches: [spellIn(n.midi, 'C')], dur: n.dur }); pos += n.dur; }); return bars; };
  function draw() {
    q('motif').innerHTML = motif.length ? renderNotation({ key: 'C', events: motif.map(n => ({ pitches: [spellIn(n.midi, 'C')], dur: n.dur })), endBar: false, width: 300 }).svg : '<p class="muted small" style="margin:6px">Your motif appears here.</p>';
    const all = phrase.flatMap(p => p.notes);
    q('phrase').innerHTML = all.length ? systems(toBars(all), { key: 'C', time: '4/4', perLine: 2 }) + `<p class="muted small" style="margin:4px 0 0">${phrase.map(p => p.name).join(' → ')}</p>` : '<p class="muted small" style="margin:6px">Your phrase appears here. Apply a device to add to it.</p>';
  }
  const dev = (name) => {
    if (!motif.length) { q('out').textContent = 'Make a motif first.'; return; }
    let notes;
    if (name === 'Repeat') notes = motif.map(n => ({ ...n }));
    else if (name === 'Sequence up') notes = motif.map(n => ({ ...n, midi: n.midi + 2 }));
    else if (name === 'Sequence down') notes = motif.map(n => ({ ...n, midi: n.midi - 2 }));
    else if (name === 'Augmentation') notes = motif.map(n => ({ ...n, dur: Math.min(192, n.dur * 2) }));
    else if (name === 'Diminution') notes = motif.map(n => ({ ...n, dur: Math.max(12, n.dur / 2) }));
    else if (name === 'Inversion') notes = motif.map(n => ({ ...n, midi: 2 * motif[0].midi - n.midi }));
    else if (name === 'Fragment') notes = motif.slice(0, Math.max(2, Math.ceil(motif.length / 2))).map(n => ({ ...n }));
    else notes = motif.map((n, i) => ({ midi: 67 + [0, 5, 4, 2, 0, 7][i % 6] - (n.midi % 2), dur: n.dur === 24 ? 48 : 24 }));
    phrase.push({ name, notes }); draw();
    playSequence(notes.map(n => ({ midi: n.midi, beats: n.dur / 48 })), { bpm: 100, voice });
  };
  q('devs').querySelectorAll('button').forEach(b => b.addEventListener('click', () => dev(b.dataset.dev)));
  q('durs').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { dur = +b.dataset.dur; q('durs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }));
  q('undo').addEventListener('click', () => { motif.pop(); draw(); });
  q('clear').addEventListener('click', () => { motif = []; draw(); });
  q('undop').addEventListener('click', () => { phrase.pop(); draw(); });
  q('clearp').addEventListener('click', () => { phrase = []; draw(); });
  q('play').addEventListener('click', () => { const all = phrase.flatMap(p => p.notes); if (!all.length) return; const evs = el.querySelectorAll('[data-role=phrase] .ev'); playSequence(all.map(n => ({ midi: n.midi, beats: n.dur / 48 })), { bpm: 100, voice, onNote: (i) => { evs.forEach(e => e.classList.remove('hot')); evs[i] && evs[i].classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) }); });
  draw();
}

// ---------- structure planner (C5): arrange saved pieces into a form ----------
export function structurePlanner(el, ctx) {
  const st = store.get(); const comps = st.compositions || [];
  const forms = { binary: ['A', 'B'], ternary: ['A', 'B', 'A'], rondo: ['A', 'B', 'A', 'C', 'A'], bar: ['A', 'A', 'B'], verse: ['Verse', 'Chorus', 'Verse', 'Chorus'] };
  let form = 'ternary'; const assign = {};
  el.innerHTML = `<p class="muted small" style="margin:0 0 8px">Save two or three short pieces in the melody writer (C2), then give each a section letter here and play the whole plan.</p>
    <div class="seg" data-role="forms">${Object.keys(forms).map(f => `<button type="button" data-f="${f}" class="${f === form ? 'on' : ''}">${f === 'bar' ? 'Bar form' : f === 'verse' ? 'Verse and chorus' : f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
    <div data-role="plan"></div>
    <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play the plan</button></div><p class="ex-out" data-role="out"></p>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  function draw() {
    const letters = [...new Set(forms[form])];
    q('plan').innerHTML = `<div class="form-blocks">${forms[form].map((s, i) => `<span class="block" data-i="${i}">${s}</span>`).join('')}</div>` + (comps.length ? letters.map(l => `<label class="muted small" style="display:block;margin-top:6px">Section ${l}: <select data-l="${l}"><option value="">choose a saved piece</option>${comps.map(c => `<option value="${c.id}" ${assign[l] === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`).join('') : '<p class="muted small">No saved pieces yet. Make one in the melody writer and tap Save.</p>');
    q('plan').querySelectorAll('select').forEach(s => s.addEventListener('change', (e) => { assign[s.dataset.l] = e.target.value; }));
  }
  q('forms').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { form = b.dataset.f; q('forms').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  q('play').addEventListener('click', () => {
    const plan = forms[form]; if (!plan.every(l => assign[l])) { q('out').textContent = 'Choose a piece for every section first.'; return; }
    let t = 0; const blocks = q('plan').querySelectorAll('.block');
    plan.forEach((l, i) => {
      const c = comps.find(x => x.id === assign[l]); const spb = 60 / c.bpm; const prog = PROGRESSIONS.find(p => p.id === c.prog); const bb = c.time === '3/4' ? 3 : 4;
      const len = c.bars * bb * spb;
      setTimeout(() => { blocks.forEach(b => b.classList.remove('hot')); blocks[i].classList.add('hot');
        c.notes.forEach(n => playNote(n.midi, { at: n.start / 48 * spb, dur: n.dur / 48 * spb * 0.95, voice: ctx.voice || 'oboe' }));
        for (let b = 0; b < c.bars; b++) { const tr = triad(c.key, prog.degrees[b % prog.degrees.length]); playChord([toMidi(tr.root) - 12, ...tr.notes.map(toMidi)], { at: b * bb * spb, dur: bb * spb * 0.95, voice: 'strings', gain: 0.4 }); }
      }, t * 1000);
      t += len;
    });
    setTimeout(() => blocks.forEach(b => b.classList.remove('hot')), t * 1000 + 100);
  });
  draw();
}

// ---------- reflection (C7): document the creative process for a saved piece ----------
export function reflection(el, ctx) {
  const st = store.get(); const comps = st.compositions || [];
  const Q = [
    { id: 'intent', q: 'What did I set out to make, and for what effect or organisation?' },
    { id: 'material', q: 'What was my starting idea (motif, chord pattern, rhythm)?' },
    { id: 'elements', q: 'Which elements did I shape, and how? (tempo, register, dynamics, articulation, tone colour, texture)' },
    { id: 'devices', q: 'Which compositional devices did I use, and where?' },
    { id: 'changes', q: 'What did I change along the way, and why?' },
    { id: 'result', q: 'Does it do what I intended? What would I change next time?' },
  ];
  el.innerHTML = comps.length ? `<label class="muted small">Piece <select data-role="pick">${comps.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><div data-role="form"></div>` : '<p class="muted small">Save a piece in the melody writer first; its reflection form appears here.</p>';
  if (!comps.length) return;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  let cur = comps[0];
  function draw() {
    cur.reflection = cur.reflection || {};
    q('form').innerHTML = `<form class="work-form">${Q.map(x => `<label>${esc(x.q)}<textarea rows="2" data-q="${x.id}">${esc(cur.reflection[x.id] || '')}</textarea></label>`).join('')}<div class="row" style="gap:8px"><button type="submit" class="btn sm">Save reflection</button><button type="button" class="btn sm ghost" data-role="copy">Copy as text</button></div><p class="muted small" data-role="msg"></p></form>`;
    q('form').querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); q('form').querySelectorAll('textarea').forEach(t => { cur.reflection[t.dataset.q] = t.value; }); store.save(); q('msg').textContent = 'Saved with the piece.'; });
    q('copy').addEventListener('click', async () => { const text = `${cur.name}\n` + Q.map(x => `${x.q}\n${(cur.reflection[x.id] || '').trim()}\n`).join('\n'); try { await navigator.clipboard.writeText(text); q('msg').textContent = 'Copied. Paste it into your folio document.'; } catch (e) { q('msg').textContent = text; } });
  }
  q('pick').addEventListener('change', (e) => { cur = comps.find(c => c.id === e.target.value); draw(); });
  draw();
}

export const mounts = { harmoniser, 'melody-writer': melodyWriter, 'effect-sandbox': effectSandbox, 'motif-developer': motifDeveloper, 'structure-planner': structurePlanner, reflection };

export const CSS = `
.sys{margin-bottom:4px}
.bv{font-family:"Bravura";font-size:22px;line-height:1;display:inline-block;transform:translateY(4px)}
.harm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.harm-bar{display:flex;flex-direction:column;gap:4px;border:1px solid var(--rule);border-radius:10px;padding:8px}
.harm-bar .seg button{min-width:40px;padding:0 8px}
.sliders{display:grid;gap:8px;margin-top:8px}
.sliders label{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;font-size:15px}
.sliders label input[type=range]{grid-column:1/-1;width:100%}
.sliders label select{justify-self:end}
.sliders label span{color:var(--ink-2);font-size:14px;font-variant-numeric:tabular-nums}
.tool .seg button.on,.tool .btn.on{background:var(--accent,var(--creat));border-color:var(--accent,var(--creat));color:#fff}
`;
export const __generateMelody = generateMelody;   // exported for tools/test-theory.mjs
