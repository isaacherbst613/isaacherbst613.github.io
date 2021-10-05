(function(){
    'use strict';

    ///a little buggy
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
}
}());