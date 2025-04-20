'use strict';

let main = document.getElementById('main');
let textContainer = document.getElementById('text-container');
let resultsContainer = document.getElementById('results');
let wpmText = document.getElementById('wpm');
let accuracyText = document.getElementById('accuracy');
let timeText = document.getElementById('time');

let leaderboardHtmlArr = [
    document.getElementsByClassName('leaderboard-first'),
    document.getElementsByClassName('leaderboard-second'),
    document.getElementsByClassName('leaderboard-third'),
];
let reloadButton = document.getElementById('reload-button');
const invalidKeys = 'F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Escape Tab CapsLock Shift Control Alt Meta ArrowLeft ArrowRight ArrowDown ArrowUp Enter'.split(
    ' ',
);
const text =
    'I hope your day is going well. Thanks for trying out my typing test. Did you know that this project was actually made for my website? It is a simple typing test that allows you to test your typing speed and accuracy. I hope you enjoy using it!';
const textArr = text.split('');
const htmlArr = textArr.map((item, index, array) => {
    if (item === ' ') {
        return `<span class="space" id="span${index}">${item}</span>`;
    }
    return `<span class="char" id="span${index}">${item}</span>`;
});
let errors = [];
textContainer.innerHTML = htmlArr.join('');
let firstTime = true;
let currentPos = 0;
let backspaceNeeded = false;
let currentTime = 0;
let repeat;
let testEnded = false; // Add a flag to track if the test has ended

document.addEventListener('keydown', event => {
    if (testEnded) return; // Don't process keys if the test has ended
    
    if (event.key === ' ') {
        event.preventDefault();
    }
    if (firstTime) {
        firstTime = false;
        repeat = setInterval(() => currentTime++, 1000);
    }
    if (event.location === 0 && !invalidKeys.includes(event.key)) {
        handleKey(event.key);
    }
});

reloadButton.addEventListener('click', () => handlePlayAgain());

function handleKey(key) {
    let span = document.getElementById(`span${currentPos}`);
    if (!span) return; // Guard against null span
    
    if (!backspaceNeeded) {
        if (key === textArr[currentPos]) {
            span.style.color = 'green';
            currentPos++;
        } else {
            if (textArr[currentPos] === ' ') {
                span.style.backgroundColor = 'red';
            } else {
                span.style.color = 'red';
            }
            backspaceNeeded = true;
            errors.push(textArr[currentPos]);
        }
    } else {
        if (key === 'Backspace') {
            if (textArr[currentPos] === ' ') {
                span.style.backgroundColor = 'transparent';
            } else {
                span.style.color = 'black';
            }
            backspaceNeeded = false;
        }
    }
    if (currentPos === textArr.length) {
        clearInterval(repeat);
        testEnded = true; // Set the flag to indicate test has ended
        handleEnd();
        return;
    }
}

function handleEnd() {
    let wpm = Math.floor(textArr.length / 5 / (currentTime / 60));
    let accuracy = Math.floor(
        ((textArr.length - errors.length) / textArr.length) * 100,
    );
    let multiples = Math.floor(currentTime / 60);
    let seconds = currentTime - multiples * 60;
    wpmText.innerHTML = `${wpm} wpm`;
    accuracyText.innerHTML = `${accuracy}%`;
    timeText.innerHTML = `${multiples} m ${seconds} s`;

    // Check if localstorage exists and handle scoresArr properly
    let scoresArr = [];
    if (localStorage.getItem('scoresArr')) {
        try {
            scoresArr = JSON.parse(localStorage.getItem('scoresArr'));
            if (!Array.isArray(scoresArr)) {
                scoresArr = []; // Ensure it's an array
            }
        } catch (e) {
            scoresArr = []; // If parsing fails, start with empty array
        }
    }
    
    scoresArr.push({
        wpm: wpm,
        accuracy: accuracy,
        minutes: multiples,
        seconds: seconds,
    });
    scoresArr.sort((a, b) => b.wpm - a.wpm);
    let leaderboardArr = scoresArr.slice(0, 3);
    localStorage.setItem('scoresArr', JSON.stringify(leaderboardArr));

    // Update leaderboard safely
    leaderboardArr.forEach((item, index) => {
        if (index < leaderboardHtmlArr.length) {
            let arr = leaderboardHtmlArr[index];
            if (arr[0]) arr[0].innerHTML = `${item.wpm} wpm`;
            if (arr[1]) arr[1].innerHTML = item.wpm;
            if (arr[2]) arr[2].innerHTML = `${item.accuracy}%`;
            if (arr[3]) arr[3].innerHTML = `${item.minutes} m ${item.seconds} s`;
        }
    });
    
    main.style.display = 'none';
    resultsContainer.style.display = 'flex';
}

function handlePlayAgain() {
    // reset variables
    errors = [];
    firstTime = true;
    currentPos = 0;
    backspaceNeeded = false;
    currentTime = 0;
    testEnded = false; // Reset the test ended flag
    repeat = null;

    // reset the colors
    for (let i = 0; i < htmlArr.length; i++) {
        let span = document.getElementById(`span${i}`);
        if (span) {
            span.style.color = 'black';
            span.style.backgroundColor = 'transparent';
        }
    }

    // change displays
    main.style.display = 'block';
    resultsContainer.style.display = 'none';
}

function clearStorage() {
    localStorage.clear();

    leaderboardHtmlArr.forEach((item) => {
        if (item[0]) item[0].innerHTML = 'none';
        if (item[1]) item[1].innerHTML = 'none';
        if (item[2]) item[2].innerHTML = 'none';
        if (item[3]) item[3].innerHTML = 'none';
    });
}