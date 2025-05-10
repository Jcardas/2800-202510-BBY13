document.addEventListener('DOMContentLoaded', () => {
    console.log("Sliding Bar script loaded.");

    const toggleIcon = document.getElementById('toggleIcon');
    const toggleIconPath = document.getElementById('toggleIconPath');
    const nav = document.getElementById('horizontalNav');

    if (toggleIcon && nav) {
        toggleIcon.addEventListener('click', () => {
            nav.classList.toggle('translate-x-0');
            nav.classList.toggle('translate-x-[calc(100%-60px)]');

            const isCollapsed = nav.classList.contains('translate-x-[calc(100%-60px)]');
            if (toggleIconPath) {
                toggleIconPath.setAttribute("d", isCollapsed
                    ? "M11 17l-5-5m0 0l5-5m-5 5h12"
                    : "M13 7l5 5m0 0l-5 5m5-5H6"
                );
            }
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }
});