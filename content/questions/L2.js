// L2 Note values and rhythm.
import { pitch, gridToEvents, evBeats, DUR } from '../../js/theory.js';
import { parseMelody } from '../../js/melody.js';
import { makeBank, unique } from './_util.js';

const B = pitch('B', 0, 4);
const VALUES = [
  { name: 'semibreve', beats: 4, tok: 'w' }, { name: 'minim', beats: 2, tok: 'h' }, { name: 'crotchet', beats: 1, tok: 'q' }, { name: 'quaver', beats: 0.5, tok: 'e' }, { name: 'semiquaver', beats: 0.25, tok: 's' },
];
const fmt = (b) => b === 0.5 ? 'half a beat' : b === 0.25 ? 'a quarter of a beat' : b === 0.75 ? 'three quarters of a beat' : b === 1.5 ? 'one and a half beats' : b === 1 ? '1 beat' : `${b} beats`;
const beatsOpts = ['a quarter of a beat', 'half a beat', 'three quarters of a beat', '1 beat', 'one and a half beats', '2 beats', '3 beats', '4 beats', '6 beats'];

const templates = [
  // name the value shown
  (r) => {
    const v = r.pick(VALUES); const rest = r() < 0.35;
    const correct = `${v.name}${rest ? ' rest' : ''}`;
    const ev = parseMelody(rest ? 'r' + v.tok : 'B4' + v.tok)[0];
    return { text: `What is this ${rest ? 'rest' : 'note'} called?`, notation: { key: 'C', events: ev, noEnd: true }, correct, wrong: r.shuffle(VALUES.filter(x => x !== v).map(x => `${x.name}${rest ? ' rest' : ''}`)).slice(0, 3), explain: `A ${correct}, worth ${fmt(v.beats)} in 4/4.` };
  },
  // how many beats
  (r) => {
    const v = r.pick(VALUES); const dot = r() < 0.4 && v.beats >= 0.5;
    const beats = v.beats * (dot ? 1.5 : 1);
    const correct = fmt(beats);
    return { text: `How many crotchet beats does a ${dot ? 'dotted ' : ''}${v.name} last?`, correct, wrong: r.shuffle(beatsOpts.filter(x => x !== correct)).slice(0, 3), explain: dot ? `A ${v.name} is ${fmt(v.beats)}, and the dot adds half as much again: ${correct}.` : `A ${v.name} lasts ${correct}.` };
  },
  // how many of X in a Y
  (r) => {
    const big = r.pick(VALUES.slice(0, 3)); const small = r.pick(VALUES.filter(v => v.beats < big.beats));
    const n = big.beats / small.beats;
    const correct = String(n);
    return { text: `How many ${small.name}s fit into one ${big.name}?`, correct, wrong: r.shuffle(['2', '3', '4', '6', '8', '16'].filter(x => x !== correct)).slice(0, 3), explain: `A ${big.name} is ${fmt(big.beats)} and a ${small.name} is ${fmt(small.beats)}, so ${n} fit.` };
  },
  // dotted note shown: how many beats
  (r) => {
    const v = r.pick(VALUES.slice(1, 4));
    const ev = parseMelody('B4' + v.tok + '.')[0];
    const correct = fmt(v.beats * 1.5);
    return { text: 'How many beats does this dotted note last?', notation: { key: 'C', events: ev, noEnd: true }, correct, wrong: r.shuffle(beatsOpts.filter(x => x !== correct)).slice(0, 3), explain: `A dotted ${v.name}: ${fmt(v.beats)} plus half of that, ${correct}.` };
  },
  // tie meaning / dot meaning
  (r) => {
    const q = r.pick([
      { text: 'What does a tie between two notes of the same pitch mean?', correct: 'Hold the first note for the length of both', wrong: ['Play the two notes smoothly', 'Play the second note louder', 'Repeat the first note'] },
      { text: 'What does a dot after a note do?', correct: 'Adds half the note\'s value to its length', wrong: ['Makes the note short and detached', 'Doubles the note\'s length', 'Raises the note a semitone'] },
      { text: 'What is the difference between a tie and a slur?', correct: 'A tie joins two notes of the same pitch; a slur joins different pitches', wrong: ['A tie is above the notes; a slur is below', 'A slur joins two notes of the same pitch; a tie joins different pitches', 'There is no difference'] },
      { text: 'Which note has a filled-in head and a plain stem with no tail?', correct: 'Crotchet', wrong: ['Minim', 'Quaver', 'Semibreve'] },
      { text: 'Which note has a hollow head and no stem?', correct: 'Semibreve', wrong: ['Minim', 'Crotchet', 'Quaver'] },
      { text: 'How many tails (flags) does a semiquaver have?', correct: 'Two', wrong: ['One', 'Three', 'None'] },
      { text: 'What does a beam joining the stems of a group of notes replace?', correct: 'The tails of quavers or semiquavers', wrong: ['A tie', 'A bar line', 'A rest'] },
      { text: 'What is a rest?', correct: 'A sign for silence of a set length', wrong: ['A sign to play softly', 'The end of a piece', 'A pause of any length'] },
      { text: 'In a rhythm grid with four boxes to a beat, what does one box stand for?', correct: 'A semiquaver', wrong: ['A quaver', 'A crotchet', 'A whole beat'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // total beats of a short rhythm
  (r) => {
    const toks = ['q', 'q', 'h', 'e', 'e', 'q.', 'e', 's', 's', 'e'];
    const n = r.int(3) + 2;
    const chosen = Array.from({ length: n }, () => r.pick(toks));
    const evs = parseMelody(chosen.map(t => 'B4' + t).join(' '))[0];
    const total = evs.reduce((a, e) => a + evBeats(e), 0);
    const correct = fmt(total);
    const wrong = unique([fmt(total + 0.5), fmt(total + 1), fmt(Math.max(0.25, total - 0.5)), fmt(total * 2)].filter(x => x !== correct && beatsOpts.includes(x)));
    if (wrong.length < 3) return null;
    return { text: 'How many beats do these notes add up to?', notation: { key: 'C', events: evs, noEnd: true }, correct, wrong: r.shuffle(wrong).slice(0, 3), explain: `${chosen.map(t => ({ q: 'crotchet', h: 'minim', e: 'quaver', s: 'semiquaver', 'q.': 'dotted crotchet' })[t]).join(' + ')} = ${correct}.` };
  },
  // read a rhythm grid: which notation matches
  (r) => {
    const pats = { '1000': 'a crotchet', '1010': 'two quavers', '1111': 'four semiquavers', '1011': 'a quaver and two semiquavers', '1110': 'two semiquavers and a quaver', '1001': 'a dotted quaver and a semiquaver', '1100': 'two semiquavers and a quaver rest' };
    const keys = Object.keys(pats).filter(k => k !== '1100');
    const k = r.pick(keys);
    const correct = pats[k];
    return { text: `In a rhythm grid, one beat has the boxes ${k.split('').map(c => c === '1' ? 'filled' : 'empty').join(', ')}. Which rhythm is that?`, correct, wrong: r.shuffle(Object.values(pats).filter(x => x !== correct)).slice(0, 3), explain: `A note lasts until the next filled box or the end of the beat, so ${k} is ${correct}.` };
  },
  // name the rest shown by beats
  (r) => {
    const v = r.pick(VALUES.slice(0, 4));
    const correct = `${v.name} rest`;
    return { text: `Which rest lasts ${fmt(v.beats)}?`, correct, wrong: r.shuffle(VALUES.filter(x => x !== v).map(x => `${x.name} rest`)).slice(0, 3), explain: `The ${correct} matches the ${v.name}, ${fmt(v.beats)}.` };
  },
];

export function bank(unit = 1, seed = 2) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L2', quizLength: 10, passMark: 70 };
