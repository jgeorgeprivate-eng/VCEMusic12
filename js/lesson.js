// lesson.js — loads a lesson's text file, renders it, mounts its examples and tool, and runs the quiz.
import { buildExample } from './examples.js';
import { runQuiz } from './quiz.js';
import { clipPlayer } from './clips.js';
import { lesson as lessonMeta, lessonNumber, STRANDS, nextLesson, BUILT, byStrand } from './curriculum.js';
import * as store from './store.js';

const tools = {
  'scale-builder': () => import('./tools/scale-builder.js'),
  ...Object.fromEntries(['staff-explorer', 'rhythm-grid', 'scale-chord-builder', 'progression-player', 'interval-explorer', 'dictation-pad'].map(n => [n, () => import('./tools/strand1.js').then(m => ({ mount: m.mounts[n] }))])),
  ...Object.fromEntries(['harmoniser', 'melody-writer', 'effect-sandbox', 'motif-developer', 'structure-planner', 'reflection'].map(n => [n, () => import('./tools/creating.js').then(m => ({ mount: m.mounts[n] }))])),
};
const questions = {
  P1: () => import('../content/questions/P1.js'),
  P2: () => import('../content/questions/P2.js'),
  P3: () => import('../content/questions/P3.js'),
  P4: () => import('../content/questions/P4.js'),
  P5: () => import('../content/questions/P5.js'),
  P6: () => import('../content/questions/P6.js'),
  C1: () => import('../content/questions/C1.js'),
  C2: () => import('../content/questions/C2.js'),
  C3: () => import('../content/questions/C3.js'),
  C4: () => import('../content/questions/C4.js'),
  C5: () => import('../content/questions/C5.js'),
  C6: () => import('../content/questions/C6.js'),
  C7: () => import('../content/questions/C7.js'),
  A1: () => import('../content/questions/A1.js'),
  A2: () => import('../content/questions/A2.js'),
  A3: () => import('../content/questions/A3.js'),
  A4: () => import('../content/questions/A4.js'),
  A5: () => import('../content/questions/A5.js'),
  A6: () => import('../content/questions/A6.js'),
  A7: () => import('../content/questions/A7.js'),
  A8: () => import('../content/questions/A8.js'),
  L1: () => import('../content/questions/L1.js'),
  L2: () => import('../content/questions/L2.js'),
  L3: () => import('../content/questions/L3.js'),
  L4: () => import('../content/questions/L4.js'),
  L5: () => import('../content/questions/L5.js'),
  L6: () => import('../content/questions/L6.js'),
  L7: () => import('../content/questions/L7.js'),
  L8: () => import('../content/questions/L8.js'),
  L9: () => import('../content/questions/L9.js'),
  L10: () => import('../content/questions/L10.js'),
  L11: () => import('../content/questions/L11.js'),
  L12: () => import('../content/questions/L12.js'),
  L13: () => import('../content/questions/L13.js'),
};

export async function loadLesson(code) {
  if (window.__inlineContent && window.__inlineContent[code]) return parse(window.__inlineContent[code]);   // single-file preview builds
  const res = await fetch(`content/lessons/${code}.md`);
  if (!res.ok) throw new Error('Lesson not found');
  return parse(await res.text());
}

/** Parse the lesson format: YAML-like frontmatter, then blocks. */
export function parse(text) {
  const out = { meta: {}, blocks: [] };
  let body = text;
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) { fm[1].split('\n').forEach(l => { const m = l.match(/^(\w+):\s*(.*)$/); if (m) out.meta[m[1]] = m[2]; }); body = text.slice(fm[0].length); }
  const lines = body.split('\n');
  let para = [];
  let target = out.blocks;
  const stack = [];
  const flush = () => { if (para.length) { target.push({ type: 'p', text: para.join(' ') }); para = []; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (line.startsWith('## ')) { flush(); target.push({ type: 'h2', text: line.slice(3) }); continue; }
    if (line.startsWith(':::')) {
      flush();
      const m = line.match(/^:::(\w[\w-]*)\s*(.*)$/);
      const kind = m[1], rest = m[2];
      if (kind === 'def') { const [term, txt] = rest.split('::').map(s => s.trim()); target.push({ type: 'def', term, text: txt }); }
      else if (kind === 'aside') { const [title, txt] = rest.split('::').map(s => s.trim()); target.push({ type: 'aside', title, text: txt }); }
      else if (kind === 'example') { const [etype, ...ps] = tokenize(rest); target.push({ type: 'example', etype, params: params(ps) }); }
      else if (kind === 'tool') { const [name, ...ps] = tokenize(rest); target.push({ type: 'tool', name, params: params(ps) }); }
      else if (kind === 'quiz') { target.push({ type: 'quiz' }); }
      else if (kind === 'clip') { const [id, title, task] = rest.split('::').map(s => s.trim()); target.push({ type: 'clip', id, title, task }); }
      else if (kind === 'unit2') { const blk = { type: 'unit2', title: rest.trim() || 'Unit 2', blocks: [] }; target.push(blk); stack.push(target); target = blk.blocks; }
      else if (kind === 'endunit2') { target = stack.pop() || out.blocks; }
      else target.push({ type: 'p', text: line });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

function tokenize(s) { const re = /([\w-]+)=(?:"([^"]*)"|(\S+))|(\S+)/g; const out = []; let m; while ((m = re.exec(s))) out.push(m[1] ? { k: m[1], v: m[2] !== undefined ? m[2] : m[3] } : m[4]); return out; }
function params(tokens) { const p = {}; for (const t of tokens) { if (typeof t === 'string') p[t] = true; else p[t.k] = t.v; } return p; }

// Inline markup: **bold**, *italic*
export function inline(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/** Render a lesson into container el. ctx: { unit, voice, onDone } */
export async function renderLesson(el, code, ctx) {
  const meta = lessonMeta(code);
  const strand = STRANDS[meta.strand];
  const unit = ctx.unit || 1;
  el.innerHTML = `<div class="lesson" style="--accent:${strand.colour}"><div class="lesson-head"><span class="chip" style="background:${strand.colour}">${strand.short} · ${code}</span><span class="muted">Lesson ${lessonNumber(code)} of ${byStrand(meta.strand).length}</span></div><h1>${esc(meta.title)}</h1><div class="lesson-body"><p class="muted">Loading…</p></div></div>`;
  const body = el.querySelector('.lesson-body');
  if (!BUILT.has(code)) { body.innerHTML = `<p>This lesson is coming in a later stage of the build.</p>`; return; }
  let doc;
  try { doc = await loadLesson(code); } catch (e) { body.innerHTML = `<p>Could not load this lesson. ${esc(e.message)}</p>`; return; }
  body.innerHTML = '';
  const prog = store.get().lessons[code];
  if (prog && prog.best) {
    const s = document.createElement('p'); s.className = 'muted small'; s.textContent = `Your best quiz score: ${prog.best}%.`; body.appendChild(s);
  }
  await renderBlocks(doc.blocks, body, { ...ctx, code, unit, strand });
}

async function renderBlocks(blocks, parent, ctx) {
  let defGroup = null;
  for (const b of blocks) {
    if (b.type !== 'def') defGroup = null;
    if (b.type === 'p') { const p = document.createElement('p'); p.innerHTML = inline(b.text); parent.appendChild(p); }
    else if (b.type === 'h2') { const h = document.createElement('h2'); h.textContent = b.text; parent.appendChild(h); }
    else if (b.type === 'def') {
      if (!defGroup) { defGroup = document.createElement('dl'); defGroup.className = 'defs'; parent.appendChild(defGroup); }
      defGroup.insertAdjacentHTML('beforeend', `<div><dt>${esc(b.term)}</dt><dd>${inline(b.text)}</dd></div>`);
    }
    else if (b.type === 'aside') { parent.insertAdjacentHTML('beforeend', `<aside class="aside"><b>${esc(b.title)}.</b> ${inline(b.text)}</aside>`); }
    else if (b.type === 'example') { parent.appendChild(buildExample(b.etype, b.params, ctx)); }
    else if (b.type === 'tool') {
      const box = document.createElement('div'); box.className = 'tool'; box.innerHTML = '<p class="muted">Loading tool…</p>'; parent.appendChild(box);
      const loader = tools[b.name];
      if (loader) { try { const mod = await loader(); box.innerHTML = ''; mod.mount(box, { ...ctx, params: b.params || {} }); } catch (e) { box.innerHTML = `<p class="muted">The ${esc(b.name)} tool could not load. ${esc(e.message)}</p>`; console.error(e); } }
      else box.innerHTML = `<p class="muted">Tool "${esc(b.name)}" is not built yet.</p>`;
    }
    else if (b.type === 'unit2') {
      const det = document.createElement('details'); det.className = 'unit2';
      det.open = ctx.unit >= 2;
      det.innerHTML = `<summary><span class="chip chip-u2">Unit 2</span> ${esc(b.title)}</summary><div class="unit2-body"></div>`;
      parent.appendChild(det);
      await renderBlocks(b.blocks, det.querySelector('.unit2-body'), ctx);
    }
    else if (b.type === 'clip') { const box = document.createElement('div'); parent.appendChild(box); clipPlayer(box, b); }
    else if (b.type === 'quiz') {
      const box = document.createElement('section'); box.className = 'quiz-box'; parent.appendChild(box);
      await mountQuiz(box, ctx);
    }
  }
}

async function mountQuiz(box, ctx) {
  const code = ctx.code;
  box.innerHTML = `<h2>Quiz</h2><p class="muted">10 questions drawn from a larger set, so each attempt is different. Score 70% or more to earn 2 lives, or 1 life for a lower score. Repeating a quiz earns lives again once a day, or when you beat your best score.</p>
    <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><div class="seg" data-role="unit" ${ctx.strand && ctx.strand.id === 'lang' ? '' : 'hidden'}><button type="button" data-u="1" class="${ctx.unit < 2 ? 'on' : ''}">Unit 1 keys</button><button type="button" data-u="2" class="${ctx.unit >= 2 ? 'on' : ''}">Unit 1 and 2 keys</button></div><button type="button" class="btn" data-role="start">Start quiz</button></div>
    <div data-role="quiz"></div>`;
  let unit = ctx.unit >= 2 ? 2 : 1;
  box.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { unit = +b.dataset.u; box.querySelectorAll('[data-u]').forEach(x => x.classList.toggle('on', x === b)); }));
  box.querySelector('[data-role=start]').addEventListener('click', async () => {
    const mod = await questions[code]();
    const bank = mod.bank(unit);
    box.querySelector('[data-role=start]').hidden = true;
    box.querySelector('[data-role=unit]').hidden = true;
    runQuiz(box.querySelector('[data-role=quiz]'), bank, { length: mod.meta.quizLength, onFinish: (pct) => {
      const res = store.recordQuiz(code, pct);
      const nxt = nextLesson(code);
      const parts = [];
      parts.push(res.lives ? `You earned ${res.lives} ${res.lives === 1 ? 'life' : 'lives'}.` : 'No lives this time: you have already earned lives for this quiz today. Beat your best score to earn more.');
      if (res.work && res.work.newDay) parts.push(res.work.count > 1 ? `Day ${res.work.count} of your streak${res.work.bonus ? `, with ${res.work.bonus} bonus ${res.work.bonus === 1 ? 'life' : 'lives'}` : ''}.` : 'Day 1 of a new streak.');
      if (res.improved) parts.push('New best score for this lesson.');
      return { message: parts.join(' '), actions: [{ label: 'Try again', onClick: () => mountQuiz(box, ctx) }, { label: 'Play the game', href: '#play' }, ...(nxt ? [{ label: `Next lesson: ${nxt.title}`, href: `#lesson/${nxt.code}` }] : [])] };
    } });
  });
}
