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

// Function to load images from the database and display them on the page
async function fetchImage(type) {
    const response = await fetch(`/api/image/${type}`);
    const data = await response.json();
    return data.url;
}
  
// Function to set the image URLs for the game
// This function will be called when the game starts and after each round
async function loadImages() {
    realImageUrl = await fetchImage('real');
    aiImageUrl = await fetchImage('ai');
  
    console.log("Real Image:", realImageUrl);
    console.log("AI Image:", aiImageUrl);
}


// Function to create outline around the selected image
function selectImage(image) {
    if (!image || !(image instanceof HTMLElement)) {
        console.error('Invalid image element provided.');
        return;
    }

    // Make sure to remove the highlight from any previously selected image
    if (selectedImage) {
        selectedImage.classList.remove('outline', 'outline-8', 'outline-lime-400', 'rounded-lg', 'shadow-lg');
    }
    selectedImage = image;
    selectedImage.classList.add('outline', 'outline-8', 'outline-lime-400', 'rounded-lg', 'shadow-lg');
}

// Function to clear the selection (remove the outline)
function clearSelection()
{
    // if the element on the page is in the game-image class, remove the outline
    const gameImages = document.querySelectorAll('.game-image');
    gameImages.forEach(image => {
        image.classList.remove('outline', 'outline-8', 'outline-lime-400', 'rounded-lg');
    });
    selectedImage = null;   
}

// Function to update the progress bar and round counter
// This function will be called after each round
function updateProgressBar() {
    const progressText = document.getElementById('progress-text');

    progressBarFull.style.width = `${(currentRound / totalRounds) * 100}%`;
    progressText.innerText = `Round ${currentRound}/${totalRounds}`;

    clearSelection(); // Clear the selection after updating the progress bar
}

// Function to submit the answer 
async function submitAnswer() {
    if (!selectedImage) {
        alert('Please select an image before submitting your answer.');
        return;
    }

    const isReal = selectedImage.id === 'real-image';

    if (isReal) {
        // If the selected image is the real one, update the score
        // score += 1; // Assuming you have a score variable to keep track of the score
    } else {
        // If the selected image is the AI-generated one, do not update the score
    }

    alert(isReal ? 'Correct! You selected the real image.' : 'Wrong! That was the AI-generated image.');

    currentRound++;
    if (currentRound < totalRounds)
        {
            selectedImage = null;
            // Update progress bar and round counter
            updateProgressBar();

            // Load new images for the next round
            await loadImages();

            // Update the image srcs
            document.getElementById('real-image').src = realImageUrl;
            document.getElementById('ai-image').src = aiImageUrl;

    } else {
        window.location.href = '/leaderboard.html'; 
    }
}

// Starts the timer based on the duration provided
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

// Starts the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async() => {
    progressBarFull = document.getElementById('progress-bar-full');
    const tenMinutes = 10 * 60; // 10 minutes 
    startTimer(tenMinutes);

    await loadImages();  // Load images for the first round
    
    document.getElementById('real-image').src = realImageUrl;
    document.getElementById('ai-image').src = aiImageUrl;

    document.getElementById('real-image').addEventListener('click', function() {
        selectImage(this);
    });

    document.getElementById('ai-image').addEventListener('click', function() {
        selectImage(this);
    });

    document.getElementById('submit-answer').addEventListener('click', submitAnswer);

    progressBarFull.style.width = '0%'; 
});