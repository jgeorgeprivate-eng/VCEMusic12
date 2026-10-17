// Builds sw.js (the offline cache list) and version.json from the files in this folder.
// Run with: node tools/build.mjs    then commit the result. No other build step exists.
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const skip = new Set(['.git', 'node_modules', 'tools', 'sw.js', '.DS_Store', 'README.md', 'LICENSE', '.nojekyll']);
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p); else files.push('./' + relative(root, p).split('\\').join('/'));
  }
})(root);
files.sort();
const d = new Date();
// Stamped in Melbourne time so the version reads naturally on the phone and always rises from one build to the next.
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
const version = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
writeFileSync(join(root, 'version.json'), JSON.stringify({ version }) + '\n');
const tmpl = readFileSync(join(root, 'tools', 'sw.template.js'), 'utf8');
writeFileSync(join(root, 'sw.js'), tmpl.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files.filter(f => f !== './version.json'), null, 1)));
console.log(`sw.js written with ${files.length} files, version ${version}`);
