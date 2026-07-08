/* SUNDER — the sky broke at sundown. fly the seam.
   Two mirrored mountain ranges — one below, one hanging overhead.
   Click to flip gravity. Fully procedural: no textures, models, or audio files. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.min.js';

/* ---------------------------------------------------------------- utils */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Deterministic 2D simplex noise (seeded, so the world is stable) */
const noise2 = (() => {
    const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    let s = 20260707;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    return (xin, yin) => {
        let n0 = 0, n1 = 0, n2 = 0;
        const sk = (xin + yin) * F2;
        const i = Math.floor(xin + sk), j = Math.floor(yin + sk);
        const t = (i + j) * G2;
        const x0 = xin - (i - t), y0 = yin - (j - t);
        const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 > 0) { const g = grad[p[ii + p[jj]] & 7]; t0 *= t0; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 > 0) { const g = grad[p[ii + i1 + p[jj + j1]] & 7]; t1 *= t1; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 > 0) { const g = grad[p[ii + 1 + p[jj + 1]] & 7]; t2 *= t2; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }
        return 70 * (n0 + n1 + n2);
    };
})();

function softDot(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [t, col] of stops) grd.addColorStop(t, col);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/* ---------------------------------------------------------------- world shape */

const CORRIDOR_HALF = 72;
const CEIL_TOP = 114;                       // where the upper world hinges

function corridorX(z) {
    return noise2(z * 0.0009, 93.7) * 90 + noise2(z * 0.0032, 41.2) * 20;
}

function ridgeField(x, z) {
    const ridged = 1 - Math.abs(noise2(x * 0.0016, z * 0.0016));
    let h = ridged * ridged * 92;
    h += noise2(x * 0.006, z * 0.006) * 17;
    h += noise2(x * 0.024, z * 0.024) * 3.2;
    const d = (x - corridorX(z)) / CORRIDOR_HALF;
    const trench = Math.exp(-d * d);
    return h * (1 - 0.93 * trench) - trench * 6;
}

const floorH = (x, z) => ridgeField(x, z);
const ceilY = (x, z) => CEIL_TOP - ridgeField(x + 7777, z - 3333);

/* ---------------------------------------------------------------- renderer / scene */

const canvas = document.getElementById('scene');
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
    document.getElementById('nogl').classList.add('show');
    throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
const HORIZON = new THREE.Color(0xff8a55);
scene.fog = new THREE.Fog(HORIZON, 120, 660);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 4000);

const SUN_DIR = new THREE.Vector3(0.05, 0.09, -1).normalize();   // dead ahead, in the seam
/* the *light* comes from higher up than the visible disc, and warm bounce
   fills the ceiling world from below via the hemisphere ground color */
const LIGHT_DIR = new THREE.Vector3(0.35, 0.55, -0.75).normalize();

const hemi = new THREE.HemisphereLight(0x7a5ae0, 0xc05a2a, 1.6);
scene.add(hemi);
scene.add(new THREE.AmbientLight(0x40265a, 0.4));
const sun = new THREE.DirectionalLight(0xffb070, 2.4);
scene.add(sun, sun.target);
/* the sunset in the seam also lights the ceiling world from below */
const UPLIGHT_DIR = new THREE.Vector3(0.1, -0.6, -0.8).normalize();
const seamGlow = new THREE.DirectionalLight(0xff7a3d, 1.0);
scene.add(seamGlow, seamGlow.target);
/* rose fill from behind the camera so the slopes we actually see keep their color */
const BACKFILL_DIR = new THREE.Vector3(-0.2, 0.55, 1).normalize();
const backFill = new THREE.DirectionalLight(0xd86a9a, 1.1);
scene.add(backFill, backFill.target);

/* ---------------------------------------------------------------- sky */

const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 32, 16),
    new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
            uTop: { value: new THREE.Color(0x1b0f3d) },
            uMid: { value: new THREE.Color(0x8a3a72) },
            uHor: { value: HORIZON.clone() },
            uSunCol: { value: new THREE.Color(0xffdfae) },
            uSunDir: { value: SUN_DIR },
            uTime: { value: 0 },
        },
        vertexShader: /* glsl */`
            varying vec3 vDir;
            void main() {
                vDir = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */`
            varying vec3 vDir;
            uniform vec3 uTop, uMid, uHor, uSunCol, uSunDir;
            uniform float uTime;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            void main() {
                vec3 d = normalize(vDir);
                float h = abs(d.y);   /* the sky itself is folded — mirrored above and below */
                vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.20, h));
                col = mix(col, uTop, smoothstep(0.14, 0.58, h));
                float sd = max(dot(d, uSunDir), 0.0);
                col += uSunCol * pow(sd, 260.0) * 1.5;    /* disc */
                col += uSunCol * pow(sd, 22.0) * 0.45;    /* halo */
                col += vec3(1.0, 0.45, 0.22) * pow(sd, 4.0) * 0.2;
                float band = smoothstep(0.24, 0.65, h);
                if (band > 0.0) {
                    vec2 sp = vec2(atan(d.z, d.x) * 24.0, d.y * 90.0);
                    float s = hash(floor(sp));
                    float tw = 0.55 + 0.45 * sin(uTime * 2.2 + s * 90.0);
                    col += vec3(1.0, 0.92, 0.82) * step(0.991, s) * tw * band * 0.85;
                }
                gl_FragColor = vec4(col, 1.0);
            }`,
    })
);
scene.add(sky);

/* ---------------------------------------------------------------- terrain: two folded worlds */

const CHUNK_W = 1000, CHUNK_D = 130, SEG_X = 100, SEG_Z = 16, NUM_CHUNKS = 11;

const tmpC = new THREE.Color();
const fLow = new THREE.Color(0x221040), fMid = new THREE.Color(0x8c3a56), fHigh = new THREE.Color(0xffb887);
const cLow = new THREE.Color(0x140a30), cMid = new THREE.Color(0x5a2a6e), cHigh = new THREE.Color(0xff9a63);

const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 1, metalness: 0,
});

const chunks = [];
function buildChunk(mesh, centerZ) {
    mesh.position.z = centerZ;
    const up = mesh.userData.isCeiling;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i);
        const wz = pos.getZ(i) + centerZ;
        const field = up ? ridgeField(wx + 7777, wz - 3333) : ridgeField(wx, wz);
        pos.setY(i, up ? CEIL_TOP - field : field);
        const t = clamp(field / 95, 0, 1);
        if (up) {
            tmpC.copy(cLow).lerp(cMid, THREE.MathUtils.smoothstep(t, 0.10, 0.58));
            tmpC.lerp(cHigh, THREE.MathUtils.smoothstep(t, 0.60, 0.97));
        } else {
            tmpC.copy(fLow).lerp(fMid, THREE.MathUtils.smoothstep(t, 0.10, 0.58));
            tmpC.lerp(fHigh, THREE.MathUtils.smoothstep(t, 0.62, 0.97));
        }
        const v = 1 + noise2(wx * 0.05, wz * 0.05) * 0.07;
        col.setXYZ(i, tmpC.r * v, tmpC.g * v, tmpC.b * v);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeBoundingSphere();
}

for (const isCeiling of [false, true]) {
    for (let i = 0; i < NUM_CHUNKS; i++) {
        const geo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_D, SEG_X, SEG_Z);
        /* floor faces up, ceiling faces down — real normals, correct lighting */
        geo.rotateX(isCeiling ? Math.PI / 2 : -Math.PI / 2);
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
        const mesh = new THREE.Mesh(geo, terrainMat);
        mesh.userData.isCeiling = isCeiling;
        buildChunk(mesh, 90 - i * CHUNK_D);
        scene.add(mesh);
        chunks.push(mesh);
    }
}

/* ---------------------------------------------------------------- obsidian shards */

const SHARD_N = 14;
const shardMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(3, 0),
    new THREE.MeshStandardMaterial({
        color: 0x1c1236, roughness: 0.18, metalness: 0.7,
        emissive: 0x7a2fb8, emissiveIntensity: 0.35, flatShading: true,
    }),
    SHARD_N
);
shardMesh.frustumCulled = false;
scene.add(shardMesh);
const shards = [];
for (let i = 0; i < SHARD_N; i++) {
    shards.push({ x: 0, y: 1e5, z: 1e5, spin: Math.random() * 9, rate: 0.4 + Math.random() * 0.9, active: false });
}
let nextShardZ = -500;

function spawnShard(z) {
    const s = shards.find(s => !s.active);
    if (!s) return;
    s.z = z;
    s.x = corridorX(z) + (Math.random() - 0.5) * 50;
    const lo = floorH(s.x, z) + 14, hi = ceilY(s.x, z) - 14;
    s.y = lerp(lo, hi, Math.random());
    s.active = true;
}

/* ---------------------------------------------------------------- glider */

const glider = new THREE.Group();
{
    const V = [
        [0, 0, -3.4], [-3.1, 0.5, 2.5], [0, 0.42, 2.1], [3.1, 0.5, 2.5], [0, -0.95, 1.7],
    ];
    const tris = [[0, 1, 2], [0, 2, 3], [0, 2, 4], [0, 4, 2]];
    const arr = new Float32Array(tris.flat().flatMap(i => V[i]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    geo.computeVertexNormals();
    glider.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0xffedd8, flatShading: true, roughness: 0.55, metalness: 0,
        emissive: 0xff7a3d, emissiveIntensity: 0.22, side: THREE.DoubleSide,
    })));
    const lamp = new THREE.PointLight(0xffa050, 14, 46, 1.8);
    lamp.position.set(0, 0.6, 0);
    glider.add(lamp);
}
scene.add(glider);

/* trail ribbon */
const TRAIL_N = 56;
const trailGeo = new THREE.BufferGeometry();
{
    const idx = [];
    for (let i = 0; i < TRAIL_N - 1; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    trailGeo.setIndex(idx);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 2 * 3), 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 2 * 3), 3));
}
const trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({
    vertexColors: true, blending: THREE.AdditiveBlending, transparent: true,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
}));
trail.frustumCulled = false;
scene.add(trail);
const trailPts = [];

function updateTrail() {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(glider.quaternion);
    trailPts.push({ p: glider.position.clone(), r: right });
    if (trailPts.length > TRAIL_N) trailPts.shift();
    const pos = trailGeo.attributes.position, col = trailGeo.attributes.color;
    const n = trailPts.length;
    for (let i = 0; i < TRAIL_N; i++) {
        const k = Math.min(i, n - 1);
        const t = n > 1 ? k / (n - 1) : 0;
        const { p, r } = trailPts[k];
        const w = 0.04 + 0.3 * t;
        pos.setXYZ(i * 2, p.x - r.x * w, p.y - r.y * w, p.z - r.z * w);
        pos.setXYZ(i * 2 + 1, p.x + r.x * w, p.y + r.y * w, p.z + r.z * w);
        const f = t * t * 0.38;
        col.setXYZ(i * 2, f, f * 0.5, f * 0.24);
        col.setXYZ(i * 2 + 1, f, f * 0.5, f * 0.24);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
}

/* ---------------------------------------------------------------- embers */

const EMBER_N = 56;
const embers = [];
const emberMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
        color: 0xffc060, emissive: 0xff9030, emissiveIntensity: 2.4, roughness: 0.4,
    }),
    EMBER_N
);
emberMesh.frustumCulled = false;
scene.add(emberMesh);

const glowGeo = new THREE.BufferGeometry();
glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBER_N * 3), 3));
const glowPts = new THREE.Points(glowGeo, new THREE.PointsMaterial({
    map: softDot(64, [[0, 'rgba(255,190,110,0.85)'], [0.4, 'rgba(255,120,50,0.28)'], [1, 'rgba(255,120,50,0)']]),
    size: 10, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
glowPts.frustumCulled = false;
scene.add(glowPts);

for (let i = 0; i < EMBER_N; i++) embers.push({ x: 0, y: 1e5, z: 1e5, active: false });

function syncEmber(i) {
    const e = embers[i];
    glowGeo.attributes.position.setXYZ(i, e.x, e.y, e.z);
    glowGeo.attributes.position.needsUpdate = true;
}

let nextStringZ = -140;

function spawnString(z0) {
    const free = [];
    for (let i = 0; i < EMBER_N && free.length < 9; i++) if (!embers[i].active) free.push(i);
    if (free.length < 6) return;
    const kind = Math.random();     // <.36 floor skim | <.72 ceiling skim | else cross-gap arc
    const n = 6 + ((Math.random() * 3) | 0);
    const drift = (Math.random() - 0.5) * 36;
    const rising = Math.random() < 0.5;
    for (let k = 0; k < Math.min(n, free.length); k++) {
        const e = embers[free[k]];
        const z = z0 - k * 13;
        const x = corridorX(z) + drift;
        const lo = floorH(x, z), hi = ceilY(x, z);
        const t = k / (n - 1);
        let y;
        if (kind < 0.36) y = lo + 4.5;
        else if (kind < 0.72) y = hi - 4.5;
        else y = lerp(lo + 6, hi - 6, rising ? t : 1 - t);   // a stitch across the seam
        e.x = x; e.y = y; e.z = z; e.active = true;
        syncEmber(free[k]);
    }
}

/* ---------------------------------------------------------------- sparks */

const SPARK_N = 240;
const sparkPos = new Float32Array(SPARK_N * 3);
const sparkVel = new Float32Array(SPARK_N * 3);
const sparkLife = new Float32Array(SPARK_N);
sparkPos.fill(1e5);
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    map: softDot(32, [[0, 'rgba(255,220,150,1)'], [1, 'rgba(255,140,60,0)']]),
    size: 1.7, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    color: 0xffc880,
}));
sparks.frustumCulled = false;
scene.add(sparks);
let sparkCursor = 0;

function burst(x, y, z, n, spread, up) {
    for (let k = 0; k < n; k++) {
        const i = sparkCursor = (sparkCursor + 1) % SPARK_N;
        sparkPos[i * 3] = x; sparkPos[i * 3 + 1] = y; sparkPos[i * 3 + 2] = z;
        sparkVel[i * 3] = (Math.random() - 0.5) * spread;
        sparkVel[i * 3 + 1] = Math.random() * up + 2;
        sparkVel[i * 3 + 2] = (Math.random() - 0.5) * spread;
        sparkLife[i] = 0.5 + Math.random() * 0.6;
    }
}

function updateSparks(dt) {
    for (let i = 0; i < SPARK_N; i++) {
        if (sparkLife[i] <= 0) continue;
        sparkLife[i] -= dt;
        sparkVel[i * 3 + 1] -= 26 * dt;
        sparkPos[i * 3] += sparkVel[i * 3] * dt;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
        if (sparkLife[i] <= 0) sparkPos[i * 3 + 1] = 1e5;
    }
    sparkGeo.attributes.position.needsUpdate = true;
}

/* ---------------------------------------------------------------- audio (synth, no files) */

const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const audio = {
    ctx: null, master: null, windGain: null, windFilter: null,
    muted: localStorage.getItem('sunder-muted') === '1',
    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 420;
        this.windFilter.Q.value = 0.6;
        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0;
        src.connect(this.windFilter).connect(this.windGain).connect(this.master);
        src.start();
    },
    wind(v, f) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        this.windGain.gain.setTargetAtTime(v, t, 0.25);
        this.windFilter.frequency.setTargetAtTime(f, t, 0.25);
    },
    whoosh() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        this.windGain.gain.cancelScheduledValues(t);
        this.windGain.gain.setValueAtTime(0.42, t);
        this.windFilter.frequency.cancelScheduledValues(t);
        this.windFilter.frequency.setValueAtTime(220, t);
        this.windFilter.frequency.exponentialRampToValueAtTime(1200, t + 0.28);
    },
    chime(step) {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const f = SCALE[Math.min(step, SCALE.length - 1)];
        for (const [freq, vol] of [[f, 0.16], [f * 2, 0.05]]) {
            const o = this.ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
            o.connect(g).connect(this.master);
            o.start(t); o.stop(t + 0.6);
        }
    },
    crash() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g).connect(this.master);
        o.start(t); o.stop(t + 0.65);
        this.windGain.gain.cancelScheduledValues(t);
        this.windGain.gain.setValueAtTime(0.5, t);
        this.windGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    },
    toggle() {
        this.muted = !this.muted;
        localStorage.setItem('sunder-muted', this.muted ? '1' : '0');
        if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
        return this.muted;
    },
};

/* ---------------------------------------------------------------- game state */

const $ = id => document.getElementById(id);
const scoreEl = $('score'), bestEl = $('best'), multEl = $('mult'),
    titleO = $('titleO'), deathO = $('deathO'), finalScore = $('finalScore'),
    deathLine = $('deathLine'), vignette = $('vignette'), muteBtn = $('muteBtn'),
    titleBest = $('titleBest');

/* ?scenic — hide the UI and just drift down the seam (also handy for screenshots) */
if (new URLSearchParams(location.search).has('scenic')) {
    titleO.classList.add('hidden');
    document.querySelector('.hud').style.display = 'none';
}

let best = +(localStorage.getItem('sunder-best') || 0);
const fmt = n => Math.floor(n).toLocaleString('en-US');
bestEl.textContent = 'best ' + fmt(best);
if (best > 0) titleBest.textContent = 'your best: ' + fmt(best);
if (audio.muted) muteBtn.textContent = '🔇';

const player = {
    pos: new THREE.Vector3(corridorX(0), 30, 0),
    vx: 0, vy: 0, speed: 24, startZ: 0,
    grav: 1,                 // 1 = falling toward the floor world, -1 = toward the ceiling world
};
let state = 'title';         // title | run | dead
let score = 0, chain = 0, chainTimer = 0, mult = 1;
let skimming = false, skimEmit = 0, deathT = 0, timeScale = 1, shake = 0;
let rollA = 0, rollTarget = 0;   // camera barrel-roll through the flip
let elapsed = 0;
let steerX = 0;                  // -1..1

function setMult(m) {
    if (m === mult) return;
    mult = m;
    multEl.textContent = '×' + m;
    multEl.classList.toggle('on', m > 1);
    multEl.classList.remove('pop');
    void multEl.offsetWidth;
    multEl.classList.add('pop');
}

function flip() {
    if (state !== 'run') return;
    player.grav *= -1;
    player.vy = player.vy * 0.3 - player.grav * 11;
    rollTarget = player.grav === 1 ? 0 : Math.PI;
    audio.whoosh();
    burst(player.pos.x, player.pos.y, player.pos.z, 10, 12, 10);
}

function startRun() {
    state = 'run';
    score = 0; chain = 0; chainTimer = 0; setMult(1);
    player.startZ = player.pos.z;
    titleO.classList.add('hidden');
    deathO.classList.add('hidden');
    document.body.classList.add('playing');
    audio.init();
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
}

function die() {
    state = 'dead';
    deathT = 0;
    shake = RM ? 0 : 1;
    chain = 0; setMult(1);
    burst(player.pos.x, player.pos.y, player.pos.z, 70, 34, 26);
    glider.visible = false;
    trail.visible = false;
    audio.crash();
    const isBest = score > best;
    if (isBest) {
        best = score;
        localStorage.setItem('sunder-best', String(Math.floor(best)));
        bestEl.textContent = 'best ' + fmt(best);
    }
    deathLine.textContent = isBest && best > 500
        ? 'new best. both worlds noticed.'
        : (player.grav === -1 ? 'folded into the sky.' : 'folded into the mountain.');
    finalScore.textContent = fmt(score);
    setTimeout(() => { if (state === 'dead') deathO.classList.remove('hidden'); }, 750);
}

function respawn() {
    const z = player.pos.z - 40;
    const cx = corridorX(z);
    player.pos.set(cx, lerp(floorH(cx, z), ceilY(cx, z), 0.45), z);
    player.vx = player.vy = 0;
    player.grav = 1;
    rollA = rollTarget = 0;
    trailPts.length = 0;
    glider.visible = true;
    trail.visible = true;
    startRun();
}

/* ---------------------------------------------------------------- input */

/* mouse: move to steer, click to flip (instant).
   touch: drag to steer (relative), quick tap to flip. */
let touchStart = null;

addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') {
        steerX = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
    } else if (touchStart) {
        steerX = clamp(touchStart.steer + (e.clientX - touchStart.x) / (innerWidth * 0.28), -1, 1);
        if (Math.abs(e.clientX - touchStart.x) > 14) touchStart.moved = true;
    }
}, { passive: true });

addEventListener('pointerdown', e => {
    if (e.target.closest('a, button')) return;
    if (state === 'title') { startRun(); return; }
    if (state === 'dead') { if (deathT > 0.8) respawn(); return; }
    if (e.pointerType === 'mouse') {
        steerX = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
        flip();
    } else {
        touchStart = { x: e.clientX, t: performance.now(), steer: steerX, moved: false };
    }
});

addEventListener('pointerup', e => {
    if (e.pointerType !== 'mouse' && touchStart) {
        if (!touchStart.moved && performance.now() - touchStart.t < 260) flip();
        touchStart = null;
    }
});
addEventListener('pointercancel', () => { touchStart = null; });

addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (state === 'title') startRun();
        else if (state === 'dead') { if (deathT > 0.8) respawn(); }
        else flip();
    }
    if (e.code === 'KeyM') muteBtn.click();
});
addEventListener('keyup', () => {});

muteBtn.addEventListener('click', () => {
    audio.init();
    muteBtn.textContent = audio.toggle() ? '🔇' : '🔊';
});

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

/* ---------------------------------------------------------------- main loop */

const camPos = new THREE.Vector3().copy(player.pos).add(new THREE.Vector3(0, 8, 20));
const lookAt = new THREE.Vector3();
const m4 = new THREE.Matrix4();
const eul = new THREE.Euler();
const qt = new THREE.Quaternion();
let last = performance.now();

function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    sky.material.uniforms.uTime.value = elapsed;

    if (state === 'dead') {
        deathT += dt;
        timeScale = damp(timeScale, 0.12, 4, dt);
    } else {
        timeScale = damp(timeScale, 1, 6, dt);
    }
    const sdt = dt * timeScale;

    /* ---- flight ---- */
    const p = player.pos;
    if (state === 'run' || state === 'title') {
        const dist = player.startZ - p.z;
        player.speed = state === 'title' ? 16 : 29 + Math.min(36, dist * 0.0026);
        p.z -= player.speed * sdt;

        const lo = floorH(p.x, p.z), hi = ceilY(p.x, p.z);

        if (state === 'title') {
            /* autopilot drifting down the seam */
            const tx = corridorX(p.z - 60);
            player.vx = damp(player.vx, (tx - p.x) * 1.2, 2, sdt);
            const ty = lerp(lo, hi, 0.5) + Math.sin(elapsed * 0.7) * 6;
            player.vy = damp(player.vy, (ty - p.y) * 1.5, 2, sdt);
        } else {
            const steer = steerX * (52 + player.speed * 0.38);
            player.vx = damp(player.vx, steer, 4.5, sdt);
            player.vy = clamp(player.vy - player.grav * 33 * sdt, -42, 42);
        }
        p.x += player.vx * sdt;
        p.y += player.vy * sdt;

        if (state === 'run') {
            /* collision with either world (plus a half-step lookahead) */
            const loA = floorH(p.x + player.vx * 0.06, p.z - player.speed * 0.06);
            const hiA = ceilY(p.x + player.vx * 0.06, p.z - player.speed * 0.06);
            const yA = p.y + player.vy * 0.06;
            if (p.y < lo + 0.9 || p.y > hi - 0.9 || yA < loA + 0.9 || yA > hiA - 0.9) die();

            /* shards */
            for (const s of shards) {
                if (!s.active) continue;
                if (s.z > p.z + 30) { s.active = false; s.y = 1e5; continue; }
                const dx = s.x - p.x, dy = (s.y - p.y) / 1.6, dz = s.z - p.z;
                if (dx * dx + dy * dy + dz * dz < 14) { die(); break; }
            }
            while (nextShardZ > p.z - 620) {
                if (dist > 700) spawnShard(nextShardZ);
                nextShardZ -= Math.max(130, 300 - dist * 0.008);
            }
        }

        /* skim + score */
        if (state === 'run') {
            const alt = Math.min(p.y - lo, hi - p.y);
            skimming = alt < 8.5;
            vignette.classList.toggle('on', skimming);
            if (skimming) {
                chainTimer = Math.max(chainTimer, 1.2);
                skimEmit -= sdt;
                if (skimEmit <= 0) {
                    skimEmit = 0.045;
                    const nearFloor = (p.y - lo) < (hi - p.y);
                    burst(p.x + (Math.random() - 0.5) * 2,
                        nearFloor ? lo + 0.6 : hi - 0.6, p.z + 2, 2, 10, nearFloor ? 9 : -9);
                }
            }
            chainTimer -= sdt;
            if (chainTimer <= 0 && chain > 0) { chain = 0; setMult(1); }
            score += player.speed * sdt * 0.55 * (skimming ? 2.6 : 1) * (1 + (mult - 1) * 0.4);
            scoreEl.textContent = fmt(score);

            audio.wind(
                Math.min(0.34, 0.05 + player.speed * 0.0034) * (audio.muted ? 0 : 1),
                300 + player.speed * 9
            );

            /* embers */
            for (let i = 0; i < EMBER_N; i++) {
                const e = embers[i];
                if (!e.active) continue;
                if (e.z > p.z + 30) { e.active = false; e.y = 1e5; syncEmber(i); continue; }
                const dz = e.z - p.z;
                if (dz > -6 && dz < 6) {
                    const dx = e.x - p.x, dyE = e.y - p.y;
                    if (dx * dx + dyE * dyE + dz * dz < 46) {
                        e.active = false; e.y = 1e5; syncEmber(i);
                        chain++;
                        chainTimer = 5;
                        setMult(1 + Math.min(4, Math.floor(chain / 5)));
                        score += 100 * mult;
                        burst(p.x, p.y, p.z, 14, 16, 14);
                        audio.chime(Math.min(chain - 1, SCALE.length - 1));
                    }
                }
            }
        }
        while (nextStringZ > p.z - 640) {
            spawnString(nextStringZ);
            nextStringZ -= 105 + Math.random() * 75;
        }
        for (let i = 0; i < EMBER_N; i++) {
            const e = embers[i];
            if (e.active && e.z > p.z + 30) { e.active = false; e.y = 1e5; syncEmber(i); }
        }
    } else if (state === 'dead') {
        p.z -= player.speed * sdt * 0.4;
    }

    /* ---- glider pose ---- */
    if (glider.visible) {
        glider.position.copy(p);
        glider.position.y += Math.sin(elapsed * 2.1) * 0.12;
        eul.set(
            clamp(player.vy * 0.014 * (player.grav === 1 ? 1 : -1), -0.55, 0.55),
            0,
            clamp(-player.vx * 0.016, -0.7, 0.7) + rollA,
            'ZXY'
        );
        qt.setFromEuler(eul);
        glider.quaternion.slerp(qt, 1 - Math.exp(-10 * dt));
        updateTrail();
    }

    /* ---- terrain recycle ---- */
    for (const c of chunks) {
        if (c.position.z > camera.position.z + CHUNK_D * 1.2) {
            buildChunk(c, c.position.z - NUM_CHUNKS * CHUNK_D);
        }
    }

    /* ---- shards spin ---- */
    for (let i = 0; i < SHARD_N; i++) {
        const s = shards[i];
        s.spin += s.rate * sdt;
        eul.set(s.spin * 0.7, s.spin, s.spin * 0.3);
        qt.setFromEuler(eul);
        m4.makeRotationFromQuaternion(qt);
        m4.scale(new THREE.Vector3(0.9, 2.3, 0.9));
        m4.setPosition(s.x, s.active ? s.y : 1e5, s.z);
        shardMesh.setMatrixAt(i, m4);
    }
    shardMesh.instanceMatrix.needsUpdate = true;

    /* ---- embers pulse ---- */
    for (let i = 0; i < EMBER_N; i++) {
        const e = embers[i];
        const sc = e.active ? 1 + Math.sin(elapsed * 4 + i * 1.7) * 0.28 : 0.0001;
        m4.identity();
        m4.makeScale(sc, sc, sc);
        m4.setPosition(e.x, e.y + (e.active ? Math.sin(elapsed * 2 + i) * 0.5 : 0), e.z);
        emberMesh.setMatrixAt(i, m4);
    }
    emberMesh.instanceMatrix.needsUpdate = true;

    updateSparks(sdt);

    /* ---- camera: barrel-rolls through the flip ---- */
    rollA = damp(rollA, rollTarget, RM ? 12 : 6.5, dt);
    const upY = Math.cos(rollA), upX = Math.sin(rollA) * 0.35;
    camera.up.set(upX, upY === 0 ? 0.001 : upY, 0).normalize();

    if (state === 'title') {
        camPos.set(p.x + Math.sin(elapsed * 0.22) * 16, p.y + 5, p.z + 38);
        camera.position.lerp(camPos, 1 - Math.exp(-1.6 * dt));
        lookAt.set(p.x, p.y + 5, p.z - 90);
        camera.fov = damp(camera.fov, 58, 2, dt);
    } else {
        camPos.set(p.x + player.vx * 0.05, p.y + 5.6 * upY, p.z + 14);
        camera.position.lerp(camPos, 1 - Math.exp(-7 * dt));
        lookAt.set(p.x + player.vx * 0.06, p.y + 2.6 * upY, p.z - 40);
        const fovKick = RM ? 4 : 15;
        camera.fov = damp(camera.fov, 60 + (player.speed - 29) / 36 * fovKick, 4, dt);
    }
    if (shake > 0.01) {
        camera.position.x += (Math.random() - 0.5) * shake * 2.4;
        camera.position.y += (Math.random() - 0.5) * shake * 2.4;
        shake = damp(shake, 0, 5, dt);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(lookAt);
    camera.rotateZ(clamp(-player.vx * 0.004, -0.16, 0.16));

    sky.position.copy(camera.position);
    sun.position.copy(p).addScaledVector(LIGHT_DIR, 600);
    sun.target.position.copy(p);
    seamGlow.position.copy(p).addScaledVector(UPLIGHT_DIR, 600);
    seamGlow.target.position.copy(p);
    backFill.position.copy(p).addScaledVector(BACKFILL_DIR, 600);
    backFill.target.position.copy(p);

    renderer.render(scene, camera);
}

requestAnimationFrame(frame);
