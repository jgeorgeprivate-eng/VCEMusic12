// practice.js — the practice room: tuner, drone, metronome, play-back exercises, journal, recordings and piece planner.
// The microphone is used only after a tap, and recordings stay on the phone (IndexedDB).
import * as store from './store.js';
import { context, drone as startDrone, click, playSequence, unlock } from './audio.js';
import { midiToFreq, keyScale, toMidi, pitchName, MAJOR_KEYS_U2, MINOR_KEYS, keyLabel, scale, parsePitch } from './theory.js';
import { renderNotation } from './notation.js';

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function uid() { return Math.random().toString(36).slice(2, 10); }
const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

// ---------- microphone and pitch detection ----------
let micStream = null, analyser = null, micSource = null;
async function mic() {
  if (micStream) return true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const c = context(); micSource = c.createMediaStreamSource(micStream); analyser = c.createAnalyser(); analyser.fftSize = 4096; micSource.connect(analyser);
    return true;
  } catch (e) { console.warn('microphone refused', e); return false; }
}
function stopMic() { if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; analyser = null; } }
const buf = new Float32Array(4096);
/** Autocorrelation pitch detector. Returns frequency in Hz or -1. */
function detectPitch() {
  if (!analyser) return -1;
  analyser.getFloatTimeDomainData(buf);
  const sr = context().sampleRate; const N = buf.length;
  let rms = 0; for (let i = 0; i < N; i++) rms += buf[i] * buf[i]; rms = Math.sqrt(rms / N);
  if (rms < 0.01) return -1;
  // trim silence at the edges
  let r1 = 0, r2 = N - 1; const th = 0.2;
  for (let i = 0; i < N / 2; i++) if (Math.abs(buf[i]) < th) { r1 = i; break; }
  for (let i = 1; i < N / 2; i++) if (Math.abs(buf[N - i]) < th) { r2 = N - i; break; }
  const b = buf.slice(r1, r2); const M = b.length;
  const c = new Float32Array(M);
  for (let i = 0; i < M; i++) { let s = 0; for (let j = 0; j < M - i; j++) s += b[j] * b[j + i]; c[i] = s; }
  let d = 0; while (d < M - 1 && c[d] > c[d + 1]) d++;
  let maxv = -1, maxp = -1;
  for (let i = d; i < M; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
  if (maxp <= 0) return -1;
  let T = maxp;
  const x1 = c[T - 1] || 0, x2 = c[T], x3 = c[T + 1] || 0; const a = (x1 + x3 - 2 * x2) / 2, bq = (x3 - x1) / 2; if (a) T = T - bq / (2 * a);
  const f = sr / T;
  return f > 50 && f < 2500 ? f : -1;
}
function freqToNote(f, a4) { const midi = 69 + 12 * Math.log2(f / a4); const n = Math.round(midi); return { midi: n, cents: Math.round((midi - n) * 100), name: NOTE_NAMES[((n % 12) + 12) % 12], oct: Math.floor(n / 12) - 1 }; }

// ---------- IndexedDB for recordings ----------
function db() { return new Promise((res, rej) => { const r = indexedDB.open('upbeat-recordings', 1); r.onupgradeneeded = () => r.result.createObjectStore('rec'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function putRec(id, blob) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('rec', 'readwrite'); t.objectStore('rec').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function getRec(id) { const d = await db(); return new Promise((res, rej) => { const r = d.transaction('rec').objectStore('rec').get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function delRec(id) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('rec', 'readwrite'); t.objectStore('rec').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }

// ---------- screen ----------
export function mountPractice(el, arg) {
  const st = store.get();
  const tab = arg || 'tools';
  el.innerHTML = `<div class="top"><h1>Practice room</h1><div class="lives"><span class="q">♪</span><span>${st.lives}</span></div></div>
    <div class="seg" data-role="tabs"><button type="button" data-t="tools" class="${tab === 'tools' ? 'on' : ''}">Tuner and metronome</button><button type="button" data-t="journal" class="${tab === 'journal' ? 'on' : ''}">Journal</button><button type="button" data-t="recordings" class="${tab === 'recordings' ? 'on' : ''}">Recordings</button><button type="button" data-t="pieces" class="${tab === 'pieces' ? 'on' : ''}">Piece planner</button></div>
    <div data-role="body"></div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { location.hash = '#practice/' + b.dataset.t; }));
  const body = el.querySelector('[data-role=body]');
  const cleanup = { fns: [] };
  if (tab === 'tools') tools(body, cleanup);
  else if (tab === 'journal') journal(body);
  else if (tab === 'recordings') recordings(body, cleanup);
  else pieces(body, arg);
  return { destroy() { cleanup.fns.forEach(f => f()); } };
}

// ---------- tuner, drone, metronome, play-back ----------
function tools(el, cleanup) {
  const st = store.get();
  el.innerHTML = `
    <section class="card"><div class="eyebrow">Tuner</div>
      <div class="tuner"><div class="tuner-note" data-role="note">–</div><div class="tuner-scale"><div class="tuner-needle" data-role="needle"></div></div><div class="muted small" data-role="cents">Tap Start, then play a note.</div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px"><button type="button" class="btn sm" data-role="tstart">Start</button><label class="muted small">A = <input type="number" min="430" max="450" value="${st.settings.a4 || 440}" data-role="a4" style="width:64px;font:inherit;padding:4px;border:1.5px solid var(--rule);border-radius:6px;background:var(--paper);color:var(--ink)"> Hz</label></div></section>
    <section class="card"><div class="eyebrow">Drone</div><p class="muted small" style="margin:4px 0 8px">Hold a note and tune to it. Try the tonic of the piece you are practising, then its fifth.</p>
      <div class="seg" data-role="drones">${['C', 'D', 'E', 'F', 'G', 'A', 'B♭', 'B'].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="muted small" data-role="dronemsg"></div></section>
    <section class="card"><div class="eyebrow">Metronome</div>
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px"><button type="button" class="round" data-role="down">−</button><b class="bpm-v" data-role="bpmv">${st.settings.bpm || 80}</b><button type="button" class="round" data-role="up">+</button><button type="button" class="btn sm" data-role="mstart">Start</button><button type="button" class="btn sm ghost" data-role="tap">Tap tempo</button></div>
      <input type="range" min="40" max="208" value="${st.settings.bpm || 80}" data-role="bpm" style="width:100%;margin:8px 0">
      <div class="row" style="gap:8px;flex-wrap:wrap"><div class="seg" style="margin:0" data-role="time"><button type="button" data-v="4/4" class="on">4/4</button><button type="button" data-v="3/4">3/4</button><button type="button" data-v="2/4">2/4</button><button type="button" data-v="6/8">6/8</button></div><div class="seg" style="margin:0" data-role="sub"><button type="button" data-v="1" class="on">Beats</button><button type="button" data-v="2">Quavers</button><button type="button" data-v="4">Semiquavers</button></div></div>
      <div class="beats" data-role="beats"></div></section>
    <section class="card"><div class="eyebrow">Play-back exercise</div><p class="muted small" style="margin:4px 0 8px">Choose a scale, tap Listen, then play it on the oboe one note at a time. Each note ticks when the app hears it in tune.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><select data-role="pbkey">${MAJOR_KEYS_U2.map(k => `<option value="${k}">${k} major</option>`).join('')}${MINOR_KEYS.map(k => `<option value="${k}">${keyLabel(k)}</option>`).join('')}</select><button type="button" class="btn sm" data-role="pbhear">Hear it</button><button type="button" class="btn sm ghost" data-role="pblisten">Listen to me</button></div>
      <div class="ex-staff" data-role="pbstaff" style="margin-top:8px"></div><div class="muted small" data-role="pbmsg"></div></section>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  // tuner
  let tunerOn = false, raf = 0;
  const a4 = () => +q('a4').value || 440;
  q('a4').addEventListener('change', () => { store.get().settings.a4 = a4(); store.save(); });
  async function tunerLoop() {
    if (!tunerOn) return;
    const f = detectPitch();
    if (f > 0) { const n = freqToNote(f, a4()); q('note').textContent = n.name + n.oct; q('cents').textContent = `${f.toFixed(1)} Hz · ${n.cents > 0 ? '+' : ''}${n.cents} cents ${Math.abs(n.cents) <= 5 ? '· in tune' : n.cents > 0 ? '· sharp' : '· flat'}`; q('needle').style.left = (50 + n.cents) + '%'; q('needle').classList.toggle('ok', Math.abs(n.cents) <= 5); }
    raf = requestAnimationFrame(tunerLoop);
  }
  q('tstart').addEventListener('click', async () => {
    if (tunerOn) { tunerOn = false; cancelAnimationFrame(raf); q('tstart').textContent = 'Start'; q('cents').textContent = 'Stopped.'; if (!pbListening) stopMic(); return; }
    unlock(); const ok = await mic(); if (!ok) { q('cents').textContent = 'The microphone was not allowed. The tuner needs it; allow it in Settings for this site to use the tuner.'; return; }
    tunerOn = true; q('tstart').textContent = 'Stop'; q('cents').textContent = 'Listening…'; tunerLoop();
  });
  // drone
  let droneStop = null, droneNote = null;
  el.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
    if (droneStop) { droneStop(); droneStop = null; }
    if (droneNote === b.dataset.n) { droneNote = null; el.querySelectorAll('[data-n]').forEach(x => x.classList.remove('on')); q('dronemsg').textContent = ''; return; }
    droneNote = b.dataset.n; el.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', x === b));
    const midi = 48 + NOTE_NAMES.indexOf(droneNote); droneStop = startDrone(midi); q('dronemsg').textContent = `Drone on ${droneNote}. Tap it again to stop.`;
  }));
  // metronome (scheduled ahead with the audio clock for a steady beat)
  let bpm = st.settings.bpm || 80, time = '4/4', sub = 1, running = false, nextTime = 0, tick = 0, timer = null;
  const beatsIn = () => time === '6/8' ? 2 : +time[0];
  const setBpm = (v) => { bpm = Math.max(40, Math.min(208, v)); q('bpmv').textContent = bpm; q('bpm').value = bpm; store.get().settings.bpm = bpm; store.save(); };
  q('up').addEventListener('click', () => setBpm(bpm + 1)); q('down').addEventListener('click', () => setBpm(bpm - 1)); q('bpm').addEventListener('input', (e) => setBpm(+e.target.value));
  el.querySelectorAll('[data-role=time] button').forEach(b => b.addEventListener('click', () => { time = b.dataset.v; el.querySelectorAll('[data-role=time] button').forEach(x => x.classList.toggle('on', x === b)); if (time === '6/8') { sub = 3; el.querySelectorAll('[data-role=sub] button').forEach(x => x.classList.remove('on')); } drawBeats(); }));
  el.querySelectorAll('[data-role=sub] button').forEach(b => b.addEventListener('click', () => { sub = +b.dataset.v; el.querySelectorAll('[data-role=sub] button').forEach(x => x.classList.toggle('on', x === b)); }));
  function drawBeats() { q('beats').innerHTML = Array.from({ length: beatsIn() }, (_, i) => `<span data-b="${i}">${i + 1}</span>`).join(''); }
  function schedule() {
    const c = context();
    while (nextTime < c.currentTime + 0.12) {
      const perBeat = sub;
      const beat = Math.floor(tick / perBeat) % beatsIn(); const within = tick % perBeat;
      const at = nextTime - c.currentTime;
      if (within === 0) click(beat === 0, Math.max(0, at)); else { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 800; g.gain.setValueAtTime(0.0001, nextTime); g.gain.exponentialRampToValueAtTime(0.15, nextTime + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, nextTime + 0.03); o.connect(g); g.connect(c.destination); o.start(nextTime); o.stop(nextTime + 0.04); }
      if (within === 0) { const bt = beat; setTimeout(() => { el.querySelectorAll('[data-b]').forEach(s => s.classList.toggle('on', +s.dataset.b === bt)); }, Math.max(0, at * 1000)); }
      nextTime += 60 / bpm / sub;
      tick++;
    }
  }
  // 6/8 timing: the beat is a dotted crotchet; with bpm counting dotted crotchets, quavers come every beat/3
  function schedule68() {
    const c = context();
    while (nextTime < c.currentTime + 0.12) {
      const beat = Math.floor(tick / 3) % 2, within = tick % 3; const at = nextTime - c.currentTime;
      if (within === 0) { click(beat === 0, Math.max(0, at)); const bt = beat; setTimeout(() => el.querySelectorAll('[data-b]').forEach(s => s.classList.toggle('on', +s.dataset.b === bt)), Math.max(0, at * 1000)); }
      else { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 800; g.gain.setValueAtTime(0.0001, nextTime); g.gain.exponentialRampToValueAtTime(0.15, nextTime + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, nextTime + 0.03); o.connect(g); g.connect(c.destination); o.start(nextTime); o.stop(nextTime + 0.04); }
      nextTime += 60 / bpm / 3; tick++;
    }
  }
  function startMetro() { unlock(); running = true; tick = 0; nextTime = context().currentTime + 0.05; timer = setInterval(() => (time === '6/8' ? schedule68 : schedule)(), 40); q('mstart').textContent = 'Stop'; }
  function stopMetro() { running = false; clearInterval(timer); q('mstart').textContent = 'Start'; el.querySelectorAll('[data-b]').forEach(s => s.classList.remove('on')); }
  q('mstart').addEventListener('click', () => running ? stopMetro() : startMetro());
  let taps = [];
  q('tap').addEventListener('click', () => { const now = performance.now(); taps = taps.filter(t => now - t < 3000); taps.push(now); if (taps.length >= 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); setBpm(Math.round(60000 / iv)); } });
  drawBeats();
  // play-back exercise
  let pbListening = false, pbRaf = 0, pbTargets = [], pbIdx = 0, pbHold = 0;
  function pbScale() { const k = q('pbkey').value; return keyScale(k); }
  function pbDraw() { const sc = pbScale(); q('pbstaff').innerHTML = renderNotation({ key: q('pbkey').value, events: sc.map(n => ({ pitches: [n], dur: 48 })), labels: 'names', endBar: false }).svg; pbTargets = sc.map(toMidi); pbIdx = 0; }
  q('pbkey').addEventListener('change', pbDraw);
  q('pbhear').addEventListener('click', () => { const evs = q('pbstaff').querySelectorAll('.ev'); playSequence(pbTargets.map(m => ({ midi: m, beats: 1 })), { bpm: 80, voice: 'oboe', onNote: (i) => { evs.forEach(e => e.classList.remove('hot')); evs[i].classList.add('hot'); }, onEnd: () => evs.forEach(e => e.classList.remove('hot')) }); });
  function pbLoop() {
    if (!pbListening) return;
    const f = detectPitch();
    if (f > 0) { const n = freqToNote(f, a4()); const want = pbTargets[pbIdx]; const same = n.midi === want || n.midi === want + 12 || n.midi === want - 12; if (same && Math.abs(n.cents) <= 30) pbHold++; else pbHold = 0;
      if (pbHold >= 6) { const evs = q('pbstaff').querySelectorAll('.ev'); evs[pbIdx].classList.add('hot'); pbIdx++; pbHold = 0; if (pbIdx >= pbTargets.length) { q('pbmsg').textContent = 'All eight notes heard in tune. Try the next key, or play it descending from memory.'; pbStop(); return; } q('pbmsg').textContent = `Heard ${pitchName(pbScale()[pbIdx - 1])}. Now play ${pitchName(pbScale()[pbIdx])}.`; }
      else q('pbmsg').textContent = `Hearing ${n.name}${n.oct} (${n.cents > 0 ? '+' : ''}${n.cents} cents). Waiting for ${pitchName(pbScale()[pbIdx])}.`; }
    pbRaf = requestAnimationFrame(pbLoop);
  }
  function pbStop() { pbListening = false; cancelAnimationFrame(pbRaf); q('pblisten').textContent = 'Listen to me'; if (!tunerOn) stopMic(); }
  q('pblisten').addEventListener('click', async () => {
    if (pbListening) { pbStop(); q('pbmsg').textContent = 'Stopped.'; return; }
    unlock(); const ok = await mic(); if (!ok) { q('pbmsg').textContent = 'The microphone was not allowed, so the app cannot hear you. The exercise still works as a listening and reading task.'; return; }
    pbListening = true; pbIdx = 0; pbHold = 0; q('pbstaff').querySelectorAll('.ev').forEach(e => e.classList.remove('hot')); q('pblisten').textContent = 'Stop'; q('pbmsg').textContent = `Play ${pitchName(pbScale()[0])} and hold it.`; pbLoop();
  });
  pbDraw();
  cleanup.fns.push(() => { tunerOn = false; cancelAnimationFrame(raf); pbStop(); stopMic(); if (droneStop) droneStop(); stopMetro(); });
}

// ---------- journal ----------
function journal(el) {
  const st = store.get();
  const today = store.today();
  el.innerHTML = `<section class="card" style="border-left:5px solid var(--perf)"><div class="eyebrow">Today's entry</div>
    <form class="work-form" data-role="form" style="margin-top:8px">
      <label>What I worked on<textarea rows="2" id="j-worked" placeholder="Pieces, passages, scales, exercises"></textarea></label>
      <label>What went well<textarea rows="2" id="j-well"></textarea></label>
      <label>One thing to improve<textarea rows="2" id="j-improve"></textarea></label>
      <label>Next goal<textarea rows="2" id="j-next"></textarea></label>
      <label>Minutes practised<input type="number" min="0" max="600" id="j-mins" placeholder="25"></label>
      <button type="submit" class="btn sm">Save entry${st.journal.some(e => e.day === today) ? '' : ' · 1 life'}</button><p class="muted small" data-role="msg"></p>
    </form></section>
    <h2 style="font-size:20px;margin:16px 0 8px">Past entries</h2><div class="journal" data-role="list"></div>`;
  const list = el.querySelector('[data-role=list]');
  const draw = () => {
    const js = store.get().journal;
    list.innerHTML = js.length ? js.slice(0, 30).map(e => `<div class="jentry"><div class="eyebrow">${esc(e.day)}${e.mins ? ` · ${e.mins} min` : ''}</div><p><b>Worked on:</b> ${esc(e.worked)}</p>${e.well ? `<p><b>Went well:</b> ${esc(e.well)}</p>` : ''}${e.improve ? `<p><b>To improve:</b> ${esc(e.improve)}</p>` : ''}${e.next ? `<p><b>Next goal:</b> ${esc(e.next)}</p>` : ''}</div>`).join('') : '<p class="muted small">No entries yet. A short entry after each practice session earns a life once a day and builds a record you can look back on.</p>';
    const total = js.reduce((a, e) => a + (+e.mins || 0), 0); if (js.length) list.insertAdjacentHTML('afterbegin', `<p class="muted small">${js.length} entries · ${total} minutes logged</p>`);
  };
  el.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = { worked: el.querySelector('#j-worked').value.trim(), well: el.querySelector('#j-well').value.trim(), improve: el.querySelector('#j-improve').value.trim(), next: el.querySelector('#j-next').value.trim(), mins: +el.querySelector('#j-mins').value || 0 };
    if (!entry.worked) { el.querySelector('[data-role=msg]').textContent = 'Write at least what you worked on.'; return; }
    const r = store.recordJournalEntry(entry);
    el.querySelector('[data-role=msg]').textContent = r.lives ? 'Saved. You earned 1 life.' : 'Saved.';
    el.querySelector('form').reset(); draw();
  });
  draw();
}

// ---------- recordings ----------
function recordings(el, cleanup) {
  el.innerHTML = `<section class="card" style="border-left:5px solid var(--perf)"><div class="eyebrow">Record</div><p class="muted small" style="margin:4px 0 8px">Recordings stay on this phone and are never uploaded. Record a run-through, then listen with the listening template in mind: tempo, dynamics, articulation, tone, phrasing.</p>
    <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="btn sm" data-role="rec">Record</button><span class="muted small" data-role="rmsg"></span></div>
    <input type="text" data-role="rtitle" placeholder="What is this? (piece, passage)" style="width:100%;margin-top:8px;font:inherit;padding:8px;border:1.5px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink)"></section>
    <h2 style="font-size:20px;margin:16px 0 8px">My recordings</h2><div data-role="list" class="journal"></div>`;
  const q = (r) => el.querySelector(`[data-role=${r}]`);
  let rec = null, chunks = [], startedAt = 0, tmr = null;
  q('rec').addEventListener('click', async () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    unlock(); const ok = await mic(); if (!ok) { q('rmsg').textContent = 'The microphone was not allowed. Recording needs it.'; return; }
    if (!window.MediaRecorder) { q('rmsg').textContent = 'This browser cannot record audio.'; return; }
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', ''].find(t => !t || MediaRecorder.isTypeSupported(t));
    rec = new MediaRecorder(micStream, type ? { mimeType: type } : undefined); chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(tmr); const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
      const id = uid(); try { await putRec(id, blob); } catch (e) { q('rmsg').textContent = 'Could not save the recording on this phone.'; return; }
      const st = store.get(); st.recordings.unshift({ id, title: q('rtitle').value.trim() || 'Recording', day: store.today(), t: Date.now(), secs: Math.round((Date.now() - startedAt) / 1000), type: blob.type, bytes: blob.size }); store.save();
      q('rmsg').textContent = 'Saved.'; q('rec').textContent = 'Record'; q('rtitle').value = ''; stopMic(); draw();
    };
    rec.start(); startedAt = Date.now(); q('rec').textContent = 'Stop'; q('rmsg').textContent = 'Recording 0:00';
    tmr = setInterval(() => { const s = Math.round((Date.now() - startedAt) / 1000); q('rmsg').textContent = `Recording ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
  });
  async function draw() {
    const list = q('list'); const rs = store.get().recordings;
    list.innerHTML = rs.length ? '' : '<p class="muted small">No recordings yet.</p>';
    for (const r of rs) {
      const row = document.createElement('div'); row.className = 'jentry';
      row.innerHTML = `<div class="eyebrow">${esc(r.day)} · ${Math.floor(r.secs / 60)}:${String(r.secs % 60).padStart(2, '0')}</div><p><b>${esc(r.title)}</b></p><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm ghost" data-play>Play</button><button type="button" class="btn sm ghost" data-del>Delete</button></div><audio controls hidden></audio>`;
      row.querySelector('[data-play]').addEventListener('click', async () => { const blob = await getRec(r.id); if (!blob) { row.querySelector('p').textContent += ' (file missing)'; return; } const a = row.querySelector('audio'); a.src = URL.createObjectURL(blob); a.hidden = false; a.play(); });
      row.querySelector('[data-del]').addEventListener('click', async (e) => { const b = e.target; if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Tap again to delete'; return; } await delRec(r.id); const st = store.get(); st.recordings = st.recordings.filter(x => x.id !== r.id); store.save(); draw(); });
      list.appendChild(row);
    }
  }
  draw();
  cleanup.fns.push(() => { if (rec && rec.state === 'recording') rec.stop(); stopMic(); });
}

// ---------- piece planner (P1 to P3, P6) ----------
const PIECE_FIELDS = [
  { id: 'key', label: 'Key and tonality', hint: 'For example: G major; or D minor, with a move to F major in the middle' },
  { id: 'scale', label: 'Scales and patterns it uses', hint: 'Scale runs, broken chords, repeated figures' },
  { id: 'structure', label: 'Structure', hint: 'Sections with bar numbers' },
  { id: 'elements', label: 'Elements that matter most', hint: 'Tempo, dynamics, articulation, tone colour, texture' },
  { id: 'technical', label: 'Technical challenges', hint: 'Fingering, breath, range, fast passages, tuning' },
  { id: 'expressive', label: 'Expressive challenges', hint: 'Phrasing, dynamics, tone, character' },
  { id: 'effect', label: 'Intended effect (Unit 2)', hint: 'The mood or character you want to convey, and how' },
  { id: 'exercises', label: 'Exercises I have designed', hint: 'For example: tonic scale in thirds, slurred; the bar 12 run at half speed; long notes on the top register' },
];
function pieces(el, arg) {
  const st = store.get();
  if (arg === 'pieces-new') return editPiece(el, { id: uid(), title: '', composer: '', fields: {}, created: Date.now() }, true);
  if (arg && arg.startsWith('piece-')) { const p = st.pieces.find(x => x.id === arg.slice(6)); if (p) return editPiece(el, p, false); }
  el.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center;margin:4px 0 10px"><p class="muted small" style="margin:0">One plan for each piece you are preparing.</p><a class="btn sm" href="#practice/pieces-new">Add a piece</a></div><div class="works" data-role="list"></div>`;
  const list = el.querySelector('[data-role=list]');
  if (!st.pieces.length) list.innerHTML = '<div class="card"><p class="muted" style="margin:0">No pieces yet. Add the pieces you are preparing for performance, then fill in the plan as lessons P1 to P3 ask.</p></div>';
  st.pieces.forEach(p => { const filled = PIECE_FIELDS.filter(f => (p.fields[f.id] || '').trim()).length; list.insertAdjacentHTML('beforeend', `<a class="work-row" style="border-left-color:var(--perf)" href="#practice/piece-${p.id}"><div><div class="n">${esc(p.title || 'Untitled')}</div><div class="s">${esc(p.composer || '')}</div><div class="bar"><b style="width:${Math.round(100 * filled / PIECE_FIELDS.length)}%;background:var(--perf)"></b></div></div><span class="best">${filled} of ${PIECE_FIELDS.length}</span></a>`); });
}
function editPiece(el, p, isNew) {
  el.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center;margin:4px 0 10px"><h2 style="font-size:20px">${isNew ? 'Add a piece' : 'Piece plan'}</h2><a class="btn ghost sm" href="#practice/pieces">Back</a></div>
    <form class="work-form"><label>Title<input type="text" id="p-title" value="${esc(p.title)}" required></label><label>Composer<input type="text" id="p-composer" value="${esc(p.composer)}"></label>
    ${PIECE_FIELDS.map(f => `<label>${f.label}<small>${f.hint}</small><textarea id="p-${f.id}" rows="2">${esc(p.fields[f.id] || '')}</textarea></label>`).join('')}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="submit" class="btn">Save</button>${isNew ? '' : '<button type="button" class="btn ghost" data-role="delete">Remove</button>'}</div><p class="muted small" data-role="msg"></p></form>`;
  el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); p.title = el.querySelector('#p-title').value.trim(); p.composer = el.querySelector('#p-composer').value.trim(); PIECE_FIELDS.forEach(f => { p.fields[f.id] = el.querySelector('#p-' + f.id).value; }); const st = store.get(); if (!st.pieces.find(x => x.id === p.id)) st.pieces.push(p); store.save(); el.querySelector('[data-role=msg]').textContent = 'Saved.'; if (isNew) location.hash = '#practice/piece-' + p.id; });
  const del = el.querySelector('[data-role=delete]'); if (del) del.addEventListener('click', () => { if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Tap again to confirm'; return; } const st = store.get(); st.pieces = st.pieces.filter(x => x.id !== p.id); store.save(); location.hash = '#practice/pieces'; });
}

export const CSS = `
.tuner{text-align:center;padding:6px 0}
.tuner-note{font-family:var(--display);font-size:44px;font-weight:600;line-height:1.1}
.tuner-scale{position:relative;height:14px;margin:8px 10% 6px;border-radius:7px;background:linear-gradient(to right,var(--bad),var(--paper-2) 40%,var(--ok) 48%,var(--ok) 52%,var(--paper-2) 60%,var(--bad))}
.tuner-needle{position:absolute;top:-4px;left:50%;width:4px;height:22px;background:var(--ink);border-radius:2px;transform:translateX(-50%);transition:left .08s linear}
.tuner-needle.ok{background:var(--ok)}
.bpm-v{font-family:var(--display);font-size:28px;min-width:56px;text-align:center;font-variant-numeric:tabular-nums}
.beats{display:flex;gap:6px;margin-top:10px}
.beats span{flex:1;height:36px;border:1.5px solid var(--rule);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--ink-2)}
.beats span.on{background:var(--perf);color:#fff;border-color:var(--perf)}
.journal{display:grid;gap:8px}
.jentry{border:1px solid var(--rule);border-radius:12px;padding:10px 14px}
.jentry p{margin:4px 0;font-size:15px}
.round{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--rule);font-size:20px;display:flex;align-items:center;justify-content:center}
`;
