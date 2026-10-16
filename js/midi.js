// midi.js — writes a Standard MIDI File (type 1) from simple track data, for taking a composition into notation software.

function vlq(n) { const bytes = [n & 0x7f]; n >>= 7; while (n > 0) { bytes.unshift((n & 0x7f) | 0x80); n >>= 7; } return bytes; }
function str(s) { return [...s].map(c => c.charCodeAt(0)); }
function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
function u16(n) { return [(n >>> 8) & 255, n & 255]; }

/**
 * tracks: [{ name, program (GM instrument number), notes: [{ start (ticks), dur (ticks), midi, vel }] }]
 * ticksPerBeat: 48 matches the app's duration units (48 = crotchet).
 */
export function writeMidi(tracks, { bpm = 100, ticksPerBeat = 48, timeSig = [4, 4] } = {}) {
  const out = [];
  const nTracks = tracks.length + 1;
  out.push(...str('MThd'), ...u32(6), ...u16(1), ...u16(nTracks), ...u16(ticksPerBeat));
  // tempo track
  const tempo = Math.round(60000000 / bpm);
  const t0 = [0, 0xFF, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255,
    0, 0xFF, 0x58, 4, timeSig[0], Math.log2(timeSig[1]), 24, 8,
    0, 0xFF, 0x2F, 0];
  out.push(...str('MTrk'), ...u32(t0.length), ...t0);
  tracks.forEach((tr, ch) => {
    const ev = [];
    tr.notes.forEach(n => { ev.push({ t: n.start, bytes: [0x90 | ch, n.midi, n.vel ?? 90] }); ev.push({ t: n.start + n.dur, bytes: [0x80 | ch, n.midi, 0] }); });
    ev.sort((a, b) => a.t - b.t || (a.bytes[0] & 0xF0) - (b.bytes[0] & 0xF0));
    const body = [0, 0xFF, 0x03, tr.name.length, ...str(tr.name), 0, 0xC0 | ch, tr.program ?? 0];
    let last = 0;
    ev.forEach(e => { body.push(...vlq(e.t - last), ...e.bytes); last = e.t; });
    body.push(0, 0xFF, 0x2F, 0);
    out.push(...str('MTrk'), ...u32(body.length), ...body);
  });
  return new Uint8Array(out);
}

export function download(bytes, filename, type = 'audio/midi') {
  const blob = new Blob([bytes], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** Render an SVG string to a PNG and download it. */
export async function svgToPng(svgMarkup, filename, scale = 2) {
  const cs = getComputedStyle(document.documentElement);
  // bake theme colours into the SVG so the PNG is readable anywhere
  const ink = cs.getPropertyValue('--ink').trim() || '#221F1B', paper = cs.getPropertyValue('--paper').trim() || '#FAF6EC';
  let svg = svgMarkup.replace(/var\(--ink\)/g, ink).replace(/var\(--lang\)/g, ink).replace(/var\(--ink-2\)/g, ink).replace(/var\(--body\)/g, 'Arial, sans-serif');
  // the Bravura font must be embedded for the PNG to show glyphs; fetch it and inline as a data URL
  let fontCss = '';
  try { const r = await fetch('fonts/Bravura.woff2'); const b = await r.blob(); const dataUrl = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); fontCss = `@font-face{font-family:"Bravura";src:url("${dataUrl}") format("woff2")}`; } catch (e) { console.warn('font not embedded', e); }
  const m = svg.match(/viewBox="([^"]+)"/); const [, , w, h] = (m ? m[1] : '0 0 600 160').split(' ').map(Number);
  svg = svg.replace('<svg ', `<svg width="${w}" height="${h}" `).replace(/<svg([^>]*)>/, `<svg$1><style>${fontCss}.gl{font-family:"Bravura";font-size:40px;fill:${ink}}.ln{stroke:${ink};stroke-width:1.1}.bar{stroke-width:1.4}.barfill,.beam{fill:${ink}}.stem{stroke:${ink};stroke-width:1.2}.tie,.hairpin{fill:none;stroke:${ink};stroke-width:1.4}.lbl,.txt{font-family:Arial,sans-serif;font-size:12px;fill:${ink}}</style><rect width="100%" height="100%" fill="${paper}"/>`);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
  const x = c.getContext('2d'); x.scale(scale, scale); x.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  await new Promise(res => c.toBlob(b => { download(b, filename, 'image/png'); res(); }, 'image/png'));
}
