// C4 Developing a motif.
import { makeBank } from './_util.js';
import { toMidi, parsePitch, pitchName, pitchFromDiatonic, diatonicIndex } from '../../js/theory.js';

const MOTIFS = ['C4 D4 E4 G4', 'G4 E4 D4 C4', 'E4 E4 F4 G4', 'C4 G4 E4 C4', 'D4 F4 E4 D4'];
const DEV = ['Repetition', 'Sequence', 'Augmentation', 'Diminution', 'Inversion', 'Fragmentation'];
function apply(ps, dev) {
  if (dev === 'Repetition') return ps;
  if (dev === 'Sequence') return ps.map(p => pitchFromDiatonic(diatonicIndex(p) + 1, 0));
  if (dev === 'Inversion') return ps.map(p => pitchFromDiatonic(2 * diatonicIndex(ps[0]) - diatonicIndex(p), 0));
  if (dev === 'Fragmentation') return ps.slice(0, 2).concat(ps.slice(0, 2));
  return ps;
}
const templates = [
  // name the device from a written treatment
  (r) => {
    const ps = r.pick(MOTIFS).split(' ').map(parsePitch); const dev = r.pick(DEV);
    const out = apply(ps, dev);
    const durs = dev === 'Augmentation' ? 96 : dev === 'Diminution' ? 24 : 48;
    const events = [...ps.map(p => ({ pitches: [p], dur: 48 })), { rest: true, dur: 48 }, ...out.map(p => ({ pitches: [p], dur: durs }))];
    return { text: 'A motif, a rest, then a treatment of the motif. Which device is used?', notation: { key: 'C', events, noEnd: true }, correct: dev, wrong: r.shuffle(DEV.filter(x => x !== dev)).slice(0, 3), explain: { Repetition: 'The same notes and rhythm again.', Sequence: 'The same shape starting a step higher.', Augmentation: 'The same notes with doubled note values.', Diminution: 'The same notes with halved note values.', Inversion: 'Each rise becomes a fall and each fall a rise.', Fragmentation: 'Only the first two notes, repeated.' }[dev] };
  },
  // hear the device
  (r) => {
    const ps = r.pick(MOTIFS).split(' ').map(parsePitch); const dev = r.pick(DEV);
    const out = apply(ps, dev);
    const beats = dev === 'Augmentation' ? 1 : dev === 'Diminution' ? 0.25 : 0.5;
    const audio = [...ps.map(p => ({ midi: toMidi(p), beats: 0.5 })), { rest: true, beats: 0.75 }, ...out.map(p => ({ midi: toMidi(p), beats }))];
    return { text: 'Listen to a motif and then a treatment of it. Which device?', audio, correct: dev, wrong: r.shuffle(DEV.filter(x => x !== dev)).slice(0, 3), explain: `${dev}.` };
  },
  (r) => {
    const q = r.pick([
      { text: 'What makes a good motif for development?', correct: 'A short idea with a clear rhythm and one distinctive feature', wrong: ['A long melody with many leaps', 'A single held note', 'A full chord progression'] },
      { text: 'What is a reliable plan for a four-bar phrase from a motif?', correct: 'State it, sequence it, fragment or augment it, then end with a contrasting cadence', wrong: ['Repeat it four times unchanged', 'Play it in four different keys', 'Invert it four times'] },
      { text: 'Too much repetition makes a phrase', correct: 'dull', wrong: ['too hard to follow', 'too loud', 'too short'] },
      { text: 'Too much change makes a phrase', correct: 'hard to follow, because the listener loses the idea', wrong: ['dull', 'too slow', 'too soft'] },
      { text: 'How can you test whether a device has worked?', correct: 'Sing the result and check you can still hear the original motif in it', wrong: ['Count the bars', 'Check the key signature', 'Play it faster'] },
      { text: 'Writing a motif a step higher, then a step higher again, is', correct: 'sequence', wrong: ['augmentation', 'inversion', 'contrast'] },
      { text: 'Using only the first two notes of a motif, repeated, is', correct: 'fragmentation', wrong: ['diminution', 'sequence', 'repetition'] },
      { text: 'Contrast in a phrase should be used', correct: 'once or twice, usually toward the end', wrong: ['in every bar', 'never', 'only at the start'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 34) { return makeBank(templates, unit, seed); }
export const meta = { code: 'C4', quizLength: 10, passMark: 70 };
