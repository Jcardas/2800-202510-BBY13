// This script handles the leaderboard functionality, including showing the leaderboard popup and handling user login status.

// on page load, add fade-in class to body
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('fade-in');
});

// close leaderboard popup
function closeLeaderboardPopup() {
    const popup = document.getElementById('leaderboard-popup');
    popup.classList.add('hidden');
}

//Checks if user is logged in
// If not, show the leaderboard popup
document.addEventListener('DOMContentLoaded', async () => {
    if (window.isLoggedIn) {
        return;
    }
    const popup = document.getElementById('leaderboard-popup');
    popup.classList.remove('hidden');
    popup.classList.add('fade-in');


    const popupTitle = document.getElementById('leaderboard-popup-title');
    popupTitle.innerText = 'Sign up to play!';

    const popupMessage = document.getElementById('leaderboard-popup-message');
    popupMessage.innerText = 'Please sign up to save your score.';

    document.getElementById('close-button').addEventListener('click', closeLeaderboardPopup);
});