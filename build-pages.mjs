import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const output = resolve(root, 'dist-pages');
if (!output.startsWith(`${root}\\`) && !output.startsWith(`${root}/`)) throw new Error('invalid Pages output directory');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const assets = [
  'index.html', 'app.js', 'styles.css', 'live-crawlnet.css', 'console-polish.css', 'tardumo-terminal.css',
  'senmilo-theme.css', 'senmilo-logo.png', 'senmilo-logo-transparent.png', 'CNAME'
];
for (const asset of assets) cpSync(resolve(root, asset), resolve(output, asset));

const apiOrigin = String(process.env.CENNOMO_API_ORIGIN || '').trim().replace(/\/$/, '');
if (apiOrigin && !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(apiOrigin)) throw new Error('CENNOMO_API_ORIGIN must be an HTTPS origin without a path');
writeFileSync(resolve(output, 'runtime-config.js'), `window.CENNOMO_API_ORIGIN=${JSON.stringify(apiOrigin)};\n`);
writeFileSync(resolve(output, '.nojekyll'), '');
if (apiOrigin) {
  try {
    const [snapshotResponse, skillsResponse] = await Promise.all([
      fetch(`${apiOrigin}/api/snapshot`),
      fetch(`${apiOrigin}/api/v1/skills`)
    ]);
    if (!snapshotResponse.ok || !skillsResponse.ok) throw new Error('registry snapshot request failed');
    writeFileSync(resolve(output, 'snapshot.json'), await snapshotResponse.text());
    writeFileSync(resolve(output, 'skills.json'), await skillsResponse.text());
    console.log('Registry snapshot bundled for same-origin fallback');
  } catch (error) {
    console.warn(`Registry snapshot unavailable: ${error.message}`);
  }
}
console.log(`GitHub Pages bundle created at ${output}`);
console.log(`API origin: ${apiOrigin || 'NOT CONFIGURED'}`);
