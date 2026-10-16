// A4 Approaches to organisation.
import { makeBank } from './_util.js';

const FORMS = [
  { n: 'Binary', plan: 'A B', d: 'Two sections, each usually repeated' },
  { n: 'Ternary', plan: 'A B A', d: 'Statement, contrast, return' },
  { n: 'Rondo', plan: 'A B A C A', d: 'A main section returns between different episodes' },
  { n: 'Theme and variations', plan: 'A A1 A2 A3', d: 'A theme repeated several times, changed each time' },
  { n: 'Bar form', plan: 'A A B', d: 'A phrase twice, then a different phrase' },
  { n: 'Verse and chorus', plan: 'Verse Chorus Verse Chorus', d: 'Verses with new words, a chorus that returns unchanged' },
  { n: '12-bar blues', plan: 'I I I I IV IV I I V IV I V', d: 'Twelve bars of three chords in a fixed order, repeated' },
  { n: 'Head, solos, head', plan: 'Head Solo Solo Head', d: 'The tune, improvised solos over its chords, the tune again' },
  { n: 'Riff-based', plan: 'a short pattern repeated throughout', d: 'A short repeated pattern as the foundation' },
];
const WORKS = [
  ['Für Elise (Beethoven)', 'Rondo'], ['The Raindrop Prelude (Chopin)', 'Ternary'], ['Minuet in G from the Anna Magdalena notebook', 'Binary'], ['Caprice No. 24 (Paganini)', 'Theme and variations'], ['Drunken Sailor', 'Verse and chorus'], ['All Blues (Miles Davis)', '12-bar blues'], ['A Night in Tunisia (Gillespie and Parker)', 'Head, solos, head'], ['Aquarium (Saint-Saëns), opening phrases', 'Bar form'], ['The Dead Heart (Midnight Oil)', 'Riff-based'],
];
const templates = [
  (r) => { const f = r.pick(FORMS); return { text: `Which form has the plan ${f.plan}?`, correct: f.n, wrong: r.shuffle(FORMS.filter(x => x !== f).map(x => x.n)).slice(0, 3), explain: `${f.n}: ${f.d.toLowerCase()}.` }; },
  (r) => { const f = r.pick(FORMS); return { text: `${f.d}. Which form is this?`, correct: f.n, wrong: r.shuffle(FORMS.filter(x => x !== f).map(x => x.n)).slice(0, 3), explain: `${f.n} (${f.plan}).` }; },
  (r) => { const [w, f] = r.pick(WORKS); return { text: `Which approach to organisation does ${w} show?`, correct: f, wrong: r.shuffle(FORMS.filter(x => x.n !== f).map(x => x.n)).slice(0, 3), explain: `${w}: ${f.toLowerCase()}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'In a rondo, the section that keeps returning is called the', correct: 'refrain', wrong: ['bridge', 'coda', 'subject'] },
      { text: 'In binary form, the first section often ends', correct: 'on the dominant, away from home', wrong: ['on the tonic', 'with a drum solo', 'in a new metre'] },
      { text: 'What stays the same in a theme and variations?', correct: 'Usually the length and the chords of the theme', wrong: ['The rhythm of the theme', 'The instrument', 'The dynamics'] },
      { text: 'Which three chords does a 12-bar blues use?', correct: 'I, IV and V', wrong: ['I, ii and vi', 'ii, V and I', 'I, iii and V'] },
      { text: 'In jazz, the head is', correct: 'the written tune played at the start and the end', wrong: ['the drummer', 'the loudest solo', 'the first chord'] },
      { text: 'A riff is', correct: 'a short repeated pattern a piece is built on', wrong: ['a long melody', 'a type of cadence', 'a slow introduction'] },
      { text: 'In a song, the section with the same words and music each time is the', correct: 'chorus', wrong: ['verse', 'bridge', 'introduction'] },
      { text: 'How do you label a section that returns?', correct: 'With the same letter as its first appearance', wrong: ['With the next letter', 'With a number', 'With the word coda'] },
      { text: 'A B A C A B A is a longer kind of', correct: 'rondo', wrong: ['binary form', 'bar form', 'theme and variations'] },
      { text: 'A bridge in a song is', correct: 'a contrasting section that leads back to the chorus or the ending', wrong: ['the first verse', 'the repeated riff', 'the drum introduction'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  (r) => {
    const letters = r.pick([['A B', 'Binary'], ['A B A', 'Ternary'], ['A B A C A', 'Rondo'], ['A A B', 'Bar form'], ['A A1 A2', 'Theme and variations']]);
    return { text: `A piece has sections in this order: ${letters[0]}. What form is it?`, correct: letters[1], wrong: r.shuffle(FORMS.filter(x => x.n !== letters[1]).map(x => x.n)).slice(0, 3), explain: `${letters[0]} is ${letters[1].toLowerCase()}.` };
  },
];
export function bank(unit = 1, seed = 24) { return makeBank(templates, unit, seed); }
export const meta = { code: 'A4', quizLength: 10, passMark: 70 };
