// This script handles the account page functionality, including changing the profile image and updating the username.

// set up the profile image and username input elements
let profileImage = null;
let profileImageInput = null;
let usernameInput = null;

// Change the profile image when a user selects a new one
function changeProfileImage() {
    const file = profileImageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            profileImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Remove the profile image when the user clicks the remove button
function removeImageFile() {
    profileImageInput.value = null;
    profileImage.src = '/icons/account_circle_black.svg';
    profileImageInput.dataset.removed = "true"; // Mark as removed
}

// Send changes to the server when the user clicks the save button
function postAccountChanges() {
    const formData = new FormData();

    // If the image was removed, send a flag to the server
    if (profileImageInput.dataset.removed === "true") {
        formData.append('removeProfileImage', 'true');
    } else if (profileImageInput.files[0]) {
        formData.append('profileImage', profileImageInput.files[0]);
    }

    formData.append('username', usernameInput.value);

    fetch('/account/update', {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Error saving account changes');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// add event listeners to the buttons
document.addEventListener('DOMContentLoaded', async () => {

    if (window.isLoggedIn === false) {
        window.location.href = '/login';
    }

    profileImage = document.getElementById('profile-image');

    profileImageInput = document.getElementById('profile-image-input');

    usernameInput = document.getElementById('username-input');

    profileImageInput.addEventListener('change', changeProfileImage);

});
