// C2 Writing a melody over chords.
import { makeBank, unique } from './_util.js';
import { triad, keyScale, pitchName, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS, ROMAN, transposeDiatonic } from '../../js/theory.js';
const keysFor = (u) => u >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;

const templates = [
  // which note is a chord tone of a given chord
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick([1, 4, 5]); const t = triad(k, d);
    const sc = keyScale(k).slice(0, 7);
    const correct = pitchName(r.pick(t.notes));
    const non = sc.filter(p => !t.notes.some(n => n.step === p.step)).map(pitchName);
    return { text: `The chord is ${ROMAN[d - 1]} in ${k} major (${t.name}). Which note is a chord tone, suitable for beat 1?`, correct, wrong: r.shuffle(non).slice(0, 3), unit: KEYS[k].unit, explain: `${t.name} is ${t.notes.map(pitchName).join(' ')}.` };
  },
  // which is a passing note
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const t = triad(k, 1); const sc = keyScale(k);
    const a = sc[0], b = sc[2]; const pass = sc[1];
    return { text: `In ${k} major over chord I, a melody goes ${pitchName(a)} ${pitchName(pass)} ${pitchName(b)} on three quavers. What is ${pitchName(pass)}?`, correct: 'A passing note between two chord tones', wrong: ['A chord tone', 'The root of the chord', 'A wrong note that must be removed'], unit: KEYS[k].unit, explain: `${pitchName(a)} and ${pitchName(b)} are in ${t.name}; ${pitchName(pass)} steps between them on a weak beat.` };
  },
  (r) => {
    const q = r.pick([
      { text: 'What is step one when writing a melody over chords?', correct: 'Put chord tones on the strong beats', wrong: ['Write the dynamics', 'Choose the articulation', 'Write only passing notes'] },
      { text: 'What do passing and neighbour notes add to a melody?', correct: 'Movement by step between chord tones, which makes it more singable', wrong: ['More leaps', 'A new key', 'Louder dynamics'] },
      { text: 'What is a neighbour note?', correct: 'A note a step above or below a chord tone that returns to it', wrong: ['A note in the next bar', 'A note in a different chord', 'The fifth of the chord'] },
      { text: 'Where is the high point of a well-shaped phrase usually?', correct: 'About two thirds of the way through', wrong: ['On the first note', 'On the last note', 'There should be no high point'] },
      { text: 'How does a phrase usually end?', correct: 'On a chord tone with a longer note', wrong: ['On a short passing note', 'On a rest only', 'With a leap up'] },
      { text: 'What is a phrase?', correct: 'A musical sentence, usually two or four bars, ending at a point of rest', wrong: ['A single chord', 'A whole piece', 'A change of key'] },
      { text: 'The second phrase of an eight-bar melody often', correct: 'starts like the first and ends differently, more finally', wrong: ['is in a different key', 'has no chord tones', 'repeats the first exactly'] },
      { text: 'What does the Chord notes button in the melody writer show?', correct: 'The keys that belong to the chord in the current bar', wrong: ['The melody of a famous piece', 'Every black key', 'The tempo'] },
      { text: 'What does exporting as MIDI let you do?', correct: 'Open the piece in notation or recording software', wrong: ['Print a picture of it', 'Play it on the oboe', 'Change its key automatically'] },
      { text: 'A melody made only of chord tones on every beat sounds', correct: 'correct but plain, moving in leaps', wrong: ['wrong', 'smooth and stepwise', 'in a minor key'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // which note set fits chord IV / V in key
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick([4, 5]); const t = triad(k, d);
    const correct = t.notes.map(pitchName).join(', ');
    return { text: `Which notes could go on the strong beats of a bar whose chord is ${ROMAN[d - 1]} in ${k} major?`, correct, wrong: r.shuffle(unique([1, 2, 4, 5, 6].filter(x => x !== d).map(x => triad(k, x).notes.map(pitchName).join(', ')))).slice(0, 3), unit: KEYS[k].unit, explain: `${ROMAN[d - 1]} is ${t.name}: ${correct}.` };
  },
];
export function bank(unit = 1, seed = 32) { return makeBank(templates, unit, seed); }
export const meta = { code: 'C2', quizLength: 10, passMark: 70 };
