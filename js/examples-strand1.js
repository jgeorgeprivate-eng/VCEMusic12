// examples-strand1.js — figures for lessons L1 to L13 beyond the scale ones in examples.js.
import { registerExample, notationFigure } from './examples.js';
import { renderNotation } from './notation.js';
import { parseMelody, eventsToSequence, TUNES } from './melody.js';
import { keyboard } from './keyboard.js';
import { playSequence, playNote, playChord, click } from './audio.js';
import * as T from './theory.js';

const { toMidi, pitchName, pitch, parsePitch, DUR, keyScale, KEYS, interval, triad, PROGRESSIONS, METRES, GROUPINGS_U1, GROUPINGS_68, TEMPO_TERMS, DYNAMICS, ARTICULATIONS, evBeats, contour, scale } = T;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// ---------- melody from text ----------
registerExample('melody', (wrap, p, ctx) => {
  const src = p.tune ? TUNES[p.tune] : null;
  const notes = src ? src.notes : p.notes;
  const key = p.key || (src && src.key) || 'C';
  const time = p.time || (src && src.time) || null;
  const bpm = +(p.bpm || (src && src.bpm) || 100);
  const bars = parseMelody(notes);
  const spec = { key, time, bars, labels: p.labels || null, contour: !!p.contour, tempoText: p.tempo || null, endBar: p.endbar !== 'no', aria: p.caption || (src && src.title) || 'Melody' };
  const r = renderNotation(spec);
  const seq = eventsToSequence(bars, { artic: p.artic });
  if (p.transpose) seq.forEach(n => { if (n.midis) n.midis = n.midis.map(m => m + +p.transpose); });
  notationFigure(wrap, r, seq, { caption: p.caption || (src && src.title) || '', voice: p.voice || ctx.voice || 'piano', bpm });
  if (p.contour) {
    const c = contour(bars.flat().filter(e => e.pitches).map(e => e.pitches[0]));
    wrap.querySelector('.cap span').textContent += ` Contour: ${c}.`;
  }
});

// ---------- rhythm on one line ----------
registerExample('rhythm', (wrap, p, ctx) => {
  const bars = parseMelody(p.notes.split(/\s+/).map(t => /^[wheqs]\.?[~'>^\-]*$/.test(t) ? 'B4' + t : t).join(' '));   // bare values become B4
  const r = renderNotation({ key: 'C', time: p.time || '4/4', bars, endBar: true, aria: p.caption || 'Rhythm' });
  const seq = eventsToSequence(bars);
  const metre = METRES[p.time || '4/4'];
  const wrapPlay = notationFigure(wrap, r, seq, { caption: p.caption || '', voice: 'sine', bpm: +(p.bpm || 90) });
  if (p.count) {   // add a counting line under the staff
    const cnt = document.createElement('div'); cnt.className = 'count-line';
    cnt.textContent = 'Count: ' + Array.from({ length: metre.beats }, (_, i) => i + 1).join(' ');
    wrap.appendChild(cnt);
  }
});

// ---------- note values table ----------
registerExample('note-values', (wrap, p) => {
  const rows = [
    { name: 'Semibreve', beats: 4, note: 'B4w', rest: 'rw' },
    { name: 'Minim', beats: 2, note: 'B4h', rest: 'rh' },
    { name: 'Crotchet', beats: 1, note: 'B4q', rest: 'rq' },
    { name: 'Quaver', beats: 0.5, note: 'B4e', rest: 're' },
    { name: 'Semiquaver', beats: 0.25, note: 'B4s', rest: 'rs' },
  ];
  wrap.innerHTML = `<table class="vals"><thead><tr><th>Name</th><th>Note</th><th>Rest</th><th>Beats in 4/4</th></tr></thead><tbody>${rows.map((r, i) => `<tr data-i="${i}"><td>${r.name}</td><td>${renderNotation({ key: 'C', events: parseMelody(r.note)[0], noClef: true, endBar: false, width: 90 }).svg}</td><td>${renderNotation({ key: 'C', events: parseMelody(r.rest)[0], noClef: true, endBar: false, width: 90 }).svg}</td><td>${r.beats}</td></tr>`).join('')}</tbody></table><p class="ex-out">Tap a row to hear the note held for its full length, with a click on each beat.</p>`;
  wrap.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => {
    const r = rows[+tr.dataset.i];
    const beats = Math.max(1, Math.ceil(r.beats));
    for (let b = 0; b < beats; b++) click(b === 0, b * 0.6);
    playNote(71, { dur: r.beats * 0.6, voice: 'oboe' });
    wrap.querySelectorAll('tr').forEach(x => x.classList.remove('hot')); tr.classList.add('hot'); setTimeout(() => tr.classList.remove('hot'), beats * 600);
  }));
});

// ---------- the rhythmic groupings, each one beat ----------
registerExample('groupings', (wrap, p, ctx) => {
  const list = p.set === '68' ? GROUPINGS_68 : GROUPINGS_U1.filter(g => g.beats <= 1.5);
  const beatUnit = p.set === '68' ? 72 : 48;
  wrap.innerHTML = `<div class="grp-grid">${list.map((g, i) => {
    const dotted = { 144: 96, 72: 48, 36: 24 };
    const evs = g.notes.map(d => ({ pitches: [pitch('B', 0, 4)], dur: dotted[d] || d, dot: !!dotted[d], ...(g.tuplet ? { tuplet: g.tuplet } : {}) }));
    const r = renderNotation({ key: 'C', time: p.set === '68' ? '6/8' : '4/4', noTime: true, bars: [evs], noClef: true, endBar: false, width: 150 });
    return `<button type="button" class="grp" data-i="${i}">${r.svg}<span>${g.name}</span></button>`;
  }).join('')}</div><p class="ex-out">Tap a grouping to hear it against a steady beat.</p>`;
  wrap.querySelectorAll('.grp').forEach(b => b.addEventListener('click', () => {
    const g = list[+b.dataset.i];
    const bpm = 84;
    const beats = g.beats;
    const nBeats = Math.ceil(beats * 2);
    for (let k = 0; k < nBeats; k++) click(k === 0, k * 60 / bpm * (beatUnit / 48));
    let t = 0;
    g.notes.forEach(d => { playNote(71, { at: t, dur: d / 48 * 60 / bpm * 0.9, voice: 'oboe' }); t += d / 48 * 60 / bpm; });
  }));
});

// ---------- metre: bars with accented first beats ----------
registerExample('metre', (wrap, p, ctx) => {
  const time = p.time || '4/4';
  const m = METRES[time];
  const bars = parseMelody(p.notes || (time === '3/4' ? 'B4q> B4q B4q | B4q> B4q B4q' : time === '6/8' ? 'B4e> B4e B4e B4e> B4e B4e | B4e> B4e B4e B4e> B4e B4e' : 'B4q> B4q B4q B4q | B4q> B4q B4q B4q'));
  const r = renderNotation({ key: 'C', time, bars, endBar: true });
  const seq = eventsToSequence(bars);
  notationFigure(wrap, r, seq, { caption: p.caption || `${time}: the first beat of each bar is strongest.`, voice: 'sine', bpm: +(p.bpm || 96) });
});

// ---------- compare two scales on one tonic or relative keys ----------
registerExample('compare-scales', (wrap, p) => {
  const a = keyScale(p.a || 'C'), b = keyScale(p.b || 'Am');
  const la = p.la || T.keyLabel(p.a || 'C'), lb = p.lb || T.keyLabel(p.b || 'Am');
  const rA = renderNotation({ key: p.keysig ? (p.a || 'C') : 'C', events: a.map(n => ({ pitches: [n], dur: 48 })), labels: 'names', endBar: false });
  const rB = renderNotation({ key: p.keysig ? (p.b || 'Am') : 'C', events: b.map(n => ({ pitches: [n], dur: 48 })), labels: 'names', endBar: false });
  wrap.innerHTML = `<div class="cmp"><div class="cmp-row" data-which="a"><div class="eyebrow">${esc(la)}</div><div class="ex-staff">${rA.svg}</div></div><div class="cmp-row" data-which="b"><div class="eyebrow">${esc(lb)}</div><div class="ex-staff">${rB.svg}</div></div></div><figcaption class="cap"><span>${esc(p.caption || 'Tap either scale to hear it.')}</span></figcaption>`;
  const hook = (row, sc) => row.querySelector('.ex-staff').addEventListener('click', () => {
    const evs = row.querySelectorAll('.ev');
    playSequence(sc.map(n => ({ midi: toMidi(n), beats: 1 })), { bpm: 100, voice: 'piano', onNote: (i) => { evs.forEach(e => e.classList.remove('hot')); evs[i].classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
  });
  hook(wrap.querySelector('[data-which=a]'), a); hook(wrap.querySelector('[data-which=b]'), b);
});

// ---------- pentatonic scale shown as a subset of its major scale ----------
registerExample('pentatonic', (wrap, p) => {
  const type = p.type || 'majorPentatonic';
  const tonic = parsePitch(p.tonic || (type === 'majorPentatonic' ? 'C4' : 'A3'));
  const sc = scale(tonic, type);
  const r = renderNotation({ key: 'C', events: sc.map((n, i) => ({ pitches: [n], dur: 48 })), labels: 'names', endBar: false });
  const seq = sc.map(n => ({ midi: toMidi(n), beats: 1 }));
  notationFigure(wrap, r, seq, { caption: p.caption || `${pitchName(tonic)} ${type === 'majorPentatonic' ? 'major' : 'minor'} pentatonic`, voice: p.voice || 'piano', bpm: 100 });
});

// ---------- intervals from a tonic ----------
registerExample('intervals', (wrap, p) => {
  const key = p.key || 'C';
  const sc = keyScale(key);
  const items = sc.slice(1).map(n => ({ lo: sc[0], hi: n, iv: interval(sc[0], n) }));
  wrap.innerHTML = `<div class="seg" data-role="list">${items.map((it, i) => `<button type="button" data-i="${i}">${it.iv.name}</button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm ghost" data-role="mel">Play one after the other</button><button type="button" class="btn sm ghost" data-role="har">Play together</button></div><p class="ex-out" data-role="out">Tap an interval to see it.</p>`;
  let cur = 0;
  const show = () => {
    const it = items[cur];
    wrap.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', events: [{ pitches: [it.lo], dur: 48 }, { pitches: [it.hi], dur: 48 }, { pitches: [it.lo, it.hi], dur: 96 }], labels: 'names', endBar: false, width: 300 }).svg;
    wrap.querySelector('[data-role=out]').textContent = `${pitchName(it.lo)} to ${pitchName(it.hi)}: ${it.iv.name}. ${it.iv.number === 8 ? 'Eight' : ['', '', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][it.iv.number]} letter names, ${it.iv.semitones} semitones.`;
    wrap.querySelectorAll('[data-role=list] button').forEach((b, i) => b.classList.toggle('on', i === cur));
  };
  wrap.querySelectorAll('[data-role=list] button').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; show(); playSequence([{ midi: toMidi(items[cur].lo), beats: 1 }, { midi: toMidi(items[cur].hi), beats: 1 }], { bpm: 100, voice: 'piano' }); }));
  wrap.querySelector('[data-role=mel]').addEventListener('click', () => playSequence([{ midi: toMidi(items[cur].lo), beats: 1 }, { midi: toMidi(items[cur].hi), beats: 1 }], { bpm: 100, voice: 'piano' }));
  wrap.querySelector('[data-role=har]').addEventListener('click', () => playChord([toMidi(items[cur].lo), toMidi(items[cur].hi)], { dur: 1.4, voice: 'piano' }));
  show();
});

// ---------- one triad ----------
registerExample('triad', (wrap, p) => {
  const key = p.key || 'C', deg = +(p.degree || 1);
  const t = triad(key, deg);
  const r = renderNotation({ key, events: [{ pitches: t.notes, dur: 96 }, ...t.notes.map(n => ({ pitches: [n], dur: 48 }))], labels: 'names', endBar: false, width: 280 });
  const seq = [{ midis: t.notes.map(toMidi), beats: 2 }, ...t.notes.map(n => ({ midi: toMidi(n), beats: 1 }))];
  notationFigure(wrap, r, seq, { caption: p.caption || `${t.roman} in ${key} major: ${t.name} (${t.notes.map(pitchName).join(' ')})`, voice: 'piano', bpm: 100 });
});

// ---------- all five course triads in a key ----------
registerExample('triads', (wrap, p) => {
  const key = p.key || 'C';
  const ts = T.COURSE_DEGREES.map(d => triad(key, d));
  const r = renderNotation({ key, events: ts.map(t => ({ pitches: t.notes, dur: 48, label: t.roman })), endBar: false, width: 360 });
  const seq = ts.map(t => ({ midis: t.notes.map(toMidi), beats: 1 }));
  notationFigure(wrap, r, seq, { caption: p.caption || `The triads on I, ii, IV, V and vi in ${key} major. ${ts.map(t => t.roman + ' = ' + t.name).join(', ')}.`, voice: 'piano', bpm: 90 });
});

// ---------- a progression ----------
registerExample('progression', (wrap, p) => {
  const key = p.key || 'C';
  const prog = PROGRESSIONS.find(x => x.id === (p.id || 'I-IV-V-I'));
  const chords = T.progressionChords(key, prog);
  const r = renderNotation({ key, events: chords.map(t => ({ pitches: t.notes, dur: 96, label: t.roman, text: t.name.replace(' major', '').replace(' minor', 'm') })), endBar: false, width: 360 });
  const seq = chords.map(t => ({ midis: t.notes.map(toMidi), beats: 2 }));
  notationFigure(wrap, r, seq, { caption: p.caption || `${prog.label} in ${key} major`, voice: 'piano', bpm: 90 });
});

// ---------- performance markings: one melody, several treatments ----------
registerExample('articulations', (wrap, p, ctx) => {
  const seqBase = () => eventsToSequence(parseMelody(p.notes || 'G4q A4q B4q C5q | D5q C5q B4q A4q | G4h rh'));
  wrap.innerHTML = `<div class="seg" data-role="list">${ARTICULATIONS.map((a, i) => `<button type="button" data-i="${i}">${a.term}</button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><p class="ex-out" data-role="out"></p>`;
  let cur = 0;
  const show = () => {
    const a = ARTICULATIONS[cur];
    const b = parseMelody(p.notes || 'G4q A4q B4q C5q | D5q C5q B4q A4q | G4h rh');
    b.flat().forEach((e, i, arr) => { if (!e.pitches) return; if (a.artic === 'legato') { if (i === 0) e.slur = 'start'; const lastIdx = arr.map(x => !!x.pitches).lastIndexOf(true); if (i === lastIdx) e.slur = 'end'; } else e.artic = a.artic; });
    wrap.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'G', time: '4/4', bars: b, endBar: true }).svg;
    wrap.querySelector('[data-role=out]').textContent = `${a.term}: ${a.sign}. ${a.meaning}. Tap the staff to hear it.`;
    wrap.querySelectorAll('[data-role=list] button').forEach((x, i) => x.classList.toggle('on', i === cur));
  };
  wrap.querySelector('[data-role=staff]').addEventListener('click', () => {
    const a = ARTICULATIONS[cur];
    const seq = seqBase().map(n => ({ ...n, artic: a.artic }));
    const evs = wrap.querySelectorAll('.ev');
    playSequence(seq, { bpm: 108, voice: ctx.voice || 'oboe', legato: a.artic === 'legato', onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
  });
  wrap.querySelectorAll('[data-role=list] button').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; show(); }));
  show();
});

registerExample('dynamics', (wrap, p, ctx) => {
  const notes = p.notes || 'G4q A4q B4q C5q | D5h B4h | C5q B4q A4q G4q | A4w';
  wrap.innerHTML = `<div class="seg" data-role="list">${DYNAMICS.map((d, i) => `<button type="button" data-i="${i}"><span class="dynsign">${d.sign}</span></button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><p class="ex-out" data-role="out"></p>`;
  let cur = 3;
  const show = () => {
    const d = DYNAMICS[cur];
    const bars = parseMelody(notes); bars[0][0].dyn = d.sign;
    wrap.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'G', time: '4/4', bars, endBar: true }).svg;
    wrap.querySelector('[data-role=out]').textContent = `${d.sign}: ${d.term}, ${d.meaning}. Tap the staff to hear the melody at this level.`;
    wrap.querySelectorAll('[data-role=list] button').forEach((x, i) => x.classList.toggle('on', i === cur));
  };
  wrap.querySelector('[data-role=staff]').addEventListener('click', () => {
    const d = DYNAMICS[cur];
    const seq = eventsToSequence(parseMelody(notes)).map(n => ({ ...n, gain: d.level }));
    const evs = wrap.querySelectorAll('.ev');
    playSequence(seq, { bpm: 100, voice: ctx.voice || 'oboe', onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
  });
  wrap.querySelectorAll('[data-role=list] button').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; show(); }));
  show();
});

registerExample('hairpin', (wrap, p, ctx) => {
  const bars = parseMelody(p.notes || '{p} < G4q A4q B4q C5q | D5q E5q F#5q G5q ! | {f} > G5q F#5q E5q D5q | C5q B4q A4q G4q !');
  const r = renderNotation({ key: 'G', time: '4/4', bars, endBar: true });
  const seq = eventsToSequence(bars);
  // ramp the gain across the hairpins
  const n = seq.length; seq.forEach((s, i) => { s.gain = i < n / 2 ? 0.3 + 0.9 * (i / (n / 2)) : 1.2 - 0.9 * ((i - n / 2) / (n / 2)); });
  notationFigure(wrap, r, seq, { caption: p.caption || 'Crescendo, then diminuendo.', voice: ctx.voice || 'oboe', bpm: 112 });
});

registerExample('tempo', (wrap, p, ctx) => {
  const notes = p.notes || (TUNES.odeToJoy.notes);
  wrap.innerHTML = `<div class="seg" data-role="list">${TEMPO_TERMS.map((t, i) => `<button type="button" data-i="${i}">${t.term}</button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><p class="ex-out" data-role="out"></p>`;
  let cur = 3;
  const show = () => {
    const t = TEMPO_TERMS[cur];
    wrap.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'G', time: '4/4', bars: parseMelody(notes), endBar: true, tempoText: `${t.term} (♩ = ${t.bpm})` }).svg;
    wrap.querySelector('[data-role=out]').textContent = `${t.term}: ${t.meaning}, about ${t.bpm} beats a minute. Tap the staff to hear it.`;
    wrap.querySelectorAll('[data-role=list] button').forEach((x, i) => x.classList.toggle('on', i === cur));
  };
  wrap.querySelector('[data-role=staff]').addEventListener('click', () => {
    const t = TEMPO_TERMS[cur];
    const evs = wrap.querySelectorAll('.ev');
    playSequence(eventsToSequence(parseMelody(notes)), { bpm: t.bpm, voice: ctx.voice || 'piano', onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) });
  });
  wrap.querySelectorAll('[data-role=list] button').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; show(); }));
  show();
});

// ---------- staff with named lines and spaces ----------
registerExample('staff-names', (wrap, p) => {
  const which = p.which || 'lines';
  const notes = which === 'lines' ? ['E4', 'G4', 'B4', 'D5', 'F5'] : ['F4', 'A4', 'C5', 'E5'];
  const ps = notes.map(parsePitch);
  const r = renderNotation({ key: 'C', events: ps.map(n => ({ pitches: [n], dur: 192 })), labels: 'names', endBar: false, width: 320 });
  notationFigure(wrap, r, ps.map(n => ({ midi: toMidi(n), beats: 1 })), { caption: p.caption || (which === 'lines' ? 'The five lines, from the bottom: E G B D F.' : 'The four spaces, from the bottom: F A C E.'), voice: 'piano', bpm: 100 });
});

registerExample('ledger', (wrap, p) => {
  const notes = (p.notes || 'A3 B3 C4 D4 G5 A5 B5 C6').split(' ').map(parsePitch);
  const r = renderNotation({ key: 'C', events: notes.map(n => ({ pitches: [n], dur: 192 })), labels: 'names', endBar: false, width: 380 });
  notationFigure(wrap, r, notes.map(n => ({ midi: toMidi(n), beats: 1 })), { caption: p.caption || 'Notes below and above the staff use short ledger lines.', voice: 'piano', bpm: 100 });
});

registerExample('accidentals', (wrap, p) => {
  const bars = parseMelody('F4h F#4h | Bb4h B4h | F4q F#4q F4q Fb4q');
  // show a natural explicitly after a sharp: parser gives acc 0 for F after F#, renderer marks the natural
  const r = renderNotation({ key: 'C', time: '4/4', bars, labels: 'names', endBar: true });
  notationFigure(wrap, r, eventsToSequence(bars), { caption: p.caption || 'A sharp raises a note by a semitone, a flat lowers it, and a natural cancels either for the rest of the bar.', voice: 'piano', bpm: 96 });
});

// ---------- L12: other ways to document music ----------
registerExample('graphic-score', (wrap, p) => {
  wrap.innerHTML = `<svg class="gscore" viewBox="0 0 400 120" role="img" aria-label="A graphic score">
    <rect x="0" y="0" width="400" height="120" fill="none"/>
    <line x1="10" y1="100" x2="390" y2="100" class="gs-ln"/>
    <text x="10" y="114" class="gs-t">0 s</text><text x="200" y="114" class="gs-t" text-anchor="middle">5 s</text><text x="390" y="114" class="gs-t" text-anchor="end">10 s</text>
    <path d="M20 80 Q 80 20 140 70" class="gs-a"/>
    <rect x="150" y="40" width="90" height="28" class="gs-b"/>
    <circle cx="275" cy="35" r="6" class="gs-c"/><circle cx="295" cy="55" r="9" class="gs-c"/><circle cx="325" cy="30" r="12" class="gs-c"/>
    <path d="M345 90 L390 90" class="gs-d" stroke-dasharray="3 4"/>
  </svg><figcaption class="cap"><span>${esc(p.caption || 'A graphic score: a rising then falling glide, a sustained block of sound, three growing dots and a faint line. Height is pitch, length is time and size is loudness. Tap to hear one reading of it.')}</span><button type="button" class="btn sm ghost play">Play</button></figcaption>`;
  const play = () => {
    const c = 0.4;
    for (let i = 0; i < 12; i++) playNote(60 + Math.round(12 * Math.sin(i / 11 * Math.PI)), { at: i * 0.25, dur: 0.26, voice: 'flute', gain: 0.6 });
    playChord([55, 62, 67], { at: 3.6, dur: 2.2, voice: 'strings', gain: 0.6 });
    [72, 67, 76].forEach((m, i) => playNote(m, { at: 6.4 + i * 0.6, dur: 0.4, voice: 'harp', gain: 0.5 + 0.3 * i }));
    playNote(48, { at: 8.4, dur: 1.4, voice: 'sine', gain: 0.25 });
  };
  wrap.querySelector('.play').addEventListener('click', play); wrap.querySelector('svg').addEventListener('click', play);
});

registerExample('tab', (wrap, p) => {
  // guitar tablature for a C major scale starting on the A string
  const strings = ['e', 'B', 'G', 'D', 'A', 'E'];
  const cols = [[4, 3], [4, 5], [3, 2], [3, 3], [3, 5], [2, 2], [2, 4], [2, 5]];  // [stringIndex, fret]
  const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  const midis = [48, 50, 52, 53, 55, 57, 59, 60];
  wrap.innerHTML = `<svg class="tab" viewBox="0 0 400 130" role="img" aria-label="Guitar tablature of a C major scale">
    ${strings.map((s, i) => `<text x="6" y="${20 + i * 18 + 5}" class="tab-t">${s}</text><line x1="24" x2="392" y1="${20 + i * 18}" y2="${20 + i * 18}" class="gs-ln"/>`).join('')}
    ${cols.map(([si, fr], k) => `<g class="tab-n" data-i="${k}"><rect x="${44 + k * 44 - 9}" y="${20 + si * 18 - 8}" width="18" height="16" class="tab-bg"/><text x="${44 + k * 44}" y="${20 + si * 18 + 5}" class="tab-f" text-anchor="middle">${fr}</text></g>`).join('')}
    ${names.map((n, k) => `<text x="${44 + k * 44}" y="124" class="gs-t" text-anchor="middle">${n}</text>`).join('')}
  </svg><figcaption class="cap"><span>${esc(p.caption || 'Guitar tablature (TAB): six lines are the six strings, the top line is the thinnest string, and each number is the fret to press. This is a C major scale. Tap to hear it.')}</span><button type="button" class="btn sm ghost play">Play</button></figcaption>`;
  const play = () => { const ns = wrap.querySelectorAll('.tab-n'); playSequence(midis.map(m => ({ midi: m, beats: 1 })), { bpm: 100, voice: 'harp', onNote: (i) => { ns.forEach(n => n.classList.remove('hot')); ns[i].classList.add('hot'); }, onEnd: () => ns.forEach(n => n.classList.remove('hot')) }); };
  wrap.querySelector('.play').addEventListener('click', play); wrap.querySelector('svg').addEventListener('click', play);
});

registerExample('track-listing', (wrap, p) => {
  wrap.innerHTML = `<table class="tl"><thead><tr><th>Time</th><th>Section</th><th>What happens</th></tr></thead><tbody>
    <tr><td>0:00</td><td>Introduction</td><td>Solo piano, soft, slow chords. Sets the mood.</td></tr>
    <tr><td>0:18</td><td>Verse 1</td><td>Voice enters with the main melody over the piano. Mostly steps, low register.</td></tr>
    <tr><td>0:52</td><td>Chorus</td><td>Drums and bass join. Louder, higher, the hook repeats twice.</td></tr>
    <tr><td>1:25</td><td>Verse 2</td><td>Same melody as verse 1 with a countermelody on strings.</td></tr>
    <tr><td>1:58</td><td>Chorus</td><td>As before, with backing vocals added (layering).</td></tr>
    <tr><td>2:30</td><td>Bridge</td><td>New chords and a key change up a tone. Builds in a crescendo.</td></tr>
    <tr><td>2:55</td><td>Final chorus and coda</td><td>Fullest texture. Ends with the opening piano chords, fading out.</td></tr>
  </tbody></table><figcaption class="cap"><span>${esc(p.caption || 'An annotated track listing: timings, section names and a note on the musical features of each section. This one describes a made-up song.')}</span></figcaption>`;
});

registerExample('lead-sheet', (wrap, p, ctx) => {
  const bars = parseMelody(p.notes || '[C] C4q D4q E4q C4q | [C] C4q D4q E4q C4q | [F] E4q F4q [G] G4h | [F] E4q F4q [G] G4h');
  const r = renderNotation({ key: 'C', time: '4/4', bars, endBar: true });
  const seq = eventsToSequence(bars);
  notationFigure(wrap, r, seq, { caption: p.caption || 'A lead sheet: the melody in staff notation with chord symbols above. Performers add their own accompaniment from the symbols.', voice: ctx.voice || 'piano', bpm: 104 });
});

registerExample('rhythm-grid-figure', (wrap, p) => {
  const cells = (p.cells || '1000101010001100').split('').map(Number);
  const evs = T.gridToEvents(cells, 4).map(e => e.rest ? e : { ...e, pitches: [pitch('B', 0, 4)] });
  wrap.innerHTML = `<div class="grid-fig"><div class="grid-row">${cells.map((c, i) => `<span class="${c ? 'on' : ''} ${i % 4 === 0 ? 'beat' : ''}">${i % 4 === 0 ? (i / 4 + 1) : ''}</span>`).join('')}</div></div><div class="ex-staff">${renderNotation({ key: 'C', time: '4/4', bars: [evs], noClef: false, endBar: true }).svg}</div><figcaption class="cap"><span>${esc(p.caption || 'A rhythm grid: one bar of 4/4 split into 16 boxes, four to a beat. A filled box is a note. Below it is the same rhythm in staff notation. Tap to hear it.')}</span><button type="button" class="btn sm ghost play">Play</button></figcaption>`;
  const play = () => { const seq = eventsToSequence([evs]); const evEls = wrap.querySelectorAll('.ev'); for (let b = 0; b < 4; b++) click(b === 0, b * 0.6); playSequence(seq, { bpm: 100, voice: 'sine', onNote: (i, n) => { evEls.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evEls.forEach(e => e.classList.remove('hot')) }); };
  wrap.querySelector('.play').addEventListener('click', play); wrap.querySelector('.ex-staff').addEventListener('click', play);
});

// ---------- contour: a melody with its shape drawn ----------
registerExample('contours', (wrap, p, ctx) => {
  const items = [
    { name: 'Rising', notes: 'C4q D4q E4q F4q | G4q A4q B4q C5q' },
    { name: 'Falling', notes: 'C5q B4q A4q G4q | F4q E4q D4q C4q' },
    { name: 'Arch', notes: 'C4q E4q G4q C5q | G4q E4q C4h' },
    { name: 'Inverted arch', notes: 'G4q E4q C4q E4q | G4q C5q G4h' },
    { name: 'Repeated', notes: 'G4q G4q G4q G4q | G4q G4q G4h' },
    { name: 'Wave', notes: 'C4q E4q D4q F4q | E4q G4q F4q A4q' },
  ];
  wrap.innerHTML = `<div class="seg" data-role="list">${items.map((it, i) => `<button type="button" data-i="${i}">${it.name}</button>`).join('')}</div><div class="ex-staff" data-role="staff"></div><p class="ex-out" data-role="out">Tap a shape, then tap the staff to hear it.</p>`;
  let cur = 0;
  const show = () => { const it = items[cur]; wrap.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', time: '4/4', bars: parseMelody(it.notes), contour: true, endBar: true }).svg; wrap.querySelectorAll('[data-role=list] button').forEach((x, i) => x.classList.toggle('on', i === cur)); };
  wrap.querySelector('[data-role=staff]').addEventListener('click', () => { const evs = wrap.querySelectorAll('.ev'); playSequence(eventsToSequence(parseMelody(items[cur].notes)), { bpm: 110, voice: ctx.voice || 'piano', onNote: (i, n) => { evs.forEach(e => e.classList.remove('hot')); const e = wrap.querySelector(`.ev[data-i="${n.evIndex}"]`); if (e) e.classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) }); });
  wrap.querySelectorAll('[data-role=list] button').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; show(); }));
  show();
});

export const CSS = `
.vals{width:100%;border-collapse:collapse;font-size:15px}
.vals th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-2);padding:4px 6px;border-bottom:1px solid var(--rule)}
.vals td{padding:4px 6px;border-bottom:1px solid var(--rule);vertical-align:middle}
.vals td svg{width:70px;height:auto}
.vals tr.hot td{background:color-mix(in srgb,var(--lang) 15%,var(--paper))}
.grp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.grp{border:1px solid var(--rule);border-radius:10px;padding:6px;background:var(--paper);display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;color:var(--ink-2)}
.grp svg{width:100%;height:auto}
.cmp-row{margin-bottom:8px}
.cmp-row .ex-staff{cursor:pointer}
.count-line{font-family:var(--body);font-size:14px;color:var(--ink-2);margin-top:4px;letter-spacing:.2em}
.dynsign{font-family:"Bravura";font-size:22px;line-height:1}
.gscore,.tab{width:100%;height:auto;display:block;cursor:pointer}
.gs-ln{stroke:var(--rule);stroke-width:1.2}
.gs-t,.tab-t{font-family:var(--body);font-size:11px;fill:var(--ink-2)}
.gs-a{fill:none;stroke:var(--lang);stroke-width:4;stroke-linecap:round}
.gs-b{fill:var(--anal);opacity:.7}
.gs-c{fill:var(--creat)}
.gs-d{stroke:var(--ink-2);stroke-width:2}
.tab-bg{fill:var(--paper)}
.tab-f{font-family:var(--body);font-size:14px;font-weight:600;fill:var(--ink)}
.tab-n.hot .tab-f{fill:var(--lang)}
.tl{width:100%;border-collapse:collapse;font-size:14px}
.tl th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-2);padding:4px 6px;border-bottom:1px solid var(--rule)}
.tl td{padding:5px 6px;border-bottom:1px solid var(--rule);vertical-align:top}
.tl td:first-child{font-variant-numeric:tabular-nums;white-space:nowrap}
.grid-fig{margin-bottom:8px}
.grid-row{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:2px}
.grid-row>*{aspect-ratio:1;min-width:0;border:1px solid var(--rule);border-radius:4px;font-size:11px;display:flex;align-items:flex-start;justify-content:flex-start;padding:2px;color:var(--ink-2);background:var(--paper);box-sizing:border-box;line-height:1}
.grid-row>.beat{border-left:2px solid var(--ink-2)}
.grid-row>.on{background:var(--lang);color:#fff}
.tool .grid-row{min-height:44px}
.tool .grid-row>*{aspect-ratio:auto;min-height:44px;cursor:pointer}
`;
