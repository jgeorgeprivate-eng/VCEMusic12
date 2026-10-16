// L3 Metre.
import { pitch, METRES, GROUPINGS_U1, GROUPINGS_68, evBeats, toMidi } from '../../js/theory.js';
import { parseMelody } from '../../js/melody.js';
import { makeBank, unique } from './_util.js';

const B4 = toMidi(pitch('B', 0, 4));
const metresFor = (unit) => unit >= 2 ? ['4/4', '3/4', '6/8'] : ['4/4', '3/4'];

function accentedAudio(time, bars = 2) {
  const m = METRES[time];
  const seq = [];
  for (let b = 0; b < bars; b++) {
    if (time === '6/8') for (let i = 0; i < 6; i++) seq.push({ midi: B4, beats: 0.5, gain: i % 3 === 0 ? 1.3 : 0.5 });
    else for (let i = 0; i < m.beats; i++) seq.push({ midi: B4, beats: 1, gain: i === 0 ? 1.3 : 0.5 });
  }
  return seq;
}

const templates = [
  // meaning of a time signature
  (r, unit) => {
    const t = r.pick(metresFor(unit));
    const map = { '4/4': 'Four crotchet beats in a bar', '3/4': 'Three crotchet beats in a bar', '6/8': 'Six quavers in a bar, felt as two beats of three' };
    const correct = map[t];
    return { text: `What does the time signature ${t} mean?`, correct, wrong: r.shuffle([...Object.values(map), 'Four quaver beats in a bar', 'Three minim beats in a bar', 'Eight crotchet beats in a bar'].filter(x => x !== correct)).slice(0, 3), unit: t === '6/8' ? 2 : 1, explain: `The top number is the number of beats, the bottom number is the beat value. ${t}: ${correct.toLowerCase()}.` };
  },
  // which metre is heard
  (r, unit) => {
    const t = r.pick(metresFor(unit));
    return { text: 'Listen to the accented beats. Which time signature fits?', audio: accentedAudio(t), correct: t, wrong: ['4/4', '3/4', '6/8', '2/4'].filter(x => x !== t).slice(0, 3), unit: t === '6/8' ? 2 : 1, explain: t === '6/8' ? 'The quick notes group in threes under two strong beats: 6/8.' : `The strong beat comes every ${METRES[t].beats} beats: ${t}.` };
  },
  // does the bar add up
  (r, unit) => {
    const t = r.pick(metresFor(unit));
    const m = METRES[t];
    const fills = { '4/4': ['w', 'h h', 'q q q q', 'h q q', 'q q h', 'e e q h', 'q. e h', 'h e e q'], '3/4': ['h.', 'q q q', 'h q', 'q h', 'q e e q', 'e e e e q', 'q. e q'], '6/8': ['e e e e e e', 'q. q.', 'q e q e', 'e e e q.', 'q. e e e'] };
    const bad = { '4/4': ['h h q', 'q q q', 'w q', 'h e e'], '3/4': ['h h', 'q q', 'h. q', 'q q q q'], '6/8': ['q q q', 'e e e e', 'q. q. e', 'h h'] };
    const good = r.pick(fills[t]);
    const correct = good.split(' ').map(x => ({ w: 'semibreve', h: 'minim', 'h.': 'dotted minim', q: 'crotchet', 'q.': 'dotted crotchet', e: 'quaver', s: 'semiquaver' })[x]).join(', ');
    const wrong = r.shuffle(bad[t]).slice(0, 3).map(b => b.split(' ').map(x => ({ w: 'semibreve', h: 'minim', 'h.': 'dotted minim', q: 'crotchet', 'q.': 'dotted crotchet', e: 'quaver' })[x]).join(', '));
    return { text: `Which of these fills exactly one bar of ${t}?`, correct, wrong, unit: t === '6/8' ? 2 : 1, explain: `A bar of ${t} holds ${t === '6/8' ? 'six quavers (two dotted crotchet beats)' : m.beats + ' crotchet beats'}. ${correct} adds up to that.` };
  },
  // strongest beat
  (r, unit) => {
    const t = r.pick(metresFor(unit));
    const correct = 'Beat 1';
    return { text: `In ${t}, which beat of the bar is the strongest?`, correct, wrong: ['Beat 2', 'The last beat', 'All beats are equal'], unit: t === '6/8' ? 2 : 1, explain: 'The first beat of every bar is the strongest. In 4/4 the third beat is next strongest.' };
  },
  // name the grouping shown
  (r, unit) => {
    const list = unit >= 2 ? GROUPINGS_U1.concat(GROUPINGS_68) : GROUPINGS_U1;
    const g = r.pick(list.filter(x => x.beats <= 1.5));
    const dotted = { 144: 96, 72: 48, 36: 24 };
    const evs = g.notes.map(d => ({ pitches: [pitch('B', 0, 4)], dur: dotted[d] || d, dot: !!dotted[d], ...(g.tuplet ? { tuplet: 3 } : {}) }));
    const is68 = GROUPINGS_68.includes(g);
    return { text: 'What is this rhythmic grouping?', notation: { key: 'C', time: is68 ? '6/8' : '4/4', bars: [evs], noEnd: true }, correct: g.name, wrong: r.shuffle(list.filter(x => x !== g).map(x => x.name)).slice(0, 3), unit: is68 ? 2 : 1, explain: `${g.name[0].toUpperCase() + g.name.slice(1)}, filling ${g.beats === 1 ? 'one crotchet beat' : g.beats === 1.5 ? (is68 ? 'one dotted crotchet beat of 6/8' : 'one and a half beats') : g.beats + ' beats'}.` };
  },
  // count the bars / notes per bar
  (r, unit) => {
    const t = r.pick(metresFor(unit));
    const q = r.pick([
      { text: `How many quavers fill one bar of ${t}?`, correct: String({ '4/4': 8, '3/4': 6, '6/8': 6 }[t]), wrong: ['4', '6', '8', '12', '3'].filter(x => x !== String({ '4/4': 8, '3/4': 6, '6/8': 6 }[t])).slice(0, 3) },
      { text: `How many crotchets fill one bar of ${t}?`, correct: t === '6/8' ? '3' : String(METRES[t].beats), wrong: ['2', '3', '4', '6', '8'].filter(x => x !== (t === '6/8' ? '3' : String(METRES[t].beats))).slice(0, 3) },
      { text: `How many semiquavers fill one bar of ${t}?`, correct: String({ '4/4': 16, '3/4': 12, '6/8': 12 }[t]), wrong: ['8', '12', '16', '24', '6'].filter(x => x !== String({ '4/4': 16, '3/4': 12, '6/8': 12 }[t])).slice(0, 3) },
    ]);
    return { ...q, unit: t === '6/8' ? 2 : 1, explain: `${t}: ${q.correct} of those notes make one bar.` };
  },
  // general
  (r, unit) => {
    const q = r.pick([
      { text: 'What does the bottom number of a time signature tell you?', correct: 'Which note value counts as one beat', wrong: ['How many beats are in a bar', 'How fast to play', 'How many bars there are'] },
      { text: 'What does the top number of a time signature tell you?', correct: 'How many beats are in each bar', wrong: ['Which note value is the beat', 'The number of sharps', 'How many bars to play'] },
      { text: 'What does a bar line do?', correct: 'Separates one group of beats from the next', wrong: ['Shows where to breathe', 'Marks a change of key', 'Ends the piece'] },
      { text: 'Which metre is a waltz written in?', correct: '3/4', wrong: ['4/4', '6/8', '2/2'] },
      { text: 'What is another name for 4/4?', correct: 'Common time', wrong: ['Waltz time', 'Compound time', 'March time'] },
      { text: 'What does a quaver triplet mean?', correct: 'Three quavers played evenly in the time of two', wrong: ['Three quavers played in the time of three crotchets', 'Two quavers played in the time of three', 'Three quavers played as fast as possible'] },
      { text: 'In 6/8, how is the bar usually felt?', correct: 'As two beats, each divided into three quavers', wrong: ['As six equal strong beats', 'As three beats of two quavers', 'As four beats'], unit: 2 },
      { text: 'What is a compound metre?', correct: 'A metre where each beat divides into three', wrong: ['A metre with more than four beats', 'A metre where each beat divides into two', 'A metre that changes during the piece'], unit: 2 },
    ]);
    return { ...q, wrong: q.wrong.slice(), unit: q.unit || 1, explain: q.correct + '.' };
  },
];

export function bank(unit = 1, seed = 3) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L3', quizLength: 10, passMark: 70 };
