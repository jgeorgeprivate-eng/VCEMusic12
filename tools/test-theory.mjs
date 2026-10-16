// Checks the music rules and every generated question bank. Run: node tools/test-theory.mjs
import * as T from '../js/theory.js';
import { parseMelody } from '../js/melody.js';
let fails = 0; const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } };
const txt = (sc) => sc.map(T.pitchName).join(' ');
// scales and key signatures
const expect = { C: 'C D E F G A B C', G: 'G A B C D E F♯ G', F: 'F G A B♭ C D E F', D: 'D E F♯ G A B C♯ D', 'B♭': 'B♭ C D E♭ F G A B♭', Am: 'A B C D E F G A', Em: 'E F♯ G A B C D E', Dm: 'D E F G A B♭ C D' };
for (const k of Object.keys(expect)) ok(txt(T.keyScale(k)) === expect[k], `scale ${k}: ${txt(T.keyScale(k))}`);
ok(T.keySignature('D').map(T.pitchName).join() === 'F♯,C♯', 'D sig'); ok(T.keySignature('B♭').map(T.pitchName).join() === 'B♭,E♭', 'Bb sig'); ok(T.keySignature('Em').map(T.pitchName).join() === 'F♯', 'Em sig');
// pentatonic
ok(txt(T.scale(T.parsePitch('C4'), 'majorPentatonic')) === 'C D E G A C', 'C maj pent'); ok(txt(T.scale(T.parsePitch('A3'), 'minorPentatonic')) === 'A C D E G A', 'A min pent');
ok(txt(T.scale(T.parsePitch('F4'), 'majorPentatonic')) === 'F G A C D F', 'F maj pent');
// intervals: every diatonic interval in U1 keys has an allowed name
const allowed = new Set(['minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave', 'augmented 4th', 'diminished 5th']);
for (const k of T.MAJOR_KEYS_U1) for (const iv of T.diatonicIntervals(k)) ok(allowed.has(iv.name), `interval ${k} ${T.pitchName(iv.lo)}-${T.pitchName(iv.hi)} = ${iv.name}`);
ok(T.interval(T.parsePitch('C4'), T.parsePitch('G4')).name === 'perfect 5th', 'C-G'); ok(T.interval(T.parsePitch('E4'), T.parsePitch('G4')).name === 'minor 3rd', 'E-G'); ok(T.interval(T.parsePitch('F4'), T.parsePitch('B4')).name === 'augmented 4th', 'F-B'); ok(T.interval(T.parsePitch('B3'), T.parsePitch('C4')).name === 'minor 2nd', 'B-C');
// triads
for (const k of T.MAJOR_KEYS_U2) { for (const d of [1, 4, 5]) ok(T.triad(k, d).quality === 'major', `${k} ${d} major`); for (const d of [2, 6]) ok(T.triad(k, d).quality === 'minor', `${k} ${d} minor`); }
ok(T.triad('G', 5).notes.map(T.pitchName).join(' ') === 'D F♯ A', 'V of G'); ok(T.triad('B♭', 2).notes.map(T.pitchName).join(' ') === 'C E♭ G', 'ii of Bb');
// rhythm: every grouping fills its beats; gridToEvents round trips
for (const g of T.GROUPINGS_U1) ok(g.notes.reduce((a, b) => a + b, 0) === g.beats * 48, `grouping ${g.id}`);
for (const g of T.GROUPINGS_68) ok(g.notes.reduce((a, b) => a + b, 0) === 72, `6/8 grouping ${g.id}`);
for (const cells of ['1000101010001100', '1111100010011010', '100000000000']) { const ev = T.gridToEvents(cells.split('').map(Number), 4); const sum = ev.reduce((a, e) => a + T.evBeats(e) * 48, 0); ok(sum === cells.length * 12, `grid ${cells} sums to ${sum}`); }
// melodies: bars add up to the metre
import { TUNES } from '../js/melody.js';
for (const [name, t] of Object.entries(TUNES)) { const bars = parseMelody(t.notes); const m = T.METRES[t.time]; bars.forEach((bar, i) => { const s = bar.reduce((a, e) => a + T.evBeats(e) * 48, 0); if (i > 0 && i < bars.length - 1) ok(s === m.barLength, `${name} bar ${i} = ${s / 48} beats`); }); }
// contour
ok(T.contour(['C4', 'D4', 'E4', 'F4'].map(T.parsePitch)) === 'rising', 'rising'); ok(T.contour(['C4', 'E4', 'G4', 'E4', 'C4'].map(T.parsePitch)) === 'arch', 'arch');
// question banks
for (const code of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']) {
  const m = await import(`../content/questions/${code}.js`);
  for (const unit of [1, 2]) {
    const bank = m.bank(unit);
    if (unit === 1 && ['A6', 'A7', 'C6', 'P6'].includes(code)) continue;
    ok(bank.length >= 30, `${code} unit ${unit} bank size ${bank.length}`);
    for (const q of bank) { ok(q.wrong.length === 3 && !q.wrong.includes(q.correct) && new Set(q.wrong).size === 3, `${code}: ${q.text} / ${q.correct} / ${q.wrong}`); ok((q.unit || 1) <= unit, `${code} unit leak: ${q.text}`); if (unit === 1) ok(!/(in|of|up) (D|B♭) major|D major pentatonic|6\/8/.test(q.text), `${code} U1 question mentions U2 material: ${q.text}`); }
  }
}
console.log(fails ? `${fails} failures` : 'all checks passed');
process.exit(fails ? 1 : 0);
