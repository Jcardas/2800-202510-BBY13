
function closePopup() {
    const popup = document.getElementById('leaderboard-popup');
    popup.classList.add('hidden');
}


document.addEventListener('DOMContentLoaded', async () => {
    if(window.isLoggedIn) 
        {
            return;
        }
        const popup = document.getElementById('leaderboard-popup');
        popup.classList.remove('hidden');

    const popupTitle = document.getElementById('leaderboard-popup-title');
    popupTitle.innerText = 'Sign up to play!';

    const popupMessage = document.getElementById('leaderboard-popup-message');
    popupMessage.innerText = 'Please sign up to save your score.';

    document.getElementById('close-button').addEventListener('click', closePopup);
});