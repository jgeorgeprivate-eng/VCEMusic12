// P5 Ensemble skills.
import { makeBank } from './_util.js';
const P5_MORE = [
  ['Your part is marked forte but the melody is in the clarinet. How loud do you play?', 'Softer than the clarinet, so the melody is heard'],
  ['The conductor gives an upbeat. When do you breathe?', 'On the upbeat, a beat before the entry'],
  ['You and the flute are a semitone apart on a long chord and it sounds rough. What is happening?', 'It is written that way; listen and keep your note steady'],
  ['You and the flute have the same note and it throbs. What is happening?', 'You are slightly out of tune with each other; one of you adjusts'],
  ['You lose your place in a fast passage. What do you do?', 'Keep going and rejoin at the next clear point'],
  ['What should you do with decisions made in rehearsal about dynamics?', 'Mark them in your part in pencil'],
  ['How do you know when you have the tune?', 'Know the score, and listen for who the ear follows'],
  ['What goes in the journal after a rehearsal?', 'What the group needs to fix and what you need to fix'],
  ['Why tune to the same reference before playing?', 'So every part starts from the same pitch'],
];
const templates = [
  (r) => { const [s, t] = r.pick(P5_MORE); return { text: s, correct: t, wrong: r.shuffle(P5_MORE.filter(x => x[1] !== t).map(x => x[1])).slice(0, 3), explain: `${t}.` }; },

  (r) => {
    const q = r.pick([
      { text: 'What is balance in an ensemble?', correct: 'The relative loudness of the parts, so the melody is heard and the accompaniment supports it', wrong: ['Standing evenly on both feet', 'Playing all parts at the same volume', 'Tuning to A'] },
      { text: 'If you cannot hear the melody over yourself, you are', correct: 'too loud', wrong: ['too soft', 'out of tune', 'too fast'] },
      { text: 'A forte in an accompanying part is', correct: 'softer than a forte in the melody', wrong: ['the same as a forte in the melody', 'louder than the melody', 'ignored'] },
      { text: 'Who should you listen to for the beat and the harmony?', correct: 'The bass', wrong: ['The highest part', 'Yourself', 'The audience'] },
      { text: 'When two players have the same note and it is out of tune,', correct: 'one of them adjusts; agree in rehearsal who', wrong: ['both play louder', 'both stop', 'the conductor plays it'] },
      { text: 'A cue is given', correct: 'a beat before it is needed, so look up a beat early', wrong: ['on the note itself', 'after the entry', 'only at the end'] },
      { text: 'What should you mark in your part in pencil?', correct: 'Breaths, cues, and dynamics decided in rehearsal', wrong: ['The composer\'s birthday', 'Nothing; parts must stay clean', 'The names of the other players'] },
      { text: 'What is rehearsal for?', correct: 'Putting the parts together, not learning the notes', wrong: ['Learning your notes', 'Choosing the pieces', 'Tuning the piano'] },
      { text: 'When something goes wrong in a performance,', correct: 'keep going; the group is the priority', wrong: ['stop and restart', 'play louder', 'leave the stage'] },
      { text: 'Where does tuning show most in an ensemble?', correct: 'Long notes and unisons', wrong: ['Fast runs', 'Rests', 'Staccato notes'] },
      { text: 'How do you practise entries after long rests?', correct: 'Count them aloud against the metronome', wrong: ['Guess', 'Watch the clock', 'Skip the rests'] },
      { text: 'Three questions to answer about your part before a rehearsal:', correct: 'Where do I have the tune, where do I accompany, and where are my hardest entries?', wrong: ['What reed, what chair, what stand?', 'Who is the composer, when was it written, what key?', 'How long, how loud, how fast?'] },
      { text: 'Why does balance apply to the oboe more than most?', correct: 'Its tone carries', wrong: ['It is always the melody', 'It cannot play softly', 'It is tuned differently'] },
      { text: 'What do the beats you hear between two almost-in-tune notes tell you?', correct: 'That one note needs adjusting until the beats stop', wrong: ['That the tempo is wrong', 'That the key has changed', 'Nothing'] },
      { text: 'What does the metronome in the practice room offer for group work?', correct: '4/4, 3/4, 2/4 and 6/8 with subdivisions and a tap tempo', wrong: ['A tuner only', 'Recordings of the orchestra', 'A conductor'] },
      { text: 'Making eye contact at entries helps because', correct: 'players start together', wrong: ['it is polite', 'it makes the music louder', 'it changes the tempo'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  (r) => { const items = [['You have the melody', 'Project it'], ['Someone else has the melody', 'Play under them'], ['You have a long unison with the flute', 'Listen for beats and adjust'], ['You have twelve bars of rest', 'Count in bars and watch for your cue'], ['The leader lifts the baton', 'Look up and breathe with the group']]; const [s, t] = r.pick(items); return { text: `${s}. What do you do?`, correct: t, wrong: items.filter(x => x[1] !== t).map(x => x[1]).slice(0, 3), explain: `${t}.` }; },
];
export function bank(unit = 1, seed = 45) { return makeBank(templates, unit, seed, 30); }
export const meta = { code: 'P5', quizLength: 10, passMark: 70 };
