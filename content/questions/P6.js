// P6 Performing for effect (Unit 2).
import { makeBank } from './_util.js';
const CHOICES = [['Take the tempo at the slow end of the marking', 'Heavier, more serious or calmer'], ['Shorten every staccato and lighten the tone', 'More playful or nervous'], ['Widen the dynamic range and place the single loudest moment at the climax', 'More dramatic'], ['Slur every phrase and use a warm tone with gentle vibrato', 'Tender or calm'], ['Hold back slightly before the important note', 'More expectation and emphasis'], ['Keep a steady pulse with firm accents', 'More drive and energy'], ['Let the last note fade rather than stop it', 'A gentler, more reflective ending'], ['Use a brighter tone with faster vibrato', 'More intensity or excitement']];
const P6_MORE = [
  ['The marking is Andante and you want calm. Where in the range of andante do you set the tempo?', 'Toward the slower end'],
  ['The marking is Allegro and you want excitement. What do you keep steady?', 'The pulse, with firm accents'],
  ['You want tenderness in a slow phrase. What do you do with the last note?', 'Let it fade rather than stop it'],
  ['You want drama. Where do you put the single loudest moment?', 'At the climax of the phrase or piece'],
  ['You want playfulness in a quick passage. What do you do with the staccato?', 'Shorten it and lighten the tone'],
  ['You want warmth on a sustained line. What do you do with vibrato?', 'Use gentle vibrato with a warm tone'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P6_MORE); return { text: s, correct: t, wrong: r.shuffle(P6_MORE.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), unit: 2, explain: `${t}.` }; },

  (r) => { const [c, e] = r.pick(CHOICES); return { text: `As a performer you ${c[0].toLowerCase() + c.slice(1)}. What effect does that make?`, correct: e, wrong: r.shuffle(CHOICES.filter(x => x[1] !== e).map(x => x[1])).slice(0, 3), unit: 2, explain: `${c}: ${e.toLowerCase()}.` }; },
  (r) => { const [c, e] = r.pick(CHOICES); return { text: `You want the music to sound ${e.toLowerCase().split(' or ')[0].replace('more ', '')}. Which choice helps?`, correct: c, wrong: r.shuffle(CHOICES.filter(x => x[0] !== c).map(x => x[0])).slice(0, 3), unit: 2, explain: `${c}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'Which choices belong to the performer rather than the composer?', correct: 'Tempo within the marking, dynamics, articulation, tone, phrasing and timing', wrong: ['The notes and the key', 'The title and the number of bars', 'The instrument the piece is for'] },
      { text: 'What should you decide before shaping a performance for effect?', correct: 'The effect, in one or two words', wrong: ['The reed', 'The concert venue', 'The length of the applause'] },
      { text: 'On the oboe, which choice is a large part of tone colour?', correct: 'Vibrato: how much and how fast', wrong: ['The clef', 'The key signature', 'The number of keys'] },
      { text: 'How should you write the description of how you will convey an effect?', correct: 'Effect, then the choices, then where in the music', wrong: ['Composer, title, date', 'Your feelings only', 'A list of every note'] },
      { text: 'What does a slight hold before an important note do?', correct: 'Creates expectation and emphasis', wrong: ['Changes the key', 'Makes the piece shorter', 'Nothing'] },
      { text: 'Why record one phrase three ways?', correct: 'To hear which choices made the difference', wrong: ['To fill the phone', 'To practise recording', 'Because three is the rule'] },
      { text: 'Comparing your recording with a professional one is for', correct: 'hearing the choices the professional made and deciding which to borrow', wrong: ['proving who is better', 'copying every detail', 'finding wrong notes only'] },
      { text: 'Within a tempo marking, faster usually sounds', correct: 'lighter and more urgent', wrong: ['heavier', 'sadder', 'calmer'] },
      { text: 'Where does the composer tell you about the intended effect?', correct: 'The tempo word, expression terms, dynamics and the title', wrong: ['The bar numbers', 'The clef', 'The page numbers'] },
      { text: 'For each effect, how many choices should you be able to name?', correct: 'At least three, with the bar where each is heard', wrong: ['One', 'None; effect is up to the listener', 'Ten or more'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), unit: 2, explain: q.correct + '.' };
  },
];
export function bank(unit = 2, seed = 46) { return makeBank(templates, 2, seed, 30); }
export const meta = { code: 'P6', quizLength: 10, passMark: 70 };
