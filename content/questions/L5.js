// L5 Natural minor scales.
import { KEYS, keyScale, keySignature, pitchName, toMidi, MINOR_KEYS, MAJOR_KEYS_U1, keyLabel, scale, parsePitch } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const scaleText = (k) => keyScale(k).map(pitchName).join(' ');

const templates = [
  // relative minor of a major
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1);
    const rel = KEYS[k].relative;
    const correct = keyLabel(rel);
    return { text: `What is the relative minor of ${k} major?`, correct, wrong: r.shuffle(['A minor', 'E minor', 'D minor', 'G minor', 'B minor', 'C minor'].filter(x => x !== correct)).slice(0, 3), explain: `${correct} shares the key signature of ${k} major. Its tonic is degree 6 of ${k} major, three semitones below ${k}.` };
  },
  // relative major of a minor
  (r) => {
    const k = r.pick(MINOR_KEYS);
    const rel = KEYS[k].relative;
    const correct = `${rel} major`;
    return { text: `What is the relative major of ${keyLabel(k)}?`, correct, wrong: r.shuffle(['C major', 'G major', 'F major', 'D major', 'B♭ major', 'A major'].filter(x => x !== correct)).slice(0, 3), explain: `${correct} shares the key signature of ${keyLabel(k)}. Its tonic is degree 3 of the minor scale, three semitones above.` };
  },
  // degree of a minor scale
  (r) => {
    const k = r.pick(MINOR_KEYS); const sc = keyScale(k); const d = r.int(7) + 2;
    const correct = pitchName(sc[d - 1]);
    const pool = unique(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'F♯', 'B♭', 'C♯', 'G♯'].filter(x => x !== correct));
    return { text: `Which note is the ${ORD[d - 1]} note (degree ${d}) of ${keyLabel(k)}?`, correct, wrong: r.shuffle(pool).slice(0, 3), explain: `${keyLabel(k)} is ${scaleText(k)}. Degree ${d} is ${correct}.` };
  },
  // key signature of minor
  (r) => {
    const k = r.pick(MINOR_KEYS);
    const sig = keySignature(k);
    const correct = sig.length ? sig.map(pitchName).join(' and ') : 'no sharps or flats';
    return { text: `What is the key signature of ${keyLabel(k)}?`, correct, wrong: r.shuffle(['no sharps or flats', 'F♯', 'B♭', 'F♯ and C♯', 'B♭ and E♭', 'C♯'].filter(x => x !== correct)).slice(0, 3), explain: `${keyLabel(k)} shares its key signature with ${KEYS[k].relative} major: ${correct}.` };
  },
  // pattern
  (r) => {
    const q = r.pick([
      { text: 'What is the pattern of tones and semitones in a natural minor scale?', correct: 'T S T T S T T', wrong: ['T T S T T T S', 'T T T S T T S', 'S T T S T T T'] },
      { text: 'Between which degrees are the semitones in a natural minor scale?', correct: '2 to 3 and 5 to 6', wrong: ['3 to 4 and 7 to 8', '1 to 2 and 4 to 5', '2 to 3 and 7 to 8'] },
      { text: 'Which note of a major scale is the tonic of its relative minor?', correct: 'Degree 6', wrong: ['Degree 3', 'Degree 5', 'Degree 2'] },
      { text: 'How far below the major tonic is the relative minor tonic?', correct: 'Three semitones', wrong: ['Two semitones', 'Four semitones', 'Five semitones'] },
      { text: 'What do a major key and its relative minor have in common?', correct: 'The same key signature and the same notes', wrong: ['The same tonic', 'The same third degree', 'Nothing'] },
      { text: 'Which degree tells you most clearly whether music is major or minor?', correct: 'The third', wrong: ['The fifth', 'The tonic', 'The octave'] },
      { text: 'Which minor scale has no sharps or flats?', correct: 'A minor', wrong: ['E minor', 'D minor', 'C minor'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // hear major or minor
  (r) => {
    const minor = r() < 0.5;
    const tonic = r.pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A3']);
    const sc = scale(parsePitch(tonic), minor ? 'minor' : 'major');
    return { text: 'Listen to this scale. Is it major or natural minor?', audio: sc.map(p => ({ midi: toMidi(p), beats: 0.6 })), correct: minor ? 'Natural minor' : 'Major', wrong: [minor ? 'Major' : 'Natural minor', 'Major pentatonic', 'Chromatic'], explain: minor ? 'The third note is a tone and a half above the tonic, so the scale is minor.' : 'The third note is two tones above the tonic, so the scale is major.' };
  },
  // correctly spelled minor scale
  (r) => {
    const k = r.pick(MINOR_KEYS); const sc = keyScale(k);
    const correct = scaleText(k);
    const wrongs = new Set(); let guard = 0;
    while (wrongs.size < 3 && guard++ < 40) { const i = r.int(6) + 1; const alt = sc.map((p, j) => j === i ? { ...p, acc: p.acc + (r() < 0.5 ? 1 : -1) } : p); if (Math.abs(alt[i].acc) > 1) continue; const t = alt.map(pitchName).join(' '); if (t !== correct) wrongs.add(t); }
    return { text: `Which of these is ${keyLabel(k)} written correctly?`, correct, wrong: [...wrongs], mono: true, explain: `${keyLabel(k)} is ${correct}: the pattern T S T T S T T from ${pitchName(sc[0])}.` };
  },
  // which minor key uses these notes (same as major)
  (r) => {
    const k = r.pick(MAJOR_KEYS_U1);
    const correct = keyLabel(KEYS[k].relative);
    return { text: `A piece uses only the notes of ${k} major but keeps returning to ${pitchName(keyScale(KEYS[k].relative)[0])} as its home note. What key is it in?`, correct, wrong: r.shuffle([`${k} major`, 'A minor', 'E minor', 'D minor', 'G minor'].filter(x => x !== correct)).slice(0, 3), explain: `The same notes as ${k} major with ${pitchName(keyScale(KEYS[k].relative)[0])} as the tonic make ${correct}, the relative minor.` };
  },
];

export function bank(unit = 1, seed = 5) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L5', quizLength: 10, passMark: 70 };
