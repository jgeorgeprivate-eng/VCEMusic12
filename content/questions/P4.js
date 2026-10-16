// P4 Practice planning and reflection.
import { makeBank } from './_util.js';
const GOALS = [['Get better at the piece', false], ['Bars 20 to 27 in one breath, three times in a row', true], ['Bars 12 to 14 at 80 beats a minute without a stumble', true], ['Practise more', false], ['Play the whole thing', false], ['The opening phrase from memory with a crescendo to bar 4', true], ['Learn the second page', false], ['The run in bar 9 slurred, at 100, five clean repetitions', true]];
const P4_MORE = [
  ['Your teacher says the phrasing in the slow movement is flat. What goes in the journal?', 'The feedback in their words, then the goal you will set from it'],
  ['You practised for forty minutes but cannot say what improved. What was missing?', 'A specific goal for the session'],
  ['You reach the goal in five minutes. What next?', 'Set the next small goal from the piece planner'],
  ['What is the minutes field for?', 'A record of practice time you can look back on'],
  ['Why keep the journal lines short?', 'So you will read them back'],
  ['How do you turn feedback into practice?', 'Write a goal from it, try it, and report the result'],
  ['What should the warm-up in a session consist of?', 'The exercises designed from the piece, about five minutes'],
  ['What makes "bars 12 to 14 at 80 without a stumble" a good goal?', 'It names a passage, a tempo and a test you can pass or fail'],
];
const P4_LINES = [
  ['Scales in G, the exercises for bar 12, then the slow movement', 'What I worked on'],
  ['The run was clean at 72 four times', 'What went well'],
  ['The top A is still sharp on the long note', 'One thing to improve'],
  ['Bars 20 to 27 in one breath, twice in a row', 'Next goal'],
  ['The phrasing in bars 5 to 8 held together', 'What went well'],
  ['Rushing the triplets in bar 30', 'One thing to improve'],
  ['The whole first page at 84 with the metronome', 'Next goal'],
  ['Long notes against the drone on D and A', 'What I worked on'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P4_MORE); return { text: s, correct: t, wrong: r.shuffle(P4_MORE.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), explain: `${t}.` }; },
  (r) => { const [line, part] = r.pick(P4_LINES); return { text: `Which part of the journal entry is this line: "${line}"?`, correct: part, wrong: ['What I worked on', 'What went well', 'One thing to improve', 'Next goal'].filter(x => x !== part).slice(0, 3), explain: `${part}.` }; },

  (r) => { const [g, good] = r.pick(GOALS); return { text: `Is this a good practice goal: "${g}"?`, correct: good ? 'Yes, it is specific and measurable' : 'No, it is not specific or measurable', wrong: [good ? 'No, it is not specific or measurable' : 'Yes, it is specific and measurable', 'It depends on the reed', 'Goals are not needed'], explain: good ? 'It names a passage, a condition and a measure.' : 'It does not say which passage, what condition, or how you would know it was done.' }; },
  (r) => {
    const q = r.pick([
      { text: 'What are the four parts of a journal entry?', correct: 'What I worked on, what went well, one thing to improve, next goal', wrong: ['Date, weather, mood, reed', 'Title, composer, key, tempo', 'Scales, pieces, sight-reading, theory'] },
      { text: 'What shape should a practice session have?', correct: 'Warm-up, work on the goal, play through something you can play, journal', wrong: ['Play the piece ten times', 'Scales only', 'Start with the hardest passage at full speed'] },
      { text: 'Where do practice goals come from?', correct: 'The challenges in the piece planner', wrong: ['The game', 'The credits page', 'The composer\'s biography'] },
      { text: 'What does reflecting on feedback mean?', correct: 'Turning it into a goal, trying the goal and reporting what happened', wrong: ['Agreeing with it', 'Ignoring it', 'Writing it down only'] },
      { text: 'How often does a journal entry earn a life?', correct: 'Once a day', wrong: ['Every entry', 'Once a week', 'Never'] },
      { text: 'How long should a journal entry be?', correct: 'Short lines you will read back, not an essay', wrong: ['At least a page', 'One word', 'As long as the practice session'] },
      { text: 'Why read back the entries for one piece in order?', correct: 'To notice what changed over the weeks', wrong: ['To count the words', 'To find the title', 'To earn lives'] },
      { text: 'When should you set the next session\'s goal?', correct: 'At the end of the current session, in the journal', wrong: ['Never', 'During the performance', 'After the exam'] },
      { text: 'How long should the work on the goal take in a session?', correct: 'About ten to fifteen minutes, slow and in loops', wrong: ['The whole session', 'One minute', 'Only on weekends'] },
      { text: 'Why end a session with something you can already play?', correct: 'So the session ends with music rather than drill', wrong: ['To earn more lives', 'Because it is easier', 'To warm up'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 44) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'P4', quizLength: 10, passMark: 70 };
