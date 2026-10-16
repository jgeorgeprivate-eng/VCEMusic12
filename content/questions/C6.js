// C6 Composing for effect (Unit 2).
import { makeBank } from './_util.js';
const EFFECTS = [
  { e: 'Calm', c: 'slow tempo, soft dynamics, legato, warm instrument, sustained chords or drone' },
  { e: 'Menacing', c: 'low register, growing dynamics, accents, low strings or brass, minor' },
  { e: 'Playful', c: 'fast tempo, high register, staccato, flute or piano, major' },
  { e: 'Grand', c: 'moderate tempo, full register, loud, marcato, brass, sustained chords, major' },
  { e: 'Cold and bleak', c: 'slow, high thin sound, very soft, bare fifth drone, minor' },
  { e: 'Rushing', c: 'very fast, continuous quavers, crescendo, strings' },
];
const CHANGES = [
  ['Slow the tempo from 140 to 60 and change nothing else', 'Calmer, heavier or sadder'],
  ['Move the melody up two octaves', 'Lighter, brighter or more delicate'],
  ['Change the tonality from major to minor', 'Darker, sadder or more serious'],
  ['Change the articulation from legato to staccato', 'More playful, nervous or mechanical'],
  ['Add a low drone under the melody', 'More tense, still or ominous'],
  ['Raise the dynamic from pp to ff', 'Grander, angrier or more joyful'],
  ['Replace the flute with low strings', 'Warmer, heavier or darker'],
  ['Add pulsing chords on every beat', 'More driven and urgent'],
];
const templates = [
  (r) => { const [c, e] = r.pick(CHANGES); return { text: `In the effect sandbox you ${c[0].toLowerCase() + c.slice(1)}. What happens to the effect?`, correct: e, wrong: r.shuffle(CHANGES.filter(x => x[1] !== e).map(x => x[1])).slice(0, 3), unit: 2, explain: `${c}: ${e.toLowerCase()}.` }; },
  (r) => { const x = r.pick(EFFECTS); return { text: `Which effect would these choices create: ${x.c}?`, correct: x.e, wrong: r.shuffle(EFFECTS.filter(y => y !== x).map(y => y.e)).slice(0, 3), unit: 2, explain: `${x.e}: ${x.c}.` }; },
  (r) => { const x = r.pick(EFFECTS); return { text: `You want the effect "${x.e}". Which set of choices fits?`, correct: x.c[0].toUpperCase() + x.c.slice(1), wrong: r.shuffle(EFFECTS.filter(y => y !== x).map(y => y.c[0].toUpperCase() + y.c.slice(1))).slice(0, 3), unit: 2, explain: `${x.e}: ${x.c}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'What should you decide before writing a single note of a piece for effect?', correct: 'The effect, in one or two precise words', wrong: ['The title', 'The number of bars', 'The clef'] },
      { text: 'Why is "nice" a poor intended effect?', correct: 'It gives you nothing to choose tempo, register or dynamics with', wrong: ['It is too long', 'It is a minor key', 'It is too fast'] },
      { text: 'Which two elements usually matter most for an effect?', correct: 'Tempo and tonality', wrong: ['Clef and key signature', 'Title and length', 'Bar lines and rests'] },
      { text: 'A composition for effect may use', correct: 'any sound source, including found and electronic sounds', wrong: ['only the oboe', 'only a piano', 'only staff notation'] },
      { text: 'What does the Describe button in the effect sandbox give you?', correct: 'A list of your settings in words for the write-up', wrong: ['A recording', 'A new melody', 'A mark out of ten'] },
      { text: 'How should a write-up of a piece for effect be ordered?', correct: 'Effect, then the choices, then which choices do most of the work', wrong: ['Title, composer, date', 'Notes, rests, bar lines', 'Tempo only'] },
      { text: 'A rain recording under a slow flute line is', correct: 'a composition for effect that a graphic score may document best', wrong: ['not music', 'a 12-bar blues', 'a fugue'] },
      { text: 'How can you test whether the effect works?', correct: 'Ask someone to name the effect without being told', wrong: ['Count the notes', 'Check the key signature', 'Play it louder'] },
      { text: 'Pulsing chords at a moderate tempo in a minor key suggest', correct: 'tension or menace', wrong: ['calm', 'playfulness', 'grandeur'] },
      { text: 'Changing a major tune to minor in the sandbox changes mainly its', correct: 'tonality, and so its mood', wrong: ['tempo', 'register', 'articulation'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), unit: 2, explain: q.correct + '.' };
  },
];
export function bank(unit = 2, seed = 36) { return makeBank(templates, 2, seed, 30); }
export const meta = { code: 'C6', quizLength: 10, passMark: 70 };
