// WIP

console.log('Sliding Bar script loaded!');

document.addEventListener('DOMContentLoaded', () => {
    fetch('/templates/sliding_bar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sliding_bar').innerHTML = data;
        })
        .catch(error => console.error('Error loading Sliding Bar:', error));
});