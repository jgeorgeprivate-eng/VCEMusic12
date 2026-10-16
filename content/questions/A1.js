// A1 Elements of music.
import { makeBank } from './_util.js';
import { toMidi, parsePitch } from '../../js/theory.js';

const ELEMENTS = ['Duration', 'Pitch', 'Tone colour', 'Texture', 'Structure', 'Dynamics', 'Articulation'];
const FEATURES = [
  ['a syncopated rhythm', 'Duration'], ['a fast tempo', 'Duration'], ['a change from 4/4 to 3/4', 'Duration'], ['a steady crotchet beat', 'Duration'], ['a quaver triplet figure', 'Duration'],
  ['a melody that moves by step', 'Pitch'], ['a modulation to the dominant key', 'Pitch'], ['a minor tonality', 'Pitch'], ['a wide melodic range', 'Pitch'], ['chords changing every bar', 'Pitch'], ['a pentatonic melody', 'Pitch'],
  ['a muted trumpet', 'Tone colour'], ['pizzicato strings', 'Tone colour'], ['a breathy flute sound', 'Tone colour'], ['a bright, nasal oboe', 'Tone colour'], ['a distorted electric guitar', 'Tone colour'],
  ['a melody with chordal accompaniment', 'Texture'], ['three independent melodies at once', 'Texture'], ['a single unaccompanied line', 'Texture'], ['layers added one by one', 'Texture'],
  ['a chorus that returns after each verse', 'Structure'], ['an A B A plan', 'Structure'], ['a coda at the end', 'Structure'], ['a bridge before the last chorus', 'Structure'],
  ['a crescendo to fortissimo', 'Dynamics'], ['a sudden drop to piano', 'Dynamics'], ['a long diminuendo', 'Dynamics'], ['a sforzando on the first beat', 'Dynamics'],
  ['staccato quavers', 'Articulation'], ['a legato phrase under a slur', 'Articulation'], ['accented brass chords', 'Articulation'], ['notes bent and slid into', 'Articulation'],
];
const PHRASE = ['G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'G4'].map(p => toMidi(parsePitch(p)));

const templates = [
  (r) => { const [f, e] = r.pick(FEATURES); return { text: `Which element of music does this belong to: ${f}?`, correct: e, wrong: r.shuffle(ELEMENTS.filter(x => x !== e)).slice(0, 3), explain: `${f[0].toUpperCase() + f.slice(1)} is a matter of ${e.toLowerCase()}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'How many elements of music does the course use?', correct: 'Seven', wrong: ['Five', 'Six', 'Nine'] },
      { text: 'Which three concepts belong under the element pitch?', correct: 'Melody, harmony and tonality', wrong: ['Rhythm, metre and tempo', 'Instruments, voices and effects', 'Verse, chorus and bridge'] },
      { text: 'What is another word for tone colour?', correct: 'Timbre', wrong: ['Texture', 'Tonality', 'Tempo'] },
      { text: 'Which element covers rhythm, metre and tempo?', correct: 'Duration', wrong: ['Pitch', 'Structure', 'Articulation'] },
      { text: 'Which element describes the number of layers and how they relate?', correct: 'Texture', wrong: ['Structure', 'Tone colour', 'Dynamics'] },
      { text: 'Which element describes how notes are attacked and connected?', correct: 'Articulation', wrong: ['Dynamics', 'Duration', 'Tone colour'] },
      { text: 'Which element describes the plan of a piece in sections?', correct: 'Structure', wrong: ['Texture', 'Duration', 'Pitch'] },
      { text: 'What does tonality describe?', correct: 'The key or scale the music is built on', wrong: ['How loud the music is', 'Which instruments play', 'How fast the beat goes'] },
      { text: 'What is syncopation?', correct: 'Stressing notes between the beats or on weak beats', wrong: ['Playing all notes on the beat', 'Gradually speeding up', 'Two melodies at once'] },
      { text: 'Which description of dynamics gives the best musical evidence?', correct: 'A crescendo from piano to fortissimo reached at 0:42', wrong: ['It gets louder', 'The dynamics are good', 'It is quite loud in places'] },
      { text: 'A tremolo in the strings is best described under which element?', correct: 'Tone colour (and duration)', wrong: ['Structure', 'Tonality', 'Texture only'] },
      { text: 'Describing a melody as having an arch contour and a range of a 6th belongs under', correct: 'Pitch', wrong: ['Duration', 'Dynamics', 'Articulation'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  // hear: which element has changed between two playings
  (r) => {
    const change = r.pick(['Dynamics', 'Articulation', 'Tone colour', 'Duration', 'Pitch']);
    const base = PHRASE.map(m => ({ midi: m, beats: 0.5, gain: 0.7, voice: 'piano' }));
    let second;
    if (change === 'Dynamics') second = base.map(n => ({ ...n, gain: 1.3 }));
    else if (change === 'Articulation') second = base.map(n => ({ ...n, artic: 'staccato' }));
    else if (change === 'Tone colour') second = base.map(n => ({ ...n, voice: 'oboe' }));
    else if (change === 'Duration') second = base.map(n => ({ ...n, beats: 0.25 }));
    else second = base.map(n => ({ ...n, midi: n.midi + 12 }));
    const audio = [...base, { rest: true, beats: 1 }, ...second];
    const names = { Dynamics: 'it is louder', Articulation: 'the notes are short and detached', 'Tone colour': 'a different instrument plays it', Duration: 'it is faster', Pitch: 'it is an octave higher' };
    return { text: 'Listen to a phrase played twice. Which element changes the second time?', audio, correct: change, wrong: r.shuffle(['Dynamics', 'Articulation', 'Tone colour', 'Duration', 'Pitch', 'Texture'].filter(x => x !== change)).slice(0, 3), explain: `The second time ${names[change]}: a change of ${change.toLowerCase()}.` };
  },
];
export function bank(unit = 1, seed = 21) { return makeBank(templates, unit, seed); }
export const meta = { code: 'A1', quizLength: 10, passMark: 70 };
