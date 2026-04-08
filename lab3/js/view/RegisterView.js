// RegisterView.js
class RegisterView {
  constructor() {
    this.form = document.getElementById('register-form');
    this.nameInput = document.getElementById('register-name');
    this.emailInput = document.getElementById('register-email');
    this.genderInput = document.getElementById('register-gender');
    this.birthDateInput = document.getElementById('register-birth-date');
    this.passwordInput = document.getElementById('register-password');
    this.passwordConfirmInput = document.getElementById('register-password-confirm');
    this.feedback = document.getElementById('register-feedback');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
  }

  bindSubmit(handler) {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler({
        fullName: this.nameInput.value.trim(),
        email: this.emailInput.value.trim(),
        gender: this.genderInput.value,
        birthDate: this.birthDateInput.value,
        password: this.passwordInput.value,
        passwordConfirm: this.passwordConfirmInput.value,
      });
    });
  }

  setLoading(isLoading) {
    this.submitButton.disabled = isLoading;
    this.submitButton.textContent = isLoading ? 'Створення...' : 'Створити профіль';
  }

  showFeedback(message, type = 'info') {
    this.feedback.textContent = message;
    this.feedback.className = `alert alert-${type} mb-3`;
  }

  clearFeedback() {
    this.feedback.textContent = '';
    this.feedback.className = 'alert d-none mb-3';
  }
}

export default RegisterView;
