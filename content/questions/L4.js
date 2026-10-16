// Questions for L4 Major scales. Every answer is computed from theory.js, never typed in by hand.
import { KEYS, keyScale, keySignature, pitchName, toMidi, rng, MAJOR_KEYS_U1, MAJOR_KEYS_U2, transposeDiatonic, LETTERS, pitch } from '../../js/theory.js';

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

function keysFor(unit) { return unit >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1; }
function sigText(k) { const s = KEYS[k]; if (s.sharps) return s.sharps === 1 ? 'one sharp' : 'two sharps'; if (s.flats) return s.flats === 1 ? 'one flat' : 'two flats'; return 'no sharps or flats'; }
function scaleText(k) { return keyScale(k).map(p => pitchName(p)).join(' '); }
function unique(arr) { return [...new Set(arr)]; }

/** Templates. Each gets (r, unit) and returns a question or null. */
const templates = [
  // 1. degree of a key
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k); const d = r.int(7) + 2;   // degrees 2..8
    const correct = pitchName(sc[d - 1]);
    const pool = unique([
      pitchName(transposeDiatonic(sc[d - 1], 0, 1)), pitchName(transposeDiatonic(sc[d - 1], 0, -1)),
      pitchName(sc[d % 7]), pitchName(sc[(d + 5) % 7]), pitchName(transposeDiatonic(sc[d - 1], 1, 2)),
    ].filter(x => x !== correct && !x.includes('𝄪') && !x.includes('𝄫')));
    return { text: `Which note is the ${ORD[d - 1]} note (degree ${d}) of ${k} major?`, correct, wrong: r.shuffle(pool).slice(0, 3), unit: KEYS[k].unit,
      explain: `${k} major is ${scaleText(k)}. Degree ${d} is ${correct}.` };
  },
  // 2. how many sharps or flats
  (r, unit) => {
    const k = r.pick(keysFor(unit));
    const correct = sigText(k);
    const all = ['no sharps or flats', 'one sharp', 'one flat', 'two sharps', 'two flats'];
    return { text: `How many sharps or flats are in the key signature of ${k} major?`, correct, wrong: r.shuffle(all.filter(x => x !== correct)).slice(0, 3), unit: KEYS[k].unit,
      explain: `${k} major has ${correct}${KEYS[k].sharps || KEYS[k].flats ? ': ' + keySignature(k).map(a => pitchName(a)).join(' and ') : ''}.` };
  },
  // 3. name the key from a drawn key signature
  (r, unit) => {
    const k = r.pick(keysFor(unit));
    const correct = `${k} major`;
    const wrong = r.shuffle(keysFor(2).filter(x => x !== k)).slice(0, 3).map(x => `${x} major`);
    return { text: 'Which major key has this key signature?', notation: { key: k, events: [], noEnd: true }, correct, wrong, unit: KEYS[k].unit,
      explain: `This key signature has ${sigText(k)}${keySignature(k).length ? ' (' + keySignature(k).map(a => pitchName(a)).join(', ') + ')' : ''}, so it is ${k} major.` };
  },
  // 4. tone or semitone between degrees
  (r) => {
    const d = r.int(7) + 1;   // gap from d to d+1
    const pat = [2, 2, 1, 2, 2, 2, 1];
    const correct = pat[d - 1] === 1 ? 'a semitone' : 'a tone';
    return { text: `In a major scale, what is the gap between degree ${d} and degree ${d + 1}?`, correct, wrong: [correct === 'a tone' ? 'a semitone' : 'a tone', 'a tone and a half', 'two tones'], unit: 1,
      explain: `The major scale pattern is T T S T T T S. The semitones are between degrees 3 and 4 and between 7 and 8, so ${d} to ${d + 1} is ${correct}.` };
  },
  // 5. correctly spelled scale
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const correct = scaleText(k);
    const wrongs = new Set();
    let guard = 0;
    while (wrongs.size < 3 && guard++ < 40) {
      const i = r.int(6) + 1;                       // alter one inner note
      const alt = sc.map((p, j) => j === i ? { ...p, acc: p.acc + (r() < 0.5 ? 1 : -1) } : p);
      if (alt[i].acc > 1 || alt[i].acc < -1) continue;
      const t = alt.map(p => pitchName(p)).join(' ');
      if (t !== correct) wrongs.add(t);
    }
    return { text: `Which of these is the ${k} major scale written correctly?`, correct, wrong: [...wrongs], unit: KEYS[k].unit, mono: true,
      explain: `${k} major is ${correct}. Check the pattern T T S T T T S from ${pitchName(sc[0])}.` };
  },
  // 6. hear a scale with one wrong degree
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const d = r.pick([2, 3, 4, 6, 7]);
    const dir = (d === 7 || d === 3 || d === 6) ? -1 : 1;
    const altered = sc.map((p, j) => j === d - 1 ? { ...p, acc: p.acc + dir } : p);
    const correct = `Degree ${d}`;
    const wrong = r.shuffle([2, 3, 4, 5, 6, 7].filter(x => x !== d)).slice(0, 3).map(x => `Degree ${x}`);
    return { text: `Listen to this scale. One note has been changed so it is no longer a major scale. Which degree is wrong?`, audio: altered.map(p => ({ midi: toMidi(p), beats: 0.6 })), correct, wrong, unit: KEYS[k].unit,
      explain: `Degree ${d} was ${dir < 0 ? 'lowered' : 'raised'} by a semitone. In ${k} major it should be ${pitchName(sc[d - 1])}.` };
  },
  // 7. which notes are sharp or flat
  (r, unit) => {
    const ks = keysFor(unit).filter(k => KEYS[k].sharps || KEYS[k].flats);
    const k = r.pick(ks); const sig = keySignature(k);
    const correct = sig.map(a => pitchName(a)).join(' and ');
    const kind = sig[0].acc === 1 ? 'sharp' : 'flat';
    const others = ['F♯', 'C♯', 'G♯', 'B♭', 'E♭', 'A♭', 'F♯ and C♯', 'B♭ and E♭', 'F♯ and G♯', 'B♭ and A♭', 'C♯ and G♯', 'E♭ and A♭'];
    const wrong = r.shuffle(others.filter(x => x !== correct)).slice(0, 3);
    return { text: `Which note${sig.length > 1 ? 's are' : ' is'} ${kind} in ${k} major?`, correct, wrong, unit: KEYS[k].unit,
      explain: `${k} major is ${scaleText(k)}. The ${kind}${sig.length > 1 ? 's are' : ' is'} ${correct}.` };
  },
  // 8. a tone or semitone above a note
  (r) => {
    const start = r.pick(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    const semis = r() < 0.5 ? 1 : 2;
    const p = pitch(start, 0, 4);
    const correctP = transposeDiatonic(p, 1, semis);
    let correct = pitchName(correctP);
    // keep spellings simple: prefer the name without a double accidental
    const alts = unique([pitchName(transposeDiatonic(p, 1, semis === 1 ? 2 : 1)), pitchName(transposeDiatonic(p, 1, 0)), pitchName(transposeDiatonic(p, 2, semis + 2)), pitchName(transposeDiatonic(p, 0, semis))].filter(x => x !== correct && !x.includes('𝄪') && !x.includes('𝄫')));
    return { text: `Which note is ${semis === 1 ? 'a semitone' : 'a tone'} above ${start}?`, correct, wrong: r.shuffle(alts).slice(0, 3), unit: 1,
      explain: `${semis === 1 ? 'A semitone is one step to the very next key' : 'A tone is two semitones'}. ${semis === 1 ? 'One' : 'Two'} semitone${semis === 1 ? '' : 's'} above ${start} is ${correct}.` };
  },
  // 9. which key has this key signature (text)
  (r, unit) => {
    const ks = keysFor(unit);
    const k = r.pick(ks);
    const correct = `${k} major`;
    return { text: `Which major key has ${sigText(k)}${keySignature(k).length ? ' (' + keySignature(k).map(a => pitchName(a)).join(' and ') + ')' : ''}?`, correct, wrong: r.shuffle(keysFor(2).filter(x => x !== k)).slice(0, 3).map(x => `${x} major`), unit: KEYS[k].unit,
      explain: `${correct} is ${scaleText(k)}.` };
  },
  // 10. tonic or leading note
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const which = r() < 0.5 ? 'tonic' : 'leading note';
    const correct = pitchName(which === 'tonic' ? sc[0] : sc[6]);
    const wrong = r.shuffle(sc.slice(0, 7).map(p => pitchName(p)).filter(x => x !== correct)).slice(0, 3);
    return { text: `What is the ${which} of ${k} major?`, correct, wrong, unit: KEYS[k].unit,
      explain: which === 'tonic' ? `The tonic is degree 1, the note the scale is named after: ${correct}.` : `The leading note is degree 7, a semitone below the tonic: ${correct}.` };
  },
  // 11. name the key of a scale drawn with accidentals (no key signature)
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const correct = `${k} major`;
    return { text: 'This scale is written with accidentals instead of a key signature. Which key is it?', notation: { key: 'C', events: sc.map(p => ({ pitches: [p], dur: 48 })), noEnd: true }, correct, wrong: r.shuffle(keysFor(2).filter(x => x !== k)).slice(0, 3).map(x => `${x} major`), unit: KEYS[k].unit,
      explain: `The scale starts on ${pitchName(sc[0])} and has ${sigText(k)}, so it is ${correct}.` };
  },
  // 12. which degree is a given note
  (r, unit) => {
    const k = r.pick(keysFor(unit)); const sc = keyScale(k);
    const d = r.int(6) + 2; const n = pitchName(sc[d - 1]);
    const correct = `Degree ${d}`;
    return { text: `In ${k} major, which scale degree is ${n}?`, correct, wrong: r.shuffle([1, 2, 3, 4, 5, 6, 7].filter(x => x !== d)).slice(0, 3).map(x => `Degree ${x}`), unit: KEYS[k].unit,
      explain: `${k} major is ${scaleText(k)}. Counting from the tonic, ${n} is degree ${d}.` };
  },
];

/** Build the bank for a unit: at least 30 distinct questions, reproducible from the seed. */
export function bank(unit = 1, seed = 4) {
  const r = rng(seed * 1000 + unit);
  const out = []; const seen = new Set();
  let guard = 0;
  while (out.length < 40 && guard++ < 600) {
    const t = templates[r.int(templates.length)];
    const q = t(r, unit);
    if (!q || q.unit > unit || q.wrong.length < 3) continue;
    const key = q.text + '|' + q.correct + '|' + (q.notation ? JSON.stringify(q.notation) : '') + (q.audio ? JSON.stringify(q.audio) : '');
    if (seen.has(key)) continue;
    seen.add(key); out.push(q);
  }
  return out;
}

export const meta = { code: 'L4', quizLength: 10, passMark: 70 };
