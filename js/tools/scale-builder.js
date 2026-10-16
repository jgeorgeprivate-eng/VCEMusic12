// scale-builder — pick a key, see its scale on a keyboard and on the staff, hear it.
import { KEYS, keyScale, toMidi, pitchName, keySignature, SCALE_PATTERNS, MAJOR_KEYS_U1, MAJOR_KEYS_U2 } from '../theory.js';
import { renderNotation } from '../notation.js';
import { keyboard } from '../keyboard.js';
import { playSequence } from '../audio.js';

export function mount(el, ctx = {}) {
  const keys = ctx.unit >= 2 ? MAJOR_KEYS_U2 : MAJOR_KEYS_U1;
  const all = MAJOR_KEYS_U2;
  let cur = 'C';
  let voice = ctx.voice || 'piano';
  el.innerHTML = `
    <div class="seg" data-role="keys"></div>
    <div data-role="kb"></div>
    <div class="pattern" data-role="pat"></div>
    <div class="ex-staff" data-role="staff"></div>
    <div class="row" style="margin-top:10px;align-items:center;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn sm" data-role="play">Play scale</button>
      <label class="muted" style="font-size:14px">Sound <select data-role="voice"><option value="piano">Piano</option><option value="oboe">Oboe</option><option value="flute">Flute</option><option value="strings">Strings</option></select></label>
      <span class="muted" data-role="info" style="font-size:14px"></span>
    </div>`;
  const kEl = el.querySelector('[data-role=keys]');
  all.forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = k;
    if (!keys.includes(k)) { b.classList.add('u2'); b.title = 'Unit 2'; }
    b.addEventListener('click', () => { cur = k; kEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
    kEl.appendChild(b);
  });
  kEl.querySelector('button').classList.add('on');
  const kb = keyboard({ from: 60, to: 72, voice });
  el.querySelector('[data-role=kb]').appendChild(kb.el);
  el.querySelector('[data-role=voice]').addEventListener('change', (e) => { voice = e.target.value; kb.update({ voice }); });

  function draw() {
    const sc = keyScale(cur); const ms = sc.map(toMidi);
    kb.update({ from: Math.min(...ms), to: Math.max(...ms), highlight: new Set(ms), labels: new Map(sc.slice(0, 7).map((p, i) => [toMidi(p), pitchName(p)])) });
    el.querySelector('[data-role=pat]').innerHTML = SCALE_PATTERNS.major.map(s => `<span class="${s === 1 ? 's' : ''}">${s === 2 ? 'T' : 'S'}</span>`).join('');
    const r = renderNotation({ key: cur, events: sc.map((p, i) => ({ pitches: [p], dur: 48, degree: i + 1 })), labels: 'names', endBar: false, aria: `${cur} major scale` });
    el.querySelector('[data-role=staff]').innerHTML = r.svg;
    const sig = keySignature(cur);
    el.querySelector('[data-role=info]').textContent = `${cur} major: ${sig.length ? sig.map(a => pitchName(a)).join(' and ') + ' in the key signature' : 'no sharps or flats'}${KEYS[cur].unit === 2 ? ' (Unit 2 key)' : ''}.`;
  }
  let running = null;
  const play = () => {
    if (running) { running.stop(); running = null; return; }
    const sc = keyScale(cur); const ms = sc.map(toMidi);
    running = playSequence(ms.map(m => ({ midi: m, beats: 1 })), { bpm: 96, voice, onNote: (i) => { kb.flash(ms[i], 560); el.querySelectorAll('.ev').forEach(e => e.classList.remove('hot')); const e = el.querySelector(`.ev[data-i="${i}"]`); if (e) e.classList.add('hot'); }, onEnd: () => { running = null; el.querySelectorAll('.ev').forEach(e => e.classList.remove('hot')); } });
  };
  el.querySelector('[data-role=play]').addEventListener('click', play);
  el.querySelector('[data-role=staff]').addEventListener('click', play);
  draw();
}
