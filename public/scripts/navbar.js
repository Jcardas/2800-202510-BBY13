console.log('Navbar script loaded!');

// document.addEventListener('DOMContentLoaded', () => {
//     fetch('/templates/navbar.html')
//         .then(response => response.text())
//         .then(data => {
//             document.getElementById('navbar').innerHTML = data;
//         })
//         .catch(error => console.error('Error loading navbar:', error));
// });

  // Mobile menu toggle functionality
  document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuContainer = mobileMenu.querySelector('div');
    
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.remove('hidden');
      setTimeout(() => {
        menuContainer.classList.remove('translate-x-full');
      }, 10);
    });
    
    closeMenuButton.addEventListener('click', function() {
      menuContainer.classList.add('translate-x-full');
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
      }, 300);
    });
    
    // Close menu when clicking outside
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu) {
        menuContainer.classList.add('translate-x-full');
        setTimeout(() => {
          mobileMenu.classList.add('hidden');
        }, 300);
      }
    });
  });