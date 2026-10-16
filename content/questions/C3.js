// C3 Bass lines.
import { makeBank, unique } from './_util.js';
import { triad, pitchName, MAJOR_KEYS_U1, MAJOR_KEYS_U2, KEYS, ROMAN, PROGRESSIONS, progressionChords } from '../../js/theory.js';
const keysFor = (u) => u >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;
const PATTERNS = [
  { n: 'Root notes', d: 'One note per chord, the root', feel: 'calm and simple' },
  { n: 'Root and fifth', d: 'The root alternating with the fifth of the chord', feel: 'bouncy and danceable, the oom-pah' },
  { n: 'Broken chords', d: 'The notes of the chord played one after another', feel: 'flowing and gentle' },
  { n: 'Walking bass', d: 'A note on every beat, moving mostly by step toward the next root', feel: 'lively and jazzy' },
];
const templates = [
  (r) => { const p = r.pick(PATTERNS); return { text: `Which bass pattern is this: ${p.d.toLowerCase()}?`, correct: p.n, wrong: PATTERNS.filter(x => x !== p).map(x => x.n), explain: `${p.n}: ${p.d.toLowerCase()}.` }; },
  (r) => { const p = r.pick(PATTERNS); return { text: `Which bass pattern sounds ${p.feel}?`, correct: p.n, wrong: PATTERNS.filter(x => x !== p).map(x => x.n), explain: `${p.n} sounds ${p.feel}.` }; },
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const prog = r.pick(PROGRESSIONS); const cs = progressionChords(k, prog);
    const correct = cs.map(t => pitchName(t.root)).join(' ');
    const wrong = unique(PROGRESSIONS.filter(p => p !== prog).map(p => progressionChords(k, p).map(t => pitchName(t.root)).join(' ')));
    return { text: `What are the root notes for a bass line under ${prog.label} in ${k} major?`, correct, wrong: r.shuffle(wrong).slice(0, 3), mono: true, unit: KEYS[k].unit, explain: `The roots of ${prog.label} in ${k} major: ${correct}.` };
  },
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const d = r.pick([1, 4, 5]); const t = triad(k, d);
    const correct = `${pitchName(t.notes[0])} and ${pitchName(t.notes[2])}`;
    return { text: `For a root-and-fifth bass under chord ${ROMAN[d - 1]} in ${k} major, which two notes alternate?`, correct, wrong: r.shuffle([`${pitchName(t.notes[0])} and ${pitchName(t.notes[1])}`, `${pitchName(t.notes[1])} and ${pitchName(t.notes[2])}`, `${pitchName(t.notes[2])} and ${pitchName(t.notes[1])}`, `${pitchName(triad(k, d === 1 ? 5 : 1).notes[0])} and ${pitchName(triad(k, d === 1 ? 5 : 1).notes[2])}`]).slice(0, 3), unit: KEYS[k].unit, explain: `${ROMAN[d - 1]} is ${t.notes.map(pitchName).join(' ')}; the root is ${pitchName(t.notes[0])} and the fifth is ${pitchName(t.notes[2])}.` };
  },
  (r) => {
    const q = r.pick([
      { text: 'What two jobs does a bass line do?', correct: 'It shows which chord is sounding and gives the music rhythmic drive', wrong: ['It carries the melody and the words', 'It sets the key signature and the clef', 'It plays the loudest and highest notes'] },
      { text: 'On beat 1 of a bar, the bass note should usually be', correct: 'the root of that bar\'s chord', wrong: ['the fifth of the chord', 'any scale note', 'a rest'] },
      { text: 'The oom-pah-pah of a waltz is which bass pattern?', correct: 'Root and fifth', wrong: ['Walking bass', 'Broken chords', 'Root notes'] },
      { text: 'A walking bass is the sound of', correct: 'jazz and blues', wrong: ['plainchant', 'a lullaby', 'a hymn'] },
      { text: 'What is an arpeggio?', correct: 'The notes of a chord played one after another', wrong: ['A chord played all at once', 'A scale played fast', 'A repeated single note'] },
      { text: 'If the chord changes in the middle of a bar, the bass', correct: 'changes to the new root with it', wrong: ['keeps the first root', 'rests', 'plays the melody'] },
      { text: 'In the MIDI export from the melody writer, the bass is', correct: 'its own track', wrong: ['mixed into the melody track', 'left out', 'replaced by drums'] },
      { text: 'Which pattern plays the most notes per bar in 4/4?', correct: 'Walking bass or broken chords (four per bar)', wrong: ['Root notes (one per bar)', 'Root and fifth (two per bar)', 'They all play the same number'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 33) { return makeBank(templates, unit, seed); }
export const meta = { code: 'C3', quizLength: 10, passMark: 70 };
