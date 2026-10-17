// notation.js — renders music notation as SVG using the bundled Bravura font (SMuFL).
// Input is the same pitch and duration data that audio.js plays, so what is seen matches what is heard.

import { diatonicIndex, keySignature, pitchName, DUR, METRES } from './theory.js';

const G = {                       // SMuFL code points in Bravura
  gClef: '', fClef: '',
  headWhole: '', headHalf: '', headBlack: '',
  flag8Up: '', flag8Down: '', flag16Up: '', flag16Down: '',
  flat: '', natural: '', sharp: '',
  restWhole: '', restHalf: '', restQuarter: '', rest8: '', rest16: '',
  dot: '', tuplet3: '',
  staccatoAbove: '', staccatoBelow: '', accentAbove: '', accentBelow: '',
  tenutoAbove: '', tenutoBelow: '', marcatoAbove: '', marcatoBelow: '',
  dyn: { p: '', f: '', pp: '', mp: '', mf: '', ff: '' },
  timeSig: (d) => String.fromCharCode(0xE080 + d),
};

const S = 10;                      // staff space in SVG units; Bravura is designed so 1 em = 4 spaces
const FONT = S * 4;
const HEAD_W = 1.18 * S;           // width of a black notehead
const STEM_LEN = 3.5 * S;
const STEM_W = 0.12 * S;
const MIDDLE_LINE_INDEX = diatonicIndex({ step: 'B', acc: 0, oct: 4 });   // treble clef middle line
const BOTTOM_LINE_INDEX = diatonicIndex({ step: 'E', acc: 0, oct: 4 });
const TOP_LINE_INDEX = diatonicIndex({ step: 'F', acc: 0, oct: 5 });

const KEYSIG_POS = {   // treble clef placement of key signature accidentals, by letter
  sharp: { F: 5, C: 5, G: 5, D: 5, A: 4, E: 5, B: 4 },
  flat: { B: 4, E: 5, A: 4, D: 5, G: 4, C: 5, F: 4 },
};

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/**
 * Render notation.
 * opts: { key:'C', time:'4/4'|null, events:[...], bars:[[...],...], width, labels:'names'|'degrees'|'custom'|null,
 *         noClef:false, tempoText, dynamics: {eventIndex: 'mf'} }
 * event: { pitches:[pitch]|undefined, rest:true|undefined, dur:48, dot:bool, tie:bool, tuplet:3, artic:'staccato'|'accent'|'tenuto'|'marcato', label:string, beam?:'start'|'cont'|'end' }
 * Returns { svg, width, height, count }
 */
export function renderNotation(opts) {
  const key = opts.key || 'C';
  const sig = keySignature(key);
  const sigMap = Object.fromEntries(sig.map(a => [a.step, a.acc]));
  const metre = opts.time ? METRES[opts.time] : null;
  const bars = opts.bars || [opts.events || []];
  const yTop = 4 * S;                                   // y of the top staff line
  const yLine = (lineIdx) => yTop + (4 - lineIdx) * S;  // lineIdx 0 = bottom line (E4)
  const yOfIndex = (di) => yLine(0) - (di - BOTTOM_LINE_INDEX) * (S / 2);

  let x = 1.2 * S;
  let out = [];
  let minY = yTop - 2 * S, maxY = yLine(0) + 2.5 * S;
  const bump = (y) => { if (y < minY) minY = y; if (y > maxY) maxY = y; };

  // clef
  if (!opts.noClef) {
    out.push(`<text class="gl" x="${x}" y="${yLine(1)}">${G.gClef}</text>`);
    x += 3.6 * S;
    bump(yLine(1) - 4.8 * S); bump(yLine(1) + 3 * S);
  }
  // key signature
  for (const a of sig) {
    const oct = (a.acc === 1 ? KEYSIG_POS.sharp : KEYSIG_POS.flat)[a.step];
    const y = yOfIndex(diatonicIndex({ step: a.step, acc: 0, oct }));
    out.push(`<text class="gl" x="${x}" y="${y}">${a.acc === 1 ? G.sharp : G.flat}</text>`);
    x += 1.1 * S;
  }
  if (sig.length) x += 0.6 * S;
  // time signature
  if (opts.time && !opts.noTime) {
    const [n, d] = opts.time.split('/');
    out.push(`<text class="gl" x="${x}" y="${yLine(3)}">${G.timeSig(+n)}</text><text class="gl" x="${x}" y="${yLine(1)}">${G.timeSig(+d)}</text>`);
    x += 2.4 * S;
  }
  x += 0.6 * S;
  const xStart = x;

  // ----- layout pass: assign x to every event -----
  const laid = [];           // { ev, x, barIdx, idx, beatPos }
  let idx = 0;
  const widthOf = (ev) => 2.0 * S + 0.95 * S * Math.sqrt(ev.dur / 12) + (ev.dot ? 0.6 * S : 0);
  bars.forEach((bar, bi) => {
    let pos = 0;
    let accState = {};         // accidentals already shown in this bar, by letter+octave
    bar.forEach(ev => {
      const needsAcc = [];
      if (ev.pitches) {
        ev.pitches.forEach(p => {
          const k = p.step + p.oct;
          const current = accState[k] !== undefined ? accState[k] : (sigMap[p.step] || 0);
          if (p.acc !== current) { needsAcc.push(p); accState[k] = p.acc; }
        });
      }
      laid.push({ ev, x, barIdx: bi, idx, beatPos: pos, accs: needsAcc, w: widthOf(ev) + (needsAcc.length ? 1.3 * S : 0) });
      x += laid[laid.length - 1].w;
      pos += ev.dur * (ev.dot ? 1.5 : 1);
      idx++;
    });
    if (bi < bars.length - 1) { laid.push({ barline: true, x: x + 0.2 * S }); x += 1.6 * S; }
  });
  if (opts.endBar !== false && opts.time) { laid.push({ barline: true, final: true, x: x + 0.6 * S }); x += 1.6 * S; }
  let natural = x + 1.5 * S;
  // stretch to requested width
  if (opts.width && opts.width > natural) {
    const f = (opts.width - xStart) / (natural - xStart);
    laid.forEach(l => { l.x = xStart + (l.x - xStart) * f; if (l.w) l.w *= f; });
    natural = opts.width;
  }
  const W = natural;

  // ----- beaming groups -----
  const beatUnit = metre ? metre.beatUnit : 48;
  const groups = [];
  let cur = null;
  laid.forEach(l => {
    if (l.barline) { cur = null; return; }
    const ev = l.ev;
    const beamable = ev.pitches && ev.dur < 48 && !(ev.dot && ev.dur >= 72);
    const beat = Math.floor(l.beatPos / beatUnit);
    if (beamable && cur && cur.beat === beat && cur.bar === l.barIdx) { cur.items.push(l); }
    else if (beamable) { cur = { beat, bar: l.barIdx, items: [l] }; groups.push(cur); }
    else cur = null;
  });
  const beamed = new Map();
  groups.filter(g => g.items.length > 1).forEach(g => g.items.forEach(l => beamed.set(l, g)));

  // ----- draw staff lines -----
  for (let i = 0; i < 5; i++) out.unshift(`<line class="ln" x1="${0.6 * S}" x2="${W - 0.6 * S}" y1="${yLine(i)}" y2="${yLine(i)}"/>`);

  // ----- draw events -----
  const heads = [];
  const stemInfo = new Map();
  laid.forEach(l => {
    if (l.barline) {
      out.push(`<line class="ln bar" x1="${l.x}" x2="${l.x}" y1="${yLine(4)}" y2="${yLine(0)}"/>`);
      if (l.final) out.push(`<rect class="barfill" x="${l.x + 0.5 * S}" y="${yLine(4)}" width="${0.5 * S}" height="${4 * S}"/>`);
      return;
    }
    const ev = l.ev, i = l.idx;
    let hx = l.x + (l.accs.length ? 1.3 * S : 0);
    if (ev.rest) {
      const rg = ev.dur >= 192 ? G.restWhole : ev.dur >= 96 ? G.restHalf : ev.dur >= 48 ? G.restQuarter : ev.dur >= 24 ? G.rest8 : G.rest16;
      const ry = ev.dur >= 192 ? yLine(3) : yLine(2);
      out.push(`<g class="ev" data-i="${i}"><text class="gl" x="${hx}" y="${ry}">${rg}</text>${ev.dot ? `<text class="gl" x="${hx + 1.6 * S}" y="${yLine(2) - S / 2}">${G.dot}</text>` : ''}</g>`);
      if (ev.label !== undefined || opts.labels) out.push(label(hx + 0.5 * S, ev.label ?? ''));
      return;
    }
    const ps = ev.pitches.slice().sort((a, b) => diatonicIndex(a) - diatonicIndex(b));
    const dis = ps.map(diatonicIndex);
    const ys = dis.map(yOfIndex);
    // ledger lines
    dis.forEach((di, k) => {
      for (let li = BOTTOM_LINE_INDEX - 2; li >= di; li -= 2) out.push(`<line class="ln" x1="${hx - 0.35 * S}" x2="${hx + HEAD_W + 0.35 * S}" y1="${yOfIndex(li)}" y2="${yOfIndex(li)}"/>`);
      for (let li = TOP_LINE_INDEX + 2; li <= di; li += 2) out.push(`<line class="ln" x1="${hx - 0.35 * S}" x2="${hx + HEAD_W + 0.35 * S}" y1="${yOfIndex(li)}" y2="${yOfIndex(li)}"/>`);
      bump(ys[k] - 1.5 * S); bump(ys[k] + 1.5 * S);
    });
    // accidentals
    l.accs.forEach(p => {
      const y = yOfIndex(diatonicIndex(p));
      out.push(`<text class="gl" x="${l.x}" y="${y}">${p.acc === 1 ? G.sharp : p.acc === -1 ? G.flat : G.natural}</text>`);
    });
    const headGlyph = ev.dur >= 192 ? G.headWhole : ev.dur >= 96 ? G.headHalf : G.headBlack;
    const avg = dis.reduce((a, b) => a + b, 0) / dis.length;
    const stemUp = avg < MIDDLE_LINE_INDEX;
    let g = `<g class="ev" data-i="${i}">`;
    // heads: offset seconds in chords
    let prevDi = null, flip = false;
    ps.forEach((p, k) => {
      if (prevDi !== null && dis[k] - prevDi === 1) flip = !flip; else flip = false;
      const ox = flip ? (stemUp ? HEAD_W - STEM_W : -(HEAD_W - STEM_W)) : 0;
      g += `<text class="gl nh" x="${hx + ox}" y="${ys[k]}">${headGlyph}</text>`;
      if (ev.dot) {
        const onLine = (dis[k] - BOTTOM_LINE_INDEX) % 2 === 0;
        g += `<text class="gl" x="${hx + ox + HEAD_W + 0.35 * S}" y="${ys[k] - (onLine ? S / 2 : 0)}">${G.dot}</text>`;
      }
      heads.push({ i, x: hx, y: ys[k] });
      prevDi = dis[k];
    });
    // stem
    if (ev.dur < 192) {
      const stemX = stemUp ? hx + HEAD_W - STEM_W / 2 : hx + STEM_W / 2;
      const yFrom = stemUp ? ys[ys.length - 1] : ys[0];
      let yTo = stemUp ? ys[0] - STEM_LEN : ys[ys.length - 1] + STEM_LEN;
      // keep stems reaching the middle line for far ledger notes
      if (stemUp && yTo > yLine(2)) yTo = yLine(2);
      if (!stemUp && yTo < yLine(2)) yTo = yLine(2);
      const grp = beamed.get(l);
      stemInfo.set(l, { stemX, yFrom, yTo, stemUp });
      if (!grp) {
        g += `<line class="stem" x1="${stemX}" x2="${stemX}" y1="${yFrom}" y2="${yTo}"/>`;
        if (ev.dur < 48) {
          const fg = ev.dur < 24 ? (stemUp ? G.flag16Up : G.flag16Down) : (stemUp ? G.flag8Up : G.flag8Down);
          g += `<text class="gl" x="${stemX - (stemUp ? STEM_W / 2 : STEM_W / 2)}" y="${yTo}">${fg}</text>`;
        }
        bump(yTo - S); bump(yTo + S);
      }
    }
    // articulation
    if (ev.artic) {
      const above = !stemUp;
      const map = { staccato: [G.staccatoAbove, G.staccatoBelow], accent: [G.accentAbove, G.accentBelow], tenuto: [G.tenutoAbove, G.tenutoBelow], marcato: [G.marcatoAbove, G.marcatoBelow] };
      const gl = map[ev.artic][above ? 0 : 1];
      const yA = above ? Math.min(ys[0] - 1.2 * S, yLine(4) - 1.2 * S) : Math.max(ys[ys.length - 1] + 1.2 * S, yLine(0) + 1.2 * S);
      g += `<text class="gl" x="${hx + HEAD_W / 2 - 0.4 * S}" y="${yA}">${gl}</text>`;
      bump(yA - S); bump(yA + S);
    }
    g += '</g>';
    out.push(g);
    if (ev.dyn) { out.push(`<text class="gl" x="${hx}" y="${yLine(0) + 3.2 * S}">${G.dyn[ev.dyn] || ''}</text>`); bump(yLine(0) + 4 * S); }
    if (ev.text) { out.push(`<text class="txt" x="${hx}" y="${yLine(4) - 1.6 * S}">${esc(ev.text)}</text>`); bump(yLine(4) - 3 * S); }
    const lab = ev.label !== undefined ? ev.label : opts.labels === 'names' ? pitchName(ps[0]) : opts.labels === 'degrees' && ev.degree !== undefined ? ev.degree : null;
    if (lab !== null && lab !== undefined) out.push(label(hx + HEAD_W / 2, lab));
  });

  // ----- beams -----
  groups.filter(g => g.items.length > 1).forEach(grp => {
    const infos = grp.items.map(l => stemInfo.get(l));
    const up = infos.filter(s => s.stemUp).length >= infos.length / 2;
    // beam line at the extreme stem end
    const ends = grp.items.map(l => { const s = stemInfo.get(l); const ys = l.ev.pitches.map(p => yOfIndex(diatonicIndex(p))); return up ? Math.min(...ys) - STEM_LEN : Math.max(...ys) + STEM_LEN; });
    const beamY = up ? Math.min(...ends) : Math.max(...ends);
    const xs = grp.items.map((l, k) => {
      const ev = l.ev; const hx = l.x + (l.accs.length ? 1.3 * S : 0);
      return up ? hx + HEAD_W - STEM_W / 2 : hx + STEM_W / 2;
    });
    grp.items.forEach((l, k) => {
      const ys = l.ev.pitches.map(p => yOfIndex(diatonicIndex(p)));
      const yFrom = up ? Math.max(...ys) : Math.min(...ys);
      out.push(`<line class="stem" x1="${xs[k]}" x2="${xs[k]}" y1="${yFrom}" y2="${beamY}"/>`);
    });
    const t = 0.5 * S, dir = up ? 1 : -1;
    const x0 = xs[0] - STEM_W / 2, x1 = xs[xs.length - 1] + STEM_W / 2;
    out.push(`<rect class="beam" x="${x0}" y="${up ? beamY : beamY - t}" width="${x1 - x0}" height="${t}"/>`);
    // secondary beams for semiquavers
    const y2 = up ? beamY + 0.75 * S + t * 0 : beamY - 0.75 * S - t;
    grp.items.forEach((l, k) => {
      if (l.ev.dur > 12 && !(l.ev.dur === 12)) return;
      const next = grp.items[k + 1], prev = grp.items[k - 1];
      const nextSemi = next && next.ev.dur <= 12, prevSemi = prev && prev.ev.dur <= 12;
      if (nextSemi) out.push(`<rect class="beam" x="${xs[k] - STEM_W / 2}" y="${up ? beamY + 0.75 * S : beamY - 0.75 * S - t}" width="${xs[k + 1] - xs[k] + STEM_W}" height="${t}"/>`);
      else if (!prevSemi) { // beamlet
        const toRight = k === 0;
        const bx = toRight ? xs[k] - STEM_W / 2 : xs[k] - 1.1 * S;
        out.push(`<rect class="beam" x="${bx}" y="${up ? beamY + 0.75 * S : beamY - 0.75 * S - t}" width="${1.1 * S + STEM_W / 2}" height="${t}"/>`);
      }
    });
    bump(beamY - 1.5 * S); bump(beamY + 1.5 * S);
    // triplet number
    if (grp.items[0].ev.tuplet) {
      const mx = (xs[0] + xs[xs.length - 1]) / 2;
      const ty = up ? beamY - 0.9 * S : beamY + 2.2 * S;
      out.push(`<text class="gl" x="${mx - 0.4 * S}" y="${ty}">${G.tuplet3}</text>`);
      bump(ty - 1.5 * S); bump(ty + 0.5 * S);
    }
  });
  // triplets that were not beamed (crotchet triplets are not in the course, so nothing else needed)

  // ----- ties -----
  laid.forEach((l, k) => {
    if (l.barline || !l.ev.tie) return;
    let n = laid[k + 1]; if (n && n.barline) n = laid[k + 2];
    if (!n || !n.ev || !n.ev.pitches) return;
    const hx1 = l.x + (l.accs.length ? 1.3 * S : 0) + HEAD_W, hx2 = n.x + (n.accs.length ? 1.3 * S : 0);
    const y = yOfIndex(diatonicIndex(l.ev.pitches[0]));
    const below = diatonicIndex(l.ev.pitches[0]) < MIDDLE_LINE_INDEX;
    const c = below ? 1.3 * S : -1.3 * S;
    out.push(`<path class="tie" d="M${hx1 + 0.2 * S} ${y + c * 0.5} Q ${(hx1 + hx2) / 2} ${y + c * 1.4} ${hx2 - 0.2 * S} ${y + c * 0.5}"/>`);
  });

  // contour line through the noteheads
  if (opts.contour) {
    const pts = heads.filter((h, k, arr) => arr.findIndex(z => z.i === h.i) === k).map(h => `${h.x + HEAD_W / 2},${h.y}`);
    if (pts.length > 1) out.push(`<polyline class="contour" points="${pts.join(' ')}"/>`);
  }
  // slurs: ev.slur = 'start' ... ev.slur = 'end'
  let slurStart = null;
  laid.forEach((l) => {
    if (l.barline) return;
    const ev = l.ev; if (!ev.pitches) return;
    const hx = l.x + (l.accs.length ? 1.3 * S : 0);
    const y = yOfIndex(diatonicIndex(ev.pitches[ev.pitches.length - 1]));
    const up = diatonicIndex(ev.pitches[0]) >= MIDDLE_LINE_INDEX;   // stem down => slur above
    if (ev.slur === 'start') slurStart = { x: hx, y, up };
    if (ev.slur === 'end' && slurStart) {
      const c = slurStart.up ? -1 : 1; const y1 = slurStart.y, y2 = y;
      const yy1 = slurStart.up ? y1 - 1.2 * S : y1 + 1.2 * S, yy2 = slurStart.up ? y2 - 1.2 * S : y2 + 1.2 * S;
      const mid = Math.min(yy1, yy2) + (slurStart.up ? -2.2 * S : 2.2 * S + Math.abs(yy1 - yy2));
      out.push(`<path class="tie" d="M${slurStart.x + 0.3 * S} ${yy1} Q ${(slurStart.x + hx + HEAD_W) / 2} ${mid} ${hx + HEAD_W - 0.3 * S} ${yy2}"/>`);
      bump(mid - S); bump(mid + S);
      slurStart = null;
    }
  });
  // hairpins: ev.hairpin = 'cresc'|'dim' on the first note, ev.hairpinEnd on the last
  let hp = null;
  laid.forEach((l) => {
    if (l.barline) return;
    const ev = l.ev; const hx = l.x + (l.accs.length ? 1.3 * S : 0);
    if (ev.hairpin) hp = { x: hx, kind: ev.hairpin };
    if (ev.hairpinEnd && hp) {
      const y = yLine(0) + 3.4 * S, x2 = hx + HEAD_W;
      if (hp.kind === 'cresc') out.push(`<path class="hairpin" d="M${x2} ${y - 0.5 * S} L${hp.x} ${y} L${x2} ${y + 0.5 * S}"/>`);
      else out.push(`<path class="hairpin" d="M${hp.x} ${y - 0.5 * S} L${x2} ${y} L${hp.x} ${y + 0.5 * S}"/>`);
      bump(y + 1.2 * S); hp = null;
    }
  });
  if (opts.labels || laid.some(l => l.ev && l.ev.label !== undefined)) bump(yLine(0) + 4.2 * S);
  if (opts.tempoText) { out.push(`<text class="txt" x="${xStart}" y="${yTop - 2.2 * S}">${esc(opts.tempoText)}</text>`); bump(yTop - 3.6 * S); }

  const H = maxY - minY;
  const svg = `<svg class="staff" viewBox="0 ${minY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.aria || 'Music notation')}">${out.join('')}</svg>`;
  return { svg, width: W, height: H, count: idx };

  function label(xc, text) { return `<text class="lbl" x="${xc}" y="${yLine(0) + 3.4 * S}" text-anchor="middle">${esc(text)}</text>`; }
}

/** Convenience: a scale written in crotchets, with note names. */
export function scaleNotation(pitches, key, extra = {}) {
  return renderNotation({ key, events: pitches.map(p => ({ pitches: [p], dur: DUR.crotchet })), labels: 'names', endBar: false, ...extra });
}

/** Rhythm-only staff (single line) for rhythm examples. All notes drawn on one pitch. */
export function rhythmNotation(bars, time, extra = {}) {
  const p = { step: 'B', acc: 0, oct: 4 };
  const mapped = bars.map(bar => bar.map(ev => ev.rest ? ev : { ...ev, pitches: [p] }));
  return renderNotation({ key: 'C', time, bars: mapped, ...extra });
}

export const CSS = `
.staff{width:100%;height:auto;display:block;font-family:"Bravura";font-size:${FONT}px}
.staff .gl{font-family:"Bravura";font-size:${FONT}px;fill:var(--ink)}
.staff .ln{stroke:var(--ink);stroke-width:1.1;opacity:.8}
.staff .ln.bar{stroke-width:1.4;opacity:1}
.staff .barfill{fill:var(--ink)}
.staff .stem{stroke:var(--ink);stroke-width:${STEM_W}}
.staff .beam{fill:var(--ink)}
.staff .tie{fill:none;stroke:var(--ink);stroke-width:1.4}
.staff .contour{fill:none;stroke:var(--lang);stroke-width:2;stroke-dasharray:4 3;opacity:.8}
.staff .hairpin{fill:none;stroke:var(--ink);stroke-width:1.2}
.staff .lbl{font-family:var(--body);font-size:12px;fill:var(--ink-2)}
.staff .txt{font-family:var(--body);font-size:13px;font-style:italic;fill:var(--ink)}
.staff .ev.hot .nh,.staff .ev.hot .stem{fill:var(--lang);stroke:var(--lang)}
.staff .ev.hot .gl{fill:var(--lang)}
.staff .ev.bad .gl,.staff .ev.bad .nh{fill:var(--bad)}
.staff .ev.bad .stem{stroke:var(--bad)}
`;
