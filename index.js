(function () {
    'use strict';

    // ============ QUOTES API ============
    let pages;
    const innerC = $('.carousel-inner');
    loader(innerC);

    async function getQuote(url) {
        try {
            const q = await fetch(url);
            const quotes = await q.json();
            innerC.empty();
            $(`<div class="carousel-item active" data-bs-interval="3000">
                    <div class="qoutes d-block w-100">
                        <div class="carousel-caption">
                            <p>A rotating collection of quotes, refreshed every so often.<br>Powered by</p>
                            <h6><a id="q1" href="https://github.com/lukePeavey/quotable" target="_blank">quotable.io</a></h6>
                        </div>
                    </div>
                </div>`).appendTo(innerC);
            for (let i = 0; i < quotes.count; i++) {
                pages = quotes.totalPages;
                $(`<div class="carousel-item" data-bs-interval="10000">
                    <div class="qoutes d-block w-100">
                        <div class="carousel-caption">
                            <p class="qText">${quotes.results[i].content}</p>
                            <h6>— ${quotes.results[i].author}</h6>
                        </div>
                    </div>
                    </div>`).appendTo(innerC);
            }
        } catch (err) {
            innerC.empty();
            $(`<div class="carousel-item active">
                <div class="qoutes d-block w-100">
                    <div class="carousel-caption">
                        <p class="qText">"The best way to predict the future is to invent it."</p>
                        <h6>— Alan Kay</h6>
                    </div>
                </div>
            </div>`).appendTo(innerC);
        }
    }

    let i = 1;
    setTimeout(() => getQuote(`https://api.quotable.io/quotes?page=${i}tags=inspirational|technology&maxLength=70`), 4000);
    setInterval(() => {
        if (i === pages + 1) { i = 1; }
        innerC.empty();
        getQuote(`https://api.quotable.io/quotes?page=${i++}tags=inspirational|technology&maxLength=70`);
    }, 1000 * 60 * 10);

    // ============ LOADER ============
    function loader(pos) {
        $(`<div class="wrapper">
        <span class="circle circle-1"></span>
        <span class="circle circle-2"></span>
        <span class="circle circle-3"></span>
        <span class="circle circle-4"></span>
        <span class="circle circle-5"></span>
        <span class="circle circle-6"></span>
        <span class="circle circle-7"></span>
        <span class="circle circle-8"></span>
      </div>`).appendTo(pos);
    }

    // ============ DARK MODE ============
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            setDarkImgs();
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            $('.img-fluid').attr('src', 'items/iHnew.png');
            $('#linked').attr('src', 'items/pics/icons8-linkedin-50.png');
            $('#git').attr('src', 'items/pics/icons8-github-30.png');
            localStorage.setItem('theme', 'light');
        }
    }

    toggleSwitch.addEventListener('change', switchTheme, false);
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
            setDarkImgs();
        }
    }

    function setDarkImgs() {
        $('.img-fluid').attr('src', 'items/iHnew-light.png');
        $('#linked').attr('src', 'items/pics/icons8-linkedin-50-lt.png');
        $('#git').attr('src', 'items/pics/icons8-github-30-lt.png');
    }

    // ============ NAVBAR ON SCROLL ============
    let lastScrollTop;
    let hiding;
    const navbar = $("#navbar");
    navbar.on('mouseover', () => {
        navbar.css('top', '0');
        clearTimeout(hiding);
    }).on('mouseout', () => {
        navbarHide();
    });

    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            navbar.css('top', '-110px');
        } else {
            navbar.css('top', '0');
            clearTimeout(hiding);
            navbarHide();
        }
        lastScrollTop = scrollTop;
    });

    function navbarHide() {
        hiding = setTimeout(() => {
            if (window.pageYOffset > 150) {
                navbar.css('top', '-110px');
            }
        }, 1500);
    }

    // ============ CONTACT BUTTON / HUBSPOT GLOW ============
    let works = true;
    function highlightHubspot() {
        if (works) {
            $('#hubspot').css({ 'display': 'block' });
            works = false;
            setTimeout(() => {
                $('#hubspot').css({ 'display': 'none' });
                works = true;
            }, 3500);
        }
    }
    $('#contact, #contact2').on('click', highlightHubspot);

    // ============ INTERSECTION OBSERVER FOR REVEALS ============
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                if (entry.target.classList.contains('edu-box')) {
                    entry.target.classList.add('edu-animation');
                }
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    const eduBox = document.querySelector('.edu-box');
    if (eduBox) revealObserver.observe(eduBox);

    // ============ COUNTER ANIMATION FOR FACTS ============
    const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                if (!isNaN(target)) {
                    animateCount(el, target, 1400);
                }
                countObserver.unobserve(el);
            }
        });
    }, { threshold: 0.4 });
    document.querySelectorAll('.fact-number[data-count]').forEach(el => countObserver.observe(el));

    function animateCount(el, target, duration) {
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = prefix + Math.floor(eased * target).toString() + (t === 1 ? suffix : '');
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = prefix + target.toString() + suffix;
        };
        requestAnimationFrame(step);
    }

    // ============ TYPEWRITER ============
    const roles = [
        'Lead Software Engineer',
        'Cloud + AI Architect',
        'RAG Pipeline Wrangler',
        'Distributed Systems Nerd',
        'Healthcare Infra Tinkerer',
        'Recovering FullStack Dev',
        'Prompt Wrangler (as of 2026)'
    ];
    const typer = document.getElementById('typewriter');
    if (typer) {
        let rIdx = 0, cIdx = 0, deleting = false;
        function tick() {
            const current = roles[rIdx];
            if (!deleting) {
                cIdx++;
                typer.textContent = current.slice(0, cIdx);
                if (cIdx === current.length) {
                    deleting = true;
                    setTimeout(tick, 1800);
                    return;
                }
                setTimeout(tick, 70 + Math.random() * 50);
            } else {
                cIdx--;
                typer.textContent = current.slice(0, cIdx);
                if (cIdx === 0) {
                    deleting = false;
                    rIdx = (rIdx + 1) % roles.length;
                    setTimeout(tick, 350);
                    return;
                }
                setTimeout(tick, 35);
            }
        }
        setTimeout(tick, 1500);
    }

    // ============ CONFETTI ============
    function confetti(originX, originY, count = 60) {
        const colors = ['#ff8a5b', '#b18bff', '#4dd897', '#ffd166', '#594922'];
        for (let n = 0; n < count; n++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = originX + 'px';
            piece.style.top = originY + 'px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (1.2 + Math.random() * 1.6) + 's';
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 220;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance * 0.5;
            piece.animate(
                [
                    { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate(${tx}px, ${ty + 600}px) rotate(${720 + Math.random() * 720}deg)`, opacity: 0 }
                ],
                { duration: 1400 + Math.random() * 1400, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' }
            );
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 3000);
        }
    }

    const memoji = document.getElementById('mainmemoji');
    if (memoji) {
        memoji.addEventListener('click', (e) => {
            const rect = memoji.getBoundingClientRect();
            confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 70);
        });
    }

    // ============ KONAMI CODE = PARTY MODE ============
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let kIdx = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === konami[kIdx].toLowerCase()) {
            kIdx++;
            if (kIdx === konami.length) {
                document.body.classList.toggle('party-mode');
                confetti(window.innerWidth / 2, window.innerHeight / 3, 120);
                kIdx = 0;
            }
        } else {
            kIdx = 0;
        }
    });

    // ============ TILT EFFECT ON EDU CARDS ============
    document.querySelectorAll('.edu').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ============ TITLE TICKER ============
    const t = ['Hello World', "I'm Isaac Herbst", 'Lead Software Engineer', "You've come to the right place", 'HELLOOO', 'A CHANGING TAB!', 'How often do you see that?!', 'Drop me a line', 'Click that green button', 'on the bottom right of the page', 'KIT'];
    let tIdx = 1;
    setInterval(() => {
        document.title = `${t[tIdx++]}`;
        if (tIdx === t.length) { tIdx = 0; }
    }, 2500);

}());
