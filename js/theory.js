// theory.js — music data and rules shared by notation, audio, tools and question generators.
// Everything the app shows or plays is derived from these functions, so sight and sound always agree.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export const ACC_TEXT = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };

/** A pitch is { step: 'C'..'B', acc: -1|0|1, oct: number } (scientific octave, C4 = middle C). */
export function pitch(step, acc = 0, oct = 4) { return { step, acc, oct }; }

export function toMidi(p) { return 12 * (p.oct + 1) + LETTER_PC[p.step] + p.acc; }

export function pitchName(p, { octave = false } = {}) {
  return p.step + ACC_TEXT[p.acc] + (octave ? p.oct : '');
}

export function parsePitch(s) {
  const m = String(s).match(/^([A-Ga-g])([#♯b♭]*)(-?\d)?$/);
  if (!m) throw new Error('Bad pitch: ' + s);
  const acc = (m[2].match(/[#♯]/g) || []).length - (m[2].match(/[b♭]/g) || []).length;
  return { step: m[1].toUpperCase(), acc, oct: m[3] === undefined ? 4 : +m[3] };
}

/** Diatonic index: number of letter steps above C0 (used for staff position). */
export function diatonicIndex(p) { return p.oct * 7 + LETTERS.indexOf(p.step); }

export function pitchFromDiatonic(idx, acc = 0) {
  return { step: LETTERS[((idx % 7) + 7) % 7], acc, oct: Math.floor(idx / 7) };
}

export function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

/** Transpose a pitch by letter steps and a target semitone count, keeping the spelling sensible. */
export function transposeDiatonic(p, letterSteps, semitones) {
  const idx = diatonicIndex(p) + letterSteps;
  const base = pitchFromDiatonic(idx, 0);
  const acc = toMidi(p) + semitones - toMidi(base);
  return { ...base, acc };
}

// ---------- scales ----------

export const SCALE_PATTERNS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2],           // natural minor
  majorPentatonic: [2, 2, 3, 2, 3],
  minorPentatonic: [3, 2, 2, 3, 2],
};

// Letter steps between successive scale notes. Pentatonic scales skip letters.
const SCALE_LETTER_STEPS = {
  major: [1, 1, 1, 1, 1, 1, 1],
  minor: [1, 1, 1, 1, 1, 1, 1],
  majorPentatonic: [1, 1, 2, 1, 2],      // C D E G A C
  minorPentatonic: [2, 1, 1, 2, 1],      // A C D E G A
};

/** Build a scale as an array of pitches starting on the tonic (includes the top tonic). */
export function scale(tonic, type = 'major') {
  const pat = SCALE_PATTERNS[type], steps = SCALE_LETTER_STEPS[type];
  const out = [tonic];
  let cur = tonic;
  for (let i = 0; i < pat.length; i++) {
    cur = transposeDiatonic(cur, steps[i], pat[i]);
    out.push(cur);
  }
  return out;
}

/** Key signatures the course uses. Major keys up to two sharps or flats; minors are the relatives used in the app. */
export const KEYS = {
  'C': { tonic: pitch('C', 0, 4), mode: 'major', sharps: 0, flats: 0, unit: 1, relative: 'Am' },
  'G': { tonic: pitch('G', 0, 4), mode: 'major', sharps: 1, flats: 0, unit: 1, relative: 'Em' },
  'F': { tonic: pitch('F', 0, 4), mode: 'major', sharps: 0, flats: 1, unit: 1, relative: 'Dm' },
  'D': { tonic: pitch('D', 0, 4), mode: 'major', sharps: 2, flats: 0, unit: 2, relative: 'Bm' },
  'B♭': { tonic: pitch('B', -1, 3), mode: 'major', sharps: 0, flats: 2, unit: 2, relative: 'Gm' },
  'Am': { tonic: pitch('A', 0, 3), mode: 'minor', sharps: 0, flats: 0, unit: 1, relative: 'C' },
  'Em': { tonic: pitch('E', 0, 4), mode: 'minor', sharps: 1, flats: 0, unit: 1, relative: 'G' },
  'Dm': { tonic: pitch('D', 0, 4), mode: 'minor', sharps: 0, flats: 1, unit: 1, relative: 'F' },
};

export const MAJOR_KEYS_U1 = ['C', 'G', 'F'];
export const MAJOR_KEYS_U2 = ['C', 'G', 'F', 'D', 'B♭'];

export function keySignature(keyName) {
  const k = KEYS[keyName];
  if (!k) throw new Error('Unknown key ' + keyName);
  if (k.sharps) return SHARP_ORDER.slice(0, k.sharps).map(s => ({ step: s, acc: 1 }));
  if (k.flats) return FLAT_ORDER.slice(0, k.flats).map(s => ({ step: s, acc: -1 }));
  return [];
}

export function keyScale(keyName) {
  const k = KEYS[keyName];
  return scale(k.tonic, k.mode);
}

export function keyLabel(keyName) {
  const k = KEYS[keyName];
  return pitchName(k.tonic) + (k.mode === 'minor' ? ' minor' : ' major');
}

// ---------- intervals ----------

const INTERVAL_NUMBER_NAMES = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];
// Semitone content of perfect/major intervals by number (1..8)
const PERFECT_MAJOR_SEMIS = [0, 0, 2, 4, 5, 7, 9, 11, 12];
const PERFECT_NUMBERS = new Set([1, 4, 5, 8]);

/** Name the interval between two pitches (low to high). Returns { number, quality, name, semitones }. */
export function interval(a, b) {
  let lo = a, hi = b;
  if (toMidi(a) > toMidi(b)) { lo = b; hi = a; }
  const number = diatonicIndex(hi) - diatonicIndex(lo) + 1;
  const semitones = toMidi(hi) - toMidi(lo);
  if (number < 1 || number > 8) return { number, semitones, quality: '', name: `${semitones} semitones` };
  const ref = PERFECT_MAJOR_SEMIS[number];
  const diff = semitones - ref;
  let quality;
  if (PERFECT_NUMBERS.has(number)) {
    quality = diff === 0 ? 'perfect' : diff === 1 ? 'augmented' : diff === -1 ? 'diminished' : '?';
  } else {
    quality = diff === 0 ? 'major' : diff === -1 ? 'minor' : diff === 1 ? 'augmented' : diff === -2 ? 'diminished' : '?';
  }
  const numName = INTERVAL_NUMBER_NAMES[number - 1];
  const name = number === 1 ? 'unison' : number === 8 ? 'octave' : `${quality} ${numName}`;
  return { number, semitones, quality, name };
}

/** All diatonic intervals within an octave in a major key, built from scale degrees. */
export function diatonicIntervals(keyName) {
  const sc = keyScale(keyName);
  // Two octaves of the scale so every pair within an octave exists.
  const notes = sc.slice(0, 7).concat(sc.slice(0, 8).map(p => ({ ...p, oct: p.oct + 1 })));
  const out = [];
  for (let i = 0; i < 7; i++) for (let j = i + 1; j <= i + 7; j++) {
    const iv = interval(notes[i], notes[j]);
    out.push({ lo: notes[i], hi: notes[j], ...iv });
  }
  return out;
}

// ---------- triads and progressions ----------

export const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
export const COURSE_DEGREES = [1, 2, 4, 5, 6];   // I, ii, IV, V, vi

export function triad(keyName, degree) {
  const sc = keyScale(keyName).slice(0, 7);
  const two = sc.concat(sc.map(p => ({ ...p, oct: p.oct + 1 })));
  const i = degree - 1;
  const notes = [two[i], two[i + 2], two[i + 4]];
  const third = interval(notes[0], notes[1]).quality;
  const fifth = interval(notes[0], notes[2]).quality;
  const quality = fifth === 'diminished' ? 'diminished' : third === 'major' ? 'major' : 'minor';
  return { degree, roman: ROMAN[i], notes, quality, root: notes[0], name: pitchName(notes[0]) + (quality === 'minor' ? ' minor' : quality === 'diminished' ? ' diminished' : ' major') };
}

export const PROGRESSIONS = [
  { id: 'V-I', degrees: [5, 1], label: 'V – I' },
  { id: 'ii-V-I', degrees: [2, 5, 1], label: 'ii – V – I' },
  { id: 'I-IV-V-I', degrees: [1, 4, 5, 1], label: 'I – IV – V – I' },
  { id: 'I-V-vi-IV', degrees: [1, 5, 6, 4], label: 'I – V – vi – IV' },
];

/** Voice a progression with simple close voicing so chords move smoothly. */
export function progressionChords(keyName, prog) {
  return prog.degrees.map(d => triad(keyName, d));
}

// ---------- rhythm ----------
// Durations are in 48ths of a crotchet: crotchet 48, quaver 24, semiquaver 12, triplet quaver 16.

export const DUR = { semibreve: 192, dottedMinim: 144, minim: 96, dottedCrotchet: 72, crotchet: 48, dottedQuaver: 36, quaver: 24, semiquaver: 12, tripletQuaver: 16 };

/** Rhythmic groupings from the study design, each one beat (or more) long. Each is a list of note durations. */
export const GROUPINGS_U1 = [
  { id: 'semibreve', notes: [192], beats: 4, name: 'semibreve' },
  { id: 'dottedMinim', notes: [144], beats: 3, name: 'dotted minim' },
  { id: 'minim', notes: [96], beats: 2, name: 'minim' },
  { id: 'crotchet', notes: [48], beats: 1, name: 'crotchet' },
  { id: 'dottedCrotchet', notes: [72], beats: 1.5, name: 'dotted crotchet' },
  { id: 'quaver', notes: [24], beats: 0.5, name: 'single quaver' },
  { id: 'twoQuavers', notes: [24, 24], beats: 1, name: 'two quavers' },
  { id: 'fourSemis', notes: [12, 12, 12, 12], beats: 1, name: 'four semiquavers' },
  { id: 'quaverTwoSemis', notes: [24, 12, 12], beats: 1, name: 'a quaver and two semiquavers' },
  { id: 'twoSemisQuaver', notes: [12, 12, 24], beats: 1, name: 'two semiquavers and a quaver' },
  { id: 'dottedQuaverSemi', notes: [36, 12], beats: 1, name: 'dotted quaver and semiquaver' },
  { id: 'semiDottedQuaver', notes: [12, 36], beats: 1, name: 'semiquaver and dotted quaver' },
  { id: 'triplet', notes: [16, 16, 16], beats: 1, name: 'quaver triplet', tuplet: 3 },
];
export const GROUPINGS_68 = [
  { id: 'threeQuavers', notes: [24, 24, 24], beats: 1.5, name: 'three quavers' },
  { id: 'sixSemis', notes: [12, 12, 12, 12, 12, 12], beats: 1.5, name: 'six semiquavers' },
  { id: 'twoSemisTwoQuavers', notes: [12, 12, 24, 24], beats: 1.5, name: 'two semiquavers and two quavers' },
];

export const METRES = {
  '4/4': { beats: 4, beatUnit: 48, barLength: 192, unit: 1 },
  '3/4': { beats: 3, beatUnit: 48, barLength: 144, unit: 1 },
  '6/8': { beats: 2, beatUnit: 72, barLength: 144, unit: 2 },
};

// ---------- random helpers ----------

/** Small seeded random generator (mulberry32) so question banks are reproducible. */
export function rng(seed) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (arr) => arr[r.int(arr.length)];
  r.shuffle = (arr) => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = r.int(i + 1); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  return r;
}

export function samePitch(a, b) { return a.step === b.step && a.acc === b.acc && a.oct === b.oct; }
export function samePitchClass(a, b) { return a.step === b.step && a.acc === b.acc; }

// ---------- additions for Strand 1 ----------

export const MINOR_KEYS = ['Am', 'Em', 'Dm'];
export const ALL_KEYS_U1 = ['C', 'G', 'F', 'Am', 'Em', 'Dm'];

/** Pentatonic scales built from a tonic pitch. Major pentatonic uses degrees 1 2 3 5 6 of the major scale; minor pentatonic 1 b3 4 5 b7. */
export function pentatonic(tonic, type = 'majorPentatonic') { return scale(tonic, type); }

/** Which degrees of the parent scale a pentatonic keeps (for explanations). */
export const PENTATONIC_DEGREES = { majorPentatonic: [1, 2, 3, 5, 6], minorPentatonic: [1, 3, 4, 5, 7] };

/** Describe the contour of a melody (array of pitches). Returns one of: 'rising', 'falling', 'arch', 'inverted arch', 'repeated', 'wave'. */
export function contour(pitches) {
  const m = pitches.map(toMidi);
  const dirs = [];
  for (let i = 1; i < m.length; i++) { const d = Math.sign(m[i] - m[i - 1]); if (d !== 0 && d !== dirs[dirs.length - 1]) dirs.push(d); }
  if (dirs.length === 0) return 'repeated';
  if (dirs.length === 1) return dirs[0] > 0 ? 'rising' : 'falling';
  if (dirs.length === 2) return dirs[0] > 0 ? 'arch' : 'inverted arch';
  return 'wave';
}

/** Classify each move in a melody as 'step', 'leap' or 'repeat'. A step is a 2nd; anything larger is a leap. */
export function motion(a, b) {
  const d = Math.abs(diatonicIndex(b) - diatonicIndex(a));
  return d === 0 ? 'repeat' : d === 1 ? 'step' : 'leap';
}

/**
 * Turn a rhythm grid (array of 0/1 per semiquaver cell) into notation events for one bar.
 * beatCells: 4 for simple metres (semiquavers per crotchet), 6 for 6/8 (semiquavers per dotted crotchet).
 */
export function gridToEvents(cells, beatCells = 4) {
  const events = [];
  for (let b = 0; b < cells.length; b += beatCells) {
    const beat = cells.slice(b, b + beatCells);
    const onsets = []; beat.forEach((v, i) => { if (v) onsets.push(i); });
    if (!onsets.length) { pushRest(events, beatCells * 12); continue; }
    if (onsets[0] > 0) pushRest(events, onsets[0] * 12);
    onsets.forEach((o, k) => {
      const end = k + 1 < onsets.length ? onsets[k + 1] : beatCells;
      pushNote(events, (end - o) * 12);
    });
  }
  return events;
}
function pushRest(events, d) { splitDur(d).forEach(x => events.push({ rest: true, dur: x.dur, dot: x.dot })); }
function pushNote(events, d) { const parts = splitDur(d); parts.forEach((x, i) => events.push({ dur: x.dur, dot: x.dot, tie: i < parts.length - 1 })); }
/** Split a duration in 48ths into drawable note values (with dots), largest first. */
export function splitDur(d) {
  const table = [[192, false], [144, true], [96, false], [72, true], [48, false], [36, true], [24, false], [18, true], [12, false]];
  const out = [];
  let rem = d;
  while (rem > 0) {
    const t = table.find(([v]) => v <= rem);
    if (!t) break;
    out.push({ dur: t[1] ? t[0] / 1.5 : t[0], dot: t[1] });
    rem -= t[0];
  }
  return out;
}

/** Common Italian terms used in the course. */
export const TEMPO_TERMS = [
  { term: 'Largo', meaning: 'very slow and broad', bpm: 50 },
  { term: 'Adagio', meaning: 'slow', bpm: 66 },
  { term: 'Andante', meaning: 'at a walking pace', bpm: 84 },
  { term: 'Moderato', meaning: 'at a moderate speed', bpm: 104 },
  { term: 'Allegro', meaning: 'fast and lively', bpm: 132 },
  { term: 'Vivace', meaning: 'lively and brisk', bpm: 156 },
  { term: 'Presto', meaning: 'very fast', bpm: 180 },
];
export const TEMPO_CHANGES = [
  { term: 'Accelerando (accel.)', meaning: 'gradually getting faster' },
  { term: 'Ritardando (rit.)', meaning: 'gradually getting slower' },
  { term: 'Rallentando (rall.)', meaning: 'gradually getting slower' },
  { term: 'A tempo', meaning: 'back to the original speed' },
  { term: 'Rubato', meaning: 'with a flexible, give-and-take tempo' },
];
export const DYNAMICS = [
  { sign: 'pp', term: 'pianissimo', meaning: 'very soft', level: 0.2 },
  { sign: 'p', term: 'piano', meaning: 'soft', level: 0.35 },
  { sign: 'mp', term: 'mezzo piano', meaning: 'moderately soft', level: 0.5 },
  { sign: 'mf', term: 'mezzo forte', meaning: 'moderately loud', level: 0.7 },
  { sign: 'f', term: 'forte', meaning: 'loud', level: 0.9 },
  { sign: 'ff', term: 'fortissimo', meaning: 'very loud', level: 1.2 },
];
export const DYNAMIC_CHANGES = [
  { term: 'Crescendo (cresc.)', meaning: 'gradually getting louder' },
  { term: 'Diminuendo (dim.)', meaning: 'gradually getting softer' },
  { term: 'Decrescendo (decresc.)', meaning: 'gradually getting softer' },
  { term: 'Sforzando (sfz)', meaning: 'a sudden strong accent on one note' },
];
export const ARTICULATIONS = [
  { term: 'Staccato', sign: 'a dot above or below the note', meaning: 'short and detached', artic: 'staccato' },
  { term: 'Legato', sign: 'a curved line (slur) over the notes', meaning: 'smooth and connected, with no gap between notes', artic: 'legato' },
  { term: 'Accent', sign: 'a small > above or below the note', meaning: 'the note is played with extra force', artic: 'accent' },
  { term: 'Tenuto', sign: 'a short line above or below the note', meaning: 'held for its full value, slightly leaned on', artic: 'tenuto' },
  { term: 'Marcato', sign: 'a small ^ above the note', meaning: 'marked: strongly accented and a little separated', artic: 'marcato' },
];
export const EXPRESSION_TERMS = [
  { term: 'Dolce', meaning: 'sweetly' },
  { term: 'Cantabile', meaning: 'in a singing style' },
  { term: 'Espressivo', meaning: 'expressively' },
  { term: 'Con brio', meaning: 'with spirit' },
  { term: 'Maestoso', meaning: 'majestically' },
  { term: 'Grazioso', meaning: 'gracefully' },
  { term: 'Agitato', meaning: 'agitated, restless' },
  { term: 'Tranquillo', meaning: 'calm' },
];

/** Beats (crotchets) an event lasts, allowing for a dot. */
export function evBeats(ev) { return ev.dur * (ev.dot ? 1.5 : 1) / 48; }
