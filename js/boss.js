// boss.js — boss tests: 20 mixed questions drawn across a strand's lessons for one unit, passed at 70%, worth 5 lives.
import * as store from './store.js';
import { STRANDS, byStrand, BUILT } from './curriculum.js';
import { runQuiz } from './quiz.js';

const loaders = {
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
  A1: () => import('../content/questions/A1.js'),
  A2: () => import('../content/questions/A2.js'),
  A3: () => import('../content/questions/A3.js'),
  A4: () => import('../content/questions/A4.js'),
  A5: () => import('../content/questions/A5.js'),
  A6: () => import('../content/questions/A6.js'),
  A7: () => import('../content/questions/A7.js'),
  A8: () => import('../content/questions/A8.js'),
  C1: () => import('../content/questions/C1.js'),
  C2: () => import('../content/questions/C2.js'),
  C3: () => import('../content/questions/C3.js'),
  C4: () => import('../content/questions/C4.js'),
  C5: () => import('../content/questions/C5.js'),
  C6: () => import('../content/questions/C6.js'),
  C7: () => import('../content/questions/C7.js'),
  P1: () => import('../content/questions/P1.js'),
  P2: () => import('../content/questions/P2.js'),
  P3: () => import('../content/questions/P3.js'),
  P4: () => import('../content/questions/P4.js'),
  P5: () => import('../content/questions/P5.js'),
  P6: () => import('../content/questions/P6.js'),
};

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

export async function mountBoss(el, arg) {
  const [strandId, unitStr] = (arg || 'lang-1').split('-');
  const unit = +unitStr || 1;
  const strand = STRANDS[strandId] || STRANDS.lang;
  const lessons = byStrand(strand.id).filter(l => BUILT.has(l.code) && l.units.includes(unit));
  const id = `${strand.id}-u${unit}`;
  const rec = store.get().boss[id];
  el.innerHTML = `<div class="top"><h1>Boss test</h1><a class="btn ghost sm" href="#learn/${strand.id}">Back</a></div>
    <div class="card" style="border-left:5px solid ${strand.colour}"><div class="eyebrow">${esc(strand.name)} · Unit ${unit}</div>
    <p style="margin:6px 0">20 questions mixed from all ${lessons.length} lessons in this strand. Pass at 70% to earn 5 lives and unlock the recording studio jar. ${rec ? `Your best: ${rec.best}%${rec.passed ? ', passed' : ''}.` : ''}</p>
    <div class="seg" data-role="unit"><a class="${unit === 1 ? 'on' : ''}" href="#boss/${strand.id}-1" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Unit 1</a><a class="${unit === 2 ? 'on' : ''}" href="#boss/${strand.id}-2" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Unit 2</a></div>
    <button type="button" class="btn" data-role="start">Start the boss test</button></div>
    <div data-role="quiz"></div>`;
  el.querySelector('[data-role=start]').addEventListener('click', async () => {
    el.querySelector('[data-role=start]').disabled = true;
    const mods = await Promise.all(lessons.map(l => loaders[l.code]()));
    const perLesson = Math.max(2, Math.ceil(24 / lessons.length));
    let pool = [];
    mods.forEach((m, i) => { const bank = m.bank(unit); const take = shuffle(bank).slice(0, perLesson).map(q => ({ ...q, from: lessons[i].code })); pool.push(...take); });
    pool = shuffle(pool).slice(0, 20);
    el.querySelector('.card').hidden = true;
    runQuiz(el.querySelector('[data-role=quiz]'), pool, { length: 20, onFinish: (pct) => {
      const r = store.recordBoss(id, pct);
      const parts = [];
      parts.push(r.passed ? `Passed. ${r.lives ? `You earned ${r.lives} lives.` : 'Lives for this test were already earned today; beat your best score to earn more.'}` : 'Not passed this time. Go back over the lessons you missed and try again.');
      if (r.work && r.work.newDay) parts.push(`Day ${r.work.count} of your streak${r.work.bonus ? `, with ${r.work.bonus} bonus lives` : ''}.`);
      return { message: parts.join(' '), actions: [{ label: 'Try again', onClick: () => mountBoss(el, arg) }, { label: 'Play the game', href: '#play' }, { label: 'Back to lessons', href: `#learn/${strand.id}` }] };
    } });
  });
}
function shuffle(a) { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }

/** Boss test rows for the Learn page. */
export function bossRows(strandId) {
  const st = store.get();
  return [1, 2].map(u => { const r = st.boss[`${strandId}-u${u}`]; return `<a class="lesson-row boss" href="#boss/${strandId}-${u}"><span class="num" style="background:var(--gold)">★</span><span class="t">Boss test · Unit ${u}<small>20 mixed questions · 5 lives</small></span><span class="best">${r ? r.best + '%' : ''}</span></a>`; }).join('');
}
