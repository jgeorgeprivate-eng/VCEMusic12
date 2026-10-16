// P2 Performance challenges.
import { makeBank } from './_util.js';
const CH = [
  ['A semiquaver run across the break in bar 12', 'Technical'], ['An eight-bar phrase with nowhere to breathe', 'Technical'], ['A sustained top A that goes sharp', 'Technical'], ['Counting a nine-bar rest before an entry', 'Technical'], ['Triplets against the piano\'s quavers', 'Technical'], ['A reed that will not play the low notes softly', 'Technical'],
  ['Shaping the long melody so it has one high point', 'Expressive'], ['A true pianissimo that still speaks', 'Expressive'], ['A crescendo spread evenly over four bars', 'Expressive'], ['Making the minuet sound like a dance', 'Expressive'], ['Keeping the tone warm in the top register', 'Expressive'], ['Finishing the last note cleanly and leaving silence', 'Expressive'],
];
const P2_FIX = [
  ['semiquavers across the break', 'Half speed in dotted rhythms, then build up with the metronome'],
  ['a phrase with no breath for eight bars', 'Plan one quick breath at a chosen beat and practise the phrase from there'],
  ['a sustained top note that goes sharp', 'Long notes against the drone, adjusting until the beats stop'],
  ['a nine-bar rest before an entry', 'Count the rest aloud against the metronome and mark the cue'],
  ['a crescendo that arrives too early', 'Mark the bar where each dynamic level should be reached and practise with the tuner showing stable pitch'],
  ['a dance movement that sounds heavy', 'Lighten the staccato and keep the pulse steady, slightly faster within the marking'],
  ['a phrase with no shape', 'Decide the high point, play toward it and away from it'],
  ['the last note cut off abruptly', 'Practise the release: taper the air and leave silence'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P2_FIX); return { text: `Challenge: ${s}. Which practice approach fits?`, correct: t, wrong: r.shuffle(P2_FIX.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), explain: `${t}.` }; },

  (r) => { const [s, t] = r.pick(CH); return { text: `${s}. Is this a technical or an expressive challenge?`, correct: t, wrong: [t === 'Technical' ? 'Expressive' : 'Technical', 'Neither, it is a structural feature', 'Both equally, always'], explain: `${t}: ${t === 'Technical' ? 'a physical difficulty in playing the notes.' : 'a difficulty in making the music sound as intended.'}` }; },
  (r) => {
    const q = r.pick([
      { text: 'What is a technical challenge?', correct: 'A physical difficulty in playing the notes: fingering, breath, range, speed, tuning, rhythm', wrong: ['A difficulty in reading the title', 'A difficulty in choosing the key', 'A difficulty in finding a recording'] },
      { text: 'What is an expressive challenge?', correct: 'A difficulty in making the music sound as intended: phrasing, dynamics, tone, character', wrong: ['A difficulty with the metronome', 'A difficulty with fingering', 'A difficulty counting rests'] },
      { text: 'How do you find your technical challenges?', correct: 'Play slowly and mark where you stumble, then at tempo and mark where it falls apart', wrong: ['Ask the composer', 'Read the title', 'Play only the easy parts'] },
      { text: 'How do you find your expressive challenges?', correct: 'Record a run-through and listen with the listening template as if it were someone else playing', wrong: ['Play faster', 'Count the bars', 'Change the key'] },
      { text: 'Which is a complete plan for a challenge?', correct: 'Bars 12 to 14, semiquavers across the break: practise at half speed in dotted rhythms, then build up', wrong: ['The fast bit is hard', 'Practise more', 'Bar 12'] },
      { text: 'Which oboe notes most often need tuning attention?', correct: 'The ones naturally sharp or flat on your instrument, and sustained unisons with others', wrong: ['All the quavers', 'The rests', 'The first note only'] },
      { text: 'When discussing a performance, a good structure is', correct: 'the challenge, where it is, the practice approach, and what happened', wrong: ['the title, the date and the venue', 'how nervous you were', 'the audience size'] },
      { text: 'A long phrase with nowhere to breathe is solved by', correct: 'planning a quick breath at a chosen place and practising from there', wrong: ['playing faster', 'leaving out bars', 'playing louder'] },
      { text: 'Which makes a discussion of challenges specific?', correct: 'Musical terms and bar numbers', wrong: ['Long words', 'Opinions about the piece', 'Comparisons with other students'] },
      { text: 'A true pianissimo that still speaks is which kind of challenge?', correct: 'Expressive, with a technical side (breath support and reed)', wrong: ['Structural', 'A tuning problem only', 'Not a challenge'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 42) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'P2', quizLength: 10, passMark: 70 };
