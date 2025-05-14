// TODO: Keep track of score after each round

// Function to provide hints (For now, hints will be linked to the round)
const totalRounds = 10;
let currentRound = 0;

let nextRealImageObj = '';
let nextAiImageObj = '';

let score = 0; // Initialize score variable

// Where we will store the image URLs each round
let realImageObj = '';
let aiImageObj = '';

let leftImage = null;
let rightImage = null;


// This will be updated to be either game-image1 or game-image2
// depending on which one is the real image 
let realImage = null;

let selectedImage = null;
let progressBarFull;

// This will be used to calculate time taken to complete the game
let gameStartTime = null;

// stores images that have already been used
let usedImages = [];

// Update with the size of the images in the database (This feature may be hard to scale tbh)
const IMAGES_SIZE = 20;


// Function to load images from the database and display them on the page
// Returns an object: { url, description }
async function fetchImage(type) {
    const response = await fetch(`/api/image/${type}`);
    const data = await response.json();

    // Check if the image URL is already used
    if (usedImages.includes(data.url)) {
        // If the image is already used, fetch a new one, if there are no more images, return a placeholder image
        if (usedImages.length >= IMAGES_SIZE) {
            console.log('Image databank exhausted, using placeholder image.');
            return { url: '/placeholder.png', description: 'No description available.' }; // Placeholder
        }
        console.log(`Image already used: trying again...`);
        // Recursively call fetchImage to get a new image
        return fetchImage(type);
    }
    // Add the image URL to the used images array
    usedImages.push(data.url);
    return { url: data.url, description: data.description };
}

// Function to set the image URLs for the game
// This function will be called when the game starts and after each round
async function loadImages() {

    realImageObj = await fetchImage('real');
    aiImageObj = await fetchImage('ai');
}

// Function to preload the next 2 images
async function preloadNextImages() {
    nextRealImageObj = await fetchImage('real');
    nextAiImageObj = await fetchImage('ai');
}

// Function to refresh the images (game-image1 and game-image2) 
// by randomly selecting which image to be the real one.
async function refreshImages() {

    // Preload the next round's images
    await preloadNextImages();

    // Randomly assign images to game-image1 and game-image2
    const randomIndex = Math.floor(Math.random() * 2);
    const gameImage1 = document.getElementById('game-image1');
    const gameImage2 = document.getElementById('game-image2');

    if (randomIndex === 0) {
        gameImage1.src = realImageObj.url;
        gameImage2.src = aiImageObj.url;

        realImage = 'game-image1'; // Set the real image to game-image1

        leftImage = realImageObj;
        rightImage = aiImageObj;
    } else {
        gameImage1.src = aiImageObj.url;
        gameImage2.src = realImageObj.url;

        realImage = 'game-image2'; // Set the real image to game-image2

        leftImage = aiImageObj;
        rightImage = realImageObj;
    }
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
    // Unhide the popup
    const popup = document.getElementById('round-popup');
    popup.classList.remove('hidden');

    const popupTitle = document.getElementById('round-popup-title');
    popupTitle.innerText = isReal ? 'Correct!' : 'Wrong!';

    const popupMessage = document.getElementById('round-popup-message');
    popupMessage.innerText = isReal ? 'You selected the real image!' : 'That was the AI-generated image.';

    // Animate popup: fade in and scale up
    popup.style.opacity = 0;
    popup.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
        popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        popup.style.opacity = 1;
        popup.style.transform = 'scale(1)';
    });
}

function closeRoundPopup() {
    const popup = document.getElementById('round-popup');
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

// Function to show the hint popup with animation
function showHintPopup() {

    // get the hints from the server, ensuring the image on the left is always the first image passed to the function
    getHints(leftImage.description, rightImage.description);

    const hintPopup = document.getElementById('hint-popup');
    hintPopup.classList.remove('hidden');
    hintPopup.style.opacity = 0;
    hintPopup.style.transform = 'scale(0.95)';
    // Animate opacity and scale
    requestAnimationFrame(() => {
        hintPopup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        hintPopup.style.opacity = 1;
        hintPopup.style.transform = 'scale(1)';
    });
}

// Function to close the hint popup with animation
function closeHintPopup() {
    const hintPopup = document.getElementById('hint-popup');
    // Animate opacity and scale down
    hintPopup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    hintPopup.style.opacity = 0;
    hintPopup.style.transform = 'scale(0.95)';
    setTimeout(() => {
        hintPopup.classList.add('hidden');
        // Reset styles for next open
        hintPopup.style.transition = '';
        hintPopup.style.opacity = '';
        hintPopup.style.transform = '';
    }, 250);
}

// Function to go to the next round
/**
 * Advances the game to the next round or ends the game if all rounds are completed.
 * - If there are remaining rounds, it updates the progress bar, refreshes the images, 
 *   and closes the popup.
 * - If all rounds are completed, it calculates the total time taken, submits the 
 *   player's score to the server, and redirects to the leaderboard page.
 */
function nextRound() {
    currentRound++;
    if (currentRound < totalRounds) {
        updateProgressBar();

        // Use preloaded images for the next round
        realImageObj = nextRealImageObj;
        aiImageObj = nextAiImageObj;

        refreshImages();
        closeRoundPopup(); // Close the popup after the user clicks next
    } else {
        // stop the timer when the game is over
        clearInterval(timerInterval);

        const timeTakenInSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

        const scoreData = {
            score: score,
            total: totalRounds,
            timeTaken: timeTakenInSeconds
        };

        console.log("Game over! Your scored : " + score + " out of " + totalRounds + " in " + timeTakenInSeconds + " seconds.");

        if (window.isLoggedIn) {
            console.log("User is logged in. Attempting to send score:", scoreData);
            fetch("/api/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scoreData)
            })
                .then(res => res.text())
                .then(msg => {
                    console.log("Server response:", msg);
                    window.location.href = "/leaderboard"; // Only redirect after score saved
                })
                .catch(err => {
                    console.error("Error submitting score:", err);
                    window.location.href = "/leaderboard"; // Fallback redirect
                });
        } else {
            // If not logged in, still redirect after showing message
            console.log("User not logged in, score not saved.");
            window.location.href = "/leaderboard";
        }
    }
}

let timerInterval;

// Starts the timer based on the duration provided
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
                window.location.href = '/leaderboard';
            }, 100);

            return; // Exit early
        }

        timeRemaining--;
    }, 1000);
}

// Starts the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    progressBarFull = document.getElementById('progress-bar-full');
    const tenMinutes = 10 * 60; // 10 minutes 
    startTimer(tenMinutes);

    // Start the game timer
    gameStartTime = Date.now();

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

    document.getElementById('hint-button').addEventListener('click', showHintPopup);

    document.getElementById('close-hint-button').addEventListener('click', closeHintPopup);

    progressBarFull.style.width = '0%';
});

// Sctript to have AI generate a hint based on the images description
// This function will be called when the user clicks the hint button
// Cache for hints per round
let roundHintsCache = {};

// Returns a unique key for the current round's images
function getHintCacheKey(img1, img2) {
    return `${currentRound}:${img1}|${img2}`;
}

async function getHints(image1, image2) {
    const hintPopupMessage = document.getElementById("hint-popup-message");
    const cacheKey = getHintCacheKey(image1, image2);

    // If hints for this round are already cached, show them
    if (roundHintsCache[cacheKey]) {
        hintPopupMessage.innerText = roundHintsCache[cacheKey];
        return;
    }

    // Show loading icon
    hintPopupMessage.innerHTML = '<img src="/img/loading.svg" alt="Loading..." style="display:block;margin:auto;">';

    let combinedHints = '';
    if (image1 === image2) {
        // Only fetch one hint if descriptions are the same
        const res = await fetch(`/api/hint/${image1}`);
        const data = await res.json();
        combinedHints = data.hint;
    } else {
        // Fetch both hints if descriptions are different
        const res1 = await fetch(`/api/hint/${image1}`);
        const data1 = await res1.json();
        const hint1 = data1.hint;

        const res2 = await fetch(`/api/hint/${image2}`);
        const data2 = await res2.json();
        const hint2 = data2.hint;

        combinedHints = `${hint1}\n\n${hint2}`;
    }

    roundHintsCache[cacheKey] = combinedHints;
    hintPopupMessage.innerText = combinedHints;
}