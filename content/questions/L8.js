// L8 Melodic contour.
import { keyScale, toMidi, pitchName, contour, motion, interval, MAJOR_KEYS_U1, diatonicIndex } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const SHAPES = ['rising', 'falling', 'arch', 'inverted arch', 'repeated', 'wave'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** Generate a melody with a wanted contour from scale degrees. Returns pitches. */
function melodyWithShape(r, k, shape) {
  const sc = keyScale(k); const two = sc.slice(0, 7).concat(sc.slice(0, 8).map(p => ({ ...p, oct: p.oct + 1 })));
  let idx;
  if (shape === 'rising') { const s = r.int(4); idx = [s, s + 1 + r.int(2), s + 3 + r.int(2), s + 5 + r.int(2), s + 7]; }
  else if (shape === 'falling') { const s = 7 + r.int(4); idx = [s, s - 1 - r.int(2), s - 3 - r.int(2), s - 5 - r.int(2), s - 7]; }
  else if (shape === 'arch') { const s = r.int(3); idx = [s, s + 2, s + 4 + r.int(2), s + 2 + r.int(2), s]; }
  else if (shape === 'inverted arch') { const s = 6 + r.int(3); idx = [s, s - 2, s - 4 - r.int(2), s - 2, s]; }
  else if (shape === 'repeated') { const s = 2 + r.int(5); idx = [s, s, s, s, s]; }
  else { const s = 2 + r.int(3); idx = [s, s + 2, s + 1, s + 3, s + 2, s + 4]; }
  return idx.map(i => two[Math.max(0, Math.min(14, i))]);
}

const templates = [
  // shape of a shown melody
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const shape = r.pick(SHAPES);
    const ps = melodyWithShape(r, k, shape);
    const c = contour(ps);
    if (c !== shape) return null;
    return { text: 'What is the contour of this melody?', notation: { key: k, events: ps.map(p => ({ pitches: [p], dur: 48 })), noEnd: true }, correct: cap(shape), wrong: r.shuffle(SHAPES.filter(x => x !== shape).map(cap)).slice(0, 3), explain: `The melody ${shape === 'rising' ? 'climbs overall' : shape === 'falling' ? 'descends overall' : shape === 'arch' ? 'rises to a high point and falls back' : shape === 'inverted arch' ? 'falls to a low point and rises back' : shape === 'repeated' ? 'stays on one note' : 'rises and falls several times'}: ${shape}.` };
  },
  // shape of a heard melody
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const shape = r.pick(SHAPES);
    const ps = melodyWithShape(r, k, shape);
    if (contour(ps) !== shape) return null;
    return { text: 'Listen to this melody. What is its contour?', audio: ps.map(p => ({ midi: toMidi(p), beats: 0.7 })), correct: cap(shape), wrong: r.shuffle(SHAPES.filter(x => x !== shape).map(cap)).slice(0, 3), explain: `${cap(shape)}.` };
  },
  // step or leap between two notes
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const sc = keyScale(k);
    const i = r.int(7); let j = i + (r() < 0.5 ? 1 : 2 + r.int(3)); if (j > 7) j = i - 1;
    const a = sc[i], b = sc[j];
    const m = motion(a, b);
    const correct = m === 'step' ? 'A step' : m === 'leap' ? 'A leap' : 'A repeated note';
    return { text: `A melody moves from ${pitchName(a)} to ${pitchName(b)}. Is that a step or a leap?`, correct, wrong: ['A step', 'A leap', 'A repeated note', 'An octave'].filter(x => x !== correct).slice(0, 3), explain: `${pitchName(a)} to ${pitchName(b)} is a ${interval(a, b).name}. ${m === 'step' ? 'A 2nd is a step.' : 'Anything larger than a 2nd is a leap.'}` };
  },
  // range of a melody
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const shape = r.pick(['arch', 'rising', 'wave']);
    const ps = melodyWithShape(r, k, shape);
    const ms = ps.map(toMidi); const lo = ps[ms.indexOf(Math.min(...ms))], hi = ps[ms.indexOf(Math.max(...ms))];
    const iv = interval(lo, hi);
    const name = iv.number === 8 ? 'an octave' : `a ${iv.number === 1 ? 'unison' : iv.name}`;
    const wrongNums = ['a major 2nd', 'a minor 3rd', 'a major 3rd', 'a perfect 4th', 'a perfect 5th', 'a major 6th', 'a minor 6th', 'a minor 7th', 'a major 7th', 'an octave'].filter(x => x !== name);
    return { text: 'What is the range of this melody, from its lowest note to its highest?', notation: { key: k, events: ps.map(p => ({ pitches: [p], dur: 48 })), noEnd: true }, correct: name, wrong: r.shuffle(wrongNums).slice(0, 3), explain: `The lowest note is ${pitchName(lo)} and the highest is ${pitchName(hi)}: ${name}.` };
  },
  // concepts
  (r) => {
    const q = r.pick([
      { text: 'What is melodic contour?', correct: 'The overall shape of a melody as it rises and falls', wrong: ['The speed of a melody', 'The key of a melody', 'The loudness of a melody'] },
      { text: 'A melody that moves mostly by step is described as', correct: 'conjunct', wrong: ['disjunct', 'chromatic', 'static'] },
      { text: 'A melody that moves mostly by leap is described as', correct: 'disjunct', wrong: ['conjunct', 'legato', 'diatonic'] },
      { text: 'What is the range of a melody?', correct: 'The distance from its lowest note to its highest', wrong: ['The number of notes it has', 'How high it sits on the instrument', 'Its length in bars'] },
      { text: 'What does register describe?', correct: 'How high or low a melody sits overall', wrong: ['The shape of the melody', 'The number of leaps', 'The key signature'] },
      { text: 'An arch contour', correct: 'rises to a high point and then falls', wrong: ['falls and then rises', 'stays on one note', 'rises all the way through'] },
      { text: 'Which interval counts as a step?', correct: 'A 2nd', wrong: ['A 3rd', 'A 4th', 'A 5th'] },
      { text: 'The highest note of a phrase is usually', correct: 'the point of greatest tension', wrong: ['the tonic', 'the softest note', 'the first note'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // mostly steps or mostly leaps (shown)
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const sc = keyScale(k);
    const leaps = r() < 0.5;
    const idx = [0]; for (let i = 1; i < 5; i++) { const prev = idx[i - 1]; let n; do { n = prev + (leaps ? (r() < 0.5 ? 2 : -2) + (r() < 0.3 ? 2 : 0) : (r() < 0.5 ? 1 : -1)); } while (n < 0 || n > 7); idx.push(n); }
    const ps = idx.map(i => sc[i]);
    const correct = leaps ? 'Mostly by leap' : 'Mostly by step';
    return { text: 'How does this melody mostly move?', notation: { key: k, events: ps.map(p => ({ pitches: [p], dur: 48 })), noEnd: true }, correct, wrong: [leaps ? 'Mostly by step' : 'Mostly by leap', 'By repeated notes', 'By octaves'], explain: leaps ? 'Each move skips at least one letter name: leaps.' : 'Each move goes to the next letter name: steps.' };
  },
];

export function bank(unit = 1, seed = 8) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L8', quizLength: 10, passMark: 70 };
