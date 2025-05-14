
function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.add('hidden');
}


document.addEventListener('DOMContentLoaded', async () => {
    if(window.isLoggedIn) 
        {
            return;
        }
        const popup = document.getElementById('popup');
        popup.classList.remove('hidden');

    const popupTitle = document.getElementById('popup-title');
    popupTitle.innerText = 'Sign up to play!';

    const popupMessage = document.getElementById('popup-message');
    popupMessage.innerText = 'Please sign up to save your score.';

    document.getElementById('next-button').addEventListener('click', closePopup);
});