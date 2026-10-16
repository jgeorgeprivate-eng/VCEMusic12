// C5 Organising a short piece.
import { makeBank } from './_util.js';
const PLANS = [['A B', 'Binary'], ['A B A', 'Ternary'], ['A B A C A', 'Rondo'], ['A A B', 'Bar form'], ['Verse Chorus Verse Chorus', 'Verse and chorus']];
const SCEN = [
  ['A piece with an opening section, a contrasting middle in the minor key, and the opening again', 'Ternary'],
  ['A short dance with two halves, each repeated', 'Binary'],
  ['A main tune that returns between two different episodes', 'Rondo'],
  ['A phrase heard twice, then a different phrase', 'Bar form'],
  ['A song whose chorus comes back after every verse', 'Verse and chorus'],
  ['Four bars of A, four bars of B, then A again', 'Ternary'],
  ['A, then B, then A, then C, then A', 'Rondo'],
  ['A and B, with no return of A', 'Binary'],
];
const templates = [
  (r) => { const [s, n] = r.pick(SCEN); return { text: `${s}. Which plan is this?`, correct: n, wrong: PLANS.filter(x => x[1] !== n).map(x => x[1]).slice(0, 3), explain: `${n}.` }; },
  (r) => { const [p, n] = r.pick(PLANS); return { text: `Which plan is ${p}?`, correct: n, wrong: PLANS.filter(x => x[1] !== n).map(x => x[1]).slice(0, 3), explain: `${p} is ${n.toLowerCase()}.` }; },
  (r) => { const [p, n] = r.pick(PLANS); return { text: `Write the sections of ${n.toLowerCase()} in letters.`, correct: p, wrong: PLANS.filter(x => x[0] !== p).map(x => x[0]).slice(0, 3), explain: `${n}: ${p}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'You have one phrase. Which plans suit it best once you write a contrasting phrase?', correct: 'Binary (A B) or bar form (A A B)', wrong: ['Rondo', 'Theme and variations', 'Head, solos, head'] },
      { text: 'You have two phrases. Which plan gives a satisfying return?', correct: 'Ternary (A B A)', wrong: ['Binary (A B)', 'Riff-based', '12-bar blues'] },
      { text: 'Rondo needs at least how many different ideas?', correct: 'Three', wrong: ['One', 'Two', 'Five'] },
      { text: 'How should a B section differ from A?', correct: 'In one or two things you can name, such as melody, key, register, rhythm, texture or dynamics', wrong: ['In every element at once', 'Not at all', 'Only in the tempo'] },
      { text: 'What makes the return of A sound final?', correct: 'Ending on the tonic with a longer note', wrong: ['Playing it faster', 'Changing its key', 'Leaving out its last bar'] },
      { text: 'What is a transition for?', correct: 'Linking sections so the change is not abrupt', wrong: ['Starting the piece', 'Replacing the chorus', 'Changing the time signature'] },
      { text: 'Which could serve as a short transition?', correct: 'A bar of the bass alone or a rising scale into the next section', wrong: ['A whole new melody', 'A key signature', 'A dynamic marking'] },
      { text: 'In a song, which section carries new words each time?', correct: 'The verse', wrong: ['The chorus', 'The coda', 'The riff'] },
      { text: 'What should a folio note on organisation include?', correct: 'The plan in letters, what each section is, and the contrast between sections', wrong: ['The composer\'s birthday', 'Only the title', 'The number of notes'] },
      { text: 'If a listener cannot tell where sections begin and end, the piece needs', correct: 'more contrast between sections or clearer endings', wrong: ['a faster tempo', 'more sharps', 'a longer title'] },
      { text: 'A A B is called', correct: 'bar form', wrong: ['binary', 'ternary', 'rondo'] },
      { text: 'A B A C A is called', correct: 'rondo', wrong: ['ternary', 'bar form', 'binary'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 35) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'C5', quizLength: 10, passMark: 70 };
