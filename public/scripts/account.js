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

function removeImageFile() {
    profileImageInput.value = null;
    profileImage.src = '';
    profileImageInput.dataset.removed = "true"; // Mark as removed
}

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

        // TODO, display a success message to the user.
}

    

    document.addEventListener('DOMContentLoaded', async () => {

        if (window.isLoggedIn === false) {
            window.location.href = '/login';
        }

        profileImage = document.getElementById('profile-image');

        profileImageInput = document.getElementById('profile-image-input');

        usernameInput = document.getElementById('username-input');

        profileImageInput.addEventListener('change', changeProfileImage);

    });
