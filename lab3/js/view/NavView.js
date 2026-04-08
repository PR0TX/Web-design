// NavView.js
class NavView {
  constructor() {
    this.guestLinks = Array.from(document.querySelectorAll('[data-guest-link]'));
  }

  setAuthenticated(isAuthenticated) {
    this.guestLinks.forEach((link) => {
      link.classList.toggle('d-none', isAuthenticated);
    });
  }
}

export default NavView;
