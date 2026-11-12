// Street Snake worlds: preset locations, OpenStreetMap download, and conversion to the compact format the game reads.
// Used by the game page (custom addresses) and by the build script that pre-bakes the presets into worlds/*.json.
// Map data © OpenStreetMap contributors (ODbL).

export const W_M = 1530, H_M = 1330;   // playing field size in meters (east-west x north-south)

export const PRESETS = [
  { id: 'lakewood', name: 'Downtown Lakewood, NJ', lat: 40.097, lon: -74.217 },
  { id: 'manhattan', name: 'Midtown Manhattan, NYC', lat: 40.7549, lon: -73.9840 },
  { id: 'sf', name: 'Downtown San Francisco', lat: 37.7879, lon: -122.4075 },
  { id: 'chicago', name: 'The Loop, Chicago', lat: 41.8819, lon: -87.6278 },
  { id: 'paris', name: 'Le Marais, Paris', lat: 48.8566, lon: 2.3622 },
  { id: 'levittown', name: 'Levittown, PA (suburban maze)', lat: 40.1550, lon: -74.8480 },
];

export function fieldFor(lat, lon) {
  const dLat = H_M / 2 / 111195, dLon = W_M / 2 / (111195 * Math.cos(lat * Math.PI / 180));
  return { s: lat - dLat, w: lon - dLon, n: lat + dLat, e: lon + dLon };
}

// Local flat projection (meters, x east, y north) on the WGS84 ellipsoid, so streets line up with real-world 3D tiles.
export function makeProj(f) {
  const lat0 = (f.s + f.n) / 2, lon0 = (f.w + f.e) / 2, PHI = lat0 * Math.PI / 180;
  const KX = 111412.84 * Math.cos(PHI) - 93.5 * Math.cos(3 * PHI) + 0.118 * Math.cos(5 * PHI);
  const KY = 111132.954 - 559.822 * Math.cos(2 * PHI) + 1.175 * Math.cos(4 * PHI);
  return { lat0, lon0, PHI, KX, KY, toXY: ([lat, lon]) => [(lon - lon0) * KX, (lat - lat0) * KY] };
}

export function queries(f) {
  const bb = `${f.s},${f.w},${f.n},${f.e}`, pad = 0.0014, pb = `${f.s - pad},${f.w - pad * 1.3},${f.n + pad},${f.e + pad * 1.3}`;
  return {
    streets: `[out:json][timeout:90];way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street)$"](${bb});out body;>;out skel qt;`,
    scene: `[out:json][timeout:90];(way["building"](${pb});way["natural"="water"](${pb});relation["natural"="water"](${pb});node["natural"="tree"](${pb}););out geom;`,
  };
}

// overpass-api.de is the one that answers reliably, so retries go back to it; the other two (often down) are the last resort.
const MAIN = 'https://overpass-api.de/api/interpreter';
const MIRRORS = [MAIN, MAIN, MAIN, MAIN, 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function fetchOverpass(query, { tries = 6, onTry } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      onTry?.(i);
      const headers = typeof window === 'undefined' ? { 'User-Agent': 'street-snake-world-builder/1.0 (github.com/isaacherbst613)', Accept: '*/*' } : {};   // browsers add their own
      const res = await fetch(MIRRORS[i % MIRRORS.length], { method: 'POST', headers, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error('Overpass ' + res.status);
      const j = await res.json();
      if (!j.elements) throw new Error('Overpass returned no data');
      return j;
    } catch (e) { last = e; await sleep(2500 + i * 2500); }
  }
  throw last;
}

// Join open way segments of a multipolygon into closed rings.
function stitch(segs) {
  segs = segs.filter(s => s.length > 1).map(s => s.slice());
  const same = (a, b) => a[0] === b[0] && a[1] === b[1], rings = [];
  while (segs.length) {
    let cur = segs.pop();
    while (!same(cur[0], cur.at(-1))) {
      const i = segs.findIndex(s => same(s[0], cur.at(-1)) || same(s.at(-1), cur.at(-1)));
      if (i < 0) break;
      const s = segs.splice(i, 1)[0];
      cur = same(s[0], cur.at(-1)) ? cur.concat(s.slice(1)) : cur.concat(s.slice(0, -1).reverse());
    }
    if (same(cur[0], cur.at(-1))) { cur.pop(); if (cur.length > 2) rings.push(cur); }
  }
  return rings;
}

// Raw Overpass results -> compact world. Polygon coordinates are integers in 0.1 m units in the local frame.
export function convert(streetsJson, sceneJson, f, name) {
  const { toXY } = makeProj(f);
  const coords = new Map(), ways = [];
  for (const e of streetsJson.elements) { if (e.type === 'node') coords.set(e.id, [e.lat, e.lon]); else if (e.type === 'way') ways.push(e.nodes); }
  const ids = new Map(), n = [], w = [];
  for (const way of ways) {
    const out = [];
    for (const id of way) {
      if (!coords.has(id)) continue;
      if (!ids.has(id)) { ids.set(id, n.length); const [la, lo] = coords.get(id); n.push([+la.toFixed(6), +lo.toFixed(6)]); }
      out.push(ids.get(id));
    }
    if (out.length > 1) w.push(out);
  }
  const xy = g => { const [x, y] = toXY([g.lat, g.lon]); return [Math.round(x * 10), Math.round(y * 10)]; };
  const ring = geom => { const p = geom.map(xy); if (p.length > 1 && p[0][0] === p.at(-1)[0] && p[0][1] === p.at(-1)[1]) p.pop(); return p; };
  const b = [], wt = [], t = [];
  for (const e of sceneJson.elements) {
    const tags = e.tags || {};
    if (e.type === 'node' && tags.natural === 'tree') t.push(...xy(e));
    else if (e.type === 'way' && tags.building && e.geometry) {
      const r = ring(e.geometry);
      if (r.length < 3) continue;
      const lv = parseInt(tags['building:levels']), h = parseFloat(tags.height);
      const floors = Math.min(80, lv > 0 ? lv : h > 0 ? Math.max(1, Math.round(h / 3.2)) : 0);
      b.push([floors, ...r.flat()]);
    } else if (e.type === 'way' && tags.natural === 'water' && e.geometry) {
      const r = ring(e.geometry); if (r.length > 2) wt.push(r.flat());
    } else if (e.type === 'relation' && tags.natural === 'water') {
      const segs = (e.members || []).filter(m => m.role !== 'inner' && m.geometry).map(m => m.geometry.map(xy));
      for (const r of stitch(segs)) wt.push(r.flat());
    }
  }
  return { name, field: f, n, w, b, wt, t };
}

export async function loadPreset(id) {
  const res = await fetch(`worlds/${id}.json`);
  if (!res.ok) throw new Error('missing world ' + id);
  return res.json();
}

// Any place: look the address up (OpenStreetMap Nominatim; one request per search, only when the user submits),
// then download its streets and buildings. Exact house numbers work where OpenStreetMap has them.
function shortName(r) {
  const a = r.address || {}, road = [a.house_number, a.road].filter(Boolean).join(' ');
  const town = a.city || a.town || a.village || a.hamlet || a.suburb || a.county;
  const head = r.name && r.name !== a.road && r.name !== a.house_number ? r.name : '';
  const parts = [head, road, a.suburb, town, a.state, (a.country_code || '').toUpperCase()].filter(Boolean);
  return parts.filter((p, i) => parts.indexOf(p) === i).join(', ') || r.display_name.split(',').slice(0, 3).join(',').trim();
}
const sleep2 = ms => new Promise(r => setTimeout(r, ms));
async function nominatim(q) {
  const headers = typeof window === 'undefined' ? { 'User-Agent': 'street-snake-world-builder/1.0 (github.com/isaacherbst613)' } : {};   // browsers add their own
  let res;
  try { res = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=' + encodeURIComponent(q), { headers, signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error('Address search is not responding. Check your connection and try again.'); }
  if (!res.ok) throw new Error('Address search is busy. Try again in a moment.');
  const seen = new Set(), out = [];
  for (const r of await res.json()) {
    const k = (+r.lat).toFixed(3) + ',' + (+r.lon).toFixed(3);          // same spot (within ~100 m): keep the first
    if (seen.has(k)) continue;
    seen.add(k); out.push({ lat: +r.lat, lon: +r.lon, name: shortName(r) });
    if (out.length === 5) break;
  }
  return out;
}

// People type addresses loosely ("17ave", a wrong ZIP, no punctuation), and the search is literal. So: try the query as typed,
// then a cleaned-up version, then looser ones. A looser match comes back with a note so the visitor can confirm it.
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const STREET = 'ave|av|avenue|st|street|rd|road|blvd|boulevard|dr|drive|ln|lane|pl|place|ct|court|pkwy|parkway|hwy|highway|way|ter|terrace';
export const cleanQuery = q => q.replace(/\s+/g, ' ').trim()
  .replace(new RegExp(String.raw`\b(\d+)(?:st|nd|rd|th)?\s*(${STREET})\b\.?`, 'gi'), (m, n, w) => ordinal(+n) + ' ' + w);   // "17ave" -> "17th ave"
const noZip = q => q.replace(/[\s,]+\d{5}(?:-\d{4})?$/, '');
const streetOnly = q => q.replace(/^\d+[a-z]?\s+(?=\D)/i, '');
export function queryVariants(q) {
  const c = cleanQuery(q), z = noZip(c), s = streetOnly(z);
  return [[q, ''], [c, ''], [z, 'No match with that ZIP code, so here are results without it.'],
          [s, 'Could not find that exact house number, so here are matches for the street.']]
    .filter(([v], i, a) => v.length > 3 && a.findIndex(x => x[0].toLowerCase() === v.toLowerCase()) === i);
}
export async function searchPlaces(q) {
  const variants = queryVariants(q);
  for (let i = 0; i < variants.length; i++) {
    if (i) await sleep2(1100);                                            // be polite: at most one request a second
    const found = await nominatim(variants[i][0]);
    if (found.length) { if (variants[i][1]) found.note = variants[i][1]; return found; }
  }
  throw new Error(`No place found for "${q}". Check the spelling, or write it like "5001 17th Ave, Brooklyn NY".`);
}
export async function loadCustom({ lat, lon, name }, onStatus) {
  const f = fieldFor(lat, lon), q = queries(f);
  const retry = what => ({ onTry: i => onStatus?.(i ? `Map server is busy, retrying (${i + 1}/6)… ${what}` : what) });
  // streets and buildings are requested at the same time (about twice as fast as one after the other)
  const [streets, scene] = await Promise.all([
    fetchOverpass(q.streets, retry('Downloading streets and buildings…')),
    fetchOverpass(q.scene, retry('Downloading streets and buildings…')),
  ]);
  if (!streets.elements.some(e => e.type === 'way')) throw new Error('No drivable streets found there');
  return convert(streets, scene, f, name);
}
