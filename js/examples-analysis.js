// examples-analysis.js — generated figures for the Analysis lessons: tone colours, devices, textures, forms and effect.
import { registerExample, notationFigure } from './examples.js';
import { renderNotation } from './notation.js';
import { parseMelody, eventsToSequence, TUNES } from './melody.js';
import { playSequence, playNote, playChord, click, context } from './audio.js';
import * as T from './theory.js';

const { toMidi, pitchName, parsePitch, transposeDiatonic, triad, progressionChords, PROGRESSIONS, evBeats } = T;
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
const MOTIF = 'G4e G4e G4e E4h';   // the four-note idea, short short short long

function hookStaff(wrap, bars, seq, voice, bpm, extra = {}) {
  const r = renderNotation({ key: extra.key || 'C', time: extra.time || '4/4', bars, endBar: true });
  const box = document.createElement('div'); box.className = 'ex-staff'; box.innerHTML = r.svg; return { box, play: () => { const evs = box.querySelectorAll('.ev'); playSequence(seq, { bpm, voice, onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = box.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) }); } };
}

// ---------- one melody on several instrument sounds ----------
registerExample('tone-colours', (wrap, p) => {
  const voices = [['oboe', 'Oboe'], ['flute', 'Flute'], ['clarinet', 'Clarinet'], ['horn', 'French horn'], ['trumpet', 'Trumpet'], ['strings', 'Strings'], ['piano', 'Piano'], ['harp', 'Harp']];
  const bars = parseMelody(p.notes || TUNES.odeToJoy.notes);
  const r = renderNotation({ key: p.key || 'G', time: '4/4', bars, endBar: true });
  wrap.innerHTML = `<div class="ex-staff">${r.svg}</div><div class="seg" data-role="list">${voices.map(([v, n]) => `<button type="button" data-v="${v}">${n}</button>`).join('')}</div><p class="ex-out">${esc(p.caption || 'The same melody on eight generated instrument sounds. Tap each one and listen for what changes: brightness, attack, breathiness, how long the note rings.')}</p>`;
  wrap.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
    wrap.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b));
    const evs = wrap.querySelectorAll('.ev');
    playSequence(eventsToSequence(bars), { bpm: 112, voice: b.dataset.v, onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
  }));
});

// ---------- a motif treated with the development techniques ----------
registerExample('motif-devices', (wrap, p, ctx) => {
  const base = p.motif || MOTIF;
  const motifBars = parseMelody(base);
  const notes = motifBars.flat().filter(e => e.pitches);
  const items = [
    { id: 'original', name: 'Original motif', make: () => parseMelody(base) },
    { id: 'repetition', name: 'Repetition', make: () => parseMelody(base + ' | ' + base) },
    { id: 'sequence', name: 'Sequence', make: () => [0, 1, 2].map(k => notes.map(e => ({ ...e, pitches: [T.pitchFromDiatonic(T.diatonicIndex(e.pitches[0]) - k, 0)] }))) },
    { id: 'augmentation', name: 'Augmentation', make: () => [notes.map(e => ({ ...e, dur: e.dur * 2 }))].map(b => b) },
    { id: 'diminution', name: 'Diminution', make: () => [notes.map(e => ({ ...e, dur: e.dur / 2 })).concat(notes.map(e => ({ ...e, dur: e.dur / 2 })))] },
    { id: 'fragmentation', name: 'Fragmentation', make: () => { const frag = notes.slice(0, 3).map(e => ({ ...e })); return [frag.concat(frag.map(e => ({ ...e }))), frag.map(e => ({ ...e, pitches: [transposeDiatonic(e.pitches[0], 1, 2)] })).concat([{ rest: true, dur: 24 }, { rest: true, dur: 48 }])]; } },
    { id: 'inversion', name: 'Inversion', make: () => { const first = notes[0].pitches[0]; return [notes.map(e => { const d = T.diatonicIndex(e.pitches[0]) - T.diatonicIndex(first); return { ...e, pitches: [T.pitchFromDiatonic(T.diatonicIndex(first) - d, 0)] }; })]; } },
    { id: 'keychange', name: 'Key change', make: () => [notes.map(e => ({ ...e })), notes.map(e => ({ ...e, pitches: [transposeDiatonic(e.pitches[0], 2, 4)] }))] },
  ];
  const expl = { original: 'Short, short, short, long: the idea everything else is made from.', repetition: 'The motif is stated again, unchanged.', sequence: 'The motif is repeated starting on lower notes each time, keeping its shape.', augmentation: 'Every note value is doubled, so the motif is twice as slow.', diminution: 'Every note value is halved, so the motif is twice as fast.', fragmentation: 'Only the first three notes are used, repeated and moved, as a fragment of the whole.', inversion: 'Each rise becomes a fall and each fall a rise: the motif upside down.', keychange: 'The motif is moved into a new key, here a major 3rd higher.' };
  wrap.innerHTML = `<div class="seg" data-role="list">${items.map(it => `<button type="button" data-id="${it.id}">${it.name}</button>`).join('')}</div><div data-role="staff"></div><p class="ex-out" data-role="out"></p>`;
  let cur = items[0];
  const show = () => {
    const bars = cur.make();
    const { box, play } = hookStaff(wrap, bars, eventsToSequence(bars), ctx.voice || 'piano', 100, { key: 'C' });
    const slot = wrap.querySelector('[data-role=staff]'); slot.innerHTML = ''; slot.appendChild(box); box.addEventListener('click', play);
    wrap.querySelector('[data-role=out]').textContent = expl[cur.id] + ' Tap the staff to hear it.';
    wrap.querySelectorAll('[data-id]').forEach(x => x.classList.toggle('on', x.dataset.id === cur.id));
  };
  wrap.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => { cur = items.find(i => i.id === b.dataset.id); show(); }));
  show();
});

// ---------- canon: the same line entering later in a second voice ----------
registerExample('canon', (wrap, p, ctx) => {
  const tune = parseMelody(p.notes || TUNES.frereJacques.notes);
  const seq = eventsToSequence(tune);
  const r = renderNotation({ key: 'C', time: '4/4', bars: tune, endBar: true });
  wrap.innerHTML = `<div class="ex-staff">${r.svg}</div><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn sm ghost" data-role="one">One voice</button><button type="button" class="btn sm" data-role="two">Canon: second voice enters after one bar</button><button type="button" class="btn sm ghost" data-role="three">Three voices</button></div><p class="ex-out">${esc(p.caption || 'Frère Jacques is a round, which is a canon: every voice sings the same tune, each starting one bar after the last.')}</p>`;
  const go = (n) => { const voices = ['oboe', 'clarinet', 'horn']; for (let v = 0; v < n; v++) { const delay = v * 4 * 60 / 100; setTimeout(() => playSequence(seq, { bpm: 100, voice: voices[v] }), delay * 1000); } };
  wrap.querySelector('[data-role=one]').addEventListener('click', () => go(1));
  wrap.querySelector('[data-role=two]').addEventListener('click', () => go(2));
  wrap.querySelector('[data-role=three]').addEventListener('click', () => go(3));
});

// ---------- texture built one layer at a time ----------
registerExample('texture-layers', (wrap, p, ctx) => {
  const key = 'C';
  const chords = progressionChords(key, PROGRESSIONS.find(x => x.id === 'I-IV-V-I'));
  const melody = parseMelody('E4q G4q C5q G4q | F4q A4q C5q A4q | G4q B4q D5q B4q | C5h. rq').flat();
  const counter = parseMelody('C4h E4h | F4h C4h | B3h D4h | E4h. rq').flat();
  const layers = [
    { id: 'melody', name: 'Melody (oboe)', on: true, seq: () => eventsToSequence([melody]), voice: 'oboe' },
    { id: 'chords', name: 'Chords (strings)', on: false, seq: () => chords.map(t => ({ midis: t.notes.map(toMidi), beats: 4, gain: 0.5 })), voice: 'strings' },
    { id: 'bass', name: 'Bass (cello)', on: false, seq: () => chords.flatMap(t => [{ midi: toMidi(t.root) - 24, beats: 2, gain: 0.8 }, { midi: toMidi(t.root) - 24 + 7, beats: 2, gain: 0.6 }]), voice: 'strings' },
    { id: 'counter', name: 'Countermelody (clarinet)', on: false, seq: () => eventsToSequence([counter]), voice: 'clarinet' },
    { id: 'drum', name: 'Rhythm (click)', on: false, seq: null },
  ];
  wrap.innerHTML = `<div class="layers">${layers.map(l => `<label class="layer"><input type="checkbox" data-id="${l.id}" ${l.on ? 'checked' : ''}> ${l.name}</label>`).join('')}</div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play</button><span class="muted small" data-role="out"></span></div><p class="ex-out">${esc(p.caption || 'Tick the layers you want and play. One line alone is monophonic. Melody with chords underneath is melody and accompaniment (homophonic). Two independent melodies together are polyphonic.')}</p>`;
  const describe = () => { const on = layers.filter(l => wrap.querySelector(`[data-id=${l.id}]`).checked).map(l => l.id); let t; if (on.length === 0) t = 'Nothing selected.'; else if (on.length === 1 && on[0] !== 'drum') t = 'One line alone: monophonic.'; else if (on.includes('melody') && on.includes('counter')) t = 'Two independent melodies: polyphonic' + (on.includes('chords') || on.includes('bass') ? ', over an accompaniment.' : '.'); else if (on.includes('melody')) t = 'Melody with accompaniment: homophonic.'; else t = 'Accompaniment only.'; wrap.querySelector('[data-role=out]').textContent = t; };
  wrap.querySelectorAll('input').forEach(i => i.addEventListener('change', describe));
  wrap.querySelector('[data-role=play]').addEventListener('click', () => {
    layers.forEach(l => { if (!wrap.querySelector(`[data-id=${l.id}]`).checked) return; if (l.id === 'drum') { for (let b = 0; b < 16; b++) click(b % 4 === 0, b * 0.6); } else playSequence(l.seq(), { bpm: 100, voice: l.voice }); });
  });
  describe();
});

// ---------- a short piece whose sections light up as they play ----------
registerExample('form-player', (wrap, p, ctx) => {
  const A = 'C4q E4q G4q E4q | F4q D4q G4h';
  const B = 'G4q F4q E4q D4q | E4q F4q G4h';
  const C = 'A4q G4q F4q E4q | D4q E4q F4h';
  const forms = {
    binary: { name: 'Binary (A B)', plan: ['A', 'B'] },
    ternary: { name: 'Ternary (A B A)', plan: ['A', 'B', 'A'] },
    rondo: { name: 'Rondo (A B A C A)', plan: ['A', 'B', 'A', 'C', 'A'] },
    bar: { name: 'Bar form (A A B)', plan: ['A', 'A', 'B'] },
    verse: { name: 'Verse and chorus', plan: ['Verse', 'Chorus', 'Verse', 'Chorus'] },
    variations: { name: 'Theme and variations', plan: ['Theme', 'Var. 1', 'Var. 2'] },
  };
  const sections = { A: parseMelody(A), B: parseMelody(B), C: parseMelody(C), Verse: parseMelody(A), Chorus: parseMelody('G4q G4q E4q E4q | C5q B4q C5h'), Theme: parseMelody(A), 'Var. 1': parseMelody('C4e D4e E4e F4e G4e F4e E4e D4e | F4e E4e D4e C4e G4h'), 'Var. 2': parseMelody('C4q Eb4q G4q Eb4q | F4q D4q G4h') };
  const which = p.form || 'ternary';
  const f = forms[which];
  wrap.innerHTML = `<div class="form-blocks" data-role="blocks">${f.plan.map((s, i) => `<span class="block b-${s.replace(/[^A-Za-z0-9]/g, '')}" data-i="${i}">${s}</span>`).join('')}</div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play ${f.name}</button></div><p class="ex-out">${esc(p.caption || '')}</p>`;
  wrap.querySelector('[data-role=play]').addEventListener('click', () => {
    let t = 0; const blocks = wrap.querySelectorAll('.block');
    f.plan.forEach((s, i) => {
      const seq = eventsToSequence(sections[s]); const len = seq.reduce((a, n) => a + n.beats, 0) * 60 / 104;
      setTimeout(() => { blocks.forEach(b => b.classList.remove('hot')); blocks[i].classList.add('hot'); playSequence(seq, { bpm: 104, voice: ctx.voice || 'piano' }); }, t * 1000);
      t += len;
    });
    setTimeout(() => blocks.forEach(b => b.classList.remove('hot')), t * 1000 + 100);
  });
});

// ---------- 12-bar blues and a riff ----------
registerExample('blues', (wrap, p, ctx) => {
  const key = 'C';
  const degs = [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5];
  const chords = degs.map(d => triad(key, d));
  wrap.innerHTML = `<div class="form-blocks" data-role="blocks">${degs.map((d, i) => `<span class="block" data-i="${i}">${T.ROMAN[d - 1]}</span>`).join('')}</div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play 12-bar blues</button></div><p class="ex-out">${esc(p.caption || 'Twelve bars of three chords in a fixed order: four bars of I, two of IV, two of I, then V, IV, I, V. Each box is one bar.')}</p>`;
  wrap.querySelector('[data-role=play]').addEventListener('click', () => {
    const blocks = wrap.querySelectorAll('.block'); const bpm = 120; const bar = 4 * 60 / bpm;
    chords.forEach((t, i) => {
      setTimeout(() => { blocks.forEach(b => b.classList.remove('hot')); blocks[i].classList.add('hot'); }, i * bar * 1000);
      const root = toMidi(t.root) - 12;
      const bassLine = [root, root + 4, root + 7, root + 9];
      bassLine.forEach((m, k) => playNote(m, { at: i * bar + k * bar / 4, dur: bar / 4 * 0.9, voice: 'strings', gain: 0.8 }));
      [0, 2].forEach(k => playChord(t.notes.map(toMidi), { at: i * bar + k * bar / 4 + bar / 8, dur: bar / 4 * 0.6, voice: 'piano', gain: 0.6 }));
    });
    setTimeout(() => blocks.forEach(b => b.classList.remove('hot')), 12 * bar * 1000);
  });
});

registerExample('riff', (wrap, p, ctx) => {
  const riff = parseMelody(p.notes || 'E3e E3e G3e E3e A3e G3e E3q');
  const r = renderNotation({ key: 'C', time: '4/4', bars: riff, endBar: true });
  wrap.innerHTML = `<div class="ex-staff">${r.svg}</div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play riff four times</button></div><p class="ex-out">${esc(p.caption || 'A riff: a short pattern repeated over and over as the base of a piece. Rock, funk and blues are often riff-based.')}</p>`;
  wrap.querySelector('[data-role=play]').addEventListener('click', () => { const seq = eventsToSequence(riff); const one = seq.reduce((a, n) => a + n.beats, 0); const rep = []; for (let i = 0; i < 4; i++) rep.push(...seq); for (let b = 0; b < 16; b++) click(b % 4 === 0, b * 60 / 110); playSequence(rep, { bpm: 110, voice: 'strings' }); });
});

// ---------- head, solos, head ----------
registerExample('head-solos-head', (wrap, p, ctx) => {
  const head = parseMelody('C4q E4q G4q A4q | G4h E4h | F4q A4q C5q A4q | G4w');
  const solo = () => { const sc = T.keyScale('C'); const pent = [0, 2, 4, 5, 6].map(i => toMidi(sc[i])); const seq = []; let cur = 2; for (let i = 0; i < 16; i++) { cur = Math.max(0, Math.min(4, cur + Math.floor(Math.random() * 3) - 1)); seq.push({ midi: pent[cur] + (i % 7 === 6 ? 12 : 0), beats: i % 5 === 4 ? 1 : 0.5 }); } return seq; };
  const plan = ['Head', 'Solo 1', 'Solo 2', 'Head'];
  wrap.innerHTML = `<div class="form-blocks" data-role="blocks">${plan.map((s, i) => `<span class="block" data-i="${i}">${s}</span>`).join('')}</div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play</button></div><p class="ex-out">${esc(p.caption || 'Jazz form: the tune (the head) is played, each player improvises over its chords, then the head returns. The solos here are made up fresh each time you press play.')}</p>`;
  wrap.querySelector('[data-role=play]').addEventListener('click', () => {
    const bpm = 120; const blocks = wrap.querySelectorAll('.block'); let t = 0;
    const chords = [1, 1, 4, 5].map(d => triad('C', d));
    plan.forEach((s, i) => {
      const seq = s === 'Head' ? eventsToSequence(head) : solo();
      const len = seq.reduce((a, n) => a + n.beats, 0) * 60 / bpm;
      setTimeout(() => { blocks.forEach(b => b.classList.remove('hot')); blocks[i].classList.add('hot'); playSequence(seq, { bpm, voice: s === 'Head' ? 'trumpet' : i === 1 ? 'clarinet' : 'oboe' }); chords.forEach((c, k) => playChord(c.notes.map(toMidi), { at: k * 4 * 60 / bpm, dur: 1.6, voice: 'piano', gain: 0.4 })); }, t * 1000);
      t += len;
    });
    setTimeout(() => blocks.forEach(b => b.classList.remove('hot')), t * 1000 + 100);
  });
});

// ---------- the same melody with settings that change its effect ----------
registerExample('effect-demo', (wrap, p, ctx) => {
  const base = TUNES.twinkle.notes;
  const presets = [
    { name: 'Calm', bpm: 72, voice: 'flute', artic: 'legato', gain: 0.4, oct: 0, mode: 'major' },
    { name: 'Playful', bpm: 140, voice: 'piano', artic: 'staccato', gain: 0.8, oct: 12, mode: 'major' },
    { name: 'Sad', bpm: 66, voice: 'oboe', artic: 'legato', gain: 0.45, oct: 0, mode: 'minor' },
    { name: 'Menacing', bpm: 96, voice: 'strings', artic: 'accent', gain: 1.1, oct: -24, mode: 'minor' },
    { name: 'Grand', bpm: 84, voice: 'trumpet', artic: 'marcato', gain: 1.2, oct: 0, mode: 'major' },
  ];
  wrap.innerHTML = `<div class="seg" data-role="list">${presets.map((pr, i) => `<button type="button" data-i="${i}">${pr.name}</button>`).join('')}</div><p class="ex-out" data-role="out">${esc(p.caption || 'The same tune, Twinkle Twinkle, with its tempo, register, dynamics, articulation, instrument and mode changed. Tap a mood to hear it, and notice which choices did the work.')}</p>`;
  wrap.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
    const pr = presets[+b.dataset.i];
    wrap.querySelectorAll('[data-i]').forEach(x => x.classList.toggle('on', x === b));
    const bars = parseMelody(base);
    const seq = eventsToSequence(bars).map(n => { let ms = n.midis.map(m => m + pr.oct); if (pr.mode === 'minor') ms = ms.map(m => [4, 9, 11].includes((m - 60 + 120) % 12) ? m - 1 : m); return { ...n, midis: ms, artic: pr.artic, gain: pr.gain }; });
    playSequence(seq, { bpm: pr.bpm, voice: pr.voice, legato: pr.artic === 'legato' });
    wrap.querySelector('[data-role=out]').textContent = `${pr.name}: ${pr.bpm} beats a minute, ${pr.voice} sound, ${pr.artic}, ${pr.gain < 0.5 ? 'soft' : pr.gain > 1 ? 'loud' : 'medium'}, ${pr.oct > 0 ? 'high register' : pr.oct < 0 ? 'low register' : 'middle register'}, ${pr.mode} tonality.`;
  }));
});

export const CSS = `
.layers{display:grid;gap:6px}
.layer{display:flex;align-items:center;gap:8px;min-height:40px;border:1px solid var(--rule);border-radius:10px;padding:0 12px;cursor:pointer}
.layer input{width:20px;height:20px;accent-color:var(--anal)}
.form-blocks{display:flex;gap:6px;flex-wrap:wrap}
.form-blocks .block{min-width:44px;min-height:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--rule);border-radius:10px;font-weight:600;background:var(--paper)}
.form-blocks .block.b-A{border-color:var(--anal)}.form-blocks .block.b-B{border-color:var(--creat)}.form-blocks .block.b-C{border-color:var(--perf)}
.form-blocks .block.hot{background:var(--anal);color:#fff;border-color:var(--anal)}
`;

// ---------- exercise generator (P3): scale in thirds, broken triads, rhythm patterns from a key ----------
registerExample('exercise-generator', (wrap, p, ctx) => {
  const keys = T.MAJOR_KEYS_U2.concat(T.MINOR_KEYS);
  let key = 'C', kind = 'thirds';
  const kinds = [['scale', 'Scale, two octaves'], ['thirds', 'Scale in thirds'], ['triads', 'Broken triads on each degree'], ['dotted', 'Scale in dotted rhythm'], ['slurred', 'Scale slurred in pairs'], ['long', 'Long notes on the tonic triad']];
  wrap.innerHTML = `<div class="seg" data-role="keys">${keys.map(k => `<button type="button" data-k="${k}" class="${k === key ? 'on' : ''}">${k}</button>`).join('')}</div><div class="seg" data-role="kinds">${kinds.map(([v, n]) => `<button type="button" data-v="${v}" class="${v === kind ? 'on' : ''}">${n}</button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="play">Play</button><span class="muted small" data-role="out"></span></div>`;
  function make() {
    const sc = T.keyScale(key); const two = sc.slice(0, 7).concat(sc.map(n => ({ ...n, oct: n.oct + 1 })));
    const up = (arr) => arr.concat(arr.slice(0, -1).reverse());
    let events = [], bpm = 92, note = '';
    if (kind === 'scale') { events = up(two).map(n => ({ pitches: [n], dur: 24 })); note = 'Even quavers, up and down. Keep the tone the same in both octaves.'; }
    else if (kind === 'thirds') { for (let i = 0; i < 7; i++) events.push({ pitches: [two[i]], dur: 24 }, { pitches: [two[i + 2]], dur: 24 }); events.push({ pitches: [two[7]], dur: 48 }); for (let i = 7; i > 0; i--) events.push({ pitches: [two[i]], dur: 24 }, { pitches: [two[i - 2 < 0 ? 0 : i - 2]], dur: 24 }); events.push({ pitches: [two[0]], dur: 48 }); note = 'Each note leaps a third and steps back. Good for finger coordination across the break.'; }
    else if (kind === 'triads') { for (let i = 0; i < 7; i++) events.push({ pitches: [two[i]], dur: 24 }, { pitches: [two[i + 2]], dur: 24 }, { pitches: [two[i + 4]], dur: 24 }, { pitches: [two[i + 2]], dur: 24 }); events.push({ pitches: [two[7]], dur: 96 }); note = 'Root, third, fifth, third on every degree. Listen for which triads are major and which minor.'; }
    else if (kind === 'dotted') { up(two).forEach((n, i) => events.push({ pitches: [n], dur: i % 2 === 0 ? 24 : 12, dot: i % 2 === 0 })); note = 'Dotted quaver and semiquaver pairs. Keep the short note light and the pulse steady.'; bpm = 80; }
    else if (kind === 'slurred') { up(two).forEach((n, i) => events.push({ pitches: [n], dur: 24, slur: i % 2 === 0 ? 'start' : 'end' })); note = 'Two notes to a slur: tongue the first, not the second. Keep the air moving through the slur.'; }
    else { const t = T.triad(key, 1); events = [...t.notes.map(n => ({ pitches: [n], dur: 192 })), { pitches: [{ ...t.notes[0], oct: t.notes[0].oct + 1 }], dur: 192 }]; note = 'Four long notes, each as even and in tune as you can make it. Use the tuner and the drone.'; bpm = 60; }
    // split into bars of 4/4
    const bars = [[]]; let pos = 0; events.forEach(ev => { const d = ev.dur * (ev.dot ? 1.5 : 1); if (pos + d > 192) { bars.push([]); pos = 0; } bars[bars.length - 1].push(ev); pos += d; });
    const last = bars[bars.length - 1]; const used = last.reduce((a, e) => a + e.dur * (e.dot ? 1.5 : 1), 0); if (used < 192) T.splitDur(192 - used).forEach(x => last.push({ rest: true, dur: x.dur, dot: x.dot }));
    let html = ''; let offset = 0;
    for (let i = 0; i < bars.length; i += 2) { const slice = bars.slice(i, i + 2); const r = renderNotation({ key, time: '4/4', bars: slice, endBar: i + 2 >= bars.length, width: 420, noTime: i > 0 }); html += `<div class="sys">${r.svg.replace(/data-i="(\d+)"/g, (m, n) => `data-i="${+n + offset}"`)}</div>`; offset += slice.flat().length; }
    wrap.querySelector('[data-role=staff]').innerHTML = html;
    wrap.querySelector('[data-role=out]').textContent = note;
    return { bars, bpm };
  }
  let cur = make();
  wrap.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { key = b.dataset.k; wrap.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); cur = make(); }));
  wrap.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { kind = b.dataset.v; wrap.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); cur = make(); }));
  wrap.querySelector('[data-role=play]').addEventListener('click', () => { const seq = eventsToSequence(cur.bars); const evs = wrap.querySelectorAll('.ev'); playSequence(seq, { bpm: cur.bpm, voice: ctx.voice || 'oboe', onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) }); });
});
