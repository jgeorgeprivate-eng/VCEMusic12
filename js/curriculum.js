// curriculum.js — the lesson list. Lesson text lives in content/lessons/<code>.md; questions in content/questions/<code>.js.

export const STRANDS = {
  lang: { id: 'lang', name: 'Music language and aural skills', short: 'Music language', colour: 'var(--lang)' },
  anal: { id: 'anal', name: 'Analysis', short: 'Analysis', colour: 'var(--anal)' },
  creat: { id: 'creat', name: 'Creating', short: 'Creating', colour: 'var(--creat)' },
  perf: { id: 'perf', name: 'Performing', short: 'Performing', colour: 'var(--perf)' },
};

export const LESSONS = [
  { code: 'L1', strand: 'lang', title: 'Reading notation', units: [1, 2] },
  { code: 'L2', strand: 'lang', title: 'Note values and rhythm', units: [1, 2] },
  { code: 'L3', strand: 'lang', title: 'Metre', units: [1, 2] },
  { code: 'L4', strand: 'lang', title: 'Major scales', units: [1, 2] },
  { code: 'L5', strand: 'lang', title: 'Natural minor scales', units: [1, 2] },
  { code: 'L6', strand: 'lang', title: 'Pentatonic scales', units: [1, 2] },
  { code: 'L7', strand: 'lang', title: 'Intervals', units: [1, 2] },
  { code: 'L8', strand: 'lang', title: 'Melodic contour', units: [1, 2] },
  { code: 'L9', strand: 'lang', title: 'Melodic dictation', units: [1, 2] },
  { code: 'L10', strand: 'lang', title: 'Triads', units: [1, 2] },
  { code: 'L11', strand: 'lang', title: 'Chord progressions', units: [1, 2] },
  { code: 'L12', strand: 'lang', title: 'Other ways to document music', units: [1, 2] },
  { code: 'L13', strand: 'lang', title: 'Performance markings', units: [1, 2] },
  { code: 'A1', strand: 'anal', title: 'Elements of music', units: [1, 2] },
  { code: 'A2', strand: 'anal', title: 'Compositional devices', units: [1, 2] },
  { code: 'A3', strand: 'anal', title: 'Texture types', units: [1, 2] },
  { code: 'A4', strand: 'anal', title: 'Approaches to organisation', units: [1] },
  { code: 'A5', strand: 'anal', title: 'Listening and responding', units: [1, 2] },
  { code: 'A6', strand: 'anal', title: 'Creating effect', units: [2] },
  { code: 'A7', strand: 'anal', title: 'Comparing versions', units: [2] },
  { code: 'A8', strand: 'anal', title: 'Context', units: [1, 2] },
  { code: 'C1', strand: 'creat', title: 'Harmonising a melody', units: [1, 2] },
  { code: 'C2', strand: 'creat', title: 'Writing a melody over chords', units: [1, 2] },
  { code: 'C3', strand: 'creat', title: 'Bass lines', units: [1, 2] },
  { code: 'C4', strand: 'creat', title: 'Developing a motif', units: [1, 2] },
  { code: 'C5', strand: 'creat', title: 'Organising a short piece', units: [1] },
  { code: 'C6', strand: 'creat', title: 'Composing for effect', units: [2] },
  { code: 'C7', strand: 'creat', title: 'Documenting and reflecting', units: [1, 2] },
  { code: 'P1', strand: 'perf', title: 'Analysing my own pieces', units: [1, 2] },
  { code: 'P2', strand: 'perf', title: 'Performance challenges', units: [1, 2] },
  { code: 'P3', strand: 'perf', title: 'Designing exercises', units: [1, 2] },
  { code: 'P4', strand: 'perf', title: 'Practice planning and reflection', units: [1, 2] },
  { code: 'P5', strand: 'perf', title: 'Ensemble skills', units: [1, 2] },
  { code: 'P6', strand: 'perf', title: 'Performing for effect', units: [2] },
];

// Lessons that exist as content so far. Others show as "coming soon".
export const BUILT = new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']);

export function lesson(code) { return LESSONS.find(l => l.code === code); }
export function byStrand(id) { return LESSONS.filter(l => l.strand === id); }
export function lessonNumber(code) { const l = lesson(code); const list = byStrand(l.strand); return list.indexOf(l) + 1; }
export function nextLesson(code) { const l = lesson(code); const list = byStrand(l.strand); return list[list.indexOf(l) + 1] || null; }
