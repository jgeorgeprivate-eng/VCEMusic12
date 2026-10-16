// store.js — all saved progress. One JSON object in localStorage, versioned and migrated, never reset by an update.

const KEY = 'upbeat-state';
const VERSION = 1;

export const MAX_LIVES = 10;
export const MAX_LIVES_WITH_BONUS = 15;

function defaults() {
  return {
    v: VERSION,
    created: Date.now(),
    lives: 3,                               // a small starting balance so the game can be tried once
    streak: { count: 0, lastWorkDay: null, longest: 0, savers: 0, bonusGivenDay: null, lastSaverAwardCount: 0 },
    game: { pb: 0, pbDate: null, weekBest: 0, weekOf: null, highestPiece: -1, collection: [], games: 0, jar: 'paper', unlockedJars: ['paper'] },
    lessons: {},                            // code -> { best: %, attempts, lastDone: day, earnedDay }
    boss: {},                               // id -> { best, passed, lastDone }
    aural: { stats: {}, sets: 0, lastSetDay: null, levels: {} },
    works: [],                              // listening templates
    journal: [],                            // practice journal entries
    pieces: [],                             // piece planner
    recordings: [],                         // metadata only; audio blobs live in IndexedDB
    compositions: [],                       // pieces made in the melody writer
    settings: { a4: 440, voice: 'oboe', reminderShown: null, installPromptShown: null, lastBackupReminder: null },
    log: [],                                // recent events for the records page
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    return migrate(data);
  } catch (e) {
    console.warn('Could not read saved progress', e);
    return defaults();
  }
}

function migrate(data) {
  const d = defaults();
  // Fill in anything missing, keep everything present. Future versions add steps here.
  const merged = deepMerge(d, data);
  merged.v = VERSION;
  return merged;
}

function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (typeof base === 'object' && base !== null) {
    const out = { ...base };
    if (over && typeof over === 'object') for (const k of Object.keys(over)) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    return out;
  }
  return over === undefined ? base : over;
}

export function get() { return state; }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not save progress', e); }
  listeners.forEach(fn => fn(state));
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Local calendar day as YYYY-MM-DD on the phone's clock. */
export function today(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dayDiff(a, b) {           // whole days from day string a to day string b
  const [ay, am, ad] = a.split('-').map(Number), [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
export function weekOf(d = new Date()) {    // Monday-based week id
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return today(x);
}

// ---------- lives ----------

export function addLives(n, reason) {
  const cap = reason === 'streak' ? MAX_LIVES_WITH_BONUS : MAX_LIVES;
  const before = state.lives;
  let after = before + n;
  if (n > 0) after = Math.min(after, Math.max(cap, before));   // the cap never takes away lives already held
  state.lives = Math.max(0, after);
  log({ t: Date.now(), type: 'lives', n: state.lives - before, reason });
  save();
  return state.lives - before;
}

export function spendLife() {
  if (state.lives <= 0) return false;
  state.lives -= 1; state.game.games += 1; save(); return true;
}

// ---------- streak ----------

const STREAK_BONUS = [0, 0, 1, 1, 2, 3, 3, 5];   // index = day of streak (1..7)

/** Called when a piece of work (quiz, aural set, boss test) is completed. Updates the streak and pays the daily bonus once. */
export function recordWork(kind) {
  const d = today();
  const s = state.streak;
  if (s.lastWorkDay !== d) {
    if (s.lastWorkDay === null) s.count = 1;
    else {
      const gap = dayDiff(s.lastWorkDay, d);
      if (gap === 1) s.count += 1;
      else if (gap === 2 && s.savers > 0) { s.savers -= 1; s.count += 1; log({ t: Date.now(), type: 'saver' }); }
      else if (gap > 1) s.count = 1;
    }
    s.lastWorkDay = d;
    if (s.count > s.longest) s.longest = s.count;
    // bonus lives for the day
    let bonus;
    if (s.count <= 7) bonus = STREAK_BONUS[s.count];
    else bonus = s.count % 7 === 0 ? 5 : 3;
    let unlocked = null;
    if (s.count % 7 === 0 && s.count > 0) {
      if (s.savers < 1) s.savers = 1;
      unlocked = unlockJarForStreak(s.count);
    }
    s.bonusGivenDay = d;
    if (bonus > 0) addLives(bonus, 'streak');
    save();
    return { newDay: true, count: s.count, bonus, unlocked };
  }
  return { newDay: false, count: s.count, bonus: 0 };
}

/** Current streak as it stands now (drops to 0 display if two days have passed without work and no saver). */
export function streakStatus() {
  const s = state.streak;
  const d = today();
  if (!s.lastWorkDay) return { count: 0, doneToday: false, atRisk: false };
  const gap = dayDiff(s.lastWorkDay, d);
  if (gap === 0) return { count: s.count, doneToday: true, atRisk: false };
  if (gap === 1) return { count: s.count, doneToday: false, atRisk: true };
  if (gap === 2 && s.savers > 0) return { count: s.count, doneToday: false, atRisk: true, saverPending: true };
  return { count: 0, doneToday: false, atRisk: false, broken: true };
}

export function nextBonus() {
  const st = streakStatus();
  const next = st.doneToday ? st.count + 1 : (st.count || 0) + 1;
  if (next <= 7) return STREAK_BONUS[next];
  return next % 7 === 0 ? 5 : 3;
}

export const JARS = [
  { id: 'paper', name: 'Score paper', need: null },
  { id: 'hall', name: 'Concert hall', need: 'streak 7' },
  { id: 'pit', name: 'Orchestra pit', need: 'streak 14' },
  { id: 'stage', name: 'Outdoor stage', need: 'streak 21' },
  { id: 'studio', name: 'Recording studio', need: 'boss test' },
];
function unlockJarForStreak(count) {
  const want = count >= 21 ? 'stage' : count >= 14 ? 'pit' : 'hall';
  if (!state.game.unlockedJars.includes(want)) { state.game.unlockedJars.push(want); return want; }
  return null;
}
export function unlockJar(id) { if (!state.game.unlockedJars.includes(id)) { state.game.unlockedJars.push(id); save(); return true; } return false; }

// ---------- quizzes ----------

/** Record a quiz result. Returns { lives, improved, repeatBlocked } */
export function recordQuiz(code, pct) {
  const d = today();
  const l = state.lessons[code] || (state.lessons[code] = { best: 0, attempts: 0, lastDone: null, earnedDay: null });
  l.attempts += 1;
  const improved = pct > l.best;
  const firstToday = l.earnedDay !== d;
  if (improved) l.best = pct;
  l.lastDone = d;
  let lives = 0;
  if (improved || firstToday) {
    lives = pct >= 70 ? 2 : 1;
    l.earnedDay = d;
  }
  const work = recordWork('quiz');
  if (lives) addLives(lives, 'quiz');
  save();
  return { lives, improved, repeatBlocked: !lives, work };
}

export function recordBoss(id, pct) {
  const d = today();
  const b = state.boss[id] || (state.boss[id] = { best: 0, passed: false, lastDone: null, earnedDay: null });
  const improved = pct > b.best; if (improved) b.best = pct;
  const passedNow = pct >= 70;
  let lives = 0;
  if (passedNow && (improved || b.earnedDay !== d)) { lives = 5; b.earnedDay = d; }
  if (passedNow && !b.passed) { b.passed = true; unlockJar('studio'); }
  b.lastDone = d;
  const work = recordWork('boss');
  if (lives) addLives(lives, 'boss');
  save();
  return { lives, improved, passed: passedNow, work };
}

export function recordAuralSet(drill, correct, total) {
  const a = state.aural;
  a.sets += 1; a.lastSetDay = today();
  const work = recordWork('aural');
  addLives(1, 'aural');
  save();
  return { lives: 1, work };
}

export function recordAuralItem(drill, item, ok) {
  const st = state.aural.stats[drill] || (state.aural.stats[drill] = {});
  const r = st[item] || (st[item] = { n: 0, ok: 0, wrong: 0 });
  r.n += 1; if (ok) r.ok += 1; else r.wrong += 1;
  save();
}

export function recordJournalEntry(entry) {
  const d = today();
  state.journal.unshift({ ...entry, day: d, t: Date.now() });
  let lives = 0;
  if (!state.journal.some((e, i) => i > 0 && e.day === d)) { lives = 1; addLives(1, 'journal'); }
  save();
  return { lives };
}

export function recordWorkTemplate(work) {
  const d = today();
  let lives = 0;
  if (!work.earned) { work.earned = d; lives = 1; addLives(1, 'works'); }
  save();
  return { lives };
}

// ---------- game records ----------

export function recordGame({ score, highestPiece, pieces }) {
  const g = state.game;
  const d = today(), w = weekOf();
  if (g.weekOf !== w) { g.weekOf = w; g.weekBest = 0; }
  const beat = score > g.pb;
  if (beat) { g.pb = score; g.pbDate = d; }
  if (score > g.weekBest) g.weekBest = score;
  if (highestPiece > g.highestPiece) g.highestPiece = highestPiece;
  pieces.forEach(p => { if (!g.collection.includes(p)) g.collection.push(p); });
  log({ t: Date.now(), type: 'game', score });
  save();
  return { beat };
}

function log(e) { state.log.unshift(e); if (state.log.length > 200) state.log.length = 200; }

// ---------- backup ----------

export function exportJSON() { return JSON.stringify({ app: 'upbeat', exported: new Date().toISOString(), state }, null, 1); }

export function importJSON(text) {
  const data = JSON.parse(text);
  const incoming = data && data.app === 'upbeat' && data.state ? data.state : data;
  if (!incoming || typeof incoming !== 'object' || !('lives' in incoming)) throw new Error('This file is not an Upbeat backup.');
  state = migrate(incoming);
  save();
  return state;
}

export function resetAll() { state = defaults(); save(); }

export function markBackup() { state.settings.lastBackupReminder = today(); save(); }
export function backupDue() {
  const s = state.settings.lastBackupReminder;
  if (!s) return dayDiff(today(new Date(state.created)), today()) >= 7;
  return dayDiff(s, today()) >= 30;
}
