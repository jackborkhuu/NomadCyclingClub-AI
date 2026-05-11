const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle?.addEventListener('click', () => {
  siteNav?.classList.toggle('open');
});

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('This contact form is a placeholder. Please email info@rivercitycycling.org to reach us.');
  });
}
