/* ============================================================
   ISAACHERBST.US — the playground edition
   1. kinetic name letters      5. games (all with synth SFX)
   2. tearable curtain (verlet) 6. disco mode (lights out + music)
   3. confetti engine           7. fireplace mode (bonfire + crackle)
   4. throwable memoji          8. konami, toasts, say-hi wiring
   ============================================================ */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var CANDY = ["#faf3e3", "#ff7a3d", "#ffc53d", "#2fe6a8"];

    /* ---------- toast ---------- */

    var toastEl = document.getElementById("toast");
    var toastTimer = null;
    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
    }

    /* ---------- sound engine (all synthesized, no audio files) ---------- */

    var AC = null;
    var soundOn = true;
    try { soundOn = localStorage.getItem("soundOn") !== "off"; } catch (e) { }

    function audioCtx() {
        if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
        if (AC.state === "suspended") AC.resume();
        return AC;
    }

    function blip(freq, dur, type, vol, slideTo, when) {
        if (!soundOn) return;
        var c = audioCtx();
        var t = when || c.currentTime;
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(vol || 0.2, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(c.destination);
        o.start(t);
        o.stop(t + dur + 0.02);
    }

    var noiseBuf = null;
    function hiss(dur, freq, vol, type, when, q) {
        if (!soundOn) return;
        var c = audioCtx();
        if (!noiseBuf) {
            noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
            var d = noiseBuf.getChannelData(0);
            for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        var t = when || c.currentTime;
        var src = c.createBufferSource();
        src.buffer = noiseBuf;
        src.loop = true;
        src.playbackRate.value = 0.7 + Math.random() * 0.6;
        var f = c.createBiquadFilter();
        f.type = type || "bandpass";
        f.frequency.value = freq;
        f.Q.value = q || 1;
        var g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(c.destination);
        src.start(t);
        src.stop(t + dur + 0.05);
    }

    var SFX = {
        pop:    function () { blip(500 + Math.random() * 500, 0.08, "sine", 0.25, 150); },
        whack:  function () { hiss(0.09, 900, 0.3); blip(160, 0.1, "square", 0.25, 70); },
        pad:    function (i) { blip([330, 262, 220, 165][i] || 220, 0.3, "triangle", 0.28); },
        buzz:   function () { blip(110, 0.45, "sawtooth", 0.22, 55); },
        go:     function () { blip(880, 0.15, "square", 0.22); },
        win:    function () {
            if (!soundOn) return;
            var t0 = audioCtx().currentTime;
            [523, 659, 784, 1047].forEach(function (f, i) { blip(f, 0.16, "triangle", 0.22, null, t0 + i * 0.09); });
        },
        cannon: function () { hiss(0.35, 500, 0.4, "lowpass"); blip(300, 0.3, "sine", 0.3, 60); }
    };

    /* ---------- confetti engine ---------- */

    var confettiCanvas = document.getElementById("confetti");
    var confettiCtx = confettiCanvas.getContext("2d");
    var particles = [];
    var confettiRunning = false;

    function sizeConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    sizeConfetti();
    window.addEventListener("resize", sizeConfetti);

    function burst(x, y, n, power) {
        if (reduceMotion) return;
        power = power || 1;
        for (var i = 0; i < n && particles.length < 500; i++) {
            var a = Math.random() * Math.PI * 2;
            var v = (2 + Math.random() * 6) * power;
            particles.push({
                x: x, y: y,
                vx: Math.cos(a) * v,
                vy: Math.sin(a) * v - 3 * power,
                w: 4 + Math.random() * 6,
                h: 3 + Math.random() * 4,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.3,
                color: CANDY[(Math.random() * CANDY.length) | 0],
                life: 60 + Math.random() * 50
            });
        }
        if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiTick); }
    }

    function rain(n) {
        if (reduceMotion) return;
        for (var i = 0; i < n && particles.length < 500; i++) {
            particles.push({
                x: Math.random() * confettiCanvas.width,
                y: -20 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 2,
                vy: 2 + Math.random() * 3,
                w: 4 + Math.random() * 6,
                h: 3 + Math.random() * 4,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.3,
                color: CANDY[(Math.random() * CANDY.length) | 0],
                life: 180 + Math.random() * 80
            });
        }
        if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiTick); }
    }

    function confettiTick() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.vy += 0.18;
            p.vx *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.life--;
            if (p.life <= 0 || p.y > confettiCanvas.height + 30) { particles.splice(i, 1); continue; }
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rot);
            confettiCtx.globalAlpha = Math.min(1, p.life / 40);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            confettiCtx.restore();
        }
        if (particles.length) { requestAnimationFrame(confettiTick); }
        else { confettiRunning = false; confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
    }

    /* ---------- kinetic name letters ---------- */

    document.querySelectorAll(".name-line").forEach(function (line, li) {
        var word = line.getAttribute("data-word");
        word.split("").forEach(function (ch, i) {
            var s = document.createElement("span");
            s.className = "ltr";
            s.textContent = ch;
            s.style.animationDelay = (0.08 * (li * word.length + i)) + "s";
            s.addEventListener("pointerenter", function () {
                s.classList.remove("boing");
                void s.offsetWidth; /* restart the animation */
                s.classList.add("boing");
            });
            line.appendChild(s);
        });
    });

    document.getElementById("bigName").addEventListener("click", function (e) {
        burst(e.clientX, e.clientY, 40, 1.2);
    });

    /* ---------- tearable curtain ---------- */

    var hero = document.getElementById("hero");
    var clothCanvas = document.getElementById("cloth");
    var tearHint = document.getElementById("tearHint");
    var hintDismissed = false;

    if (!reduceMotion) initCloth();

    function initCloth() {
        var ctx = clothCanvas.getContext("2d");
        var SPACING = window.innerWidth < 640 ? 20 : 26;
        var TEAR_STRETCH = 4.2;     /* constraint snaps past this × rest length */
        var MOUSE_R = 34;
        var points = [];
        var constraints = [];
        var mouse = { x: 0, y: 0, px: 0, py: 0, down: false, over: false };
        var snapBudget = 0;         /* throttle snap-confetti */
        var W = 0, H = 0, COLS = 0, ROWS = 0;

        function build() {
            W = hero.clientWidth;
            H = hero.clientHeight;
            clothCanvas.width = W;
            clothCanvas.height = H;
            COLS = Math.ceil(W / SPACING) + 1;
            ROWS = Math.ceil((H * 0.98) / SPACING);
            points = [];
            constraints = [];
            for (var y = 0; y <= ROWS; y++) {
                for (var x = 0; x < COLS; x++) {
                    var px = x * SPACING;
                    var py = y * SPACING;
                    points.push({ x: px, y: py, ox: px, oy: py, pinned: y === 0 });
                }
            }
            for (var y2 = 0; y2 <= ROWS; y2++) {
                for (var x2 = 0; x2 < COLS; x2++) {
                    var i = y2 * COLS + x2;
                    if (x2 < COLS - 1) constraints.push({ a: i, b: i + 1, rest: SPACING, vert: false, col: x2 });
                    if (y2 < ROWS)     constraints.push({ a: i, b: i + COLS, rest: SPACING, vert: true, col: x2 });
                }
            }
        }

        /* mostly cream threads with the occasional candy stripe — curtain, not plaid */
        var STRIPES = ["rgba(250,243,227,0.55)", "rgba(250,243,227,0.55)", "#ff7a3d",
                       "rgba(250,243,227,0.55)", "#ffc53d", "rgba(250,243,227,0.55)",
                       "rgba(250,243,227,0.55)", "#2fe6a8"];
        function threadColor(c) {
            if (c.vert) return STRIPES[c.col % STRIPES.length];
            return "rgba(250, 243, 227, 0.12)";
        }

        function physics() {
            var wind = Math.sin(Date.now() / 1400) * 0.06;
            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                if (p.pinned) continue;
                var nx = p.x + (p.x - (p.px === undefined ? p.x : p.px)) * 0.985 + wind;
                var ny = p.y + (p.y - (p.py === undefined ? p.y : p.py)) * 0.985 + 0.25;
                p.px = p.x; p.py = p.y;
                p.x = nx; p.y = ny;
            }

            /* pointer: hover pushes, press-drag shreds */
            if (mouse.over) {
                var dxm = mouse.x - mouse.px;
                var dym = mouse.y - mouse.py;
                for (var j = 0; j < points.length; j++) {
                    var q = points[j];
                    if (q.pinned) continue;
                    var dx = q.x - mouse.x, dy = q.y - mouse.y;
                    var d2 = dx * dx + dy * dy;
                    if (d2 < MOUSE_R * MOUSE_R) {
                        q.x += dxm * 0.9;
                        q.y += dym * 0.9;
                    }
                }
                if (mouse.down) {
                    for (var k = constraints.length - 1; k >= 0; k--) {
                        var c = constraints[k];
                        var mxk = (points[c.a].x + points[c.b].x) / 2 - mouse.x;
                        var myk = (points[c.a].y + points[c.b].y) / 2 - mouse.y;
                        if (mxk * mxk + myk * myk < 900) snap(k);
                    }
                }
            }

            /* solve + auto-tear */
            for (var pass = 0; pass < 3; pass++) {
                for (var m = constraints.length - 1; m >= 0; m--) {
                    var s = constraints[m];
                    var A = points[s.a], B = points[s.b];
                    var ddx = B.x - A.x, ddy = B.y - A.y;
                    var dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.0001;
                    if (dist > s.rest * TEAR_STRETCH) { snap(m); continue; }
                    var diff = (s.rest - dist) / dist * 0.5;
                    var ox = ddx * diff, oy = ddy * diff;
                    if (!A.pinned) { A.x -= ox; A.y -= oy; }
                    if (!B.pinned) { B.x += ox; B.y += oy; }
                }
            }
        }

        function snap(idx) {
            var c = constraints[idx];
            constraints.splice(idx, 1);
            if (!hintDismissed) {
                hintDismissed = true;
                tearHint.classList.add("gone");
            }
            if (snapBudget > 0) {
                snapBudget--;
                var heroRect = hero.getBoundingClientRect();
                var mx = (points[c.a].x + points[c.b].x) / 2 + heroRect.left;
                var my = (points[c.a].y + points[c.b].y) / 2 + heroRect.top;
                burst(mx, my, 3, 0.5);
            }
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.lineCap = "round";
            for (var i = 0; i < constraints.length; i++) {
                var c = constraints[i];
                var A = points[c.a], B = points[c.b];
                ctx.strokeStyle = threadColor(c);
                ctx.lineWidth = c.vert ? 2.2 : 1;
                ctx.beginPath();
                ctx.moveTo(A.x, A.y);
                ctx.lineTo(B.x, B.y);
                ctx.stroke();
            }
        }

        function loop() {
            snapBudget = 2;
            physics();
            draw();
            mouse.px = mouse.x;
            mouse.py = mouse.y;
            requestAnimationFrame(loop);
        }

        function setMouse(e) {
            var r = clothCanvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        }

        clothCanvas.addEventListener("pointerenter", function (e) { setMouse(e); mouse.px = mouse.x; mouse.py = mouse.y; mouse.over = true; });
        clothCanvas.addEventListener("pointerleave", function () { mouse.over = false; mouse.down = false; });
        clothCanvas.addEventListener("pointermove", function (e) { mouse.over = true; setMouse(e); });
        clothCanvas.addEventListener("pointerdown", function (e) { mouse.down = true; mouse.over = true; setMouse(e); mouse.px = mouse.x; mouse.py = mouse.y; });
        window.addEventListener("pointerup", function () { mouse.down = false; });

        var resizeTimer = null;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(build, 200);
        });

        document.getElementById("restitch").addEventListener("click", function () {
            build();
            toast("good as new ✨");
        });

        build();
        loop();
    }

    /* ---------- throwable memoji ---------- */

    var memoji = document.getElementById("memoji");
    var mj = { x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, held: false, animating: false };
    var grab = { dx: 0, dy: 0, lastX: 0, lastY: 0, lastT: 0, startX: 0, startY: 0 };
    var clickCount = 0;

    function mjPlace() {
        memoji.style.left = mj.x + "px";
        memoji.style.top = mj.y + "px";
        memoji.style.bottom = "auto";
    }

    function mjInit() {
        var hr = hero.getBoundingClientRect();
        var mr = memoji.getBoundingClientRect();
        mj.w = mr.width; mj.h = mr.height;
        mj.x = mr.left - hr.left;
        mj.y = mr.top - hr.top;
    }

    memoji.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        mjInit();
        mj.held = true;
        memoji.classList.add("grabbed");
        memoji.setPointerCapture(e.pointerId);
        var hr = hero.getBoundingClientRect();
        grab.dx = e.clientX - hr.left - mj.x;
        grab.dy = e.clientY - hr.top - mj.y;
        grab.lastX = e.clientX; grab.lastY = e.clientY; grab.lastT = performance.now();
        grab.startX = e.clientX; grab.startY = e.clientY;
        mj.vx = 0; mj.vy = 0;
    });

    memoji.addEventListener("pointermove", function (e) {
        if (!mj.held) return;
        var hr = hero.getBoundingClientRect();
        mj.x = e.clientX - hr.left - grab.dx;
        mj.y = e.clientY - hr.top - grab.dy;
        var now = performance.now();
        var dt = Math.max(1, now - grab.lastT);
        mj.vx = (e.clientX - grab.lastX) / dt * 16;
        mj.vy = (e.clientY - grab.lastY) / dt * 16;
        grab.lastX = e.clientX; grab.lastY = e.clientY; grab.lastT = now;
        mjPlace();
    });

    memoji.addEventListener("pointerup", function (e) {
        if (!mj.held) return;
        mj.held = false;
        memoji.classList.remove("grabbed");
        var moved = Math.hypot(e.clientX - grab.startX, e.clientY - grab.startY);
        if (moved < 6) {
            /* a click, not a throw */
            memoji.classList.remove("squish");
            void memoji.offsetWidth;
            memoji.classList.add("squish");
            clickCount++;
            if (clickCount === 6) {
                burst(e.clientX, e.clientY, 120, 1.6);
                toast("613! you found it 🎉");
                clickCount = 0;
            } else {
                burst(e.clientX, e.clientY, 10, 0.7);
            }
            return;
        }
        if (!reduceMotion && !mj.animating) { mj.animating = true; requestAnimationFrame(mjTick); }
    });

    function mjTick() {
        if (mj.held) { mj.animating = false; return; }
        mj.vy += 0.9;
        mj.vx *= 0.995;
        mj.x += mj.vx;
        mj.y += mj.vy;

        var maxX = hero.clientWidth - mj.w;
        var maxY = hero.clientHeight - mj.h - 8;
        var hitHard = false;

        if (mj.x < 0)    { mj.x = 0;    mj.vx = -mj.vx * 0.65; hitHard = Math.abs(mj.vx) > 6; }
        if (mj.x > maxX) { mj.x = maxX; mj.vx = -mj.vx * 0.65; hitHard = Math.abs(mj.vx) > 6; }
        if (mj.y < 0)    { mj.y = 0;    mj.vy = -mj.vy * 0.65; }
        if (mj.y > maxY) {
            mj.y = maxY;
            if (Math.abs(mj.vy) > 7) hitHard = true;
            mj.vy = -mj.vy * 0.55;
            mj.vx *= 0.8;
            if (Math.abs(mj.vy) < 1.2) mj.vy = 0;
        }

        if (hitHard) {
            memoji.classList.remove("squish");
            void memoji.offsetWidth;
            memoji.classList.add("squish");
            var hr = hero.getBoundingClientRect();
            burst(mj.x + mj.w / 2 + hr.left, mj.y + mj.h + hr.top, 14, 0.9);
        }

        mjPlace();

        var resting = mj.vy === 0 && Math.abs(mj.vx) < 0.15 && mj.y >= maxY - 1;
        if (resting) { mj.animating = false; return; }
        requestAnimationFrame(mjTick);
    }

    /* ---------- say hi ---------- */

    function sayHi() {
        if (window.HubSpotConversations && window.HubSpotConversations.widget) {
            window.HubSpotConversations.widget.open();
            toast("chat's open — go on, type something");
        } else {
            toast("chat's still waking up — LinkedIn works too!");
            window.open("https://www.linkedin.com/in/isaac-herbst-712001207/", "_blank", "noopener");
        }
    }
    document.getElementById("sayHiBtn").addEventListener("click", sayHi);
    document.getElementById("sayHiBig").addEventListener("click", function (e) {
        burst(e.clientX, e.clientY, 50, 1.3);
        sayHi();
    });

    /* ---------- toy chest: bubble wrap ---------- */

    var bubbleGrid = document.getElementById("bubbleGrid");
    var bubbleCount = document.getElementById("bubbleCount");
    var BUBBLES = 52;
    var popped = 0;

    function popBubble(b, x, y) {
        if (b.classList.contains("popped")) return;
        b.classList.add("popped");
        popped++;
        bubbleCount.textContent = popped === BUBBLES ? "all " + BUBBLES + " popped 👏" : popped + " popped";
        burst(x, y, 6, 0.5);
        SFX.pop();
        if (popped === BUBBLES) { toast("very satisfying. fresh sheet's on the house."); SFX.win(); }
    }

    function buildBubbles() {
        bubbleGrid.innerHTML = "";
        popped = 0;
        bubbleCount.textContent = "0 popped";
        for (var i = 0; i < BUBBLES; i++) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "bubble";
            b.setAttribute("aria-label", "bubble " + (i + 1));
            b.addEventListener("pointerdown", function (e) { popBubble(e.currentTarget, e.clientX, e.clientY); });
            /* drag across with the button held to pop a whole row */
            b.addEventListener("pointerenter", function (e) {
                if (e.buttons) popBubble(e.currentTarget, e.clientX, e.clientY);
            });
            bubbleGrid.appendChild(b);
        }
    }
    buildBubbles();
    document.getElementById("freshSheet").addEventListener("click", buildBubbles);

    /* ---------- toy chest: carousel ---------- */

    var track = document.getElementById("carTrack");
    var dotsWrap = document.getElementById("carDots");
    var slides = track.querySelectorAll(".car-slide");
    var carIdx = 0;

    function goTo(i) {
        carIdx = Math.max(0, Math.min(slides.length - 1, i));
        slides[carIdx].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    }

    slides.forEach(function (s, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "car-dot" + (i === 0 ? " active" : "");
        d.setAttribute("role", "tab");
        d.setAttribute("aria-label", s.querySelector(".game-label").textContent);
        d.addEventListener("click", function () { goTo(i); });
        dotsWrap.appendChild(d);
    });

    document.getElementById("carPrev").addEventListener("click", function () { goTo(carIdx - 1); });
    document.getElementById("carNext").addEventListener("click", function () { goTo(carIdx + 1); });

    track.addEventListener("scroll", function () {
        var mid = track.scrollLeft + track.clientWidth / 2;
        var nearest = 0, nearestDist = Infinity;
        slides.forEach(function (s, i) {
            var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
            if (d < nearestDist) { nearestDist = d; nearest = i; }
        });
        if (nearest !== carIdx) {
            carIdx = nearest;
            dotsWrap.querySelectorAll(".car-dot").forEach(function (d, i) {
                d.classList.toggle("active", i === carIdx);
            });
        }
    }, { passive: true });

    /* high scores survive a refresh; failure just means no bragging rights */
    function readBest(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
    function storeBest(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

    /* ---------- game: whack-a-memoji ---------- */

    var whackGrid = document.getElementById("whackGrid");
    var whackStat = document.getElementById("whackStat");
    var whackStart = document.getElementById("whackStart");
    var wPlaying = false, wScore = 0, wTime = 20, wSpawn = null, wCount = null, wHide = null;

    for (var h = 0; h < 9; h++) {
        var hole = document.createElement("button");
        hole.type = "button";
        hole.className = "hole";
        hole.setAttribute("aria-label", "memoji hole " + (h + 1));
        var im = document.createElement("img");
        im.src = "items/1.png";
        im.alt = "";
        im.draggable = false;
        hole.appendChild(im);
        hole.addEventListener("pointerdown", function (e) {
            if (!wPlaying || !this.classList.contains("up")) return;
            this.classList.remove("up");
            wScore++;
            whackStat.textContent = "score " + wScore + " · " + wTime + "s";
            burst(e.clientX, e.clientY, 8, 0.7);
            SFX.whack();
        });
        whackGrid.appendChild(hole);
    }

    function whackEnd() {
        wPlaying = false;
        clearInterval(wSpawn); clearInterval(wCount); clearTimeout(wHide);
        whackGrid.querySelectorAll(".hole.up").forEach(function (x) { x.classList.remove("up"); });
        whackStart.textContent = "▶ start the whacking";
        var best = readBest("whackBest");
        if (wScore > best) {
            storeBest("whackBest", wScore);
            toast(wScore + " whacks — new personal best 🏆");
            burst(window.innerWidth / 2, window.innerHeight / 2, 80, 1.4);
            SFX.win();
        } else {
            toast(wScore + " whacks. the memoji will recover.");
        }
        whackStat.textContent = "best " + Math.max(best, wScore);
    }

    whackStart.addEventListener("click", function () {
        if (wPlaying) return;
        wPlaying = true; wScore = 0; wTime = 20;
        whackStat.textContent = "score 0 · 20s";
        whackStart.textContent = "…whack!";
        var holes = whackGrid.children;
        wSpawn = setInterval(function () {
            var pick = holes[(Math.random() * holes.length) | 0];
            pick.classList.add("up");
            clearTimeout(wHide);
            wHide = setTimeout(function () { pick.classList.remove("up"); }, 650);
        }, 780);
        wCount = setInterval(function () {
            wTime--;
            whackStat.textContent = "score " + wScore + " · " + wTime + "s";
            if (wTime <= 0) whackEnd();
        }, 1000);
    });

    /* ---------- game: simon ---------- */

    var pads = document.querySelectorAll(".pad");
    var simonStat = document.getElementById("simonStat");
    var simonSeq = [], simonPos = 0, simonAwait = false, simonBusy = false;

    function flash(i, ms) {
        pads[i].classList.add("lit");
        SFX.pad(i);
        setTimeout(function () { pads[i].classList.remove("lit"); }, ms || 320);
    }

    function simonPlayback() {
        simonBusy = true;
        simonStat.textContent = "round " + simonSeq.length + " — watch…";
        simonSeq.forEach(function (p, i) {
            setTimeout(function () { flash(p); }, 550 * (i + 1));
        });
        setTimeout(function () {
            simonBusy = false;
            simonAwait = true;
            simonPos = 0;
            simonStat.textContent = "round " + simonSeq.length + " — your turn";
        }, 550 * (simonSeq.length + 1));
    }

    function simonNext() {
        simonSeq.push((Math.random() * 4) | 0);
        simonPlayback();
    }

    pads.forEach(function (pad) {
        pad.addEventListener("click", function () {
            if (simonBusy || !simonAwait) { flash(+pad.dataset.pad, 150); return; }
            var want = simonSeq[simonPos];
            if (+pad.dataset.pad === want) {
                flash(want, 180);
                simonPos++;
                if (simonPos === simonSeq.length) {
                    simonAwait = false;
                    var best = readBest("simonBest");
                    if (simonSeq.length > best) storeBest("simonBest", simonSeq.length);
                    setTimeout(simonNext, 750);
                }
            } else {
                simonAwait = false;
                SFX.buzz();
                var made = simonSeq.length - 1;
                toast(made > 0 ? "made it through round " + made + " 🧠" : "round 1. we've all been there.");
                simonStat.textContent = "best round " + Math.max(readBest("simonBest"), made);
                simonSeq = [];
            }
        });
    });

    document.getElementById("simonStart").addEventListener("click", function () {
        if (simonBusy) return;
        simonSeq = [];
        simonNext();
    });

    /* ---------- game: reaction test ---------- */

    var zone = document.getElementById("reactZone");
    var reactStat = document.getElementById("reactStat");
    var rState = "idle", rTimer = null, rT0 = 0;
    var rBest = readBest("reactBest");
    if (rBest) reactStat.textContent = "best " + rBest + "ms";

    zone.addEventListener("click", function () {
        if (rState === "idle") {
            rState = "armed";
            zone.className = "react-zone armed";
            zone.textContent = "wait for mint…";
            rTimer = setTimeout(function () {
                rState = "go";
                zone.className = "react-zone go";
                zone.textContent = "CLICK!";
                rT0 = performance.now();
                SFX.go();
            }, 1400 + Math.random() * 2600);
        } else if (rState === "armed") {
            clearTimeout(rTimer);
            rState = "idle";
            zone.className = "react-zone";
            zone.textContent = "too soon 😅 — click to retry";
            SFX.buzz();
        } else if (rState === "go") {
            var ms = Math.round(performance.now() - rT0);
            rState = "idle";
            zone.className = "react-zone";
            zone.textContent = ms + "ms — click to go again";
            SFX.pop();
            if (!rBest || ms < rBest) {
                rBest = ms;
                storeBest("reactBest", ms);
                reactStat.textContent = "best " + ms + "ms";
                if (ms < 350) burst(window.innerWidth / 2, window.innerHeight / 2, 40, 1.1);
            }
        }
    });

    /* ---------- confetti cannon ---------- */

    document.getElementById("cannonBtn").addEventListener("click", function (e) {
        burst(e.clientX, e.clientY, 90, 1.6);
        SFX.cannon();
    });

    /* ---------- disco music: synthesized four-on-the-floor, 120bpm ---------- */

    var disco = { on: false, timer: null, next: 0, step: 0 };

    /* two bars of 16ths — octave bass in Am, then F and G */
    var BASS = [];
    (function () {
        var oct = function (root) { return [root, root * 2, root, root * 2, root, root * 2, root, root * 2]; };
        BASS = oct(55).concat(oct(55), oct(43.65), oct(49));
    })();
    var STABS = { 4: [220, 261.6, 329.6], 12: [220, 261.6, 329.6], 20: [174.6, 220, 261.6], 28: [196, 246.9, 293.7] };

    function discoStep(s, t) {
        if (s % 4 === 0) { /* kick */
            blip(150, 0.16, "sine", 0.55, 45, t);
        }
        if (s % 4 === 2) { /* open-ish hat on the offbeat */
            hiss(0.09, 7000, 0.12, "highpass", t);
        }
        if (s % 8 === 4) { /* clap on 2 and 4 */
            hiss(0.12, 1800, 0.22, "bandpass", t, 0.8);
        }
        var b = BASS[s];
        if (b) blip(b, 0.12, "sawtooth", 0.16, null, t);
        var stab = STABS[s];
        if (stab) stab.forEach(function (f) { blip(f, 0.2, "triangle", 0.07, null, t); });
    }

    function startDiscoMusic() {
        if (disco.on) return;
        disco.on = true;
        disco.step = 0;
        disco.next = audioCtx().currentTime + 0.06;
        disco.timer = setInterval(function () {
            if (!soundOn) { disco.next = audioCtx().currentTime + 0.06; return; }
            var now = audioCtx().currentTime;
            while (disco.next < now + 0.18) {
                discoStep(disco.step, disco.next);
                disco.step = (disco.step + 1) % 32;
                disco.next += 0.125;
            }
        }, 60);
    }

    function stopDiscoMusic() {
        disco.on = false;
        clearInterval(disco.timer);
    }

    /* ---------- fireplace: canvas bonfire + crackle ambience ---------- */

    var fireCanvas = document.getElementById("fireCanvas");
    var fireCtx = fireCanvas.getContext("2d");
    var fire = { on: false, parts: [], crackle: null, nodes: [] };

    function fireSpawn(W, H) {
        var base = Math.min(W * 0.045, 55);
        for (var i = 0; i < 8; i++) {
            fire.parts.push({
                x: W / 2 + (Math.random() + Math.random() - 1) * base,
                y: H + 4,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -(1.8 + Math.random() * 3.2),
                size: 3 + Math.random() * 7,
                life: 1,
                decay: 0.009 + Math.random() * 0.014,
                ember: Math.random() < 0.15
            });
        }
    }

    function fireLoop() {
        if (!fire.on) return;
        var W = fireCanvas.width, H = fireCanvas.height;
        fireCtx.clearRect(0, 0, W, H);
        fireSpawn(W, H);
        fireCtx.globalCompositeOperation = "lighter";
        for (var i = fire.parts.length - 1; i >= 0; i--) {
            var p = fire.parts[i];
            p.x += p.vx + Math.sin(p.y / 22) * 0.5;
            p.y += p.vy;
            p.life -= p.decay * (p.ember ? 0.4 : 1);
            if (p.life <= 0) { fire.parts.splice(i, 1); continue; }
            var r = p.ember ? 1.6 : p.size * p.life;
            /* deep red → orange → yellow as it burns */
            var hue = 8 + (1 - p.life) * 40;
            fireCtx.fillStyle = "hsla(" + hue + ", 100%, " + (48 + p.life * 12) + "%, " + (p.ember ? 0.9 : p.life * 0.55) + ")";
            fireCtx.beginPath();
            fireCtx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
            fireCtx.fill();
        }
        fireCtx.globalCompositeOperation = "source-over";
        requestAnimationFrame(fireLoop);
    }

    function startFireAudio() {
        if (!soundOn) return;
        var c = audioCtx();
        /* wind: looped noise through a low filter, slowly breathing */
        if (!noiseBuf) hiss(0.01, 500, 0.001); /* builds the buffer */
        var wind = c.createBufferSource();
        wind.buffer = noiseBuf; wind.loop = true; wind.playbackRate.value = 0.3;
        var wf = c.createBiquadFilter(); wf.type = "lowpass"; wf.frequency.value = 220;
        var wg = c.createGain(); wg.gain.value = 0.05;
        wind.connect(wf); wf.connect(wg); wg.connect(c.destination);
        wind.start();
        /* eerie drone: two slightly detuned low sines that beat against each other */
        var d1 = c.createOscillator(), d2 = c.createOscillator(), dg = c.createGain();
        d1.frequency.value = 55; d2.frequency.value = 55.7;
        d1.type = d2.type = "sine"; dg.gain.value = 0.035;
        d1.connect(dg); d2.connect(dg); dg.connect(c.destination);
        d1.start(); d2.start();
        fire.nodes = [wind, d1, d2, wg, dg];
        /* crackle: random little pops */
        fire.crackle = setInterval(function () {
            if (!soundOn) return;
            if (Math.random() < 0.75) hiss(0.02 + Math.random() * 0.05, 1200 + Math.random() * 2200, 0.04 + Math.random() * 0.15, "bandpass", null, 2.5);
        }, 90);
    }

    function stopFireAudio() {
        clearInterval(fire.crackle);
        fire.nodes.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { } });
        fire.nodes = [];
    }

    function startFire() {
        fireCanvas.width = window.innerWidth;
        fireCanvas.height = Math.round(window.innerHeight * 0.6);
        fire.parts = [];
        fire.on = true;
        if (!reduceMotion) requestAnimationFrame(fireLoop);
        startFireAudio();
    }

    function stopFire() {
        fire.on = false;
        stopFireAudio();
        fireCtx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);
    }

    /* ---------- mode dock: disco / fireplace / sound ---------- */

    var modeBtns = { disco: document.getElementById("modeDisco"), fire: document.getElementById("modeFire") };

    function setMode(mode) {
        var had = document.body.classList.contains(mode);
        document.body.classList.remove("disco", "fire");
        stopDiscoMusic();
        stopFire();
        Object.keys(modeBtns).forEach(function (k) {
            modeBtns[k].classList.remove("active");
            modeBtns[k].setAttribute("aria-pressed", "false");
        });
        if (had) {
            toast(mode === "disco" ? "lights back on. party's over." : "fire's out. lights on.");
            return;
        }
        document.body.classList.add(mode);
        modeBtns[mode].classList.add("active");
        modeBtns[mode].setAttribute("aria-pressed", "true");
        if (mode === "disco") {
            startDiscoMusic();
            rain(180);
            toast("DISCO 🪩 lights out, volume up");
        } else {
            startFire();
            toast("🔥 gather round… it got dark in here");
        }
    }

    modeBtns.disco.addEventListener("click", function () { setMode("disco"); });
    modeBtns.fire.addEventListener("click", function () { setMode("fire"); });

    var soundBtn = document.getElementById("soundToggle");
    function paintSoundBtn() {
        soundBtn.textContent = soundOn ? "🔊" : "🔇";
        soundBtn.setAttribute("aria-pressed", String(soundOn));
    }
    paintSoundBtn();
    soundBtn.addEventListener("click", function () {
        soundOn = !soundOn;
        try { localStorage.setItem("soundOn", soundOn ? "on" : "off"); } catch (e) { }
        paintSoundBtn();
        /* fire ambience uses live nodes — rebuild to match the new setting */
        if (document.body.classList.contains("fire")) {
            stopFireAudio();
            if (soundOn) startFireAudio();
        }
        if (soundOn) SFX.pop();
        toast(soundOn ? "sound on" : "sound off");
    });

    window.addEventListener("resize", function () {
        if (fire.on) {
            fireCanvas.width = window.innerWidth;
            fireCanvas.height = Math.round(window.innerHeight * 0.6);
        }
    });

    /* ---------- konami disco ---------- */

    var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var kIdx = 0;
    document.addEventListener("keydown", function (e) {
        var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        kIdx = key === KONAMI[kIdx] ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
        if (kIdx === KONAMI.length) {
            kIdx = 0;
            setMode("disco");
        }
    });

})();
