// LoginView.js
class LoginView {
  constructor() {
    this.form = document.getElementById('login-form');
    this.emailInput = document.getElementById('login-email');
    this.passwordInput = document.getElementById('login-password');
    this.rememberInput = document.getElementById('remember');
    this.feedback = document.getElementById('login-feedback');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
  }

  bindSubmit(handler) {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler({
        email: this.emailInput.value.trim(),
        password: this.passwordInput.value,
        rememberMe: this.rememberInput.checked,
      });
    });
  }

  setLoading(isLoading) {
    this.submitButton.disabled = isLoading;
    this.submitButton.textContent = isLoading ? 'Виконується...' : 'Увійти';
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

export default LoginView;
