// keyboard.js — a tappable piano keyboard drawn in HTML. Reused by lessons, tools and the aural trainer.
import { playNote } from './audio.js';

const BLACK = new Set([1, 3, 6, 8, 10]);

/**
 * Create a keyboard. opts: { from, to (midi, inclusive), highlight: Set<midi>, labels: Map<midi,string>, voice, onTap(midi), accent: css colour }
 * Returns { el, update(opts), flash(midi) }
 */
export function keyboard(opts) {
  const el = document.createElement('div');
  el.className = 'kb';
  let state = { ...opts };
  const keys = new Map();

  function build() {
    el.innerHTML = '';
    keys.clear();
    let from = state.from, to = state.to;
    if (BLACK.has(from % 12)) from -= 1;
    if (BLACK.has(to % 12)) to += 1;
    const whites = [];
    for (let m = from; m <= to; m++) if (!BLACK.has(m % 12)) whites.push(m);
    const ww = 100 / whites.length;
    whites.forEach((m, i) => {
      const w = document.createElement('button');
      w.type = 'button'; w.className = 'kw'; w.style.left = (i * ww) + '%'; w.style.width = ww + '%'; w.dataset.m = m;
      w.setAttribute('aria-label', 'key ' + m);
      el.appendChild(w); keys.set(m, w);
      const b = m + 1;
      if (BLACK.has(b % 12) && b <= to) {
        const bk = document.createElement('button');
        bk.type = 'button'; bk.className = 'kb-black'; bk.style.left = ((i + 1) * ww - ww * 0.32) + '%'; bk.style.width = (ww * 0.64) + '%'; bk.dataset.m = b;
        bk.setAttribute('aria-label', 'key ' + b);
        el.appendChild(bk); keys.set(b, bk);
      }
    });
    paint();
  }
  function paint() {
    keys.forEach((k, m) => {
      k.classList.toggle('on', !!(state.highlight && state.highlight.has(m)));
      const lab = state.labels && state.labels.get(m);
      k.innerHTML = lab ? `<span class="klab">${lab}</span>` : '';
    });
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-m]'); if (!t) return;
    const m = +t.dataset.m;
    if (state.sound !== false) playNote(m, { dur: 0.6, voice: state.voice || 'piano' });
    flash(m);
    if (state.onTap) state.onTap(m);
  });
  function flash(m, ms = 350) {
    const k = keys.get(m); if (!k) return;
    k.classList.add('hit'); setTimeout(() => k.classList.remove('hit'), ms);
  }
  build();
  return { el, update(o) { const rebuild = o.from !== undefined || o.to !== undefined; state = { ...state, ...o }; if (rebuild) build(); else paint(); }, flash };
}

export const CSS = `
.kb{position:relative;height:118px;background:var(--paper);border-radius:8px;overflow:hidden;border:1px solid var(--rule);user-select:none;-webkit-user-select:none}
.kb button{position:absolute;top:0;margin:0;padding:0;border:0;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.kb .kw{bottom:0;border-right:1px solid var(--rule);background:var(--paper);border-radius:0 0 4px 4px}
.kb .kw.on{background:color-mix(in srgb,var(--lang) 26%,var(--paper))}
.kb .kw.hit{background:color-mix(in srgb,var(--gold) 55%,var(--paper))}
.kb .kb-black{height:62%;background:var(--ink);border-radius:0 0 3px 3px;z-index:2}
.kb .kb-black.on{background:var(--lang)}
.kb .kb-black.hit{background:var(--gold)}
.kb .klab{position:absolute;left:0;right:0;bottom:5px;text-align:center;font-size:12px;color:var(--ink-2);pointer-events:none}
.kb .kb-black .klab{color:var(--paper);bottom:4px;font-size:10px}
`;
