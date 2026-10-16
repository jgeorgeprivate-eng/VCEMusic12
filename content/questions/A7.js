// A7 Comparing versions (Unit 2).
import { makeBank } from './_util.js';

const templates = [
  (r) => {
    const q = r.pick([
      { text: 'What is an interpretation?', correct: 'The choices a performer makes about how to play the written notes', wrong: ['A translation of the lyrics', 'A rewritten version for other instruments', 'The composer\'s biography'] },
      { text: 'What is an arrangement?', correct: 'A version of a work rewritten for different instruments, voices or style', wrong: ['A performance from memory', 'A list of the sections', 'A faster performance'] },
      { text: 'What is a cover version?', correct: 'A new recording of a song by a different performer, often in a new style', wrong: ['The first recording of a song', 'A song with no words', 'A recording made live'] },
      { text: 'What did Gounod add to Bach\'s Prelude in C?', correct: 'A sung melody over the broken chords', wrong: ['A drum part', 'A faster tempo', 'New chords'] },
      { text: 'What changes most between Bach\'s Prelude and the Bach-Gounod Ave Maria?', correct: 'The texture: from a single line of broken chords to melody and accompaniment', wrong: ['The key', 'The number of bars', 'The chords'] },
      { text: 'In Schubert\'s Erlkönig, how many characters does the singer portray?', correct: 'Four', wrong: ['One', 'Two', 'Six'] },
      { text: 'How can Liszt\'s piano arrangement of Erlkönig show the characters without words?', correct: 'Through register, dynamics and articulation', wrong: ['It cannot', 'Through the lyrics printed in the score', 'By changing the key signature'] },
      { text: 'What stays the same between Tito Puente\'s and Santana\'s Oye Como Va?', correct: 'The melody and the chords', wrong: ['The instruments', 'The tempo', 'The drum kit'] },
      { text: 'What is the best way to lay out a comparison of two versions?', correct: 'The elements down the side and the two versions across the top, then a paragraph on the biggest differences', wrong: ['One paragraph praising each performer', 'A list of the performers\' awards', 'A timeline of the composer\'s life'] },
      { text: 'Which sentence compares two versions well?', correct: 'The Santana version is faster, with electric guitar and organ instead of brass and flute, which makes it driving rather than danceable.', wrong: ['The Santana version is better because it is famous.', 'Both versions are good in their own way.', 'The Santana version has more energy.'] },
      { text: 'Why compare your own recording with a professional one?', correct: 'To hear the choices the professional made and decide which to make yourself', wrong: ['To prove you are as good', 'To copy the recording exactly', 'To find the wrong notes only'] },
      { text: 'Which elements usually change most in a performer\'s interpretation?', correct: 'Tempo, dynamics, articulation, phrasing and tone', wrong: ['The pitches and the key', 'The number of bars', 'The title'] },
      { text: 'Which elements usually change most in an arrangement?', correct: 'Tone colour and texture, and sometimes structure', wrong: ['The melody only', 'Nothing', 'The lyrics'] },
      { text: 'A cha-cha-chá and a rock version of the same song differ mainly in', correct: 'rhythm section, instruments, tempo and feel', wrong: ['melody', 'number of verses', 'key'] },
      { text: 'What is lost when a song is arranged for piano alone?', correct: 'The words and the human voice', wrong: ['The rhythm', 'The harmony', 'The structure'] },
      { text: 'What should a comparison keep to?', correct: 'The music, not the performers\' fame', wrong: ['The performers\' popularity', 'The album sales', 'The year of release only'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), unit: 2, explain: q.correct + '.' };
  },
  (r) => {
    const items = [['A slower tempo and softer dynamics', 'Interpretation'], ['Taking the repeat and adding ornaments the second time', 'Interpretation'], ['A string orchestra playing a piece written for piano', 'Arrangement'], ['A jazz trio playing a Beatles song in swing', 'Cover version'], ['Breathing in different places and shaping the phrases differently', 'Interpretation'], ['A brass quintet version of a Christmas carol', 'Arrangement'], ['A choir arrangement of a pop song', 'Arrangement'], ['Replacing the orchestra with a brass band', 'Arrangement'], ['A rock band recording a 1960s Latin song', 'Cover version'], ['Playing the slurs more smoothly and holding the last note longer', 'Interpretation'], ['Rewriting a voice and piano song for piano alone', 'Arrangement'], ['Adding a melody over an existing piano piece', 'Arrangement'], ['Choosing a brighter tone and more vibrato on a sustained note', 'Interpretation'], ['A singer recording a famous song in her own style', 'Cover version']];
    const [s, t] = r.pick(items);
    return { text: `${s}. Is this an interpretation, an arrangement or a cover version?`, correct: t, wrong: ['Interpretation', 'Arrangement', 'Cover version', 'Composition'].filter(x => x !== t).slice(0, 3), unit: 2, explain: `${t}.` };
  },
];
export function bank(unit = 2, seed = 27) { return makeBank(templates, 2, seed, 30); }
export const meta = { code: 'A7', quizLength: 10, passMark: 70 };
