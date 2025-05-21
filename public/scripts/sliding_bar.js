// This script handles the sliding bar functionality, including font size adjustment and mobile navigation toggle.

document.addEventListener('DOMContentLoaded', () => {

    // Apply saved font size on load
    const savedSize = sessionStorage.getItem("fontSize");
    if (savedSize) {
        document.documentElement.style.fontSize = `${savedSize}px`;
        console.log(`Loaded saved font size: ${savedSize}px`);
    }

    console.log("Sliding Bar script loaded.");
    const increaseFontIcon = document.getElementById("increaseFontIcon");

    const toggleIcon = document.getElementById('toggleIcon');
    const nav = document.getElementById('horizontalNav');

    // Check if the elements exist before adding event listeners
    if (toggleIcon && nav) {
        toggleIcon.addEventListener('click', () => {
            nav.classList.toggle('translate-x-0');
            nav.classList.toggle('translate-x-[calc(100%-60px)]');
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }

    // Check if the increaseFontIcon exists before adding the event listener
    if (increaseFontIcon) {
        increaseFontIcon.addEventListener("click", () => {
            const root = document.documentElement;
            const currentSize = parseFloat(getComputedStyle(root).fontSize);
            const newSize = Math.min(currentSize * 1.1, 24); // cap at 24px
            root.style.fontSize = `${newSize}px`;
            sessionStorage.setItem("fontSize", newSize); // Save to session

            console.log(`Font size increased to ${newSize}px`);
        });
    }

    const resetFontIcon = document.getElementById("resetFontIcon");

    // Check if the resetFontIcon exists before adding the event listener
    if (resetFontIcon) {
        resetFontIcon.addEventListener("click", () => {
            document.documentElement.style.fontSize = "16px";
            sessionStorage.removeItem("fontSize");
            console.log("Font size reset to default (16px)");
        });
    }

});
