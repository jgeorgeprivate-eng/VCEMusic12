// L13 Performance markings.
import { TEMPO_TERMS, TEMPO_CHANGES, DYNAMICS, DYNAMIC_CHANGES, ARTICULATIONS, EXPRESSION_TERMS, toMidi, parsePitch } from '../../js/theory.js';
import { makeBank, unique } from './_util.js';

const PHRASE = ['G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'G4'].map(parsePitch).map(toMidi);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const templates = [
  // meaning of a tempo term
  (r) => {
    const t = r.pick(TEMPO_TERMS);
    return { text: `What does ${t.term} mean?`, correct: cap(t.meaning), wrong: r.shuffle(TEMPO_TERMS.filter(x => x !== t).map(x => cap(x.meaning))).slice(0, 3), explain: `${t.term}: ${t.meaning}, about ${t.bpm} beats a minute.` };
  },
  // which term for a meaning
  (r) => {
    const t = r.pick(TEMPO_TERMS);
    return { text: `Which term means "${t.meaning}"?`, correct: t.term, wrong: r.shuffle(TEMPO_TERMS.filter(x => x !== t).map(x => x.term)).slice(0, 3), explain: `${t.term} means ${t.meaning}.` };
  },
  // order of tempo terms
  (r) => {
    const i = r.int(TEMPO_TERMS.length - 1);
    const a = TEMPO_TERMS[i], b = TEMPO_TERMS[i + 1];
    const faster = r() < 0.5;
    const correct = faster ? b.term : a.term;
    return { text: `Which is ${faster ? 'faster' : 'slower'}: ${a.term} or ${b.term}?`, correct, wrong: [faster ? a.term : b.term, 'They are the same speed', 'It depends on the key'], explain: `From slow to fast: largo, adagio, andante, moderato, allegro, vivace, presto. ${correct} is ${faster ? 'faster' : 'slower'}.` };
  },
  // dynamics
  (r) => {
    const d = r.pick(DYNAMICS);
    const kind = r.int(3);
    if (kind === 0) return { text: `What does the marking ${d.sign} mean?`, correct: cap(d.meaning), wrong: r.shuffle(DYNAMICS.filter(x => x !== d).map(x => cap(x.meaning))).slice(0, 3), explain: `${d.sign} is ${d.term}: ${d.meaning}.` };
    if (kind === 1) return { text: `Which marking means ${d.meaning}?`, correct: d.sign, wrong: r.shuffle(DYNAMICS.filter(x => x !== d).map(x => x.sign)).slice(0, 3), explain: `${d.sign}, ${d.term}.` };
    return { text: `What is the full Italian name of ${d.sign}?`, correct: cap(d.term), wrong: r.shuffle(DYNAMICS.filter(x => x !== d).map(x => cap(x.term))).slice(0, 3), explain: `${d.sign} stands for ${d.term}, ${d.meaning}.` };
  },
  // louder or softer
  (r) => {
    const i = r.int(DYNAMICS.length - 1); const a = DYNAMICS[i], b = DYNAMICS[i + 1];
    const louder = r() < 0.5;
    const correct = louder ? b.sign : a.sign;
    return { text: `Which is ${louder ? 'louder' : 'softer'}: ${a.sign} or ${b.sign}?`, correct, wrong: [louder ? a.sign : b.sign, 'They are the same', 'Neither is a dynamic'], explain: `From soft to loud: pp, p, mp, mf, f, ff.` };
  },
  // dynamic changes and tempo changes
  (r) => {
    const pool = [...DYNAMIC_CHANGES, ...TEMPO_CHANGES];
    const t = r.pick(pool);
    return { text: `What does ${t.term} mean?`, correct: cap(t.meaning), wrong: r.shuffle(pool.filter(x => x !== t && x.meaning !== t.meaning).map(x => cap(x.meaning))).slice(0, 3), explain: `${t.term}: ${t.meaning}.` };
  },
  // articulation sign / meaning
  (r) => {
    const a = r.pick(ARTICULATIONS);
    const kind = r.int(2);
    if (kind === 0) return { text: `What does ${a.term.toLowerCase()} mean?`, correct: cap(a.meaning), wrong: r.shuffle(ARTICULATIONS.filter(x => x !== a).map(x => cap(x.meaning))).slice(0, 3), explain: `${a.term}: ${a.meaning}. It is shown by ${a.sign}.` };
    return { text: `Which articulation is shown by ${a.sign}?`, correct: a.term, wrong: r.shuffle(ARTICULATIONS.filter(x => x !== a).map(x => x.term)).slice(0, 3), explain: `${a.sign} means ${a.term.toLowerCase()}: ${a.meaning}.` };
  },
  // hear the articulation
  (r) => {
    const a = r.pick(ARTICULATIONS.filter(x => x.artic !== 'tenuto'));
    const audio = PHRASE.map(m => ({ midi: m, beats: 0.5, artic: a.artic === 'legato' ? 'legato' : a.artic, gain: a.artic === 'accent' || a.artic === 'marcato' ? 1.2 : 0.8 }));
    return { text: 'Listen to this phrase. How is it articulated?', audio, correct: a.term, wrong: r.shuffle(ARTICULATIONS.filter(x => x !== a && x.artic !== 'tenuto').map(x => x.term)).slice(0, 3), explain: `${a.term}: ${a.meaning}.` };
  },
  // hear the dynamic level (soft vs loud)
  (r) => {
    const d = r.pick([DYNAMICS[0], DYNAMICS[1], DYNAMICS[4], DYNAMICS[5]]);
    const soft = d.level < 0.5;
    const audio = PHRASE.map(m => ({ midi: m, beats: 0.5, gain: d.level }));
    return { text: 'Listen. Is this phrase played at a soft or a loud dynamic?', audio, correct: soft ? 'Soft (p or pp)' : 'Loud (f or ff)', wrong: [soft ? 'Loud (f or ff)' : 'Soft (p or pp)', 'It gets louder throughout', 'It gets softer throughout'], explain: `The phrase is played ${d.sign}, ${d.meaning}.` };
  },
  // expression terms
  (r) => {
    const t = r.pick(EXPRESSION_TERMS);
    return { text: `What does ${t.term.toLowerCase()} mean?`, correct: cap(t.meaning), wrong: r.shuffle(EXPRESSION_TERMS.filter(x => x !== t).map(x => cap(x.meaning))).slice(0, 3), explain: `${t.term}: ${t.meaning}.` };
  },
  // concepts
  (r) => {
    const q = r.pick([
      { text: 'What does ♩ = 120 mean?', correct: '120 crotchet beats per minute', wrong: ['120 bars', 'Play 120 notes', 'The piece lasts 120 seconds'] },
      { text: 'A slur and a tie look alike. What is the difference?', correct: 'A slur joins different pitches to be played smoothly; a tie joins the same pitch into one note', wrong: ['A slur is always longer', 'A tie means play staccato', 'There is no difference'] },
      { text: 'What is sfz?', correct: 'A sudden strong accent on one note', wrong: ['Gradually louder', 'Very soft', 'Return to the first tempo'] },
      { text: 'A hairpin that opens to the right means', correct: 'crescendo, gradually louder', wrong: ['diminuendo, gradually softer', 'accelerando', 'a tie'] },
      { text: 'What does mezzo mean in mezzo forte?', correct: 'Moderately', wrong: ['Very', 'Suddenly', 'Not'] },
      { text: 'For a wind player, a slur means', correct: 'play the notes in one breath without tonguing between them', wrong: ['breathe between each note', 'play each note short', 'play the notes louder'] },
      { text: 'Which word means at a walking pace?', correct: 'Andante', wrong: ['Allegro', 'Largo', 'Presto'] },
      { text: 'Where are dynamic markings usually written?', correct: 'Below the staff', wrong: ['Above the clef', 'In the key signature', 'At the end of the piece'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];

export function bank(unit = 1, seed = 13) { return makeBank(templates, unit, seed); }
export const meta = { code: 'L13', quizLength: 10, passMark: 70 };
