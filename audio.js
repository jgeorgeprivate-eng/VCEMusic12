// audio.js — all sound in the app. Generated voices through the Web Audio API, with a hook for sampled instruments.
import { midiToFreq } from './theory.js';

let ctx = null, master = null, unlocked = false, silentEl = null;
const waves = {};

// iPhone: ask Safari to treat the app's sound as media playback, like the audio players.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

export function context() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 20; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} }
  return ctx;
}

// A tiny silent WAV played through an ordinary audio element. On iPhone this switches the
// app into media playback, which lets the Web Audio sound through.
function silentAudio() {
  if (!silentEl) {
    silentEl = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    silentEl.setAttribute('playsinline', '');
    silentEl.loop = false;
  }
  const p = silentEl.play(); if (p && p.catch) p.catch(() => {});
}

/** Call from a user tap so iOS lets sound through. Keeps trying until the sound is running. */
export function unlock() {
  const c = context();
  if (unlocked && c.state === 'running') return;
  silentAudio();
  const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  const done = () => { if (c.state === 'running') unlocked = true; };
  if (c.resume) c.resume().then(done, () => {}); else done();
}
// iPhone only accepts these as taps that may start sound (pointerdown and touchstart do not count).
['touchend', 'click', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
// Sound can stop when the app goes to the background or a call comes in; restart it on return.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') unlocked = false; });

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
