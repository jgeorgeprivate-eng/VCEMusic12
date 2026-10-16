// A2 Compositional devices.
import { makeBank } from './_util.js';
import { toMidi, parsePitch } from '../../js/theory.js';

const DEVICES = ['Repetition', 'Variation', 'Contrast', 'Transition'];
const TECH = [
  { t: 'Sequence', d: 'The same idea repeated starting on a higher or lower note', dev: 'Variation' },
  { t: 'Augmentation', d: 'The idea played with longer note values, so it is slower', dev: 'Variation' },
  { t: 'Diminution', d: 'The idea played with shorter note values, so it is faster', dev: 'Variation' },
  { t: 'Fragmentation', d: 'Only part of the idea is used, often repeated or passed around', dev: 'Variation' },
  { t: 'Inversion', d: 'The idea turned upside down, so each rise becomes a fall', dev: 'Variation' },
  { t: 'Imitation', d: 'One part copies a phrase another part has just played', dev: 'Repetition' },
  { t: 'Canon', d: 'Every part has the same line, entering one after another', dev: 'Repetition' },
  { t: 'Countermelody', d: 'A second, independent melody played with the main one', dev: 'Contrast' },
  { t: 'Ostinato', d: 'A short pattern repeated over and over under changing music', dev: 'Repetition' },
  { t: 'Key change', d: 'The music moves into a new key', dev: 'Contrast' },
  { t: 'Bridge', d: 'A linking section that leads to the chorus or final section', dev: 'Transition' },
];
const M = [67, 67, 67, 64].map(m => m);   // G G G E
function motif(midis, beats) { return midis.map((m, i) => ({ midi: m, beats: beats[i] })); }
const B = [0.5, 0.5, 0.5, 2];

const templates = [
  (r) => { const t = r.pick(TECH); return { text: `Which technique is this: ${t.d.toLowerCase()}?`, correct: t.t, wrong: r.shuffle(TECH.filter(x => x !== t).map(x => x.t)).slice(0, 3), explain: `${t.t}: ${t.d.toLowerCase()}.` }; },
  (r) => { const t = r.pick(TECH); return { text: `What does ${t.t.toLowerCase()} mean?`, correct: t.d, wrong: r.shuffle(TECH.filter(x => x !== t).map(x => x.d)).slice(0, 3), explain: `${t.t}: ${t.d.toLowerCase()}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'What are the four main compositional devices?', correct: 'Repetition, variation, contrast and transition', wrong: ['Melody, harmony, rhythm and form', 'Verse, chorus, bridge and coda', 'Sequence, canon, fugue and ostinato'] },
      { text: 'What is a motif?', correct: 'A short musical idea a piece is built from', wrong: ['A complete melody', 'The key of a piece', 'A type of chord'] },
      { text: 'Why does a composer use repetition?', correct: 'So the listener learns an idea and recognises it when it returns', wrong: ['To make the piece shorter', 'To change the key', 'To avoid using a melody'] },
      { text: 'Contrast is', correct: 'introducing clearly new material', wrong: ['repeating the idea unchanged', 'slowing the idea down', 'playing the idea in canon'] },
      { text: 'A transition is', correct: 'music that connects one section to the next and prepares the change', wrong: ['the first statement of the theme', 'the loudest point of a piece', 'a repeat of the chorus'] },
      { text: 'A round such as Frère Jacques is an example of', correct: 'canon', wrong: ['augmentation', 'contrast', 'fragmentation'] },
      { text: 'Beethoven builds the first movement of his Fifth Symphony mainly from', correct: 'a four-note motif', wrong: ['a long song-like melody', 'a twelve-bar blues', 'a drum pattern'] },
      { text: 'A repeated bass pattern under a changing melody is', correct: 'an ostinato', wrong: ['a sequence', 'a cadence', 'a fragment'] },
      { text: 'Which device does a chorus returning after every verse show?', correct: 'Repetition', wrong: ['Variation', 'Transition', 'Inversion'] },
      { text: 'Playing a motif a step lower, then a step lower again, is', correct: 'a sequence', wrong: ['an inversion', 'a canon', 'augmentation'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // hear a technique applied to the motif
  (r) => {
    const kind = r.pick(['Repetition', 'Sequence', 'Augmentation', 'Diminution', 'Inversion', 'Fragmentation']);
    let second;
    if (kind === 'Repetition') second = motif(M, B);
    else if (kind === 'Sequence') second = motif(M.map(m => m - 2), B);
    else if (kind === 'Augmentation') second = motif(M, B.map(b => b * 2));
    else if (kind === 'Diminution') second = motif(M, B.map(b => b / 2));
    else if (kind === 'Inversion') second = motif([67, 67, 67, 71], B);
    else second = [...motif(M.slice(0, 3), [0.5, 0.5, 0.5]), { rest: true, beats: 0.5 }, ...motif(M.slice(0, 3), [0.5, 0.5, 0.5]), { rest: true, beats: 0.5 }];
    const audio = [...motif(M, B), { rest: true, beats: 1 }, ...second];
    return { text: 'Listen to a motif, then a treatment of it. Which technique is used?', audio, correct: kind, wrong: r.shuffle(['Repetition', 'Sequence', 'Augmentation', 'Diminution', 'Inversion', 'Fragmentation'].filter(x => x !== kind)).slice(0, 3), explain: { Repetition: 'The motif comes back unchanged.', Sequence: 'The motif is repeated a step lower.', Augmentation: 'Every note is twice as long.', Diminution: 'Every note is half as long.', Inversion: 'The fall at the end becomes a rise.', Fragmentation: 'Only the first three notes are used, twice.' }[kind] };
  },
];
export function bank(unit = 1, seed = 22) { return makeBank(templates, unit, seed); }
export const meta = { code: 'A2', quizLength: 10, passMark: 70 };
