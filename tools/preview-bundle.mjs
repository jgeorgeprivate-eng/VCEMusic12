// Builds a single-file preview (preview/upbeat-preview.html) for sharing as a claude.ai artifact. Not used by the real site.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const r = await build({ entryPoints: [join(root, 'js/app.js')], bundle: true, format: 'iife', write: false, minify: false, target: 'es2020' });
const js = r.outputFiles[0].text;
let css = readFileSync(join(root, 'css/app.css'), 'utf8');
for (const f of ['Fraunces', 'SourceSans3', 'Bravura']) {
  const b64 = readFileSync(join(root, 'fonts', f + '.woff2')).toString('base64');
  css = css.replace(`url("../fonts/${f}.woff2")`, `url("data:font/woff2;base64,${b64}")`);
}
const content = {};
for (const f of readdirSync(join(root, 'content/lessons'))) if (f.endsWith('.md')) content[f.replace('.md', '')] = readFileSync(join(root, 'content/lessons', f), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const bodyInner = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace('<script type="module" src="js/app.js"></script>', '');
const page = `<title>Upbeat</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n${css}\n</style>\n${bodyInner}\n<script>window.__noSW=true;window.__previewNoAudio=true;window.__inlineContent=${JSON.stringify(content)};window.__inlineClips=${readFileSync(join(root, "audio/clips.json"), "utf8")};</script>\n<script>\n${js}\n</script>\n`;
mkdirSync(join(root, '..', 'preview'), { recursive: true });
writeFileSync(join(root, '..', 'preview', 'upbeat-preview.html'), page);
console.log('preview written', (page.length / 1024 / 1024).toFixed(2), 'MB');
