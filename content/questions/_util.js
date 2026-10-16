// Shared helpers for question generators.
import { rng } from '../../js/theory.js';

/** Build a bank of at least `want` distinct questions from templates, reproducibly. */
export function makeBank(templates, unit, seed, want = 40) {
  const r = rng(seed * 1000 + unit);
  const out = []; const seen = new Set();
  let guard = 0;
  while (out.length < want && guard++ < 900) {
    const t = templates[r.int(templates.length)];
    let q; try { q = t(r, unit); } catch (e) { console.warn('question template failed', e); continue; }
    if (!q || (q.unit || 1) > unit) continue;
    q.wrong = [...new Set(q.wrong.filter(w => w !== q.correct))];
    if (q.wrong.length < 3) continue;
    q.wrong = q.wrong.slice(0, 3);
    const key = q.text + '|' + q.correct + '|' + JSON.stringify(q.notation || '') + JSON.stringify(q.audio || '');
    if (seen.has(key)) continue;
    seen.add(key); out.push(q);
  }
  return out;
}
export function unique(arr) { return [...new Set(arr)]; }
