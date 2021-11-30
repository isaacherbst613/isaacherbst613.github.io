(function () {
    'use strict';

    ///intake form input, update page copy, add links, 
    //add comments to this js file

    const page = $("#main");//backround-color-changing container
    const mainButtons = $(".bottomMain :button");//container buttons
    const text = $('.mtext')//container text
    const start = $("#btn");//start button
    const restrt = $("#restart");//restart button
    const rcd = $("#rcd-btn");//record button
    //left sidebar colors
    const green = $("#green");
    green.scale = 0;
    const red = $("#red");
    red.scale = 0;
    const blue = $("#blue");
    blue.scale = 0;

    const veiwedTbl = get("veiwed");//table for reviewed colors
    const displayBox = get("veiwer");//box to compare text/backround

    function rgb(r, g, b) {
        return `rgb(${r},${g},${b})`;
    }

    let r = 0, g = 0, b = 0, i = 1;
    page.css('background-color', rgb(r, g, b));
    function changeColors() {
        if (i <= 255) {
            r++;//f00
        } else if (i <= 510) {
            r--;//0f0
            g++;
        } else if (i <= 765) {
            r++;//ff0
        } else if (i <= 1020) {
            g--;//00f
            r--;
            b++;
        } else if (i <= 1275) {
            r++;//f0f
        } else if (i <= 1530) {
            r--;//0ff
            g++;
        } else if (i <= 1785) {
            r++;//fff
        } else if (i <= 2040) {
            r--;
            g--;
            b--;//000
        }
        else if (i === 2041) {
            i = 1;
        }
        growHighlighted(r, g, b);
        i++;
        page.css('background-color', rgb(r, g, b));
        mainContainerTextColor(checkBrightness(r, g, b));
    }

    function highlighter(rgb, clr) {
        clr.scale = rgb / 255;
        clr.css('transform', `scale(${clr.scale})`);
    }
    function growHighlighted(r, g, b) {
        highlighter(r, red);
        highlighter(g, green);
        highlighter(b, blue);
    }
    function restartHighlighted(clr) {
        clr.scale = 0;
        clr.css('transform', `scale(0)`);
    }

    function checkBrightness(r, g, b) {
        let brightness = (Math.sqrt(
            r * r * .241 +
            g * g * .691 +
            b * b * .068));

        if (brightness > 130) {
            return true;
        } else {
            return false;
        }

        //based on this = https://www.nbdtech.com/Blog/archive/2008/04/27/Calculating-the-Perceived-Brightness-of-a-Color.aspx
    }

    function mainContainerTextColor(bright) {
        if (bright) {
            text.css('color', 'black');
            mainButtons.removeClass('btn-outline-light');
            mainButtons.addClass('btn-outline-dark');
        } else {
            text.css('color', 'white');
            mainButtons.removeClass('btn-outline-dark');
            mainButtons.addClass('btn-outline-light');
        }
    }

    let inter;
    let notAtstart = false;
    start.on('click', () => {
        if (notAtstart) {
            restart();
            notAtstart = false;
        }

        if (!inter) {
            inter = setInterval(changeColors, 20);
            start.text('stop');
        } else {
            clearInterval(inter);
            inter = null;
            start.text('start');
        }
    });

    restrt.on('click', () => {
        restart();
    });
    function restart() {
        r = 0; g = 0; b = 0; i = 0;
        page.css('background-color', rgb(r, g, b));
        restartHighlighted(red);
        restartHighlighted(green);
        restartHighlighted(blue);
        mainContainerTextColor(checkBrightness(r, g, b));
    }


    //save all recorded colors in veiwedTbl
    rcd.on('click', () => {
        const clickedData = {
            color: page.css('background-color')
        };
        updateViewedTbl(clickedData);
    });


    //handle display buttons
    const display = get("display");//display button
    display.addEventListener('click', (event) => {
        event.preventDefault();//so page should'nt refresh
        const i1 = get("input1").value;
        const i2 = get("input2").value;
        const i3 = get("input3").value;

        if (i1 > 255 || i2 > 255 || i3 > 255 || i1 === "" || i2 === "" || i3 === "" || i1 < 0 || i2 < 0 || i3 < 0) {
            alert("please enter valid color numbers (0 - 255)");
        } else {
            const clickedData = {
                color: rgb(i1, i2, i3)
            };
            notAtstart = true;
            growHighlighted(i1, i2, i3);
            updatePageOnDisplayBtnClick(clickedData);
        }
    });

    const inputcolor = $("#inputcolor");
    const inputColorButton = $("#display2");

    inputColorButton.on('click', (event) => {
        event.preventDefault();//so page should'nt refresh

        if (!color(inputcolor.val())) {
            alert("please enter valid css color, please note that your chosen color might not be recognised by this software");
        } else {
            const clickedData = {
                color: color(inputcolor.val())
            };
            updatePageOnDisplayBtnClick(clickedData);
            ({ r, g, b } = getRGBValues(clickedData.color));
            growHighlighted(r, g, b);
            notAtstart = true;
        }

    });

    let data = []
    function updateViewedTbl(clickedData) {
        const textbtn = document.createElement('button');
        textbtn.className = 'btn';
        textbtn.innerText = "text";

        const dbtn = document.createElement('button');
        dbtn.className = 'btn';
        dbtn.innerText = "backround";

        const removebtn = document.createElement('button');
        removebtn.className = 'btn';
        removebtn.innerHTML = '<img src="/items/pics/trash.png" width="20px" alt="delete">';

        const row = veiwedTbl.insertRow();
        const c = row.insertCell();
        c.style.backgroundColor = clickedData.color;
        c.innerText = clickedData.color;
        const cell2 = row.insertCell();
        cell2.style.backgroundColor = clickedData.color;
        cell2.appendChild(textbtn);
        cell2.appendChild(dbtn);
        cell2.appendChild(removebtn);

        ({ r, g, b } = getRGBValues(clickedData.color));
        if (checkBrightness(r, g, b)) {
            row.style.color = 'black';
        } else {
            row.style.color = 'white';
        }

        dbtn.addEventListener('click', () => {
            displayBox.style.backgroundColor = clickedData.color;
        });

        textbtn.addEventListener('click', () => {
            displayBox.style.color = clickedData.color;
        });

        removebtn.addEventListener('click', () => {
            row.remove();
        });
        data.push(clickedData);
        localStorage.setItem('viewed_colors', JSON.stringify(data));
    }
    function reassignStorage(){
        data = JSON.parse(localStorage.getItem('viewed_colors')) || [];
        data.forEach(e=>{
            updateViewedTbl(e);
            console.log(e);
        });
    }
    reassignStorage();

    function updatePageOnDisplayBtnClick(clickedData) {
        page.css('background-color', clickedData.color);
        ({ r, g, b } = getRGBValues(clickedData.color));
        mainContainerTextColor(checkBrightness(r, g, b));
        updateViewedTbl(clickedData);
        clearInterval(inter);
        inter = null;
        start.text('start');
    };


    //for color input (translate text to rgb)
    function color(input) {
        //found this map online
        const wordToHex = {
            aliceblue: "#F0F8FF",
            antiquewhite: "#FAEBD7",
            aqua: "#00FFFF",
            aquamarine: "#7FFFD4",
            azure: "#F0FFFF",
            beige: "#F5F5DC",
            bisque: "#FFE4C4",
            black: "#000000",
            blanchedalmond: "#FFEBCD",
            blue: "#0000FF",
            blueviolet: "#8A2BE2",
            brown: "#A52A2A",
            burlywood: "#DEB887",
            cadetblue: "#5F9EA0",
            carmine: "#960018",
            chartreuse: "#7FFF00",
            chocolate: "#D2691E",
            coral: "#FF7F50",
            cornflowerblue: "#6495ED",
            cornsilk: "#FFF8DC",
            crimson: "#DC143C",
            cyan: "#00FFFF",
            darkblue: "#00008B",
            darkcyan: "#008B8B",
            darkgoldenrod: "#B8860B",
            darkgray: "#A9A9A9",
            darkgrey: "#A9A9A9",
            darkgreen: "#006400",
            darkkhaki: "#BDB76B",
            darkmagenta: "#8B008B",
            darkolivegreen: "#556B2F",
            darkorange: "#FF8C00",
            darkorchid: "#9932CC",
            darkred: "#8B0000",
            darksalmon: "#E9967A",
            darkseagreen: "#8FBC8F",
            darkslateblue: "#483D8B",
            darkslategray: "#2F4F4F",
            darkslategrey: "#2F4F4F",
            darkturquoise: "#00CED1",
            darkviolet: "#9400D3",
            deeppink: "#FF1493",
            deepskyblue: "#00BFFF",
            dimgray: "#696969",
            dimgrey: "#696969",
            dodgerblue: "#1E90FF",
            firebrick: "#B22222",
            floralwhite: "#FFFAF0",
            forestgreen: "#228B22",
            fuchsia: "#FF00FF",
            gainsboro: "#DCDCDC",
            ghostwhite: "#F8F8FF",
            gold: "#FFD700",
            goldenrod: "#DAA520",
            gray: "#808080",
            grey: "#808080",
            green: "#00ff00",
            greenyellow: "#ADFF2F",
            honeydew: "#F0FFF0",
            hotpink: "#FF69B4",
            indianred: "#CD5C5C",
            indigo: "#4B0082",
            ivory: "#FFFFF0",
            khaki: "#F0E68C",
            lavender: "#E6E6FA",
            lavenderblush: "#FFF0F5",
            lawngreen: "#7CFC00",
            lemonchiffon: "#FFFACD",
            lightblue: "#ADD8E6",
            lightcoral: "#F08080",
            lightcyan: "#E0FFFF",
            lightgoldenrodyellow: "#FAFAD2",
            lightgray: "#D3D3D3",
            lightgrey: "#D3D3D3",
            lightgreen: "#90EE90",
            lightpink: "#FFB6C1",
            lightsalmon: "#FFA07A",
            lightseagreen: "#20B2AA",
            lightskyblue: "#87CEFA",
            lightslategray: "#778899",
            lightslategrey: "#778899",
            lightsteelblue: "#B0C4DE",
            lightyellow: "#FFFFE0",
            lime: "#00FF00",
            limegreen: "#32CD32",
            linen: "#FAF0E6",
            magenta: "#FF00FF",
            maroon: "#800000",
            mediumaquamarine: "#66CDAA",
            mediumblue: "#0000CD",
            mediumorchid: "#BA55D3",
            mediumpurple: "#9370DB",
            mediumseagreen: "#3CB371",
            mediumslateblue: "#7B68EE",
            mediumspringgreen: "#00FA9A",
            mediumturquoise: "#48D1CC",
            mediumvioletred: "#C71585",
            midnightblue: "#191970",
            mintcream: "#F5FFFA",
            mistyrose: "#FFE4E1",
            moccasin: "#FFE4B5",
            navajowhite: "#FFDEAD",
            navy: "#000080",
            oldlace: "#FDF5E6",
            olive: "#808000",
            olivedrab: "#6B8E23",
            orange: "#FFA500",
            orangered: "#FF4500",
            orchid: "#DA70D6",
            palegoldenrod: "#EEE8AA",
            palegreen: "#98FB98",
            paleturquoise: "#AFEEEE",
            palevioletred: "#DB7093",
            papayawhip: "#FFEFD5",
            peachpuff: "#FFDAB9",
            peacockblue: "#326872",
            peru: "#CD853F",
            pink: "#FFC0CB",
            plum: "#DDA0DD",
            powderblue: "#B0E0E6",
            purple: "#800080",
            rebeccapurple: "#663399",
            red: "#FF0000",
            rosybrown: "#BC8F8F",
            royalblue: "#4169E1",
            saddlebrown: "#8B4513",
            salmon: "#FA8072",
            sandybrown: "#F4A460",
            seagreen: "#2E8B57",
            seashell: "#FFF5EE",
            sienna: "#A0522D",
            silver: "#C0C0C0",
            skyblue: "#87CEEB",
            slateblue: "#6A5ACD",
            slategray: "#708090",
            slategrey: "#708090",
            snow: "#FFFAFA",
            springgreen: "#00FF7F",
            steelblue: "#4682B4",
            tan: "#D2B48C",
            teal: "#008080",
            thistle: "#D8BFD8",
            tomato: "#FF6347",
            turquoise: "#40E0D0",
            violet: "#EE82EE",
            wheat: "#F5DEB3",
            white: "#FFFFFF",
            whitesmoke: "#F5F5F5",
            yellow: "#FFFF00",
            yellowgreen: "#9ACD32",
        };

        const fromWord = (word) => {
            let nword = word.replace(/\s+/g, '');//remove spaces from 2 word colors
            return wordToHex[nword.toLowerCase()];
        };

        const Frgb = htr(fromWord(input));
        if (Frgb) {
            return `rgb(${Frgb.r},${Frgb.g},${Frgb.b})`;
        } else {
            return false;
        }

    };
    function htr(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const res = result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
        if (res) {
            return { r: res.r, g: res.g, b: res.b };
        } else {
            return false;
        }
    };
    //get values from rgb string
    function getRGBValues(str) {
        let vals = str.substring(str.indexOf('(') + 1, str.length - 1).split(',');
        return {
            'r': vals[0],
            'g': vals[1],
            'b': vals[2]
        };
    }



    //to move balls within containers
    const blackContainer = get("b1");
    const whiteContainer = get("b2");

    //JQueryUI, see below for vanilla JS
    function attachListners(container, div) {
        $(div).draggable({ containment: container });
    }

    for (let i = 0; i < 3; i++) {
        let x = classN(blackContainer, "rgball")[i];
        let z = classN(whiteContainer, "rgball")[i];
        attachListners(blackContainer, x);
        attachListners(whiteContainer, z);
    }

    //make balls darker/lighter

    //get balls
    const bred = get("bred"),
        bgreen = get("bgreen"),
        bblue = get("bblue"),
        bcyan = get("bcyan"),
        bmagenta = get("bmagenta"),
        byellow = get("byellow");

    //get buttons and apply listeners and func to change it's backgroundColor
    const redbtns = get('redgrp');
    bred.func = (x) => { bred.style.backgroundColor = rgb(x, 0, 0); };
    incDecColors(redbtns, bred.func);
    const greenbtns = get('greengrp');
    bgreen.func = (x) => { bgreen.style.backgroundColor = rgb(0, x, 0); };
    incDecColors(greenbtns, bgreen.func);
    const bluebtns = get('bluegrp');
    bblue.func = (x) => { bblue.style.backgroundColor = rgb(0, 0, x); };
    incDecColors(bluebtns, bblue.func);
    const cyanbtns = get('cyangrp');
    bcyan.func = (x) => { bcyan.style.backgroundColor = rgb(x, 0, 0); };
    incDecColors(cyanbtns, bcyan.func);
    const magentabtns = get('magentagrp');
    bmagenta.func = (x) => { bmagenta.style.backgroundColor = rgb(0, x, 0); };
    incDecColors(magentabtns, bmagenta.func);
    const yellowbtns = get('yellowgrp');
    byellow.func = (x) => { byellow.style.backgroundColor = rgb(0, 0, x); };
    incDecColors(yellowbtns, byellow.func);

    //function to lighten/darken color balls
    function incDecColors(btns, elemFunc) {
        let clrCode = 255;
        btns.addEventListener('click', function (e) {
            if (e.target.classList[2] === "increment") {
                clrCode = inc(clrCode);
                console.log(e, " inc ", clrCode);
            } else if (e.target.classList[2] === "decrement") {
                clrCode = dec(clrCode);
                console.log(e, " dec ", clrCode);
            }
            elemFunc(clrCode);
        });
    }
    function inc(rgb) {
        if (rgb <= 250) {
            return rgb += 5;
        }
        return rgb;
    }
    function dec(rgb) {
        if (rgb >= 5) {
            return rgb -= 5;
        }
        return rgb;
    }

    //get color under cursor
    /* there is no real way to do this without experimantel API */

    $('#dropper').click((e) => {
        if (!window.EyeDropper) {
            console.log('Your browser does not support the EyeDropper API');
            return;
        }
        const eyeDropper = new EyeDropper();

        eyeDropper.open().then(result => {
            const Frgb = htr(result.sRGBHex);
            if (Frgb) {
                $('#rgbDrop').text(`rgb(${Frgb.r},${Frgb.g},${Frgb.b})`).show().css('color', result.sRGBHex);
            }
        }).catch(e => {
            console.log(e);
        });
        const esc = $('#esc').show()
        setTimeout(() => {
            esc.fadeOut("slow");
        }, 4000);

    })

    function get(id) {
        return document.getElementById(id);
    }
    function classN(container, name) {
        return container.getElementsByClassName(name);
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

}());



/* const startMoving = function (divId, container, evt) {
    divId.style.cursor = 'move';
    const containerPos = container.getBoundingClientRect();
    //get mouse pos in container
    let posLeft = evt.clientX - containerPos.left,
        posTop = evt.clientY - containerPos.top,
        //get div pos/size
        divTop = parseFloat(getComputedStyle(divId).top),
        divLeft = parseFloat(getComputedStyle(divId).left),
        divW = parseInt(getComputedStyle(divId).width),
        divH = parseInt(getComputedStyle(divId).height),
        //get container size
        containerW = parseInt(getComputedStyle(container).width),
        containerH = parseInt(getComputedStyle(container).height),
        //mouse pos in div
        diffX = posLeft - divLeft,
        diffY = posTop - divTop;
    document.onmousemove = function (evt) {
        let posLeft = evt.clientX - containerPos.left,
            posTop = evt.clientY - containerPos.top,
            //new div pos (relative to mouse)
            aX = posLeft - diffX,
            aY = posTop - diffY;

        if (aX < 0) { aX = 0; }
        if (aY < 0) { aY = 0; }
        if (aX + divW > containerW) { aX = containerW - divW; }
        if (aY + divH > containerH) { aY = containerH - divH; }
        move(divId, aX, aY);
    };
};
const move = function (divId, xpos, ypos) {
    divId.style.left = xpos + 'px';
    divId.style.top = ypos + 'px';
};
const stopMoving = function (divId) {
    divId.style.cursor = 'default';
    document.onmousemove = null;
};

function attachListners(container, div) {
div.addEventListener("mousedown", (e) => startMoving(div, container, e));
    div.addEventListener("mouseup", () => stopMoving(container));
    div.addEventListener("mouseleave", () => stopMoving(container)); */