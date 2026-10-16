// L12 Other ways to document music.
import { makeBank } from './_util.js';

const METHODS = ['Staff notation', 'Graphic notation', 'Tablature (TAB)', 'Lead sheet', 'Rhythm grid', 'Annotated track listing'];

const SITUATIONS = [
  { s: 'A guitarist wants to know exactly which frets to press for a riff.', m: 'Tablature (TAB)', why: 'TAB shows strings and frets directly.' },
  { s: 'A band needs the melody and the chords of a song so each player can make up their own part.', m: 'Lead sheet', why: 'A lead sheet gives the melody with chord symbols and leaves the accompaniment to the players.' },
  { s: 'A composer writes a piece of electronic sound with glides and noises that have no exact pitch.', m: 'Graphic notation', why: 'Graphic notation shows shapes and rough pitch and time where staff notation cannot.' },
  { s: 'A student describes the sections of a recorded song and what happens in each, with timings.', m: 'Annotated track listing', why: 'An annotated track listing records sections against a timeline.' },
  { s: 'A drummer programs a one-bar pattern in a drum machine.', m: 'Rhythm grid', why: 'A rhythm grid (step sequencer) shows which subdivision each hit falls on.' },
  { s: 'A string quartet needs every note, rhythm, dynamic and bowing written out.', m: 'Staff notation', why: 'Staff notation gives exact pitch, rhythm and performance markings.' },
  { s: 'A songwriter wants to write down a new song quickly so a pianist can accompany her.', m: 'Lead sheet', why: 'Melody plus chord symbols is enough for an accompanist.' },
  { s: 'A teacher wants students to write a rhythm without any staff notation.', m: 'Rhythm grid', why: 'A grid needs no knowledge of note values.' },
  { s: 'A bass player learns a line from a video and wants to note the fret positions.', m: 'Tablature (TAB)', why: 'TAB records where the fingers go on a fretted instrument.' },
  { s: 'A student analyses the texture and dynamics of a three-minute recording for a listening task.', m: 'Annotated track listing', why: 'The track listing ties observations to times in the recording.' },
  { s: 'An oboist needs a solo part with exact pitches, rhythms and articulation.', m: 'Staff notation', why: 'Only staff notation gives all of these precisely.' },
  { s: 'A piece asks performers to improvise freely within a rising and falling shape over 30 seconds.', m: 'Graphic notation', why: 'A drawn shape over a timeline shows the idea without fixing the notes.' },
  { s: 'A choir needs all four vocal parts written out with every pitch and rhythm.', m: 'Staff notation', why: 'Parts for singers with exact pitches and rhythms need staff notation.' },
  { s: 'A ukulele beginner wants to play a melody without learning to read the staff.', m: 'Tablature (TAB)', why: 'TAB shows where to press on a fretted instrument without staff reading.' },
  { s: 'A jazz trio plays a standard from a book that gives the tune and the chord symbols.', m: 'Lead sheet', why: 'Jazz standards are written as lead sheets.' },
  { s: 'A producer maps out where the verse, chorus and bridge fall in a four-minute track with timings.', m: 'Annotated track listing', why: 'Sections against a timeline is an annotated track listing.' },
  { s: 'A percussion class composes a rhythm by filling boxes on a 16-box line.', m: 'Rhythm grid', why: 'Boxes for subdivisions is a rhythm grid.' },
  { s: 'A composer sketches a texture that thickens and thins over a minute, without specific pitches.', m: 'Graphic notation', why: 'Density and shape over time suit graphic notation.' },
];

const templates = [
  (r) => {
    const it = r.pick(SITUATIONS);
    return { text: `${it.s} Which method of documenting music suits this best?`, correct: it.m, wrong: r.shuffle(METHODS.filter(x => x !== it.m)).slice(0, 3), explain: it.why };
  },
  (r) => {
    const q = r.pick([
      { text: 'In tablature, what do the six lines stand for?', correct: 'The six strings of the guitar', wrong: ['Six pitches, like a staff', 'Six beats in a bar', 'Six frets'] },
      { text: 'In tablature, what does a number on a line mean?', correct: 'The fret to press on that string', wrong: ['The finger to use', 'The beat it falls on', 'The string to play'] },
      { text: 'In tablature, what does 0 mean?', correct: 'Play the string open, without pressing a fret', wrong: ['Do not play that string', 'Play the lowest note', 'Rest'] },
      { text: 'Which string is on the top line of guitar TAB?', correct: 'The thinnest, highest-sounding string', wrong: ['The thickest, lowest string', 'The middle string', 'It varies by piece'] },
      { text: 'What does a lead sheet contain?', correct: 'The melody with chord symbols above it', wrong: ['Every part written out in full', 'Only the chord symbols', 'Only the lyrics'] },
      { text: 'What does the chord symbol Dm mean?', correct: 'D minor', wrong: ['D major', 'D diminished', 'D with a seventh'] },
      { text: 'What does the chord symbol G7 mean?', correct: 'G major with an added seventh', wrong: ['G minor', 'G played seven times', 'The seventh chord of the key'] },
      { text: 'In graphic notation, what does height on the page usually show?', correct: 'Pitch', wrong: ['Loudness', 'Tempo', 'Instrument'] },
      { text: 'In graphic notation, what does the left-to-right direction usually show?', correct: 'Time', wrong: ['Pitch', 'Loudness', 'Texture'] },
      { text: 'Why does a graphic score come with a key explaining its symbols?', correct: 'Each piece invents its own symbols', wrong: ['The symbols are the same as staff notation', 'The key shows the tonic', 'The key shows the tempo'] },
      { text: 'What does an annotated track listing record?', correct: 'The sections of a recording with timings and notes on their musical features', wrong: ['The frets to press', 'The chord symbols for a band', 'The exact pitches of a melody'] },
      { text: 'In a rhythm grid with 16 boxes for a bar of 4/4, what does each box stand for?', correct: 'A semiquaver', wrong: ['A quaver', 'A crotchet', 'A beat'] },
      { text: 'What is the main weakness of tablature on its own?', correct: 'It shows rhythm poorly', wrong: ['It does not show which string to play', 'It only works for piano', 'It cannot show open strings'] },
      { text: 'What is the main strength of staff notation?', correct: 'It shows exact pitch and rhythm together with dynamics and articulation', wrong: ['It shows finger positions', 'Anyone can read it without training', 'It shows how a sound was produced'] },
      { text: 'A piano roll in a sequencer is a kind of', correct: 'rhythm grid with a row for each pitch', wrong: ['lead sheet', 'graphic score with no timeline', 'tablature'] },
      { text: 'Which two methods are most often printed together for guitar music?', correct: 'Staff notation and tablature', wrong: ['Graphic notation and a rhythm grid', 'A lead sheet and a track listing', 'Tablature and a track listing'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
];

export function bank(unit = 1, seed = 12) { return makeBank(templates, unit, seed, 34); }
export const meta = { code: 'L12', quizLength: 10, passMark: 70 };
