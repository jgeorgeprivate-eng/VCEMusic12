// game.js — the merge drop game. One life per game, 90 seconds on the clock, personal best always on screen.
import * as store from './store.js';
import { playNote, playChord } from './audio.js';

export const PIECES = [
  { n: 'Quaver', r: 16, c: '#2B5C8A', note: 84, voice: 'sine', p: ['M40 20 L40 70', 'M40 20 Q62 30 56 48', 'M26 72 a14 9 -20 1 0 28 0 a14 9 -20 1 0 -28 0 Z'], fill: [2] },
  { n: 'Triangle', r: 20, c: '#4E7A3E', note: 91, voice: 'sine', p: ['M50 20 L82 76 L18 76 L46 26', 'M70 56 L86 40'] },
  { n: 'Piccolo', r: 24, c: '#73386A', note: 96, voice: 'flute', p: ['M14 48 L86 48 L86 54 L14 54 Z', 'M30 51 a3 3 0 1 0 .1 0', 'M44 51 a3 3 0 1 0 .1 0', 'M58 51 a3 3 0 1 0 .1 0', 'M72 51 a3 3 0 1 0 .1 0'] },
  { n: 'Oboe', r: 28, c: '#B9571F', note: 76, voice: 'oboe', p: ['M47 16 L53 16 L57 74 Q62 86 53 90 L47 90 Q38 86 43 74 Z', 'M49 6 L51 6 L52 16 L48 16 Z', 'M57 34 a3 3 0 1 0 .1 0', 'M58 46 a3 3 0 1 0 .1 0', 'M59 58 a3 3 0 1 0 .1 0', 'M43 40 h-6 M43 52 h-6'] },
  { n: 'Clarinet', r: 32, c: '#2B5C8A', note: 67, voice: 'clarinet', p: ['M45 14 L55 14 L55 72 Q68 82 55 90 L45 90 Q32 82 45 72 Z', 'M46 4 Q50 2 54 4 L55 14 L45 14 Z', 'M60 28 a3 3 0 1 0 .1 0', 'M60 40 a3 3 0 1 0 .1 0', 'M60 52 a3 3 0 1 0 .1 0', 'M40 34 h-6 M40 46 h-6 M40 58 h-6'] },
  { n: 'Trumpet', r: 36, c: '#B8860B', note: 72, voice: 'trumpet', p: ['M12 52 L62 52 L62 48 L12 48 Z', 'M62 50 L88 34 L88 66 Z', 'M30 48 L30 36', 'M40 48 L40 36', 'M50 48 L50 36', 'M26 36 h8 M36 36 h8 M46 36 h8', 'M14 50 a4 4 0 1 0 .1 0'] },
  { n: 'French horn', r: 40, c: '#B9571F', note: 60, voice: 'horn', p: ['M50 50 a26 26 0 1 1 .1 0', 'M50 50 a15 15 0 1 1 .1 0', 'M72 36 L92 18 L94 44 Z', 'M24 60 L14 76', 'M14 76 a4 4 0 1 0 .1 0'] },
  { n: 'Cello', r: 45, c: '#73386A', note: 48, voice: 'strings', p: ['M50 6 L50 40', 'M44 8 h12', 'M50 40 C70 36 80 50 72 60 C80 68 76 90 50 92 C24 90 20 68 28 60 C20 50 30 36 50 40 Z', 'M40 66 v10 M60 66 v10', 'M50 92 L50 98'] },
  { n: 'Harp', r: 50, c: '#4E7A3E', note: 55, voice: 'harp', p: ['M22 90 L22 30 Q40 6 76 12 L82 90 Z', 'M30 36 L30 90 M38 32 L38 90 M46 28 L46 90 M54 26 L54 90 M62 24 L62 90 M70 22 L70 90', 'M18 90 h68'] },
  { n: 'Timpani', r: 56, c: '#2B5C8A', note: 43, voice: 'sine', p: ['M14 34 L86 34 Q84 80 50 84 Q16 80 14 34 Z', 'M14 34 Q50 44 86 34', 'M30 84 L24 96 M70 84 L76 96', 'M30 14 L54 32 M28 12 a4 4 0 1 0 .1 0'] },
  { n: 'Grand piano', r: 62, c: '#221F1B', note: 36, voice: 'piano', p: ['M12 40 L12 72 L80 72 L88 60 L88 36 Q70 12 42 22 Q24 28 12 40 Z', 'M12 72 L12 80 L80 80 L80 72', 'M16 80 L16 94 M76 80 L76 94', 'M14 68 h66', 'M24 68 v-6 M30 68 v-6 M36 68 v-6 M42 68 v-6 M48 68 v-6 M54 68 v-6 M60 68 v-6 M66 68 v-6'] },
  { n: 'Orchestra', r: 70, c: '#B8860B', note: [36, 48, 55, 60, 64, 67, 72], voice: 'strings', p: ['M50 24 a40 40 0 0 1 40 40 L10 64 a40 40 0 0 1 40-40 Z', 'M50 44 a20 20 0 0 1 20 20 L30 64 a20 20 0 0 1 20-20 Z', 'M50 74 L50 92', 'M42 92 h16', 'M44 80 L36 70 M56 80 L64 70'] },
];
const DROP_TIERS = 5;
const POINTS = [0, 2, 5, 10, 20, 35, 60, 100, 160, 250, 400, 800];
const ORCHESTRA_BONUS = 1500;
export const GAME_SECONDS = 90;

const JAR_STYLES = {
  paper: { bg: null, line: null },
  hall: { bg: ['#2A1F2E', '#1A1420'], line: '#C9A961', ink: '#F2E8D5' },
  pit: { bg: ['#1D2430', '#111720'], line: '#8CB4D9', ink: '#E8EEF5' },
  stage: { bg: ['#1E3A2F', '#132620'], line: '#9CD3A8', ink: '#EAF5EC' },
  studio: { bg: ['#2E2622', '#1C1714'], line: '#E0A373', ink: '#F5EBE2' },
};

function mix(hex, paperHex, w) {
  const h = (x) => parseInt(x, 16);
  const a = [h(hex.slice(1, 3)), h(hex.slice(3, 5)), h(hex.slice(5, 7))], b = [h(paperHex.slice(1, 3)), h(paperHex.slice(3, 5)), h(paperHex.slice(5, 7))];
  return `rgb(${a.map((v, i) => Math.round(v * (1 - w) + b[i] * w)).join(',')})`;
}
function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return { ink: cs.getPropertyValue('--ink').trim() || '#221F1B', paper: cs.getPropertyValue('--paper').trim() || '#FAF6EC', gold: cs.getPropertyValue('--gold').trim() || '#B8860B' };
}

export function drawPiece(ctx, x, y, r, tier, alpha = 1, ink = '#221F1B', paper = '#FAF6EC') {
  const pc = PIECES[tier];
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = mix(pc.c, paper, 0.78); ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = ink; ctx.stroke();
  const s = (r * 1.5) / 100;
  ctx.translate(-50 * s, -50 * s); ctx.scale(s, s);
  ctx.lineWidth = Math.min(9, Math.max(3, 2.2 / s)); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink;
  pc.p.forEach((d, i) => { const path = new Path2D(d); if (pc.fill && pc.fill.includes(i)) { ctx.fillStyle = ink; ctx.fill(path); } ctx.stroke(path); });
  ctx.restore();
}

/** Mount the game into container el. Returns { destroy }. */
export function mountGame(el) {
  const st = store.get();
  el.innerHTML = `
    <div class="gwrap">
      <div class="hud">
        <div><div class="eyebrow">Score</div><div class="sc" data-role="score">0</div><div class="muted small"><span data-role="clock">1:30</span> left</div></div>
        <div class="nx">Next<br><canvas data-role="next" width="56" height="56"></canvas></div>
        <div class="pbv">Personal best<b data-role="pb">${st.game.pb}</b><span class="muted small" data-role="lives">♪ ${st.lives} ${st.lives === 1 ? 'life' : 'lives'}</span></div>
      </div>
      <div class="jar-top"></div>
      <canvas class="jar" data-role="jar"></canvas>
      <p class="note center">Slide to aim, tap to drop. Two of the same merge into the next instrument up. The clock starts on your first drop.</p>
      <div class="row center" style="gap:8px;flex-wrap:wrap"><a class="btn ghost sm" href="#records">Records</a><a class="btn ghost sm" href="#collection">Collection</a>${st.game.unlockedJars.length > 1 ? '<button type="button" class="btn ghost sm" data-role="jarpick">Jar design</button>' : ''}</div>
    </div>
    <div class="over" data-role="over"><div class="box">
      <h2 data-role="ovH">Game over</h2>
      <div class="rows"><div class="row2"><span>Score</span><b data-role="ovS">0</b></div><div class="row2"><span>Personal best</span><b data-role="ovPB">0</b></div><div class="row2"><span data-role="ovDiffL">Short by</span><b data-role="ovDiff">0</b></div><div class="row2"><span>Biggest piece</span><b data-role="ovBig">–</b></div></div>
      <div class="acts"><button type="button" class="btn" data-role="again">Play again · 1 life</button><a class="btn ghost" href="#learn">Earn lives</a><a class="btn ghost" href="#home">Home</a></div>
    </div></div>
    <div class="over" data-role="start"><div class="box">
      <h2>Ready?</h2><p class="muted">One life per game. You have <b data-role="startLives">${st.lives}</b>.</p>
      <div class="acts"><button type="button" class="btn" data-role="go">Play · 1 life</button><a class="btn ghost" href="#learn">Earn lives first</a></div>
    </div></div>`;

  const cv = el.querySelector('[data-role=jar]');
  const ctx = cv.getContext('2d');
  const g = { W: 300, H: 330, scale: 1, balls: [], next: 0, aimX: 150, score: 0, over: true, biggest: -1, overTimer: 0, dropping: false, clock: GAME_SECONDS, started: false, made: new Set(), beatShown: false, pb: st.game.pb, alive: true, jar: st.game.jar || 'paper' };
  const q = (r) => el.querySelector(`[data-role=${r}]`);

  function resize() {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    g.scale = r.width / g.W; g.H = Math.round(g.W * (r.height / r.width));
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr * g.scale, 0, 0, dpr * g.scale, 0, 0);
  }
  function drawNext() {
    const c = q('next').getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 56, 56);
    const th = themeColors(); drawPiece(c, 28, 28, 22, g.next, 1, th.ink, th.paper);
  }
  function pos(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * g.W; }
  let sx = 0;
  cv.addEventListener('pointerdown', e => { g.aimX = pos(e); sx = e.clientX; });
  cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') g.aimX = pos(e); });
  cv.addEventListener('pointerup', e => { g.aimX = pos(e); drop(); });
  function drop() {
    if (g.over || g.dropping) return;
    const t = g.next, r = PIECES[t].r;
    const x = Math.max(r + 2, Math.min(g.W - r - 2, g.aimX));
    g.balls.push({ x, y: -r, vx: 0, vy: 0, r, t, age: 0 });
    g.started = true; g.dropping = true; setTimeout(() => g.dropping = false, 260);
    g.next = Math.floor(Math.random() * DROP_TIERS); drawNext();
  }
  function merge(a, b) {
    const t = a.t + 1;
    g.balls = g.balls.filter(z => z !== a && z !== b);
    g.score += POINTS[t]; if (t > g.biggest) g.biggest = t; g.made.add(t);
    const pc = PIECES[t];
    if (Array.isArray(pc.note)) { playChord(pc.note, { dur: 1.8, voice: 'strings', gain: 1 }); g.score += ORCHESTRA_BONUS; }
    else { playNote(pc.note, { dur: t >= 9 ? 1.2 : 0.5, voice: pc.voice, gain: 0.9 }); g.balls.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: 0, vy: -1, r: pc.r, t, age: 0, pop: 1 }); }
    if (g.score > g.pb && g.pb > 0 && !g.beatShown) { g.beatShown = true; q('score').classList.add('gold'); flashBest(); }
    q('score').textContent = g.score;
  }
  function flashBest() { const s = q('score'); s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
  function step(dt) {
    const grav = 1500, W = g.W, H = g.H, bs = g.balls;
    for (const b of bs) { b.age += dt; b.vy += grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.995; if (b.pop) b.pop = Math.max(0, b.pop - dt * 3); }
    for (let it = 0; it < 5; it++) {
      for (const b of bs) {
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.3; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
        if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.15; b.vx *= 0.9; }
      }
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j];
        const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.001; const min = a.r + b.r;
        if (d < min) {
          if (a.t === b.t && a.t < PIECES.length - 1) { merge(a, b); return; }
          const nx = dx / d, ny = dy / d, ov = min - d;
          const ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
          a.x -= nx * ov * (mb / tot); a.y -= ny * ov * (mb / tot); b.x += nx * ov * (ma / tot); b.y += ny * ov * (ma / tot);
          const rvx = b.vx - a.vx, rvy = b.vy - a.vy; const vn = rvx * nx + rvy * ny;
          if (vn < 0) { const imp = -(1.1) * vn / (1 / ma + 1 / mb); a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; b.vx += imp * nx / mb; b.vy += imp * ny / mb; }
        }
      }
    }
    const above = bs.some(b => b.age > 1 && b.y - b.r < 0);
    g.overTimer = above ? g.overTimer + dt : 0;
    if (g.overTimer > 2 && !g.over) end('Jar full');
    if (g.started && !g.over) {
      g.clock -= dt; const c = Math.max(0, g.clock);
      q('clock').textContent = Math.floor(c / 60) + ':' + String(Math.ceil(c % 60) % 60).padStart(2, '0');
      if (g.clock <= 0) end("Time's up");
    }
  }
  function end(why) {
    g.over = true;
    const old = g.pb;
    const res = store.recordGame({ score: g.score, highestPiece: g.biggest, pieces: [...g.made] });
    if (res.beat) g.pb = g.score;
    q('ovH').textContent = res.beat ? 'New personal best' : why;
    q('ovS').textContent = g.score; q('ovPB').textContent = g.pb; q('pb').textContent = g.pb;
    q('ovDiffL').textContent = res.beat ? 'Beat it by' : 'Short by';
    q('ovDiff').textContent = res.beat ? (old ? g.score - old : g.score) : old - g.score;
    q('ovBig').textContent = g.biggest >= 0 ? PIECES[g.biggest].n : 'none';
    const lives = store.get().lives;
    q('again').disabled = lives <= 0; q('again').textContent = lives > 0 ? `Play again · 1 life (${lives} left)` : 'No lives left';
    q('lives').textContent = `♪ ${lives} ${lives === 1 ? 'life' : 'lives'}`;
    q('over').classList.add('on');
  }
  function begin() {
    if (!store.spendLife()) { q('start').classList.add('on'); q('startLives').textContent = '0'; return; }
    g.balls = []; g.score = 0; g.over = false; g.biggest = -1; g.overTimer = 0; g.beatShown = false; g.clock = GAME_SECONDS; g.started = false; g.made = new Set();
    q('score').textContent = '0'; q('score').classList.remove('gold'); q('clock').textContent = '1:30';
    q('over').classList.remove('on'); q('start').classList.remove('on');
    const lives = store.get().lives; q('lives').textContent = `♪ ${lives} ${lives === 1 ? 'life' : 'lives'}`;
    g.next = Math.floor(Math.random() * DROP_TIERS); drawNext();
  }
  q('again').addEventListener('click', begin);
  q('go').addEventListener('click', begin);
  const jp = q('jarpick');
  if (jp) jp.addEventListener('click', () => {
    const list = store.get().game.unlockedJars; const i = list.indexOf(g.jar); g.jar = list[(i + 1) % list.length];
    store.get().game.jar = g.jar; store.save();
  });

  let last = 0;
  function loop(t) {
    if (!g.alive) return;
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
    if (!g.over) { for (let i = 0; i < 2; i++) step(dt / 2); }
    draw();
    requestAnimationFrame(loop);
  }
  function draw() {
    const th = themeColors(); const js = JAR_STYLES[g.jar] || JAR_STYLES.paper;
    const ink = js.ink || th.ink, paper = js.bg ? js.bg[0] : th.paper;
    ctx.clearRect(0, 0, g.W, g.H);
    if (js.bg) { const gr = ctx.createLinearGradient(0, 0, 0, g.H); gr.addColorStop(0, js.bg[0]); gr.addColorStop(1, js.bg[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, g.W, g.H); }
    if (!g.over) {
      const r = PIECES[g.next].r; const x = Math.max(r + 2, Math.min(g.W - r - 2, g.aimX));
      ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = ink; ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, g.H); ctx.stroke(); ctx.restore();
      drawPiece(ctx, x, -r + r * 0.9, r, g.next, 0.5, ink, paper);
    }
    for (const b of g.balls) { const rr = b.pop ? b.r * (1 + 0.18 * Math.sin(b.pop * Math.PI)) : b.r; drawPiece(ctx, b.x, b.y, rr, b.t, 1, ink, paper); }
  }
  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  requestAnimationFrame(loop);
  q('start').classList.add('on');
  return { destroy() { g.alive = false; window.removeEventListener('resize', onResize); } };
}

/** Small canvas of one piece, for the collection page. */
export function pieceCanvas(tier, size = 76, ghost = false) {
  const c = document.createElement('canvas'); c.width = size; c.height = size; c.style.width = c.style.height = (size / 2) + 'px';
  const x = c.getContext('2d'); const th = themeColors();
  if (ghost) { x.setLineDash([4, 4]); x.beginPath(); x.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2); x.strokeStyle = th.ink; x.globalAlpha = 0.4; x.lineWidth = 2; x.stroke(); }
  else drawPiece(x, size / 2, size / 2, size * 0.4, tier, 1, th.ink, th.paper);
  return c;
}

export const CSS = `
.gwrap{display:flex;flex-direction:column;align-items:center;position:relative}
.hud{width:100%;max-width:420px;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;margin-bottom:8px;font-variant-numeric:tabular-nums}
.hud .sc{font-family:var(--display);font-size:40px;font-weight:600;line-height:1}
.hud .sc.gold{color:var(--gold)}
.hud .sc.pop{animation:pop .5s ease-out}
@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
.hud .pbv{text-align:right;color:var(--ink-2);font-size:14px}.hud .pbv b{display:block;font-family:var(--display);font-size:22px;color:var(--gold);font-weight:600}
.hud .nx{text-align:center;color:var(--ink-2);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.hud .nx canvas{width:40px;height:40px}
canvas.jar{width:100%;max-width:420px;aspect-ratio:3/3.3;border:1.5px solid var(--ink);border-top:0;border-radius:0 0 26px 26px;background:var(--paper);display:block;touch-action:none}
.jar-top{width:100%;max-width:420px;height:2px;border-top:1.5px dashed var(--rule)}
.over{position:fixed;inset:0;background:color-mix(in srgb,var(--paper) 86%,transparent);display:none;align-items:center;justify-content:center;padding:24px;z-index:20}
.over.on{display:flex}
.over .box{background:var(--paper);border:1px solid var(--rule);border-radius:18px;padding:22px;max-width:360px;width:100%;text-align:center}
.over h2{font-size:26px;margin-bottom:6px}
.over .row2{display:flex;justify-content:space-between;margin:8px 0;font-variant-numeric:tabular-nums}
.over .acts{display:grid;gap:8px;margin-top:14px}
`;
