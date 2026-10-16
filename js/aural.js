// aural.js — the aural trainer. Seven drills, three levels each, questions generated within the study design limits.
import * as T from './theory.js';
import * as store from './store.js';
import { playSequence, playNote, playChord, click } from './audio.js';
import { renderNotation } from './notation.js';
import { keyboard } from './keyboard.js';

const { toMidi, pitchName, keyScale, KEYS, interval, triad, PROGRESSIONS, progressionChords, scale, parsePitch, contour, METRES, GROUPINGS_U1, GROUPINGS_68, gridToEvents, pitch } = T;

const INTERVAL_NAMES = ['minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave'];

export const DRILLS = [
  { id: 'intervals', name: 'Intervals', desc: 'Two notes, name the gap', levels: ['From the tonic, rising', 'Any two scale notes, rising', 'Rising, falling or together'] },
  { id: 'scales', name: 'Scales', desc: 'Major, minor or pentatonic', levels: ['Major or minor', 'Add major pentatonic', 'All four scales'] },
  { id: 'triads', name: 'Triads', desc: 'Hear a chord, name it', levels: ['Major or minor', 'I, IV or V in a key', 'I, ii, IV, V or vi'] },
  { id: 'progressions', name: 'Progressions', desc: 'Four chords, pick the progression', levels: ['V–I or I–IV–V–I', 'Three progressions', 'All four, any key'] },
  { id: 'dictation', name: 'Melodic dictation', desc: 'Four beats, enter the notes', levels: ['Steps only', 'Steps and small leaps', 'Any leap'] },
  { id: 'rhythm', name: 'Rhythm dictation', desc: 'One bar, build it on the grid', levels: ['Crotchets, minims, quavers', 'All Unit 1 groupings except triplets', 'Add 6/8 (Unit 2)'] },
  { id: 'contour', name: 'Contour', desc: 'Hear a melody, pick the shape', levels: ['Rising, falling or repeated', 'Add arch shapes', 'All six shapes'] },
];

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function shuffle(a) { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

/** Weighted pick that favours items answered wrongly before. */
function weightedPick(drill, items, keyOf) {
  const stats = store.get().aural.stats[drill] || {};
  const w = items.map(it => { const s = stats[keyOf(it)]; return 1 + (s ? 2.5 * s.wrong / (s.n + 1) : 0.6); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

function keysFor(unit) { return unit >= 2 ? T.MAJOR_KEYS_U2 : T.MAJOR_KEYS_U1; }

// ---------- question generators: return { prompt, play(), options[], correct, item, explain } or { prompt, play(), custom } ----------
const GEN = {
  intervals(level, unit) {
    const k = pick(T.MAJOR_KEYS_U1);
    let list = T.diatonicIntervals(k).filter(iv => INTERVAL_NAMES.includes(iv.name));
    if (level === 1) { const sc = keyScale(k); list = list.filter(iv => iv.lo.step === sc[0].step && iv.lo.oct === sc[0].oct); }
    const iv = weightedPick('intervals', list, x => x.name);
    const mode = level >= 3 ? pick(['up', 'down', 'together']) : 'up';
    const lo = toMidi(iv.lo), hi = toMidi(iv.hi);
    const play = () => { if (mode === 'together') playChord([lo, hi], { dur: 1.6, voice: 'piano' }); else playSequence(mode === 'up' ? [{ midi: lo, beats: 1 }, { midi: hi, beats: 1 }] : [{ midi: hi, beats: 1 }, { midi: lo, beats: 1 }], { bpm: 96, voice: 'piano' }); };
    const names = level === 1 ? ['major 2nd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'major 6th', 'major 7th', 'octave'] : INTERVAL_NAMES;
    const options = shuffle([iv.name, ...shuffle(names.filter(n => n !== iv.name)).slice(0, 3)]);
    return { prompt: mode === 'together' ? 'Two notes played together. Name the interval.' : mode === 'down' ? 'Two notes, the second lower. Name the interval.' : 'Two notes. Name the interval.', play, options, correct: iv.name, item: iv.name, explain: `${pitchName(iv.lo)} to ${pitchName(iv.hi)}: ${iv.name}, ${iv.semitones} semitones.` };
  },
  scales(level, unit) {
    const types = level === 1 ? ['major', 'minor'] : level === 2 ? ['major', 'minor', 'majorPentatonic'] : ['major', 'minor', 'majorPentatonic', 'minorPentatonic'];
    const names = { major: 'Major', minor: 'Natural minor', majorPentatonic: 'Major pentatonic', minorPentatonic: 'Minor pentatonic' };
    const type = weightedPick('scales', types, x => x);
    const tonic = parsePitch(pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A3', 'B3']));
    const sc = scale(tonic, type);
    const down = level >= 3 && Math.random() < 0.3;
    const ms = sc.map(toMidi); if (down) ms.reverse();
    return { prompt: `A scale played ${down ? 'downward' : 'upward'}. Which type is it?`, play: () => playSequence(ms.map(m => ({ midi: m, beats: 0.55 })), { bpm: 100, voice: 'piano' }), options: shuffle(types.map(t => names[t]).concat(level === 1 ? ['Major pentatonic', 'Minor pentatonic'] : []).slice(0, 4)), correct: names[type], item: type, explain: type.includes('Pentatonic') ? `${names[type]}: five notes and no semitones.` : `${names[type]}: listen to the third note above the tonic.` };
  },
  triads(level, unit) {
    const k = pick(keysFor(unit));
    if (level === 1) {
      const d = weightedPick('triads', T.COURSE_DEGREES, x => triad(k, x).quality);
      const t = triad(k, d);
      const root = Math.random() < 0.5 ? t.notes : t.notes;
      return { prompt: 'A triad. Is it major or minor?', play: () => { playChord(t.notes.map(toMidi), { dur: 1.6, voice: 'piano' }); playSequence(t.notes.map(n => ({ midi: toMidi(n), beats: 0.5 })), { bpm: 100, voice: 'piano' }); setTimeout(() => {}, 0); }, options: ['Major', 'Minor'], correct: t.quality === 'major' ? 'Major' : 'Minor', item: t.quality, explain: `${t.name}: a ${t.quality} triad.` };
    }
    const degs = level === 2 ? [1, 4, 5] : T.COURSE_DEGREES;
    const d = weightedPick('triads', degs, x => T.ROMAN[x - 1]);
    const t = triad(k, d); const tonicChord = triad(k, 1);
    return { prompt: `In ${k} major. You hear the tonic chord first, then the chord to name.`, play: () => { playChord(tonicChord.notes.map(toMidi), { dur: 1.2, voice: 'piano', gain: 0.6 }); playChord(t.notes.map(toMidi), { at: 1.6, dur: 1.6, voice: 'piano' }); }, options: shuffle(degs.map(x => T.ROMAN[x - 1])).slice(0, 4), correct: t.roman, item: t.roman, explain: `${t.roman} in ${k} major is ${t.name}.` };
  },
  progressions(level, unit) {
    const ids = level === 1 ? ['V-I', 'I-IV-V-I'] : level === 2 ? ['V-I', 'ii-V-I', 'I-IV-V-I'] : PROGRESSIONS.map(p => p.id);
    const id = weightedPick('progressions', ids, x => x);
    const prog = PROGRESSIONS.find(p => p.id === id);
    const k = pick(level >= 3 ? keysFor(unit) : ['C']);
    const chords = progressionChords(k, prog);
    return { prompt: `A chord progression${level >= 3 ? ' in ' + k + ' major' : ''}. Which is it?`, play: () => playSequence(chords.map(t => ({ midis: [toMidi(t.root) - 12, ...t.notes.map(toMidi)], beats: 1.5 })), { bpm: 84, voice: 'piano' }), options: shuffle(PROGRESSIONS.map(p => p.label)), correct: prog.label, item: id, explain: `${prog.label}: ${chords.map(t => t.name).join(', ')}.` };
  },
  contour(level, unit) {
    const shapes = level === 1 ? ['rising', 'falling', 'repeated'] : level === 2 ? ['rising', 'falling', 'repeated', 'arch', 'inverted arch'] : ['rising', 'falling', 'repeated', 'arch', 'inverted arch', 'wave'];
    const shape = weightedPick('contour', shapes, x => x);
    const k = pick(T.MAJOR_KEYS_U1); const sc = keyScale(k); const two = sc.slice(0, 7).concat(sc.slice(0, 8).map(p => ({ ...p, oct: p.oct + 1 })));
    let idx; const ri = (n) => Math.floor(Math.random() * n);
    if (shape === 'rising') { const s = ri(4); idx = [s, s + 1 + ri(2), s + 3 + ri(2), s + 5 + ri(2), s + 7]; }
    else if (shape === 'falling') { const s = 7 + ri(4); idx = [s, s - 1 - ri(2), s - 3 - ri(2), s - 5 - ri(2), s - 7]; }
    else if (shape === 'arch') { const s = ri(3); idx = [s, s + 2, s + 4 + ri(2), s + 2 + ri(2), s]; }
    else if (shape === 'inverted arch') { const s = 6 + ri(3); idx = [s, s - 2, s - 4 - ri(2), s - 2, s]; }
    else if (shape === 'repeated') { const s = 2 + ri(5); idx = [s, s, s, s, s]; }
    else { const s = 2 + ri(3); idx = [s, s + 2, s + 1, s + 3, s + 2, s + 4]; }
    const ps = idx.map(i => two[Math.max(0, Math.min(14, i))]);
    const cap = (s) => s[0].toUpperCase() + s.slice(1);
    return { prompt: 'A short melody. What is its contour?', play: () => playSequence(ps.map(p => ({ midi: toMidi(p), beats: 0.7 })), { bpm: 100, voice: 'piano' }), options: shuffle([cap(shape), ...shuffle(shapes.filter(s => s !== shape)).slice(0, 3)]), correct: cap(shape), item: shape, explain: `${cap(contour(ps))}.` };
  },
  dictation(level, unit) {
    const k = pick(keysFor(unit)); const sc = keyScale(k); const ms = sc.map(toMidi);
    const maxLeap = level === 1 ? 1 : level === 2 ? 2 : 4;
    let i = 0; const target = [ms[0]];
    for (let n = 1; n < 4; n++) { let j; do { j = i + Math.floor(Math.random() * (2 * maxLeap + 1)) - maxLeap; } while (j < 0 || j > 7); i = j; target.push(ms[i]); }
    return { prompt: `Four crotchet beats in ${k} major, starting on the tonic. Enter the notes.`, play: () => playSequence(target.map(m => ({ midi: m, beats: 1 })), { bpm: 84, voice: 'piano' }), custom: 'dictation', key: k, target, item: `leap${maxLeap}`, explain: `The melody was ${target.map(m => pitchName(sc.find(p => toMidi(p) === m) || sc[7])).join(' ')}.` };
  },
  rhythm(level, unit) {
    let time = level >= 3 && unit >= 2 ? pick(['4/4', '3/4', '6/8']) : pick(['4/4', '3/4']);
    const beatCells = time === '6/8' ? 6 : 4;
    const m = METRES[time];
    let pool;
    if (time === '6/8') pool = [[1, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 0], [1, 1, 1, 1, 1, 1], [1, 1, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0]];
    else if (level === 1) pool = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 0, 0, 0, 0, 0, 0, 0]];
    else pool = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 1], [1, 0, 1, 1], [1, 1, 1, 0], [1, 0, 0, 1], [1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0]];
    const cells = [];
    while (cells.length < m.beats * beatCells) { const pat = pick(pool); if (cells.length + pat.length > m.beats * beatCells) continue; cells.push(...pat); }
    const triplet = false;   // triplets stay in the lessons and quizzes; the grid cannot show them, so the drill leaves them out
    const events = gridToEvents(cells, beatCells).map(e => e.rest ? e : { ...e, pitches: [pitch('B', 0, 4)] });
    if (triplet) { const b = Math.floor(Math.random() * m.beats); let pos = 0, idx = 0; for (; idx < events.length; idx++) { if (pos >= b * 48) break; pos += T.evBeats(events[idx]) * 48; } const span = []; let acc = 0; let j = idx; while (j < events.length && acc < 48) { acc += T.evBeats(events[j]) * 48; j++; } if (acc === 48) { events.splice(idx, j - idx, ...[0, 1, 2].map(() => ({ pitches: [pitch('B', 0, 4)], dur: 16, tuplet: 3 }))); for (let c = b * beatCells; c < (b + 1) * beatCells; c++) cells[c] = c === b * beatCells ? 1 : 0; } }
    const beatSec = 60 / 90 * (m.beatUnit / 48);
    const play = () => { for (let b = 0; b < m.beats; b++) click(b === 0, b * beatSec); let t = 0; events.forEach(e => { const d = T.evBeats(e) * 60 / 90; if (!e.rest) playNote(71, { at: t, dur: d * 0.85, voice: 'oboe' }); t += d; }); };
    return { prompt: `One bar of ${time}. Build the rhythm you hear on the grid.`, play, custom: 'rhythm', time, cells, events, triplet, item: time + (triplet ? '-trip' : ''), explain: 'The rhythm is shown above.' };
  },
};

// ---------- UI ----------
export function mountAural(el) {
  const st = store.get();
  const unit = st.settings.unit || 1;
  el.innerHTML = `<div class="top"><h1>Aural trainer</h1><div class="lives"><span class="q">♪</span><span>${st.lives}</span></div></div>
    <p class="muted" style="margin-top:0">Each set is 10 questions and earns 1 life. Items you get wrong come back more often.</p>
    <div class="drills" data-role="drills"></div>
    <div data-role="session"></div>`;
  const list = el.querySelector('[data-role=drills]');
  DRILLS.forEach(d => {
    const lvl = st.aural.levels[d.id] || 1;
    const stats = st.aural.stats[d.id] || {};
    const tot = Object.values(stats).reduce((a, s) => ({ n: a.n + s.n, ok: a.ok + s.ok }), { n: 0, ok: 0 });
    const acc = tot.n ? Math.round(100 * tot.ok / tot.n) : null;
    const row = document.createElement('div'); row.className = 'drill-row';
    row.innerHTML = `<div class="drill-main"><div class="n">${d.name}</div><div class="s">${d.desc}${acc !== null ? ` · ${acc}% right over ${tot.n} questions` : ''}</div></div>
      <div class="drill-ctl"><select aria-label="Level for ${d.name}" data-role="lvl">${d.levels.map((l, i) => `<option value="${i + 1}" ${i + 1 === lvl ? 'selected' : ''}>Level ${i + 1}: ${l}</option>`).join('')}</select><button type="button" class="btn sm" data-role="start">Start</button></div>`;
    row.querySelector('[data-role=lvl]').addEventListener('change', (e) => { store.get().aural.levels[d.id] = +e.target.value; store.save(); });
    row.querySelector('[data-role=start]').addEventListener('click', () => { runSet(el.querySelector('[data-role=session]'), d, +row.querySelector('[data-role=lvl]').value, unit, () => mountAural(el)); list.hidden = true; el.querySelector('p.muted').hidden = true; });
    list.appendChild(row);
  });
}

function runSet(box, drill, level, unit, onDone) {
  let i = 0, score = 0; const total = 10;
  function next() {
    if (i >= total) return finish();
    const q = GEN[drill.id](level, unit);
    box.innerHTML = `<div class="card aural-card" style="border-color:var(--lang)"><div class="quiz-top"><span class="eyebrow" style="color:var(--lang)">${drill.name} · Level ${level} · ${i + 1} of ${total}</span><span class="muted small">Score ${score}</span></div>
      <p class="q">${esc(q.prompt)}</p>
      <div class="big"><button type="button" class="playbig" data-role="play" aria-label="Play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div>
      <div data-role="answer"></div>
      <div class="fb" data-role="fb" aria-live="polite"></div>
      <div class="row" style="margin-top:10px;gap:8px"><button type="button" class="btn" data-role="next" hidden>${i + 1 < total ? 'Next' : 'Finish'}</button><button type="button" class="btn ghost sm" data-role="quit">Stop</button></div></div>`;
    box.querySelector('[data-role=play]').addEventListener('click', q.play);
    box.querySelector('[data-role=quit]').addEventListener('click', onDone);
    setTimeout(q.play, 300);
    const ans = box.querySelector('[data-role=answer]');
    const done = (ok, msg) => {
      if (ok) score++;
      store.recordAuralItem(drill.id, q.item, ok);
      box.querySelector('[data-role=fb]').innerHTML = `<b>${ok ? 'Correct.' : 'Not quite.'}</b> ${esc(msg || q.explain || '')}`;
      box.querySelector('.quiz-top .muted').textContent = `Score ${score}`;
      const nx = box.querySelector('[data-role=next]'); nx.hidden = false; nx.focus({ preventScroll: true });
      nx.addEventListener('click', () => { i++; next(); });
    };
    if (!q.custom) {
      ans.innerHTML = `<div class="opts">${q.options.map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      ans.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const o = q.options[+b.dataset.k];
        ans.querySelectorAll('button').forEach(x => { x.disabled = true; if (q.options[+x.dataset.k] === q.correct) x.classList.add('ok'); });
        if (o !== q.correct) b.classList.add('bad');
        done(o === q.correct);
      }));
    } else if (q.custom === 'dictation') {
      const sc = keyScale(q.key); const entered = [];
      ans.innerHTML = `<div class="ex-staff" data-role="staff"></div><div data-role="kb"></div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="check">Check</button><button type="button" class="btn sm ghost" data-role="undo">Undo</button><button type="button" class="btn sm ghost" data-role="tonic">Tonic</button></div>`;
      const kb = keyboard({ from: Math.min(...q.target) - 2, to: Math.max(...q.target) + 3, voice: 'piano', highlight: new Set([q.target[0]]), labels: new Map([[q.target[0], 'tonic']]), onTap: (m) => { if (entered.length < 4) { entered.push(m); draw(); } } });
      ans.querySelector('[data-role=kb]').appendChild(kb.el);
      const spell = (m) => sc.find(p => toMidi(p) === m) || sc.map(p => ({ ...p, oct: p.oct + 1 })).find(p => toMidi(p) === m) || T.pitchFromDiatonic(T.diatonicIndex(sc[0]));
      const draw = () => { const evs = entered.map(m => ({ pitches: [spell(m)], dur: 48 })); while (evs.length < 4) evs.push({ rest: true, dur: 48 }); ans.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: q.key, time: '4/4', bars: [evs], endBar: true, width: 300 }).svg; };
      draw();
      ans.querySelector('[data-role=undo]').addEventListener('click', () => { entered.pop(); draw(); });
      ans.querySelector('[data-role=tonic]').addEventListener('click', () => playNote(q.target[0], { dur: 1, voice: 'piano' }));
      ans.querySelector('[data-role=check]').addEventListener('click', () => {
        if (entered.length < 4) { box.querySelector('[data-role=fb]').textContent = 'Enter all four notes first.'; return; }
        const right = entered.filter((m, k) => m === q.target[k]).length;
        const evs = ans.querySelectorAll('.ev'); entered.forEach((m, k) => evs[k] && evs[k].classList.toggle('bad', m !== q.target[k]));
        ans.querySelectorAll('button').forEach(x => x.disabled = true);
        done(right === 4, `${right} of 4 notes right. ${q.explain}`);
      });
    } else if (q.custom === 'rhythm') {
      const beatCells = q.time === '6/8' ? 6 : 4; const n = q.cells.length;
      const mine = Array(n).fill(0); mine[0] = 1;
      ans.innerHTML = `<div class="grid-row" data-role="grid" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${mine.map((c, k) => `<button type="button" data-i="${k}" class="${k % beatCells === 0 ? 'beat' : ''} ${c ? 'on' : ''}">${k % beatCells === 0 ? k / beatCells + 1 : ''}</button>`).join('')}</div>
        <div class="ex-staff" data-role="staff" style="margin-top:8px"></div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-role="check">Check</button><button type="button" class="btn sm ghost" data-role="hearmine">Hear mine</button></div>`;
      const draw = () => { const evs = gridToEvents(mine, beatCells).map(e => e.rest ? e : { ...e, pitches: [pitch('B', 0, 4)] }); ans.querySelector('[data-role=staff]').innerHTML = renderNotation({ key: 'C', time: q.time, bars: [evs], endBar: true, width: 320 }).svg; };
      ans.querySelectorAll('[data-role=grid] button').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.i; mine[k] = mine[k] ? 0 : 1; b.classList.toggle('on', !!mine[k]); draw(); }));
      ans.querySelector('[data-role=hearmine]').addEventListener('click', () => { const evs = gridToEvents(mine, beatCells); const m = METRES[q.time]; const beatSec = 60 / 90 * (m.beatUnit / 48); for (let b = 0; b < m.beats; b++) click(b === 0, b * beatSec); let t = 0; evs.forEach(e => { const d = T.evBeats(e) * 60 / 90; if (!e.rest) playNote(71, { at: t, dur: d * 0.85, voice: 'oboe' }); t += d; }); });
      ans.querySelector('[data-role=check]').addEventListener('click', () => {
        const ok = q.triplet ? false : mine.join('') === q.cells.join('');
        ans.querySelector('[data-role=staff]').innerHTML = `<p class="muted small" style="margin:0 0 4px">The rhythm was:</p>` + renderNotation({ key: 'C', time: q.time, bars: [q.events], endBar: true, width: 320 }).svg;
        ans.querySelectorAll('[data-role=grid] button').forEach((b, k) => { b.classList.toggle('on', !!q.cells[k]); b.disabled = true; });
        ans.querySelectorAll('.btn').forEach(x => x.disabled = true);
        done(ok || (q.triplet && mine.join('') === q.cells.join('')), q.triplet ? 'This bar had a quaver triplet, which the grid cannot show exactly; compare your version with the notation.' : (ok ? 'The grid matches the rhythm.' : 'Compare your grid with the notation above.'));
      });
      draw();
    }
  }
  function finish() {
    const res = store.recordAuralSet(drill.id, score, total);
    box.innerHTML = `<div class="quiz result"><div class="eyebrow">${drill.name} · Level ${level}</div><div class="pct ${score >= 7 ? 'pass' : ''}">${score} / ${total}</div><p>You earned 1 life.${res.work && res.work.newDay ? ` Day ${res.work.count} of your streak${res.work.bonus ? `, with ${res.work.bonus} bonus ${res.work.bonus === 1 ? 'life' : 'lives'}` : ''}.` : ''}</p>
      ${score >= 9 && level < 3 ? `<p class="muted">You are ready for level ${level + 1}.</p>` : ''}
      <div class="acts"><button type="button" class="btn" data-role="again">Another set</button><a class="btn ghost" href="#play">Play the game</a><button type="button" class="btn ghost" data-role="back">All drills</button></div></div>`;
    box.querySelector('[data-role=again]').addEventListener('click', () => { i = 0; score = 0; next(); });
    box.querySelector('[data-role=back]').addEventListener('click', onDone);
  }
  next();
}

export const CSS = `
.drills{display:grid;gap:8px;margin-bottom:16px}
.drill-row{display:grid;gap:8px;border:1px solid var(--rule);border-radius:12px;padding:12px 14px}
.drill-row .n{font-weight:600}.drill-row .s{font-size:14px;color:var(--ink-2)}
.drill-ctl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.drill-ctl select{flex:1;min-width:0;max-width:100%}
.aural-card .q{font-weight:600;margin:0 0 6px}
`;
