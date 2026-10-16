// examples.js — the figures inside lessons: notation or keyboards built from theory data, each tappable to play.
import { renderNotation, scaleNotation } from './notation.js';
import { keyScale, toMidi, pitchName, DUR, pitch, SCALE_PATTERNS, transposeDiatonic, keySignature, evBeats } from './theory.js';
import { playSequence, playNote } from './audio.js';
import { keyboard } from './keyboard.js';

const registry = {};
export function registerExample(type, fn) { registry[type] = fn; }

/** Build an example. Returns an element. params come from the lesson file. ctx: { unit, voice } */
export function buildExample(type, params, ctx) {
  const fn = registry[type];
  const wrap = document.createElement('figure');
  wrap.className = 'ex';
  if (!fn) { wrap.innerHTML = `<p class="muted">Example "${type}" is not available yet.</p>`; return wrap; }
  fn(wrap, params, ctx);
  return wrap;
}

/** Shared helper: a notation figure with a caption, a play button and note highlighting while it plays. */
export function notationFigure(wrap, { svg, count, width }, sequence, { caption = '', voice = 'piano', bpm = 100, aria = 'Play' } = {}) {
  if (width > 560) svg = svg.replace('<svg class="staff"', `<svg class="staff" style="min-width:${Math.round(width * 0.75)}px"`);
  wrap.innerHTML = `<div class="ex-staff">${svg}</div><figcaption class="cap"><span>${caption}</span><button type="button" class="btn sm ghost play" aria-label="${aria}">Play</button></figcaption>`;
  let running = null;
  const evs = () => wrap.querySelectorAll('.ev');
  const play = () => {
    if (running) { running.stop(); running = null; evs().forEach(e => e.classList.remove('hot')); wrap.querySelector('.play').textContent = 'Play'; return; }
    wrap.querySelector('.play').textContent = 'Stop';
    running = playSequence(sequence, { bpm, voice, onNote: (i) => { evs().forEach(e => e.classList.remove('hot')); const n = sequence[i].evIndex ?? i; const el = wrap.querySelector(`.ev[data-i="${n}"]`); if (el) el.classList.add('hot'); },
      onEnd: () => { running = null; evs().forEach(e => e.classList.remove('hot')); wrap.querySelector('.play').textContent = 'Play'; } });
  };
  wrap.querySelector('.ex-staff').addEventListener('click', play);
  wrap.querySelector('.play').addEventListener('click', play);
  return play;
}

// ---------- scale ----------
registerExample('scale', (wrap, p, ctx) => {
  const key = p.key || 'C';
  const sc = keyScale(key);
  const voice = p.voice || 'piano';
  const r = renderNotation({ key: p.keysig ? key : 'C', events: sc.map((n, i) => ({ pitches: [n], dur: DUR.crotchet, degree: i + 1 })), labels: p.degrees ? 'degrees' : 'names', endBar: false, aria: `${key} major scale` });
  const seq = sc.map(n => ({ midi: toMidi(n), beats: 1 }));
  notationFigure(wrap, r, seq, { caption: p.caption || `${key} major`, voice, bpm: 96 });
});

// ---------- scale with notes highlighted on a keyboard as they sound (used by L6 and others) ----------
registerExample('scale-keyboard', (wrap, p, ctx) => {
  const key = p.key || 'C';
  const sc = keyScale(key);
  const ms = sc.map(toMidi);
  const kb = keyboard({ from: Math.min(...ms), to: Math.max(...ms), highlight: new Set(ms), labels: new Map(sc.map((n, i) => [toMidi(n), pitchName(n)])), voice: 'piano' });
  wrap.innerHTML = `<figcaption class="cap"><span>${p.caption || key + ' major on the keyboard'}</span><button type="button" class="btn sm ghost play">Play</button></figcaption>`;
  wrap.prepend(kb.el);
  wrap.querySelector('.play').addEventListener('click', () => { playSequence(ms.map(m => ({ midi: m, beats: 1 })), { bpm: 96, voice: 'piano', onNote: (i) => kb.flash(ms[i], 500) }); });
});

// ---------- tone and semitone pairs ----------
registerExample('tone-semitone', (wrap, p) => {
  const pairs = [
    { a: pitch('C', 0, 4), b: pitch('C', 1, 4), label: 'C to C♯', kind: 'semitone' },
    { a: pitch('C', 0, 4), b: pitch('D', 0, 4), label: 'C to D', kind: 'tone' },
    { a: pitch('E', 0, 4), b: pitch('F', 0, 4), label: 'E to F', kind: 'semitone' },
    { a: pitch('E', 0, 4), b: pitch('F', 1, 4), label: 'E to F♯', kind: 'tone' },
    { a: pitch('B', 0, 3), b: pitch('C', 0, 4), label: 'B to C', kind: 'semitone' },
    { a: pitch('A', 0, 3), b: pitch('B', 0, 3), label: 'A to B', kind: 'tone' },
  ];
  const kb = keyboard({ from: 57, to: 67, voice: 'piano' });
  const btns = document.createElement('div'); btns.className = 'seg';
  pairs.forEach(pr => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = pr.label;
    b.addEventListener('click', () => {
      btns.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
      kb.update({ highlight: new Set([toMidi(pr.a), toMidi(pr.b)]) });
      playSequence([{ midi: toMidi(pr.a), beats: 1 }, { midi: toMidi(pr.b), beats: 1 }], { bpm: 100, voice: 'piano', onNote: (i) => kb.flash(i ? toMidi(pr.b) : toMidi(pr.a), 500) });
      out.textContent = `${pr.label} is a ${pr.kind}.`;
    });
    btns.appendChild(b);
  });
  const out = document.createElement('p'); out.className = 'ex-out'; out.textContent = 'Tap a pair to hear it.';
  wrap.append(kb.el, btns, out);
});

// ---------- seven notes then the tonic ----------
registerExample('leading-note', (wrap, p) => {
  const key = p.key || 'C';
  const sc = keyScale(key);
  const events = sc.slice(0, 7).map((n, i) => ({ pitches: [n], dur: DUR.crotchet, degree: i + 1 }));
  events.push({ rest: true, dur: DUR.minim, degree: '' });
  events.push({ pitches: [sc[7]], dur: DUR.minim, degree: 8 });
  const r = renderNotation({ key, events, labels: 'degrees', endBar: false });
  const seq = sc.slice(0, 7).map(n => ({ midi: toMidi(n), beats: 1 }));
  seq.push({ rest: true, beats: 2 }); seq.push({ midi: toMidi(sc[7]), beats: 2 });
  notationFigure(wrap, r, seq, { caption: p.caption || 'The leading note waits for the tonic.', voice: 'piano', bpm: 96 });
});


// ---------- step-by-step scale builder: measure each gap, add a sharp or flat where the pattern needs it ----------
registerExample('scale-steps', (wrap, p) => {
  const key = p.key || 'G';
  const sc = keyScale(key);
  const pat = SCALE_PATTERNS.major;
  const ms = sc.map(toMidi);
  let step = 0;                               // number of gaps measured so far (0..7)
  const kb = keyboard({ from: Math.min(...ms) - 1, to: Math.max(...ms) + 1, voice: 'piano' });
  wrap.innerHTML = `<div class="steps-text" data-role="text"></div>`;
  wrap.prepend(kb.el);
  const staff = document.createElement('div'); staff.className = 'ex-staff'; wrap.appendChild(staff);
  const bar = document.createElement('div'); bar.className = 'row'; bar.style.cssText = 'margin-top:10px;gap:8px;flex-wrap:wrap';
  bar.innerHTML = `<button type="button" class="btn sm" data-role="next">Start</button><button type="button" class="btn sm ghost" data-role="reset" hidden>Start again</button><span class="muted small" data-role="count"></span>`;
  wrap.appendChild(bar);
  const text = wrap.querySelector('[data-role=text]');
  function draw() {
    const shown = sc.slice(0, step + 1);
    const hi = new Set(shown.map(toMidi));
    const labels = new Map(shown.map(n => [toMidi(n), pitchName(n)]));
    kb.update({ highlight: hi, labels });
    const r = renderNotation({ key: 'C', events: shown.map((n, i) => ({ pitches: [n], dur: DUR.crotchet })), labels: 'names', endBar: false, width: 420 });
    staff.innerHTML = r.svg;
    wrap.querySelector('[data-role=count]').textContent = step === 0 ? '' : `Gap ${step} of 7`;
  }
  function explain() {
    if (step === 0) {
      text.innerHTML = `<p>Start on the tonic, <b>${pitchName(sc[0])}</b>. Each tap measures the next gap of the pattern T T S T T T S and adds the note.</p>`;
      return;
    }
    const i = step - 1;
    const prev = sc[i], next = sc[i + 1], need = pat[i];
    const natural = transposeDiatonic(prev, 1, 0);           // the next letter with no accidental
    const natAcc = { ...natural, acc: 0 };
    const natGap = toMidi(natAcc) - toMidi(prev);
    const needWord = need === 2 ? 'a tone' : 'a semitone';
    let why;
    if (next.acc === 0 && natGap === need) why = `${pitchName(prev)} to ${pitchName(natAcc)} is already ${needWord}, so the note is ${pitchName(next)} with no sharp or flat.`;
    else if (natGap < need) why = `${pitchName(prev)} to ${pitchName(natAcc)} is only ${natGap === 1 ? 'a semitone' : natGap + ' semitones'}, so ${pitchName(natAcc)} is raised to <b>${pitchName(next)}</b>.`;
    else why = `${pitchName(prev)} to ${pitchName(natAcc)} is ${natGap === 2 ? 'a tone' : natGap + ' semitones'}, too wide, so ${pitchName(natAcc)} is lowered to <b>${pitchName(next)}</b>.`;
    text.innerHTML = `<p><span class="chip" style="background:var(--accent,var(--lang))">${need === 2 ? 'T' : 'S'}</span> Gap ${step}: from ${pitchName(prev)} the pattern needs ${needWord}. ${why}</p>` + (step === 7 ? `<p><b>${key} major</b>: ${sc.map(n => pitchName(n)).join(' ')}. ${keySignature(key).length ? 'Key signature: ' + keySignature(key).map(a => pitchName(a)).join(' and ') + '.' : 'No sharps or flats.'}</p>` : '');
  }
  wrap.querySelector('[data-role=next]').addEventListener('click', (e) => {
    if (step < 7) {
      step++;
      draw(); explain();
      playSequence([{ midi: ms[step - 1], beats: 0.5 }, { midi: ms[step], beats: 1 }], { bpm: 100, voice: 'piano', onNote: (k) => kb.flash(ms[step - 1 + k], 450) });
      e.target.textContent = step < 7 ? 'Next gap' : 'Play the scale';
      wrap.querySelector('[data-role=reset]').hidden = false;
    } else {
      playSequence(ms.map(m => ({ midi: m, beats: 0.6 })), { bpm: 100, voice: 'piano', onNote: (k) => kb.flash(ms[k], 350) });
    }
  });
  wrap.querySelector('[data-role=reset]').addEventListener('click', () => { step = 0; draw(); explain(); wrap.querySelector('[data-role=next]').textContent = 'Start'; wrap.querySelector('[data-role=reset]').hidden = true; });
  draw(); explain();
});

// ---------- generic notation from a JSON spec (used by question generators and later lessons) ----------
registerExample('notation', (wrap, p) => {
  const r = renderNotation(p.spec);
  const seq = (p.spec.bars ? p.spec.bars.flat() : p.spec.events).map(ev => ev.rest ? { rest: true, beats: evBeats(ev) } : { midis: ev.pitches.map(toMidi), beats: evBeats(ev), artic: ev.artic });
  notationFigure(wrap, r, seq, { caption: p.caption || '', voice: p.voice || 'piano', bpm: p.bpm || 100 });
});

export const CSS = `
.ex{margin:0 0 16px;background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:10px 12px 10px}
.ex .ex-staff{cursor:pointer;overflow-x:auto}
.ex .cap{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px;color:var(--ink-2);margin-top:6px}
.ex .ex-out{margin:8px 0 0;font-size:15px;color:var(--ink-2)}
.ex .seg{margin-top:10px}
.ex .steps-text{margin-top:10px;font-size:15.5px}
.ex .steps-text p{margin:0 0 8px}
.ex .steps-text .chip{margin-right:4px}
`;
