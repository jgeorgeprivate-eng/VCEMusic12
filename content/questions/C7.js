// C7 Documenting and reflecting.
import { makeBank } from './_util.js';
const SENT = [
  ['I set out to write a calm four-bar phrase in G major', 'Intention'],
  ['The starting idea was a three-note motif, G A B, in crotchets', 'Starting material'],
  ['I kept the dynamic piano and the articulation legato with sustained string chords', 'Elements shaped'],
  ['Bar 2 is the motif in sequence a step higher; bar 3 fragments it', 'Devices used'],
  ['I changed the last crotchet to a dotted minim because the ending sounded cut off', 'What changed and why'],
  ['It sounds calm, but the high note in bar 3 is abrupt; next time I would approach it by step', 'Result and next steps'],
  ['The aim was a menacing eight bars in D minor for low strings', 'Intention'],
  ['Bars 5 to 6 are the motif in augmentation over a drone', 'Devices used'],
  ['I moved the melody down an octave so it would sound darker', 'What changed and why'],
  ['The chord pattern I began from was I – V – vi – IV', 'Starting material'],
  ['I wanted a playful eight bars for flute over I – IV – V – I', 'Intention'],
  ['I used a staccato articulation and a high register throughout', 'Elements shaped'],
  ['The second phrase inverts the motif and ends with a contrasting cadence', 'Devices used'],
  ['I added a walking bass after the root notes sounded too plain', 'What changed and why'],
  ['The piece is playful, but the ending is too sudden; I would add a bar of rest', 'Result and next steps'],
  ['My idea was a dotted rhythm on one repeated note', 'Starting material'],
  ['The dynamics build from p to f across the four bars', 'Elements shaped'],
  ['It does sound menacing, mostly because of the drone', 'Result and next steps'],
];
const templates = [
  (r) => { const [s, k] = r.pick(SENT); return { text: `Which part of a reflection is this sentence: "${s}"?`, correct: k, wrong: r.shuffle(['Intention', 'Starting material', 'Elements shaped', 'Devices used', 'What changed and why', 'Result and next steps'].filter(x => x !== k)).slice(0, 3), explain: `${k}.` }; },
  (r) => {
    const q = r.pick([
      { text: 'What does documenting a piece mean?', correct: 'Keeping it in a form others can read or hear: notation, another written form or a recording', wrong: ['Writing its title', 'Memorising it', 'Deleting old versions'] },
      { text: 'What does reflecting mean?', correct: 'Explaining in musical terms what you set out to do, what you did and how well it worked', wrong: ['Playing the piece backwards', 'Listing your favourite songs', 'Writing the key signature'] },
      { text: 'Why keep a version from halfway through?', correct: 'A folio that shows the piece changing is worth more than one that shows only the result', wrong: ['To make the folio longer', 'Because the final version is never finished', 'To fill the page'] },
      { text: 'Which sentence belongs in a reflection?', correct: 'Bar 3 fragments the motif to two notes repeated over chord V.', wrong: ['I worked hard on this piece.', 'My teacher liked it.', 'It took me two weeks.'] },
      { text: 'How many questions does the reflection form ask?', correct: 'Six', wrong: ['Three', 'Ten', 'One'] },
      { text: 'Which export keeps the exact notes for use in other software?', correct: 'MIDI', wrong: ['Image', 'Text', 'A photo of the screen'] },
      { text: 'A good reflection sentence should contain', correct: 'at least one musical term', wrong: ['the composer\'s name', 'a rhyme', 'a question'] },
      { text: 'What should you date in a folio?', correct: 'Each version of the piece', wrong: ['Only the title page', 'Nothing', 'The reflection only'] },
      { text: 'Which methods count as documenting the music itself?', correct: 'Staff notation, a lead sheet, a rhythm grid, a graphic score or a recording', wrong: ['A list of instruments only', 'The reflection only', 'The name of the piece'] },
      { text: 'If a reflection sentence could be about any piece of schoolwork, it', correct: 'needs rewriting with musical terms', wrong: ['is fine', 'should be deleted', 'should be moved to the title'] },
      { text: 'What does Copy as text do in the reflection form?', correct: 'Puts the whole reflection on the clipboard for your folio document', wrong: ['Prints it', 'Emails it to your teacher', 'Deletes the piece'] },
      { text: 'What is the sixth reflection question about?', correct: 'Whether the piece does what you intended and what you would change', wrong: ['The tempo', 'The composer', 'The clef'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];
export function bank(unit = 1, seed = 37) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'C7', quizLength: 10, passMark: 70 };
