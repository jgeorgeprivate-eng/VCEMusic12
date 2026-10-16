// L11 Chord progressions: V–I, ii–V–I, I–IV–V–I, I–V–vi–IV.
import { PROGRESSIONS, progressionChords, triad, pitchName, toMidi, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS, ROMAN, keyScale } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const keysFor = (unit) => unit >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;
const labels = PROGRESSIONS.map(p => p.label);
function chordAudio(chords, withBass = true) { return chords.map(t => ({ midis: (withBass ? [toMidi(t.root) - 12] : []).concat(t.notes.map(toMidi)), beats: 1.5 })); }

const templates = [
  // hear a progression
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS);
    const chords = progressionChords(k, prog);
    return { text: `Listen to these chords in ${k} major. Which progression is it?`, audio: chordAudio(chords), correct: prog.label, wrong: labels.filter(x => x !== prog.label), unit: KEYS[k].unit, explain: `${prog.label}: ${chords.map(t => t.name).join(', ')}. ${prog.id === 'I-V-vi-IV' ? 'Four chords that do not end on the tonic, with the minor chord after V.' : prog.id === 'ii-V-I' ? 'Three chords beginning on a minor chord and ending at home.' : prog.id === 'V-I' ? 'Two chords: tension then arrival.' : 'Four chords that leave home, build on V and return.'}` };
  },
  // chords of a progression in a key
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS);
    const chords = progressionChords(k, prog);
    const correct = chords.map(t => t.name.replace(' major', '').replace(' minor', 'm')).join(' – ');
    const wrong = unique(PROGRESSIONS.filter(p => p !== prog).map(p => progressionChords(k, p).map(t => t.name.replace(' major', '').replace(' minor', 'm')).join(' – ')));
    return { text: `Which chords make ${prog.label} in ${k} major?`, correct, wrong: r.shuffle(wrong).slice(0, 3), mono: true, unit: KEYS[k].unit, explain: `In ${k} major: ${chords.map(t => t.roman + ' = ' + t.name).join(', ')}.` };
  },
  // roman numerals for a given chord list
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS);
    const chords = progressionChords(k, prog);
    const text = chords.map(t => t.name.replace(' major', '').replace(' minor', 'm')).join(', ');
    return { text: `In ${k} major, which progression is ${text}?`, correct: prog.label, wrong: labels.filter(x => x !== prog.label), unit: KEYS[k].unit, explain: `${chords.map(t => t.name.replace(' major', '').replace(' minor', 'm') + ' is ' + t.roman).join(', ')}.` };
  },
  // the chord shown by roman numeral in key
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick([1, 2, 4, 5, 6]); const t = triad(k, d);
    return { text: `What is chord ${t.roman} in ${k} major?`, correct: t.name, wrong: r.shuffle([1, 2, 4, 5, 6].filter(x => x !== d).map(x => triad(k, x).name)).slice(0, 3), unit: KEYS[k].unit, explain: `${t.roman} is built on degree ${d}, ${pitchName(t.notes[0])}: ${t.name}.` };
  },
  // bass line of a progression
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS);
    const chords = progressionChords(k, prog);
    const correct = chords.map(t => pitchName(t.root)).join(' ');
    const wrong = unique(PROGRESSIONS.filter(p => p !== prog).map(p => progressionChords(k, p).map(t => pitchName(t.root)).join(' ')));
    return { text: `What is the bass line (the chord roots) of ${prog.label} in ${k} major?`, correct, wrong: r.shuffle(wrong).slice(0, 3), mono: true, unit: KEYS[k].unit, explain: `The roots of ${chords.map(t => t.roman).join(', ')} in ${k} major are ${correct}.` };
  },
  // concepts
  (r) => {
    const q = r.pick([
      { text: 'What is a cadence?', correct: 'The chords that end a phrase', wrong: ['A fast passage of notes', 'The first chord of a piece', 'A change of key'] },
      { text: 'Which progression is a perfect cadence?', correct: 'V – I', wrong: ['I – IV', 'ii – V', 'I – vi'] },
      { text: 'Why does V pull so strongly to I?', correct: 'It contains the leading note, which rises to the tonic', wrong: ['It is the loudest chord', 'It is a minor chord', 'It contains the tonic note'] },
      { text: 'What are the primary chords of a major key?', correct: 'I, IV and V', wrong: ['I, ii and iii', 'ii, V and I', 'vi, IV and V'] },
      { text: 'Which progression ends somewhere other than the tonic chord?', correct: 'I – V – vi – IV', wrong: ['V – I', 'ii – V – I', 'I – IV – V – I'] },
      { text: 'In ii – V – I, which chord is minor?', correct: 'ii', wrong: ['V', 'I', 'All three'] },
      { text: 'In I – V – vi – IV, which chord is minor?', correct: 'vi', wrong: ['I', 'V', 'IV'] },
      { text: 'A chord progression written in Roman numerals', correct: 'can be played in any key', wrong: ['only works in C major', 'shows the melody', 'shows the rhythm'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // hear: does it end at home?
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS);
    const chords = progressionChords(k, prog);
    const home = prog.degrees[prog.degrees.length - 1] === 1;
    return { text: 'Listen. Does this progression end on the tonic chord?', audio: chordAudio(chords), correct: home ? 'Yes, it ends on I' : 'No, it ends on IV', wrong: [home ? 'No, it ends on IV' : 'Yes, it ends on I', 'It ends on V', 'It ends on vi'], unit: KEYS[k].unit, explain: `${prog.label}: the last chord is ${chords[chords.length - 1].roman}.` };
  },
];

export function bank(unit = 1, seed = 11) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L11', quizLength: 10, passMark: 70 };
