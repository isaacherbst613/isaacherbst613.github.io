// Lock / unlock a Google Maps API key with an access code (PBKDF2 -> AES-GCM, via the browser's / Node's built-in WebCrypto).
// The page ships only the scrambled text in street-snake-key.json; the key itself never appears in the site's files.
// Honest limits: someone who knows the code can still read the key out of their own browser, and a short or guessable
// code can be brute-forced offline. Pair this with the key's HTTP-referrer + API restrictions and a daily quota cap.

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u => btoa(String.fromCharCode(...u));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const ITER = 600000;   // slow on purpose: makes every guess of the code expensive

async function derive(code, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function lockKey(apiKey, code) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await derive(code, salt, ITER), enc.encode(apiKey));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

export async function unlockKey(blob, code) {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, await derive(code, unb64(blob.salt), blob.iter), unb64(blob.ct));
    return dec.decode(pt);
  } catch { throw new Error('Wrong access code'); }   // AES-GCM fails the integrity check when the code is wrong
}
