const totalRounds = 10;
let currentRound = 0;

let progressBarFull;

function submitAnswer() {
    // Get the selected answer
    const selected = document.querySelector('input[name="quiz-answer"]:checked');
    if (!selected) {
        alert('Please select an answer!');
        return;
    }
    const selectedIdx = parseInt(selected.value, 10);
    const isCorrect = selectedIdx === currentQuestion.correctIndex;

    // Show the popup with the result and explanation
    scamQuizAlert(isCorrect, currentQuestion.explanation);
};


// Function to change the text of the scam quiz popup based on if the user is correct or not
function scamQuizAlert(correct, explanation) {
    const popup = document.getElementById('scam-quiz-popup');
    popup.classList.remove('hidden');

    const popupTitle = document.getElementById('scam-quiz-popup-title');
    popupTitle.innerText = correct ? 'Correct!' : 'Not Quite!';

    const popupMessage = document.getElementById('scam-quiz-popup-message');
    popupMessage.innerText = explanation || (correct ? 'Correct!' : 'Wrong!');

    // Animate popup: fade in and scale up
    popup.style.opacity = 0;
    popup.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
        popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        popup.style.opacity = 1;
        popup.style.transform = 'scale(1)';
    });
}

function closeScamQuizAlert() {
    const popup = document.getElementById('scam-quiz-popup');
    // Animate popup: fade out and scale down
    popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    popup.style.opacity = 0;
    popup.style.transform = 'scale(0.95)';
    setTimeout(() => {
        popup.classList.add('hidden');
        // Reset styles for next open
        popup.style.transition = '';
        popup.style.opacity = '';
        popup.style.transform = '';
    }, 250);
}

// Function to show the next round
function nextRound() {

    // Increment the round counter
    currentRound++;
    // Check if the quiz is over
    if (currentRound >= totalRounds) {
        // Show the final result
        alert('Quiz completed! Thank you for participating.');
        // ADD LEADERBOARD FUNCTIONALITY HERE
        return;
    }
    // Update the progress bar
    updateProgressBar();

    // Hide the scam quiz popup
    closeScamQuizAlert();
    // Get the next question
    getQuestion();
}

async function getQuestion() {
    const response = await fetch('/api/scam-quiz');
    if (!response.ok) {
        console.error('Error fetching question:', response.statusText);
        return;
    }
    const data = await response.json();
    currentQuestion = data.question;

    document.getElementById('question-text').innerText = currentQuestion.question;

    // Insert answer options
    const answersDiv = document.getElementById('quiz-answers');
    answersDiv.innerHTML = '';
    currentQuestion.options.forEach((option, idx) => {
        const label = document.createElement('label');
        label.className = 'flex items-center cursor-pointer';
        label.innerHTML = `
            <input type="radio" name="quiz-answer" value="${idx}" class="form-radio text-purple-500 mr-2">
            <span class="text-lg font-medium text-gray-700">${option}</span>
        `;
        answersDiv.appendChild(label);
    });
}

function updateProgressBar() {
    const progressText = document.getElementById('progress-text');

    progressBarFull.style.width = `${(currentRound / totalRounds) * 100}%`;
    progressText.innerText = `Round ${currentRound + 1}/${totalRounds}`;
}

// Function to start the timer
function startTimer(duration) {
    const timerElement = document.getElementById('timer');
    let timeRemaining = duration;

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        // Check if the timer element exists (prevents errors if user navigated away)
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        // Stop the timer and redirect only once
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);

            // Add a slight delay before redirect to avoid race conditions
            setTimeout(() => {
                window.location.href = '/404';
            }, 100);

            return; // Exit early
        }

        timeRemaining--;
    }, 1000);
}


// On page load, set up event listeners
// and initialize the quiz
window.addEventListener('DOMContentLoaded', () => {
    // Initialize the progress bar
    progressBarFull = document.getElementById('progress-bar-full');
    const timeLimit = 10 * 60 // 10 minutes
    startTimer(timeLimit);



    getQuestion();

    document.getElementById('submit-button').addEventListener('click', submitAnswer);
    document.getElementById('next-button').addEventListener('click', nextRound);

    progressBarFull.style.width = '0%';
});
