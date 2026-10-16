// L7 Intervals: diatonic intervals in major keys up to one sharp or flat, within an octave.
import { diatonicIntervals, interval, pitchName, toMidi, MAJOR_KEYS_U1, keyScale } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const ALL_NAMES = ['minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave'];
const nearNames = (name, r) => r.shuffle(ALL_NAMES.filter(x => x !== name && !x.includes('augmented'))).slice(0, 3);
function pickInterval(r) {
  const k = r.pick(MAJOR_KEYS_U1);
  const list = diatonicIntervals(k).filter(iv => ALL_NAMES.includes(iv.name));
  return { k, iv: r.pick(list) };
}

const templates = [
  // name the interval shown
  (r) => {
    const { k, iv } = pickInterval(r);
    return { text: 'Name this interval.', notation: { key: k, events: [{ pitches: [iv.lo], dur: 48 }, { pitches: [iv.hi], dur: 48 }], noEnd: true }, correct: iv.name, wrong: nearNames(iv.name, r), explain: `${pitchName(iv.lo)} to ${pitchName(iv.hi)} is ${iv.number === 8 ? 'eight' : iv.number} letter name${iv.number > 1 ? 's' : ''} and ${iv.semitones} semitones: ${iv.name}.` };
  },
  // name the interval heard
  (r) => {
    const { k, iv } = pickInterval(r);
    const harmonic = r() < 0.3;
    const audio = harmonic ? [{ midis: [toMidi(iv.lo), toMidi(iv.hi)], beats: 2 }] : [{ midi: toMidi(iv.lo), beats: 1 }, { midi: toMidi(iv.hi), beats: 1 }];
    return { text: harmonic ? 'Listen to the two notes played together. What is the interval?' : 'Listen to the two notes. What is the interval?', audio, correct: iv.name, wrong: nearNames(iv.name, r), explain: `${iv.name}: ${iv.semitones} semitones.` };
  },
  // interval number from letters
  (r) => {
    const { k, iv } = pickInterval(r);
    const numName = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'][iv.number - 1];
    return { text: `What is the number of the interval from ${pitchName(iv.lo)} up to ${pitchName(iv.hi)}?`, correct: numName, wrong: r.shuffle(['2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'].filter(x => x !== numName)).slice(0, 3), explain: `Count the letter names from ${iv.lo.step} to ${iv.hi.step}, including both: ${iv.number === 8 ? 'eight, an octave' : iv.number + ', a ' + numName}.` };
  },
  // semitones in an interval
  (r) => {
    const name = r.pick(ALL_NAMES);
    const semis = { 'minor 2nd': 1, 'major 2nd': 2, 'minor 3rd': 3, 'major 3rd': 4, 'perfect 4th': 5, 'perfect 5th': 7, 'minor 6th': 8, 'major 6th': 9, 'minor 7th': 10, 'major 7th': 11, 'octave': 12 }[name];
    const correct = String(semis);
    return { text: `How many semitones are in a ${name}?`, correct, wrong: r.shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].filter(x => x !== correct)).slice(0, 3), explain: `A ${name} is ${semis} semitones.` };
  },
  // the note a given interval above
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1); const sc = keyScale(k);
    const iv = r.pick(diatonicIntervals(k).filter(x => x.lo.oct === sc[0].oct && x.number > 1 && x.number < 8));
    const correct = pitchName(iv.hi);
    return { text: `Which note is a ${iv.name} above ${pitchName(iv.lo)}?`, correct, wrong: r.shuffle(unique(sc.map(pitchName).filter(x => x !== correct))).slice(0, 3), explain: `${iv.number} letter names up from ${pitchName(iv.lo)} and ${iv.semitones} semitones: ${correct}.` };
  },
  // quality concepts
  (r) => {
    const q = r.pick([
      { text: 'Which intervals are called perfect rather than major or minor?', correct: 'Unison, 4th, 5th and octave', wrong: ['2nd, 3rd, 6th and 7th', '3rd and 6th only', 'All intervals'] },
      { text: 'A minor interval is', correct: 'one semitone smaller than the major interval of the same number', wrong: ['one semitone larger than the major interval', 'only found in minor keys', 'the same size as a major interval'] },
      { text: 'How do you find the number of an interval?', correct: 'Count the letter names from the lower note to the higher, including both', wrong: ['Count the semitones', 'Count the black keys between the notes', 'Count the lines on the staff'] },
      { text: 'Does a sharp or flat change the number of an interval?', correct: 'No, only the quality', wrong: ['Yes, it adds one to the number', 'Yes, it takes one from the number', 'Only in minor keys'] },
      { text: 'What is a diatonic interval?', correct: 'An interval whose two notes both belong to the scale of the key', wrong: ['An interval larger than an octave', 'An interval played by two instruments', 'An interval of exactly two tones'] },
      { text: 'Two notes of the same pitch sounded together are called', correct: 'a unison', wrong: ['an octave', 'a perfect 1st', 'a minor 2nd'] },
      { text: 'Which interval begins the tune Twinkle, Twinkle, Little Star?', correct: 'Perfect 5th', wrong: ['Perfect 4th', 'Major 3rd', 'Octave'] },
      { text: 'A melodic interval is', correct: 'two notes played one after the other', wrong: ['two notes played together', 'an interval in a minor key', 'an interval smaller than a 3rd'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // major or minor third heard
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1);
    const thirds = diatonicIntervals(k).filter(x => x.number === 3);
    const iv = r.pick(thirds);
    return { text: 'Listen. Is this third major or minor?', audio: [{ midi: toMidi(iv.lo), beats: 1 }, { midi: toMidi(iv.hi), beats: 1 }], correct: iv.name, wrong: [iv.name === 'major 3rd' ? 'minor 3rd' : 'major 3rd', 'perfect 4th', 'major 2nd'], explain: `${pitchName(iv.lo)} to ${pitchName(iv.hi)} is ${iv.semitones} semitones, a ${iv.name}.` };
  },
];

export function bank(unit = 1, seed = 7) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L7', quizLength: 10, passMark: 70 };
