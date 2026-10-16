// melody.js — a compact text form for melodies and rhythms used in lesson files and question generators.
// Tokens are separated by spaces. "|" separates bars.
//   pitch + value:  C4q  F#4e  Bb3h  (values: w semibreve, h minim, q crotchet, e quaver, s semiquaver; add "." for a dot)
//   rest:           rq  re  rh
//   triplet:        t(C4 D4 E4)  three quaver triplets
//   modifiers after the value:  ~ tie to next   ' staccato   > accent   - tenuto   ^ marcato
//   slur:           ( before the first note, ) after the last note of the slur
//   chord symbol:   [F] before a note     dynamic: {mf} before a note     hairpin: < or > before the first note, ! after the last
import { parsePitch, toMidi, evBeats } from './theory.js';

const VALUES = { w: 192, h: 96, q: 48, e: 24, s: 12 };

export function parseMelody(str) {
  const bars = [[]];
  let pendingText = null, pendingDyn = null, pendingHairpin = null, slurOpen = false;
  const toks = str.trim().split(/\s+/);
  for (let tok of toks) {
    if (!tok) continue;
    if (tok === '|') { bars.push([]); continue; }
    const bar = bars[bars.length - 1];
    if (tok.startsWith('[')) { pendingText = tok.slice(1, tok.indexOf(']')); tok = tok.slice(tok.indexOf(']') + 1); if (!tok) continue; }
    if (tok.startsWith('{')) { pendingDyn = tok.slice(1, tok.indexOf('}')); tok = tok.slice(tok.indexOf('}') + 1); if (!tok) continue; }
    if (tok === '<' || tok === '>') { pendingHairpin = tok === '<' ? 'cresc' : 'dim'; continue; }
    if (tok === '!') { const last = lastEvent(bars); if (last) last.hairpinEnd = true; continue; }
    if (tok === '(') { slurOpen = true; continue; }
    if (tok === ')') { const last = lastEvent(bars); if (last) last.slur = last.slur === 'start' ? undefined : 'end'; continue; }
    if (tok.startsWith('t(')) {   // triplet group
      const inner = tok.slice(2, tok.indexOf(')')).split(',');
      inner.forEach((p, i) => bar.push({ pitches: [parsePitch(p)], dur: 16, tuplet: 3 }));
      continue;
    }
    const m = tok.match(/^(r|[A-Ga-g][#b]?\d)(w|h|q|e|s)(\.?)([~'>^\-]*)$/);
    if (!m) throw new Error('Bad melody token: ' + tok);
    const ev = { dur: VALUES[m[2]], dot: m[3] === '.' };
    if (m[1] === 'r') ev.rest = true; else ev.pitches = [parsePitch(m[1])];
    if (m[4].includes('~')) ev.tie = true;
    if (m[4].includes("'")) ev.artic = 'staccato';
    if (m[4].includes('>')) ev.artic = 'accent';
    if (m[4].includes('-')) ev.artic = 'tenuto';
    if (m[4].includes('^')) ev.artic = 'marcato';
    if (pendingText) { ev.text = pendingText; pendingText = null; }
    if (pendingDyn) { ev.dyn = pendingDyn; pendingDyn = null; }
    if (pendingHairpin) { ev.hairpin = pendingHairpin; pendingHairpin = null; }
    if (slurOpen) { ev.slur = 'start'; slurOpen = false; }
    bar.push(ev);
  }
  return bars.filter((b, i) => b.length || i === 0);
}
function lastEvent(bars) { for (let i = bars.length - 1; i >= 0; i--) if (bars[i].length) return bars[i][bars[i].length - 1]; return null; }

/** Turn notation events into an audio sequence, joining tied notes. opts: { artic, legato } */
export function eventsToSequence(bars, opts = {}) {
  const evs = (Array.isArray(bars[0]) ? bars.flat() : bars);
  const seq = [];
  let i = 0;
  const level = { pp: 0.25, p: 0.4, mp: 0.55, mf: 0.75, f: 0.95, ff: 1.2 };
  let gain = opts.gain ?? 0.75;
  evs.forEach((ev, idx) => {
    if (ev.dyn && level[ev.dyn]) gain = level[ev.dyn];
    if (ev.tieCont) return;
    let beats = evBeats(ev);
    // join ties
    let j = idx;
    while (evs[j].tie && evs[j + 1] && evs[j + 1].pitches) { j++; beats += evBeats(evs[j]); evs[j].tieCont = true; }
    if (ev.rest) seq.push({ rest: true, beats, evIndex: idx });
    else seq.push({ midis: ev.pitches.map(toMidi), beats, artic: opts.artic || ev.artic || (ev.slur ? 'legato' : undefined), gain, evIndex: idx });
  });
  evs.forEach(ev => delete ev.tieCont);
  return seq;
}

/** Tunes used in lessons. Pentatonic tunes are written in their traditional keys. */
export const TUNES = {
  amazingGrace: { title: 'Amazing Grace', key: 'F', time: '3/4', bpm: 84, notes: 'C4q | F4h A4e F4e | A4h G4q | F4h D4q | C4h C4q | F4h A4e F4e | A4h G4q | C5h. | C5h A4e C5e | A4h F4q | F4h D4q | C4h C4q | F4h A4e F4e | A4h G4q | F4h. ' },
  auldLangSyne: { title: 'Auld Lang Syne', key: 'F', time: '4/4', bpm: 92, notes: 'C4q | F4q. F4e F4q A4q | G4q. F4e G4q A4q | F4q. F4e A4q C5q | D5h. D5q | C5q. A4e A4q F4q | G4q. F4e G4q A4q | F4q. D4e D4q C4q | F4h. ' },
  swingLow: { title: 'Swing Low, Sweet Chariot', key: 'F', time: '4/4', bpm: 80, notes: 'A4q F4h F4q | F4h D4h | F4h F4h | A4h. A4e G4e | A4q F4h F4q | F4h D4h | F4w ' },
  twinkle: { title: 'Twinkle, Twinkle, Little Star', key: 'C', time: '4/4', bpm: 100, notes: 'C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h' },
  odeToJoy: { title: 'Ode to Joy (Beethoven)', key: 'G', time: '4/4', bpm: 112, notes: 'B4q B4q C5q D5q | D5q C5q B4q A4q | G4q G4q A4q B4q | B4q. A4e A4h' },
  frereJacques: { title: 'Frère Jacques', key: 'C', time: '4/4', bpm: 104, notes: 'C4q D4q E4q C4q | C4q D4q E4q C4q | E4q F4q G4h | E4q F4q G4h' },
};
