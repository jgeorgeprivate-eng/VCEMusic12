// app.js — the shell: routing, home screen, learn index, settings and backup. Each feature lives in its own module.
import * as store from './store.js';
import { STRANDS, LESSONS, byStrand, lesson as lessonMeta, BUILT } from './curriculum.js';
import { renderLesson } from './lesson.js';
import { mountGame, PIECES, pieceCanvas } from './game.js';
import { CSS as NOTATION_CSS } from './notation.js';
import { CSS as KB_CSS } from './keyboard.js';
import { CSS as EX_CSS } from './examples.js';
import { CSS as QUIZ_CSS } from './quiz.js';
import { CSS as GAME_CSS } from './game.js';
import { CSS as S1_CSS } from './examples-strand1.js';
import { CSS as CLIP_CSS } from './clips.js';
import { mountAural, CSS as AURAL_CSS } from './aural.js';
import { CSS as AN_CSS } from './examples-analysis.js';
import { mountWorks, CSS as WORKS_CSS } from './works.js';
import { loadClips } from './clips.js';
import { CSS as CREATING_CSS } from './tools/creating.js';
import { mountPractice, CSS as PRACTICE_CSS } from './practice.js';
import { mountBoss, bossRows } from './boss.js';

// module CSS is injected once so every component's styles ship with its code
const styleEl = document.createElement('style');
styleEl.textContent = NOTATION_CSS + KB_CSS + EX_CSS + QUIZ_CSS + GAME_CSS + S1_CSS + CLIP_CSS + AURAL_CSS + AN_CSS + WORKS_CSS + CREATING_CSS + PRACTICE_CSS;
document.head.appendChild(styleEl);

const main = document.getElementById('main');
const tabs = document.querySelectorAll('.tabs button');
let current = null;        // { destroy } of the mounted screen

const TABS = { home: 'home', learn: 'learn', lesson: 'learn', boss: 'learn', aural: 'aural', play: 'play', practice: 'practice', works: 'learn', records: 'play', collection: 'play', backup: 'home', credits: 'home' };

function route() {
  const hash = location.hash.slice(1) || 'home';
  const [name, arg] = hash.split('/');
  if (current && current.destroy) current.destroy();
  current = null;
  main.innerHTML = '';
  main.scrollTop = 0; window.scrollTo(0, 0);
  tabs.forEach(b => b.classList.toggle('on', b.dataset.tab === (TABS[name] || 'home')));
  const screen = screens[name] || screens.home;
  current = screen(main, arg) || null;
}
window.addEventListener('hashchange', route);
tabs.forEach(b => b.addEventListener('click', () => { location.hash = '#' + b.dataset.tab; }));

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function dayName() { return new Date().toLocaleDateString(undefined, { weekday: 'long' }); }

function progressOf(strandId) {
  const list = byStrand(strandId); const st = store.get();
  const done = list.filter(l => st.lessons[l.code] && st.lessons[l.code].best >= 70).length;
  return { done, total: list.length, pct: Math.round(100 * done / list.length) };
}
function continueLesson() {
  const st = store.get();
  for (const l of LESSONS) { if (!BUILT.has(l.code)) continue; const p = st.lessons[l.code]; if (!p || p.best < 70) return l; }
  return LESSONS.find(l => BUILT.has(l.code)) || LESSONS[0];
}

const screens = {
  home(el) {
    const st = store.get(); const sk = store.streakStatus();
    const cont = continueLesson();
    const streakLine = sk.count === 0 ? 'Do one quiz or aural set today to start a streak.' : sk.doneToday ? `day streak. Done for today. Tomorrow's bonus: ${store.nextBonus()} ${store.nextBonus() === 1 ? 'life' : 'lives'}.` : `day streak. Do one quiz today to keep it${store.nextBonus() ? `, and earn ${store.nextBonus()} bonus ${store.nextBonus() === 1 ? 'life' : 'lives'}` : ''}.${sk.saverPending ? ' A streak saver covered yesterday.' : ''}`;
    el.innerHTML = `
      <div class="top"><div class="brand">Upbeat<small>${dayName()}</small></div><div class="lives"><span class="q">♪</span><span>${st.lives}</span> ${st.lives === 1 ? 'life' : 'lives'}</div></div>
      <div class="streak"><b>${sk.count}</b><span>${streakLine}</span></div>
      <div class="card cont" style="border-left-color:${STRANDS[cont.strand].colour}"><div class="eyebrow">Continue</div><h2>${esc(cont.title)}</h2><p>${STRANDS[cont.strand].short} · Lesson ${byStrand(cont.strand).indexOf(cont) + 1} of ${byStrand(cont.strand).length}${st.lessons[cont.code] ? ` · best ${st.lessons[cont.code].best}%` : ' · not yet done'}</p><a class="btn sm" href="#lesson/${cont.code}">Open lesson</a></div>
      <div class="strands">${Object.values(STRANDS).map(s => { const p = progressOf(s.id); return `<a class="strand" href="#learn/${s.id}"><i style="background:${s.colour}"></i><div><div class="n">${s.name}</div><div class="s">${p.total} lessons · ${p.done ? p.done + ' done' : 'not started'}</div><div class="bar"><b style="width:${p.pct}%;background:${s.colour}"></b></div></div><div class="pct">${p.pct}%</div></a>`; }).join('')}</div>
      <div class="play-card"><div><div class="eyebrow">Merge game</div><div class="pb">Personal best <b>${st.game.pb}</b></div></div><a class="btn" href="#play">Play · 1 life</a></div>
      <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap"><a class="btn ghost sm" href="#works">My works</a><a class="btn ghost sm" href="#records">Records</a><a class="btn ghost sm" href="#backup">Backup</a><a class="btn ghost sm" href="#credits">Credits</a></div>
      <div data-role="notices"></div>`;
    const notices = el.querySelector('[data-role=notices]');
    if (store.backupDue()) notices.insertAdjacentHTML('beforeend', `<div class="notice">It has been a while since your last backup. <a href="#backup">Export a backup</a> so your progress is safe if your phone changes.</div>`);
    if (window.__installHint) notices.insertAdjacentHTML('beforeend', `<div class="notice">${window.__installHint}</div>`);
  },

  learn(el, strandId) {
    const st = store.get();
    el.innerHTML = `<div class="top"><h1>Learn</h1></div>` + Object.values(STRANDS).filter(s => !strandId || s.id === strandId).map(s => `
      <section class="learn-strand"><h2 style="color:${s.colour}">${s.name}</h2><div class="lessons">${byStrand(s.id).map((l, i) => { const p = st.lessons[l.code]; const built = BUILT.has(l.code); return `<a class="lesson-row ${built ? '' : 'soon'}" href="#lesson/${l.code}"><span class="num" style="background:${s.colour}">${i + 1}</span><span class="t">${esc(l.title)}<small>${l.units.length === 1 ? 'Unit ' + l.units[0] : 'Units 1 and 2'}${built ? '' : ' · coming soon'}</small></span><span class="best">${p ? p.best + '%' : ''}</span></a>`; }).join('')}${bossRows(s.id)}</div></section>`).join('') + (strandId ? '' : `<p class="note">Each strand ends with a boss test of 20 mixed questions per unit, passed at 70%, worth 5 lives.</p>`);
  },

  lesson(el, code) {
    if (!lessonMeta(code)) { location.hash = '#learn'; return; }
    const unit = store.get().settings.unit || 1;
    renderLesson(el, code, { unit, voice: store.get().settings.voice });
  },

  aural(el) { mountAural(el); },

  play(el) { return mountGame(el); },

  boss(el, arg) { mountBoss(el, arg); },

  practice(el, arg) { return mountPractice(el, arg); },

  works(el, arg) { mountWorks(el, arg); },

  records(el) {
    const st = store.get(); const g = st.game;
    el.innerHTML = `<div class="top"><h1>Records</h1></div>
      <div class="rec-grid">
        <div class="rec"><div class="eyebrow">All-time best</div><b>${g.pb}</b><span class="muted small">${g.pbDate || ''}</span></div>
        <div class="rec"><div class="eyebrow">Best this week</div><b>${g.weekOf === store.weekOf() ? g.weekBest : 0}</b></div>
        <div class="rec"><div class="eyebrow">Highest piece</div><b>${g.highestPiece >= 0 ? PIECES[g.highestPiece].n : '–'}</b></div>
        <div class="rec"><div class="eyebrow">Longest streak</div><b>${st.streak.longest}</b><span class="muted small">days</span></div>
        <div class="rec"><div class="eyebrow">Games played</div><b>${g.games}</b></div>
        <div class="rec"><div class="eyebrow">Streak savers</div><b>${st.streak.savers}</b><span class="muted small">earned every 7 days</span></div>
      </div>
      <div class="row" style="margin-top:14px;gap:8px"><a class="btn ghost sm" href="#collection">Collection</a><a class="btn sm" href="#play">Play</a></div>`;
  },

  collection(el) {
    const st = store.get();
    el.innerHTML = `<div class="top"><h1>Collection</h1></div><p class="muted">Every piece you have made. Pieces you have not made yet appear as outlines.</p><div class="coll" data-role="coll"></div>
      <h2 style="margin-top:20px">Jar designs</h2><div class="jars">${store.JARS.map(j => `<div class="jar-opt ${st.game.unlockedJars.includes(j.id) ? '' : 'locked'}"><b>${j.name}</b><span class="muted small">${st.game.unlockedJars.includes(j.id) ? (st.game.jar === j.id ? 'in use' : 'unlocked') : 'unlocks at ' + j.need}</span></div>`).join('')}</div>`;
    const c = el.querySelector('[data-role=coll]');
    PIECES.forEach((p, i) => { const made = st.game.collection.includes(i); const d = document.createElement('div'); d.className = 'coll-item'; d.appendChild(pieceCanvas(i, 76, !made)); d.insertAdjacentHTML('beforeend', `<span>${made ? p.n : '?'}</span>`); c.appendChild(d); });
  },

  backup(el) {
    el.innerHTML = `<div class="top"><h1>Backup</h1></div>
      <p>Everything you do in Upbeat is stored on this phone only. Export a backup now and then, and import it if you change phones.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-role="export">Export backup</button><label class="btn ghost" for="importFile">Import backup</label><input id="importFile" type="file" accept="application/json,.json" hidden></div>
      <p class="muted small" data-role="msg"></p>
      <h2 style="margin-top:22px">Settings</h2>
      <div class="prow"><div><div class="n">Instrument sound in lessons</div></div><select data-role="voice"><option value="piano">Piano</option><option value="oboe">Oboe</option><option value="flute">Flute</option><option value="strings">Strings</option></select></div>
      <div class="prow"><div><div class="n">Current unit</div><div class="s">Sets which keys and metres appear by default</div></div><select data-role="unit"><option value="1">Unit 1</option><option value="2">Unit 2</option></select></div>
      <h2 style="margin-top:22px">Add to home screen</h2>
      <p>On an iPhone, open this site in Safari, tap the Share button, then "Add to Home Screen". The app then opens full screen and works offline. Saved data in an app added to the home screen is not cleared by iOS when the site goes unused.</p>
      <p class="muted small">Version <span data-role="ver"></span></p>`;
    const msg = el.querySelector('[data-role=msg]');
    el.querySelector('[data-role=export]').addEventListener('click', () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `upbeat-backup-${store.today()}.json`; document.body.appendChild(a); a.click(); a.remove();
      store.markBackup(); msg.textContent = 'Backup exported. Keep the file somewhere safe, such as iCloud Drive or Files.';
    });
    el.querySelector('#importFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { store.importJSON(await f.text()); msg.textContent = 'Backup imported. Your progress has been restored.'; } catch (err) { msg.textContent = 'Could not import: ' + err.message; }
    });
    const v = el.querySelector('[data-role=voice]'); v.value = store.get().settings.voice || 'piano'; v.addEventListener('change', () => { store.get().settings.voice = v.value; store.save(); });
    const u = el.querySelector('[data-role=unit]'); u.value = store.get().settings.unit || 1; u.addEventListener('change', () => { store.get().settings.unit = +u.value; store.save(); });
    el.querySelector('[data-role=ver]').textContent = window.__appVersion || '';
  },

  credits(el) {
    el.innerHTML = `<div class="top"><h1>Credits</h1></div>
      <p>Upbeat was made for one student of VCE Music Units 1 and 2.</p>
      <h2>Fonts</h2><p>Bravura music font by Steinberg Media Technologies, Fraunces by Undercase Type, and Source Sans 3 by Adobe. All three are used under the SIL Open Font License 1.1.</p>
      <h2>Recordings</h2><p class="muted">The recordings used in the lessons, with their performers and licences. Classicals.de tracks are used under the Creative Commons licence shown for each, with the credit the licence asks for.</p><div data-role="clips" class="credits"></div>`;
    loadClips().then(d => {
      const seen = new Set(); const box = el.querySelector('[data-role=clips]');
      (d.clips || []).forEach(c => { const k = c.file || c.url; if (seen.has(k)) return; seen.add(k); box.insertAdjacentHTML('beforeend', `<div class="credit-row"><b>${esc(c.title)}</b><span>${esc(c.composer || '')}</span><span>${esc(c.file ? (c.credit || '') : 'Linked on YouTube: ' + (c.performer || ''))}</span>${c.source ? `<a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.source.replace('https://', ''))}</a>` : ''}</div>`); });
    });
  },
};

// ----- first-run and install notices -----
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
if (!isStandalone && isIOS) window.__installHint = 'To use Upbeat as an app, tap Share in Safari and choose "Add to Home Screen". Progress is then kept safely on the phone.';

// ----- service worker and updates -----
if ('serviceWorker' in navigator && !window.__noSW) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    const hadActive = !!reg.active;          // only a replacement for an already active worker counts as an update
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw && nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && hadActive && navigator.serviceWorker.controller) showUpdate(reg);
      });
    });
  }).catch(e => console.warn('Service worker not registered', e));
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; if (document.getElementById('update').hidden === false) location.reload(); });
}
function showUpdate(reg) {
  const bar = document.getElementById('update');
  bar.hidden = false;
  bar.querySelector('button').addEventListener('click', () => { if (reg.waiting) reg.waiting.postMessage('skip'); else location.reload(); });
}
if (!window.__noSW) fetch('./version.json', { cache: 'no-store' }).then(r => r.json()).then(j => { window.__appVersion = j.version; }).catch(() => {});

route();
