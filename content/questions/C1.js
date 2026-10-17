// C1 Harmonising a melody with I, IV and V.
import { makeBank, unique } from './_util.js';
import { triad, keyScale, pitchName, toMidi, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS, ROMAN } from '../../js/theory.js';

const keysFor = (u) => u >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;
const PRIM = [1, 4, 5];
function chordsContaining(key, p) { return PRIM.filter(d => triad(key, d).notes.some(n => n.step === p.step && n.acc === p.acc)); }

const templates = [
  // which chord(s) contain a note
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k).slice(0, 7);
    const p = r.pick(sc); const fits = chordsContaining(k, p);
    const correct = fits.map(d => ROMAN[d - 1]).join(' and ');
    const opts = unique(['I', 'IV', 'V', 'I and IV', 'I and V', 'IV and V', 'ii'].filter(x => x !== correct));
    return { text: `In ${k} major, which of the primary chords contain the note ${pitchName(p)}?`, correct, wrong: r.shuffle(opts).slice(0, 3), unit: KEYS[k].unit, explain: `I is ${triad(k, 1).notes.map(pitchName).join(' ')}, IV is ${triad(k, 4).notes.map(pitchName).join(' ')}, V is ${triad(k, 5).notes.map(pitchName).join(' ')}. ${pitchName(p)} is in ${correct}.` };
  },
  // a bar with two strong-beat notes: which chord fits
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(PRIM); const t = triad(k, d);
    const [a, b] = r.shuffle(t.notes).slice(0, 2);
    const fits = PRIM.filter(x => { const ns = triad(k, x).notes; return [a, b].every(p => ns.some(n => n.step === p.step && n.acc === p.acc)); });
    if (fits.length !== 1) return null;
    const correct = ROMAN[d - 1];
    return { text: `A bar in ${k} major has ${pitchName(a)} on beat 1 and ${pitchName(b)} on beat 3. Which primary chord fits?`, notation: { key: k, time: '4/4', bars: [[{ pitches: [a], dur: 96 }, { pitches: [b], dur: 96 }]], noEnd: true }, correct, wrong: r.shuffle(['I', 'IV', 'V', 'ii', 'vi'].filter(x => x !== correct)).slice(0, 3), unit: KEYS[k].unit, explain: `${correct} is ${t.name}, ${t.notes.map(pitchName).join(' ')}, which contains both ${pitchName(a)} and ${pitchName(b)}.` };
  },
  (r) => {
    const q = r.pick([
      { text: 'Which two chords make the end of a harmonised melody sound finished?', correct: 'V then I', wrong: ['IV then V', 'I then IV', 'ii then vi'] },
      { text: 'Which beats of a 4/4 bar matter most when choosing a chord?', correct: 'Beats 1 and 3', wrong: ['Beats 2 and 4', 'Only beat 4', 'All beats equally'] },
      { text: 'What is a passing note?', correct: 'A note on a weak beat that steps between two chord tones', wrong: ['The first note of a bar', 'A note held across a bar line', 'The root of the chord'] },
      { text: 'Why can I, IV and V harmonise any major-key melody?', correct: 'Between them they contain every note of the scale', wrong: ['They are the loudest chords', 'They are all minor', 'They have the same root'] },
      { text: 'A melody ends on the tonic. Which chord under it makes the ending sound finished?', correct: 'I', wrong: ['IV', 'V', 'vi'] },
      { text: 'What is a chord tone?', correct: 'A note that belongs to the chord sounding at that moment', wrong: ['Any note on a strong beat', 'The highest note in the bar', 'A note with an accidental'] },
      { text: 'A bar\'s strong-beat note belongs to two primary chords. How do you choose?', correct: 'By ear, keeping in mind that pieces start on I and end V then I', wrong: ['Always choose IV', 'Choose the chord with more sharps', 'Leave the bar without a chord'] },
      { text: 'In a harmonisation, where are chord symbols written?', correct: 'Above the staff', wrong: ['Below the bass line', 'In the key signature', 'At the end of the piece'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // in key, the notes of a primary chord
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(PRIM); const t = triad(k, d);
    const correct = t.notes.map(pitchName).join(' ');
    return { text: `What are the notes of chord ${ROMAN[d - 1]} in ${k} major?`, correct, wrong: r.shuffle(unique([1, 2, 4, 5, 6].filter(x => x !== d).map(x => triad(k, x).notes.map(pitchName).join(' ')))).slice(0, 3), mono: true, unit: KEYS[k].unit, explain: `${ROMAN[d - 1]} in ${k} major is ${t.name}: ${correct}.` };
  },
];
export function bank(unit = 1, seed = 31) { return makeBank(templates, unit, seed); }
export const meta = { code: 'C1', quizLength: 10, passMark: 70 };
