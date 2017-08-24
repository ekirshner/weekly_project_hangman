const express = require('express');
const mustache = require('mustache-express');
const fs = require('fs');
const bodyparser = require('body-parser');
const session = require('express-session');

const server = express();

// Set up mustache
server.engine('mustache', mustache());
server.set('views', './templates');
server.set('view engine', 'mustache');

//Link CSS
server.use(express.static('templates'));

//Set up body-parser
server.use(bodyparser.urlencoded({ extended: false }));

//Set up session
server.use(session({
    secret: 'anything you want',
    resave: false,
    saveUninitialized: true,
}));

//Grab word from dictionary
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");


//Set up homepage
server.get('/', function (request, response) {
    if (request.session.word === undefined) {
        
        request.session.word = words[Math.floor(Math.random()*words.length)].split('');
        request.session.guessedLettersArray = [];
        request.session.answerArray = [];
        request.session.guessCount = 8;  
        request.session.gameStatus = "Can you guess my word?";
    }
//Store the sessions in variables for readability
    
// let word = request.session.word;
let word = []
let answerArray = request.session.answerArray
    for(let i = 0; i < request.session.word.length; i++ ) {
        word.push(request.session.word[i]);
        answerArray.push('_');
    }
    
    let guessedLettersArray = request.session.guessedLettersArray;
    let guessCount = request.session.guessCount;
    let gameStatus = request.session.gameStatus;

    response.render('hangman', {
        answerArray: answerArray,
        gameStatus: gameStatus,
        guessCount: guessCount,
        guessedLettersArray: guessedLettersArray
    });
});

//Getting the words file
// const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");


//Route: 
server.post('/', function (request, response) {
    //Re-store the sessions in variables for the scope of the post route
    let word = request.session.word;
    let guessedLettersArray = request.session.guessedLettersArray;
    let answerArray = request.session.answerArray;
    let guessCount = request.session.guessCount;
    let gameStatus = request.session.gameStatus;

    let letter = request.body.guessedLetter
    let guessedCorrectly = false;
    let alreadyGuessed = false;
    let guessedLetterAlready = '';
    let playAgain = false;


    //Loop through the array to see if the guessed letter is in the word
    for (let i = 0; i < word.length; i++) {

        if (letter === word[i]) {
            //If there's a match, replace the answerArray index with the guessed letter  
            guessedCorrectly = true;
            answerArray[i] = word[i];
        }
    }
    //If it's not a match, do the following:
    if (guessedCorrectly === false) {

        //Loop through guessedAnswersArray to see if the letter has already been guessed. If so, ask the user to guess again and do not decrease the guess count
        for (let i = 0; i < guessedLettersArray.length; i++) {
            if (letter === guessedLettersArray[i]) {
                alreadyGuessed = true;
                guessedLetterAlready = "You've already guessed that letter. Please try again." 
            }
        }

        //If letter has not been guessed, decrease guess count by 1 each time & push it to the guessedLettersArray
        if (alreadyGuessed === false) {
             
            guessedLettersArray.push(letter);
            if (request.session.guessCount !== 0) {
                request.session.guessCount--;
            }
        }
        //If you run out of guesses, you lose! Ask if user wants to play again
        if (request.session.guessCount === 0) {
            gameStatus = 'You lose!'
            answerArray = word;
            playAgain = true;
        }

    } else {
        //Check answerArray to see if it matches word array. If so, you win! Ask if user wants to play again
        if (answerArray.join('') === word.join('')) {
            console.log('success')
            gameStatus = "Congratulations, you win!"
            playAgain = true;

        }
    }
    // Render all of the below regardless of what's happening above
    response.render('hangman', {
        guessedLetterAlready: guessedLetterAlready,
        guessedLettersArray: guessedLettersArray,
        gameStatus: gameStatus,
        answerArray: answerArray,
        guessCount: request.session.guessCount,
        playAgain: playAgain
    })
});

//Would you like to play again? If yes, delete sessions and redirect back to / page
server.post('/restart', function (request, response) {
    request.session.destroy(); 
    response.redirect('/');
});

// Set up server
server.listen(3000, function () {
    console.log("and we're LIVE");
});


