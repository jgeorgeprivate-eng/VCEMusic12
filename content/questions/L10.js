// L10 Triads on I, ii, IV, V and vi.
import { triad, pitchName, toMidi, COURSE_DEGREES, ROMAN, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS, keyScale } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const keysFor = (unit) => unit >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;
const notesTxt = (t) => t.notes.map(pitchName).join(' ');

const templates = [
  // notes of a triad
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    const correct = notesTxt(t);
    const others = COURSE_DEGREES.filter(x => x !== d).map(x => notesTxt(triad(k, x)));
    const sc = keyScale(k);
    const alt = [t.notes[0], sc[(d) % 7], t.notes[2]].map(pitchName).join(' ');
    return { text: `Which notes make up chord ${t.roman} in ${k} major?`, correct, wrong: r.shuffle(unique([...others, alt].filter(x => x !== correct))).slice(0, 3), mono: true, unit: KEYS[k].unit, explain: `${t.roman} is built on degree ${d}, ${pitchName(t.notes[0])}, with a third and a fifth above: ${correct}.` };
  },
  // quality of a triad
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    const correct = t.quality === 'major' ? 'Major' : 'Minor';
    return { text: `Is chord ${t.roman} in ${k} major a major or a minor triad?`, correct, wrong: [t.quality === 'major' ? 'Minor' : 'Major', 'Diminished', 'It has no quality'], unit: KEYS[k].unit, explain: `${t.roman} is ${t.name}. ${t.quality === 'major' ? 'I, IV and V are always major in a major key.' : 'ii and vi are always minor in a major key.'}` };
  },
  // name the chord shown
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    const correct = t.name;
    const wrong = unique(COURSE_DEGREES.filter(x => x !== d).map(x => triad(k, x).name).concat([`${pitchName(t.notes[0])} ${t.quality === 'major' ? 'minor' : 'major'}`]).filter(x => x !== correct));
    return { text: 'Name this triad.', notation: { key: k, events: [{ pitches: t.notes, dur: 96 }], noEnd: true }, correct, wrong: r.shuffle(wrong).slice(0, 3), unit: KEYS[k].unit, explain: `The lowest note of the stack is ${pitchName(t.notes[0])}, the root. The third above it is ${t.quality}, so the chord is ${correct}.` };
  },
  // roman numeral of a named chord in a key
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    return { text: `In ${k} major, which Roman numeral is the chord ${t.name}?`, correct: t.roman, wrong: r.shuffle(COURSE_DEGREES.filter(x => x !== d).map(x => ROMAN[x - 1])).slice(0, 3), unit: KEYS[k].unit, explain: `${pitchName(t.notes[0])} is degree ${d} of ${k} major, so the chord is ${t.roman}.` };
  },
  // hear major or minor triad
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    const correct = t.quality === 'major' ? 'Major' : 'Minor';
    return { text: 'Listen to this triad. Is it major or minor?', audio: [{ midis: t.notes.map(toMidi), beats: 2 }, ...t.notes.map(n => ({ midi: toMidi(n), beats: 0.5 }))], correct, wrong: [t.quality === 'major' ? 'Minor' : 'Major', 'Neither, it is a single note', 'Both at once'], explain: `${correct}: the third above the root is a ${t.quality} 3rd.` };
  },
  // which degree is the root
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick(COURSE_DEGREES); const t = triad(k, d);
    const correct = pitchName(t.notes[0]);
    return { text: `What is the root of chord ${t.roman} in ${k} major?`, correct, wrong: r.shuffle(keyScale(k).slice(0, 7).map(pitchName).filter(x => x !== correct)).slice(0, 3), unit: KEYS[k].unit, explain: `${t.roman} is built on degree ${d} of ${k} major, which is ${correct}.` };
  },
  // concepts
  (r) => {
    const q = r.pick([
      { text: 'A triad is', correct: 'a chord of three notes built in thirds', wrong: ['any three notes played together', 'a chord of four notes', 'three notes played one after the other'] },
      { text: 'In a major triad, the third above the root is', correct: 'a major 3rd, four semitones', wrong: ['a minor 3rd, three semitones', 'a perfect 4th', 'a major 2nd'] },
      { text: 'In a minor triad, the third above the root is', correct: 'a minor 3rd, three semitones', wrong: ['a major 3rd, four semitones', 'a perfect 5th', 'a minor 2nd'] },
      { text: 'Which chords in a major key are major triads?', correct: 'I, IV and V', wrong: ['ii and vi', 'I, ii and iii', 'All of them'] },
      { text: 'Which chords in a major key are minor triads?', correct: 'ii and vi', wrong: ['I and V', 'IV and V', 'I and IV'] },
      { text: 'The chord on degree 5 is called', correct: 'the dominant', wrong: ['the tonic', 'the subdominant', 'the leading chord'] },
      { text: 'The chord on degree 1 is called', correct: 'the tonic chord', wrong: ['the dominant', 'the relative chord', 'the root chord'] },
      { text: 'Why is a small Roman numeral used for ii and vi?', correct: 'Because they are minor triads', wrong: ['Because they are quieter', 'Because they are played lower', 'Because they have fewer notes'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];

export function bank(unit = 1, seed = 10) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L10', quizLength: 10, passMark: 70 };
