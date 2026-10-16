// P3 Designing exercises.
import { makeBank } from './_util.js';
import { KEYS, keyLabel, MAJOR_KEYS_U2, MINOR_KEYS } from '../../js/theory.js';
const PROB = [
  ['uneven semiquavers in a scale run', 'The scale in dotted rhythms, then reversed, then straight'], ['leaps of a third throughout the melody', 'The scale in thirds'], ['arpeggio passages', 'Broken triads on each degree'], ['tone and tuning on long notes', 'Long notes on the tonic triad against a drone'], ['two slurred, two tongued in every bar', 'The scale with that articulation pattern'], ['a hard passage that falls apart at tempo', 'Loop the hardest two beats with the metronome at half speed and build up'], ['an insecure ending to a run', 'Play the passage from the end backwards, one beat at a time'], ['triplets in a fast section', 'The scale in triplets'],
];
const P3_MORE = [
  ['What does the scale slurred in pairs practise?', 'Tonguing the first note of each pair and carrying the air through the slur'],
  ['What does the scale in dotted rhythms practise?', 'Placing each pair of notes exactly so straight semiquavers even out'],
  ['What do long notes on the tonic triad practise?', 'Even tone and tuning on each note'],
  ['What does the two-octave scale practise?', 'Evenness of tone and fingers across both octaves'],
  ['What should a warm-up for a minor piece use?', 'The natural minor scale and its triads'],
  ['What do broken triads on each degree let you hear?', 'Which triads are major and which minor'],
  ['How long should a general warm-up be?', 'Short, unless it prepares a specific bar'],
  ['Which tool helps you hear tuning on long notes?', 'The drone and the tuner together'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P3_MORE); return { text: s, correct: t, wrong: r.shuffle(P3_MORE.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), explain: `${t}.` }; },

  (r) => { const [p, e] = r.pick(PROB); return { text: `The piece has ${p}. Which exercise prepares it best?`, correct: e, wrong: r.shuffle(PROB.filter(x => x[1] !== e).map(x => x[1])).slice(0, 3), explain: `${e}.` }; },
  (r) => { const k = r.pick(MAJOR_KEYS_U2.concat(MINOR_KEYS)); return { text: `Your piece is in ${keyLabel(k)}. Which scale should begin your warm-up?`, correct: keyLabel(k), wrong: r.shuffle(MAJOR_KEYS_U2.concat(MINOR_KEYS).filter(x => x !== k).map(keyLabel)).slice(0, 3), unit: KEYS[k].unit, explain: `Warm up with the scale of the piece: ${keyLabel(k)}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'Why build exercises from the piece rather than choosing scales at random?', correct: 'The scale and rhythm of the hard bar prepare that bar directly', wrong: ['Random scales are harder', 'It saves reeds', 'The examiner asks for it'] },
      { text: 'What does the scale in thirds prepare?', correct: 'Leaps and finger coordination', wrong: ['Breathing', 'Counting rests', 'Reading bass clef'] },
      { text: 'What do broken triads on each degree prepare?', correct: 'Arpeggio passages, and hearing the harmony', wrong: ['Tonguing only', 'Rests', 'Sight-reading words'] },
      { text: 'How do dotted rhythms fix uneven semiquavers?', correct: 'Playing long-short then short-long forces each pair of notes to be placed exactly, so the straight version evens out', wrong: ['They make the passage slower', 'They remove the hard notes', 'They change the key'] },
      { text: 'How should you raise the metronome on a hard passage?', correct: 'By a few beats a minute at a time from half speed', wrong: ['Straight to full tempo', 'Only on performance day', 'By doubling each time'] },
      { text: 'Playing a passage from the end backwards, one beat at a time, makes', correct: 'the ending always secure', wrong: ['the piece shorter', 'the beginning harder', 'the key change'] },
      { text: 'Long notes against a drone train', correct: 'tone and tuning, by hearing and removing the beats between the two notes', wrong: ['speed', 'sight-reading', 'counting'] },
      { text: 'An exercise is well chosen if', correct: 'you can say which bar of the piece it prepares', wrong: ['it is long', 'it is in a different key', 'it is loud'] },
      { text: 'What does the exercise generator write out?', correct: 'Scale, scale in thirds, broken triads, dotted and slurred scales, and long notes in a chosen key', wrong: ['The whole piece', 'A list of reeds', 'A practice timetable'] },
      { text: 'Where should you keep the exercises you use?', correct: 'In the piece planner, with a note on what each is for', wrong: ['Nowhere; memorise them', 'In the game', 'In the credits page'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 43) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'P3', quizLength: 10, passMark: 70 };
