// L6 Pentatonic scales.
import { scale, parsePitch, pitchName, toMidi, PENTATONIC_DEGREES } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const MAJ_TONICS = ['C4', 'G4', 'F4'];
const MIN_TONICS = ['A3', 'E4', 'D4'];
const txt = (sc) => sc.map(pitchName).join(' ');

const templates = [
  (r) => {
    const t = parsePitch(r.pick(MAJ_TONICS)); const sc = scale(t, 'majorPentatonic');
    const correct = txt(sc.slice(0, 5));
    const maj = scale(t, 'major');
    const wrong = unique([txt(maj.slice(0, 5)), txt([maj[0], maj[2], maj[3], maj[4], maj[6]]), txt(scale(t, 'minorPentatonic').slice(0, 5)), txt([maj[0], maj[1], maj[3], maj[4], maj[5]])].filter(x => x !== correct));
    return { text: `Which notes make up ${pitchName(t)} major pentatonic?`, correct, wrong: r.shuffle(wrong).slice(0, 3), mono: true, explain: `${pitchName(t)} major is ${txt(maj.slice(0, 7))}. Leave out degrees 4 and 7: ${correct}.` };
  },
  (r) => {
    const t = parsePitch(r.pick(MIN_TONICS)); const sc = scale(t, 'minorPentatonic');
    const correct = txt(sc.slice(0, 5));
    const min = scale(t, 'minor');
    const wrong = unique([txt(min.slice(0, 5)), txt([min[0], min[1], min[2], min[4], min[5]]), txt(scale(t, 'majorPentatonic').slice(0, 5)), txt([min[0], min[2], min[3], min[4], min[5]])].filter(x => x !== correct));
    return { text: `Which notes make up ${pitchName(t)} minor pentatonic?`, correct, wrong: r.shuffle(wrong).slice(0, 3), mono: true, explain: `${pitchName(t)} natural minor is ${txt(min.slice(0, 7))}. Leave out degrees 2 and 6: ${correct}.` };
  },
  (r) => {
    const q = r.pick([
      { text: 'How many different notes does a pentatonic scale have in an octave?', correct: 'Five', wrong: ['Seven', 'Six', 'Eight'] },
      { text: 'Which degrees of the major scale are left out to make the major pentatonic scale?', correct: '4 and 7', wrong: ['2 and 6', '3 and 7', '4 and 5'] },
      { text: 'Which degrees of the natural minor scale are left out to make the minor pentatonic scale?', correct: '2 and 6', wrong: ['4 and 7', '3 and 6', '2 and 5'] },
      { text: 'What interval does a pentatonic scale never contain between neighbouring notes?', correct: 'A semitone', wrong: ['A tone', 'A tone and a half', 'A minor 3rd'] },
      { text: 'Which style of music is the minor pentatonic scale most associated with?', correct: 'Blues and rock', wrong: ['Baroque church music', 'Military marches', 'Waltzes'] },
      { text: 'C major pentatonic and A minor pentatonic have', correct: 'exactly the same five notes', wrong: ['no notes in common', 'the same tonic', 'different key signatures'] },
      { text: 'Why are pentatonic melodies easy to sing?', correct: 'They have no semitones, so any two notes sound comfortable together', wrong: ['They only use three notes', 'They always move by leap', 'They stay in one octave'] },
      { text: 'Which well-known melody uses only the notes of a major pentatonic scale?', correct: 'Amazing Grace', wrong: ['Happy Birthday', 'Ode to Joy', 'Twinkle, Twinkle, Little Star'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // hear: pentatonic or major/minor
  (r) => {
    const kind = r.pick(['majorPentatonic', 'minorPentatonic', 'major', 'minor']);
    const t = parsePitch(kind.includes('minor') ? r.pick(MIN_TONICS) : r.pick(MAJ_TONICS));
    const sc = scale(t, kind);
    const names = { majorPentatonic: 'Major pentatonic', minorPentatonic: 'Minor pentatonic', major: 'Major', minor: 'Natural minor' };
    return { text: 'Listen to this scale. Which type is it?', audio: sc.map(p => ({ midi: toMidi(p), beats: 0.6 })), correct: names[kind], wrong: Object.values(names).filter(x => x !== names[kind]), explain: kind.includes('Pentatonic') ? `Five notes to the octave and no semitones: ${names[kind].toLowerCase()}. ${kind === 'majorPentatonic' ? 'The third is major.' : 'The third is minor.'}` : `Seven notes with semitones: ${names[kind].toLowerCase()}.` };
  },
  // which note is NOT in the pentatonic
  (r) => {
    const t = parsePitch(r.pick(MAJ_TONICS)); const maj = scale(t, 'major'); const pent = scale(t, 'majorPentatonic').slice(0, 5).map(pitchName);
    const out = [maj[3], maj[6]];
    const correct = pitchName(r.pick(out));
    return { text: `Which of these notes is not in ${pitchName(t)} major pentatonic?`, correct, wrong: r.shuffle(pent).slice(0, 3), explain: `${pitchName(t)} major pentatonic is ${pent.join(' ')}. ${correct} is degree ${correct === pitchName(maj[3]) ? 4 : 7} of the major scale, which is left out.` };
  },
  // degree of pentatonic
  (r) => {
    const t = parsePitch(r.pick(MAJ_TONICS)); const pent = scale(t, 'majorPentatonic');
    const d = r.int(4) + 2;
    const correct = pitchName(pent[d - 1]);
    return { text: `What is the ${['first', 'second', 'third', 'fourth', 'fifth'][d - 1]} note of ${pitchName(t)} major pentatonic?`, correct, wrong: r.shuffle(scale(t, 'major').slice(0, 7).map(pitchName).filter(x => x !== correct)).slice(0, 3), explain: `${pitchName(t)} major pentatonic is ${txt(pent.slice(0, 5))}.` };
  },
];

export function bank(unit = 1, seed = 6) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L6', quizLength: 10, passMark: 70 };
