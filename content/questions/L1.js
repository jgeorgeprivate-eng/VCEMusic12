// L1 Reading notation. Answers computed from theory.js.
import { pitch, pitchName, toMidi, parsePitch, LETTERS, diatonicIndex, pitchFromDiatonic } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const STAFF_NOTES = ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
const LINES = ['E4', 'G4', 'B4', 'D5', 'F5'];
const SPACES = ['F4', 'A4', 'C5', 'E5'];

function neighbours(p, r) {
  const di = diatonicIndex(p);
  return unique([-2, -1, 1, 2, 3, 7].map(d => pitchName(pitchFromDiatonic(di + d))).filter(x => x !== pitchName(p)));
}

const templates = [
  // name a note on the staff
  (r) => {
    const p = parsePitch(r.pick(STAFF_NOTES));
    const correct = pitchName(p);
    return { text: 'What is the name of this note?', notation: { key: 'C', events: [{ pitches: [p], dur: 192 }], noEnd: true }, correct, wrong: r.shuffle(neighbours(p, r)).slice(0, 3),
      explain: `${correct}${p.step === 'C' && p.oct === 4 ? ' (middle C, on the first ledger line below the staff)' : ''}. Count up from the bottom line, E, one letter per line or space.` };
  },
  // name a note with an octave number
  (r) => {
    const p = parsePitch(r.pick(['C4', 'G4', 'C5', 'E5', 'A5', 'C6', 'A3', 'D4']));
    const correct = pitchName(p, { octave: true });
    const wrong = unique([pitchName({ ...p, oct: p.oct + 1 }, { octave: true }), pitchName({ ...p, oct: p.oct - 1 }, { octave: true }), pitchName(pitchFromDiatonic(diatonicIndex(p) + 1), { octave: true }), pitchName(pitchFromDiatonic(diatonicIndex(p) - 1), { octave: true })]);
    return { text: 'Name this note with its octave number (middle C is C4).', notation: { key: 'C', events: [{ pitches: [p], dur: 192 }], noEnd: true }, correct, wrong: r.shuffle(wrong).slice(0, 3),
      explain: `${correct}. The number goes up by one each time you pass a C going upward.` };
  },
  // lines or spaces
  (r) => {
    const which = r() < 0.5 ? 'lines' : 'spaces';
    const correct = which === 'lines' ? 'E G B D F' : 'F A C E';
    return { text: `From the bottom up, what are the names of the ${which} of the treble staff?`, correct, wrong: r.shuffle(['F A C E', 'E G B D F', 'G B D F A', 'A C E G', 'D F A C E', 'E F G A B'].filter(x => x !== correct)).slice(0, 3), explain: which === 'lines' ? 'The lines are E G B D F.' : 'The spaces spell FACE.' };
  },
  // which note is on the nth line/space
  (r) => {
    const lines = r() < 0.5;
    const n = r.int(lines ? 5 : 4);
    const p = parsePitch((lines ? LINES : SPACES)[n]);
    const correct = pitchName(p);
    return { text: `Which note sits ${lines ? 'on' : 'in'} the ${['first', 'second', 'third', 'fourth', 'fifth'][n]} ${lines ? 'line' : 'space'} from the bottom of the treble staff?`, correct, wrong: r.shuffle(LETTERS.filter(x => x !== correct)).slice(0, 3), explain: `${lines ? 'Lines from the bottom: E G B D F' : 'Spaces from the bottom: F A C E'}. The ${['first', 'second', 'third', 'fourth', 'fifth'][n]} is ${correct}.` };
  },
  // accidental meaning
  (r) => {
    const q = r.pick([
      { text: 'What does a sharp sign do to a note?', correct: 'Raises it by one semitone', wrong: ['Lowers it by one semitone', 'Raises it by one tone', 'Cancels a previous flat'] },
      { text: 'What does a flat sign do to a note?', correct: 'Lowers it by one semitone', wrong: ['Raises it by one semitone', 'Lowers it by one tone', 'Makes it last longer'] },
      { text: 'What does a natural sign do?', correct: 'Cancels a sharp or flat', wrong: ['Raises the note by a semitone', 'Lowers the note by a semitone', 'Repeats the previous note'] },
      { text: 'How long does an accidental written beside a note last?', correct: 'Until the end of the bar', wrong: ['Only for that one note', 'Until the end of the piece', 'Until the next rest'] },
      { text: 'Which note is the same key on a piano as E♯?', correct: 'F', wrong: ['E♭', 'F♯', 'D♯'] },
      { text: 'Which note is the same key on a piano as C♭?', correct: 'B', wrong: ['C♯', 'B♭', 'D'] },
      { text: 'Where is an accidental written?', correct: 'To the left of the note, at the same height', wrong: ['To the right of the note', 'Above the staff', 'At the start of the line'] },
      { text: 'What does the treble clef fix on the staff?', correct: 'The second line from the bottom is G', wrong: ['The bottom line is C', 'The middle line is C', 'The top line is G'] },
      { text: 'Where is middle C written in the treble clef?', correct: 'On the first ledger line below the staff', wrong: ['On the bottom line', 'In the first space', 'On the first ledger line above the staff'] },
      { text: 'What are ledger lines for?', correct: 'Writing notes above or below the five lines of the staff', wrong: ['Showing where bars begin', 'Marking the key signature', 'Showing which notes are sharp'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // next letter name
  (r) => {
    const i = r.int(7); const up = r() < 0.5;
    const correct = LETTERS[((i + (up ? 1 : -1)) % 7 + 7) % 7];
    return { text: `Which letter name comes ${up ? 'after' : 'before'} ${LETTERS[i]} going ${up ? 'up' : 'down'}?`, correct, wrong: r.shuffle(LETTERS.filter(x => x !== correct)).slice(0, 3), explain: `The letters go A B C D E F G and then repeat. ${up ? 'After' : 'Before'} ${LETTERS[i]} comes ${correct}.` };
  },
  // sharp or flat note on staff
  (r) => {
    const base = parsePitch(r.pick(['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']));
    const acc = r() < 0.5 ? 1 : -1;
    const p = { ...base, acc };
    const correct = pitchName(p);
    const wrong = unique([pitchName(base), pitchName({ ...base, acc: -acc }), pitchName(pitchFromDiatonic(diatonicIndex(base) + 1, acc)), pitchName(pitchFromDiatonic(diatonicIndex(base) - 1, acc))].filter(x => x !== correct));
    return { text: 'What is the name of this note?', notation: { key: 'C', events: [{ pitches: [p], dur: 192 }], noEnd: true }, correct, wrong: r.shuffle(wrong).slice(0, 3), explain: `The note is on ${pitchName(base)} and has a ${acc > 0 ? 'sharp' : 'flat'} before it, so it is ${correct}.` };
  },
  // semitone neighbours on the keyboard
  (r) => {
    const pairs = [['E', 'F'], ['B', 'C']];
    const [a, b] = r.pick(pairs);
    const correct = `${a} and ${b}`;
    return { text: 'Which pair of white keys has no black key between them, so the two notes are a semitone apart?', correct, wrong: r.shuffle(['C and D', 'F and G', 'G and A', 'A and B', 'D and E'].filter(x => x !== correct)).slice(0, 3), explain: 'E to F and B to C are the two white-key semitones.' };
  },
];

export function bank(unit = 1, seed = 1) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L1', quizLength: 10, passMark: 70 };
