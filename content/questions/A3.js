// A3 Texture types.
import { makeBank } from './_util.js';
import { toMidi, parsePitch, triad } from '../../js/theory.js';

const TEX = ['Monophonic', 'Homophonic', 'Polyphonic', 'Melody and accompaniment', 'Layering'];
const SIT = [
  ['A choir sings a hymn with all four parts moving together in the same rhythm', 'Homophonic'],
  ['A single oboe plays a melody with nothing else', 'Monophonic'],
  ['A singer with a guitarist strumming chords', 'Melody and accompaniment'],
  ['Three voices sing the same tune, each starting a bar later', 'Polyphonic'],
  ['A crowd sings the national anthem unaccompanied, all on the same line', 'Monophonic'],
  ['A fugue in which each voice enters with the subject in turn', 'Polyphonic'],
  ['Drums enter, then bass, then keyboard, then the voice', 'Layering'],
  ['A piano piece with the tune in the right hand and broken chords in the left', 'Melody and accompaniment'],
  ['Two flutes play different independent melodies at the same time', 'Polyphonic'],
  ['A brass band plays block chords under a cornet solo', 'Homophonic'],
  ['A chant sung by monks in unison', 'Monophonic'],
  ['A string quartet in which the first violin has the tune and the others accompany', 'Melody and accompaniment'],
  ['A solo flute plays a cadenza with the orchestra silent', 'Monophonic'],
  ['A round in which each singer starts the same tune two bars after the last', 'Polyphonic'],
  ['A pop song where the synth pad, then the bass, then the drums come in one at a time', 'Layering'],
  ['A church congregation sings a hymn in four-part harmony, all parts in the same rhythm', 'Homophonic'],
  ['A jazz pianist plays a melody with chords in the left hand', 'Melody and accompaniment'],
  ['A bass line and a trumpet melody that are equally important and independent', 'Polyphonic'],
  ['One singer alone, unaccompanied', 'Monophonic'],
  ['A guitar strums chords under a singer', 'Melody and accompaniment'],
];
const mel = ['E4', 'G4', 'C5', 'G4', 'F4', 'A4', 'C5', 'A4'].map(p => toMidi(parsePitch(p)));
const counter = ['C4', 'C4', 'E4', 'E4', 'F4', 'F4', 'C4', 'C4'].map(p => toMidi(parsePitch(p)));
function audioFor(kind) {
  const n = mel.length; const out = [];
  for (let i = 0; i < n; i++) {
    if (kind === 'Monophonic') out.push({ midi: mel[i], beats: 0.75 });
    else if (kind === 'Melody and accompaniment') out.push({ midis: i % 4 === 0 ? [mel[i], ...triad('C', i < 4 ? 1 : 4).notes.map(toMidi).map(m => m - 12)] : [mel[i]], beats: 0.75 });
    else if (kind === 'Polyphonic') out.push({ midis: [mel[i], counter[i] - 12 + (i % 2 ? 2 : 0)], beats: 0.75 });
    else out.push({ midis: [mel[i], mel[i] - 4 - (i % 3 ? 1 : 0), mel[i] - 7 - (i % 3 ? 1 : 0)], beats: 0.75 });
  }
  return out;
}
const templates = [
  (r) => { const [s, t] = r.pick(SIT); return { text: `${s}. What is the texture?`, correct: t, wrong: r.shuffle(TEX.filter(x => x !== t)).slice(0, 3), explain: `${t}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'What is monophonic texture?', correct: 'A single melodic line with no accompaniment', wrong: ['A melody with chords under it', 'Two independent melodies at once', 'Music for one instrument only'] },
      { text: 'What is polyphonic texture?', correct: 'Two or more independent melodies sounding together', wrong: ['A melody with a drum beat', 'One melody sung by many people', 'Chords with no melody'] },
      { text: 'What is homophonic texture?', correct: 'One main melody with other parts supporting it', wrong: ['Several equal melodies', 'A single unaccompanied line', 'Music with no clear beat'] },
      { text: 'Which word describes parts being added one at a time?', correct: 'Layering', wrong: ['Modulation', 'Imitation', 'Augmentation'] },
      { text: 'A fugue is an example of which texture?', correct: 'Polyphonic', wrong: ['Monophonic', 'Homophonic', 'Melody and accompaniment'] },
      { text: 'If forty people sing exactly the same melody with no accompaniment, the texture is', correct: 'monophonic', wrong: ['polyphonic', 'homophonic', 'layered'] },
      { text: 'Melody and accompaniment is a kind of', correct: 'homophonic texture', wrong: ['polyphonic texture', 'monophonic texture', 'layering'] },
      { text: 'A change of texture in a piece usually', correct: 'marks something important, such as a new section', wrong: ['means the key has changed', 'means the piece is ending', 'has no effect on the listener'] },
      { text: 'The subject of a fugue is', correct: 'the short theme each voice introduces in turn', wrong: ['the bass line', 'the final chord', 'the loudest section'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  (r) => {
    const kind = r.pick(['Monophonic', 'Melody and accompaniment', 'Polyphonic', 'Homophonic']);
    const label = kind === 'Homophonic' ? 'Homophonic (chords moving together)' : kind;
    const opts = ['Monophonic', 'Melody and accompaniment', 'Polyphonic', 'Homophonic (chords moving together)'];
    return { text: 'Listen. Which texture do you hear?', audio: audioFor(kind), correct: label, wrong: opts.filter(x => x !== label), explain: { Monophonic: 'One line alone.', 'Melody and accompaniment': 'A tune on top with chords underneath.', Polyphonic: 'Two independent lines at once.', Homophonic: 'All parts moving together in chords.' }[kind] };
  },
];
export function bank(unit = 1, seed = 23) { return makeBank(templates, unit, seed); }
export const meta = { code: 'A3', quizLength: 10, passMark: 70 };
