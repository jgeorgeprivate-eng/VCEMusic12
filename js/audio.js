// audio.js — all sound in the app. Generated voices through the Web Audio API, with a hook for sampled instruments.
import { midiToFreq } from './theory.js';

let ctx = null, master = null, unlocked = false;
const waves = {};

export function context() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 20; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state !== 'running') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
  return ctx;
}

/**
 * iPhone sound fix. Safari only lets an AudioContext start inside a real user gesture, and on
 * iOS the context can stay "suspended" or "interrupted" even after resume() is called. So:
 *  - start audio on touchend, click, pointerup and keydown (touchend and click are the events
 *    iOS Safari treats as user activation; pointerdown alone is not enough on some versions);
 *  - ask for the "playback" audio session so the silent switch and media-volume slider do not mute us;
 *  - play a short silent <audio> element on the first tap, which flips the page into media-playback mode;
 *  - retry resume() until the context reports "running".
 * Safe to call repeatedly.
 */
let silentEl = null;
function silentDataUri() {
  // 0.05 s of silence as a WAV file (44-byte header + 2205 zero bytes), built in code to avoid a binary asset.
  const rate = 44100, samples = 2205, dataLen = samples * 2;
  const buf = new ArrayBuffer(44 + dataLen); const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, dataLen, true);
  let bin = ''; const bytes = new Uint8Array(buf); for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}
function playSilentElement() {
  try {
    if (!silentEl) { silentEl = document.createElement('audio'); silentEl.setAttribute('playsinline', ''); silentEl.preload = 'auto'; silentEl.src = silentDataUri(); silentEl.volume = 0.01; }
    const p = silentEl.play(); if (p && p.catch) p.catch(() => {});
  } catch (e) { /* ignore */ }
}
let retryTimer = null;
function retryUntilRunning() {
  if (!ctx || ctx.state === 'running') { retryTimer = null; return; }
  try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  retryTimer = setTimeout(retryUntilRunning, 250);
}
export function unlock() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
  const c = context();
  if (!unlocked) {
    unlocked = true;
    playSilentElement();
    const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  }
  if (c.state !== 'running' && !retryTimer) retryTimer = setTimeout(retryUntilRunning, 0);
}
['touchend', 'click', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running' && !retryTimer) retryTimer = setTimeout(retryUntilRunning, 0); });

// Harmonic recipes for generated voices: [amplitudes...], plus envelope and filter settings.
const VOICES = {
  oboe:     { harm: [1, 0.9, 1.0, 0.6, 0.5, 0.35, 0.25, 0.15, 0.1, 0.06], attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.08, cutoff: 5, vib: 5.5, vibDepth: 0.004, gain: 0.5 },
  flute:    { harm: [1, 0.35, 0.15, 0.05, 0.02], attack: 0.08, decay: 0.15, sustain: 0.75, release: 0.1, cutoff: 4, vib: 5, vibDepth: 0.003, gain: 0.7, breath: 0.03 },
  clarinet: { harm: [1, 0.05, 0.6, 0.04, 0.35, 0.03, 0.2, 0.02, 0.1], attack: 0.06, decay: 0.1, sustain: 0.85, release: 0.08, cutoff: 4, gain: 0.55 },
  horn:     { harm: [1, 0.6, 0.4, 0.25, 0.15, 0.08, 0.04], attack: 0.07, decay: 0.15, sustain: 0.8, release: 0.12, cutoff: 3, gain: 0.6 },
  trumpet:  { harm: [1, 0.8, 0.9, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1], attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.08, cutoff: 7, gain: 0.4 },
  strings:  { harm: [1, 0.7, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06], attack: 0.18, decay: 0.2, sustain: 0.8, release: 0.25, cutoff: 4, vib: 5.2, vibDepth: 0.005, gain: 0.45, chorus: true },
  piano:    { harm: [1, 0.5, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03], attack: 0.004, decay: 0.9, sustain: 0.0001, release: 0.15, cutoff: 6, gain: 0.7, percussive: true },
  harp:     { harm: [1, 0.3, 0.15, 0.08, 0.04], attack: 0.003, decay: 1.2, sustain: 0.0001, release: 0.2, cutoff: 5, gain: 0.6, percussive: true },
  sine:     { harm: [1], attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.05, cutoff: 10, gain: 0.5 },
  organ:    { harm: [1, 0.6, 0.3, 0.4, 0.1, 0.2], attack: 0.03, decay: 0.05, sustain: 1, release: 0.06, cutoff: 6, gain: 0.35 },
};

function wave(name) {
  if (waves[name]) return waves[name];
  const v = VOICES[name];
  const n = v.harm.length + 1;
  const real = new Float32Array(n), imag = new Float32Array(n);
  v.harm.forEach((a, i) => { imag[i + 1] = a; });
  waves[name] = context().createPeriodicWave(real, imag, { disableNormalization: false });
  return waves[name];
}

const samples = {};   // name -> { buffers: Map(midi -> AudioBuffer), nearest(midi) }
export function registerSamples(name, map) { samples[name] = map; }
export function hasSamples(name) { return !!samples[name]; }

/**
 * Play one note. midi: number. opts: { at: seconds from now, dur: seconds, voice, gain, artic: 'staccato'|'accent'|'legato'|'tenuto' }
 */
export function playNote(midi, opts = {}) {
  const c = context();
  const voiceName = opts.voice || 'oboe';
  const t0 = c.currentTime + (opts.at || 0);
  let dur = opts.dur || 0.5;
  let vel = opts.gain ?? 1;
  if (opts.artic === 'staccato') dur = Math.min(dur, Math.max(0.09, dur * 0.4));
  if (opts.artic === 'accent' || opts.artic === 'marcato') vel *= 1.5;
  if (opts.artic === 'tenuto') dur *= 0.98;
  const out = c.createGain();
  out.connect(opts.dest || master);

  if (samples[voiceName]) {
    const smp = samples[voiceName].nearest(midi);
    const src = c.createBufferSource();
    src.buffer = smp.buffer; src.playbackRate.value = Math.pow(2, (midi - smp.midi) / 12);
    src.connect(out);
    out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(0.9 * vel, t0 + 0.01);
    out.gain.setValueAtTime(0.9 * vel, t0 + dur); out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.12);
    src.start(t0); src.stop(t0 + dur + 0.15);
    return;
  }

  const v = VOICES[voiceName] || VOICES.sine;
  const f = midiToFreq(midi);
  const osc = c.createOscillator();
  osc.setPeriodicWave(wave(voiceName));
  osc.frequency.value = f;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = Math.min(f * v.cutoff, 9000); filt.Q.value = 0.7;
  const env = c.createGain();
  osc.connect(filt); filt.connect(env); env.connect(out);
  const peak = v.gain * vel * (opts.level ?? 0.5);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + v.attack);
  if (v.percussive) {
    env.gain.exponentialRampToValueAtTime(Math.max(peak * 0.001, 0.0001), t0 + v.attack + v.decay * 2.2);
  } else {
    env.gain.exponentialRampToValueAtTime(peak * v.sustain, t0 + v.attack + v.decay);
    env.gain.setValueAtTime(peak * v.sustain, Math.max(t0 + v.attack + v.decay, t0 + dur - v.release));
  }
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + v.release);
  // vibrato
  if (v.vib && dur > 0.25) {
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = v.vib; lg.gain.value = 0;
    lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(f * v.vibDepth, t0 + 0.35);
    lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + v.release + 0.05);
  }
  if (v.chorus) {
    const osc2 = c.createOscillator(); osc2.setPeriodicWave(wave(voiceName)); osc2.frequency.value = f * 1.004; osc2.detune.value = 4;
    const g2 = c.createGain(); g2.gain.value = 0.5; osc2.connect(g2); g2.connect(filt); osc2.start(t0); osc2.stop(t0 + dur + v.release + 0.05);
  }
  osc.start(t0); osc.stop(t0 + dur + v.release + 0.05);
}

export function playChord(midis, opts = {}) {
  const g = (opts.gain ?? 1) / Math.sqrt(midis.length) * 1.2;
  midis.forEach(m => playNote(m, { ...opts, gain: g }));
}

/**
 * Play a sequence. notes: [{ midi | midis | rest, beats, artic, voice, gain }], opts: { bpm, voice, onNote(i), onEnd }
 * Durations are in beats (crotchets). Returns { stop(), length (seconds) }.
 */
export function playSequence(notes, opts = {}) {
  const c = context();
  const bpm = opts.bpm || 100;
  const spb = 60 / bpm;
  let t = 0;
  const timers = [];
  const start = performance.now();
  notes.forEach((n, i) => {
    const dur = n.beats * spb;
    if (!n.rest) {
      const gap = n.artic === 'legato' || opts.legato ? 0 : 0.03;
      const d = Math.max(0.05, dur - gap);
      const ms = n.midis || [n.midi];
      ms.forEach(m => playNote(m, { at: t, dur: d, voice: n.voice || opts.voice, gain: (n.gain ?? 1) / Math.sqrt(ms.length), artic: n.artic }));
    }
    if (opts.onNote) timers.push(setTimeout(() => opts.onNote(i, n), t * 1000));
    t += dur;
  });
  if (opts.onEnd) timers.push(setTimeout(opts.onEnd, t * 1000 + 50));
  return { stop() { timers.forEach(clearTimeout); }, length: t };
}

/** A short click for the metronome. strong=true for beat one. */
export function click(strong = false, at = 0) {
  const c = context();
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.value = strong ? 1400 : 1000;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(strong ? 0.6 : 0.35, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.07);
}

/** A sustained drone on a midi note. Returns stop(). */
export function drone(midi, voice = 'organ') {
  const c = context();
  const o = c.createOscillator(); o.setPeriodicWave(wave(voice)); o.frequency.value = midiToFreq(midi);
  const o2 = c.createOscillator(); o2.setPeriodicWave(wave(voice)); o2.frequency.value = midiToFreq(midi) / 2;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.4);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start();
  return () => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.stop(t + 0.35); o2.stop(t + 0.35); };
}

export function now() { return context().currentTime; }
export const VOICE_NAMES = Object.keys(VOICES);
