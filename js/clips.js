// clips.js — real recordings in lessons. Reads audio/clips.json; a clip whose file is missing shows "Recording coming soon".
let clipsPromise = null;
export function loadClips() {
  if (!clipsPromise) clipsPromise = (window.__inlineClips ? Promise.resolve(window.__inlineClips) : fetch('audio/clips.json').then(r => r.ok ? r.json() : { clips: [] })).catch(() => ({ clips: [] }));
  return clipsPromise;
}
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function fmt(t) { if (t === undefined || t === null) return ''; const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; }

/** Render a clip block. block: { id, title, task } from the lesson file; data from clips.json overrides title/task when present. */
export async function clipPlayer(el, block) {
  const data = await loadClips();
  const c = (data.clips || []).find(x => x.id === block.id);
  const title = (c && c.title) || block.title || block.id;
  const task = (c && c.task) || block.task || '';
  const composer = c && c.composer ? `${c.composer}, ` : '';
  el.className = 'clip';
  if (c && c.file && window.__previewNoAudio) {
    el.innerHTML = `<div class="clip-head"><span class="eyebrow">Recording</span><b>${esc(title)}</b></div><p class="muted small">${esc(c.performer || '')}. The recording is bundled in the installed app and left out of this preview.</p>${task ? `<p class="clip-task">${esc(task)}</p>` : ''}<p class="credit">${esc(c.credit || '')}</p>`;
    return;
  }
  if (!c || (!c.file && !c.url)) {
    el.innerHTML = `<div class="clip-head"><span class="eyebrow">Recording</span><b>${esc(title)}</b></div><p class="muted small">Recording coming soon.</p>${task ? `<p class="clip-task">${esc(task)}</p>` : ''}`;
    return;
  }
  if (c.url && !c.file) {
    const start = c.start ? `&t=${Math.floor(c.start)}s` : '';
    el.innerHTML = `<div class="clip-head"><span class="eyebrow">Recording</span><b>${esc(title)}</b></div><p class="muted small">${esc(c.performer || '')}</p><a class="btn sm ghost" href="${esc(c.url)}${start}" target="_blank" rel="noopener">Open on YouTube${c.start ? ' at ' + fmt(c.start) : ''}</a>${task ? `<p class="clip-task">${esc(task)}</p>` : ''}`;
    return;
  }
  el.innerHTML = `<div class="clip-head"><span class="eyebrow">Recording${c.start !== undefined ? ` · ${fmt(c.start)}${c.end !== undefined ? ' to ' + fmt(c.end) : ''}` : ''}</span><b>${esc(title)}</b></div>
    <audio controls preload="none" src="audio/clips/${esc(c.file)}"${c.start !== undefined ? ` data-start="${c.start}"` : ''}${c.end !== undefined ? ` data-end="${c.end}"` : ''}></audio>
    ${task ? `<p class="clip-task">${esc(task)}</p>` : ''}
    <p class="credit">${esc(c.credit || '')}${c.source ? ` <a href="${esc(c.source)}" target="_blank" rel="noopener">Source</a>` : ''}</p>`;
  const a = el.querySelector('audio');
  if (c.start !== undefined) {
    a.addEventListener('loadedmetadata', () => { a.currentTime = c.start; });
    a.addEventListener('play', () => { if (a.currentTime < c.start - 0.5 || (c.end !== undefined && a.currentTime > c.end)) a.currentTime = c.start; });
    if (c.end !== undefined) a.addEventListener('timeupdate', () => { if (a.currentTime >= c.end) { a.pause(); a.currentTime = c.start; } });
  }
}

export const CSS = `
.clip{border:1px solid var(--rule);border-left:4px solid var(--anal);border-radius:12px;padding:12px 14px;margin:0 0 16px;background:var(--paper)}
.clip-head{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}
.clip-head b{font-size:17px}
.clip audio{width:100%;margin:6px 0}
.clip-task{margin:8px 0 0;font-size:15px}
.clip .credit{margin:8px 0 0;font-size:12px;color:var(--ink-2)}
`;
