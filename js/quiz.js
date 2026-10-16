// quiz.js — runs a multiple-choice quiz from a generated bank. Correct answers land in a random position every time.
import { renderNotation } from './notation.js';
import { playSequence } from './audio.js';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/**
 * el: container. bank: array of questions { text, correct, wrong[], explain, notation?, audio?, mono? }.
 * opts: { length, onFinish(pct) -> { message, actions:[{label, href|onClick}] } }
 */
export function runQuiz(el, bank, opts) {
  const length = Math.min(opts.length || 10, bank.length);
  const qs = shuffle(bank).slice(0, length);
  let i = 0, score = 0;
  const results = [];

  function show() {
    const q = qs[i];
    const options = shuffle([{ t: q.correct, ok: true }, ...q.wrong.map(t => ({ t, ok: false }))]);
    el.innerHTML = `<div class="quiz"><div class="quiz-top"><span class="eyebrow">Question ${i + 1} of ${length}</span><span class="muted small">Score ${score}</span></div>
      <div class="q">${esc(q.text)}</div>
      ${q.notation ? `<div class="ex-staff q-staff">${renderNotation({ ...q.notation, endBar: q.notation.noEnd ? false : undefined }).svg}</div>` : ''}
      ${q.audio ? `<div class="big"><button type="button" class="playbig" data-role="play" aria-label="Play the example"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div>` : ''}
      <div class="opts" data-role="opts">${options.map((o, k) => `<button type="button" data-k="${k}" class="${q.mono ? 'mono' : ''}">${esc(o.t)}</button>`).join('')}</div>
      <div class="fb" data-role="fb" aria-live="polite"></div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn" data-role="next" hidden>${i + 1 < length ? 'Next question' : 'See result'}</button></div></div>`;
    let played = false;
    const playBtn = el.querySelector('[data-role=play]');
    if (playBtn) { const go = () => { playSequence(q.audio, { bpm: 100, voice: 'piano' }); played = true; }; playBtn.addEventListener('click', go); setTimeout(go, 250); }
    el.querySelectorAll('[data-role=opts] button').forEach(b => b.addEventListener('click', () => {
      const o = options[+b.dataset.k];
      el.querySelectorAll('[data-role=opts] button').forEach(x => { x.disabled = true; if (options[+x.dataset.k].ok) x.classList.add('ok'); });
      if (o.ok) { score++; b.classList.add('ok'); }
      else b.classList.add('bad');
      results.push({ q: q.text, ok: o.ok });
      el.querySelector('[data-role=fb]').innerHTML = `<b>${o.ok ? 'Correct.' : 'Not this one.'}</b> ${esc(q.explain || '')}`;
      el.querySelector('.quiz-top .muted').textContent = `Score ${score}`;
      const nx = el.querySelector('[data-role=next]'); nx.hidden = false; nx.focus({ preventScroll: true });
    }));
    el.querySelector('[data-role=next]').addEventListener('click', () => { i++; if (i < length) show(); else finish(); });
  }

  function finish() {
    const pct = Math.round(100 * score / length);
    const out = opts.onFinish ? opts.onFinish(pct) : { message: '' };
    el.innerHTML = `<div class="quiz result"><div class="eyebrow">Result</div><div class="pct ${pct >= 70 ? 'pass' : ''}">${pct}%</div><p>${score} of ${length} correct.</p><p>${esc(out.message || '')}</p><div class="acts" data-role="acts"></div></div>`;
    const acts = el.querySelector('[data-role=acts]');
    (out.actions || []).forEach((a, k) => {
      const b = document.createElement(a.href ? 'a' : 'button');
      if (a.href) b.href = a.href; else b.type = 'button';
      b.className = 'btn' + (k ? ' ghost' : ''); b.textContent = a.label;
      if (a.onClick) b.addEventListener('click', a.onClick);
      acts.appendChild(b);
    });
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  show();
}

function shuffle(arr) { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }

export const CSS = `
.quiz{border:1px solid var(--rule);border-radius:14px;padding:14px;background:var(--paper)}
.quiz-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
.quiz .q{font-weight:600;margin-bottom:10px;font-size:17px}
.quiz .q-staff{margin-bottom:10px}
.opts{display:grid;gap:8px}
.opts button{min-height:46px;text-align:left;padding:8px 14px;border-radius:10px;border:1.5px solid var(--rule);background:var(--paper);font:inherit;color:inherit;font-size:16px;cursor:pointer}
.opts button.mono{font-variant-numeric:tabular-nums;letter-spacing:.04em}
.opts button.ok{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 15%,var(--paper))}
.opts button.bad{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--paper))}
.opts button:disabled{cursor:default;opacity:1}
.fb{margin-top:10px;font-size:15px;color:var(--ink-2);min-height:1.4em}
.fb b{color:var(--ink)}
.big{display:flex;justify-content:center;margin:6px 0 14px}
.playbig{width:76px;height:76px;border-radius:50%;background:var(--accent,var(--lang));color:#fff;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer}
.playbig svg{width:32px;height:32px;fill:currentColor}
.quiz.result{text-align:center}
.quiz .pct{font-family:var(--display);font-size:52px;font-weight:600;line-height:1.1;margin:4px 0}
.quiz .pct.pass{color:var(--ok)}
.quiz .acts{display:grid;gap:8px;margin-top:12px}
`;
