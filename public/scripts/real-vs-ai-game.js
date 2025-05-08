// TODO: Upload the images to the page and create a function to load them
// Keep track of score after each round
// Function to provide hints (For now, hints will be linked to the round)
const totalRounds = 10; 
let currentRound = 0;


// Where we will store the image URLs each round
let realImageUrl = '';
let aiImageUrl = '';
let selectedImage = null;
let progressBarFull;



// Function to highlight the selected image
function selectImage(image) {

    // Make sure to remove the highlight from any previously selected image
    if (selectedImage) {
        selectedImage.classList.remove('border-highlight');
    }
    selectedImage = image;
    selectedImage.classList.add('border-highlight');
}

function updateProgressBar() {
    const progressText = document.getElementById('progress-text');

    progressBarFull.style.width = `${(currentRound / totalRounds) * 100}%`;
    progressText.innerText = `Round ${currentRound}/${totalRounds}`;
}

// Function to submit the answer 
function submitAnswer() {
    if (!selectedImage) {
        alert('Please select an image before submitting your answer.');
        return;
    }

    const isReal = selectedImage.id === 'real-image';
    alert(isReal ? 'Correct! You selected the real image.' : 'Wrong! That was the AI-generated image.');

    currentRound++;
    if (currentRound < totalRounds)
        {
            selectedImage = null;
            updateProgressBar(); // Update progress bar and round counter
        //loadImages(); Function to load new images for the next round (not implemented)
    } else {
        window.location.href = '/leaderboard.html'; 
    }
}

function startTimer(duration) {
    const timerElement = document.getElementById('timer');
    let timeRemaining = duration;

    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        // Update timer display
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up!');
            window.location.href = '/leaderboard.html'; 
        }

        timeRemaining--;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    progressBarFull = document.getElementById('progress-bar-full');
    const tenMinutes = 10 * 60; // 10 minutes 
    startTimer(tenMinutes);
    //loadImages(); Function to load images at the start of the game (not implemented)
    

    document.getElementById('real-image').addEventListener('click', function() {
        selectImage(this);
    });

    document.getElementById('ai-image').addEventListener('click', function() {
        selectImage(this);
    });

    document.getElementById('submit-answer').addEventListener('click', submitAnswer);

    progressBarFull.style.width = '0%'; 
});