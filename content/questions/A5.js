// A5 Listening and responding.
import { makeBank } from './_util.js';

const ELEMENTS = ['Duration', 'Pitch', 'Tone colour', 'Texture', 'Structure', 'Dynamics', 'Articulation'];
const SENTENCES = [
  ['A slow 4/4 with a repeated quaver figure running throughout', 'Duration'],
  ['The melody moves by step in a major key with a range of an octave', 'Pitch'],
  ['A solo piano with a soft, warm sound', 'Tone colour'],
  ['The tune in the right hand over quiet chords in the left', 'Texture'],
  ['The opening returns after a louder middle section: A B A', 'Structure'],
  ['Piano throughout, with small swells at the ends of phrases', 'Dynamics'],
  ['Legato throughout, with no detached notes', 'Articulation'],
  ['Muted trumpets answered by pizzicato cellos', 'Tone colour'],
  ['A crescendo from 0:30 to the fortissimo at 0:55', 'Dynamics'],
  ['Twelve bars of I, IV and V repeated four times', 'Structure'],
  ['Three independent voices entering one after another', 'Texture'],
  ['A galloping dotted rhythm at a fast tempo', 'Duration'],
  ['Sharp staccato chords in the brass', 'Articulation'],
  ['A modulation from G major to D major at the bridge', 'Pitch'],
  ['The oboe has the melody, then hands it to the flute at 0:40', 'Tone colour'],
  ['Verse, chorus, verse, chorus, bridge, chorus', 'Structure'],
  ['A sudden fortissimo chord after a long pianissimo', 'Dynamics'],
  ['The texture thickens as strings join the piano at 1:05', 'Texture'],
  ['A syncopated bass pattern in 4/4 at about 120 beats a minute', 'Duration'],
  ['The melody leaps an octave at the climax', 'Pitch'],
  ['Accented, detached chords in the horns', 'Articulation'],
];
const GOOD = [
  { good: 'The texture is melody and accompaniment: solo oboe over sustained string chords, thinning to oboe alone at 1:10.', bad: ['The texture is lovely and quite thick.', 'There are some instruments playing together.', 'It sounds like a film.'] },
  { good: 'A crescendo from piano to fortissimo over eight bars, reached at 0:42.', bad: ['It gets louder.', 'The dynamics are good.', 'It is loud and then it is not.'] },
  { good: 'The melody moves mostly by step in A minor, with an arch contour peaking at 0:18.', bad: ['The tune is sad.', 'The melody goes up and down a bit.', 'I liked the melody.'] },
  { good: 'A syncopated right-hand rhythm over a steady crotchet bass in 2/4.', bad: ['The rhythm is jumpy.', 'It has a good beat.', 'The rhythm is quite fast and interesting.'] },
];
const templates = [
  (r) => { const [s, e] = r.pick(SENTENCES); return { text: `In a listening response, which element does this sentence describe: "${s}"?`, correct: e, wrong: r.shuffle(ELEMENTS.filter(x => x !== e)).slice(0, 3), explain: `That sentence is about ${e.toLowerCase()}.` }; },
  (r) => { const g = r.pick(GOOD); return { text: 'Which sentence gives the best musical evidence?', correct: g.good, wrong: g.bad.slice(), explain: 'It names the element with a term, the instruments or notes involved, and a time.' }; },
  (r) => {
    const q = r.pick([
      { text: 'What are the four parts of the listening template?', correct: 'The seven elements, compositional devices, organisation, and effect (plus context for a studied work)', wrong: ['Melody, harmony, rhythm and lyrics', 'Composer, title, date and key', 'Introduction, verse, chorus and coda'] },
      { text: 'What should you do during the first hearing of an excerpt?', correct: 'Listen without writing much; tap the beat, notice instruments and mark times of changes', wrong: ['Write a full paragraph straight away', 'Write down every note', 'Decide what the composer intended'] },
      { text: 'What turns an opinion into evidence in a response?', correct: 'A musical term and, where possible, a time', wrong: ['Saying how much you liked it', 'Using long words', 'Writing more sentences'] },
      { text: 'How should a response move from general to specific?', correct: 'Name the term, then the instruments or notes involved, then the time', wrong: ['Give the time first, then your opinion', 'Describe the whole piece, then the composer', 'Start with the ending'] },
      { text: 'Which word is least useful in a response on its own?', correct: 'Nice', wrong: ['Legato', 'Crescendo', 'Polyphonic'] },
      { text: 'What is an excerpt?', correct: 'A short passage taken from a longer piece', wrong: ['A complete piece', 'A summary of a piece', 'The title of a piece'] },
      { text: 'What should the effect part of the template record?', correct: 'The mood, image or character the music creates and which choices create it', wrong: ['How long the piece is', 'Who performed it', 'The number of bars'] },
      { text: 'How many elements should a short response on one excerpt usually cover?', correct: 'The two or three that matter most, each with evidence', wrong: ['All seven in equal detail', 'Only dynamics', 'None; it should give a personal reaction'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 25) { return makeBank(templates, unit, seed, 32); }
export const meta = { code: 'A5', quizLength: 10, passMark: 70 };
