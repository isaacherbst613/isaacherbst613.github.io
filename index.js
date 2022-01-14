(function () {
    'use strict';

    //qoutes API
    let pages;
    const innerC = $('.carousel-inner');
    loader(innerC);
    async function getQuote(url) {
        const q = await fetch(url);
        const quotes = await q.json();
        innerC.empty();
        $(`<div class="carousel-item active" data-bs-interval="3000">
                <div class="qoutes d-block w-100">
                    <div class="carousel-caption">
                        <p >This collection of quotes is updated every so often,<br>and is taken from</p>
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
                        <h6>${quotes.results[i].author}</h6>
                    </div>
                </div>
                </div>`).appendTo(innerC);
        }
    }
    let i = 1;
    setTimeout(() => getQuote(`https://api.quotable.io/quotes?page=${i}tags=inspirational|technology&maxLength=70`), 5000);
    setInterval(() => {
        if (i === pages + 1) {//turn it back AFTER it ran through all pages
            i = 1
        }
        innerC.empty();
        getQuote(`https://api.quotable.io/quotes?page=${i++}tags=inspirational|technology&maxLength=70`);
    }, 1000 * 60 * 10); //10 minutes

    /* loader */
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

    //dark mode
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            setDarkImgs();
            localStorage.setItem('theme', 'dark');
        }
        else {
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
        $('body').css('background-image', 'url(items/asfalt-light.png)');
        $('.edu').css('background-image', 'url(items/asfalt-light.png)');
        $('.img-fluid').attr('src', 'items/iHnew-light.png');
        $('#linked').attr('src', 'items/pics/icons8-linkedin-50-lt.png');
        $('#git').attr('src', 'items/pics/icons8-github-30-lt.png');
    }

    /* navbar on scroll behaviour */
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
        if (scrollTop > lastScrollTop) {
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

    //contact me button to highlight hubspot
    let works = true;
    $('#contact').on('click', () => {
        if (works) {
        $('#hubspot').css({'display': 'block'});
        works = false;
        setTimeout(() => {
            $('#hubspot').css({'display': 'none'});
            works = true;
        }, 3500);
        }
        
    });

    //css animation on scroll
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('edu-animation');
        });
    });

    observer.observe(document.querySelector('.edu-box'));

    //title
    const t = ['Hello World', "I'm Isaac Herbst", 'FullStack Software Developer',"You've come to the right place", 'HELLOOO', 'A CHANGING TAB!', 'How often do you see that!!', 'Drop me a line', 'Click that green button', 'on the bottom right of the page', 'KIT'];
    setInterval(() => {
        document.title = `${t[i++]}`;
        if (i === t.length) {
            i = 0;
        }
    }, 2500);


}());


/*     ///a little buggy
const catchMe = document.getElementById("catchMe");
catchMe.style.top = '41px';
catchMe.style.right = '638px';
catchMe.style.zIndex = 1;

let clicked = false;
let blink;

function startPosition(){
    setTimeout(()=>{
        clearInterval(blink);
        catchMe.style.top = '41px';
        catchMe.style.right = '638px';
        catchMe.style.zIndex = 1;
        catchMe.style.fontSize = "1em";
        catchMe.style.height = "41px";
        catchMe.style.paddingTop = ".5rem";
        catchMe.style.borderRadius = "10px";
        catchMe.style.backgroundColor = "inherit";
        if(clicked){
            catchMe.style.width = "200px";
            catchMe.innerText = "Wanna try again?";
            clicked = false;
        }else{
            catchMe.style.width = "150px";
            catchMe.innerText = "Try Again!!";
        }
    }, !clicked ? 500 : 2000);
}

function move(){
    catchMe.style.top = `${stayOnScreenX(parseInt(catchMe.style.top) + rand(), catchMe.style.top)}px`;
    catchMe.style.right = `${stayOnScreenY(parseInt(catchMe.style.right) + rand(), catchMe.style.right)}px`;
    catchMe.innerText = "You can't catch me!!";
    catchMe.style.fontSize = "0.9em";
    catchMe.style.width = "90px";
    catchMe.style.height = "90px";
    catchMe.style.borderRadius = "45px";
}

 function stayOnScreenX(num, position){
    let newNum = num;
    while(newNum > (window.innerHeight - 50) || newNum < 20){
        newNum = parseInt(position) + rand();
    }
     return newNum;
 }
 function stayOnScreenY(num, position){
    let newNum = num;
    while(newNum > window.innerWidth - 220 || newNum < 20){
        newNum = parseInt(position) + rand();
    }
     return newNum;
 }

 function caught(){
    catchMe.style.paddingTop = "20px";
    catchMe.innerText = "You Got Me!!";
    const colors = ["#594922", "#4dd897"];
    let i = 0;
    blink = setInterval(()=>{
        if(i === 0 ){i = 1;} else {i = 0;}
        catchMe.style.backgroundColor = colors[i];
    },300);
    clicked = true;
 }

let timeout;
catchMe.addEventListener('mouseleave',()=>{
    //should return to start position after 2 sec of inaction
    timeout = setTimeout(() => {
        startPosition();
      }, 2000);
     });
catchMe.addEventListener('mouseenter', ()=>{
    clearTimeout(timeout);
    if(!clicked){
        move();
    }

});

catchMe.addEventListener('click', caught);


function rand(){
    if (Math.random() > 0.4){
        return Math.floor(Math.random() * 500);
    }else{
        return -Math.floor(Math.random() * 500);
    }
} */