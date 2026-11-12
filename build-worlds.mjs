// Pre-bake the preset worlds into worlds/<id>.json. Usage: node build-worlds.mjs [--force] [id ...]
// Skips worlds that already exist (unless --force) and carries on past a failure, so it can simply be re-run.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PRESETS, fieldFor, queries, fetchOverpass, convert } from './street-snake-world.js';

mkdirSync('worlds', { recursive: true });
const args = process.argv.slice(2), force = args.includes('--force'), only = args.filter(a => !a.startsWith('--'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const failed = [];
for (const p of PRESETS) {
  if (only.length && !only.includes(p.id)) continue;
  if (!force && existsSync(`worlds/${p.id}.json`)) { console.log(p.id, 'already built'); continue; }
  try {
    const f = fieldFor(p.lat, p.lon), q = queries(f), opts = what => ({ tries: 10, onTry: i => i && console.log(p.id, what, 'retry', i) });
    const streets = await fetchOverpass(q.streets, opts('streets'));
    await sleep(5000);
    const scene = await fetchOverpass(q.scene, opts('scene'));
    const w = convert(streets, scene, f, p.name), json = JSON.stringify(w);
    writeFileSync(`worlds/${p.id}.json`, json);
    console.log(p.id, `${(json.length / 1024).toFixed(0)} KB`, `${w.w.length} ways, ${w.b.length} buildings, ${w.wt.length} water, ${w.t.length / 2} trees`);
  } catch (e) { console.log(p.id, 'FAILED:', e.message); failed.push(p.id); }
  await sleep(8000);
}
if (failed.length) { console.log('failed:', failed.join(', '), '- re-run to retry them'); process.exitCode = 1; }
