// P1 Analysing my own pieces.
import { makeBank } from './_util.js';
import { KEYS, keySignature, pitchName, keyLabel, MAJOR_KEYS_U2, MINOR_KEYS } from '../../js/theory.js';
const P1_SCEN = [
  ['The piece has two sharps, starts and ends on D, and the melody sits on F♯ a lot. What key?', 'D major'],
  ['The piece has one flat and keeps ending on F with a bright third above it. What key?', 'F major'],
  ['The piece has no sharps or flats, ends on A, and sounds dark. What key?', 'A minor'],
  ['The piece has one sharp, ends on G, and the third above the ending note is B. What key?', 'G major'],
  ['The piece has one sharp but ends on E with a G above it and sounds dark. What key?', 'E minor'],
  ['The piece has one flat, ends on D and sounds dark. What key?', 'D minor'],
  ['Bars 1 to 8 return unchanged after a contrasting section in bars 9 to 16, then a coda. What structure?', 'Ternary with a coda'],
  ['Two sections, each with a repeat sign. What structure?', 'Binary'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P1_SCEN); return { text: s, correct: t, wrong: r.shuffle(P1_SCEN.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), explain: `${t}.` }; },

  (r) => {
    const q = r.pick([
      { text: 'What tells you most reliably whether a piece is major or minor?', correct: 'The third degree in the melody and the chord the piece ends on', wrong: ['The number of sharps', 'The time signature', 'The tempo marking'] },
      { text: 'What is the usual sign of a change of key in the middle of a piece?', correct: 'Accidentals that keep appearing, often raising the leading note of the new key', wrong: ['A change of clef', 'A double bar line only', 'A slower tempo'] },
      { text: 'Why mark the scale runs and broken chords in a piece?', correct: 'Because the warm-up that fixes a hard passage is usually the scale or arpeggio behind it', wrong: ['To count the notes', 'To find the title', 'To choose a reed'] },
      { text: 'Where do you look for the sections of a piece?', correct: 'Repeat signs, double bar lines, changes of key or tempo, and the return of the opening', wrong: ['The first bar only', 'The composer\'s name', 'The metronome marking'] },
      { text: 'Knowing a piece\'s structure helps you decide', correct: 'where to breathe, where to build and where to relax', wrong: ['what reed to use', 'how loud the metronome should be', 'which clef to read'] },
      { text: 'In the piece planner, "scales and patterns it uses" means', correct: 'the scale runs, broken chords and repeated figures in the music', wrong: ['the scales you know', 'the time signature', 'the dynamics'] },
      { text: 'Under the element pitch, what should a plan note about your own piece?', correct: 'Its range, the highest and lowest notes, and the leaps', wrong: ['Only the key signature', 'The number of bars', 'The tempo'] },
      { text: 'Under texture, your plan should note', correct: 'your role: melody or accompaniment, solo or part of a group', wrong: ['the key', 'the title', 'the composer\'s dates'] },
      { text: 'Where there are no dynamics or articulation written, the performer', correct: 'must decide them', wrong: ['plays everything forte', 'plays everything staccato', 'leaves the bars out'] },
      { text: 'A passage that looks hard is most often', correct: 'a scale or an arpeggio in disguise', wrong: ['impossible', 'a misprint', 'in a different key'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  (r) => { const k = r.pick(MAJOR_KEYS_U2.concat(MINOR_KEYS)); const sig = keySignature(k); const correct = sig.length ? sig.map(pitchName).join(' and ') : 'no sharps or flats'; return { text: `A piece is in ${keyLabel(k)}. What is in its key signature?`, correct, wrong: r.shuffle(['no sharps or flats', 'F♯', 'B♭', 'F♯ and C♯', 'B♭ and E♭', 'C♯'].filter(x => x !== correct)).slice(0, 3), unit: KEYS[k].unit, explain: `${keyLabel(k)}: ${correct}.` }; },
  (r) => { const k = r.pick(['C', 'G', 'F']); const rel = KEYS[k].relative; return { text: `A piece has the key signature of ${k} major but keeps ending phrases on ${pitchName(KEYS[rel].tonic)} and sounds dark. What key is it probably in?`, correct: keyLabel(rel), wrong: r.shuffle([`${k} major`, 'A minor', 'E minor', 'D minor', 'G minor', 'B minor'].filter(x => x !== keyLabel(rel) && x !== `${k} major`)).slice(0, 2).concat([`${k} major`]), unit: KEYS[k].unit, explain: `The same key signature with ${pitchName(KEYS[rel].tonic)} as home is the relative minor, ${keyLabel(rel)}.` }; },
  (r) => { const items = [['Bar 12 is a run of semiquavers from D up to D', 'A scale'], ['Bars 3 and 4 outline G, B, D, G', 'A broken chord (arpeggio)'], ['The same two-bar figure returns in bars 1, 5, 9 and 13', 'A repeated figure (riff or ostinato)'], ['Bars 20 to 27 climb step by step to the highest note', 'A scale'], ['The accompaniment plays C, E, G, E over and over', 'A broken chord (arpeggio)']]; const [s, t] = r.pick(items); return { text: `${s}. What pattern is that?`, correct: t, wrong: ['A scale', 'A broken chord (arpeggio)', 'A repeated figure (riff or ostinato)', 'A trill'].filter(x => x !== t).slice(0, 3), explain: `${t}.` }; },
];
export function bank(unit = 1, seed = 41) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'P1', quizLength: 10, passMark: 70 };
