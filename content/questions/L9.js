// L9 Melodic dictation: hear a melody of up to four beats in a major key, pick the written version that matches.
import { keyScale, toMidi, pitchName, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS } from '../../js/theory.js';
import { makeBank } from './_util.js';

function keysFor(unit) { return unit >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1; }

/** A 4-beat melody as scale-degree indexes (0 = tonic). */
function makeMelody(r, maxLeap, withQuavers) {
  const idx = [r.pick([0, 0, 0, 2, 4])];
  const n = withQuavers ? 6 : 4;
  for (let i = 1; i < n; i++) { let j; do { j = idx[i - 1] + r.int(2 * maxLeap + 1) - maxLeap; } while (j < 0 || j > 7); idx.push(j); }
  const durs = withQuavers ? r.pick([[24, 24, 48, 24, 24, 48], [48, 24, 24, 48, 24, 24], [24, 24, 24, 24, 48, 48]]) : [48, 48, 48, 48];
  return { idx, durs };
}
function events(sc, m) { return m.idx.map((i, k) => ({ pitches: [sc[i]], dur: m.durs[k] })); }
function audio(sc, m) { return m.idx.map((i, k) => ({ midi: toMidi(sc[i]), beats: m.durs[k] / 48 })); }
function alter(r, m) {   // change one note by a step
  const i = 1 + r.int(m.idx.length - 1);
  let j; do { j = m.idx[i] + (r() < 0.5 ? 1 : -1); } while (j < 0 || j > 7);
  return { idx: m.idx.map((x, k) => k === i ? j : x), durs: m.durs };
}
function sameIdx(a, b) { return a.idx.join() === b.idx.join(); }

const templates = [
  // which written melody matches
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const level = r.pick([1, 1, 2, 3]);
    const m = makeMelody(r, level === 1 ? 1 : level === 2 ? 2 : 4, level === 3 && r() < 0.5);
    const wrongs = []; let guard = 0;
    while (wrongs.length < 3 && guard++ < 30) { const w = alter(r, m); if (!sameIdx(w, m) && !wrongs.some(x => sameIdx(x, w))) wrongs.push(w); }
    if (wrongs.length < 3) return null;
    const opt = (mm) => mm.idx.map(i => pitchName(sc[i])).join(' ');
    return { text: `Listen to this melody in ${k} major. It starts on ${pitchName(sc[m.idx[0]])}. Which is it?`, audio: audio(sc, m), correct: opt(m), wrong: wrongs.map(opt), mono: true, unit: KEYS[k].unit, explain: `The melody is ${opt(m)}: degrees ${m.idx.map(i => i + 1).join(' ')}.` };
  },
  // which degrees were heard
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const m = makeMelody(r, 2, false);
    const wrongs = []; let guard = 0;
    while (wrongs.length < 3 && guard++ < 30) { const w = alter(r, m); if (!sameIdx(w, m) && !wrongs.some(x => sameIdx(x, w))) wrongs.push(w); }
    if (wrongs.length < 3) return null;
    const opt = (mm) => mm.idx.map(i => i + 1).join(' ');
    return { text: `Listen. The key is ${k} major and the first note is degree ${m.idx[0] + 1}. Which scale degrees do you hear?`, audio: audio(sc, m), correct: opt(m), wrong: wrongs.map(opt), mono: true, unit: KEYS[k].unit, explain: `Degrees ${opt(m)}, which in ${k} major are ${m.idx.map(i => pitchName(sc[i])).join(' ')}.` };
  },
  // the last note: which degree
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const m = makeMelody(r, 2, false);
    const last = m.idx[m.idx.length - 1];
    const correct = pitchName(sc[last]);
    return { text: `Listen to this melody in ${k} major, starting on ${pitchName(sc[m.idx[0]])}. What is its last note?`, audio: audio(sc, m), correct, wrong: r.shuffle(sc.slice(0, 7).map(pitchName).filter(x => x !== correct)).slice(0, 3), unit: KEYS[k].unit, explain: `The last note is degree ${last + 1} of ${k} major: ${correct}.` };
  },
  // written melody: name the degrees
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const m = makeMelody(r, 3, false);
    const opt = (mm) => mm.idx.map(i => i + 1).join(' ');
    const wrongs = []; let guard = 0;
    while (wrongs.length < 3 && guard++ < 30) { const w = alter(r, m); if (!sameIdx(w, m) && !wrongs.some(x => sameIdx(x, w))) wrongs.push(w); }
    if (wrongs.length < 3) return null;
    return { text: `This melody is in ${k} major. Which scale degrees are these notes?`, notation: { key: k, time: '4/4', bars: [events(sc, m)], noEnd: true }, correct: opt(m), wrong: wrongs.map(opt), mono: true, unit: KEYS[k].unit, explain: `${m.idx.map(i => pitchName(sc[i])).join(' ')} in ${k} major are degrees ${opt(m)}.` };
  },
  // method questions
  (r) => {
    const q = r.pick([
      { text: 'What is the first thing to do in a melodic dictation?', correct: 'Find and remember the tonic', wrong: ['Write down the last note', 'Count the number of notes', 'Guess the key signature'] },
      { text: 'Hearing a melody as scale degrees means', correct: 'naming each note by its position in the scale, 1 to 8', wrong: ['counting the semitones between every pair of notes', 'writing the rhythm first', 'singing the melody an octave lower'] },
      { text: 'Which scale degree pulls most strongly up to the tonic?', correct: 'Degree 7, the leading note', wrong: ['Degree 2', 'Degree 5', 'Degree 4'] },
      { text: 'A melody in C major that goes 1 3 5 is', correct: 'C E G', wrong: ['C D E', 'C F G', 'C E F'] },
      { text: 'A melody in G major that goes 5 4 3 2 1 is', correct: 'D C B A G', wrong: ['G A B C D', 'D C B♭ A G', 'E D C B A'] },
      { text: 'The most common dictation mistake is', correct: 'hearing a step as a repeated note, or a 3rd as a 2nd', wrong: ['writing the wrong clef', 'hearing a leap as an octave', 'forgetting the time signature'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];

export function bank(unit = 1, seed = 9) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L9', quizLength: 10, passMark: 70 };
