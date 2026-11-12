// Run this yourself, on your own computer:  node encrypt-key.mjs
// It asks for your Google Maps API key and an access code (both typed hidden), then writes street-snake-key.json.
// Commit and push that file. Nothing you type is printed, saved, or sent anywhere.
import { writeFileSync } from 'node:fs';
import readline from 'node:readline';
import { lockKey, unlockKey } from './street-snake-key.js';

function ask(prompt) {   // hidden input
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    let muted = false;
    rl._writeToOutput = s => { if (!muted) process.stdout.write(s); };
    rl.question(prompt, answer => { rl.close(); process.stdout.write('\n'); resolve(answer.trim()); });
    muted = true;
  });
}

const key = await ask('Google Maps API key: ');
if (key.length < 20) { console.error('That is too short to be an API key. Nothing written.'); process.exit(1); }
const code = await ask('Access code (use 4+ random words or 16+ characters): ');
if (code.length < 12) { console.error('Access code is too short: anyone could guess it. Nothing written.'); process.exit(1); }
if (code !== await ask('Type the access code again: ')) { console.error('The two codes differ. Nothing written.'); process.exit(1); }

const blob = await lockKey(key, code);
if (await unlockKey(blob, code) !== key) { console.error('Self-check failed. Nothing written.'); process.exit(1); }
writeFileSync('street-snake-key.json', JSON.stringify(blob));
console.log('\nWrote street-snake-key.json (self-check passed: the access code unlocks it).');
console.log('Next: commit and push street-snake-key.json. Share the access code only with people you trust.');
console.log('Also set the key\'s HTTP referrer restriction to https://isaacherbst.us/* and a daily quota cap in Google Cloud.');
