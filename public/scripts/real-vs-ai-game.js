// TODO: Upload the images to the page and create a function to load them
// Keep track of score after each round

// Function to provide hints (For now, hints will be linked to the round)
const totalRounds = 10;
let currentRound = 0;

let nextRealImageUrl = '';
let nextAiImageUrl = '';

let score = 0; // Initialize score variable

// Where we will store the image URLs each round
let realImageUrl = '';
let aiImageUrl = '';

// This will be updated to be either game-image1 or game-image2
// depending on which one is the real image 
let realImage = null;

let selectedImage = null;
let progressBarFull;




// stores images that have already been used
let usedImages = [];

// Update with the size of the images in the database (This feature may be hard to scale tbh)
const IMAGES_SIZE = 20;


// Function to load images from the database and display them on the page
async function fetchImage(type) {
    const response = await fetch(`/api/image/${type}`);
    const data = await response.json();

    // Check if the image URL is already used
    if (usedImages.includes(data.url)) {
        // If the image is already used, fetch a new one, if there are no more images, return a placeholder image
        if (usedImages.length >= IMAGES_SIZE) {
            console.log('Image databank exhausted, using placeholder image.');
            return '/placeholder.png'; // Placeholder image URL
        }
        console.log(`Image already used: trying again...`);
        // Recursively call fetchImage to get a new image
        return fetchImage(type);
    }
    // Add the image URL to the used images array
    usedImages.push(data.url);
    return data.url;
}

// Function to set the image URLs for the game
// This function will be called when the game starts and after each round
async function loadImages() {
    realImageUrl = await fetchImage('real');
    aiImageUrl = await fetchImage('ai');
}

// Function to preload the next 2 images
async function preloadNextImages() {
    nextRealImageUrl = await fetchImage('real');
    nextAiImageUrl = await fetchImage('ai');
}

// Function to refresh the images (game-image1 and game-image2) 
// by randomly selecting which image to be the real one.
async function refreshImages() {

    // Preload the next round's images
    await preloadNextImages();

    console.log('Real Image URL:', realImageUrl);
    console.log('AI Image URL:', aiImageUrl);

    // Randomly assign images to game-image1 and game-image2
    const randomIndex = Math.floor(Math.random() * 2);
    const gameImage1 = document.getElementById('game-image1');
    const gameImage2 = document.getElementById('game-image2');

    if (randomIndex === 0) {
        gameImage1.src = realImageUrl;
        gameImage2.src = aiImageUrl;

        realImage = 'game-image1'; // Set the real image to game-image1
    } else {
        gameImage1.src = aiImageUrl;
        gameImage2.src = realImageUrl;

        realImage = 'game-image2'; // Set the real image to game-image2
    }
        // Use preloaded images for the next round
    realImageUrl = nextRealImageUrl;
    aiImageUrl = nextAiImageUrl;

    console.log('here!');
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
function clearSelection() {
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
    progressText.innerText = `Round ${currentRound + 1}/${totalRounds}`;

    clearSelection(); // Clear the selection after updating the progress bar
}

// Function to submit the answer 
async function submitAnswer() {
    if (!selectedImage) {
        alert('Please select an image before submitting your answer.');
        return;
    }

    // Check if the selected image is the real one, this is set in the refreshImages function
    const isReal = selectedImage.id === realImage;

    if (isReal) {
        // If the selected image is the real one, update the score
        score += 1;
    }

    roundAlert(isReal); // Show the round alert based on the user's selection
}

// Function to change the text of the round popup based on if the user is correct or not
function roundAlert(isReal) {

    // un hidden the popup
    const popup = document.getElementById('popup');
    popup.classList.remove('hidden');

    const popupTitle = document.getElementById('popup-title');
    popupTitle.innerText = isReal ? 'Correct!' : 'Wrong!';

    const popupMessage = document.getElementById('popup-message');
    popupMessage.innerText = isReal ? 'You selected the real image!' : 'That was the AI-generated image.';
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.add('hidden');
}

// Function to go to the next round
function nextRound() {
    currentRound++;
    if (currentRound < totalRounds) {
        updateProgressBar();
        refreshImages();
        closePopup(); // Close the popup after the user clicks next
    } else {
        window.location.href = '/leaderboard.html'; //TODO Use a route to redirect to the leaderboard instead, remove alert.
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
            window.location.href = '/leaderboard.html'; //TODO Use a route to redirect to the leaderboard instead, remove alert.
        }

        timeRemaining--;
    }, 1000);
}

// Starts the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    progressBarFull = document.getElementById('progress-bar-full');
    const tenMinutes = 10 * 60; // 10 minutes 
    startTimer(tenMinutes);

    // Preload the first set of images
    await loadImages();

    refreshImages(); // Refresh the images to display them on the page

    document.getElementById('game-image1').addEventListener('click', function () {
        selectImage(this);
    });

    document.getElementById('game-image2').addEventListener('click', function () {
        selectImage(this);
    });

    document.getElementById('submit-answer').addEventListener('click', submitAnswer);

    document.getElementById('next-button').addEventListener('click', nextRound);

    progressBarFull.style.width = '0%';
});