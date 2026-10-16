// Builds sw.js (the offline cache list) and version.json from the files in this folder.
// Run with: node tools/build.mjs    then commit the result. No other build step exists.
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const skip = new Set(['.git', 'node_modules', 'tools', 'sw.js', '.DS_Store', 'README.md', 'LICENSE']);
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
const version = d.toISOString().slice(0, 16).replace('T', ' ');
writeFileSync(join(root, 'version.json'), JSON.stringify({ version }) + '\n');
const tmpl = readFileSync(join(root, 'tools', 'sw.template.js'), 'utf8');
writeFileSync(join(root, 'sw.js'), tmpl.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files.filter(f => f !== './version.json'), null, 1)));
console.log(`sw.js written with ${files.length} files, version ${version}`);
