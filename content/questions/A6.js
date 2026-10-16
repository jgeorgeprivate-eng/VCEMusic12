// A6 Creating effect (Unit 2).
import { makeBank } from './_util.js';
import { toMidi, parsePitch } from '../../js/theory.js';

const CHOICES = [
  ['a fast tempo in a major key with staccato flute', 'Playful or lively', 'Duration, pitch, tone colour, articulation'],
  ['a slow tempo, soft dynamics and legato strings', 'Calm or tender', 'Duration, dynamics, articulation, tone colour'],
  ['low brass, a minor key, accents and a crescendo', 'Menacing or threatening', 'Tone colour, pitch, articulation, dynamics'],
  ['high tremolo strings and soft rippling runs', 'Water or shimmering light', 'Pitch, tone colour, dynamics'],
  ['a repeated tune that speeds up and gets louder each time', 'Rising tension', 'Duration, dynamics, texture'],
  ['a solo voice alone, unaccompanied', 'Loneliness or purity', 'Texture, tone colour'],
  ['wide bare intervals, slow tempo and a wind machine', 'Cold and bleak', 'Pitch, duration, tone colour'],
  ['a galloping long-short-short rhythm at a fast tempo', 'Motion, riding, excitement', 'Duration'],
  ['loud brass fanfares in a major key with timpani', 'Grand or triumphant', 'Dynamics, tone colour, pitch'],
  ['fast continuous chromatic notes', 'A buzzing insect or nervous energy', 'Pitch, duration'],
];
const P = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'].map(p => toMidi(parsePitch(p)));
const templates = [
  (r) => { const [c, e] = r.pick(CHOICES); return { text: `What effect would ${c} most likely create?`, correct: e, wrong: r.shuffle(CHOICES.filter(x => x[1] !== e).map(x => x[1])).slice(0, 3), unit: 2, explain: `${c[0].toUpperCase() + c.slice(1)} creates ${e.toLowerCase()}.` }; },
  (r) => { const [c, e, els] = r.pick(CHOICES); return { text: `"${e}" is created by ${c}. Which elements are doing the work?`, correct: els, wrong: r.shuffle(CHOICES.filter(x => x[2] !== els).map(x => x[2])).slice(0, 3), unit: 2, explain: `${els}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'What does effect mean in music?', correct: 'The mood, image, character or feeling a passage creates', wrong: ['The volume setting on an amplifier', 'The number of instruments', 'The key signature'] },
      { text: 'What is programme music?', correct: 'Instrumental music that tells a story or paints a picture', wrong: ['Music written for a computer', 'Music with words', 'Music for a dance programme'] },
      { text: 'How is tension usually built?', correct: 'By raising something steadily, such as speed, volume, pitch or layers, and withholding the release', wrong: ['By playing softly throughout', 'By stopping the beat', 'By repeating the tonic chord'] },
      { text: 'Which pair of choices would most likely sound menacing?', correct: 'Low register and minor key', wrong: ['High register and major key', 'Soft dynamics and legato', 'Solo flute and staccato'] },
      { text: 'A minor key usually sounds', correct: 'sad, serious or sinister', wrong: ['bright and open', 'playful', 'fast'] },
      { text: 'When writing about effect, what order works best?', correct: 'Name the effect, then the elements that cause it, then where in the music', wrong: ['Give the composer\'s biography first', 'List every instrument', 'Describe your feelings only'] },
      { text: 'In Grieg\'s In the Hall of the Mountain King, tension comes mainly from', correct: 'the same tune repeated faster and louder with more instruments', wrong: ['a change of metre', 'a long silence', 'a new melody every bar'] },
      { text: 'A crescendo creates', correct: 'growing tension or expectation', wrong: ['calm', 'a change of key', 'a faster tempo'] },
      { text: 'Staccato articulation at a fast tempo usually sounds', correct: 'playful, nervous or mechanical', wrong: ['calm and flowing', 'grand and heavy', 'sad'] },
      { text: 'Which element is Saint-Saëns using when the Aquarium shimmers with tremolo strings?', correct: 'Tone colour (with duration)', wrong: ['Structure', 'Tonality only', 'Articulation only'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), unit: 2, explain: q.correct + '.' };
  },
  (r) => {
    const mood = r.pick(['Calm', 'Playful', 'Menacing']);
    const set = { Calm: { bpm: 66, voice: 'flute', artic: 'legato', gain: 0.4, oct: 0 }, Playful: { bpm: 150, voice: 'piano', artic: 'staccato', gain: 0.8, oct: 12 }, Menacing: { bpm: 90, voice: 'strings', artic: 'accent', gain: 1.1, oct: -24 } }[mood];
    const audio = P.map(m => { let mm = m + set.oct; if (mood === 'Menacing' && [4, 9].includes((mm + 120) % 12)) mm -= 1; return { midi: mm, beats: 1 * 100 / set.bpm, artic: set.artic, gain: set.gain, voice: set.voice }; });
    return { text: 'Listen. Which effect is this version of the tune going for?', audio, correct: mood, wrong: ['Calm', 'Playful', 'Menacing', 'Grand'].filter(x => x !== mood).slice(0, 3), unit: 2, explain: { Calm: 'Slow, soft, legato flute.', Playful: 'Fast, high, staccato piano.', Menacing: 'Low strings, accents, minor colouring.' }[mood] };
  },
];
export function bank(unit = 2, seed = 26) { return makeBank(templates, 2, seed); }
export const meta = { code: 'A6', quizLength: 10, passMark: 70 };
